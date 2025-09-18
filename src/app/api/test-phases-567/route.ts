import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { stories, parts, characters as charactersTable, places as placesTable, users } from '@/lib/db/schema';
import { RelationshipManager } from '@/lib/db/relationships';

// Test API for phases 5, 6, 7: Character Images, Place Images, Database Storage
export async function POST(request: NextRequest) {
  try {
    // Check authentication (allow test bypass)
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId) {
      // For testing purposes, create a mock user
      console.log('⚠️ No authenticated session found, creating test user for phases 5-7 testing');
      userId = 'test-user-' + nanoid(8);

      // Create test user in database
      await db.insert(users).values({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        emailVerified: null,
      }).onConflictDoNothing();

      console.log(`✅ Test user created with ID: ${userId}`);
    }

    // Parse request body with mock data
    const body = await request.json();
    const { storyConcept, characters, places } = body;

    if (!storyConcept || !characters || !places) {
      return new Response('Missing required fields: storyConcept, characters, places', { status: 400 });
    }

    console.log('🧪 Starting Test Phases 5-7 (Image Generation + Database Storage)');
    console.log(`📚 Story: ${storyConcept.title}`);
    console.log(`👥 Characters: ${characters.length}`);
    console.log(`🏢 Places: ${places.length}`);

    const storyId = nanoid();
    const testResults = {
      storyId,
      phases: {},
      timing: {},
      errors: []
    };

    // Create a readable stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send SSE data
          const sendUpdate = (phase: string, data: Record<string, unknown>) => {
            const sseData = `data: ${JSON.stringify({ phase, data })}\\n\\n`;
            controller.enqueue(encoder.encode(sseData));
          };

          // Phase 5: Character Image Generation (Parallel)
          sendUpdate('progress', { phase: 'Phase 5', description: 'Character Images - Generating AI images for each character', status: 'in_progress' });
          console.log('🎨 Phase 5: Character Image Generation (Parallel)');

          const startTime5 = Date.now();
          const characterImages: Array<{characterId: string; name: string; imageUrl: string}> = [];

          if (characters && Array.isArray(characters)) {
            const characterImagePromises = characters.map(async (character) => {
              try {
                const parsedData = character.parsedData as Record<string, unknown>;
                const characterName = (parsedData?.name as string) || character.id;
                const characterDescription = (parsedData?.appearance as string) ||
                  (parsedData?.description as string) ||
                  `A character named ${characterName}`;

                const imagePrompt = `A detailed portrait of ${characterName}, ${characterDescription}. High quality digital art style, suitable for a story illustration.`;

                const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-image`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: imagePrompt,
                    type: 'character',
                    storyId: storyId,
                    internal: true
                  })
                });

                if (response.ok) {
                  const imageResult = await response.json();
                  console.log(`✅ Generated image for character: ${characterName}`);
                  return {
                    characterId: character.id,
                    name: characterName,
                    imageUrl: imageResult.imageUrl,
                    method: imageResult.method
                  };
                } else {
                  console.warn(`⚠️ Failed to generate image for character: ${characterName}`);
                  return null;
                }
              } catch (error) {
                console.error(`❌ Error generating image for character:`, error);
                testResults.errors.push(`Character image error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return null;
              }
            });

            const characterImageResults = await Promise.all(characterImagePromises);
            characterImages.push(...characterImageResults.filter(result => result !== null));
          }

          const endTime5 = Date.now();
          testResults.timing.phase5 = endTime5 - startTime5;
          testResults.phases.phase5 = {
            characterImages,
            count: characterImages.length,
            duration: endTime5 - startTime5
          };

          sendUpdate('phase5_complete', {
            phase: 'Phase 5',
            status: 'completed',
            characterImages,
            timing: endTime5 - startTime5
          });

          console.log(`✅ Character images generated in ${endTime5 - startTime5}ms`);

          // Phase 6: Place Image Generation (Parallel)
          sendUpdate('progress', { phase: 'Phase 6', description: 'Place Images - Generating AI images for each location', status: 'in_progress' });
          console.log('🏢 Phase 6: Place Image Generation (Parallel)');

          const startTime6 = Date.now();
          const placeImages: Array<{placeId: string; name: string; imageUrl: string}> = [];

          if (places && Array.isArray(places)) {
            const placeImagePromises = places.map(async (place) => {
              try {
                const parsedData = place.parsedData as Record<string, unknown>;
                const placeName = (parsedData?.name as string) || place.name;
                const placeDescription = (parsedData?.description as string) ||
                  `A location called ${placeName}`;

                const imagePrompt = `A scenic view of ${placeName}, ${placeDescription}. High quality digital art style, cinematic landscape suitable for a story setting.`;

                const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-image`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: imagePrompt,
                    type: 'place',
                    storyId: storyId,
                    internal: true
                  })
                });

                if (response.ok) {
                  const imageResult = await response.json();
                  console.log(`✅ Generated image for place: ${placeName}`);
                  return {
                    placeId: place.id,
                    name: placeName,
                    imageUrl: imageResult.imageUrl,
                    method: imageResult.method
                  };
                } else {
                  console.warn(`⚠️ Failed to generate image for place: ${placeName}`);
                  return null;
                }
              } catch (error) {
                console.error(`❌ Error generating image for place:`, error);
                testResults.errors.push(`Place image error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return null;
              }
            });

            const placeImageResults = await Promise.all(placeImagePromises);
            placeImages.push(...placeImageResults.filter(result => result !== null));
          }

          const endTime6 = Date.now();
          testResults.timing.phase6 = endTime6 - startTime6;
          testResults.phases.phase6 = {
            placeImages,
            count: placeImages.length,
            duration: endTime6 - startTime6
          };

          sendUpdate('phase6_complete', {
            phase: 'Phase 6',
            status: 'completed',
            placeImages,
            timing: endTime6 - startTime6
          });

          console.log(`✅ Place images generated in ${endTime6 - startTime6}ms`);

          // Phase 7: Database Storage
          sendUpdate('progress', { phase: 'Phase 7', description: 'Database - Storing story, character, and place data', status: 'in_progress' });
          console.log('💾 Phase 7: Database Storage');

          const startTime7 = Date.now();

          // Store main story in database
          const [story] = await db.insert(stories).values({
            id: storyId,
            title: storyConcept.title || 'Test Story',
            description: 'Test story for phases 5-7',
            genre: storyConcept.genre || 'Test',
            authorId: userId,
            targetWordCount: storyConcept.words || 60000,
            status: 'draft',
            isPublic: false,
            content: JSON.stringify(storyConcept),
            partIds: [],
            chapterIds: [],
          }).returning();

          // Create characters (Parallel)
          const createdCharacters = [];
          if (characters && Array.isArray(characters)) {
            const characterCreationPromises = characters.map(async (character) => {
              const characterId = nanoid();
              const parsedData = character.parsedData as Record<string, unknown>;

              // Find corresponding generated image
              const characterImage = characterImages.find(img => img.characterId === character.id);

              await db.insert(charactersTable).values({
                id: characterId,
                name: (parsedData?.name as string) || character.id,
                storyId: storyId,
                isMain: ['protag', 'antag'].includes(character.id),
                content: character.content,
                imageUrl: characterImage?.imageUrl || null,
              });

              return {
                id: characterId,
                name: (parsedData?.name as string),
                imageUrl: characterImage?.imageUrl,
                imageMethod: characterImage?.method
              };
            });

            const characterCreationResults = await Promise.all(characterCreationPromises);
            createdCharacters.push(...characterCreationResults);
          }

          // Create places (Parallel)
          const createdPlaces = [];
          if (places && Array.isArray(places)) {
            const placeCreationPromises = places.map(async (place) => {
              const placeId = nanoid();
              const parsedData = place.parsedData as Record<string, unknown>;

              // Find corresponding generated image
              const placeImage = placeImages.find(img => img.placeId === place.id);

              await db.insert(placesTable).values({
                id: placeId,
                name: (parsedData?.name as string) || place.name,
                storyId: storyId,
                isMain: ['primary', 'main'].some(keyword =>
                  ((parsedData?.significance as string) || '').toLowerCase().includes(keyword)
                ),
                content: place.content,
                imageUrl: placeImage?.imageUrl || null,
              });

              return {
                id: placeId,
                name: (parsedData?.name as string) || place.name,
                imageUrl: placeImage?.imageUrl,
                imageMethod: placeImage?.method
              };
            });

            const placeCreationResults = await Promise.all(placeCreationPromises);
            createdPlaces.push(...placeCreationResults);
          }

          const endTime7 = Date.now();
          testResults.timing.phase7 = endTime7 - startTime7;
          testResults.timing.total = endTime7 - startTime5;
          testResults.phases.phase7 = {
            story,
            characters: createdCharacters,
            places: createdPlaces,
            duration: endTime7 - startTime7
          };

          sendUpdate('phase7_complete', {
            phase: 'Phase 7',
            status: 'completed',
            story,
            characters: createdCharacters,
            places: createdPlaces,
            timing: endTime7 - startTime7
          });

          console.log(`✅ Database storage completed in ${endTime7 - startTime7}ms`);

          // Send final test results
          sendUpdate('test_complete', {
            message: 'Phases 5-7 testing completed successfully!',
            storyId,
            results: testResults,
            summary: {
              totalTime: testResults.timing.total,
              charactersCreated: createdCharacters.length,
              placesCreated: createdPlaces.length,
              imagesGenerated: characterImages.length + placeImages.length,
              errors: testResults.errors.length
            }
          });

          console.log('✅ Test phases 5-7 completed successfully');
          console.log(`📊 Summary: ${createdCharacters.length} characters, ${createdPlaces.length} places, ${characterImages.length + placeImages.length} images in ${testResults.timing.total}ms`);

          // Close the stream
          controller.close();

        } catch (error) {
          console.error('❌ Error in test phases 5-7:', error);
          testResults.errors.push(error instanceof Error ? error.message : 'Unknown error');

          // Send error update
          const errorUpdate = `data: ${JSON.stringify({
            phase: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : undefined,
            testResults
          })}\\n\\n`;
          controller.enqueue(encoder.encode(errorUpdate));

          controller.close();
        }
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Error setting up test phases 5-7:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to setup test phases 5-7',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}