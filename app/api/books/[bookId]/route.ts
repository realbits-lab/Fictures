import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getBookWithChapters, updateBook, deleteBook, canUserAccessBook } from '@/lib/db/queries/books';
import { z } from 'zod';

// GET /api/books/[bookId] - Get book details with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hasAccess = await canUserAccessBook(session.user.id, params.bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const result = await getBookWithChapters(params.bookId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[bookId] - Update book metadata
const updateBookSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  status: z.enum(['draft', 'ongoing', 'completed', 'hiatus']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hasAccess = await canUserAccessBook(session.user.id, params.bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);
    
    const book = await updateBook(params.bookId, validatedData);
    
    return NextResponse.json({ book });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[bookId] - Delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const hasAccess = await canUserAccessBook(session.user.id, params.bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    await deleteBook(params.bookId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}