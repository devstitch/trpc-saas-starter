import { trpcAuthLimiter, trpcMutationLimiter } from "./rate-limit"

export const rateLimitMiddleware = async (opts: any) => {
  const userId = (opts.ctx as any).user?.id || opts.ctx.req?.ip || "anonymous"

  // Stricter limits for auth operations
  if (opts.path.includes("auth.register") || opts.path.includes("auth.login")) {
    if (!trpcAuthLimiter(userId)) {
      throw new Error("Rate limit exceeded for auth operations")
    }
  }

  // Mutation rate limiting
  if (opts.type === "mutation") {
    if (!trpcMutationLimiter(userId)) {
      throw new Error("Rate limit exceeded for mutations")
    }
  }

  return opts.next()
}
