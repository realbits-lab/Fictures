import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chapters, scenes } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: chapterId } = await params;

    // Get chapter to verify access
    const [chapter] = await db
      .select({
        id: chapters.id,
        storyId: chapters.storyId,
        sceneIds: chapters.sceneIds,
        status: chapters.status
      })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get story to check permissions
    const story = await db.query.stories.findFirst({
      where: (stories, { eq }) => eq(stories.id, chapter.storyId),
      columns: {
        id: true,
        userId: true,
        status: true
      }
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const isOwner = story.userId === session?.user?.id;
    const isPublishedStory = story.status === 'published';

    // Check permissions - allow access if:
    // 1. User is the owner, OR
    // 2. The story is published (regardless of chapter status)
    if (!isOwner && !isPublishedStory) {
      return NextResponse.json({ error: 'Chapter not available' }, { status: 403 });
    }

    // Get scenes for this chapter
    const chapterScenes = chapter.sceneIds.length > 0
      ? await db
          .select()
          .from(scenes)
          .where(inArray(scenes.id, chapter.sceneIds))
      : [];

    // Sort scenes by order index
    chapterScenes.sort((a, b) => a.orderIndex - b.orderIndex);

    // Extract scene images from HNS data
    const scenesWithImages = chapterScenes.map(scene => ({
      ...scene,
      sceneImage: scene.hnsData && typeof scene.hnsData === 'object'
        ? (scene.hnsData as any).scene_image
        : null
    }));

    const response = {
      scenes: scenesWithImages,
      metadata: {
        fetchedAt: new Date().toISOString(),
        chapterId,
        totalScenes: scenesWithImages.length
      }
    };

    // Generate ETag based on scene content and modification times
    const contentForHash = JSON.stringify({
      scenes: chapterScenes.map(scene => ({
        id: scene.id,
        content: scene.content,
        updatedAt: scene.updatedAt
      })),
      chapterId,
      totalScenes: chapterScenes.length
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Set cache headers with ETag
    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      // Cache for 5 minutes for published content, no cache for drafts
      'Cache-Control': isPublishedStory && !isOwner
        ? 'public, max-age=300, stale-while-revalidate=600'
        : 'no-cache, no-store, must-revalidate',
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching chapter scenes:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}