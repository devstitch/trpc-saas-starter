"use client"

import { useEffect, useState } from "react"

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
}

export function useOrganization() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    // Set current org from localStorage or first org
    if (organizations.length > 0 && !currentOrg) {
      const savedOrgId = localStorage.getItem("currentOrganizationId")
      const org = savedOrgId
        ? organizations.find((o) => o.id === savedOrgId)
        : organizations[0]
      if (org) {
        setCurrentOrg(org)
        localStorage.setItem("currentOrganizationId", org.id)
      }
    }
  }, [organizations, currentOrg])

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/trpc/organizations.listUserOrganizations", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const orgs = data.result?.data || []
        setOrganizations(orgs)

        // If no current org, set first one
        if (orgs.length > 0) {
          const savedOrgId = localStorage.getItem("currentOrganizationId")
          const org = savedOrgId ? orgs.find((o: Organization) => o.id === savedOrgId) : orgs[0]
          if (org) {
            setCurrentOrg(org)
            localStorage.setItem("currentOrganizationId", org.id)
          }
        }
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId)
    if (org) {
      setCurrentOrg(org)
      localStorage.setItem("currentOrganizationId", org.id)
    }
  }

  return {
    organizations,
    currentOrg,
    loading,
    switchOrganization,
    refetch: fetchOrganizations,
  }
}

