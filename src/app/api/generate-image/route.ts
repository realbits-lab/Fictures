import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
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

    // Generate image using Gemini 2.5 Flash Image Preview
    const result = await generateText({
      model: google('gemini-2.5-flash-image-preview'),
      prompt: prompt,
    });

    console.log('✅ Image generated successfully');
    console.log('📝 Model response:', result.text);

    // Find the first image file in the response
    let imageFile = null;
    for (const file of result.files) {
      if (file.mediaType.startsWith('image/')) {
        imageFile = file;
        break;
      }
    }

    if (!imageFile) {
      throw new Error('No image file found in response');
    }

    // Upload to Vercel Blob
    const imageFileName = `${storyId}/${type}s/${nanoid()}.png`;
    const blob = await put(imageFileName, imageFile.uint8Array, {
      access: 'public',
      contentType: 'image/png',
    });

    console.log('✅ Image uploaded to Vercel Blob:', blob.url);

    // Convert uint8Array to base64 for response
    const base64 = Buffer.from(imageFile.uint8Array).toString('base64');

    return Response.json({
      success: true,
      imageUrl: blob.url,
      imageData: {
        base64: base64,
        mediaType: 'image/png'
      },
      modelResponse: result.text
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