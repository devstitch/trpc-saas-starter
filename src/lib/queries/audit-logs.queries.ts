"use client"

import { trpcQuery, trpcMutation } from "@/lib/trpc-client"

export interface AuditLog {
  id: string
  organizationId: string
  userId: string
  action: string
  resourceType: string
  resourceId: string | null
  changes: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
  organization?: {
    id: string
    name: string
  }
}

export interface ListAuditLogsParams {
  organizationId: string
  skip?: number
  take?: number
  action?: string
  userId?: string
  resourceType?: string
}

export interface ListAuditLogsResponse {
  logs: AuditLog[]
  total: number
  skip: number
  take: number
}

export interface AdminListAllParams {
  skip?: number
  take?: number
}

/**
 * List audit logs for organization
 */
export async function listAuditLogs(params: ListAuditLogsParams): Promise<ListAuditLogsResponse> {
  return trpcQuery("auditLogs.list", params)
}

/**
 * Get specific audit log by ID
 */
export async function getAuditLog(id: string): Promise<AuditLog> {
  return trpcQuery("auditLogs.get", { id })
}

/**
 * List all audit logs (Admin only)
 */
export async function adminListAll(params?: AdminListAllParams): Promise<ListAuditLogsResponse> {
  return trpcQuery("auditLogs.adminListAll", params || {})
}

/**
 * Delete single audit log (Admin only)
 */
export async function deleteAuditLog(id: string): Promise<{ success: boolean; message: string }> {
  return trpcMutation("auditLogs.delete", { id })
}

/**
 * Delete multiple audit logs (Admin only)
 */
export async function deleteManyAuditLogs(ids: string[]): Promise<{ success: boolean; message: string; count: number }> {
  return trpcMutation("auditLogs.deleteMany", { ids })
}

