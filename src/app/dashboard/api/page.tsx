"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { useSubscription } from "@/hooks/use-subscription"
import { getApiKey, regenerateApiKey } from "@/lib/queries/api-keys.queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code, Key, Copy, Check, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ApiTestPanel } from "@/components/api/api-test-panel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

export default function ApiAccessPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const { subscription, loading: subLoading, hasApiAccess } = useSubscription()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loadingKey, setLoadingKey] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)

  useEffect(() => {
    if (hasApiAccess) {
      fetchApiKey()
    }
  }, [hasApiAccess])

  const fetchApiKey = async () => {
    try {
      setLoadingKey(true)
      const data = await getApiKey()
      setApiKey(data?.apiKey || null)
    } catch (error) {
      console.error("Failed to fetch API key:", error)
    } finally {
      setLoadingKey(false)
    }
  }

  const handleRegenerateKey = async () => {
    try {
      setRegenerating(true)
      const data = await regenerateApiKey()
      setApiKey(data?.apiKey || null)
      setShowRegenerateDialog(false)
      setCopied(false)
    } catch (error: any) {
      console.error("Failed to regenerate API key:", error)
      alert(error.message || "Failed to regenerate API key")
    } finally {
      setRegenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || orgLoading || subLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (!hasApiAccess) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader user={user} />
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="p-8">
              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>API Access Not Available</CardTitle>
                  </div>
                  <CardDescription>
                    API Access is only available for PRO and ENTERPRISE plans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/dashboard/billing">
                    <Button>
                      Upgrade to PRO
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
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
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">API Access</h1>
                  <p className="text-muted-foreground text-lg mt-1">Manage your API keys and documentation</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>API Key</CardTitle>
                    </div>
                    <Badge variant="secondary">{subscription?.plan} Plan</Badge>
                  </div>
                  <CardDescription>
                    Use this key to authenticate your API requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                      {loadingKey ? "Loading..." : apiKey || "No API key"}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      disabled={!apiKey || loadingKey}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600">Copied to clipboard!</p>
                  )}
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowRegenerateDialog(true)}
                    disabled={loadingKey || regenerating}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      "Regenerate Key"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>
                    Learn how to use the tRPC API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Base URL</p>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {typeof window !== "undefined" ? window.location.origin : ""}/api/trpc
                    </code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Include your API key in the Authorization header:
                    </p>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      Authorization: Bearer YOUR_API_KEY
                    </code>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Full Documentation
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Example Request</CardTitle>
                <CardDescription>
                  Example cURL request to list projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                  <code>{`curl -X GET \\
  "${typeof window !== "undefined" ? window.location.origin : ""}/api/trpc/projects.list?input=..." \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
                </pre>
              </CardContent>
            </Card>

            <ApiTestPanel 
              apiKey={apiKey} 
              baseUrl={typeof window !== "undefined" ? `${window.location.origin}/api/trpc` : ""}
              organizationId={currentOrg?.id}
            />
          </div>

          <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will invalidate your current API key and generate a new one. 
                  Make sure to update any applications using the old key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRegenerateKey}
                  disabled={regenerating}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    "Regenerate"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  )
}

