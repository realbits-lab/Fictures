import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePartSpecifications } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, parts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RelationshipManager } from '@/lib/db/relationships';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: 'Story ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating parts for story:', storyId);

    // Get story data from database
    const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
    
    if (!story) {
      return new Response(
        JSON.stringify({ error: 'Story not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns the story
    if (story.authorId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if story has the required content
    if (!story.content || typeof story.content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Story content is required for part generation. Please regenerate the story first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📚 Generating part specifications...');

    // Parse YAML content and generate detailed part specifications using AI
    let storyData;
    try {
      storyData = JSON.parse(story.content);
    } catch {
      // If not JSON, treat as YAML or plain text
      storyData = { content: story.content };
    }
    const partSpecs = await generatePartSpecifications(storyData);

    console.log('📖 Part specifications generated, updating database...');

    // Update existing parts with detailed specifications
    const updatedParts = [];
    
    for (let i = 0; i < partSpecs.length; i++) {
      const partSpec = partSpecs[i];
      
      // Get existing part by order index
      const [existingPart] = await db.select().from(parts)
        .where(eq(parts.storyId, storyId))
        .where(eq(parts.orderIndex, partSpec.part));
      
      if (existingPart) {
        // Update existing part
        const [updatedPart] = await db.update(parts)
          .set({
            title: partSpec.title,
            targetWordCount: partSpec.words,
            status: 'planned',
            content: JSON.stringify(partSpec),
            updatedAt: new Date(),
          })
          .where(eq(parts.id, existingPart.id))
          .returning();
        
        updatedParts.push(updatedPart);
      } else {
        // Create new part if it doesn't exist using RelationshipManager for bi-directional consistency
        const partId = await RelationshipManager.addPartToStory(
          storyId,
          {
            title: partSpec.title,
            authorId: session.user.id,
            orderIndex: partSpec.part,
            targetWordCount: partSpec.words,
            status: 'planned',
            content: JSON.stringify(partSpec),
            chapterIds: [], // Initialize empty chapter IDs
          }
        );

        // Get the created part for response
        const [newPart] = await db.select()
          .from(parts)
          .where(eq(parts.id, partId))
          .limit(1);
        
        updatedParts.push(newPart);
      }
    }

    console.log('✅ Parts database update completed');

    // Return the generated parts with specifications
    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${partSpecs.length} detailed part specifications`,
        parts: updatedParts,
        partSpecifications: partSpecs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error generating parts:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate parts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// GET endpoint to test the API
export async function GET() {
  return new Response(
    JSON.stringify({
      message: 'Parts Generation API',
      usage: 'POST with { "storyId": "story-id" }',
      description: 'Generate detailed part specifications for an existing story',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}