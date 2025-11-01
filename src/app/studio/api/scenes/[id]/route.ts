import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, chapters, stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { RelationshipManager } from '@/lib/db/relationships';

export const runtime = 'nodejs';

const updateSceneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  goal: z.string().optional(),
  conflict: z.string().optional(),
  outcome: z.string().optional(),
});

// GET /api/scenes/[id] - Get scene details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    // Get scene details
    const [scene] = await db.select().from(scenes).where(eq(scenes.id, id));
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Get chapter details for access control
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, scene.chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get story details for access control
    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check access permissions
    if (!session?.user?.id || (story.authorId !== session.user.id && story.status !== 'published')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ 
      scene: {
        ...scene,
        chapter: {
          id: chapter.id,
          title: chapter.title,
          storyId: chapter.storyId
        },
        story: {
          id: story.id,
          title: story.title,
          authorId: story.authorId
        }
      }
    });
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/scenes/[id] - Update scene
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSceneSchema.parse(body);

    // Get scene and verify ownership
    const [existingScene] = await db.select().from(scenes).where(eq(scenes.id, id));
    if (!existingScene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Check chapter and story ownership
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, existingScene.chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update scene
    const [updatedScene] = await db.update(scenes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, id))
      .returning();

    // Check if all scenes in the chapter have content
    // If so, automatically update chapter status to 'published'
    if (validatedData.content && validatedData.content.trim().length > 0) {
      // Get all scenes for this chapter
      const chapterScenes = await db.select()
        .from(scenes)
        .where(eq(scenes.chapterId, chapter.id));

      // Check if all scenes have content
      const allScenesHaveContent = chapterScenes.every(scene =>
        scene.content && scene.content.trim().length > 0
      );

      if (allScenesHaveContent && chapter.status === 'writing') {
        // Update chapter status to published
        await db.update(chapters)
          .set({
            status: 'published',
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chapters.id, chapter.id));

        console.log(`🎉 Chapter "${chapter.title}" automatically published - all scenes have content`);
      }
    }

    return NextResponse.json({
      scene: updatedScene,
      chapterAutoPublished: validatedData.content && validatedData.content.trim().length > 0
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/scenes/[id] - Delete scene
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get scene and verify ownership
    const [existingScene] = await db.select().from(scenes).where(eq(scenes.id, id));
    if (!existingScene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Check chapter and story ownership
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, existingScene.chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete scene using RelationshipManager for bi-directional consistency
    await RelationshipManager.deleteScene(id);

    return NextResponse.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}