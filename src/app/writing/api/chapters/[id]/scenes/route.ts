import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { chapters, scenes } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiStartTime = performance.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { id: chapterId } = await params;
    console.log(`[${requestId}] 🚀 API Request START for chapter: ${chapterId}`);

    // 1. Authentication
    const authStartTime = performance.now();
    const session = await auth();
    const authDuration = performance.now() - authStartTime;
    console.log(`[${requestId}] 🔐 Auth completed: ${authDuration.toFixed(2)}ms`);

    // 2. Get chapter to verify access
    const chapterQueryStartTime = performance.now();
    const [chapter] = await db
      .select({
        id: chapters.id,
        storyId: chapters.storyId,
        status: chapters.status
      })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);
    const chapterQueryDuration = performance.now() - chapterQueryStartTime;
    console.log(`[${requestId}] 📖 Chapter query completed: ${chapterQueryDuration.toFixed(2)}ms`);

    if (!chapter) {
      console.log(`[${requestId}] ❌ Chapter not found`);
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // 3. Get story to check permissions
    const storyQueryStartTime = performance.now();
    const story = await db.query.stories.findFirst({
      where: (stories, { eq }) => eq(stories.id, chapter.storyId),
      columns: {
        id: true,
        authorId: true,
        status: true
      }
    });
    const storyQueryDuration = performance.now() - storyQueryStartTime;
    console.log(`[${requestId}] 📚 Story query completed: ${storyQueryDuration.toFixed(2)}ms`);

    if (!story) {
      console.log(`[${requestId}] ❌ Story not found`);
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const isOwner = story.authorId === session?.user?.id;
    const isPublishedStory = story.status === 'published';

    // Check permissions - allow access if:
    // 1. User is the owner, OR
    // 2. The story is published (regardless of chapter status)
    if (!isOwner && !isPublishedStory) {
      console.log(`[${requestId}] 🚫 Permission denied`);
      return NextResponse.json({ error: 'Chapter not available' }, { status: 403 });
    }

    // 4. Get scenes for this chapter using foreign key, ordered by orderIndex
    const scenesQueryStartTime = performance.now();
    const chapterScenes = await db
      .select()
      .from(scenes)
      .where(eq(scenes.chapterId, chapterId))
      .orderBy(asc(scenes.orderIndex));
    const scenesQueryDuration = performance.now() - scenesQueryStartTime;
    console.log(`[${requestId}] 🎬 Scenes query completed: ${scenesQueryDuration.toFixed(2)}ms (${chapterScenes.length} scenes)`);

    // 5. Extract scene images from HNS data
    const processingStartTime = performance.now();
    const scenesWithImages = chapterScenes.map(scene => ({
      ...scene,
      sceneImage: scene.hnsData && typeof scene.hnsData === 'object'
        ? (scene.hnsData as any).scene_image
        : null
    }));
    const processingDuration = performance.now() - processingStartTime;
    console.log(`[${requestId}] 🖼️  Scene image processing: ${processingDuration.toFixed(2)}ms`);

    const response = {
      scenes: scenesWithImages,
      metadata: {
        fetchedAt: new Date().toISOString(),
        chapterId,
        totalScenes: scenesWithImages.length
      }
    };

    // 6. Generate ETag based on scene content and modification times
    const etagStartTime = performance.now();
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
    const etagDuration = performance.now() - etagStartTime;
    console.log(`[${requestId}] 🏷️  ETag generation: ${etagDuration.toFixed(2)}ms`);

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      const totalDuration = performance.now() - apiStartTime;
      console.log(`[${requestId}] ✅ 304 Not Modified - Total: ${totalDuration.toFixed(2)}ms`);
      console.log(`[${requestId}] 📊 Breakdown: Auth=${authDuration.toFixed(0)}ms, Chapter=${chapterQueryDuration.toFixed(0)}ms, Story=${storyQueryDuration.toFixed(0)}ms, Scenes=${scenesQueryDuration.toFixed(0)}ms, ETag=${etagDuration.toFixed(0)}ms`);
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

    const totalDuration = performance.now() - apiStartTime;
    console.log(`[${requestId}] ✅ 200 OK - Total: ${totalDuration.toFixed(2)}ms`);
    console.log(`[${requestId}] 📊 Breakdown: Auth=${authDuration.toFixed(0)}ms, Chapter=${chapterQueryDuration.toFixed(0)}ms, Story=${storyQueryDuration.toFixed(0)}ms, Scenes=${scenesQueryDuration.toFixed(0)}ms, Processing=${processingDuration.toFixed(0)}ms, ETag=${etagDuration.toFixed(0)}ms`);

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    const totalDuration = performance.now() - apiStartTime;
    console.error(`[${requestId}] ❌ Error after ${totalDuration.toFixed(2)}ms:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}