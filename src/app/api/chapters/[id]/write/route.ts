import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chapters, stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/chapters/[id]/write - Get chapter data for writing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get chapter with hnsData
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check ownership through story
    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse HNS data if it exists
    let parsedHnsData = null;
    if (chapter.hnsData) {
      try {
        parsedHnsData = typeof chapter.hnsData === 'object'
          ? chapter.hnsData
          : JSON.parse(chapter.hnsData as any);
      } catch (error) {
        console.error('Failed to parse chapter HNS data:', error);
      }
    }

    return NextResponse.json({
      chapter: {
        ...chapter,
        hnsData: parsedHnsData
      }
    });

  } catch (error) {
    console.error('Error fetching chapter data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/chapters/[id]/write - Update chapter HNS data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { hnsData } = await request.json();

    if (!hnsData) {
      return NextResponse.json({ error: 'Chapter data is required (hnsData)' }, { status: 400 });
    }

    // Get chapter and verify ownership
    const [existingChapter] = await db.select().from(chapters).where(eq(chapters.id, id));
    if (!existingChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Check story ownership
    const [story] = await db.select().from(stories).where(eq(stories.id, existingChapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update chapter with new HNS data
    const serializedData = JSON.stringify(hnsData);

    await db.update(chapters)
      .set({
        hnsData: serializedData,
        updatedAt: new Date()
      })
      .where(eq(chapters.id, id));

    return NextResponse.json({
      success: true,
      message: 'Chapter data saved successfully',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving chapter data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}