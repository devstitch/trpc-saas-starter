import { router } from "../trpc"
import { authRouter } from "./auth"
import { usersRouter } from "./users"
import { organizationsRouter } from "./organizations"
import { subscriptionsRouter } from "./subscriptions"
import { auditLogsRouter } from "./audit-logs"
import { projectsRouter } from "./projects"
import { realtimeRouter } from "./subscriptions-realtime"
import { apiKeysRouter } from "./api-keys"
import healthRouter from "./health"

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  organizations: organizationsRouter,
  subscriptions: subscriptionsRouter,
  auditLogs: auditLogsRouter,
  projects: projectsRouter,
  realtime: realtimeRouter,
  apiKeys: apiKeysRouter,
  health: healthRouter,
})

export type AppRouter = typeof appRouter
