import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateChapterSpecifications } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, parts, chapters } from '@/lib/db/schema';
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
    const { partId, chapterCount = 5 } = body;

    if (!partId) {
      return new Response(
        JSON.stringify({ error: 'Part ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating chapters for part:', partId);

    // Get part data from database
    const [part] = await db.select().from(parts).where(eq(parts.id, partId));
    
    if (!part) {
      return new Response(
        JSON.stringify({ error: 'Part not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns the part (through story)
    const [story] = await db.select().from(stories).where(eq(stories.id, part.storyId));
    if (!story || story.authorId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if part has detailed specification data
    if (!part.partData || typeof part.partData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Part specification data is required. Please generate part specifications first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if story has the required storyData
    if (!story.storyData || typeof story.storyData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Story data is required. Please regenerate the story first.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📚 Generating chapter specifications...');

    // Generate detailed chapter specifications using AI
    const chapterSpecs = await generateChapterSpecifications(
      story.storyData as any, 
      part.partData as any, 
      chapterCount
    );

    console.log('📖 Chapter specifications generated, creating database entries...');

    // Create chapters in database using RelationshipManager for bi-directional consistency
    const createdChapters = [];
    
    for (let i = 0; i < chapterSpecs.length; i++) {
      const chapterSpec = chapterSpecs[i];
      
      const chapterId = await RelationshipManager.addChapterToStory(
        part.storyId,
        {
          title: chapterSpec.title,
          authorId: session.user.id,
          orderIndex: chapterSpec.chap,
          targetWordCount: chapterSpec.words,
          status: 'draft',
          purpose: `Chapter ${chapterSpec.chap} - ${chapterSpec.goal}`,
          characterFocus: chapterSpec.pov,
          sceneIds: [], // Initialize empty scene IDs
        },
        part.id // partId parameter
      );

      // Get the created chapter for response
      const [newChapter] = await db.select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);
      
      createdChapters.push(newChapter);
    }

    console.log('✅ Chapters database creation completed');

    // Return the generated chapters with specifications
    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${chapterSpecs.length} detailed chapter specifications`,
        chapters: createdChapters,
        chapterSpecifications: chapterSpecs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error generating chapters:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate chapters',
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
      message: 'Chapters Generation API',
      usage: 'POST with { "partId": "part-id", "chapterCount": 5 }',
      description: 'Generate detailed chapter specifications for a story part',
      example: {
        partId: "part_abc123",
        chapterCount: 5
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}