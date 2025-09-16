import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryWithStructure } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { stories, characters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }


    // Get story with full structure (parts, chapters, scenes)
    const storyWithStructure = await getStoryWithStructure(id, session?.user?.id);


    if (!storyWithStructure) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Get characters for this story
    const storyCharacters = await db.query.characters.findMany({
      where: eq(characters.storyId, id)
    });

    // Only story owners can edit
    if (storyWithStructure.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Access denied - you are not the owner of this story' }, { status: 403 });
    }

    const isOwner = storyWithStructure.userId === session?.user?.id;

    // Calculate all chapters and scenes for writing context
    const allChapters = [
      ...storyWithStructure.parts.flatMap(part => part.chapters),
      ...storyWithStructure.chapters
    ];

    const allScenes = allChapters.flatMap(chapter => chapter.scenes || []);

    // Parse story content JSON for storyData (note: field is named 'storyData', not 'content')
    let parsedStoryData = null;

    if (storyWithStructure.storyData) {
      try {
        // Handle case where storyData might already be an object
        if (typeof storyWithStructure.storyData === 'object') {
          parsedStoryData = storyWithStructure.storyData;
        } else if (typeof storyWithStructure.storyData === 'string') {
          parsedStoryData = JSON.parse(storyWithStructure.storyData);
        }
      } catch (error) {
        console.error('Failed to parse story storyData JSON:', error);
        // Keep parsedStoryData as null if parsing fails
      }
    }

    // Return story data optimized for writing with additional metadata
    const response = {
      story: {
        ...storyWithStructure,
        storyData: parsedStoryData // Add parsed story data
      },
      characters: storyCharacters,
      isOwner,
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalChapters: allChapters.length,
        totalScenes: allScenes.length,
        lastModified: storyWithStructure.updatedAt || new Date().toISOString(),
        writingContext: {
          draftsCount: allChapters.filter(ch => ch.status === 'draft').length,
          completedChapters: allChapters.filter(ch => ch.status === 'completed').length,
          totalWordCount: allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0),
          averageChapterLength: allChapters.length > 0
            ? Math.round(allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) / allChapters.length)
            : 0
        }
      }
    };

    // Generate ETag based on story, chapters, and scenes modification times
    const contentForHash = JSON.stringify({
      storyId: storyWithStructure.id,
      storyUpdatedAt: storyWithStructure.updatedAt,
      chaptersData: allChapters.map(ch => ({
        id: ch.id,
        updatedAt: ch.updatedAt,
        wordCount: ch.wordCount,
        status: ch.status
      })),
      scenesData: allScenes.map(sc => ({
        id: sc.id,
        updatedAt: sc.updatedAt,
        wordCount: sc.wordCount,
        status: sc.status
      })),
      writingMetrics: response.metadata.writingContext
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Set cache headers optimized for writing (shorter cache for active editing)
    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      // Shorter cache for writing mode to ensure fresh data during active editing
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      'X-Writing-Mode': 'true',
      'X-Last-Modified': response.metadata.lastModified
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching story for writing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { storyData } = await request.json();

    if (!storyData) {
      return NextResponse.json({ error: 'Story data is required' }, { status: 400 });
    }

    // First, get the story to check ownership
    const existingStory = await db.query.stories.findFirst({
      where: eq(stories.id, id)
    });

    if (!existingStory) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check if user owns the story
    if (existingStory.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Access denied - you are not the owner of this story' }, { status: 403 });
    }

    // Update the story with the new storyData
    await db.update(stories)
      .set({
        content: storyData,
        updatedAt: new Date()
      })
      .where(eq(stories.id, id));

    return NextResponse.json({
      success: true,
      message: 'Story data saved successfully',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error saving story data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}