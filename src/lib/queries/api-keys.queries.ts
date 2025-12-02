"use client"

import { trpcQuery, trpcMutation } from "@/lib/trpc-client"

export interface ApiKeyResponse {
  apiKey: string
}

/**
 * Get or generate API key for current user
 */
export async function getApiKey(): Promise<ApiKeyResponse> {
  return trpcQuery("apiKeys.getApiKey", {})
}

/**
 * Regenerate API key for current user
 */
export async function regenerateApiKey(): Promise<ApiKeyResponse> {
  return trpcMutation("apiKeys.regenerateApiKey", {})
}

