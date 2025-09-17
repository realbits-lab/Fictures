import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
import { experimental_generateImage as generateImage } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Authentication required', { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, type, storyId } = body;

    if (!prompt || !type || !storyId) {
      return new Response('Missing required fields: prompt, type, storyId', { status: 400 });
    }

    if (!['character', 'place'].includes(type)) {
      return new Response('Type must be either "character" or "place"', { status: 400 });
    }

    console.log(`🎨 Generating ${type} image with prompt:`, prompt);

    // Generate image using Gemini
    const { image } = await generateImage({
      model: google.image('imagen-3.0-generate-002'),
      prompt: prompt,
      aspectRatio: '1:1', // Square images for character/place portraits
      providerOptions: {
        google: {
          personGeneration: type === 'character' ? 'allow' : 'dont_allow',
        }
      }
    });

    console.log('✅ Image generated successfully');

    // Upload to Vercel Blob
    const imageFileName = `${storyId}/${type}s/${nanoid()}.png`;
    const blob = await put(imageFileName, image.uint8Array, {
      access: 'public',
      contentType: 'image/png',
    });

    console.log('✅ Image uploaded to Vercel Blob:', blob.url);

    return Response.json({
      success: true,
      imageUrl: blob.url,
      imageData: {
        base64: image.base64,
        mediaType: 'image/png'
      }
    });

  } catch (error) {
    console.error(`❌ Error generating ${body?.type || 'unknown'} image:`, error);

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