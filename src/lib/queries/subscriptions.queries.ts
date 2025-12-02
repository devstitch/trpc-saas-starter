"use client";

import { trpcQuery, trpcMutation } from "@/lib/trpc-client";

export interface Subscription {
  id: string;
  organizationId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  details: {
    price: number;
    features: string[];
    projectLimit: number;
  };
}

export interface UpdateSubscriptionInput {
  organizationId: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
}

/**
 * Get organization subscription
 */
export async function getSubscription(
  organizationId: string
): Promise<Subscription> {
  return trpcQuery("subscriptions.getSubscription", { organizationId });
}

/**
 * Update subscription plan
 */
export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<Subscription> {
  return trpcMutation("subscriptions.updateSubscription", input);
}

/**
 * Create Stripe checkout session for paid plans
 */
export async function createCheckoutSession(
  organizationId: string,
  plan: "PRO" | "ENTERPRISE"
): Promise<{ url: string | null }> {
  return trpcMutation("subscriptions.createCheckoutSession", {
    organizationId,
    plan,
  });
}

/**
 * Sync subscription from Stripe (useful after checkout when webhook hasn't fired)
 */
export async function syncSubscriptionFromStripe(
  organizationId: string
): Promise<{ 
  synced: boolean; 
  plan?: string; 
  status?: string; 
  dbStatus?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  message?: string 
}> {
  return trpcMutation("subscriptions.syncSubscriptionFromStripe", {
    organizationId,
  });
}