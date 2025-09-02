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
      title: generatedStory.title,
      description: `${generatedStory.goal} - ${generatedStory.conflict}`,
      genre: generatedStory.genre,
      authorId: session.user.id,
      targetWordCount: generatedStory.words,
      status: 'draft',
      isPublic: false,
      storyData: generatedStory, // Store complete YAML data
    }).returning();

    console.log('📖 Story stored, creating parts and chapters...');

    // Create parts and chapters based on the generated structure
    const createdParts = [];
    let chapterCounter = 1;

    for (const partData of generatedStory.parts) {
      const partId = nanoid();
      
      // Create part
      const [part] = await db.insert(parts).values({
        id: partId,
        title: partData.goal, // Use goal as title for now
        storyId: storyId,
        authorId: session.user.id,
        orderIndex: partData.part,
        targetWordCount: Math.floor(generatedStory.words * (generatedStory.structure.dist[partData.part - 1] / 100)),
        status: 'planned',
        partData: partData, // Store part-specific YAML data
      }).returning();

      // Create sample chapters for each part (based on chapter_words from serial config)
      const chaptersPerPart = Math.ceil((part.targetWordCount || 20000) / generatedStory.serial.chapter_words);
      
      for (let i = 0; i < Math.min(chaptersPerPart, 5); i++) { // Limit to 5 chapters per part for now
        const chapterId = nanoid();
        
        await db.insert(chapters).values({
          id: chapterId,
          title: `Chapter ${chapterCounter}: Beginning`,
          storyId: storyId,
          partId: partId,
          authorId: session.user.id,
          orderIndex: i + 1,
          targetWordCount: generatedStory.serial.chapter_words,
          status: 'planned',
          purpose: `Advance the story toward: ${partData.goal}`,
          hook: `Chapter hook related to: ${partData.conflict}`,
          characterFocus: Object.keys(generatedStory.chars)[0] || 'protagonist',
        });

        chapterCounter++;
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