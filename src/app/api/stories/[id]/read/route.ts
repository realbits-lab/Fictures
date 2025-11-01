import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryWithStructure } from '@/lib/db/queries';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    // Get story with structure but without scenes (loaded on demand)
    const storyWithStructure = await getStoryWithStructure(id, false);
    
    if (!storyWithStructure) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Only show published stories in read mode (unless owner)
    if (storyWithStructure.status !== 'published' && storyWithStructure.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Story not available' }, { status: 403 });
    }

    const isOwner = storyWithStructure.userId === session?.user?.id;

    // Return story data optimized for reading
    const response = {
      story: storyWithStructure,
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