import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { buildHierarchyContext, getSceneDetails } from '@/lib/db/queries/hierarchy';
import { z } from 'zod';

// POST /api/books/[bookId]/scenes/[sceneId]/generate - Generate scene content with AI
const generateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  includeContext: z.boolean().default(true),
});

export async function POST(
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
    const validatedData = generateRequestSchema.parse(body);
    
    // Verify scene exists
    const sceneData = await getSceneDetails(sceneId);
    if (!sceneData) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }
    
    // Build context for AI generation
    let context = null;
    if (validatedData.includeContext) {
      context = await buildHierarchyContext(sceneId);
    }
    
    // For now, return a mock generated content
    // In Phase 4, this will be integrated with the actual AI system
    const mockGeneratedContent = `Generated content for: "${validatedData.prompt}"
    
Based on the context provided:
- Story: ${context?.story?.synopsis || 'No story context'}
- Chapter setting: ${context?.chapter?.setting || 'No setting'}
- Scene mood: ${sceneData.mood}
- Characters present: ${sceneData.charactersPresent?.join(', ') || 'None specified'}

This is a placeholder for AI-generated content that will be implemented in Phase 4.`;
    
    return NextResponse.json({ 
      content: mockGeneratedContent,
      context: validatedData.includeContext ? context : null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error generating scene content:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene content' },
      { status: 500 }
    );
  }
}