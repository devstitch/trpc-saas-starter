"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FolderKanban, 
  Building2, 
  CreditCard, 
  Settings,
  Sparkles,
  Code,
  Users,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"

const baseRoutes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: FileText },
]

const premiumRoutes = [
  { href: "/dashboard/api", label: "API Access", icon: Code },
]

const adminRoutes = [
  { href: "/dashboard/users", label: "Users", icon: Users },
]

const commonRoutes = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { hasApiAccess } = useSubscription()
  const { user } = useAuth()

  // Combine routes based on subscription and role
  const routes = [
    ...baseRoutes,
    ...(hasApiAccess ? premiumRoutes : []),
    ...(user?.role === "ADMIN" ? adminRoutes : []),
    ...commonRoutes,
  ]

  return (
    <aside className="w-64 border-r bg-gradient-to-b from-card to-card/50 backdrop-blur-sm flex flex-col shadow-sm">
      {/* Logo Section */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              tRPC SaaS
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">Starter</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {routes.map((route) => {
          const isActive = pathname === route.href
          const Icon = route.icon
          
          return (
            <Link key={route.href} href={route.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:translate-x-1"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform",
                  isActive ? "text-primary-foreground" : "group-hover:scale-110"
                )} />
                <span className={cn(isActive && "font-semibold")}>{route.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground/80">v1.0.0</p>
          <p className="text-[10px] mt-1 opacity-70">© 2025 tRPC SaaS</p>
        </div>
      </div>
    </aside>
  )
}
