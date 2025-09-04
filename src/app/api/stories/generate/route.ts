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
    const { prompt, language = 'English' } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Story prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating story from prompt:', prompt);

    // Generate story using AI development process
    const generatedStory = await generateStoryFromPrompt(prompt, session.user.id, language);

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
      storyData: generatedStory, // Store complete JSON data
    }).returning();

    console.log('📖 Story stored, creating parts and chapters...');

    // Create all parts based on generated story structure
    const createdParts = [];

    if (generatedStory.parts && Array.isArray(generatedStory.parts)) {
      for (let partIndex = 0; partIndex < generatedStory.parts.length; partIndex++) {
        const storyPart = generatedStory.parts[partIndex];
        const partId = nanoid();
        
        // Calculate word count from story distribution if available
        const partWordCount = generatedStory.structure?.dist?.[partIndex] 
          ? Math.floor((generatedStory.words || 60000) * (generatedStory.structure.dist[partIndex] / 100))
          : Math.floor((generatedStory.words || 60000) / generatedStory.parts.length);
        
        // Create part
        const [part] = await db.insert(parts).values({
          id: partId,
          title: `Part ${storyPart.part}: ${storyPart.goals}`,
          storyId: storyId,
          authorId: session.user.id,
          orderIndex: storyPart.part,
          targetWordCount: partWordCount,
          status: 'planned',
          partData: storyPart, // Store the part data from story generation
        }).returning();

        // Create a starting chapter for this part so it's not empty
        const chapterId = nanoid();
        await db.insert(chapters).values({
          id: chapterId,
          title: `Chapter ${partIndex + 1}`,
          storyId: storyId,
          partId: partId,
          authorId: session.user.id,
          orderIndex: 1,
          targetWordCount: 4000,
          status: 'draft',
          content: '',
          wordCount: 0,
        });

        createdParts.push(part);
      }
    } else {
      // Fallback to default 3-part structure if parts are not properly generated
      const defaultParts = [
        { part: 1, goals: 'Setup and introduction', conflict: 'Initial obstacles', outcome: 'Stakes established', tension: 'introduction' },
        { part: 2, goals: 'Conflict development', conflict: 'Major complications', outcome: 'Climax approached', tension: 'rising_action' },
        { part: 3, goals: 'Resolution', conflict: 'Final challenges', outcome: 'Story resolved', tension: 'falling_action' }
      ];

      for (let partIndex = 0; partIndex < defaultParts.length; partIndex++) {
        const partData = defaultParts[partIndex];
        const partId = nanoid();
        
        const [part] = await db.insert(parts).values({
          id: partId,
          title: `Part ${partData.part}: ${partData.goals}`,
          storyId: storyId,
          authorId: session.user.id,
          orderIndex: partData.part,
          targetWordCount: Math.floor((generatedStory.words || 60000) * (partIndex === 1 ? 50 : 25) / 100),
          status: 'planned',
          partData: partData,
        }).returning();

        // Create a starting chapter for this part so it's not empty
        const chapterId = nanoid();
        await db.insert(chapters).values({
          id: chapterId,
          title: `Chapter ${partIndex + 1}`,
          storyId: storyId,
          partId: partId,
          authorId: session.user.id,
          orderIndex: 1,
          targetWordCount: 4000,
          status: 'draft',
          content: '',
          wordCount: 0,
        });

        createdParts.push(part);
      }
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