import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createChapter, getStoryById } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

const createChapterSchema = z.object({
  title: z.string().min(1).max(255),
  storyId: z.string(),
  partId: z.string().optional(),
  orderIndex: z.number().min(0),
  targetWordCount: z.number().min(100).max(20000).optional(),
});

// POST /api/chapters - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createChapterSchema.parse(body);

    // Verify user owns the story
    const story = await getStoryById(validatedData.storyId, session.user.id);
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 });
    }

    const chapter = await createChapter(validatedData.storyId, session.user.id, validatedData);
    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}