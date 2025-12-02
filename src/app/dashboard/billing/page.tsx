"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import {
  getSubscription,
  updateSubscription,
  createCheckoutSession,
  syncSubscriptionFromStripe,
  type Subscription,
} from "@/lib/queries/subscriptions.queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Sparkles, Loader2, Crown, Zap, Building2, BadgeCheck, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function BillingContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrg, loading: orgLoading } = useOrganization();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchSubscription = useCallback(async () => {
    if (!currentOrg) return;

    try {
      const data = await getSubscription(currentOrg.id);
      setSubscription(data);
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (currentOrg) {
      fetchSubscription();
    }
  }, [currentOrg, fetchSubscription]);

  // Memoize search params to prevent unnecessary re-renders
  const success = useMemo(() => searchParams.get("success"), [searchParams]);
  const canceled = useMemo(() => searchParams.get("canceled"), [searchParams]);

  useEffect(() => {
    // Handle Stripe redirect messages

    const handleSuccess = async () => {
      // Show immediate success toast
      toast({
        title: "Payment Successful! 🎉",
        description:
          "Your payment has been processed successfully. Updating your subscription...",
      });

      // Sync subscription from Stripe in case webhook hasn't fired yet
      if (currentOrg) {
        try {
          const syncResult = await syncSubscriptionFromStripe(currentOrg.id);

          // Refresh subscription data
          await fetchSubscription();
          window.dispatchEvent(new CustomEvent("subscription-updated"));

          // Check if payment was actually successful and show updated toast
          if (syncResult.synced && syncResult.dbStatus) {
            if (syncResult.dbStatus === "ACTIVE") {
              toast({
                title: "Subscription Activated! ✅",
                description: `Your subscription has been upgraded to ${
                  syncResult.plan || "premium"
                } plan. You now have access to all premium features.`,
              });
            } else if (syncResult.dbStatus === "PAST_DUE") {
              toast({
                title: "Payment Issue",
                description:
                  "Your payment could not be processed. Please update your payment method in Stripe.",
                variant: "destructive",
              });
            } else if (
              syncResult.dbStatus === "EXPIRED" ||
              syncResult.dbStatus === "CANCELED"
            ) {
              toast({
                title: "Subscription Expired",
                description:
                  "Your subscription has expired or was canceled. Please upgrade again.",
                variant: "destructive",
              });
            }
          } else {
            // If sync didn't work but we're here, webhook might have updated it
            toast({
              title: "Subscription Updated",
              description:
                "Your subscription is being processed. If you don't see the update, please refresh the page.",
            });
          }
        } catch (error: any) {
          // If sync fails, still refresh - webhook might have updated it
          console.log("Sync failed, refreshing anyway:", error);

          // Refresh subscription data to see current state
          await fetchSubscription();
          window.dispatchEvent(new CustomEvent("subscription-updated"));

          const errorMessage = error.message || "Unknown error";
          if (
            errorMessage.includes("not found") ||
            errorMessage.includes("expired") ||
            errorMessage.includes("No Stripe")
          ) {
            toast({
              title: "Payment Received",
              description:
                "Your payment was successful. Your subscription will be updated shortly. Please refresh if needed.",
            });
          } else {
            toast({
              title: "Payment Successful",
              description:
                "Your payment has been processed. Your subscription is being updated. Please refresh if you don't see the change.",
            });
          }
        }
      } else {
        // No organization, but payment was successful
        toast({
          title: "Payment Successful! 🎉",
          description:
            "Your payment has been processed successfully. Please select an organization to view your subscription.",
        });
      }
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/billing");
    };

    if (success === "true") {
      handleSuccess();
    }

    if (canceled === "true") {
      toast({
        title: "Payment Canceled",
        description:
          "Your subscription was not changed. You can try again anytime.",
      });
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [success, canceled, currentOrg, fetchSubscription]);

  const handlePlanChange = async (plan: "FREE" | "PRO" | "ENTERPRISE") => {
    if (!currentOrg || changingPlan) return;

    setChangingPlan(plan);

    try {
      // For FREE plan, update directly
      if (plan === "FREE") {
        await updateSubscription({
          organizationId: currentOrg.id,
          plan,
        });
        await fetchSubscription();
        window.dispatchEvent(new CustomEvent("subscription-updated"));
        toast({
          title: "Plan Updated Successfully",
          description: "Your subscription has been changed to FREE plan.",
        });
        setChangingPlan(null);
        return;
      }

      // For paid plans (PRO/ENTERPRISE), redirect to Stripe checkout
      const { url } = await createCheckoutSession(currentOrg.id, plan);
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        setChangingPlan(null);
      }
    } catch (error: any) {
      setChangingPlan(null);
      console.error("Error changing plan:", error);

      // Extract and handle error message
      const errorMessage =
        error?.message ||
        error?.error?.message ||
        (typeof error === "string"
          ? error
          : "Failed to change plan. Please try again.");

      // Map error types to user-friendly messages
      const errorMappings: Array<{
        keywords: string[];
        title: string;
        description: string;
      }> = [
        {
          keywords: [
            "Price ID not configured",
            "STRIPE_PRICE_ID",
            "Invalid Price ID",
            "recurring subscription",
          ],
          title: "Payment Setup Required",
          description: `Stripe Price ID for ${plan} plan is not configured correctly. Please ensure STRIPE_PRICE_ID_${plan} is set to a valid recurring subscription Price ID in your environment variables.`,
        },
        {
          keywords: ["recurring price", "subscription mode"],
          title: "Invalid Payment Configuration",
          description: `The Price ID for ${plan} plan must be for a recurring subscription (monthly/yearly), not a one-time payment. Please check your Stripe Dashboard.`,
        },
        {
          keywords: ["Unauthorized", "Not authenticated"],
          title: "Authentication Required",
          description: "Please log in again to continue.",
        },
        {
          keywords: ["FORBIDDEN", "permission"],
          title: "Permission Denied",
          description: "You don't have permission to perform this action.",
        },
      ];

      const matchedError = errorMappings.find((mapping) =>
        mapping.keywords.some((keyword) => errorMessage.includes(keyword))
      );

      const toastTitle = matchedError?.title || "Error";
      const toastDescription = matchedError?.description || errorMessage;

      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });
    }
  };

  if (authLoading || orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 space-y-8 w-full">
            {/* Header Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Billing
                  </h1>
                  <p className="text-muted-foreground text-lg ml-[52px]">
                    Manage your subscription and billing
                  </p>
                </div>
              </div>
            </div>

            {!currentOrg ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Please create or select an organization first
                  </p>
                </CardContent>
              </Card>
            ) : subscription ? (
              <div className="space-y-8">
                {/* Current Plan Card - Enhanced */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <BadgeCheck className="h-6 w-6 text-primary" />
                          Current Plan
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          Your active subscription details
                    </CardDescription>
                      </div>
                      <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <span className="text-sm font-semibold text-primary">
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-3">
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {subscription.plan}
                      </p>
                      <div className="flex flex-col">
                        <p className="text-2xl font-semibold text-foreground">
                          ${subscription.details.price}
                        </p>
                        <p className="text-sm text-muted-foreground">/month</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                        <p className="font-semibold mb-4 text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Features
                        </p>
                        <ul className="space-y-3">
                        {subscription.details.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-3">
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm font-medium capitalize">
                              {feature.replace(/-/g, " ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Project Limit</p>
                          <p className="text-xl font-bold">{subscription.details.projectLimit.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Renews On</p>
                          <p className="text-lg font-semibold">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                      </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Plans */}
                <div>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Available Plans
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* FREE Plan */}
                    <Card className={`h-full flex flex-col border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      subscription.plan === "FREE" 
                        ? "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent shadow-md" 
                        : "border-border hover:border-primary/20"
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          {subscription.plan === "FREE" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl">FREE Plan</CardTitle>
                        <CardDescription className="text-base mt-1">
                          <span className="text-2xl font-bold text-foreground">$0</span>
                          <span className="text-muted-foreground">/month</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-3 mb-6 text-sm flex-1">
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">Up to 5 projects</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">Basic analytics</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => handlePlanChange("FREE")}
                        disabled={
                          subscription.plan === "FREE" || changingPlan !== null
                        }
                        variant={
                          subscription.plan === "FREE" ? "default" : "outline"
                        }
                        className={`w-full mt-auto ${
                          subscription.plan === "FREE" || changingPlan !== null
                            ? "cursor-not-allowed"
                              : "cursor-pointer group"
                        }`}
                      >
                        {changingPlan === "FREE" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : subscription.plan === "FREE" ? (
                            <>
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              Current Plan
                            </>
                        ) : (
                            <>
                              Switch to FREE
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                    {/* PRO Plan */}
                    <Card className={`h-full flex flex-col border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      subscription.plan === "PRO" 
                        ? "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent shadow-md" 
                        : "border-border hover:border-primary/20"
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          {subscription.plan === "PRO" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl">PRO Plan</CardTitle>
                        <CardDescription className="text-base mt-1">
                          <span className="text-2xl font-bold text-foreground">$29</span>
                          <span className="text-muted-foreground">/month</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-3 mb-6 text-sm flex-1">
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">Up to 1,000 projects</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">Advanced analytics</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">API access</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => handlePlanChange("PRO")}
                        disabled={
                          subscription.plan === "PRO" || changingPlan !== null
                        }
                        variant={
                          subscription.plan === "PRO" ? "default" : "outline"
                        }
                        className={`w-full mt-auto ${
                          subscription.plan === "PRO" || changingPlan !== null
                            ? "cursor-not-allowed"
                              : "cursor-pointer group"
                        }`}
                      >
                        {changingPlan === "PRO" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : subscription.plan === "PRO" ? (
                            <>
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              Current Plan
                            </>
                        ) : subscription.plan === "FREE" ? (
                            <>
                              Upgrade to PRO
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        ) : (
                            <>
                              Switch to PRO
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                    {/* ENTERPRISE Plan */}
                    <Card className={`h-full flex flex-col border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      subscription.plan === "ENTERPRISE" 
                        ? "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent shadow-md" 
                        : "border-border hover:border-primary/20"
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          {subscription.plan === "ENTERPRISE" && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl">ENTERPRISE Plan</CardTitle>
                        <CardDescription className="text-base mt-1">
                          <span className="text-2xl font-bold text-foreground">$999</span>
                          <span className="text-muted-foreground">/month</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-3 mb-6 text-sm flex-1">
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-medium">Up to 10,000 projects</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-medium">Advanced analytics</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-medium">API access</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-medium">SSO</span>
                        </li>
                          <li className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-medium">Dedicated support</span>
                        </li>
                      </ul>
                      <Button
                        onClick={() => handlePlanChange("ENTERPRISE")}
                        disabled={
                          subscription.plan === "ENTERPRISE" ||
                          changingPlan !== null
                        }
                        variant={
                          subscription.plan === "ENTERPRISE"
                            ? "default"
                            : "outline"
                        }
                        className={`w-full mt-auto ${
                          subscription.plan === "ENTERPRISE" ||
                          changingPlan !== null
                            ? "cursor-not-allowed"
                              : "cursor-pointer group"
                        }`}
                      >
                        {changingPlan === "ENTERPRISE" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : subscription.plan === "ENTERPRISE" ? (
                            <>
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              Current Plan
                            </>
                        ) : (
                            <>
                              Upgrade to ENTERPRISE
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Loading subscription...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
