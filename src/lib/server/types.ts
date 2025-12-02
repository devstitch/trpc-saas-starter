export interface JWTPayload {
  userId: string
  email: string
  role: "USER" | "ADMIN"
  iat: number
  exp: number
}

export interface TRPCContext {
  user?: {
    id: string
    email: string
    role: "USER" | "ADMIN"
  }
  organizationId?: string
  req?: any
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
}
