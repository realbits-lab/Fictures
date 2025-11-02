/**
 * Novel Generation Streaming API
 *
 * Unified endpoint for complete novel generation using the Adversity-Triumph Engine.
 * Replaces the legacy HNS generation system.
 *
 * This endpoint:
 * 1. Orchestrates all 9 novel generation phases
 * 2. Streams progress updates via Server-Sent Events (SSE)
 * 3. Creates database records for story, characters, settings, parts, chapters, scenes
 * 4. Generates and optimizes images for all visual elements
 *
 * Usage:
 *   POST /studio/api/novels/generate
 *   Body: { userPrompt, preferredGenre?, preferredTone?, characterCount?, language? }
 *   Returns: SSE stream with progress updates
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, parts, chapters, scenes, characters, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateCompleteNovel, type NovelGenerationOptions, type ProgressData } from '@/lib/novels/orchestrator';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

function createSSEMessage(data: ProgressData): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json() as NovelGenerationOptions;
    const { userPrompt, preferredGenre, preferredTone, characterCount, settingCount, partsCount, chaptersPerPart, scenesPerChapter, language } = body;

    if (!userPrompt?.trim()) {
      return new Response('User prompt is required', { status: 400 });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generatedStoryId: string | null = null;
          let generatedStory: any = null;
          let generatedCharacters: any[] = [];
          let generatedSettings: any[] = [];
          let generatedParts: any[] = [];
          let generatedChapters: any[] = [];
          let generatedScenes: any[] = [];

          // Progress callback to stream updates
          const onProgress = async (progress: ProgressData) => {
            // Try to send SSE message, but continue if controller is closed
            try {
              controller.enqueue(encoder.encode(createSSEMessage(progress)));
            } catch (error) {
              // Controller may be closed if client disconnected or timeout occurred
              // This is not fatal - we continue with database insertion
              console.log('SSE stream closed, continuing with database insertion...');
            }

            // Store data for database insertion
            if (progress.phase === 'story_summary_complete') {
              generatedStory = progress.data?.storySummary;
            } else if (progress.phase === 'characters_complete') {
              generatedCharacters = progress.data?.characters || [];
            } else if (progress.phase === 'settings_complete') {
              generatedSettings = progress.data?.settings || [];
            } else if (progress.phase === 'parts_complete') {
              generatedParts = progress.data?.parts || [];
            } else if (progress.phase === 'chapters_complete') {
              generatedChapters = progress.data?.chapters || [];
            } else if (progress.phase === 'scene_summaries_complete') {
              // Scene summaries are integrated into scenes
            } else if (progress.phase === 'scene_content_complete') {
              // Will be handled after complete generation
            }
          };

          // Generate the complete novel
          const result = await generateCompleteNovel(
            {
              userPrompt,
              preferredGenre,
              preferredTone,
              characterCount,
              settingCount,
              partsCount,
              chaptersPerPart,
              scenesPerChapter,
              language,
            },
            onProgress
          );

          // Create database records
          try {
            controller.enqueue(
              encoder.encode(
                createSSEMessage({
                  phase: 'scene_content_progress',
                  message: 'Saving story to database...',
                })
              )
            );
          } catch (error) {
            console.log('SSE stream closed, continuing with database insertion...');
          }

          // Insert story
          generatedStoryId = nanoid();

          // Extract first tone value if multiple are provided (comma-separated)
          let toneValue: 'hopeful' | 'dark' | 'bittersweet' | 'satirical' = 'hopeful'; // default
          if (result.story.tone) {
            const firstTone = result.story.tone.split(',')[0].trim().toLowerCase();
            // Validate against enum values
            if (['hopeful', 'dark', 'bittersweet', 'satirical'].includes(firstTone)) {
              toneValue = firstTone as 'hopeful' | 'dark' | 'bittersweet' | 'satirical';
            }
          }

          const [storyRecord] = await db
            .insert(stories)
            .values({
              id: generatedStoryId,
              authorId: session.user.id,  // Fixed: Use 'authorId' (correct schema field name)
              title: result.story.title,
              genre: result.story.genre,
              summary: result.story.summary, // Adversity-Triumph: General thematic premise
              tone: toneValue, // Adversity-Triumph: Emotional direction (validated enum value)
              moralFramework: result.story.moralFramework, // Adversity-Triumph: Virtue framework
              status: 'writing',  // Fixed: Use 'writing' instead of 'draft' (valid enum value)
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Insert characters and create ID mapping
          const characterIdMap = new Map<string, string>();
          if (result.characters.length > 0) {
            const characterRecords = result.characters.map((char) => {
              const newId = nanoid();
              characterIdMap.set(char.id, newId); // Map temp ID to database ID
              return {
                id: newId,
                storyId: generatedStoryId!,
                name: char.name,
                isMain: char.isMain,
                summary: char.summary,
                coreTrait: char.coreTrait,
                internalFlaw: char.internalFlaw,
                externalGoal: char.externalGoal,
                personality: char.personality,
                backstory: char.backstory,
                relationships: char.relationships,
                physicalDescription: char.physicalDescription,
                voiceStyle: char.voiceStyle,
                visualStyle: char.visualStyle,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(characters).values(characterRecords);
          }

          // Insert settings and create ID mapping
          const settingIdMap = new Map<string, string>();
          if (result.settings.length > 0) {
            const settingRecords = result.settings.map((setting) => {
              const newId = nanoid();
              settingIdMap.set(setting.id, newId); // Map temp ID to database ID
              return {
                id: newId,
                storyId: generatedStoryId!,
                name: setting.name,
                description: setting.description,
                adversityElements: setting.adversityElements,
                symbolicMeaning: setting.symbolicMeaning,
                cycleAmplification: setting.cycleAmplification,
                mood: setting.mood,
                emotionalResonance: setting.emotionalResonance,
                sensory: setting.sensory,
                architecturalStyle: setting.architecturalStyle,
                visualStyle: setting.visualStyle,
                visualReferences: setting.visualReferences,
                colorPalette: setting.colorPalette,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(settings).values(settingRecords);
          }

          // Insert parts and create ID mapping
          const partIdMap = new Map<string, string>();
          if (result.parts.length > 0) {
            const partRecords = result.parts.map((part, index) => {
              const newId = nanoid();
              partIdMap.set(part.id, newId); // Map temp ID to database ID

              // Map temporary character IDs to database character IDs in characterArcs
              const mappedCharacterArcs = part.characterArcs.map((arc) => ({
                ...arc,
                characterId: characterIdMap.get(arc.characterId) || arc.characterId,
              }));

              return {
                id: newId,
                storyId: generatedStoryId!,
                authorId: session.user.id,
                title: part.title,
                summary: part.summary,
                orderIndex: part.orderIndex,
                characterArcs: mappedCharacterArcs,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(parts).values(partRecords);
          }

          // Insert chapters and create ID mapping
          const chapterIdMap = new Map<string, string>();
          if (result.chapters.length > 0) {
            const chapterRecords = result.chapters.map((chapter, index) => {
              const newId = nanoid();
              chapterIdMap.set(chapter.id, newId); // Map temp ID to database ID

              // Map temporary character IDs to database character IDs in focusCharacters array
              const mappedFocusCharacters = chapter.focusCharacters?.map((charId) =>
                characterIdMap.get(charId) || charId
              ) || [];

              return {
                id: newId,
                storyId: generatedStoryId!,
                authorId: session.user.id,
                partId: null, // Will be linked later if needed
                title: chapter.title,
                summary: chapter.summary,
                characterId: chapter.characterId ? characterIdMap.get(chapter.characterId) || null : null,
                arcPosition: chapter.arcPosition,
                contributesToMacroArc: chapter.contributesToMacroArc,
                focusCharacters: mappedFocusCharacters,
                adversityType: chapter.adversityType,
                virtueType: chapter.virtueType,
                seedsPlanted: chapter.seedsPlanted,
                seedsResolved: chapter.seedsResolved,
                connectsToPreviousChapter: chapter.connectsToPreviousChapter,
                createsNextAdversity: chapter.createsNextAdversity,
                orderIndex: index,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(chapters).values(chapterRecords);
          }

          // Insert scenes (map chapter IDs)
          const sceneIdMap = new Map<string, string>();
          if (result.scenes.length > 0) {
            console.log('[Novel Generation] Chapter ID Map:', Object.fromEntries(chapterIdMap));
            console.log('[Novel Generation] Scene chapter IDs:', result.scenes.map(s => ({ sceneId: s.id, chapterId: s.chapterId })));

            const sceneRecords = result.scenes.map((scene, index) => {
              const newId = nanoid();
              sceneIdMap.set(scene.id, newId); // Map temp ID to database ID
              const mappedChapterId = scene.chapterId ? chapterIdMap.get(scene.chapterId) || null : null;
              console.log(`[Novel Generation] Scene ${index + 1}: chapterId=${scene.chapterId}, mapped=${mappedChapterId}`);

              // Map temporary character IDs to database character IDs in characterFocus array
              const mappedCharacterFocus = scene.characterFocus?.map((charId) =>
                characterIdMap.get(charId) || charId
              ) || [];

              return {
                id: newId,
                chapterId: mappedChapterId,
                title: scene.title || `Scene ${index + 1}`, // Fallback title if missing
                summary: scene.summary,
                content: scene.content,
                cyclePhase: scene.cyclePhase,
                emotionalBeat: scene.emotionalBeat,
                // Planning metadata from scene summary generation
                characterFocus: mappedCharacterFocus,
                sensoryAnchors: scene.sensoryAnchors || [],
                dialogueVsDescription: scene.dialogueVsDescription || 'balanced',
                suggestedLength: scene.suggestedLength || 'medium',
                orderIndex: index,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            await db.insert(scenes).values(sceneRecords);

            console.log('[Novel Generation] ✅ All entities created with FK relationships');
          }

          // Phase 9: Generate images (now that we have actual storyId)
          const totalImages = 1 + result.characters.length + result.settings.length + result.scenes.length; // +1 for story cover
          let completedImages = 0;

          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'images_start',
                message: 'Generating story cover, character, setting, and scene images...',
                data: {
                  totalImages,
                },
              })
            )
          );

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

          // Generate story cover image
          try {
            controller.enqueue(
              encoder.encode(
                createSSEMessage({
                  phase: 'images_progress',
                  message: 'Generating story cover image...',
                  data: {
                    currentItem: 1,
                    totalItems: totalImages,
                    percentage: Math.round((1 / totalImages) * 100),
                  },
                })
              )
            );

            const storyCoverResponse = await fetch(`${baseUrl}/studio/api/generation/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                storyId: generatedStoryId,
                imageType: 'story',
                targetData: {
                  title: result.story.title,
                  genre: result.story.genre,
                  summary: result.story.summary,
                  tone: result.story.tone,
                },
              }),
            });

            if (storyCoverResponse.ok) {
              const imageResult = await storyCoverResponse.json();
              console.log('[Novel Generation] Generated story cover image:', imageResult.originalUrl);

              // Update story record with cover image
              await db
                .update(stories)
                .set({
                  imageUrl: imageResult.originalUrl,
                  imageVariants: imageResult.optimizedSet,
                  updatedAt: new Date(),
                })
                .where(eq(stories.id, generatedStoryId!));
            } else {
              const error = await storyCoverResponse.json();
              console.error('[Novel Generation] Failed to generate story cover:', error);
            }

            completedImages++;
          } catch (error) {
            console.error('[Novel Generation] Error generating story cover:', error);
            completedImages++;
          }

          // Generate character images
          for (let i = 0; i < result.characters.length; i++) {
            const character = result.characters[i];
            const characterDbId = characterIdMap.get(character.id);

            try {
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({
                    phase: 'images_progress',
                    message: `Generating image for ${character.name}...`,
                    data: {
                      currentItem: completedImages + 1,
                      totalItems: totalImages,
                      percentage: Math.round(((completedImages + 1) / totalImages) * 100),
                    },
                  })
                )
              );

              const imageResponse = await fetch(`${baseUrl}/studio/api/generation/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  storyId: generatedStoryId,
                  imageType: 'character',
                  targetData: character,
                }),
              });

              if (imageResponse.ok) {
                const imageResult = await imageResponse.json();
                console.log(`[Novel Generation] Generated image for character ${character.name}:`, imageResult.originalUrl);

                // Update character record with image URL and optimized variants
                if (characterDbId) {
                  await db
                    .update(characters)
                    .set({
                      imageUrl: imageResult.originalUrl,
                      imageVariants: imageResult.optimizedSet,
                      updatedAt: new Date(),
                    })
                    .where(eq(characters.id, characterDbId));
                }
              } else {
                const error = await imageResponse.json();
                console.error(`[Novel Generation] Failed to generate image for character ${character.name}:`, error);
              }

              completedImages++;
            } catch (error) {
              console.error(`[Novel Generation] Error generating image for character ${character.name}:`, error);
              completedImages++;
            }
          }

          // Generate setting images
          for (let i = 0; i < result.settings.length; i++) {
            const setting = result.settings[i];
            const settingDbId = settingIdMap.get(setting.id);

            try {
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({
                    phase: 'images_progress',
                    message: `Generating image for ${setting.name}...`,
                    data: {
                      currentItem: completedImages + 1,
                      totalItems: totalImages,
                      percentage: Math.round(((completedImages + 1) / totalImages) * 100),
                    },
                  })
                )
              );

              const imageResponse = await fetch(`${baseUrl}/studio/api/generation/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  storyId: generatedStoryId,
                  imageType: 'setting',
                  targetData: setting,
                }),
              });

              if (imageResponse.ok) {
                const imageResult = await imageResponse.json();
                console.log(`[Novel Generation] Generated image for setting ${setting.name}:`, imageResult.originalUrl);

                // Update setting record with image URL and optimized variants
                if (settingDbId) {
                  await db
                    .update(settings)
                    .set({
                      imageUrl: imageResult.originalUrl,
                      imageVariants: imageResult.optimizedSet,
                      updatedAt: new Date(),
                    })
                    .where(eq(settings.id, settingDbId));
                }
              } else {
                const error = await imageResponse.json();
                console.error(`[Novel Generation] Failed to generate image for setting ${setting.name}:`, error);
              }

              completedImages++;
            } catch (error) {
              console.error(`[Novel Generation] Error generating image for setting ${setting.name}:`, error);
              completedImages++;
            }
          }

          // Generate scene images
          for (let i = 0; i < result.scenes.length; i++) {
            const scene = result.scenes[i];
            const sceneDbId = sceneIdMap.get(scene.id);

            try {
              controller.enqueue(
                encoder.encode(
                  createSSEMessage({
                    phase: 'images_progress',
                    message: `Generating image for scene: ${scene.title}...`,
                    data: {
                      currentItem: completedImages + 1,
                      totalItems: totalImages,
                      percentage: Math.round(((completedImages + 1) / totalImages) * 100),
                    },
                  })
                )
              );

              const imageResponse = await fetch(`${baseUrl}/studio/api/generation/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  storyId: generatedStoryId,
                  sceneId: sceneDbId,
                  imageType: 'scene',
                  targetData: scene,
                }),
              });

              if (imageResponse.ok) {
                const imageResult = await imageResponse.json();
                console.log(`[Novel Generation] Generated image for scene ${scene.title}:`, imageResult.originalUrl);

                // Update scene record with image URL and optimized variants
                if (sceneDbId) {
                  await db
                    .update(scenes)
                    .set({
                      imageUrl: imageResult.originalUrl,
                      imageVariants: imageResult.optimizedSet,
                      updatedAt: new Date(),
                    })
                    .where(eq(scenes.id, sceneDbId));
                }
              } else {
                const error = await imageResponse.json();
                console.error(`[Novel Generation] Failed to generate image for scene ${scene.title}:`, error);
              }

              completedImages++;
            } catch (error) {
              console.error(`[Novel Generation] Error generating image for scene ${scene.title}:`, error);
              completedImages++;
            }
          }

          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'images_complete',
                message: 'All images generated',
                data: {
                  completedImages,
                  totalImages,
                },
              })
            )
          );

          // Send completion message
          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'complete',
                message: 'Story generation complete!',
                data: {
                  storyId: generatedStoryId,
                  story: storyRecord,
                  charactersCount: result.characters.length,
                  settingsCount: result.settings.length,
                  partsCount: result.parts.length,
                  chaptersCount: result.chapters.length,
                  scenesCount: result.scenes.length,
                },
              })
            )
          );

          controller.close();
        } catch (error) {
          console.error('Novel generation error:', error);

          controller.enqueue(
            encoder.encode(
              createSSEMessage({
                phase: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
                error: error instanceof Error ? error.message : String(error),
              })
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Novel generation request error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to start novel generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
