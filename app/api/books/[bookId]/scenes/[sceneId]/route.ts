import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { getSceneDetails, updateScene, deleteScene } from '@/lib/db/queries/hierarchy';
import { z } from 'zod';

// GET /api/books/[bookId]/scenes/[sceneId] - Get scene details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; sceneId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, sceneId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const sceneData = await getSceneDetails(sceneId);
    
    if (!sceneData) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ scene: sceneData });
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
      { status: 500 }
    );
  }
}

// PUT /api/books/[bookId]/scenes/[sceneId] - Update scene
const updateSceneSchema = z.object({
  sceneNumber: z.number().int().positive().optional(),
  title: z.string().optional(),
  content: z.string().min(1).optional(),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; sceneId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, sceneId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateSceneSchema.parse(body);
    
    const updatedScene = await updateScene(sceneId, validatedData);
    
    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[bookId]/scenes/[sceneId] - Delete scene
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; sceneId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId, sceneId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    await deleteScene(sceneId);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 }
    );
  }
}