/**
 * Webtoon Panels Retrieval API Endpoint
 *
 * GET /api/webtoon/{sceneId}/panels
 *
 * Retrieves all webtoon panels for a specific scene, including layout information.
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { webtoonPanels, scenes, chapters, stories } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { calculateVerticalLayout, estimateReadingTime, calculatePanelDensity } from '@/lib/services/webtoon-layout';

interface RouteContext {
  params: Promise<{
    sceneId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sceneId } = await context.params;

    // Fetch scene to verify ownership
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

    // Check if story is published or user is owner
    const session = await auth();
    const isOwner = session?.user?.email === scene.chapter.story.userId;
    const isPublished = scene.chapter.story.visibility === 'public';

    if (!isPublished && !isOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all panels for this scene, ordered by panel number
    const panels = await db.query.webtoonPanels.findMany({
      where: eq(webtoonPanels.sceneId, sceneId),
      orderBy: [asc(webtoonPanels.panelNumber)],
    });

    if (panels.length === 0) {
      return new Response(
        JSON.stringify({
          sceneId,
          panels: [],
          layout: null,
          metadata: {
            total_panels: 0,
            total_height: 0,
            estimated_reading_time: '0s',
            pacing: 'moderate',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate layout information
    const layoutInfo = calculateVerticalLayout(
      panels.map(p => ({
        id: p.id,
        panel_number: p.panelNumber,
        gutter_after: p.gutterAfter || 200,
      }))
    );

    // Calculate reading time
    const readingTime = estimateReadingTime(
      panels.map(p => ({
        dialogue: p.dialogue as Array<{ text: string }> || [],
        sfx: p.sfx as Array<{ text: string }> || [],
      }))
    );

    // Calculate panel density
    const densityInfo = calculatePanelDensity(panels.length, layoutInfo.total_height);

    // Prepare response
    const response = {
      sceneId,
      sceneTitle: scene.sceneTitle || scene.title,
      panels: panels.map((panel, index) => ({
        id: panel.id,
        panel_number: panel.panelNumber,
        shot_type: panel.shotType,
        image_url: panel.imageUrl,
        image_variants: panel.imageVariants,
        dialogue: panel.dialogue,
        sfx: panel.sfx,
        gutter_after: panel.gutterAfter,
        layout: layoutInfo.panels[index],
        metadata: panel.metadata,
      })),
      layout: {
        total_height: layoutInfo.total_height,
        panel_positions: layoutInfo.panels,
      },
      metadata: {
        total_panels: panels.length,
        total_height: layoutInfo.total_height,
        estimated_reading_time: readingTime.formatted,
        pacing: densityInfo.pacing,
        density: densityInfo.density,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Panel retrieval API error:', error);
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
