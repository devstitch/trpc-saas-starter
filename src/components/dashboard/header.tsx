"use client";

import type { User } from "@/types/auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/use-organization";
import { Settings, LogOut, User as UserIcon, Building2 } from "lucide-react";

export function DashboardHeader({ user }: { user: User }) {
  const router = useRouter();
  const { currentOrg } = useOrganization();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentOrganizationId");
    router.push("/");
  };

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8 xl:px-10 w-full">
        <div className="flex items-center gap-4">
          {currentOrg && (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{currentOrg.name}</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {currentOrg.slug}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 transition-all hover:border-primary/40 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Avatar className="h-9 w-9 ring-2 ring-background">
                  <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
