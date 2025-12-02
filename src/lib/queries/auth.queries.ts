"use client";

import { trpcQuery, trpcMutation } from "@/lib/trpc-client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  };
  token: string;
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  return trpcMutation("auth.login", input);
}

/**
 * Register new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  return trpcMutation("auth.register", input);
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  return trpcQuery("auth.me", {});
}

/**
 * Logout user (invalidate all sessions)
 */
export async function logout(): Promise<{ success: boolean }> {
  return trpcMutation("auth.logout", {});
}
