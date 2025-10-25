import type { NextRequest } from "next/server";
import type { HNSDocument } from "@/types/hns";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  characters as charactersTable,
  settings as settingsTable,
  parts as partsTable,
  stories as storiesTable,
} from "@/lib/db/schema";
import {
  generateCharacterImagePrompt,
  generateCompleteHNS,
  generateSettingImagePrompt,
} from "@/lib/ai/hns-generator";
import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { IMAGE_GENERATION_MODEL } from "@/lib/ai/config";
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
    const imageFileName = `stories/${storyId}/${type}/${sanitizedName}_${nanoid()}.png`;

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
        // Helper function to send SSE data
        let isControllerClosed = false;

        try {
          const sendUpdate = (phase: string, data: Record<string, unknown>) => {
            if (isControllerClosed) {
              console.log(`Skipping SSE update (controller closed): ${phase}`);
              return;
            }
            try {
              const sseData = `data: ${JSON.stringify({ phase, data })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            } catch (error) {
              console.log(`Error sending SSE update: ${error instanceof Error ? error.message : String(error)}`);
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
              console.log(`⏱️ [${new Date().toISOString()}] Sending SSE event: ${phase}`);
              sendUpdate(phase, data);
            }
          );

          console.log(`⏱️ [${new Date().toISOString()}] generateCompleteHNS returned`);

          // ============= IMAGE GENERATION =============
          // CRITICAL: Send image generation start event FIRST, before hns_complete
          // This ensures the UI updates immediately without waiting for hns_complete processing
          sendUpdate("progress", {
            step: "generating_character_images",
            message: "Generating character images...",
          });
          console.log(`⏱️ [${new Date().toISOString()}] Sent generating_character_images event`);

          // Now send hns_complete with the full document
          // This can take time to serialize/send/parse, but UI is already updated
          sendUpdate("hns_complete", {
            message: "HNS structure generated successfully",
            hnsDocument: hnsDoc,
          });
          console.log(`⏱️ [${new Date().toISOString()}] Sent hns_complete event`);

          // Story is already created in generateCompleteHNS with incremental saves
          const storyId = hnsDoc.story.story_id || nanoid();

          // Now do the final database updates that were deferred from generateCompleteHNS
          // We do them here AFTER sending the UI update to avoid blocking the progress indicator
          console.log(`⏱️ [${new Date().toISOString()}] 💾 Starting deferred database updates...`);
          const dbUpdateStart = Date.now();

          // Update parts with chapters in hnsData
          const parts = hnsDoc.parts;
          const allChapters = hnsDoc.chapters;
          const completeStory = hnsDoc.story;

          if (parts && parts.length > 0) {
            console.log(`⏱️ [${new Date().toISOString()}] 💾 Updating ${parts.length} parts with chapters...`);
            for (const part of parts) {
              await db
                .update(partsTable)
                .set({
                  hnsData: part, // Already cleaned by generateCompleteHNS
                  updatedAt: new Date(),
                })
                .where(eq(partsTable.id, part.part_id));
            }
          }

          // Get existing hnsData to preserve storyImage
          const existingStoryData = await db
            .select({ hnsData: storiesTable.hnsData })
            .from(storiesTable)
            .where(eq(storiesTable.id, storyId))
            .limit(1);

          // Final update with complete HNS data
          await db
            .update(storiesTable)
            .set({
              status: "writing", // Keep at writing since character/setting images aren't generated yet
              hnsData: {
                ...existingStoryData[0]?.hnsData,
                story: completeStory,
                parts: parts,
                chapters: allChapters,
                characters: hnsDoc.characters,
                settings: hnsDoc.settings,
              },
              updatedAt: new Date(),
            })
            .where(eq(storiesTable.id, storyId));

          console.log(`⏱️ [${new Date().toISOString()}] ✅ Deferred database updates complete (${Date.now() - dbUpdateStart}ms)`);

          // Parts, chapters, and scenes are already created in generateCompleteHNS
          // with incremental saving after each phase

          // Characters are already created in generateCompleteHNS
          // Now generate images for them

          const characterImagePromises = hnsDoc.characters.map(
            async (character: any) => {
              try {
                console.log(`🔍 Processing character:`, character);
                const imagePrompt = generateCharacterImagePrompt(character);

                let imageUrl = null;

                // Generate image using Google Gemini with 16:9 aspect ratio
                // Note: aspectRatio needs to be specified in the prompt for gateway models
                try {
                  const result = await generateText({
                    model: gateway(IMAGE_GENERATION_MODEL),
                    prompt: `${imagePrompt}\n\nGenerate the image in 16:9 aspect ratio (widescreen format).`,
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
                    imageError instanceof Error ? imageError.message : String(imageError)
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

          // Settings are already created in generateCompleteHNS
          // Continue to generate setting images

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

                // Generate image using Google Gemini with 16:9 aspect ratio
                // Note: aspectRatio needs to be specified in the prompt for gateway models
                try {
                  const result = await generateText({
                    model: gateway(IMAGE_GENERATION_MODEL),
                    prompt: `${imagePrompt}\n\nGenerate the image in 16:9 aspect ratio (widescreen format).`,
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
                    imageError instanceof Error ? imageError.message : String(imageError)
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

          // Story generation is complete, keep status as 'writing' for editing
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

          // Close the stream safely
          if (!isControllerClosed) {
            try {
              controller.close();
              isControllerClosed = true;
            } catch (error) {
              console.log(`Error closing controller: ${error instanceof Error ? error.message : String(error)}`);
            }
          } else {
            console.log("Controller already closed, skipping close()");
          }
        } catch (error) {
          console.error("Error in HNS generation:", error);

          // Send error update if controller is still open
          if (!isControllerClosed) {
            try {
              const errorUpdate = `data: ${JSON.stringify({
                phase: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`;
              controller.enqueue(encoder.encode(errorUpdate));
              controller.close();
              isControllerClosed = true;
            } catch (closeError) {
              console.log(`Error closing controller during error handling: ${closeError instanceof Error ? closeError.message : String(closeError)}`);
            }
          } else {
            console.log("Controller already closed, skipping error update");
          }
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
