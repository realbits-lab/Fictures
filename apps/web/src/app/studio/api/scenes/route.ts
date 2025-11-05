import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, chapters, stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { RelationshipManager } from '@/lib/db/relationships';

export const runtime = 'nodejs';

const createSceneSchema = z.object({
  title: z.string().min(1).max(255),
  chapterId: z.string(),
  orderIndex: z.number().min(1),
  goal: z.string().optional(),
  conflict: z.string().optional(),
  outcome: z.string().optional(),
});

// GET /api/scenes - Get scenes for a chapter
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    
    if (!chapterId) {
      return NextResponse.json({ error: 'chapterId parameter is required' }, { status: 400 });
    }

    // Get chapter and check access
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get story and check access permissions
    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check access permissions
    if (!session?.user?.id || (story.authorId !== session.user.id && story.status !== 'published')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get scenes for the chapter
    const chapterScenes = await db.select().from(scenes)
      .where(eq(scenes.chapterId, chapterId))
      .orderBy(scenes.orderIndex);

    return NextResponse.json({ 
      scenes: chapterScenes.map(scene => ({
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
      }))
    });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/scenes - Create a new scene
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSceneSchema.parse(body);

    // Verify user owns the chapter (through story)
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, validatedData.chapterId));
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 });
    }

    // Check if orderIndex is unique for this chapter
    const existingScene = await db.select().from(scenes)
      .where(and(eq(scenes.chapterId, validatedData.chapterId), eq(scenes.orderIndex, validatedData.orderIndex)));

    if (existingScene.length > 0) {
      return NextResponse.json(
        { error: 'A scene with this order index already exists for this chapter' },
        { status: 400 }
      );
    }

    // Create the scene using RelationshipManager for bi-directional consistency
    const sceneId = await RelationshipManager.addSceneToChapter(
      validatedData.chapterId,
      {
        title: validatedData.title,
        content: '', // Empty content initially
        orderIndex: validatedData.orderIndex,
      }
    );

    // Get the created scene for response
    const [newScene] = await db.select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    return NextResponse.json({ scene: newScene }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}