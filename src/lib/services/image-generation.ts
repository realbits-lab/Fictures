import { GoogleGenerativeAI } from '@google/generative-ai';
import { put } from '@vercel/blob';
import { optimizeImage, type OptimizedImageSet, ORIGINAL_IMAGE_SIZE } from './image-optimization';
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
 * Generate a story illustration using Gemini 2.5 Flash Image and create optimized variants
 *
 * Process:
 * 1. Generate 1344x768 (16:9) image with Gemini 2.5 Flash Image
 * 2. Upload original to Vercel Blob
 * 3. Create optimized variants:
 *    - Mobile 1x: 672×384 (resize + convert)
 *    - Mobile 2x: 1344×768 (convert only, no resize!)
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
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.warn('[Image Generation] Missing GOOGLE_GENERATIVE_AI_API_KEY - using placeholder');
    return createPlaceholderImageResult(imageType);
  }

  try {
    console.log(`[Image Generation] Starting ${imageType} image generation for story ${storyId}`);

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    // Generate image with Gemini 2.5 Flash Image
    // Output: 1344×768 pixels = 7:4 aspect ratio (1.75:1) - landscape format for comics
    console.log(`[Image Generation] Calling Gemini 2.5 Flash Image...`);
    const geminiResult = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['Image'],
        imageConfig: {
          // NOTE: Gemini API accepts '16:9' as aspect ratio but actually generates 1344×768 pixels
          // This is 7:4 aspect ratio (1.75:1), NOT true 16:9 (1.778:1)
          // We use '16:9' because it's the closest standard option that produces landscape output
          aspectRatio: '16:9',
        },
      },
    });

    // Extract image from response
    const response = await geminiResult.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!imagePart) {
      throw new Error('No image data in Gemini response');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

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
    width: ORIGINAL_IMAGE_SIZE.width,   // 1344
    height: ORIGINAL_IMAGE_SIZE.height, // 768
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
    console.error(`[Image Generation] ✗ Gemini generation failed - using placeholder:`, error);
    console.error(`Error details:`, error instanceof Error ? error.message : String(error));

    return createPlaceholderImageResult(imageType);
  }
}

/**
 * Create a fallback result using placeholder image
 * Used when Gemini generation fails (API errors, rate limits, network issues)
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
    width: ORIGINAL_IMAGE_SIZE.width,   // 1344
    height: ORIGINAL_IMAGE_SIZE.height, // 768
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

  parts.push('Cinematic widescreen composition, 16:9 aspect ratio (1344×768), high quality digital art');

  return parts.join('. ');
}
