import type { NextRequest } from "next/server";
import type { HNSDocument } from "@/types/hns";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  chapters,
  characters as charactersTable,
  parts,
  scenes,
  settings as settingsTable,
  stories,
} from "@/lib/db/schema";
import {
  generateCharacterImagePrompt,
  generateCompleteHNS,
  generateSettingImagePrompt,
} from "@/lib/ai/hns-generator";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Authentication required", { status: 401 });
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
          const sendUpdate = (phase: string, data: Record<string, unknown>) => {
            const sseData = `data: ${JSON.stringify({ phase, data })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          };

          console.log("🚀 Starting HNS story generation...");

          // Generate complete HNS document
          sendUpdate("progress", {
            step: "generating_hns",
            message: "Generating complete story structure using HNS...",
          });

          const hnsDoc: HNSDocument = await generateCompleteHNS(
            prompt,
            language
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

          // Create main story
          const storyId = hnsDoc.story.story_id || nanoid();
          const [createdStory] = await db
            .insert(stories)
            .values({
              id: storyId,
              title: hnsDoc.story.story_title,
              description: hnsDoc.story.premise,
              genre: hnsDoc.story.genre.join(", "),
              authorId: session.user.id,
              status: "draft",
              isPublic: false,
              premise: hnsDoc.story.premise,
              dramaticQuestion: hnsDoc.story.dramatic_question,
              theme: hnsDoc.story.theme,
              hnsData: hnsDoc.story as Record<string, unknown>,
              partIds: hnsDoc.story.parts.map((p: any) => p.part_id),
              chapterIds: hnsDoc.story.parts.flatMap((p: any) =>
                p.chapters.map((c: any) => c.chapter_id)
              ),
            })
            .returning();

          // Create parts
          for (const part of hnsDoc.story.parts) {
            await db.insert(parts).values({
              id: part.part_id,
              title: part.part_title,
              description: part.summary,
              storyId: storyId,
              authorId: session.user.id,
              orderIndex: parseInt(part.part_id.split("_").pop() || "1"),
              structuralRole: part.structural_role,
              summary: part.summary,
              keyBeats: part.key_beats,
              hnsData: part as Record<string, unknown>,
              chapterIds: part.chapters,
              status: "planned",
            });
          }

          // Create chapters
          for (const chapter of hnsDoc.chapters) {
            const partId = chapter.part_ref;
            await db.insert(chapters).values({
              id: chapter.chapter_id,
              title: chapter.chapter_title,
              summary: chapter.summary,
              storyId: storyId,
              partId: partId,
              authorId: session.user.id,
              orderIndex: chapter.chapter_number,
              pacingGoal: chapter.pacing_goal,
              actionDialogueRatio: chapter.action_dialogue_ratio,
              chapterHook: chapter.chapter_hook,
              hnsData: chapter as Record<string, unknown>,
              sceneIds: chapter.scenes,
              status: "draft",
            });
          }

          // Create scenes
          for (const scene of hnsDoc.scenes) {
            await db.insert(scenes).values({
              id: scene.scene_id,
              title: `Scene ${scene.scene_number}`,
              chapterId: scene.chapter_ref,
              orderIndex: scene.scene_number,
              goal: scene.goal,
              conflict: scene.conflict,
              outcome: scene.outcome,
              povCharacterId: scene.pov_character_id,
              settingId: scene.setting_id,
              narrativeVoice: scene.narrative_voice,
              summary: scene.summary,
              entryHook: scene.entry_hook,
              emotionalShift: scene.emotional_shift,
              hnsData: scene as Record<string, unknown>,
              characterIds: scene.character_ids,
              placeIds: [scene.setting_id],
              status: "planned",
            });
          }

          // Create characters with image generation
          sendUpdate("progress", {
            step: "generating_character_images",
            message: "Generating character images...",
          });

          const characterImagePromises = hnsDoc.story.characters.map(
            async (character: any) => {
              try {
                const imagePrompt = generateCharacterImagePrompt(character);

                let imageUrl = null;

                // Generate image using Google Gemini
                try {
                  const result = await generateText({
                    model: google("gemini-2.0-flash-exp"),
                    prompt: imagePrompt,
                  });

                  // Check if the result contains generated image files
                  if (result.files) {
                    const files = result.files;
                    if (files.length > 0) {
                      // For now, we'll just log the file info
                      // In production, you'd want to save these files to blob storage
                      console.log(
                        `Generated image for character ${character.character_name}:`,
                        files[0]
                      );
                      // imageUrl = await saveImageToStorage(files[0]);
                    }
                  }
                } catch (imageError) {
                  console.log(
                    `Image generation skipped for ${character.character_name}:`,
                    imageError.message
                  );
                  // Continue without image - not critical for story creation
                }

                await db.insert(charactersTable).values({
                  id: character.character_id,
                  name: character.name,
                  storyId: storyId,
                  isMain: ["protagonist", "antagonist"].includes(
                    character.role
                  ),
                  role: character.role,
                  archetype: character.archetype,
                  summary: character.summary,
                  storyline: character.storyline,
                  personality: character.personality,
                  backstory: character.backstory,
                  motivations: character.motivations,
                  voice: character.voice as Record<string, unknown>,
                  physicalDescription: character.physical_description as Record<
                    string,
                    unknown
                  >,
                  visualReferenceId: character.visual_reference_id,
                  hnsData: character as Record<string, unknown>,
                  content: JSON.stringify(character),
                  imageUrl: imageUrl,
                });

                return {
                  characterId: character.character_id,
                  name: character.name,
                  imageUrl,
                };
              } catch (error) {
                console.error(
                  `Error creating character ${character.name}:`,
                  error
                );
                return null;
              }
            }
          );

          const characterResults = await Promise.all(characterImagePromises);

          // Create settings with image generation
          sendUpdate("progress", {
            step: "generating_setting_images",
            message: "Generating setting images...",
          });

          const settingImagePromises = hnsDoc.story.settings.map(
            async (setting: any) => {
              try {
                const imagePrompt = generateSettingImagePrompt(setting);

                let imageUrl = null;

                // Generate image using Google Gemini
                try {
                  const result = await generateText({
                    model: google("gemini-2.0-flash-exp"),
                    prompt: imagePrompt,
                  });

                  // Check if the result contains generated image files
                  if (result.files) {
                    const files = result.files;
                    if (files.length > 0) {
                      // For now, we'll just log the file info
                      // In production, you'd want to save these files to blob storage
                      console.log(
                        `Generated image for setting ${setting.setting_name}:`,
                        files[0]
                      );
                      // imageUrl = await saveImageToStorage(files[0]);
                    }
                  }
                } catch (imageError) {
                  console.log(
                    `Image generation skipped for ${setting.setting_name}:`,
                    imageError.message
                  );
                  // Continue without image - not critical for story creation
                }

                await db.insert(settingsTable).values({
                  id: setting.setting_id,
                  name: setting.name,
                  storyId: storyId,
                  description: setting.description,
                  mood: setting.mood,
                  sensory: setting.sensory as Record<string, string[]>,
                  visualStyle: setting.visual_style,
                  visualReferences: setting.visual_references,
                  colorPalette: setting.color_palette,
                  architecturalStyle: setting.architectural_style,
                  imageUrl: imageUrl,
                });

                return {
                  settingId: setting.setting_id,
                  name: setting.name,
                  imageUrl,
                };
              } catch (error) {
                console.error(`Error creating setting ${setting.name}:`, error);
                return null;
              }
            }
          );

          const settingResults = await Promise.all(settingImagePromises);

          // Send completion
          sendUpdate("complete", {
            message: "Story generation completed successfully!",
            storyId: storyId,
            story: createdStory,
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
