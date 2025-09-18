import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

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

    if (!['character', 'place'].includes(type)) {
      return new Response('Type must be either "character" or "place"', { status: 400 });
    }

    console.log(`🎨 Generating ${type} image with prompt:`, prompt);

    // Try to generate image using Gemini first, fallback to placeholder if quota exceeded
    let imageUrl = null;
    let modelResponse = '';
    let method = 'placeholder';

    try {
      // Try Gemini 2.5 Flash first
      console.log('🔄 Attempting image generation with Gemini...');
      const result = await generateText({
        model: google('gemini-2.5-flash-image-preview'),
        prompt: prompt,
      });

      console.log('✅ Gemini response received');
      modelResponse = result.text;

      // Find the first image file in the response
      let imageFile = null;
      if (result.files && result.files.length > 0) {
        for (const file of result.files) {
          if (file.mediaType.startsWith('image/')) {
            imageFile = file;
            break;
          }
        }
      }

      if (imageFile) {
        // Upload to Vercel Blob
        const imageFileName = `${storyId}/${type}s/${nanoid()}.png`;
        const blob = await put(imageFileName, imageFile.uint8Array, {
          access: 'public',
          contentType: 'image/png',
        });

        imageUrl = blob.url;
        method = 'gemini';
        console.log('✅ Image uploaded to Vercel Blob:', blob.url);
      } else {
        throw new Error('No image file found in Gemini response');
      }

    } catch (error) {
      console.warn('⚠️ Gemini image generation failed:', error instanceof Error ? error.message : 'Unknown error');

      // Check if it's a quota error
      if (error instanceof Error && (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        console.log('📦 Using placeholder image due to API quota limits');
        method = 'placeholder_quota';
      } else {
        console.log('📦 Using placeholder image due to generation failure');
        method = 'placeholder_error';
      }

      // Generate a unique placeholder image URL based on the prompt and storyId
      const placeholderService = 'https://picsum.photos';
      const uniqueString = `${prompt}_${storyId}_${type}_${Date.now()}`;
      const hash = uniqueString.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      const imageId = Math.abs(hash) % 1000 + 100; // Range 100-1099

      if (type === 'character') {
        // Use a portrait-oriented placeholder for characters with unique seed
        imageUrl = `${placeholderService}/400/600?random=${imageId}&blur=0`;
      } else {
        // Use a landscape-oriented placeholder for places with unique seed
        imageUrl = `${placeholderService}/600/400?random=${imageId}&blur=0`;
      }

      modelResponse = `Placeholder ${type} image generated due to API limitations. Original prompt: ${prompt}`;
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