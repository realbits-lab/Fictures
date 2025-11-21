/**
 * Panel Image Generation API Endpoint
 *
 * POST /api/studio/panel-images
 *
 * Generates comic panel images for a scene from existing toonplay data.
 * Requires toonplay to be pre-generated via /api/studio/toonplay endpoint.
 * Streams progress updates via Server-Sent Events (SSE).
 */

import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { db } from "@/lib/db";
import {
    characters,
    comicPanels,
    scenes,
    settings,
} from "@/lib/schemas/database";
import { generateAndSaveComic } from "@/lib/studio/services/comic-service";

export const maxDuration = 300; // 5 minutes

interface GeneratePanelsRequest {
    sceneId: string;
    targetPanelCount?: number;
    regenerate?: boolean; // Delete existing panels and regenerate
}

export const POST = requireScopes("stories:write")(
    async (request: NextRequest) => {
        try {
            const auth = getAuth();

            // Parse request body
            const body: GeneratePanelsRequest = await request.json();
            const { sceneId, targetPanelCount, regenerate = false } = body;

            if (!sceneId) {
                return new Response(
                    JSON.stringify({ error: "sceneId is required" }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            // Validate targetPanelCount (8-12 panels per scene recommended)
            if (
                targetPanelCount !== undefined &&
                (targetPanelCount < 1 || targetPanelCount > 12)
            ) {
                return new Response(
                    JSON.stringify({
                        error: "targetPanelCount must be between 1 and 12",
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            // Fetch scene with chapter and story
            const scene = await db.query.scenes.findFirst({
                where: eq(scenes.id, sceneId),
                with: {
                    chapter: {
                        with: {
                            story: true,
                        },
                    },
                },
            });

            if (!scene || !scene.chapter) {
                return new Response(
                    JSON.stringify({ error: "Scene not found" }),
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            // Extract story for type safety
            // Note: TypeScript doesn't infer nested 'with' relationships properly
            const story = scene.chapter.story as
                | typeof scene.chapter.story
                | undefined;

            if (!story) {
                return new Response(
                    JSON.stringify({ error: "Story not found" }),
                    {
                        status: 404,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            // Verify ownership
            if (story.authorId !== auth.userId) {
                return new Response(
                    JSON.stringify({
                        error: "Forbidden - You do not own this story",
                    }),
                    {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            // Check if panels already exist
            if (!regenerate) {
                const existingPanels = await db.query.comicPanels.findFirst({
                    where: eq(comicPanels.sceneId, sceneId),
                });

                if (existingPanels) {
                    return new Response(
                        JSON.stringify({
                            error: "Panels already exist for this scene. Set regenerate=true to overwrite.",
                        }),
                        {
                            status: 409,
                            headers: { "Content-Type": "application/json" },
                        },
                    );
                }
            } else {
                // Delete existing panels if regenerating
                await db
                    .delete(comicPanels)
                    .where(eq(comicPanels.sceneId, sceneId));
            }

            // Fetch characters for this story
            const storyCharacters = await db.query.characters.findMany({
                where: eq(characters.storyId, story.id),
            });

            // Fetch settings for this story
            const storySettings = await db.query.settings.findMany({
                where: eq(settings.storyId, story.id),
            });

            // Use the first setting or create a default one
            const _primarySetting = storySettings[0] || {
                id: "default",
                name: "Default Setting",
                summary: "A generic setting",
                mood: "neutral",
                sensory: null,
                visualReferences: null,
                colorPalette: null,
                architecturalStyle: null,
                imageUrl: null,
                imageVariants: null,
                storyId: story.id,
                adversityElements: null,
                symbolicMeaning: null,
                cycleAmplification: null,
                emotionalResonance: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Set up SSE streaming
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    const sendEvent = (data: Record<string, unknown>) => {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
                        );
                    };

                    try {
                        sendEvent({
                            type: "start",
                            message: "Starting panel generation...",
                        });

                        // Generate panels using service layer
                        const result = await generateAndSaveComic({
                            sceneId,
                            scene: scene as never,
                            story: story as never,
                            characters: storyCharacters as never,
                            settings: storySettings as never,
                            targetPanelCount,
                            onProgress: (
                                current: number,
                                total: number,
                                status: string,
                            ) => {
                                sendEvent({
                                    type: "progress",
                                    current,
                                    total,
                                    status,
                                });
                            },
                        });

                        // Send completion event
                        sendEvent({
                            type: "complete",
                            result: {
                                toonplay: result.toonplay,
                                panels: result.panels.map((p) => ({
                                    id: p.id,
                                    panel_number: p.panelNumber,
                                    shot_type: p.shotType,
                                    image_url: p.imageUrl,
                                    narrative: p.narrative,
                                    dialogue: p.dialogue,
                                    sfx: p.sfx,
                                })),
                                metadata: result.metadata,
                            },
                        });

                        controller.close();
                    } catch (error) {
                        console.error("Panel generation error:", error);
                        sendEvent({
                            type: "error",
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error occurred",
                        });
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        } catch (error) {
            console.error("Panel generation API error:", error);
            return new Response(
                JSON.stringify({
                    error: "Internal server error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    },
);
