"use client";

import { trpcQuery, trpcMutation } from "@/lib/trpc-client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED";
  organizationId: string;
  createdById: string;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

export interface ListProjectsParams {
  organizationId: string;
  skip?: number;
  take?: number;
  status?: "ACTIVE" | "ARCHIVED";
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateProjectInput {
  organizationId: string;
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  id: string;
  organizationId: string;
  name?: string;
  description?: string;
  status?: "ACTIVE" | "ARCHIVED";
}

/**
 * List projects in organization
 */
export async function listProjects(
  params: ListProjectsParams
): Promise<ListProjectsResponse> {
  return trpcQuery("projects.list", params);
}

/**
 * Create new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  return trpcMutation("projects.create", input);
}

/**
 * Update project
 */
export async function updateProject(
  input: UpdateProjectInput
): Promise<Project> {
  return trpcMutation("projects.update", input);
}

/**
 * Delete (archive) project
 */
export async function deleteProject(
  id: string,
  organizationId: string
): Promise<{ success: boolean }> {
  return trpcMutation("projects.delete", { id, organizationId });
}
