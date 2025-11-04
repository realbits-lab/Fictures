/**
 * Comic Panel Generation API Endpoint
 *
 * POST /comics/api/generate-panels
 *
 * Generates comic panels for a scene using AI-powered toonplay conversion
 * and image generation. Streams progress updates via Server-Sent Events (SSE).
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { db } from '@/lib/db';
import { scenes, chapters, stories, characters, settings, comicPanels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateComicPanels } from '@/lib/ai/comic-panel-generator';
import type { HNSScene, HNSCharacter, HNSSetting } from '@/types/hns';

export const maxDuration = 300; // 5 minutes

interface GeneratePanelsRequest {
  sceneId: string;
  targetPanelCount?: number;
  regenerate?: boolean; // Delete existing panels and regenerate
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with dual auth (session or API key)
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check required scope for AI usage
    if (!hasRequiredScope(authResult, 'ai:use')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Required scope: ai:use' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: GeneratePanelsRequest = await request.json();
    const { sceneId, targetPanelCount, regenerate = false } = body;

    if (!sceneId) {
      return new Response(JSON.stringify({ error: 'sceneId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate targetPanelCount (8-12 panels per scene recommended)
    if (targetPanelCount !== undefined && (targetPanelCount < 1 || targetPanelCount > 12)) {
      return new Response(JSON.stringify({ error: 'targetPanelCount must be between 1 and 12' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch scene with chapter and story
    const scene = await db.query.scenes.findFirst({
      where: eq(scenes.id, sceneId),
      with: {
        chapter: {
          with: {
            story: true,
          },
        },
      },
    });

    if (!scene || !scene.chapter || !('story' in scene.chapter) || !scene.chapter.story) {
      return new Response(JSON.stringify({ error: 'Scene not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract story for type safety
    const story = scene.chapter.story;

    // Verify ownership
    if (story.authorId !== authResult.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden - You do not own this story' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if panels already exist
    if (!regenerate) {
      const existingPanels = await db.query.comicPanels.findFirst({
        where: eq(comicPanels.sceneId, sceneId),
      });

      if (existingPanels) {
        return new Response(
          JSON.stringify({ error: 'Panels already exist for this scene. Set regenerate=true to overwrite.' }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Delete existing panels if regenerating
      await db.delete(comicPanels).where(eq(comicPanels.sceneId, sceneId));
    }

    // Fetch characters for this story
    const storyCharacters = await db.query.characters.findMany({
      where: eq(characters.storyId, story.id),
    });

    // Fetch settings for this story
    const storySettings = await db.query.settings.findMany({
      where: eq(settings.storyId, story.id),
    });

    // Use the first setting or create a default one
    const primarySetting = storySettings[0] || {
      id: 'default',
      name: 'Default Setting',
      description: 'A generic setting',
      mood: 'neutral',
      sensory: null,
      visualStyle: null,
      visualReferences: null,
      colorPalette: null,
      architecturalStyle: null,
      imageUrl: null,
      imageVariants: null,
      storyId: story.id,
      adversityElements: null,
      symbolicMeaning: null,
      cycleAmplification: null,
      emotionalResonance: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set up SSE streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: 'start', message: 'Starting panel generation...' });

          // Generate panels with progress callback
          const result = await generateComicPanels({
            sceneId,
            scene: scene as unknown as HNSScene,
            characters: storyCharacters as unknown as HNSCharacter[],
            setting: primarySetting as unknown as HNSSetting,
            story: {
              story_id: story.id,
              genre: story.genre || 'drama',
            },
            targetPanelCount,
            progressCallback: (current: number, total: number, status: string) => {
              sendEvent({
                type: 'progress',
                current,
                total,
                status,
              });
            },
          });

          // Send completion event
          sendEvent({
            type: 'complete',
            result: {
              toonplay: result.toonplay,
              panels: result.panels.map(p => ({
                id: p.id,
                panel_number: p.panel_number,
                shot_type: p.shot_type,
                image_url: p.image_url,
                narrative: p.narrative,
                dialogue: p.dialogue,
                sfx: p.sfx,
              })),
              metadata: result.metadata,
            },
          });

          controller.close();
        } catch (error) {
          console.error('Panel generation error:', error);
          sendEvent({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Panel generation API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
