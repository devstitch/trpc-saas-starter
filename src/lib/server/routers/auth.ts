import { procedure, protectedProcedure, router } from "../trpc"
import { z } from "zod"
import { prisma } from "../db"
import { hashPassword, verifyPassword } from "../auth/password"
import { generateJWT } from "../auth/jwt"
import { TRPCError } from "@trpc/server"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
})

export const authRouter = router({
  register: procedure.input(registerSchema).mutation(async ({ input }) => {
    const { email, password, name } = input

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User with this email already exists",
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "USER",
      },
    })

    // Generate JWT token
    const token = generateJWT(user.id, user.email, user.role)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }
  }),

  login: procedure.input(loginSchema).mutation(async ({ input }) => {
    const { email, password } = input

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      })
    }

    // Generate JWT token
    const token = generateJWT(user.id, user.email, user.role)

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    return user
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    // Delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: ctx.user.id },
    })

    return { success: true }
  }),

  validateSession: procedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const session = await prisma.session.findUnique({
      where: { token: input.token },
      include: { user: true },
    })

    if (!session) {
      return { valid: false }
    }

    if (session.expiresAt < new Date()) {
      // Session expired, delete it
      await prisma.session.delete({
        where: { id: session.id },
      })
      return { valid: false }
    }

    return {
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    }
  }),
})
