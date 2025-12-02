import { protectedProcedure, router } from "../trpc"
import { z } from "zod"
import { prisma } from "../db"
import { TRPCError } from "@trpc/server"
import { createAuditLog } from "../middleware/audit"
import { realtimeEvents } from "../realtime/events"

const createProjectSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
})

const getProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
})

const listProjectsSchema = z.object({
  organizationId: z.string(),
  skip: z.number().default(0),
  take: z.number().default(10),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
})

const deleteProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
})

export const projectsRouter = router({
  create: protectedProcedure.input(createProjectSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId, name, description } = input

    // Verify user is member of organization
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
        message: "Not a member of this organization",
      })
    }

    // Check subscription limit - create FREE subscription if none exists
    let subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    })

    if (!subscription) {
      // Auto-create FREE subscription for new organizations
      const now = new Date()
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      subscription = await prisma.subscription.create({
        data: {
          organizationId,
          plan: "FREE",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      })
    }

    const projectCount = await prisma.project.count({
      where: { organizationId, status: "ACTIVE" },
    })

    const planDetails = {
      FREE: { limit: 5 },
      PRO: { limit: 1000 },
      ENTERPRISE: { limit: 10000 },
    }

    const limit = planDetails[subscription.plan as keyof typeof planDetails].limit

    if (projectCount >= limit) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Project limit reached for ${subscription.plan} plan (${limit} projects)`,
      })
    }

    const project = await prisma.project.create({
      data: {
        organizationId,
        name,
        description,
        createdById: ctx.user.id,
        status: "ACTIVE",
      },
    })

    realtimeEvents.emit({
      type: "PROJECT_CREATED",
      data: {
        projectId: project.id,
        organizationId,
        name,
      },
    })

    // Log project creation
    await createAuditLog({
      organizationId,
      userId: ctx.user.id,
      action: "PROJECT_CREATED",
      resourceType: "PROJECT",
      resourceId: project.id,
      changes: { name, status: "ACTIVE" },
    })

    return project
  }),

  get: protectedProcedure.input(getProjectSchema).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { id, organizationId } = input

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
        message: "Not a member of this organization",
      })
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    // Verify project belongs to organization
    if (project.organizationId !== organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project does not belong to this organization",
      })
    }

    return project
  }),

  list: protectedProcedure.input(listProjectsSchema).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId, skip, take, status } = input

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
        message: "Not a member of this organization",
      })
    }

    const where: any = { organizationId }
    if (status) where.status = status

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          createdBy: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
    ])

    return {
      projects,
      total,
      skip,
      take,
    }
  }),

  update: protectedProcedure.input(updateProjectSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { id, organizationId, name, description, status } = input

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
        message: "Not a member of this organization",
      })
    }

    // Verify project exists and belongs to org
    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    if (project.organizationId !== organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project does not belong to this organization",
      })
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    })

    const changes: any = {}
    if (name) changes.name = name
    if (description !== undefined) changes.description = description
    if (status) changes.status = status

    realtimeEvents.emit({
      type: "PROJECT_UPDATED",
      data: {
        projectId: id,
        organizationId,
        changes,
      },
    })

    // Log project update
    await createAuditLog({
      organizationId,
      userId: ctx.user.id,
      action: "PROJECT_UPDATED",
      resourceType: "PROJECT",
      resourceId: id,
      changes,
    })

    return updatedProject
  }),

  delete: protectedProcedure.input(deleteProjectSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { id, organizationId } = input

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
        message: "Not a member of this organization",
      })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Project not found",
      })
    }

    if (project.organizationId !== organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Project does not belong to this organization",
      })
    }

    // Archive instead of hard delete
    const archived = await prisma.project.update({
      where: { id },
      data: { status: "ARCHIVED" },
    })

    realtimeEvents.emit({
      type: "PROJECT_DELETED",
      data: {
        projectId: id,
        organizationId,
      },
    })

    // Log project deletion
    await createAuditLog({
      organizationId,
      userId: ctx.user.id,
      action: "PROJECT_ARCHIVED",
      resourceType: "PROJECT",
      resourceId: id,
      changes: { status: "ARCHIVED" },
    })

    return { success: true, message: "Project archived" }
  }),

  getByCreator: protectedProcedure
    .input(z.object({ organizationId: z.string(), userId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        })
      }

      const { organizationId, userId } = input

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
          message: "Not a member of this organization",
        })
      }

      const projects = await prisma.project.findMany({
        where: {
          organizationId,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return projects
    }),
})
