"use client"

import { useEffect, useState, useCallback } from "react"
import { useOrganization } from "./use-organization"
import { getSubscription, type Subscription } from "@/lib/queries/subscriptions.queries"

// Using Subscription type from queries

export function useSubscription() {
  const { currentOrg } = useOrganization()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!currentOrg) {
      setLoading(false)
      return
    }

    try {
      const data = await getSubscription(currentOrg.id)
      setSubscription(data)
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  useEffect(() => {
    // Listen for subscription updates from other components
    const handleSubscriptionUpdate = () => {
      fetchSubscription()
    }

    window.addEventListener("subscription-updated", handleSubscriptionUpdate)
    return () => {
      window.removeEventListener("subscription-updated", handleSubscriptionUpdate)
    }
  }, [fetchSubscription])

  const hasApiAccess = subscription?.plan === "PRO" || subscription?.plan === "ENTERPRISE"

  return {
    subscription,
    loading,
    hasApiAccess,
    refetch: fetchSubscription,
  }
}

