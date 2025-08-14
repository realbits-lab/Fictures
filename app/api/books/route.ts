import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getUserBooks, createBook } from '@/lib/db/queries/books';
import { z } from 'zod';

// GET /api/books - List all user's books
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const books = await getUserBooks(session.user.id);
    
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST /api/books - Create a new book
const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  genre: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = createBookSchema.parse(body);
    
    const book = await createBook({
      userId: session.user.id,
      ...validatedData,
    });
    
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}