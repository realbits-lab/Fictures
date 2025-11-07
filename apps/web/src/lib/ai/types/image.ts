/**
 * Image Generation Types
 * Provider-agnostic interfaces for image generation
 */

export type ImageProvider = 'gemini' | 'ai-server';

/**
 * Supported aspect ratios
 */
export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:2' | '2:3' | '4:3' | '3:4';

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
