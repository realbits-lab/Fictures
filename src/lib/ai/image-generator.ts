import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

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
 * Get aspect ratio dimensions for image generation
 */
function getImageDimensions(aspectRatio: 'portrait' | 'landscape' | 'square' = 'square', type: string): string {
  if (type === 'character') {
    switch (aspectRatio) {
      case 'portrait': return '512x768';
      case 'landscape': return '768x512';
      case 'square': return '512x512';
    }
  } else {
    switch (aspectRatio) {
      case 'portrait': return '768x1024';
      case 'landscape': return '1024x768';
      case 'square': return '768x768';
    }
  }
}

/**
 * Build enhanced prompt with style and options
 */
function buildEnhancedPrompt(
  basePrompt: string,
  type: 'character' | 'setting' | 'scene',
  options: ImageGenerationOptions = {}
): string {
  const {
    style = 'fantasy-art',
    mood,
    lighting,
    cameraAngle
  } = options;

  let enhancedPrompt = '';

  if (type === 'character') {
    enhancedPrompt = `Create a detailed character portrait: ${basePrompt}`;
  } else if (type === 'setting' || type === 'scene') {
    enhancedPrompt = `Create a detailed environment scene: ${basePrompt}`;
  }

  enhancedPrompt += `, ${getStylePrompt(style)}`;

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
  } else {
    enhancedPrompt += ', environmental storytelling, atmospheric perspective';
  }

  enhancedPrompt += ', masterpiece quality, highly detailed, professional artwork';

  return enhancedPrompt;
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
  storyId: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  try {
    console.log(`🎨 Generating ${type} image with style: ${options.style || 'fantasy-art'}`);
    console.log(`📝 Base prompt:`, prompt.substring(0, 100) + '...');

    // Build enhanced prompt with style options
    const enhancedPrompt = buildEnhancedPrompt(prompt, type, options);
    console.log(`✨ Enhanced prompt:`, enhancedPrompt.substring(0, 150) + '...');

    const dimensions = getImageDimensions(options.aspectRatio, type);
    const quality = options.quality || 'high';

    // Try Gemini 2.5 Flash Image Preview
    try {
      console.log('🔄 Attempting Gemini 2.5 Flash Image generation...');

      const result = await generateText({
        model: google('gemini-2.5-flash-image-preview'),
        prompt: enhancedPrompt,
        providerOptions: {
          google: {
            generateImage: true,  // Enable image generation
            imageSize: dimensions,
            imageQuality: quality,
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
            style: options.style,
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
      style: options.style,
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
    type: 'character' | 'setting' | 'scene';
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