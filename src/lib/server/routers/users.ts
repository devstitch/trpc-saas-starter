import { procedure, protectedProcedure, adminProcedure, router } from "../trpc"
import { z } from "zod"
import { prisma } from "../db"
import { hashPassword } from "../auth/password"
import { TRPCError } from "@trpc/server"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
})

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
})

const getUserSchema = z.object({
  id: z.string(),
})

const listUsersSchema = z.object({
  skip: z.number().default(0),
  take: z.number().default(10),
})

export const usersRouter = router({
  getUser: procedure.input(getUserSchema).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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

  listUsers: adminProcedure.input(listUsersSchema).query(async ({ input }) => {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: input.skip,
        take: input.take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ])

    return {
      users,
      total,
      skip: input.skip,
      take: input.take,
    }
  }),

  createUser: adminProcedure.input(createUserSchema).mutation(async ({ input }) => {
    const { email, name, password, role } = input

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User with this email already exists",
      })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role as "USER" | "ADMIN",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return user
  }),

  updateUser: protectedProcedure.input(updateUserSchema).mutation(async ({ input, ctx }) => {
    const { id, name, email, role } = input

    // Check permissions
    if (ctx.user?.role !== "ADMIN" && ctx.user?.id !== id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot update other users",
      })
    }

    // Only admins can change roles
    if (role && ctx.user?.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can change user roles",
      })
    }

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already in use",
        })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role as "USER" | "ADMIN" }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    })

    return user
  }),

  deleteUser: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
    })

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      })
    }

    await prisma.user.delete({
      where: { id: input.id },
    })

    return { success: true, message: "User deleted" }
  }),
})
