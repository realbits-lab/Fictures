import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  method: string;
  error?: string;
}

/**
 * Generate a placeholder image URL based on the type and prompt
 */
function generatePlaceholder(prompt: string, type: string): string {
  const placeholderService = 'https://picsum.photos';
  const uniqueString = `${prompt}_${type}_${Date.now()}`;
  const hash = uniqueString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const imageId = Math.abs(hash) % 1000 + 100; // Range 100-1099

  if (type === 'character') {
    return `${placeholderService}/400/600?random=${imageId}&blur=0`;
  } else if (type === 'place' || type === 'setting' || type === 'scene') {
    return `${placeholderService}/600/400?random=${imageId}&blur=0`;
  } else {
    return `${placeholderService}/500/500?random=${imageId}&blur=0`;
  }
}

/**
 * Upload image data to Vercel Blob storage
 */
async function uploadToBlob(
  imageData: Buffer | ArrayBuffer | Blob,
  storyId: string,
  type: string
): Promise<string> {
  const imageFileName = `stories/${storyId}/${type}s/${nanoid()}.png`;
  const blob = await put(imageFileName, imageData, {
    access: 'public',
    contentType: 'image/png',
  });
  return blob.url;
}

/**
 * Generate an image using Gemini or fallback to placeholder
 */
export async function generateImage(
  prompt: string,
  type: 'character' | 'setting' | 'scene',
  storyId: string
): Promise<ImageGenerationResult> {
  try {
    console.log(`🎨 Generating ${type} image with prompt:`, prompt.substring(0, 100) + '...');

    // Enhanced prompt for better image generation
    const enhancedPrompt = type === 'character'
      ? `Create a detailed portrait image of: ${prompt}. Fantasy character art style, high quality, detailed.`
      : `Create a detailed landscape image of: ${prompt}. Fantasy environment art style, atmospheric, high quality.`;

    // Try Gemini 2.5 Flash Image Preview
    try {
      console.log('🔄 Attempting Gemini 2.5 Flash Image generation...');

      const result = await generateText({
        model: google('gemini-2.5-flash-image-preview'),
        prompt: enhancedPrompt,
        providerOptions: {
          google: {
            generateImage: true,  // Enable image generation
            imageSize: type === 'character' ? '512x512' : '768x512',
            imageQuality: 'high',
          }
        },
        temperature: 0.8,
        maxTokens: 1500,
      });

      // Check if result contains generated image
      if (result.experimental_media?.length > 0) {
        const generatedMedia = result.experimental_media[0];

        if (generatedMedia.data) {
          // Upload to Vercel Blob
          const imageUrl = await uploadToBlob(
            Buffer.from(generatedMedia.data, 'base64'),
            storyId,
            type
          );

          console.log('✅ Image generated and uploaded:', imageUrl);
          return {
            success: true,
            imageUrl,
            method: 'gemini-2.5-flash-image',
          };
        }
      }

      // If no image was generated but we got text, log it
      if (result.text) {
        console.log('📝 Gemini provided description instead of image:', result.text.substring(0, 200));
      }

    } catch (error) {
      console.warn('⚠️ Gemini image generation failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback to placeholder
    console.log('📦 Using placeholder image as fallback');
    const placeholderUrl = generatePlaceholder(prompt, type);

    return {
      success: true,
      imageUrl: placeholderUrl,
      method: 'placeholder',
    };

  } catch (error) {
    console.error(`❌ Error in image generation:`, error);

    // Return placeholder on any error
    const placeholderUrl = generatePlaceholder(prompt, type);
    return {
      success: false,
      imageUrl: placeholderUrl,
      method: 'placeholder_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate multiple images in batch
 */
export async function generateImagesInBatch(
  items: Array<{
    prompt: string;
    type: 'character' | 'setting' | 'scene';
    id: string;
    name: string;
  }>,
  storyId: string
): Promise<Map<string, ImageGenerationResult>> {
  const results = new Map<string, ImageGenerationResult>();

  // Process in smaller batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await generateImage(item.prompt, item.type, storyId);
        return { id: item.id, result };
      })
    );

    for (const { id, result } of batchResults) {
      results.set(id, result);
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}