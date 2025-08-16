import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { buildHierarchyContext } from '@/lib/db/queries/hierarchy';
import { z } from 'zod';

// POST /api/books/[bookId]/ai-context - Generate context for AI writing
const contextRequestSchema = z.object({
  level: z.enum(['story', 'part', 'chapter', 'scene']),
  entityId: z.string().uuid(),
  includeContext: z.boolean().default(true),
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
    const validatedData = contextRequestSchema.parse(body);
    
    // For now, we only support scene-level context building
    if (validatedData.level !== 'scene') {
      return NextResponse.json(
        { error: 'Only scene-level context generation is currently supported' },
        { status: 400 }
      );
    }
    
    const context = await buildHierarchyContext(validatedData.entityId);
    
    return NextResponse.json({ context });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error building AI context:', error);
    return NextResponse.json(
      { error: 'Failed to build AI context' },
      { status: 500 }
    );
  }
}