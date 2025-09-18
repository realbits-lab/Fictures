import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import * as yaml from 'js-yaml';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { stories, parts, characters as charactersTable, places as placesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { RelationshipManager } from '@/lib/db/relationships';
import {
  storyConceptDevelopment,
  generatePartSpecifications,
  generateCharacterData,
  generatePlaceData
} from '@/lib/ai/story-development';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Authentication required', { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, language = 'English' } = body;

    if (!prompt) {
      return new Response('Story prompt is required', { status: 400 });
    }

    // Create a readable stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const storyId = nanoid();

          // Helper function to send SSE data
          const sendUpdate = (phase: string, data: Record<string, unknown>) => {
            const sseData = `data: ${JSON.stringify({ phase, data })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          };

          console.log('🚀 Starting streaming story development process...');

          // Phase 1: Story Foundation
          sendUpdate('progress', { phase: 'Phase 1', description: 'Story Foundation - Analyzing prompt and creating story concept', status: 'in_progress' });

          console.log('Phase 1: Story Foundation');
          const storyConcept = await storyConceptDevelopment(prompt, language);

          // Convert story concept to YAML and send update
          const storyYaml = yaml.dump(storyConcept);
          sendUpdate('phase1_complete', {
            phase: 'Phase 1',
            status: 'completed',
            yamlData: {
              storyYaml: storyYaml
            },
            storyConcept
          });

          console.log('✅ Story concept developed and streamed');

          // Phase 2: Part Development
          sendUpdate('progress', { phase: 'Phase 2', description: 'Part Development - Creating detailed part structure', status: 'in_progress' });

          console.log('Phase 2: Part Development');
          const partSpecs = await generatePartSpecifications(storyConcept);

          // Convert part specs to YAML and send update
          const partsYaml = partSpecs.map((spec, index) => `# Part ${index + 1}\n${yaml.dump(spec)}`).join('\n---\n');
          sendUpdate('phase2_complete', {
            phase: 'Phase 2',
            status: 'completed',
            yamlData: {
              partsYaml: partsYaml
            },
            partSpecs
          });

          console.log('✅ Part specifications completed and streamed');

          // Phase 3: Character Development
          sendUpdate('progress', { phase: 'Phase 3', description: 'Character Development - Building character profiles with Korean names', status: 'in_progress' });

          console.log('Phase 3: Character Development');
          const characters = await generateCharacterData(storyConcept, language);

          // Convert characters to YAML and send update
          const charactersYaml = characters.map(c => {
            const parsedData = c.parsedData as Record<string, unknown>;
            return `# Character: ${parsedData?.name || c.id}\n${c.content}`;
          }).join('\n\n---\n\n');
          sendUpdate('phase3_complete', {
            phase: 'Phase 3',
            status: 'completed',
            yamlData: {
              charactersYaml: charactersYaml
            },
            characters
          });

          console.log('✅ Character data generated and streamed');

          // Phase 4: Place Development
          sendUpdate('progress', { phase: 'Phase 4', description: 'Place Development - Creating location details and settings', status: 'in_progress' });

          console.log('Phase 4: Place Development');
          const places = await generatePlaceData(storyConcept, language);

          // Convert places to YAML and send update
          const placesYaml = places.map(p => {
            const parsedData = p.parsedData as Record<string, unknown>;
            return `# Place: ${parsedData?.name || p.name}\n${p.content}`;
          }).join('\n\n---\n\n');
          sendUpdate('phase4_complete', {
            phase: 'Phase 4',
            status: 'completed',
            yamlData: {
              placesYaml: placesYaml
            },
            places
          });

          console.log('✅ Place data generated and streamed');

          // Phase 5: Character Image Generation (Parallel)
          sendUpdate('progress', { phase: 'Phase 5', description: 'Character Images - Generating AI images for each character', status: 'in_progress' });

          console.log('Phase 5: Character Image Generation (Parallel)');
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
                    imageUrl: imageResult.imageUrl
                  };
                } else {
                  console.warn(`⚠️ Failed to generate image for character: ${characterName}`);
                  return null;
                }
              } catch (error) {
                console.error(`❌ Error generating image for character:`, error);
                return null;
              }
            });

            const characterImageResults = await Promise.all(characterImagePromises);
            characterImages.push(...characterImageResults.filter(result => result !== null));
          }

          sendUpdate('phase5_complete', {
            phase: 'Phase 5',
            status: 'completed',
            characterImages
          });

          console.log('✅ Character images generated');

          // Phase 6: Place Image Generation (Parallel)
          sendUpdate('progress', { phase: 'Phase 6', description: 'Place Images - Generating AI images for each location', status: 'in_progress' });

          console.log('Phase 6: Place Image Generation (Parallel)');
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
                    imageUrl: imageResult.imageUrl
                  };
                } else {
                  console.warn(`⚠️ Failed to generate image for place: ${placeName}`);
                  return null;
                }
              } catch (error) {
                console.error(`❌ Error generating image for place:`, error);
                return null;
              }
            });

            const placeImageResults = await Promise.all(placeImagePromises);
            placeImages.push(...placeImageResults.filter(result => result !== null));
          }

          sendUpdate('phase6_complete', {
            phase: 'Phase 6',
            status: 'completed',
            placeImages
          });

          console.log('✅ Place images generated');

          // Database Storage Phase
          sendUpdate('progress', { phase: 'Database', description: 'Storing story, character, and place data in database', status: 'in_progress' });

          console.log('📚 Story generation completed, storing in database...');

          // Store main story in database
          const [story] = await db.insert(stories).values({
            id: storyId,
            title: storyConcept.title || 'Generated Story',
            description: 'AI-generated story',
            genre: storyConcept.genre || 'General',
            authorId: session.user.id,
            targetWordCount: storyConcept.words || 60000,
            status: 'draft',
            isPublic: false,
            content: JSON.stringify(storyConcept),
            partIds: [],
            chapterIds: [],
          }).returning();

          // Create parts
          const createdParts = [];
          if (storyConcept.parts && Array.isArray(storyConcept.parts)) {
            for (let partIndex = 0; partIndex < storyConcept.parts.length; partIndex++) {
              const storyPart = storyConcept.parts[partIndex];
              const partWordCount = storyConcept.structure?.dist?.[partIndex]
                ? Math.floor((storyConcept.words || 60000) * (storyConcept.structure.dist[partIndex] / 100))
                : Math.floor((storyConcept.words || 60000) / storyConcept.parts.length);

              const partId = await RelationshipManager.addPartToStory(
                storyId,
                {
                  title: `Part ${storyPart.part}: ${storyPart.goal}`,
                  authorId: session.user.id,
                  orderIndex: storyPart.part,
                  targetWordCount: partWordCount,
                  status: 'planned',
                  content: JSON.stringify(storyPart),
                  chapterIds: [],
                }
              );

              const [part] = await db.select()
                .from(parts)
                .where(eq(parts.id, partId))
                .limit(1);

              createdParts.push(part);
            }
          }

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
                imageUrl: characterImage?.imageUrl
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
                imageUrl: placeImage?.imageUrl
              };
            });

            const placeCreationResults = await Promise.all(placeCreationPromises);
            createdPlaces.push(...placeCreationResults);
          }

          // Send final completion update
          sendUpdate('database_complete', {
            phase: 'Database',
            status: 'completed',
            story: {
              id: storyId,
              ...storyConcept,
              databaseStory: story,
              parts: createdParts,
              characters: createdCharacters,
              places: createdPlaces,
            }
          });

          // Send final complete signal
          sendUpdate('complete', {
            message: 'Story generation completed successfully!',
            storyId,
            yamlData: {
              storyYaml,
              charactersYaml,
              placesYaml,
              partsYaml
            }
          });

          console.log('✅ Database storage completed and final update sent');

          // Close the stream
          controller.close();

        } catch (error) {
          console.error('❌ Error in streaming story generation:', error);

          // Send error update
          const errorUpdate = `data: ${JSON.stringify({
            phase: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : undefined
          })}\n\n`;
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
    console.error('❌ Error setting up streaming:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to setup streaming',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}