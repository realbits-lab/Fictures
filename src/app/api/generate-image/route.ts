import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, experimental_generateImage as generateImage } from 'ai';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';

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

    // Enhanced provider fallback chain with AI Gateway integration
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
      } else {
        return `${placeholderService}/600/400?random=${imageId}&blur=0`;
      }
    };

    // Provider 1: OpenAI DALL-E via AI Gateway
    try {
      if (process.env.AI_GATEWAY_API_KEY) {
        console.log('🔄 Attempting image generation with OpenAI DALL-E via AI Gateway...');

        const aiGatewayClient = new OpenAI({
          apiKey: process.env.AI_GATEWAY_API_KEY,
          baseURL: 'https://ai-gateway.vercel.sh/v1',
        });

        const completion = await aiGatewayClient.chat.completions.create({
          model: 'openai/dall-e-3',
          messages: [{ role: 'user', content: prompt }],
          extra_body: { modalities: ['text', 'image'] },
          stream: false,
        } as any);

        const message = completion.choices[0].message as any;

        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
          const imageData = message.images[0];
          if (imageData.type === 'image_url' && imageData.image_url) {
            // Convert base64 to Uint8Array and upload to blob
            const base64Data = imageData.image_url.url.split(',')[1];
            const binaryData = new Uint8Array(Buffer.from(base64Data, 'base64'));

            imageUrl = await uploadToBlob(binaryData);
            method = 'ai_gateway_dalle';
            modelResponse = message.content || 'Image generated via AI Gateway with DALL-E';
            console.log('✅ Image generated via AI Gateway (DALL-E) and uploaded to Vercel Blob:', imageUrl);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ AI Gateway DALL-E generation failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Provider 2: Google Gemini via AI Gateway (if DALL-E failed)
    if (!imageUrl && process.env.AI_GATEWAY_API_KEY) {
      try {
        console.log('🔄 Attempting image generation with Gemini via AI Gateway...');

        const aiGatewayClient = new OpenAI({
          apiKey: process.env.AI_GATEWAY_API_KEY,
          baseURL: 'https://ai-gateway.vercel.sh/v1',
        });

        const completion = await aiGatewayClient.chat.completions.create({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: prompt }],
          extra_body: { modalities: ['text', 'image'] },
          stream: false,
        } as any);

        const message = completion.choices[0].message as any;

        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
          const imageData = message.images[0];
          if (imageData.type === 'image_url' && imageData.image_url) {
            // Convert base64 to Uint8Array and upload to blob
            const base64Data = imageData.image_url.url.split(',')[1];
            const binaryData = new Uint8Array(Buffer.from(base64Data, 'base64'));

            imageUrl = await uploadToBlob(binaryData);
            method = 'ai_gateway_gemini';
            modelResponse = message.content || 'Image generated via AI Gateway with Gemini';
            console.log('✅ Image generated via AI Gateway (Gemini) and uploaded to Vercel Blob:', imageUrl);
          }
        }
      } catch (error) {
        console.warn('⚠️ AI Gateway Gemini generation failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Provider 3: Direct Gemini (fallback from original implementation)
    if (!imageUrl) {
      try {
        console.log('🔄 Attempting image generation with direct Gemini...');
        const result = await generateText({
          model: google('gemini-2.5-flash-image-preview'),
          providerOptions: {
            google: { responseModalities: ['TEXT', 'IMAGE'] }
          },
          prompt: prompt,
        });

        console.log('✅ Direct Gemini response received');
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
          imageUrl = await uploadToBlob(imageFile.uint8Array);
          method = 'direct_gemini';
          console.log('✅ Image generated via direct Gemini and uploaded to Vercel Blob:', imageUrl);
        } else {
          throw new Error('No image file found in Gemini response');
        }

      } catch (error) {
        console.warn('⚠️ Direct Gemini image generation failed:', error instanceof Error ? error.message : 'Unknown error');

        // Check if it's a quota error
        if (error instanceof Error && (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED'))) {
          console.log('📦 Using placeholder image due to API quota limits');
          method = 'placeholder_quota';
        } else {
          console.log('📦 Using placeholder image due to generation failure');
          method = 'placeholder_error';
        }
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