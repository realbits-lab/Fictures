/**
 * Image Generation Types
 *
 * Layer: Domain (Core AI Concepts)
 * Used by: src/lib/ai/providers/* and src/lib/studio/generators/*
 * Related:
 * - Service types: src/lib/studio/generators/types.ts
 * - API types: src/app/api/studio/types.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines provider-agnostic interfaces for AI image generation.
 * These types represent core domain concepts independent of specific AI providers.
 *
 * ## Naming Convention
 * Domain-focused naming:
 * - {Concept}: Core domain types (ImageProvider, AspectRatio)
 * - {Concept}Request: Domain request patterns
 * - {Concept}Response: Domain response patterns
 *
 * ## Architecture
 * Domain Layer (this file) ← Service Layer (generators/types.ts) ← API Layer (api/types.ts)
 *
 * Providers implement domain interfaces:
 * - GeminiImageProvider implements ImageGenerationRequest/Response
 * - AIServerImageProvider implements ImageGenerationRequest/Response
 *
 * ## Supported Providers
 * - gemini: Google Gemini 2.5 Flash (via Vercel AI SDK)
 * - ai-server: Python FastAPI service with Stable Diffusion
 */

export type ImageProvider = "gemini" | "ai-server";

/**
 * Supported aspect ratios
 */
export type AspectRatio = "1:1" | "16:9" | "9:16" | "2:3";

/**
 * Image generation request
 */
export interface ImageGenerationRequest {
    prompt: string;
    aspectRatio: AspectRatio;
    seed?: number;
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
    imageUrl: string;
    model: string;
    width: number;
    height: number;
    seed?: number;
    provider: ImageProvider;
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
    width: number;
    height: number;
}
