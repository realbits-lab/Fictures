import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { createStory, getStoryWithParts } from '@/lib/db/queries/hierarchy';
import { db } from '@/lib/db';
import { story } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/books/[bookId]/stories - Get all stories for a book
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
    
    // Parse query parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Get stories for the book
    const stories = await db.select()
      .from(story)
      .where(eq(story.bookId, bookId))
      .orderBy(story.order)
      .limit(limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalStories = await db.select()
      .from(story)
      .where(eq(story.bookId, bookId));
    
    return NextResponse.json({
      stories,
      pagination: {
        page,
        limit,
        total: totalStories.length,
        pages: Math.ceil(totalStories.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

// POST /api/books/[bookId]/stories - Create a new story
const createStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  synopsis: z.string().optional(),
  themes: z.array(z.string()).optional(),
  worldSettings: z.any().optional(),
  characterArcs: z.any().optional(),
  plotStructure: z.any().optional(),
  order: z.number().optional(),
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
    const validatedData = createStorySchema.parse(body);
    
    const newStory = await createStory({
      bookId,
      ...validatedData
    });
    
    return NextResponse.json({ story: newStory }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}