"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { AuditLogsList } from "@/components/audit-logs/audit-logs-list"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, FileText } from "lucide-react"

export default function AuditLogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
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
              <Skeleton className="h-96" />
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
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Audit Logs</h1>
                  <p className="text-muted-foreground text-lg mt-1">
                    Monitor all system activity and track changes across the platform
                  </p>
                </div>
              </div>
            </div>
            <AuditLogsList isAdmin={user.role === "ADMIN"} />
          </div>
        </main>
      </div>
    </div>
  )
}

