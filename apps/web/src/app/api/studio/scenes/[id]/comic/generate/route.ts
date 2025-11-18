import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
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

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/studio/scenes/[id]/comic/generate
 * Generate comic panels for a scene with SSE progress updates
 *
 * Authentication: Dual auth (API key OR session) via withAuthentication wrapper
 * - API key: x-api-key header (requires stories:write scope)
 * - Session: NextAuth.js session (story owner or admin)
 *
 * Response format:
 * - With Accept: text/event-stream - Returns SSE stream with progress updates
 * - Otherwise - Returns JSON response after completion
 */
async function handlePOST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    // Log immediately to verify handler is called
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("🎨 [COMIC GENERATE API] POST request received");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        const { id } = await params;
        console.log(`[COMIC GENERATE API] Scene ID: ${id}`);

        // Get authentication from context (set by withAuthentication wrapper)
        const auth = getAuth();
        console.log(`[COMIC GENERATE API] Auth check:`, {
            hasAuth: !!auth,
            userId: auth?.userId,
            type: auth?.type,
            email: auth?.email,
        });

        if (!auth?.userId) {
            console.error("[COMIC GENERATE API] ❌ Unauthorized - no userId");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        console.log("[COMIC GENERATE API] ✅ Authentication successful");

        // Parse optional parameters
        let body: any = {};
        try {
            body = await request.json();
            console.log(`[COMIC GENERATE API] Request body parsed:`, {
                targetPanelCount: body.targetPanelCount,
                regenerate: body.regenerate,
            });
        } catch {
            console.log(
                "[COMIC GENERATE API] No request body or parse error, using defaults",
            );
        }

        const { targetPanelCount, regenerate = false } = body;
        console.log(`[COMIC GENERATE API] Parameters:`, {
            targetPanelCount,
            regenerate,
        });

        // Validate targetPanelCount (8-12 panels recommended per scene)
        if (
            targetPanelCount !== undefined &&
            (targetPanelCount < 1 || targetPanelCount > 12)
        ) {
            console.error(
                `[COMIC GENERATE API] ❌ Invalid targetPanelCount: ${targetPanelCount}`,
            );
            return NextResponse.json(
                {
                    error: "targetPanelCount must be between 1 and 12 (recommended: 8-12 for optimal pacing)",
                },
                { status: 400 },
            );
        }

        console.log(`[COMIC GENERATE API] 🔍 Fetching scene with ID: ${id}`);
        // Fetch scene with chapter and story
        const scene = await db.query.scenes.findFirst({
            where: eq(scenes.id, id),
            with: {
                chapter: {
                    with: {
                        story: true,
                    },
                },
            },
        });

        console.log(`[COMIC GENERATE API] Scene query result:`, {
            found: !!scene,
            hasChapter: !!scene?.chapter,
            hasStory: !!scene?.chapter?.story,
            sceneTitle: scene?.title,
            chapterId: scene?.chapter?.id,
            storyId: scene?.chapter?.story?.id,
        });

        if (!scene || !scene.chapter) {
            console.error(`[COMIC GENERATE API] ❌ Scene not found: ${id}`);
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // Type assertion for nested query result
        type SceneWithChapterAndStory = typeof scene & {
            chapter: NonNullable<typeof scene.chapter> & {
                story: NonNullable<NonNullable<typeof scene.chapter>["story"]>;
            };
        };

        const sceneWithStory = scene as SceneWithChapterAndStory;

        if (!sceneWithStory.chapter.story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Extract story for type safety
        const story = sceneWithStory.chapter.story;
        console.log(`[COMIC GENERATE API] Story extracted:`, {
            storyId: story.id,
            storyTitle: story.title,
            authorId: story.authorId,
        });

        // Verify ownership
        // For API key auth, stories:write scope is already verified by requireScopes wrapper
        const isOwner = story.authorId === auth.userId;
        const hasApiKeyAccess = auth.type === "api-key"; // stories:write already verified

        console.log(`[COMIC GENERATE API] Ownership check:`, {
            isOwner,
            hasApiKeyAccess,
            storyAuthorId: story.authorId,
            authUserId: auth.userId,
            authType: auth.type,
        });

        if (!isOwner && !hasApiKeyAccess) {
            console.error(
                `[COMIC GENERATE API] ❌ Access denied - not owner and no API key`,
            );
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log(`[COMIC GENERATE API] ✅ Ownership verified`);

        // Check if panels already exist
        console.log(
            `[COMIC GENERATE API] Checking for existing panels (regenerate=${regenerate})`,
        );
        if (!regenerate) {
            const existingPanels = await db.query.comicPanels.findFirst({
                where: eq(comicPanels.sceneId, id),
            });

            console.log(`[COMIC GENERATE API] Existing panels check:`, {
                found: !!existingPanels,
                panelId: existingPanels?.id,
            });

            if (existingPanels) {
                console.error(`[COMIC GENERATE API] ❌ Panels already exist`);
                return NextResponse.json(
                    {
                        error: "Panels already exist for this scene. Set regenerate=true to overwrite.",
                    },
                    { status: 409 },
                );
            }
        } else {
            // Delete existing panels if regenerating
            console.log(
                `[COMIC GENERATE API] Deleting existing panels for regeneration`,
            );
            await db.delete(comicPanels).where(eq(comicPanels.sceneId, id));
            console.log(
                `[COMIC GENERATE API] 🔄 Regenerating comic panels for scene: ${scene.title}`,
            );
        }

        // Fetch characters for this story
        console.log(
            `[COMIC GENERATE API] Fetching characters for story: ${story.id}`,
        );
        const storyCharacters = await db.query.characters.findMany({
            where: eq(characters.storyId, story.id),
        });
        console.log(
            `[COMIC GENERATE API] Found ${storyCharacters.length} characters`,
        );

        // Fetch settings for this story
        console.log(
            `[COMIC GENERATE API] Fetching settings for story: ${story.id}`,
        );
        const storySettings = await db.query.settings.findMany({
            where: eq(settings.storyId, story.id),
        });
        console.log(
            `[COMIC GENERATE API] Found ${storySettings.length} settings`,
        );

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

        // Check if client wants SSE
        const acceptHeader = request.headers.get("accept") || "";
        const wantsSSE = acceptHeader.includes("text/event-stream");
        console.log(`[COMIC GENERATE API] SSE check:`, {
            acceptHeader,
            wantsSSE,
        });

        if (wantsSSE) {
            console.log(`[COMIC GENERATE API] Using SSE stream mode`);
            // Return SSE stream
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Helper to send SSE event
                        const sendEvent = (event: string, data: any) => {
                            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                            controller.enqueue(encoder.encode(message));
                        };

                        sendEvent("start", {
                            message: `Generating comic panels for scene: ${scene.title}`,
                            sceneId: id,
                            sceneTitle: scene.title,
                        });

                        console.log(
                            `🎨 Generating comic panels for scene: ${scene.title}`,
                        );

                        // Use service layer to orchestrate complete generation
                        const result = await generateAndSaveComic({
                            sceneId: id,
                            scene: scene as any,
                            story: story as any,
                            characters: storyCharacters as any,
                            settings: storySettings as any,
                            targetPanelCount,
                            onProgress: (current, total, status) => {
                                sendEvent("progress", {
                                    current,
                                    total,
                                    status,
                                    percentage: Math.round(
                                        (current / total) * 100,
                                    ),
                                });
                            },
                        });

                        // Fetch updated scene
                        const updatedScene = await db.query.scenes.findFirst({
                            where: eq(scenes.id, id),
                        });

                        if (!updatedScene) {
                            sendEvent("error", {
                                error: "Failed to retrieve updated scene",
                            });
                            controller.close();
                            return;
                        }

                        console.log(
                            `✅ Generated ${result.panels.length} comic panels for scene: ${scene.title}`,
                        );

                        sendEvent("complete", {
                            success: true,
                            message: "Comic panels generated successfully",
                            scene: {
                                id: updatedScene.id,
                                title: updatedScene.title,
                                comicStatus: updatedScene.comicStatus,
                                comicPanelCount: updatedScene.comicPanelCount,
                                comicGeneratedAt: updatedScene.comicGeneratedAt,
                                comicVersion: updatedScene.comicVersion,
                            },
                            result: {
                                toonplay: result.toonplay,
                                panels: result.panels,
                                evaluation: result.evaluation, // Include quality evaluation results
                                metadata: result.metadata,
                            },
                        });

                        controller.close();
                    } catch (error) {
                        console.error("Error generating comic:", error);
                        const message = `event: error\ndata: ${JSON.stringify({
                            error: "Internal server error",
                            message:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                        })}\n\n`;
                        controller.enqueue(encoder.encode(message));
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
        } else {
            // Return regular JSON response
            console.log(
                `[COMIC GENERATE API] 🎨 Generating comic panels for scene: ${scene.title}`,
            );
            console.log(`[COMIC GENERATE API] Service parameters:`, {
                sceneId: id,
                sceneTitle: scene.title,
                storyId: story.id,
                characterCount: storyCharacters.length,
                settingCount: storySettings.length,
                targetPanelCount,
            });

            // Use service layer for generation
            console.log(
                `[COMIC GENERATE API] Calling generateAndSaveComic service...`,
            );
            let result: Awaited<ReturnType<typeof generateAndSaveComic>>;
            try {
                result = await generateAndSaveComic({
                    sceneId: id,
                    scene: scene as any,
                    story: story as any,
                    characters: storyCharacters as any,
                    settings: storySettings as any,
                    targetPanelCount,
                });
                console.log(`[COMIC GENERATE API] ✅ Service call completed:`, {
                    panelCount: result.panels.length,
                    hasToonplay: !!result.toonplay,
                    hasEvaluation: !!result.evaluation,
                    hasMetadata: !!result.metadata,
                });
            } catch (serviceError) {
                console.error(
                    `[COMIC GENERATE API] ❌ Service call failed:`,
                    serviceError,
                );
                console.error(`[COMIC GENERATE API] Error details:`, {
                    message:
                        serviceError instanceof Error
                            ? serviceError.message
                            : "Unknown error",
                    stack:
                        serviceError instanceof Error
                            ? serviceError.stack
                            : undefined,
                });
                throw serviceError;
            }

            // Fetch updated scene after generation
            const updatedScene = await db.query.scenes.findFirst({
                where: eq(scenes.id, id),
            });

            if (!updatedScene) {
                return NextResponse.json(
                    { error: "Failed to retrieve updated scene" },
                    { status: 500 },
                );
            }

            console.log(
                `✅ Generated ${result.panels.length} comic panels for scene: ${scene.title}`,
            );

            return NextResponse.json({
                success: true,
                message: "Comic panels generated successfully",
                scene: {
                    id: updatedScene.id,
                    title: updatedScene.title,
                    comicStatus: updatedScene.comicStatus,
                    comicPanelCount: updatedScene.comicPanelCount,
                    comicGeneratedAt: updatedScene.comicGeneratedAt,
                    comicVersion: updatedScene.comicVersion,
                },
                result: {
                    toonplay: result.toonplay,
                    panels: result.panels.map((p) => ({
                        id: p.id,
                        panelNumber: p.panelNumber,
                        shotType: p.shotType,
                        imageUrl: p.imageUrl,
                        imageVariants: p.imageVariants,
                        metadata: p.metadata,
                        description: p.description,
                        narrative: p.narrative,
                        dialogue: p.dialogue,
                        sfx: p.sfx,
                    })),
                    evaluation: result.evaluation,
                    metadata: result.metadata,
                },
            });
        }
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("[COMIC GENERATE API] ❌ ERROR in handlePOST:");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error(
            "Error type:",
            error instanceof Error ? error.constructor.name : typeof error,
        );
        console.error(
            "Error message:",
            error instanceof Error ? error.message : String(error),
        );
        console.error(
            "Error stack:",
            error instanceof Error ? error.stack : "No stack trace",
        );

        if (error instanceof Error) {
            console.error("Error name:", error.name);
            if ("cause" in error) {
                console.error(
                    "Error cause:",
                    (error as { cause?: unknown }).cause,
                );
            }
        }

        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return NextResponse.json(
            {
                error: "Internal server error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// Export with authentication wrappers
export const POST = requireScopes("stories:write")(handlePOST);
