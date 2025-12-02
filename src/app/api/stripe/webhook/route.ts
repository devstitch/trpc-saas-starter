import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_ID_TO_PLAN } from "@/lib/server/stripe";
import { prisma } from "@/lib/server/db";
import { createAuditLog } from "@/lib/server/middleware/audit";
import Stripe from "stripe";
import {
  getStripePeriodDates,
  mapStripeStatusToDbStatus,
} from "@/lib/server/utils/stripe-dates";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const plan = session.metadata?.plan as "PRO" | "ENTERPRISE";
  const userId = session.metadata?.userId;

  if (!organizationId || !plan) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Get subscription from Stripe
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const planFromPrice = PRICE_ID_TO_PLAN[priceId || ""] || plan;

  // Update or create subscription in database
  const existing = await prisma.subscription.findFirst({
    where: { organizationId },
  });

  const { periodStart, periodEnd } = getStripePeriodDates(subscription);

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan: planFromPrice,
        status: "ACTIVE",
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
      } as any,
    });

    if (userId) {
      await createAuditLog({
        organizationId,
        userId,
        action: "SUBSCRIPTION_UPDATED",
        resourceType: "SUBSCRIPTION",
        resourceId: existing.id,
        changes: { plan: planFromPrice, source: "stripe_checkout" },
      });
    }
  } else {
    const newSubscription = await prisma.subscription.create({
      data: {
        organizationId,
        plan: planFromPrice,
        status: "ACTIVE",
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      } as any,
    });

    if (userId) {
      await createAuditLog({
        organizationId,
        userId,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "SUBSCRIPTION",
        resourceId: newSubscription.id,
        changes: { plan: planFromPrice, source: "stripe_checkout" },
      });
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = PRICE_ID_TO_PLAN[priceId || ""];

  if (!plan) {
    console.error("Unknown price ID:", priceId);
    return;
  }

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId } as any,
  });

  if (!dbSubscription) {
    console.error("Subscription not found in database:", subscriptionId);
    return;
  }

  const { periodStart, periodEnd } = getStripePeriodDates(subscription);

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      plan,
      status: mapStripeStatusToDbStatus(subscription.status),
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    } as any,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId } as any,
  });

  if (!dbSubscription) {
    console.error("Subscription not found in database:", subscriptionId);
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId =
    ((invoice as any).subscription as any)?.id ||
    ((invoice as any).subscription as string);
  if (!subscriptionId) return;

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId } as any,
  });

  if (!dbSubscription) return;

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "ACTIVE",
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    (invoice as any).subscription?.id || (invoice as any).subscription;
  if (!subscriptionId) return;

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId } as any,
  });

  if (!dbSubscription) return;

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "PAST_DUE",
    },
  });
}
