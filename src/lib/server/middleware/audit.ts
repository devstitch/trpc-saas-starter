import { prisma } from "../db"

export interface AuditLogInput {
  organizationId: string
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export const createAuditLog = async (input: AuditLogInput) => {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        changes: input.changes ? JSON.stringify(input.changes) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}
