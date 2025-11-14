/**
 * Central Schema Export Point
 *
 * This file serves as the single import point for all schemas and types in the application.
 * All schemas are organized in a layered architecture:
 *
 * Layer Flow: database → zod → api → services → domain
 *
 * Import from here for convenience:
 *   import { Story, ApiStoryRequest, GeneratorOptions } from "@/lib/schemas";
 *
 * Or import from specific layers for clarity:
 *   import { Story } from "@/lib/schemas/zod/generated";
 *   import { ApiStoryRequest } from "@/lib/schemas/api/studio";
 */

// ============================================================================
// Database Layer - Drizzle ORM Table Definitions (SSOT for DB)
// ============================================================================
export * from "./database";

// ============================================================================
// Zod Layer - All Zod Validation Schemas
// ============================================================================

export * from "./api/evaluation";
// ============================================================================
// API Layer - HTTP Request/Response Contracts
// ============================================================================
export * from "./api/studio";
// ============================================================================
// Domain Layer - Domain-Specific Types
// ============================================================================
export * from "./domain/image";
export * from "./services/evaluation";
// ============================================================================
// Services Layer - Service Function Contracts
// ============================================================================
export * from "./services/generators";
export * from "./services/improvement";
export * from "./services/validation";
// AI generation schemas
export * from "./zod/ai";
// Generated from Drizzle via drizzle-zod
export * from "./zod/generated";
// Hand-written nested JSON schemas
export * from "./zod/nested/personality";
export * from "./zod/nested/physical-description";
export * from "./zod/nested/setting-elements";
export * from "./zod/nested/voice-style";
