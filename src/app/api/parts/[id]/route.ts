import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { parts, stories, chapters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { RelationshipManager } from '@/lib/db/relationships';

export const runtime = 'nodejs';

const updatePartSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
  targetWordCount: z.number().min(100).max(100000).optional(),
  currentWordCount: z.number().min(0).optional(),
  content: z.string().optional(),
});

// GET /api/parts/[id] - Get part details with chapters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    // Get part details
    const [part] = await db.select().from(parts).where(eq(parts.id, id));
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check if user has access (through story ownership)
    const [story] = await db.select().from(stories).where(eq(stories.id, part.storyId));
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Check access permissions
    if (!session?.user?.id || (story.authorId !== session.user.id && !story.isPublic)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get chapters belonging to this part
    const partChapters = await db.select().from(chapters)
      .where(eq(chapters.partId, id))
      .orderBy(chapters.orderIndex);

    return NextResponse.json({ 
      part: {
        ...part,
        story: {
          id: story.id,
          title: story.title,
          authorId: story.authorId
        }
      }, 
      chapters: partChapters 
    });
  } catch (error) {
    console.error('Error fetching part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/parts/[id] - Update part
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePartSchema.parse(body);

    // Get part and verify ownership
    const [existingPart] = await db.select().from(parts).where(eq(parts.id, id));
    if (!existingPart) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check story ownership
    const [story] = await db.select().from(stories).where(eq(stories.id, existingPart.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update part
    const [updatedPart] = await db.update(parts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(parts.id, id))
      .returning();

    return NextResponse.json({ part: updatedPart });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/parts/[id] - Delete part
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get part and verify ownership
    const [existingPart] = await db.select().from(parts).where(eq(parts.id, id));
    if (!existingPart) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check story ownership
    const [story] = await db.select().from(stories).where(eq(stories.id, existingPart.storyId));
    if (!story || story.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete part using RelationshipManager for bi-directional consistency
    // (RelationshipManager.deletePart handles checking for chapters and deleting them if needed)
    await RelationshipManager.deletePart(id);

    return NextResponse.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}