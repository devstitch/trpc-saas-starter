"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { createOrganization } from "@/lib/queries/organizations.queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Plus } from "lucide-react"

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
}

export default function OrganizationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { organizations, currentOrg, switchOrganization, refetch } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", description: "" })

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createOrganization({
        name: newOrg.name,
        slug: newOrg.slug.toLowerCase().replace(/\s+/g, "-"),
        description: newOrg.description,
      })

      setNewOrg({ name: "", slug: "", description: "" })
      setIsOpen(false)
      await refetch()
    } catch (error: any) {
      alert(error.message || "Failed to create organization")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground text-lg mt-1">Manage your organizations and workspaces</p>
                  </div>
                </div>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>Create a new organization to get started</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={newOrg.name}
                        onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                        placeholder="My Organization"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={newOrg.slug}
                        onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                        placeholder="my-organization"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        URL-friendly identifier (lowercase, hyphens only)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        value={newOrg.description}
                        onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                        placeholder="Organization description"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create Organization
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {organizations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You don't have any organizations yet</p>
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button>Create your first organization</Button>
                    </DialogTrigger>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className={currentOrg?.id === org.id ? "border-primary" : ""}
                  >
                    <CardHeader>
                      <CardTitle>{org.name}</CardTitle>
                      <CardDescription>{org.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {org.description && <p className="text-sm text-muted-foreground mb-4">{org.description}</p>}
                      {currentOrg?.id === org.id ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Organization
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => switchOrganization(org.id)}
                        >
                          Switch to this Organization
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

