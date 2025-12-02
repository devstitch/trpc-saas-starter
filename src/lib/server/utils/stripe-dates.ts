/**
 * Utility functions for handling Stripe subscription dates
 */

/**
 * Get period dates from Stripe subscription with fallback
 * @param subscription - Stripe subscription object
 * @returns Object with periodStart and periodEnd dates
 */
export function getStripePeriodDates(subscription: {
  current_period_start?: number;
  current_period_end?: number;
  status?: string;
}): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const periodEndUnix = (subscription as any).current_period_end;
  const periodStartUnix = (subscription as any).current_period_start;

  // Handle missing or invalid period dates
  if (!periodEndUnix || !periodStartUnix) {
    console.warn("Missing period dates in Stripe subscription, using fallback dates:", {
      status: subscription.status,
    });
    // Use fallback dates: current date + 1 month
    const periodStart = now;
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return { periodStart, periodEnd };
  }

  const periodEnd = new Date(periodEndUnix * 1000);
  const periodStart = new Date(periodStartUnix * 1000);

  // Validate dates
  if (isNaN(periodEnd.getTime()) || isNaN(periodStart.getTime())) {
    console.warn("Invalid period dates, using fallback dates");
    // Use fallback dates if invalid
    const periodStartFallback = now;
    const periodEndFallback = new Date(now);
    periodEndFallback.setMonth(periodEndFallback.getMonth() + 1);
    return { periodStart: periodStartFallback, periodEnd: periodEndFallback };
  }

  return { periodStart, periodEnd };
}

/**
 * Map Stripe subscription status to our subscription status
 */
export function mapStripeStatusToDbStatus(
  stripeStatus: string
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" {
  if (stripeStatus === "active") {
    return "ACTIVE";
  } else if (stripeStatus === "past_due" || stripeStatus === "unpaid") {
    return "PAST_DUE";
  } else if (stripeStatus === "canceled") {
    return "CANCELED";
  } else if (stripeStatus === "incomplete_expired") {
    return "EXPIRED";
  }
  return "ACTIVE"; // Default to active
}

