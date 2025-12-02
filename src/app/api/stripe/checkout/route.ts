import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_TO_PRICE_ID } from "@/lib/server/stripe";
import { prisma } from "@/lib/server/db";
import { verifyJWT } from "@/lib/server/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { organizationId, plan } = await req.json();

    if (!organizationId || !plan) {
      return NextResponse.json(
        { error: "organizationId and plan are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: decoded.userId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can manage subscriptions" },
        { status: 403 }
      );
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (subscription && (subscription as any).stripeCustomerId) {
      customerId = (subscription as any).stripeCustomerId;
    } else {
      // Get user email for Stripe customer
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: {
          organizationId,
          userId: decoded.userId,
        },
      });

      customerId = customer.id;

      // Update or create subscription record
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { stripeCustomerId: customerId } as any,
        });
      } else {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.create({
          data: {
            organizationId,
            plan: "FREE",
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
            stripeCustomerId: customerId,
          } as any,
        });
      }
    }

    // Get price ID for the plan
    const priceId = PLAN_TO_PRICE_ID[plan];
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Invalid plan: ${plan}. Only PRO and ENTERPRISE plans require payment.`,
        },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard/billing?success=true`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
      metadata: {
        organizationId,
        plan,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
