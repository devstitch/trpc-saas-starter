"use client";

import { trpcQuery, trpcMutation } from "@/lib/trpc-client";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: "USER" | "ADMIN";
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  role?: "USER" | "ADMIN";
}

export interface ListUsersParams {
  skip?: number;
  take?: number;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  skip: number;
  take: number;
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<User> {
  return trpcQuery("users.getUser", { id });
}

/**
 * List all users (Admin only)
 */
export async function listUsers(
  params?: ListUsersParams
): Promise<ListUsersResponse> {
  return trpcQuery("users.listUsers", params || {});
}

/**
 * Create new user (Admin only)
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  return trpcMutation("users.createUser", input);
}

/**
 * Update user
 */
export async function updateUser(input: UpdateUserInput): Promise<User> {
  return trpcMutation("users.updateUser", input);
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(
  id: string
): Promise<{ success: boolean; message: string }> {
  return trpcMutation("users.deleteUser", { id });
}
