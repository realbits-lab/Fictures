import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { gateway } from '@ai-sdk/gateway';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, type, storyId, internal } = body;

    // Check authentication (skip for internal server-to-server calls)
    if (!internal) {
      const session = await auth();
      if (!session?.user?.id) {
        return new Response('Authentication required', { status: 401 });
      }
    }

    if (!prompt || !type || !storyId) {
      return new Response('Missing required fields: prompt, type, storyId', { status: 400 });
    }

    if (!['character', 'place', 'scene', 'general'].includes(type)) {
      return new Response('Type must be "character", "place", "scene", or "general"', { status: 400 });
    }

    console.log(`🎨 Generating ${type} image with prompt:`, prompt);

    // Gemini image generation
    let imageUrl = null;
    let modelResponse = '';
    let method = 'placeholder';

    // Helper function to upload image to Vercel Blob
    const uploadToBlob = async (imageData: Uint8Array, contentType: string = 'image/png') => {
      const imageFileName = `${storyId}/${type}s/${nanoid()}.png`;
      const blob = await put(imageFileName, Buffer.from(imageData), {
        access: 'public',
        contentType,
      });
      return blob.url;
    };

    // Helper function to generate unique placeholder
    const generatePlaceholder = () => {
      const placeholderService = 'https://picsum.photos';
      const uniqueString = `${prompt}_${storyId}_${type}_${Date.now()}`;
      const hash = uniqueString.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      const imageId = Math.abs(hash) % 1000 + 100; // Range 100-1099

      if (type === 'character') {
        return `${placeholderService}/400/600?random=${imageId}&blur=0`;
      } else if (type === 'place' || type === 'scene' || type === 'general') {
        return `${placeholderService}/600/400?random=${imageId}&blur=0`;
      } else {
        return `${placeholderService}/500/500?random=${imageId}&blur=0`;
      }
    };

    // Primary: Gemini 2.5 Flash Image Preview
    try {
      console.log('🔄 Attempting image generation with Gemini 2.5 Flash Image Preview...');
      const result = await generateText({
        model: google('gemini-2.5-flash-image-preview'),
        prompt: `Generate a detailed ${type} image based on this prompt: ${prompt}`,
      });

      modelResponse = result.text;
      method = 'gemini_2.5_flash_image';

      // Check if the result contains generated image files
      if (result.files && result.files.length > 0) {
        console.log(`✅ Generated image for ${type}:`, result.files[0]);
        // TODO: Upload to Vercel Blob when file handling is implemented
        // imageUrl = await uploadToBlob(result.files[0]);
        imageUrl = generatePlaceholder(); // Using placeholder for now
      } else {
        // Fallback to placeholder if no image generated
        imageUrl = generatePlaceholder();
        console.log('✅ Gemini 2.5 Flash Image Preview provided description, using placeholder image:', imageUrl);
      }

    } catch (error) {
      console.warn('⚠️ Gemini 2.5 Flash Image Preview generation failed:', error instanceof Error ? error.message : 'Unknown error');

      // Check if it's a quota error
      if (error instanceof Error && (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        console.log('📦 Using placeholder image due to API quota limits');
        method = 'placeholder_quota';
      } else {
        console.log('📦 Using placeholder image due to generation failure');
        method = 'placeholder_error';
      }
    }

    // Final fallback: Placeholder image
    if (!imageUrl) {
      imageUrl = generatePlaceholder();
      modelResponse = `Placeholder ${type} image generated due to API limitations. Original prompt: ${prompt}`;
      console.log('📦 Using placeholder image:', imageUrl);
    }

    return Response.json({
      success: true,
      imageUrl: imageUrl,
      method: method,
      modelResponse: modelResponse,
      type: type,
      prompt: prompt
    });

  } catch (error) {
    console.error(`❌ Error generating image:`, error);

    return Response.json(
      {
        success: false,
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}