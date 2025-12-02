import { procedure, protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "../middleware/audit";
import { stripe, PLAN_TO_PRICE_ID, PRICE_ID_TO_PLAN } from "../stripe";
import {
  getStripePeriodDates,
  mapStripeStatusToDbStatus,
} from "../utils/stripe-dates";

const createSubscriptionSchema = z.object({
  organizationId: z.string(),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).default("FREE"),
});

const updateSubscriptionSchema = z.object({
  organizationId: z.string(),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
});

const getSubscriptionSchema = z.object({
  organizationId: z.string(),
});

const cancelSubscriptionSchema = z.object({
  organizationId: z.string(),
});

const PLAN_DETAILS = {
  FREE: {
    price: 0,
    features: ["up-to-5-projects", "basic-analytics"],
    projectLimit: 5,
  },
  PRO: {
    price: 29,
    features: ["unlimited-projects", "advanced-analytics", "api-access"],
    projectLimit: 1000,
  },
  ENTERPRISE: {
    price: 999,
    features: [
      "unlimited-projects",
      "advanced-analytics",
      "api-access",
      "sso",
      "dedicated-support",
    ],
    projectLimit: 10000,
  },
};

export const subscriptionsRouter = router({
  createSubscription: protectedProcedure
    .input(createSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId, plan } = input;

      // Verify user has permission to create subscription
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage subscriptions",
        });
      }

      // Check if subscription already exists
      const existing = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization already has a subscription",
        });
      }

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          organizationId,
          plan: plan as "FREE" | "PRO" | "ENTERPRISE",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });

      // Log subscription creation
      await createAuditLog({
        organizationId,
        userId: ctx.user.id,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "SUBSCRIPTION",
        resourceId: subscription.id,
        changes: { plan, status: "ACTIVE" },
      });

      return subscription;
    }),

  getSubscription: protectedProcedure
    .input(getSubscriptionSchema)
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId } = input;

      // Verify user is member
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      let subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      // If no subscription, create FREE tier automatically
      if (!subscription) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        subscription = await prisma.subscription.create({
          data: {
            organizationId,
            plan: "FREE",
            status: "ACTIVE",
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
          },
        });
      }

      return {
        ...subscription,
        details: PLAN_DETAILS[subscription.plan as keyof typeof PLAN_DETAILS],
      };
    }),

  updateSubscription: protectedProcedure
    .input(updateSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId, plan } = input;

      // Verify permissions
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can update subscriptions",
        });
      }

      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      // If switching to FREE plan, cancel Stripe subscription if exists
      if (plan === "FREE" && (subscription as any).stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(
            (subscription as any).stripeSubscriptionId
          );
        } catch (error) {
          console.error("Error canceling Stripe subscription:", error);
        }
      }

      const oldPlan = subscription.plan;

      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: plan as "FREE" | "PRO" | "ENTERPRISE",
          ...(plan === "FREE" && (subscription as any).stripeSubscriptionId
            ? {
                stripeSubscriptionId: null,
                stripePriceId: null,
              }
            : {}),
        } as any,
      });

      // Log plan change
      await createAuditLog({
        organizationId,
        userId: ctx.user.id,
        action: "SUBSCRIPTION_UPDATED",
        resourceType: "SUBSCRIPTION",
        resourceId: subscription.id,
        changes: { oldPlan, newPlan: plan },
      });

      return updated;
    }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        plan: z.enum(["PRO", "ENTERPRISE"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId, plan } = input;

      // Verify permissions
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can manage subscriptions",
        });
      }

      // Get or create Stripe customer
      let customerId: string;
      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (subscription && (subscription as any).stripeCustomerId) {
        customerId = (subscription as any).stripeCustomerId;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: ctx.user.id },
        });

        const customer = await stripe.customers.create({
          email: user?.email,
          metadata: {
            organizationId,
            userId: ctx.user.id,
          },
        });

        customerId = customer.id;

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

      // Get price ID
      const priceId = PLAN_TO_PRICE_ID[plan];
      if (!priceId || priceId.trim() === "" || !priceId.startsWith("price_")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Stripe Price ID not configured for plan: ${plan}. Please set STRIPE_PRICE_ID_${plan} in your environment variables. Create a recurring subscription product in Stripe Dashboard and copy the Price ID (must start with "price_").`,
        });
      }

      // Create checkout session
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

      try {
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
            userId: ctx.user.id,
          },
        });

        return { url: session.url };
      } catch (error: any) {
        // Handle Stripe API errors
        if (error.message?.includes("recurring price")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid Price ID for ${plan} plan. The Price ID must be for a recurring subscription (monthly/yearly), not a one-time payment. Please check your STRIPE_PRICE_ID_${plan} in the Stripe Dashboard.`,
          });
        }
        throw error;
      }
    }),

  cancelSubscription: protectedProcedure
    .input(cancelSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId } = input;

      // Verify permissions
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can cancel subscriptions",
        });
      }

      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      // Cancel Stripe subscription if exists
      if ((subscription as any).stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(
            (subscription as any).stripeSubscriptionId
          );
        } catch (error) {
          console.error("Error canceling Stripe subscription:", error);
          // Continue with database update even if Stripe cancel fails
        }
      }

      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
        },
      });

      // Log cancellation
      await createAuditLog({
        organizationId,
        userId: ctx.user.id,
        action: "SUBSCRIPTION_CANCELED",
        resourceType: "SUBSCRIPTION",
        resourceId: subscription.id,
        changes: { status: "CANCELED" },
      });

      return updated;
    }),

  syncSubscriptionFromStripe: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const { organizationId } = input;

      // Verify permissions
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
      });

      if (!subscription) {
        return { synced: false, message: "No subscription found" };
      }

      // If no Stripe subscription ID, try to find it from recent checkout sessions
      if (!(subscription as any).stripeSubscriptionId) {
        try {
          // Get Stripe customer ID if available
          const customerId = (subscription as any).stripeCustomerId;
          if (customerId) {
            // List recent subscriptions for this customer
            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              limit: 1,
              status: "all",
            });

            if (subscriptions.data.length > 0) {
              const latestSubscription = subscriptions.data[0];
              // Update subscription with Stripe subscription ID
              await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                  stripeSubscriptionId: latestSubscription.id,
                  stripePriceId: latestSubscription.items.data[0]?.price.id,
                } as any,
              });
              // Refresh subscription object with updated data
              const updated = await prisma.subscription.findUnique({
                where: { id: subscription.id },
              });
              if (updated) {
                (subscription as any).stripeSubscriptionId =
                  latestSubscription.id;
              }
              // Continue with sync using the found subscription
            } else {
              return {
                synced: false,
                message: "No Stripe subscription found for this customer",
              };
            }
          } else {
            return {
              synced: false,
              message:
                "No Stripe customer ID found. Please complete checkout first.",
            };
          }
        } catch (error: any) {
          console.error("Error finding Stripe subscription:", error);
          return {
            synced: false,
            message: "Could not find Stripe subscription. Please try again.",
          };
        }
      }

      try {
        // Retrieve subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          (subscription as any).stripeSubscriptionId
        );

        const priceId = stripeSubscription.items.data[0]?.price.id;
        const plan = PRICE_ID_TO_PLAN[priceId || ""];

        if (!plan) {
          console.error("Unknown price ID:", priceId);
          return {
            synced: false,
            message: "Unknown price ID in Stripe subscription",
          };
        }

        // Get period dates from Stripe subscription
        const { periodStart, periodEnd } =
          getStripePeriodDates(stripeSubscription);
        const status = mapStripeStatusToDbStatus(stripeSubscription.status);

        // Update subscription in database - ALWAYS update plan when syncing
        const updated = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            plan,
            status,
            stripePriceId: priceId,
            stripeCustomerId: stripeSubscription.customer as string,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            canceledAt: status === "CANCELED" ? new Date() : null,
          } as any,
        });

        console.log(
          `Subscription synced: ${organizationId} -> ${plan} (${status})`
        );

        return {
          synced: true,
          plan,
          status: stripeSubscription.status,
          dbStatus: status,
        };
      } catch (error: any) {
        console.error("Error syncing subscription from Stripe:", error);

        // If subscription doesn't exist in Stripe, mark as expired
        if (error.code === "resource_missing") {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "EXPIRED",
            } as any,
          });
          return {
            synced: false,
            message: "Stripe subscription not found - marked as expired",
          };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to sync subscription: ${error.message}`,
        });
      }
    }),

  hasAccess: procedure
    .input(z.object({ organizationId: z.string(), feature: z.string() }))
    .query(async ({ input }) => {
      const subscription = await prisma.subscription.findFirst({
        where: { organizationId: input.organizationId },
      });

      if (!subscription || subscription.status !== "ACTIVE") {
        return false;
      }

      const planDetails =
        PLAN_DETAILS[subscription.plan as keyof typeof PLAN_DETAILS];
      return planDetails.features.includes(input.feature);
    }),
});
