import rateLimit from "express-rate-limit"
import type { Request } from "express"

// Global rate limiter: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/health"
  },
})

// Auth rate limiter: 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.method !== "POST"
  },
})

// API rate limiter: 1000 requests per hour per user
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: "API rate limit exceeded, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as any).user?.id
    return userId || req.ip || "unknown"
  },
})

// Create custom rate limit middleware for tRPC
export const createTRPCRateLimiter = (limit: number, windowMs: number) => {
  const store = new Map<string, { count: number; resetTime: number }>()

  return (key: string) => {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (entry.count >= limit) {
      return false
    }

    entry.count++
    return true
  }
}

// Rate limiters for specific tRPC operations
export const trpcAuthLimiter = createTRPCRateLimiter(5, 15 * 60 * 1000) // 5 per 15 min
export const trpcMutationLimiter = createTRPCRateLimiter(100, 60 * 1000) // 100 per min
export const trpcQueryLimiter = createTRPCRateLimiter(500, 60 * 1000) // 500 per min
