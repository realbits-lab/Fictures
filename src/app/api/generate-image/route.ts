import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { generateImage, type AnimationStyle, type ImageGenerationOptions } from '@/lib/ai/image-generator';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { prompt, type, storyId, internal, style, quality, aspectRatio, mood, lighting, cameraAngle } = body;

    // Check authentication (skip for internal server-to-server calls)
    if (!internal) {
      const authResult = await authenticateRequest(request);
      if (!authResult) {
        return new Response('Authentication required', { status: 401 });
      }
      // Check for AI usage permission
      if (!hasRequiredScope(authResult, 'ai:use')) {
        return new Response('Insufficient permissions. Required scope: ai:use', { status: 403 });
      }
    }

    if (!prompt || !type || !storyId) {
      return new Response('Missing required fields: prompt, type, storyId', { status: 400 });
    }

    if (!['character', 'place', 'scene', 'setting', 'general'].includes(type)) {
      return new Response('Type must be "character", "place", "scene", "setting", or "general"', { status: 400 });
    }

    // Map 'place' and 'general' to appropriate types
    const mappedType = type === 'place' ? 'setting' : type === 'general' ? 'scene' : type;

    console.log(`🎨 Generating ${type} image with style: ${style || 'fantasy-art'}`);

    // Build options for image generation
    const options: ImageGenerationOptions = {
      style: style as AnimationStyle,
      quality,
      aspectRatio,
      mood,
      lighting,
      cameraAngle
    };

    // Generate image using the updated image-generator module
    const result = await generateImage(prompt, mappedType as 'character' | 'setting' | 'scene', storyId, options);

    return Response.json({
      success: result.success,
      imageUrl: result.imageUrl,
      method: result.method,
      style: result.style,
      type: type,
      prompt: prompt,
      error: result.error
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