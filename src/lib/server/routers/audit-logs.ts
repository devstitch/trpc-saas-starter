import { protectedProcedure, adminProcedure, router } from "../trpc"
import { z } from "zod"
import { prisma } from "../db"
import { TRPCError } from "@trpc/server"

const listAuditLogsSchema = z.object({
  organizationId: z.string(),
  skip: z.number().default(0),
  take: z.number().default(50),
  action: z.string().optional(),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
})

const getAuditLogSchema = z.object({
  id: z.string(),
})

export const auditLogsRouter = router({
  list: protectedProcedure.input(listAuditLogsSchema).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId, skip, take, action, userId, resourceType } = input

    // Verify user is member
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: ctx.user.id,
        },
      },
    })

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      })
    }

    const where: any = { organizationId }

    if (action) where.action = action
    if (userId) where.userId = userId
    if (resourceType) where.resourceType = resourceType

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs: logs.map((log) => ({
        ...log,
        changes: log.changes ? JSON.parse(log.changes) : null,
      })),
      total,
      skip,
      take,
    }
  }),

  get: protectedProcedure.input(getAuditLogSchema).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    if (!log) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Audit log not found",
      })
    }

    // Verify user is member of organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: log.organizationId,
          userId: ctx.user.id,
        },
      },
    })

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      })
    }

    return {
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }
  }),

  adminListAll: adminProcedure
    .input(z.object({ skip: z.number().default(0), take: z.number().default(100) }))
    .query(async ({ input }) => {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          skip: input.skip,
          take: input.take,
          include: {
            user: true,
            organization: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.count(),
      ])

      return {
        logs: logs.map((log) => ({
          ...log,
          changes: log.changes ? JSON.parse(log.changes) : null,
        })),
        total,
      }
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const log = await prisma.auditLog.findUnique({
        where: { id: input.id },
      })

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Audit log not found",
        })
      }

      await prisma.auditLog.delete({
        where: { id: input.id },
      })

      return { success: true, message: "Audit log deleted" }
    }),

  deleteMany: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      const result = await prisma.auditLog.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      })

      return {
        success: true,
        message: `Deleted ${result.count} audit log(s)`,
        count: result.count,
      }
    }),
})
