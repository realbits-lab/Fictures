import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryWithStructure } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    // Get story with full structure (parts, chapters, scenes)
    const storyWithStructure = await getStoryWithStructure(id, session?.user?.id);
    
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

    // Set cache headers for better performance
    const headers = new Headers({
      'Content-Type': 'application/json',
      // Cache for 10 minutes for published stories, no cache for drafts
      'Cache-Control': storyWithStructure.status === 'published' && !isOwner 
        ? 'public, max-age=600, stale-while-revalidate=1200' 
        : 'no-cache, no-store, must-revalidate',
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