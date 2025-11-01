import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { createStory, getUserStories, getUserStoriesWithFirstChapter } from '@/lib/db/queries';
import { z } from 'zod';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

const createStorySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  genre: z.string().optional(),
});

// GET /api/stories - Get user's stories with detailed data for dashboard
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read stories
    if (!hasRequiredScope(authResult, 'stories:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: stories:read' },
        { status: 403 }
      );
    }

    const stories = await getUserStoriesWithFirstChapter(authResult.user.id);
    
    // Transform the data to match the Dashboard component expectations
    const transformedStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      genre: story.genre || "General",
      parts: {
        completed: story.completedParts || 0,
        total: story.totalParts || 0,
      },
      chapters: {
        completed: story.completedChapters || 0,
        total: story.totalChapters || 0,
      },
      readers: story.viewCount || 0,
      rating: (story.rating || 0) / 10, // Convert from database format (47 = 4.7)
      status: story.status as "draft" | "publishing" | "completed" | "published",
      firstChapterId: story.firstChapterId,
      hnsData: story.hnsData || null,
      isPublic: story.status === 'published',
      imageUrl: story.imageUrl,
      imageVariants: story.imageVariants,
    }));

    const response = {
      stories: transformedStories,
      metadata: {
        fetchedAt: new Date().toISOString(),
        userId: authResult.user.id,
        totalStories: transformedStories.length,
        lastUpdated: new Date().toISOString()
      }
    };

    // Generate ETag based on user stories data
    const contentForHash = JSON.stringify({
      userId: authResult.user.id,
      storiesData: stories.map(story => ({
        id: story.id,
        title: story.title,
        updatedAt: story.updatedAt,
        status: story.status,
        completedChapters: story.completedChapters,
        totalChapters: story.totalChapters,
        rating: story.rating,
        viewCount: story.viewCount
      })),
      totalStories: transformedStories.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // Set cache headers optimized for user dashboard (medium cache)
    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      // Medium cache for user dashboard - changes when user modifies stories
      'Cache-Control': 'private, max-age=900, stale-while-revalidate=1800', // 15min cache, 30min stale
      'X-Content-Type': 'user-dashboard',
      'X-User-Id': authResult.user.id,
      'X-Auth-Type': authResult.type,
      'X-Last-Modified': response.metadata.lastUpdated || new Date().toISOString()
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to write stories
    if (!hasRequiredScope(authResult, 'stories:write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: stories:write' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createStorySchema.parse(body);

    const story = await createStory(authResult.user.id, validatedData);
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}