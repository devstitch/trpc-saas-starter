"use client";

/**
 * Centralized API Queries
 *
 * All API queries are organized by domain in separate files.
 * Import from this file or directly from domain-specific files.
 */

// Auth queries
export * from "./auth.queries";

// User queries
export * from "./users.queries";

// Organization queries
export * from "./organizations.queries";

// Project queries
export * from "./projects.queries";

// Subscription queries
export * from "./subscriptions.queries";

// API Key queries
export * from "./api-keys.queries";

// Audit Log queries
export * from "./audit-logs.queries";
