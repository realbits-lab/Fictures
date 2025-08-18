import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { createScene } from '@/lib/db/queries/hierarchy';
import { db } from '@/lib/db';
import { scene } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/books/[bookId]/chapters/[chapterId]/scenes - Get all scenes for a chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, chapterId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const scenes = await db.select()
      .from(scene)
      .where(eq(scene.chapterId, chapterId))
      .orderBy(scene.order);
    
    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}

// POST /api/books/[bookId]/chapters/[chapterId]/scenes - Create a new scene
const createSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax']).optional(),
  pov: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  charactersPresent: z.array(z.string()).optional(),
  mood: z.enum(['tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral']).optional(),
  purpose: z.string().optional(),
  conflict: z.string().optional(),
  resolution: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, chapterId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = createSceneSchema.parse(body);
    
    const newScene = await createScene({
      chapterId,
      ...validatedData
    });
    
    return NextResponse.json({ scene: newScene }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 }
    );
  }
}