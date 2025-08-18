import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { createChapter } from '@/lib/db/queries/hierarchy';
import { db } from '@/lib/db';
import { chapterEnhanced } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/books/[bookId]/parts/[partId]/chapters - Get all chapters for a part
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; partId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, partId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const chapters = await db.select()
      .from(chapterEnhanced)
      .where(eq(chapterEnhanced.partId, partId))
      .orderBy(chapterEnhanced.order);
    
    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

// POST /api/books/[bookId]/parts/[partId]/chapters - Create a new chapter
const createChapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  globalChapterNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(255),
  summary: z.string().optional(),
  content: z.any().default({}),
  pov: z.string().optional(),
  setting: z.string().optional(),
  charactersPresent: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; partId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, partId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = createChapterSchema.parse(body);
    
    const newChapter = await createChapter({
      partId,
      bookId,
      ...validatedData
    });
    
    return NextResponse.json({ chapter: newChapter }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    );
  }
}