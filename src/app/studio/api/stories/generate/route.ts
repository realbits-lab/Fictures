import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import { generateStoryFromPrompt } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, parts, chapters, characters, places } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RelationshipManager } from '@/lib/db/relationships';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (supports both session and API key)
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to write stories
    if (!hasRequiredScope(authResult, 'stories:write')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Required scope: stories:write' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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

    // Generate story using AI development process with incremental saving
    // The story is now saved to database after each phase inside generateStoryFromPrompt
    const generatedStory = await generateStoryFromPrompt(prompt, authResult.user.id, language);

    console.log('📚 Story generation completed with incremental saving');

    // Get the final story from database
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, generatedStory.id))
      .limit(1);

    // Get all parts that were created
    const createdParts = await db.select()
      .from(parts)
      .where(eq(parts.storyId, generatedStory.id));

    // Get all characters that were created
    const createdCharacters = await db.select()
      .from(characters)
      .where(eq(characters.storyId, generatedStory.id));

    // Get all places that were created
    const createdPlaces = await db.select()
      .from(places)
      .where(eq(places.storyId, generatedStory.id));

    console.log('✅ Story development and incremental storage completed');

    // Return the generated story with database IDs and YAML data
    return new Response(
      JSON.stringify({
        success: true,
        story: {
          ...generatedStory,
          databaseStory: story,
          parts: createdParts,
          characters: createdCharacters,
          places: createdPlaces,
        },
        yamlData: {
          storyYaml: `# Story Foundation (Phase 1)\n---\ntitle: "${generatedStory.title || 'Generated Story'}"\ngenre: "${generatedStory.genre || 'General'}"\nlanguage: "${language}"\n---`,
          charactersYaml: generatedStory.characters?.map(c => `# Character: ${c.parsedData?.name || c.id}\n${c.content}`).join('\n\n') || '',
          placesYaml: generatedStory.places?.map(p => `# Place: ${p.parsedData?.name || p.name}\n${p.content}`).join('\n\n') || '',
          partsYaml: generatedStory.partSpecifications?.map((p: any, i: number) => `# Part ${i + 1}\n${JSON.stringify(p, null, 2)}`).join('\n\n') || ''
        },
        generationStatus: story?.status || 'completed'
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