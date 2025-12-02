import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Lazy initialization - only creates Stripe instance when actually used
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = instance[prop as keyof Stripe];
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as Stripe;

// Stripe Price IDs for each plan
// These should be created in Stripe Dashboard and set as environment variables
export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRICE_ID_PRO || "",
  ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE || "",
};

// Plan to Stripe Price ID mapping
export const PLAN_TO_PRICE_ID: Record<string, string> = {
  PRO: STRIPE_PRICE_IDS.PRO,
  ENTERPRISE: STRIPE_PRICE_IDS.ENTERPRISE,
};

// Stripe Price ID to Plan mapping
export const PRICE_ID_TO_PLAN: Record<string, "PRO" | "ENTERPRISE"> = {
  [STRIPE_PRICE_IDS.PRO]: "PRO",
  [STRIPE_PRICE_IDS.ENTERPRISE]: "ENTERPRISE",
};
