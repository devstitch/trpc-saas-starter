import { protectedProcedure, router } from "../trpc"
import { z } from "zod"
import { prisma } from "../db"
import { TRPCError } from "@trpc/server"

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
})

const updateOrgSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
})

const getOrgSchema = z.object({
  id: z.string(),
})

const inviteUserSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
})

const removeUserSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
})

const switchOrgSchema = z.object({
  organizationId: z.string(),
})

export const organizationsRouter = router({
  createOrganization: protectedProcedure.input(createOrgSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { name, slug, description } = input

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    })

    if (existingOrg) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Organization slug already exists",
      })
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        ownerId: ctx.user.id,
        members: {
          create: {
            userId: ctx.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    })

    return org
  }),

  getOrganization: protectedProcedure.input(getOrgSchema).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const org = await prisma.organization.findUnique({
      where: { id: input.id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    })

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      })
    }

    // Check if user is member
    const isMember = org.members.some((m) => m.userId === ctx.user?.id)
    if (!isMember) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      })
    }

    return org
  }),

  listUserOrganizations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const orgs = await prisma.organization.findMany({
      where: {
        members: {
          some: { userId: ctx.user.id },
        },
      },
      include: {
        members: {
          select: { userId: true, role: true },
        },
      },
    })

    return orgs
  }),

  updateOrganization: protectedProcedure.input(updateOrgSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { id, name, description } = input

    // Check membership and role
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: ctx.user.id,
        },
      },
    })

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only owners and admins can update the organization",
      })
    }

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    })

    return org
  }),

  inviteUserToOrganization: protectedProcedure.input(inviteUserSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId, userId, role } = input

    // Check if caller has permission
    const callerMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: ctx.user.id,
        },
      },
    })

    if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only owners and admins can invite users",
      })
    }

    // Check if user already exists in org
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })

    if (existingMembership) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is already a member of this organization",
      })
    }

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role: role as "OWNER" | "ADMIN" | "MEMBER",
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        organization: true,
      },
    })

    return membership
  }),

  removeUserFromOrganization: protectedProcedure.input(removeUserSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId, userId } = input

    // Check if caller has permission
    const callerMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: ctx.user.id,
        },
      },
    })

    if (!callerMembership || !["OWNER", "ADMIN"].includes(callerMembership.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only owners and admins can remove users",
      })
    }

    // Check if user to remove exists
    const userMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })

    if (!userMembership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User is not a member of this organization",
      })
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    })

    return { success: true, message: "User removed from organization" }
  }),

  switchOrganization: protectedProcedure.input(switchOrgSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      })
    }

    const { organizationId } = input

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

    return {
      organizationId,
      role: membership.role,
      message: "Organization context switched",
    }
  }),
})
