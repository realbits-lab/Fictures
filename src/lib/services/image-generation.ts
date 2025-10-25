import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { put } from '@vercel/blob';

export interface GenerateStoryImageParams {
  prompt: string;
  storyId?: string;
  chapterId?: string;
  sceneId?: string;
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
}

export interface GenerateStoryImageResult {
  url: string;
  blobUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Generate a story illustration using DALL-E 3
 * Always generates 1792x1024 (16:9) widescreen images
 */
export async function generateStoryImage({
  prompt,
  storyId,
  chapterId,
  sceneId,
  style = 'vivid',
  quality = 'standard',
}: GenerateStoryImageParams): Promise<GenerateStoryImageResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment variables');
  }

  const openaiProvider = createOpenAI({
    apiKey: apiKey,
  });

  // Generate image with DALL-E 3
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

  // Generate filename
  const timestamp = Date.now();
  const context = [storyId, chapterId, sceneId].filter(Boolean).join('-');
  const filename = `story-images/${context || 'general'}-${timestamp}.png`;

  // Upload to Vercel Blob
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return {
    url: blob.url,
    blobUrl: blob.url,
    width: 1792,
    height: 1024,
    size: buffer.length,
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
