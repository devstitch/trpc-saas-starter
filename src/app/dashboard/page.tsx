"use client"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { ProjectsList } from "@/components/projects/projects-list"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { listProjects } from "@/lib/queries/projects.queries"
import Link from "next/link"
import { FolderKanban, Building2, TrendingUp, Sparkles, LayoutDashboard } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { subscription, loading: subLoading } = useSubscription()
  const [stats, setStats] = useState({ projects: 0, organizations: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (currentOrg) {
      fetchStats()
    } else {
      setLoadingStats(false)
    }
  }, [currentOrg])

  const fetchStats = async () => {
    if (!currentOrg) return
    try {
      const data = await listProjects({
        organizationId: currentOrg.id,
      })
      setStats({
        projects: data?.total || 0,
        organizations: 1,
      })
    } catch (error) {
      // Silently handle error
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || orgLoading || subLoading) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user || { id: "", email: "", name: "", role: "USER" }} />
          <main className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              <div>
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
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
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Dashboard
                  </h1>
                </div>
              </div>
              <p className="text-muted-foreground text-lg ml-[52px]">
                Welcome back, <span className="font-semibold text-foreground">{user.name}</span>! Here's an overview of your workspace.
              </p>
            </div>

            {!currentOrg ? (
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle>No Organization Selected</CardTitle>
                      <CardDescription className="mt-1">
                        You need to create or select an organization to get started
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/organizations">
                    <Button className="w-full sm:w-auto">
                      <Building2 className="mr-2 h-4 w-4" />
                      Go to Organizations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingStats ? (
                        <Skeleton className="h-10 w-24 mb-2" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                          {stats.projects}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Active projects in workspace</p>
                    </CardContent>
                  </Card>

                  <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingStats ? (
                        <Skeleton className="h-10 w-24 mb-2" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                          {stats.organizations}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Current workspace</p>
                    </CardContent>
                  </Card>

                  <Card className="h-full border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {subLoading ? (
                        <Skeleton className="h-10 w-24 mb-2" />
                      ) : (
                        <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                          {subscription?.plan || "FREE"}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Current subscription</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Projects Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
                        <p className="text-sm text-muted-foreground">Manage your projects</p>
                      </div>
                    </div>
                  </div>
                  <ProjectsList />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
