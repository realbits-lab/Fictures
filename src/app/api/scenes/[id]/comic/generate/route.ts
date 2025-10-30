import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, chapters, stories, characters, settings, comicPanels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateComicPanels } from '@/lib/ai/comic-panel-generator';
import type { HNSScene, HNSCharacter, HNSSetting } from '@/types/hns';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/scenes/[id]/comic/generate
 * Generate comic panels for a scene and set status to draft
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse optional parameters
    const body = await request.json().catch(() => ({}));
    const { targetPanelCount, regenerate = false } = body;

    // Validate targetPanelCount (8-12 panels recommended per scene)
    if (targetPanelCount !== undefined && (targetPanelCount < 1 || targetPanelCount > 12)) {
      return NextResponse.json(
        { error: 'targetPanelCount must be between 1 and 12 (recommended: 8-12 for optimal pacing)' },
        { status: 400 }
      );
    }

    // Fetch scene with chapter and story
    const scene = await db.query.scenes.findFirst({
      where: eq(scenes.id, id),
      with: {
        chapter: {
          with: {
            story: true,
          },
        },
      },
    });

    if (!scene || !scene.chapter || !('story' in scene.chapter) || !scene.chapter.story) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Extract story for type safety
    const story = scene.chapter.story;

    // Verify ownership (allow story owner or manager/admin)
    const isOwner = story.authorId === session.user.id;
    const isAdmin = session.user.role === 'manager' || session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if panels already exist
    if (!regenerate) {
      const existingPanels = await db.query.comicPanels.findFirst({
        where: eq(comicPanels.sceneId, id),
      });

      if (existingPanels) {
        return NextResponse.json(
          { error: 'Panels already exist for this scene. Set regenerate=true to overwrite.' },
          { status: 409 }
        );
      }
    } else {
      // Delete existing panels if regenerating
      await db.delete(comicPanels).where(eq(comicPanels.sceneId, id));
      console.log(`🔄 Regenerating comic panels for scene: ${scene.title}`);
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
      imageUrl: null,
      imageVariants: null,
      storyId: story.id,
      settingType: 'location',
      atmosphere: 'neutral',
      timeOfDay: null,
      weather: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`🎨 Generating comic panels for scene: ${scene.title}`);

    // Map database scene to HNS interface (database uses 'title', HNS uses 'scene_title')
    const hnsScene: Partial<HNSScene> = {
      scene_id: scene.id,
      scene_number: scene.orderIndex,
      scene_title: scene.title,
      chapter_ref: scene.chapterId,
      character_ids: Array.isArray(scene.characterIds) ? scene.characterIds : [],
      setting_id: scene.settingId || '',
      pov_character_id: scene.povCharacterId || undefined,
      goal: scene.goal || '',
      conflict: scene.conflict || '',
      outcome: scene.outcome || '',
      content: scene.content || '',
      emotional_shift: scene.emotionalShift as any,
      entry_hook: scene.entryHook || undefined,
      narrative_voice: scene.narrativeVoice || undefined,
      summary: scene.summary || undefined,
    };

    // Map database characters to HNS interface (minimal fields for comic generation)
    const hnsCharacters: Partial<HNSCharacter>[] = storyCharacters.map(char => ({
      character_id: char.id,
      name: char.name,
      role: char.role as any,
      summary: char.summary || char.description || '',
      motivations: char.motivations as any,
    }));

    // Map database setting to HNS interface (minimal fields for comic generation)
    const hnsSetting: Partial<HNSSetting> = {
      setting_id: primarySetting.id,
      name: primarySetting.name,
      description: primarySetting.description || '',
      mood: primarySetting.mood || 'neutral',
    };

    // Generate panels (cast partial types to full HNS types - generator handles missing fields)
    const result = await generateComicPanels({
      sceneId: id,
      scene: hnsScene as HNSScene,
      characters: hnsCharacters as HNSCharacter[],
      setting: hnsSetting as HNSSetting,
      story: {
        story_id: story.id,
        genre: story.genre || 'drama',
      },
      targetPanelCount,
    });

    // Update scene metadata with comic status
    const [updatedScene] = await db.update(scenes)
      .set({
        comicStatus: 'draft',
        comicGeneratedAt: new Date(),
        comicPanelCount: result.panels.length,
        comicVersion: (scene.comicVersion || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, id))
      .returning();

    console.log(`✅ Generated ${result.panels.length} comic panels for scene: ${scene.title}`);

    return NextResponse.json({
      success: true,
      message: 'Comic panels generated successfully',
      scene: {
        id: updatedScene.id,
        title: updatedScene.title,
        comicStatus: updatedScene.comicStatus,
        comicPanelCount: updatedScene.comicPanelCount,
        comicGeneratedAt: updatedScene.comicGeneratedAt,
        comicVersion: updatedScene.comicVersion,
      },
      result: {
        screenplay: result.screenplay,
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
  } catch (error) {
    console.error('Error generating comic:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
