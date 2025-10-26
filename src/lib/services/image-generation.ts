import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { put } from '@vercel/blob';
import { optimizeImage, type OptimizedImageSet } from './image-optimization';
import { nanoid } from 'nanoid';

// Placeholder images for fallback when generation fails
const PLACEHOLDER_IMAGES = {
  character: 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/character-default.png',
  setting: 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/setting-visual.png',
  scene: 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/scene-illustration.png',
  story: 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/story-cover.png',
} as const;

export interface GenerateStoryImageParams {
  prompt: string;
  storyId: string;
  imageType?: 'story' | 'scene' | 'character' | 'setting' | 'panel';
  chapterId?: string;
  sceneId?: string;
  panelNumber?: number; // For comic panels
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  skipOptimization?: boolean; // For testing or special cases
}

export interface GenerateStoryImageResult {
  url: string;
  blobUrl: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
  optimizedSet?: OptimizedImageSet;
  isPlaceholder?: boolean; // Flag to identify placeholder images
}

/**
 * Generate a story illustration using DALL-E 3 and create optimized variants
 *
 * Process:
 * 1. Generate 1792x1024 (16:9) image with DALL-E 3
 * 2. Upload original to Vercel Blob
 * 3. Create optimized variants (AVIF, WebP, JPEG in multiple sizes)
 * 4. Return all URLs and metadata
 *
 * @param params - Image generation parameters
 * @returns Original image URL and optimized variants
 */
export async function generateStoryImage({
  prompt,
  storyId,
  imageType = 'story',
  chapterId,
  sceneId,
  panelNumber,
  style = 'vivid',
  quality = 'standard',
  skipOptimization = false,
}: GenerateStoryImageParams): Promise<GenerateStoryImageResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.warn('[Image Generation] Missing API key - using placeholder');
    return createPlaceholderImageResult(imageType);
  }

  try {
    console.log(`[Image Generation] Starting ${imageType} image generation for story ${storyId}`);

  const openaiProvider = createOpenAI({
    apiKey: apiKey,
  });

  // Generate image with DALL-E 3
  console.log(`[Image Generation] Calling DALL-E 3...`);
  const { image } = await generateImage({
    model: openaiProvider.image('dall-e-3'),
    prompt: prompt,
    size: '1792x1024', // 16:9 widescreen format
    providerOptions: {
      openai: {
        style: style,
        quality: quality,
      },
    },
  });

  // Convert base64 to buffer
  const base64Data = image.base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique image ID
  const imageId = nanoid();

  // Construct filename based on image type
  let filename: string;
  if (imageType === 'panel' && sceneId && panelNumber !== undefined) {
    // Comic panel path: stories/{storyId}/comics/{sceneId}/panel-{number}.png
    filename = `stories/${storyId}/comics/${sceneId}/panel-${panelNumber}.png`;
  } else {
    // Standard path: stories/{storyId}/{imageType}/{imageId}.png
    filename = `stories/${storyId}/${imageType}/${imageId}.png`;
  }

  console.log(`[Image Generation] Uploading original image to Vercel Blob...`);

  // Upload original to Vercel Blob
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`[Image Generation] ✓ Original uploaded: ${blob.url}`);

  const result: GenerateStoryImageResult = {
    url: blob.url,
    blobUrl: blob.url,
    width: 1792,
    height: 1024,
    size: buffer.length,
    imageId,
  };

  // Create optimized variants (unless skipped for testing)
  if (!skipOptimization) {
    try {
      console.log(`[Image Generation] Creating optimized variants...`);
      const optimizedSet = await optimizeImage(
        blob.url,
        imageId,
        storyId,
        imageType,
        sceneId  // Pass sceneId for comics path hierarchy
      );
      result.optimizedSet = optimizedSet;
      console.log(`[Image Generation] ✓ Complete! Generated ${optimizedSet.variants.length} optimized variants`);
    } catch (error) {
      console.error('[Image Generation] ✗ Failed to create optimized variants:', error);
      // Continue without optimization rather than failing entirely
      console.warn('[Image Generation] Continuing with original image only');
    }
  } else {
    console.log(`[Image Generation] Skipping optimization (skipOptimization=true)`);
  }

    return result;
  } catch (error) {
    // CRITICAL: Don't throw - return placeholder instead to prevent database corruption
    console.error(`[Image Generation] ✗ DALL-E generation failed - using placeholder:`, error);
    console.error(`Error details:`, error instanceof Error ? error.message : String(error));

    return createPlaceholderImageResult(imageType);
  }
}

/**
 * Create a fallback result using placeholder image
 * Used when DALL-E generation fails (API errors, rate limits, network issues)
 */
function createPlaceholderImageResult(
  imageType: 'story' | 'scene' | 'character' | 'setting'
): GenerateStoryImageResult {
  const placeholderUrl = PLACEHOLDER_IMAGES[imageType];
  const imageId = `placeholder-${imageType}-${nanoid()}`;

  console.log(`[Image Generation] ⚠️  Using placeholder for ${imageType}: ${placeholderUrl}`);

  return {
    url: placeholderUrl,
    blobUrl: placeholderUrl,
    width: 1792,
    height: 1024,
    size: 0, // Placeholder, actual size unknown
    imageId,
    isPlaceholder: true,
    // No optimizedSet for placeholders
  };
}

/**
 * Generate an image prompt based on story context
 */
export function buildStoryImagePrompt({
  title,
  description,
  genre,
  mood,
  characters,
  setting,
}: {
  title?: string;
  description?: string;
  genre?: string;
  mood?: string;
  characters?: string[];
  setting?: string;
}): string {
  const parts: string[] = [];

  if (description) {
    parts.push(description);
  }

  if (setting) {
    parts.push(`Setting: ${setting}`);
  }

  if (characters && characters.length > 0) {
    parts.push(`Characters: ${characters.join(', ')}`);
  }

  if (mood) {
    parts.push(`Mood: ${mood}`);
  }

  if (genre) {
    parts.push(`Genre: ${genre}`);
  }

  parts.push('Cinematic widescreen composition, 16:9 aspect ratio, high quality digital art');

  return parts.join('. ');
}
