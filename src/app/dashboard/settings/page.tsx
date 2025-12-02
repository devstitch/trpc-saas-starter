"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { trpcFetch } from "@/lib/trpc-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings as SettingsIcon, User, Building2, Trash2, Mail, Save, AlertTriangle, Shield, Sparkles } from "lucide-react"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentOrg, organizations, switchOrganization, refetch: refetchOrgs } = useOrganization()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setLoading(false)
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Note: You'll need to create an auth.updateProfile endpoint
      // For now, this is a placeholder
      // await trpcFetch("auth.updateProfile", {
      //   method: "POST",
      //   input: { name, email },
      // })
    } catch (error) {
      // Silently handle error
    } finally {
      setSaving(false)
    }
  }

  const handleOrgChange = (orgId: string) => {
    switchOrganization(orgId)
  }

  if (authLoading || loading) {
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
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 space-y-8 w-full">
            {/* Header Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                  <SettingsIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Settings
                  </h1>
                  <p className="text-muted-foreground text-lg ml-[52px]">
                    Manage your account and preferences
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 max-w-3xl">
              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Profile</CardTitle>
                      <CardDescription className="mt-1">Update your personal information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        disabled
                        className="h-11 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Email cannot be changed
                      </p>
                    </div>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Organization</CardTitle>
                      <CardDescription className="mt-1">Switch between your organizations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="organization" className="text-sm font-semibold">Current Organization</Label>
                      <Select
                        value={currentOrg?.id || ""}
                        onValueChange={handleOrgChange}
                      >
                        <SelectTrigger id="organization" className="h-11">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {currentOrg && (
                      <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold">Organization Details</p>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 pl-6">
                          <p><span className="font-medium">Slug:</span> {currentOrg.slug}</p>
                          {currentOrg.description && (
                            <p><span className="font-medium">Description:</span> {currentOrg.description}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-destructive/50 bg-destructive/5 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-destructive text-xl">Danger Zone</CardTitle>
                      <CardDescription className="mt-1">Irreversible and destructive actions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Warning
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This action cannot be undone. This will permanently delete your account and all associated data.
                      </p>
                    </div>
                    <Button variant="destructive" disabled className="shadow-sm hover:shadow-md transition-shadow">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

