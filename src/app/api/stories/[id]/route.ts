import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryById, updateStory, getStoryChapters } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

const updateStorySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'hiatus', 'published']).optional(),
  isPublic: z.boolean().optional(),
  targetWordCount: z.number().min(1000).max(500000).optional(),
});

// GET /api/stories/[id] - Get story details with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    const story = await getStoryById(id, session?.user?.id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const chapters = await getStoryChapters(id, session?.user?.id);

    return NextResponse.json({ story, chapters });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/stories/[id] - Update story
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateStorySchema.parse(body);

    const story = await updateStory(id, session.user.id, validatedData);
    if (!story) {
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}