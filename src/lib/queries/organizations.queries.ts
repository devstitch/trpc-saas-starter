"use client";

import { trpcQuery, trpcMutation } from "@/lib/trpc-client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  members: Array<{
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    user: { id: string; email: string; name: string | null };
  }>;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

export interface InviteUserInput {
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

/**
 * Get organization by ID
 */
export async function getOrganization(id: string): Promise<Organization> {
  return trpcQuery("organizations.getOrganization", { id });
}

/**
 * List user's organizations
 */
export async function listUserOrganizations(): Promise<Organization[]> {
  return trpcQuery("organizations.listUserOrganizations", {});
}

/**
 * Create new organization
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  return trpcMutation("organizations.createOrganization", input);
}

/**
 * Invite user to organization
 */
export async function inviteUserToOrganization(
  input: InviteUserInput
): Promise<Organization> {
  return trpcMutation("organizations.inviteUserToOrganization", input);
}
