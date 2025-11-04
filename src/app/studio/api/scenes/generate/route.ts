import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSceneSpecifications } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, chapters, scenes } from '@/lib/db/schema';
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
    const { chapterId, sceneCount = 3, chapterSpecification } = body;

    if (!chapterId) {
      return new Response(
        JSON.stringify({ error: 'Chapter ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!chapterSpecification) {
      return new Response(
        JSON.stringify({ error: 'Chapter specification is required for scene generation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating scenes for chapter:', chapterId);

    // Get chapter data from database
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, chapterId));
    
    if (!chapter) {
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user owns the chapter (through story)
    const [story] = await db.select().from(stories).where(eq(stories.id, chapter.storyId));
    if (!story || story.authorId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📚 Generating scene specifications...');

    // Generate detailed scene specifications using AI
    const sceneSpecs = await generateSceneSpecifications(
      chapterSpecification, 
      sceneCount
    );

    console.log('📖 Scene specifications generated, creating database entries...');

    // Create scenes in database using RelationshipManager for bi-directional consistency
    const createdScenes = [];
    
    for (let i = 0; i < sceneSpecs.length; i++) {
      const sceneSpec = sceneSpecs[i];
      
      const sceneId = await RelationshipManager.addSceneToChapter(
        chapter.id,
        {
          title: `Scene ${sceneSpec.id}: ${sceneSpec.summary}`,
          content: '', // Empty content initially
          orderIndex: sceneSpec.id,
          goal: sceneSpec.goal,
          conflict: sceneSpec.obstacle,
          outcome: sceneSpec.outcome,
        }
      );

      // Get the created scene for response
      const [newScene] = await db.select()
        .from(scenes)
        .where(eq(scenes.id, sceneId))
        .limit(1);
      
      createdScenes.push(newScene);
    }

    console.log('✅ Scenes database creation completed');

    // Return the generated scenes with specifications
    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${sceneSpecs.length} detailed scene specifications`,
        scenes: createdScenes,
        sceneSpecifications: sceneSpecs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error generating scenes:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate scenes',
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
      message: 'Scenes Generation API',
      usage: 'POST with { "chapterId": "chapter-id", "sceneCount": 3, "chapterSpecification": {...} }',
      summary: 'Generate detailed scene specifications for a chapter',
      example: {
        chapterId: "chapter_abc123",
        sceneCount: 3,
        chapterSpecification: {
          chap: 1,
          title: "Missing",
          pov: "maya",
          words: 3500,
          goal: "Normal coffee date with Elena",
          conflict: "Elena missing, signs of supernatural danger",
          outcome: "Finds journal, realizes she's also a target"
        }
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}