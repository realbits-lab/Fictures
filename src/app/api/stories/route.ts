import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createStory, getUserStories, getUserStoriesWithFirstChapter } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

const createStorySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  genre: z.string().optional(),
  targetWordCount: z.number().min(1000).max(500000).optional(),
});

// GET /api/stories - Get user's stories with detailed data for dashboard
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stories = await getUserStoriesWithFirstChapter(session.user.id);
    
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
      wordCount: story.currentWordCount || 0,
      firstChapterId: story.firstChapterId,
      storyData: story.storyData || null,
    }));

    return NextResponse.json({ stories: transformedStories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stories - Create a new story
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createStorySchema.parse(body);

    const story = await createStory(session.user.id, validatedData);
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