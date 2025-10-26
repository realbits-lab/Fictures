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
import { generateStoryImage } from "@/lib/services/image-generation";
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

                // Generate image with automatic fallback to placeholder on failure
                const result = await generateStoryImage({
                  prompt: imagePrompt,
                  storyId: storyId,
                  imageType: 'character',
                  style: 'vivid',
                  quality: 'standard',
                });

                // generateStoryImage now ALWAYS returns a valid result (real or placeholder)
                const imageUrl = result.url;
                const optimizedSet = result.optimizedSet;
                const isPlaceholder = result.isPlaceholder || false;

                console.log(`✅ Image for character ${character.name}:`, imageUrl);
                if (optimizedSet) {
                  console.log(`✅ Optimized variants: ${optimizedSet.variants.length}`);
                } else if (isPlaceholder) {
                  console.log(`⚠️  Using placeholder image (generation failed)`);
                }

                // CRITICAL: ALWAYS update database with valid imageUrl (never null)
                await db.update(charactersTable)
                  .set({
                    imageUrl,                          // Never null - always real or placeholder
                    imageVariants: (optimizedSet as unknown as Record<string, unknown>) || null,  // May be null for placeholders
                  })
                  .where(eq(charactersTable.name, character.name));

                return {
                  characterId: character.character_id,
                  name: character.name,
                  imageUrl,
                  isPlaceholder,  // Flag to identify placeholders for later regeneration
                };
              } catch (error) {
                // This should rarely happen now (generateStoryImage handles errors internally)
                // But keep as safety net - return a result with hardcoded placeholder
                console.error(
                  `Unexpected error processing character ${character.name}:`,
                  error
                );

                const fallbackUrl = 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/character-default.png';

                // Even in catastrophic failure, ensure database gets a valid URL
                await db.update(charactersTable)
                  .set({
                    imageUrl: fallbackUrl,
                    imageVariants: null,
                  })
                  .where(eq(charactersTable.name, character.name));

                return {
                  characterId: character.character_id,
                  name: character.name,
                  imageUrl: fallbackUrl,
                  isPlaceholder: true,
                };
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

                // Generate image with automatic fallback to placeholder on failure
                const result = await generateStoryImage({
                  prompt: imagePrompt,
                  storyId: storyId,
                  imageType: 'setting',
                  style: 'vivid',
                  quality: 'standard',
                });

                // generateStoryImage now ALWAYS returns a valid result (real or placeholder)
                const imageUrl = result.url;
                const optimizedSet = result.optimizedSet;
                const isPlaceholder = result.isPlaceholder || false;

                console.log(`✅ Image for setting ${setting.name}:`, imageUrl);
                if (optimizedSet) {
                  console.log(`✅ Optimized variants: ${optimizedSet.variants.length}`);
                } else if (isPlaceholder) {
                  console.log(`⚠️  Using placeholder image (generation failed)`);
                }

                // CRITICAL: ALWAYS update database with valid imageUrl (never null)
                await db.update(settingsTable)
                  .set({
                    imageUrl,                          // Never null - always real or placeholder
                    imageVariants: (optimizedSet as unknown as Record<string, unknown>) || null,  // May be null for placeholders
                  })
                  .where(eq(settingsTable.name, setting.name));

                return {
                  settingId: setting.setting_id,
                  name: setting.name,
                  imageUrl,
                  isPlaceholder,  // Flag to identify placeholders for later regeneration
                };
              } catch (error) {
                // This should rarely happen now (generateStoryImage handles errors internally)
                // But keep as safety net - return a result with hardcoded placeholder
                console.error(`Unexpected error processing setting ${setting.name}:`, error);

                const fallbackUrl = 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/system/placeholders/setting-visual.png';

                // Even in catastrophic failure, ensure database gets a valid URL
                await db.update(settingsTable)
                  .set({
                    imageUrl: fallbackUrl,
                    imageVariants: null,
                  })
                  .where(eq(settingsTable.name, setting.name));

                return {
                  settingId: setting.setting_id,
                  name: setting.name,
                  imageUrl: fallbackUrl,
                  isPlaceholder: true,
                };
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
