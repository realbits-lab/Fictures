import { gateway } from '@ai-sdk/gateway';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { IMAGE_GENERATION_MODEL } from './config';

export type AnimationStyle =
  | 'anime'
  | 'studio-ghibli'
  | 'pixar'
  | 'disney'
  | 'cartoon'
  | 'manga'
  | 'chibi'
  | 'comic-book'
  | 'watercolor'
  | 'pixel-art'
  | 'claymation'
  | 'retro-animation'
  | 'realistic'
  | 'fantasy-art';

export interface ImageGenerationOptions {
  style?: AnimationStyle;
  quality?: 'standard' | 'high' | 'ultra';
  /**
   * Aspect ratio preference for image generation.
   *
   * NOTE: With Gemini 2.5 Flash Image Preview, this parameter is used for:
   * - Placeholder image dimensions (if generation fails)
   * - Prompt enhancement to guide composition
   *
   * Gemini does NOT support explicit size/aspect ratio control through the API.
   * Images are generated at the model's default resolution.
   *
   * For 16:9 ratio images, use 'landscape' which will:
   * - Guide the model to create landscape-oriented compositions via prompt
   * - Generate 1024x768 placeholders (closest to 16:9 available)
   *
   * If you need exact 16:9 (1792x1024), consider:
   * - Switching to DALL-E 3 (supports 1792x1024, 1024x1792, 1024x1024)
   * - Post-processing Gemini images to crop/resize to desired ratio
   */
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  mood?: string;
  lighting?: string;
  cameraAngle?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  method: string;
  error?: string;
  style?: AnimationStyle;
}

/**
 * Get style-specific prompt enhancements
 */
function getStylePrompt(style: AnimationStyle = 'fantasy-art'): string {
  const stylePrompts: Record<AnimationStyle, string> = {
    'anime': 'anime style, large expressive eyes, Japanese animation aesthetics, vibrant colors, cel-shaded, clean lines',
    'studio-ghibli': 'Studio Ghibli style, whimsical, soft watercolor textures, dreamy atmosphere, detailed backgrounds, hand-drawn animation feel',
    'pixar': 'Pixar 3D animation style, rounded shapes, smooth rendering, vibrant saturated colors, expressive characters, cinematic lighting',
    'disney': 'Disney animation style, classic fairy tale aesthetic, smooth lines, warm colors, magical atmosphere, expressive features',
    'cartoon': 'cartoon style, bold outlines, simplified shapes, bright colors, exaggerated features, playful aesthetic',
    'manga': 'manga style, black and white ink drawing, detailed linework, dramatic shading, Japanese comic art style',
    'chibi': 'cute chibi style, super deformed, oversized head, small body, kawaii aesthetic, adorable expressions',
    'comic-book': 'comic book style, bold outlines, dynamic poses, vibrant colors, ben day dots, action-oriented composition',
    'watercolor': 'watercolor painting style, soft edges, flowing colors, artistic brushstrokes, transparent layers, dreamy quality',
    'pixel-art': 'pixel art style, 16-bit aesthetic, limited color palette, blocky design, retro video game graphics',
    'claymation': 'claymation style, 3D clay figures, stop-motion aesthetic, textured surfaces, Wallace and Gromit style',
    'retro-animation': 'retro rubber hose animation style, 1930s cartoon aesthetic, flexible characters, vintage color palette',
    'realistic': 'photorealistic style, highly detailed, natural lighting, realistic proportions and textures',
    'fantasy-art': 'fantasy art style, magical atmosphere, detailed illustration, epic composition, rich colors, ethereal quality'
  };

  return stylePrompts[style] || stylePrompts['fantasy-art'];
}

/**
 * Get aspect ratio dimensions for image generation.
 *
 * IMPORTANT: These dimensions are currently used ONLY for placeholder images.
 * Gemini 2.5 Flash Image Preview does not support explicit size/aspect ratio parameters.
 *
 * For 16:9 ratio images:
 * - Landscape setting (1024x768) is closest available for placeholders
 * - Actual ratio: ~1.33:1 (not true 16:9 which is 1.78:1)
 * - True 16:9 would be 1792x1008 or 1024x576
 *
 * If exact 16:9 is required, consider:
 * - DALL-E 3: Supports 1792x1024 (~1.75:1, closest to 16:9)
 * - Post-processing: Crop Gemini output to exact 16:9
 *
 * @param aspectRatio - Desired aspect ratio (portrait/landscape/square)
 * @param type - Image type (character/setting/scene/story)
 * @returns Dimension string in format "WIDTHxHEIGHT" (used for placeholders only)
 */
function getImageDimensions(aspectRatio: 'portrait' | 'landscape' | 'square' = 'square', type: string): string {
  if (type === 'character') {
    switch (aspectRatio) {
      case 'portrait': return '512x768';
      case 'landscape': return '768x512';
      case 'square': return '512x512';
    }
  } else if (type === 'story') {
    // Story images are typically book covers, use portrait
    switch (aspectRatio) {
      case 'portrait': return '768x1152';  // Book cover ratio
      case 'landscape': return '1152x768';
      case 'square': return '1024x1024';
    }
  } else {
    switch (aspectRatio) {
      case 'portrait': return '768x1024';
      case 'landscape': return '1024x768';  // Closest to 16:9 available (~1.33:1)
      case 'square': return '768x768';
    }
  }
}

/**
 * Build enhanced prompt with style and options.
 *
 * Adds aspect ratio guidance to help Gemini generate images closer to desired composition.
 * Note: This is guidance only - Gemini does not guarantee exact aspect ratios.
 */
function buildEnhancedPrompt(
  basePrompt: string,
  type: 'character' | 'setting' | 'scene' | 'story',
  options: ImageGenerationOptions = {}
): string {
  const {
    style = 'fantasy-art',
    mood,
    lighting,
    cameraAngle,
    aspectRatio = 'square'
  } = options;

  let enhancedPrompt = '';

  if (type === 'character') {
    enhancedPrompt = `Create a detailed character portrait: ${basePrompt}`;
  } else if (type === 'setting' || type === 'scene') {
    enhancedPrompt = `Create a detailed environment scene: ${basePrompt}`;
  } else if (type === 'story') {
    enhancedPrompt = `Create an epic story cover art illustration: ${basePrompt}`;
  }

  enhancedPrompt += `, ${getStylePrompt(style)}`;

  // Add aspect ratio guidance to prompt (for composition, not exact dimensions)
  if (aspectRatio === 'landscape') {
    enhancedPrompt += ', wide landscape orientation, horizontal composition, 16:9 cinematic aspect ratio';
  } else if (aspectRatio === 'portrait') {
    enhancedPrompt += ', vertical portrait orientation, tall composition';
  } else {
    enhancedPrompt += ', square composition, balanced framing';
  }

  if (mood) {
    enhancedPrompt += `, ${mood} mood`;
  }

  if (lighting) {
    enhancedPrompt += `, ${lighting} lighting`;
  }

  if (cameraAngle && type !== 'character') {
    enhancedPrompt += `, ${cameraAngle} camera angle`;
  }

  if (type === 'character') {
    enhancedPrompt += ', character focus, detailed facial features';
  } else if (type === 'story') {
    enhancedPrompt += ', cinematic composition, book cover style, dramatic lighting, storytelling atmosphere';
  } else {
    enhancedPrompt += ', environmental storytelling, atmospheric perspective';
  }

  enhancedPrompt += ', masterpiece quality, highly detailed, professional artwork';

  return enhancedPrompt;
}

/**
 * Generate a placeholder image URL based on the type and prompt.
 * Uses getImageDimensions to respect aspectRatio preference.
 */
function generatePlaceholder(
  prompt: string,
  type: string,
  aspectRatio: 'portrait' | 'landscape' | 'square' = 'square'
): string {
  const placeholderService = 'https://picsum.photos';
  const uniqueString = `${prompt}_${type}_${Date.now()}`;
  const hash = uniqueString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const imageId = Math.abs(hash) % 1000 + 100; // Range 100-1099

  // Get dimensions based on type and aspect ratio
  const dimensions = getImageDimensions(aspectRatio, type);
  const [width, height] = dimensions.split('x');

  return `${placeholderService}/${width}/${height}?random=${imageId}&blur=0`;
}

/**
 * Resize image to 640x360 (16:9 ratio) using Sharp
 */
async function resizeImageTo640x360(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(640, 360, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toBuffer();
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
 * Generate an image using DALL-E 3 and resize to 640x360.
 *
 * IMAGE GENERATION PROCESS:
 * 1. Generate image using DALL-E 3 at 1792x1024 (16:9 ratio)
 * 2. Resize/crop to 640x360 using Sharp
 * 3. Upload resized image to Vercel Blob storage
 *
 * @param prompt - Image generation prompt
 * @param type - Image type (character/setting/scene/story)
 * @param storyId - Story ID for blob storage path
 * @param options - Generation options (style, aspectRatio, quality, etc.)
 * @returns Promise with generation result including imageUrl
 */
export async function generateImage(
  prompt: string,
  type: 'character' | 'setting' | 'scene' | 'story',
  storyId: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  try {
    console.log(`🎨 Generating ${type} image with style: ${options.style || 'fantasy-art'}`);
    console.log(`📝 Base prompt: ${prompt.substring(0, 100)}...`);

    // Build enhanced prompt with style options
    const enhancedPrompt = buildEnhancedPrompt(prompt, type, options);
    console.log(`✨ Enhanced prompt: ${enhancedPrompt.substring(0, 150)}...`);

    // Try DALL-E 3 with 16:9 ratio (1792x1024)
    try {
      console.log('🔄 Attempting DALL-E 3 image generation at 1792x1024...');

      const result = await experimental_generateImage({
        model: openai.image('dall-e-3'),
        prompt: enhancedPrompt,
        size: '1792x1024',
        // @ts-ignore - quality property may not be in type definition
        quality: options.quality === 'ultra' ? 'hd' : 'standard',
      });

      if (result.image) {
        console.log('✅ DALL-E 3 image generated, resizing to 640x360...');

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(result.image.base64, 'base64');

        // Resize to 640x360
        const resizedBuffer = await resizeImageTo640x360(imageBuffer);

        // Upload resized image to Vercel Blob
        const imageUrl = await uploadToBlob(
          resizedBuffer,
          storyId,
          type
        );

        console.log('✅ Image resized and uploaded:', imageUrl);
        return {
          success: true,
          imageUrl,
          method: 'dall-e-3-resized',
          style: options.style,
        };
      }

    } catch (error) {
      console.warn('⚠️ DALL-E 3 image generation failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback to placeholder
    console.log('📦 Using placeholder image as fallback');
    const placeholderUrl = generatePlaceholder(prompt, type, options.aspectRatio);

    return {
      success: true,
      imageUrl: placeholderUrl,
      method: 'placeholder',
      style: options.style,
    };

  } catch (error) {
    console.error(`❌ Error in image generation:`, error);

    // Return placeholder on any error
    const placeholderUrl = generatePlaceholder(prompt, type, options.aspectRatio);
    return {
      success: false,
      imageUrl: placeholderUrl,
      method: 'placeholder_error',
      error: error instanceof Error ? error.message : 'Unknown error',
      style: options.style,
    };
  }
}

/**
 * Generate multiple images in batch
 */
export async function generateImagesInBatch(
  items: Array<{
    prompt: string;
    type: 'character' | 'setting' | 'scene' | 'story';
    id: string;
    name: string;
    options?: ImageGenerationOptions;
  }>,
  storyId: string,
  defaultOptions?: ImageGenerationOptions
): Promise<Map<string, ImageGenerationResult>> {
  const results = new Map<string, ImageGenerationResult>();

  // Process in smaller batches to avoid rate limits
  const batchSize = 3;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const options = { ...defaultOptions, ...item.options };
        const result = await generateImage(item.prompt, item.type, storyId, options);
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