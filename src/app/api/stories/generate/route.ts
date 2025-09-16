import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { generateStoryFromPrompt } from '@/lib/ai/story-development';
import { db } from '@/lib/db';
import { stories, parts, chapters, characters, places } from '@/lib/db/schema';
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
    const { prompt, language = 'English' } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Story prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating story from prompt:', prompt);

    // Generate story using AI development process with streaming response
    const generatedStory = await generateStoryFromPrompt(prompt, session.user.id, language);

    console.log('📚 Story generated, storing in database...');

    // Store main story in database with bi-directional relationship arrays initialized
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
      content: JSON.stringify(generatedStory), // Store complete data as JSON text
      partIds: [], // Initialize empty bi-directional arrays
      chapterIds: [],
    }).returning();

    console.log('📖 Story stored, creating parts, characters and places...');

    // Create all parts based on generated story structure (no chapters created automatically)
    const createdParts = [];

    if (generatedStory.parts && Array.isArray(generatedStory.parts)) {
      for (let partIndex = 0; partIndex < generatedStory.parts.length; partIndex++) {
        const storyPart = generatedStory.parts[partIndex];

        // Calculate word count from story distribution if available
        const partWordCount = generatedStory.structure?.dist?.[partIndex]
          ? Math.floor((generatedStory.words || 60000) * (generatedStory.structure.dist[partIndex] / 100))
          : Math.floor((generatedStory.words || 60000) / generatedStory.parts.length);

        // Create part using RelationshipManager for bi-directional consistency
        const partId = await RelationshipManager.addPartToStory(
          storyId,
          {
            title: `Part ${storyPart.part}: ${storyPart.goal}`,
            authorId: session.user.id,
            orderIndex: storyPart.part,
            targetWordCount: partWordCount,
            status: 'planned',
            content: JSON.stringify(storyPart), // Store the part data from story generation
            chapterIds: [], // Initialize empty chapter IDs
          }
        );

        // Get the created part for response
        const [part] = await db.select()
          .from(parts)
          .where(eq(parts.id, partId))
          .limit(1);

        createdParts.push(part);
      }
    } else {
      // Fallback to default 3-part structure if parts are not properly generated
      const defaultParts = [
        { part: 1, goal: 'Setup and introduction', conflict: 'Initial obstacles', outcome: 'Stakes established', tension: 'introduction' },
        { part: 2, goal: 'Conflict development', conflict: 'Major complications', outcome: 'Climax approached', tension: 'rising_action' },
        { part: 3, goal: 'Resolution', conflict: 'Final challenges', outcome: 'Story resolved', tension: 'falling_action' }
      ];

      for (let partIndex = 0; partIndex < defaultParts.length; partIndex++) {
        const partData = defaultParts[partIndex];

        // Create part using RelationshipManager for bi-directional consistency
        const partId = await RelationshipManager.addPartToStory(
          storyId,
          {
            title: `Part ${partData.part}: ${partData.goal}`,
            authorId: session.user.id,
            orderIndex: partData.part,
            targetWordCount: Math.floor((generatedStory.words || 60000) * (partIndex === 1 ? 50 : 25) / 100),
            status: 'planned',
            content: JSON.stringify(partData),
            chapterIds: [], // Initialize empty chapter IDs
          }
        );

        // Get the created part for response
        const [part] = await db.select()
          .from(parts)
          .where(eq(parts.id, partId))
          .limit(1);

        createdParts.push(part);
      }
    }

    // Create characters from story generation
    const createdCharacters = [];
    if (generatedStory.characters && Array.isArray(generatedStory.characters)) {
      for (const character of generatedStory.characters) {
        const characterId = nanoid();
        await db.insert(characters).values({
          id: characterId,
          name: character.parsedData?.name || character.id,
          storyId: storyId,
          isMain: ['protag', 'antag'].includes(character.id),
          content: character.content, // Store YAML data
        });

        createdCharacters.push({ id: characterId, name: character.parsedData?.name });
      }
    }

    // Create places from story generation
    const createdPlaces = [];
    if (generatedStory.places && Array.isArray(generatedStory.places)) {
      for (const place of generatedStory.places) {
        const placeId = nanoid();
        await db.insert(places).values({
          id: placeId,
          name: place.parsedData?.name || place.name,
          storyId: storyId,
          isMain: ['primary', 'main'].some(keyword =>
            (place.parsedData?.significance || '').toLowerCase().includes(keyword)
          ),
          content: place.content, // Store YAML data
        });

        createdPlaces.push({ id: placeId, name: place.parsedData?.name || place.name });
      }
    }

    console.log('✅ Database storage completed');

    // Return the generated story with database IDs and YAML data
    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: storyId,
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