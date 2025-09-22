import type { NextRequest } from "next/server";
import type { HNSDocument } from "@/types/hns";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import {
  stories,
  parts,
  chapters,
  scenes,
  characters as charactersTable,
  settings as settingsTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateCharacterImagePrompt,
  generateCompleteHNS,
  generateSettingImagePrompt,
} from "@/lib/ai/hns-generator";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { put } from "@vercel/blob";

// Helper function to save Gemini generated images to Vercel Blob
async function saveImageToStorage(
  file: any,
  storyId: string,
  type: string,
  name: string
): Promise<string | null> {
  try {
    if (!file || typeof file !== 'object') {
      console.log('No valid file object provided');
      return null;
    }

    // Get the base64 data from either format
    const base64Data = file.base64Data || file.data;
    const mimeType = file.mediaType || file.mimeType || 'image/png';

    if (!base64Data || typeof base64Data !== 'string') {
      console.log('No valid base64 data found in file');
      return null;
    }

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create filename with story ID and type
    const safeName = name || 'unnamed';
    const sanitizedName = safeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const imageFileName = `${storyId}/${type}s/${sanitizedName}_${nanoid()}.png`;

    // Upload to Vercel Blob
    const blob = await put(imageFileName, Buffer.from(bytes), {
      access: 'public',
      contentType: mimeType,
    });

    console.log(`✅ Saved ${type} image to blob storage: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`❌ Error saving ${type} image to storage:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (supports both session and API key)
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return new Response("Authentication required", { status: 401 });
    }

    // Check if user has permission to write stories
    if (!hasRequiredScope(authResult, 'stories:write')) {
      return new Response("Insufficient permissions. Required scope: stories:write", { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, language = "English" } = body;

    if (!prompt) {
      return new Response("Story prompt is required", { status: 400 });
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Helper function to send SSE data
          let isControllerClosed = false;
          const sendUpdate = (phase: string, data: Record<string, unknown>) => {
            if (isControllerClosed) {
              console.log(`Skipping SSE update (controller closed): ${phase}`);
              return;
            }
            try {
              const sseData = `data: ${JSON.stringify({ phase, data })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            } catch (error) {
              console.log(`Error sending SSE update: ${error.message}`);
              isControllerClosed = true;
            }
          };

          console.log("🚀 Starting HNS story generation...");

          // Generate complete HNS document
          sendUpdate("progress", {
            step: "generating_hns",
            message: "Generating complete story structure using HNS...",
          });

          const hnsDoc: HNSDocument = await generateCompleteHNS(
            prompt,
            language,
            authResult.user.id,
            undefined,
            (phase, data) => {
              // Send progress updates via SSE
              sendUpdate(phase, data);
            }
          );

          sendUpdate("hns_complete", {
            message: "HNS structure generated successfully",
            hnsDocument: hnsDoc,
          });

          // Store in database
          sendUpdate("progress", {
            step: "storing_database",
            message: "Storing story data in database...",
          });

          // Story is already created in generateCompleteHNS with incremental saves
          const storyId = hnsDoc.story.story_id || nanoid();

          // Parts, chapters, and scenes are already created in generateCompleteHNS
          // with incremental saving after each phase

          // ============= QUALITY ANALYSIS & IMPROVEMENT PHASE =============
          // Update status to analyzing quality
          await db.update(stories)
            .set({
              status: 'analyzing_quality',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          sendUpdate("progress", {
            step: "analyzing_quality",
            message: "Analyzing story quality and structure...",
          });

          // Fetch all story data for analysis
          const [storyData] = await db.select().from(stories).where(eq(stories.id, storyId));
          const partsData = await db.select().from(parts).where(eq(parts.storyId, storyId));
          const chaptersData = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
          const scenesData = await db.select().from(scenes)
            .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
            .where(eq(chapters.storyId, storyId));
          const charactersData = await db.select().from(charactersTable).where(eq(charactersTable.storyId, storyId));
          const settingsData = await db.select().from(settingsTable).where(eq(settingsTable.storyId, storyId));

          // Prepare data for analysis
          const analysisData = {
            story: storyData,
            parts: partsData,
            chapters: chaptersData,
            scenes: scenesData.map(s => s.scenes),
            characters: charactersData,
            settings: settingsData
          };

          // Call story-analysis API internally
          const { validateStoryStructure } = await import('@/lib/services/validation');
          const { evaluateStoryContent } = await import('@/lib/services/evaluation');

          const validationResult = validateStoryStructure(analysisData);
          const evaluationResult = await evaluateStoryContent(analysisData);

          sendUpdate("analysis_complete", {
            message: "Quality analysis completed",
            validation: {
              overallValid: validationResult.overallValid,
              totalErrors: validationResult.totalErrors,
              totalWarnings: validationResult.totalWarnings
            },
            evaluation: {
              overallScore: evaluationResult.storyEvaluation?.overallScore || 0
            }
          });

          // Update status to analysis complete
          await db.update(stories)
            .set({
              status: 'analysis_complete',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          // ============= IMPROVEMENT PHASE =============
          // Only run improvements if there are issues to fix
          if (validationResult.totalErrors > 0 || validationResult.totalWarnings > 5 ||
              (evaluationResult.storyEvaluation?.overallScore || 0) < 75) {

            await db.update(stories)
              .set({
                status: 'improving_content',
                updatedAt: new Date()
              })
              .where(eq(stories.id, storyId));

            sendUpdate("progress", {
              step: "improving_content",
              message: "Applying AI-powered improvements...",
            });

            // Call story-improvement service internally
            const { improveStoryContent } = await import('@/lib/services/story-improvement');

            const improvementResult = await improveStoryContent({
              analysisResult: {
                validation: validationResult,
                evaluation: evaluationResult
              },
              originalData: analysisData,
              options: {
                updateLevel: 'moderate',
                preserveUserContent: false, // Since it's initial generation, we can be more aggressive
                autoApply: false // We'll apply manually to have control
              }
            });

            sendUpdate("improvement_progress", {
              message: "Improvements generated",
              totalChanges: improvementResult.summary.totalChanges,
              majorImprovements: improvementResult.summary.majorImprovements
            });

            // Apply improvements to database
            // Story improvements
            if (improvementResult.changes.story.fieldsUpdated.length > 0) {
              await db.update(stories)
                .set({
                  ...improvementResult.improved.story,
                  updatedAt: new Date()
                })
                .where(eq(stories.id, storyId));
            }

            // Parts improvements
            for (const part of improvementResult.improved.parts) {
              const changeLog = improvementResult.changes.parts.find(c => c.id === part.id);
              if (changeLog && changeLog.fieldsUpdated.length > 0) {
                await db.update(parts)
                  .set({
                    ...part,
                    updatedAt: new Date()
                  })
                  .where(eq(parts.id, part.id));
              }
            }

            // Chapters improvements
            for (const chapter of improvementResult.improved.chapters) {
              const changeLog = improvementResult.changes.chapters.find(c => c.id === chapter.id);
              if (changeLog && changeLog.fieldsUpdated.length > 0) {
                await db.update(chapters)
                  .set({
                    ...chapter,
                    updatedAt: new Date()
                  })
                  .where(eq(chapters.id, chapter.id));
              }
            }

            // Scenes improvements
            for (const scene of improvementResult.improved.scenes) {
              const changeLog = improvementResult.changes.scenes.find(c => c.id === scene.id);
              if (changeLog && changeLog.fieldsUpdated.length > 0) {
                await db.update(scenes)
                  .set({
                    ...scene,
                    updatedAt: new Date()
                  })
                  .where(eq(scenes.id, scene.id));
              }
            }

            // Characters improvements
            for (const character of improvementResult.improved.characters) {
              const changeLog = improvementResult.changes.characters.find(c => c.id === character.id);
              if (changeLog && changeLog.fieldsUpdated.length > 0) {
                await db.update(charactersTable)
                  .set({
                    ...character,
                    updatedAt: new Date()
                  })
                  .where(eq(charactersTable.id, character.id));
              }
            }

            // Settings improvements
            for (const setting of improvementResult.improved.settings) {
              const changeLog = improvementResult.changes.settings.find(c => c.id === setting.id);
              if (changeLog && changeLog.fieldsUpdated.length > 0) {
                await db.update(settingsTable)
                  .set({
                    ...setting,
                    updatedAt: new Date()
                  })
                  .where(eq(settingsTable.id, setting.id));
              }
            }

            sendUpdate("improvement_complete", {
              message: "Story improvements applied successfully",
              summary: improvementResult.summary
            });

            // Update status to improvement complete
            await db.update(stories)
              .set({
                status: 'improvement_complete',
                updatedAt: new Date()
              })
              .where(eq(stories.id, storyId));

            // ============= RE-ANALYSIS AFTER IMPROVEMENTS =============
            sendUpdate("progress", {
              step: "re_analyzing_quality",
              message: "Re-analyzing improved story quality...",
            });

            // Fetch updated story data for re-analysis
            const [updatedStoryData] = await db.select().from(stories).where(eq(stories.id, storyId));
            const updatedPartsData = await db.select().from(parts).where(eq(parts.storyId, storyId));
            const updatedChaptersData = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
            const updatedScenesData = await db.select().from(scenes)
              .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
              .where(eq(chapters.storyId, storyId));
            const updatedCharactersData = await db.select().from(charactersTable).where(eq(charactersTable.storyId, storyId));
            const updatedSettingsData = await db.select().from(settingsTable).where(eq(settingsTable.storyId, storyId));

            const updatedAnalysisData = {
              story: updatedStoryData,
              parts: updatedPartsData,
              chapters: updatedChaptersData,
              scenes: updatedScenesData.map(s => s.scenes),
              characters: updatedCharactersData,
              settings: updatedSettingsData
            };

            // Re-run analysis to verify improvements
            const postValidationResult = validateStoryStructure(updatedAnalysisData);
            const postEvaluationResult = await evaluateStoryContent(updatedAnalysisData);

            sendUpdate("re_analysis_complete", {
              message: "Quality re-analysis completed - Improvement verified!",
              before: {
                validation: {
                  overallValid: validationResult.overallValid,
                  totalErrors: validationResult.totalErrors,
                  totalWarnings: validationResult.totalWarnings
                },
                evaluation: {
                  overallScore: evaluationResult.storyEvaluation?.overallScore || 0
                }
              },
              after: {
                validation: {
                  overallValid: postValidationResult.overallValid,
                  totalErrors: postValidationResult.totalErrors,
                  totalWarnings: postValidationResult.totalWarnings
                },
                evaluation: {
                  overallScore: postEvaluationResult.storyEvaluation?.overallScore || 0
                }
              },
              improvement: {
                errorsFixed: validationResult.totalErrors - postValidationResult.totalErrors,
                warningsReduced: validationResult.totalWarnings - postValidationResult.totalWarnings,
                scoreImproved: (postEvaluationResult.storyEvaluation?.overallScore || 0) - (evaluationResult.storyEvaluation?.overallScore || 0)
              }
            });

          } else {
            sendUpdate("improvement_skipped", {
              message: "Story quality is already high, skipping improvements",
              analysis: {
                validation: {
                  overallValid: validationResult.overallValid,
                  totalErrors: validationResult.totalErrors,
                  totalWarnings: validationResult.totalWarnings
                },
                evaluation: {
                  overallScore: evaluationResult.storyEvaluation?.overallScore || 0
                }
              }
            });
          }

          // ============= CONTINUE TO IMAGE GENERATION =============
          // Characters are already created in generateCompleteHNS
          // Update status to generating character images
          await db.update(stories)
            .set({
              status: 'generating_character_images',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          sendUpdate("progress", {
            step: "generating_character_images",
            message: "Generating character images...",
          });

          const characterImagePromises = hnsDoc.characters.map(
            async (character: any) => {
              try {
                console.log(`🔍 Processing character:`, character);
                const imagePrompt = generateCharacterImagePrompt(character);

                let imageUrl = null;

                // Generate image using Google Gemini
                try {
                  const result = await generateText({
                    model: google("gemini-2.5-flash-image-preview"),
                    prompt: imagePrompt,
                  });

                  // Check if the result contains generated image files
                  if (result.files) {
                    const files = result.files;
                    if (files.length > 0) {
                      console.log(
                        `Generated image for character ${character.name}:`,
                        files[0]
                      );
                      imageUrl = await saveImageToStorage(
                        files[0],
                        storyId,
                        'character',
                        character.name
                      );
                    }
                  }
                } catch (imageError) {
                  console.log(
                    `Image generation skipped for ${character.name}:`,
                    imageError.message
                  );
                }

                // Update existing character with image URL if generated
                if (imageUrl) {
                  await db.update(charactersTable)
                    .set({ imageUrl })
                    .where(eq(charactersTable.name, character.name));
                }

                return {
                  characterId: character.character_id,
                  name: character.name,
                  imageUrl,
                };
              } catch (error) {
                console.error(
                  `Error generating image for character ${character.name}:`,
                  error
                );
                return null;
              }
            }
          );

          const characterResults = await Promise.all(characterImagePromises);

          // Update status to character images complete
          await db.update(stories)
            .set({
              status: 'character_images_complete',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          // Settings are already created in generateCompleteHNS
          // Update status to generating setting images
          await db.update(stories)
            .set({
              status: 'generating_setting_images',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          sendUpdate("progress", {
            step: "generating_setting_images",
            message: "Generating setting images...",
          });

          const settingImagePromises = hnsDoc.settings.map(
            async (setting: any) => {
              try {
                console.log(`🔍 Processing setting:`, setting);
                const imagePrompt = generateSettingImagePrompt(setting);

                let imageUrl = null;

                // Generate image using Google Gemini
                try {
                  const result = await generateText({
                    model: google("gemini-2.5-flash-image-preview"),
                    prompt: imagePrompt,
                  });

                  // Check if the result contains generated image files
                  if (result.files) {
                    const files = result.files;
                    if (files.length > 0) {
                      console.log(
                        `Generated image for setting ${setting.name}:`,
                        files[0]
                      );
                      imageUrl = await saveImageToStorage(
                        files[0],
                        storyId,
                        'setting',
                        setting.name
                      );
                    }
                  }
                } catch (imageError) {
                  console.log(
                    `Image generation skipped for ${setting.name}:`,
                    imageError.message
                  );
                }

                // Update existing setting with image URL if generated
                if (imageUrl) {
                  await db.update(settingsTable)
                    .set({ imageUrl })
                    .where(eq(settingsTable.name, setting.name));
                }

                return {
                  settingId: setting.setting_id,
                  name: setting.name,
                  imageUrl,
                };
              } catch (error) {
                console.error(`Error generating image for setting ${setting.name}:`, error);
                return null;
              }
            }
          );

          const settingResults = await Promise.all(settingImagePromises);

          // Update status to all complete
          await db.update(stories)
            .set({
              status: 'completed',
              updatedAt: new Date()
            })
            .where(eq(stories.id, storyId));

          // Send completion
          sendUpdate("complete", {
            message: "Story generation completed successfully!",
            storyId: storyId,
            story: hnsDoc.story,
            hnsDocument: hnsDoc,
            characters: characterResults.filter((r) => r !== null),
            settings: settingResults.filter((r) => r !== null),
          });

          console.log("✅ HNS story generation and storage complete");

          // Close the stream
          controller.close();
        } catch (error) {
          console.error("Error in HNS generation:", error);

          // Send error update
          const errorUpdate = `data: ${JSON.stringify({
            phase: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorUpdate));

          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error setting up HNS streaming:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to setup HNS streaming",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
