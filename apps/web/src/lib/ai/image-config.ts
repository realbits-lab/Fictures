/**
 * Image Size Configuration
 * Defines default image sizes for each provider and aspect ratio
 */

import type { AspectRatio, ImageDimensions, ImageProvider } from './types/image';

/**
 * Size mappings for each provider and aspect ratio
 * Each ratio uses the "fast" size as the default
 */
export const SIZE_MAPPINGS: Record<ImageProvider, Record<AspectRatio, ImageDimensions>> = {
  'ai-server': {
    '1:1': { width: 1024, height: 1024 },     // Fast (default)
    '16:9': { width: 1792, height: 1024 },    // Fast (default)
    '9:16': { width: 1024, height: 1792 },    // Fast (default)
    '3:2': { width: 1536, height: 1024 },     // Fast (default)
    '2:3': { width: 1024, height: 1536 },     // Fast (default)
    '4:3': { width: 1328, height: 1024 },     // Fast (default)
    '3:4': { width: 1024, height: 1328 },     // Fast (default)
  },
  'gemini': {
    '1:1': { width: 1024, height: 1024 },     // Fast (default)
    '16:9': { width: 1792, height: 1024 },    // Fast (default)
    '9:16': { width: 1024, height: 1792 },    // Fast (default)
    '3:2': { width: 1536, height: 1024 },     // Fast (default)
    '2:3': { width: 1024, height: 1536 },     // Fast (default)
    '4:3': { width: 1344, height: 1024 },     // Fast (default)
    '3:4': { width: 1024, height: 1344 },     // Fast (default)
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
