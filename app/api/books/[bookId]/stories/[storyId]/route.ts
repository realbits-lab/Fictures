import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { getStoryWithParts, updateStory, deleteStory } from '@/lib/db/queries/hierarchy';
import { z } from 'zod';

// GET /api/books/[bookId]/stories/[storyId] - Get story details with parts
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
    
    const storyWithParts = await getStoryWithParts(storyId);
    
    if (!storyWithParts) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ story: storyWithParts });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[bookId]/stories/[storyId] - Update story
const updateStorySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  synopsis: z.string().optional(),
  themes: z.array(z.string()).optional(),
  worldSettings: z.any().optional(),
  characterArcs: z.any().optional(),
  plotStructure: z.any().optional(),
  order: z.number().optional(),
});

export async function PUT(
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
    const validatedData = updateStorySchema.parse(body);
    
    const updatedStory = await updateStory(storyId, validatedData);
    
    return NextResponse.json({ story: updatedStory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[bookId]/stories/[storyId] - Delete story
export async function DELETE(
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
    
    await deleteStory(storyId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}