import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateStoryFromPrompt } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, parts, chapters } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

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
    const { prompt } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Story prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating story from prompt:', prompt);

    // Generate story using AI development process
    const generatedStory = await generateStoryFromPrompt(prompt, session.user.id);

    console.log('📚 Story generated, storing in database...');

    // Store main story in database
    const storyId = nanoid();
    const [story] = await db.insert(stories).values({
      id: storyId,
      title: generatedStory.title || 'Generated Story',
      description: generatedStory.description || 'AI-generated story',
      genre: generatedStory.genre || 'General',
      authorId: session.user.id,
      targetWordCount: generatedStory.totalWordCount || generatedStory.words || 60000,
      status: 'draft',
      isPublic: false,
      storyData: generatedStory, // Store complete YAML data
    }).returning();

    console.log('📖 Story stored, creating parts and chapters...');

    // Create all parts and the first chapter of the first part
    const createdParts = [];
    const defaultParts = [
      { title: 'Beginning', description: 'Story setup and introduction', wordPercent: 25 },
      { title: 'Middle', description: 'Conflict development and complications', wordPercent: 50 },
      { title: 'End', description: 'Climax and resolution', wordPercent: 25 }
    ];

    for (let partIndex = 0; partIndex < defaultParts.length; partIndex++) {
      const partData = defaultParts[partIndex];
      const partId = nanoid();
      
      // Create part
      const [part] = await db.insert(parts).values({
        id: partId,
        title: partData.title,
        storyId: storyId,
        authorId: session.user.id,
        orderIndex: partIndex + 1,
        targetWordCount: Math.floor((generatedStory.totalWordCount || 60000) * (partData.wordPercent / 100)),
        status: 'planned',
        partData: { title: partData.title, description: partData.description },
      }).returning();

      // Only create the first chapter for the first part
      if (partIndex === 0) {
        const chapterId = nanoid();
        
        await db.insert(chapters).values({
          id: chapterId,
          title: 'Chapter 1',
          storyId: storyId,
          partId: partId,
          authorId: session.user.id,
          orderIndex: 1,
          targetWordCount: 4000, // Standard chapter length
          status: 'planned',
          purpose: `Develop the ${partData.title.toLowerCase()} of the story`,
          hook: 'Chapter opening that draws readers in',
          characterFocus: 'protagonist',
        });
      }

      createdParts.push(part);
    }

    console.log('✅ Database storage completed');

    // Return the generated story with database IDs
    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: storyId,
          ...generatedStory,
          databaseStory: story,
          parts: createdParts,
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error generating story:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate story',
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
      message: 'Story Generation API',
      usage: 'POST with { "prompt": "your story idea" }',
      example: {
        prompt: "I want to write an urban fantasy story about two sisters in San Francisco. Maya is a photographer who discovers she has shadow magic when her younger sister Elena disappears into a parallel realm."
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}