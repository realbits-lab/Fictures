import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook, createChapterForBook } from '@/lib/db/queries/books';
import { db } from '@/lib/db/drizzle';
import { chapter } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/books/[bookId]/chapters - List chapters for a book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const chapters = await db
      .select()
      .from(chapter)
      .where(eq(chapter.storyId, bookId))
      .orderBy(asc(chapter.chapterNumber));
    
    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

// POST /api/books/[bookId]/chapters - Create a new chapter
const createChapterSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = createChapterSchema.parse(body);
    
    const newChapter = await createChapterForBook(
      bookId,
      session.user.id,
      validatedData.chapterNumber,
      validatedData.title
    );
    
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