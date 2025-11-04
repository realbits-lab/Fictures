import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateChapter } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';

const autosaveSchema = z.object({
  content: z.string(),
});

// POST /api/chapters/[id]/autosave - Auto-save chapter content
export async function POST(
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
    const { content } = body;

    const chapter = await updateChapter(id, session.user.id, {
      content,
    });

    return NextResponse.json({ 
      success: true, 
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error auto-saving chapter:', error);
    return NextResponse.json({ error: 'Auto-save failed' }, { status: 500 });
  }
}