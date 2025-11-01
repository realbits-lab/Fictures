import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChapterById, updateChapter, updateUserStats } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

const updateChapterSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
});

// GET /api/chapters/[id] - Get chapter details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    const chapter = await getChapterById(id, session?.user?.id);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/chapters/[id] - Update chapter
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
    const validatedData = updateChapterSchema.parse(body);

    // Convert datetime strings to Date objects
    const updateData: any = { ...validatedData };
    if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
    }
    if (updateData.scheduledFor) {
      updateData.scheduledFor = new Date(updateData.scheduledFor);
    }

    const chapter = await updateChapter(id, session.user.id, updateData);

    // Update user stats
    await updateUserStats(session.user.id, {
      lastWritingDate: new Date(),
    });

    return NextResponse.json({ chapter });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}