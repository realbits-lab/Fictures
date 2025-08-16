import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { createPart } from '@/lib/db/queries/hierarchy';
import { db } from '@/lib/db';
import { part } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/books/[bookId]/stories/[storyId]/parts - Get all parts for a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; storyId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, storyId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const parts = await db.select()
      .from(part)
      .where(eq(part.storyId, storyId))
      .orderBy(part.order);
    
    return NextResponse.json({ parts });
  } catch (error) {
    console.error('Error fetching parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts' },
      { status: 500 }
    );
  }
}

// POST /api/books/[bookId]/stories/[storyId]/parts - Create a new part
const createPartSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  partNumber: z.number().int().positive(),
  thematicFocus: z.string().optional(),
  timeframe: z.any().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; storyId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, storyId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = createPartSchema.parse(body);
    
    const newPart = await createPart({
      storyId,
      ...validatedData
    });
    
    return NextResponse.json({ part: newPart }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating part:', error);
    return NextResponse.json(
      { error: 'Failed to create part' },
      { status: 500 }
    );
  }
}