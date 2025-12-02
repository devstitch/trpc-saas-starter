"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { UsersList } from "@/components/users/users-list";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, Users } from "lucide-react";

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader
            user={
              user || {
                id: "",
                email: "",
                name: "",
                role: "USER",
                createdAt: "",
              }
            }
          />
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
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="p-8">
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <CardTitle>Access Denied</CardTitle>
                  </div>
                  <CardDescription>
                    You need admin privileges to access this page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto bg-linear-to-br from-background via-background to-muted/20">
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 space-y-8 w-full">
            {/* Header Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
                    Users Management
                  </h1>
                  <p className="text-muted-foreground text-lg ml-[52px]">
                    Manage all users in the system. Create, edit, or delete user
                    accounts.
                  </p>
                </div>
              </div>
            </div>
            <UsersList />
          </div>
        </main>
      </div>
    </div>
  );
}
