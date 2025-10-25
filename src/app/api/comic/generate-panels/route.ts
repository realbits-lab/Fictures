/**
 * Comic Panel Generation API Endpoint
 *
 * POST /api/comic/generate-panels
 *
 * Generates comic panels for a scene using AI-powered screenplay conversion
 * and image generation. Streams progress updates via Server-Sent Events (SSE).
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
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
    // Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
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

    // Validate targetPanelCount (maximum 3 panels per scene)
    if (targetPanelCount !== undefined && (targetPanelCount < 1 || targetPanelCount > 3)) {
      return new Response(JSON.stringify({ error: 'targetPanelCount must be between 1 and 3' }), {
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

    if (!scene || !scene.chapter || !scene.chapter.story) {
      return new Response(JSON.stringify({ error: 'Scene not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    if (scene.chapter.story.userId !== session.user.email) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
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
      where: eq(characters.storyId, scene.chapter.story.id),
    });

    // Fetch settings for this story
    const storySettings = await db.query.settings.findMany({
      where: eq(settings.storyId, scene.chapter.story.id),
    });

    // Use the first setting or create a default one
    const primarySetting: HNSSetting = storySettings[0] || {
      setting_id: 'default',
      id: 'default',
      name: 'Default Setting',
      description: 'A generic setting',
      atmosphere: 'neutral',
      setting_type: 'location',
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
            setting: primarySetting,
            story: {
              story_id: scene.chapter.story.id,
              genre: scene.chapter.story.genre || 'drama',
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
              screenplay: result.screenplay,
              panels: result.panels.map(p => ({
                id: p.id,
                panel_number: p.panel_number,
                shot_type: p.shot_type,
                image_url: p.image_url,
                dialogue: p.dialogue,
                sfx: p.sfx,
                gutter_after: p.gutter_after,
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
