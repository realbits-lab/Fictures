import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryForReading } from '@/lib/db/reading-queries';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    // ⚡ Strategy 3: Smart Data Reduction
    // Get story with optimized reading query (skips studio-only fields, keeps imageVariants)
    const storyWithStructure = await getStoryForReading(id);

    if (!storyWithStructure) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Only show published stories in read mode (unless owner)
    if (storyWithStructure.status !== 'published' && storyWithStructure.authorId !== session?.user?.id) {
      return NextResponse.json({ error: 'Story not available' }, { status: 403 });
    }

    const isOwner = storyWithStructure.authorId === session?.user?.id;

    // ⚡ DEBUG: Log raw data structure from database
    console.log(`[API-READ] 📦 Raw data from getStoryForReading for story ${id}:`);
    console.log(`[API-READ]   - parts: ${storyWithStructure.parts?.length ?? 0}`);
    console.log(`[API-READ]   - chapters: ${storyWithStructure.chapters?.length ?? 0}`);
    if (storyWithStructure.parts?.length > 0) {
      storyWithStructure.parts.forEach((part: any, idx: number) => {
        console.log(`[API-READ]     Part ${idx}: id=${part.id}, title="${part.title}", chapters=${part.chapters?.length ?? 0}`);
      });
    }
    if (storyWithStructure.chapters?.length > 0) {
      storyWithStructure.chapters.forEach((ch: any, idx: number) => {
        console.log(`[API-READ]     Chapter ${idx}: id=${ch.id}, title="${ch.title}", status="${ch.status}", partId=${ch.partId}`);
      });
    }

    // Return story data optimized for reading
    const response = {
      story: {
        ...storyWithStructure,
        userId: storyWithStructure.authorId, // Map authorId to userId for interface compatibility
      },
      isOwner,
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalChapters: [
          ...storyWithStructure.parts.flatMap(part => part.chapters),
          ...storyWithStructure.chapters
        ].length,
        publishedChapters: [
          ...storyWithStructure.parts.flatMap(part => part.chapters),
          ...storyWithStructure.chapters
        ].filter(chapter => isOwner || chapter.status === 'published').length
      }
    };

    // Generate ETag based on story structure
    const contentForHash = JSON.stringify({
      storyId: storyWithStructure.id,
      chapterIds: [
        ...storyWithStructure.parts.flatMap(part => part.chapters),
        ...storyWithStructure.chapters
      ].map(ch => ch.id),
      totalChapters: response.metadata.totalChapters,
      publishedChapters: response.metadata.publishedChapters
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // ⚡ Strategy 4: Vercel Edge Caching for global CDN performance
    // Cache published stories on 119 edge locations worldwide
    const isPublished = storyWithStructure.status === 'published' && !isOwner;

    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,

      // Client-side caching (browser)
      'Cache-Control': isPublished
        ? 'public, max-age=60, stale-while-revalidate=600' // 1min client, 10min stale
        : 'no-cache, no-store, must-revalidate',

      // Vercel Edge Network caching (global CDN)
      'CDN-Cache-Control': isPublished
        ? 's-maxage=3600, stale-while-revalidate=7200' // 1hr edge, 2hr stale
        : 'no-store',
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching story for reading:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}