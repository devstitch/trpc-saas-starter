import { LoginForm } from "@/components/auth/login-form"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to tRPC SaaS</h1>
            <p className="text-muted-foreground">Sign in to your account to get started</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
