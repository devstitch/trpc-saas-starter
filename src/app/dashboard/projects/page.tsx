"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { ProjectsList } from "@/components/projects/projects-list"
import { useAuth } from "@/hooks/use-auth"
import { FolderKanban } from "lucide-react"

export default function ProjectsPage() {
  const { user, loading } = useAuth()

  if (loading) {
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
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
                  <p className="text-muted-foreground text-lg mt-1">Manage your projects and workspaces</p>
                </div>
              </div>
            </div>
            <ProjectsList />
          </div>
        </main>
      </div>
    </div>
  )
}

