import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateStoryImage, buildStoryImagePrompt } from '@/lib/services/image-generation';
import { db } from '@/lib/db';
import { stories, chapters, scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      prompt,
      storyId,
      chapterId,
      sceneId,
      style = 'vivid',
      quality = 'standard',
      autoPrompt = false,
    } = body;

    // Validate request
    if (!prompt && !autoPrompt) {
      return new Response(
        JSON.stringify({ error: 'Either prompt or autoPrompt must be provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check ownership if storyId is provided
    if (storyId) {
      const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
      if (!story || story.authorId !== session.user.id) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('🎨 Generating story image...');

    let finalPrompt = prompt;

    // Auto-generate prompt from story context if requested
    if (autoPrompt && storyId) {
      const [story] = await db.select().from(stories).where(eq(stories.id, storyId));

      if (story) {
        finalPrompt = buildStoryImagePrompt({
          imageType: 'story',
          title: story.title,
          description: story.summary || undefined,
          genre: story.genre || undefined,
        });

        console.log('📝 Auto-generated prompt:', finalPrompt);
      }
    }

    // Determine image type based on context
    const imageType = sceneId ? 'scene' : 'story';

    // Generate image
    const result = await generateStoryImage({
      prompt: finalPrompt,
      storyId,
      imageType,
      chapterId,
      sceneId,
      style,
      quality,
    });

    console.log('✅ Image generated successfully:', result.url);

    // Return the generated image data
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image generated successfully',
        image: {
          url: result.url,
          blobUrl: result.blobUrl,
          width: result.width,
          height: result.height,
          size: result.size,
          aspectRatio: '16:9',
        },
        prompt: finalPrompt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error generating image:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// GET endpoint to show API documentation
export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Story Image Generation API',
      summary: 'Generate story illustrations using DALL-E 3 with 16:9 aspect ratio (1792x1024)',
      usage: 'POST with appropriate parameters',
      parameters: {
        prompt: {
          type: 'string',
          required: 'conditional',
          summary: 'Image generation prompt (required if autoPrompt is false)',
          example: 'A mysterious forest at twilight with ancient trees, cinematic composition',
        },
        storyId: {
          type: 'string',
          required: false,
          summary: 'Story ID for context and ownership verification',
        },
        chapterId: {
          type: 'string',
          required: false,
          summary: 'Chapter ID for organizing generated images',
        },
        sceneId: {
          type: 'string',
          required: false,
          summary: 'Scene ID for organizing generated images',
        },
        style: {
          type: 'string',
          required: false,
          default: 'vivid',
          options: ['vivid', 'natural'],
          summary: 'Image style - vivid for hyper-real, natural for realistic',
        },
        quality: {
          type: 'string',
          required: false,
          default: 'standard',
          options: ['standard', 'hd'],
          summary: 'Image quality level',
        },
        autoPrompt: {
          type: 'boolean',
          required: false,
          default: false,
          summary: 'Auto-generate prompt from story context (requires storyId)',
        },
      },
      response: {
        success: true,
        message: 'Image generated successfully',
        image: {
          url: 'https://blob.vercel-storage.com/...',
          blobUrl: 'https://blob.vercel-storage.com/...',
          width: 1792,
          height: 1024,
          size: 2846330,
          aspectRatio: '16:9',
        },
        prompt: 'The final prompt used for generation',
      },
      example: {
        prompt: 'A cyberpunk city street at night with neon signs, rain-soaked pavement, cinematic widescreen composition',
        storyId: 'story_abc123',
        style: 'vivid',
        quality: 'standard',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
