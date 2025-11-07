/**
 * Image Size Configuration
 * Defines default image sizes for each provider and aspect ratio
 */

import type { AspectRatio, ImageDimensions, ImageProvider } from './types/image';

/**
 * Size mappings for each provider and aspect ratio
 *
 * AI Server (Qwen-Image-Lightning): Official supported resolutions
 * - Based on Qwen-Image GitHub specs
 * - Optimized for quality and performance
 *
 * Gemini 2.5 Flash: Approximate dimensions
 * - Gemini API accepts aspect ratio strings
 * - Generates ~1024px on longer dimension
 * - Actual dimensions may vary slightly
 */
export const SIZE_MAPPINGS: Record<ImageProvider, Record<AspectRatio, ImageDimensions>> = {
  'ai-server': {
    // Qwen-Image-Lightning official resolutions (from GitHub)
    '1:1': { width: 1328, height: 1328 },     // Square format
    '16:9': { width: 1664, height: 928 },     // Widescreen (true 16:9 = 1.793)
    '9:16': { width: 928, height: 1664 },     // Vertical/portrait
    '2:3': { width: 1024, height: 1536 },     // Portrait (calculated, 2:3 = 0.667)
  },
  'gemini': {
    // Gemini 2.5 Flash approximate dimensions (~1024px max)
    '1:1': { width: 1024, height: 1024 },     // Square
    '16:9': { width: 1024, height: 576 },     // Widescreen (true 16:9 = 1.778)
    '9:16': { width: 576, height: 1024 },     // Vertical
    '2:3': { width: 683, height: 1024 },      // Portrait (2:3 = 0.667)
  },
};

/**
 * Get image dimensions for a given provider and aspect ratio
 */
export function getImageDimensions(
  provider: ImageProvider,
  aspectRatio: AspectRatio
): ImageDimensions {
  const dimensions = SIZE_MAPPINGS[provider][aspectRatio];

  if (!dimensions) {
    throw new Error(`No size configuration found for provider ${provider} and aspect ratio ${aspectRatio}`);
  }

  return dimensions;
}
