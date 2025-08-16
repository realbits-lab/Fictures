import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { getPartWithChapters, updatePart, deletePart } from '@/lib/db/queries/hierarchy';
import { z } from 'zod';

// GET /api/books/[bookId]/parts/[partId] - Get part details with chapters
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
    
    const partWithChapters = await getPartWithChapters(partId);
    
    if (!partWithChapters) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ part: partWithChapters });
  } catch (error) {
    console.error('Error fetching part:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[bookId]/parts/[partId] - Update part
const updatePartSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  partNumber: z.number().int().positive().optional(),
  thematicFocus: z.string().optional(),
  timeframe: z.any().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(
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
    const validatedData = updatePartSchema.parse(body);
    
    const updatedPart = await updatePart(partId, validatedData);
    
    return NextResponse.json({ part: updatedPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating part:', error);
    return NextResponse.json(
      { error: 'Failed to update part' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[bookId]/parts/[partId] - Delete part
export async function DELETE(
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
    
    await deletePart(partId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json(
      { error: 'Failed to delete part' },
      { status: 500 }
    );
  }
}