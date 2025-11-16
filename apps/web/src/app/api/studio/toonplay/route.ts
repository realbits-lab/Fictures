/**
 * Toonplay Generation API
 *
 * POST /api/studio/toonplay
 *
 * Converts a narrative scene to webtoon toonplay with panel images.
 */

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";
import { generateCompleteToonplay } from "@/lib/studio/services/toonplay-service";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 minutes for toonplay + image generation

/**
 * Request schema
 */
const ToonplayRequestSchema = z.object({
    sceneId: z.string(),
    evaluationMode: z.enum(["quick", "standard", "thorough"]).optional(),
    language: z.string().optional(),
});

/**
 * POST /api/studio/toonplay
 *
 * Generate toonplay from scene
 *
 * Authentication: Dual auth (API key OR session) via withAuthentication wrapper
 * - API key: x-api-key header (requires stories:write scope)
 * - Session: NextAuth.js session (story owner or admin)
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        console.log("[toonplay-api] 🚀 Route handler called");
        try {
            console.log("[toonplay-api] 🔐 Checking authentication...");
            
            // Get authentication from context (set by withAuthentication wrapper)
            const auth = getAuth();
            console.log("[toonplay-api] Auth context:", {
                hasAuth: !!auth,
                userId: auth?.userId,
                type: auth?.type,
            });

            if (!auth?.userId) {
                console.error("[toonplay-api] ❌ No authentication found");
                return NextResponse.json(
                    { 
                        success: false,
                        error: {
                            code: "UNAUTHORIZED",
                            message: "Unauthorized - authentication required",
                        },
                    },
                    { status: 401 },
                );
            }

            // 1. Parse and validate request
            const body = await request.json();
            const params = ToonplayRequestSchema.parse(body);

            console.log("[toonplay-api] 📥 Request:", params);

            // 2. Fetch scene
            const sceneResult = await db
                .select()
                .from(scenes)
                .where(eq(scenes.id, params.sceneId))
                .limit(1);

            if (sceneResult.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "SCENE_NOT_FOUND",
                            message: `Scene not found: ${params.sceneId}`,
                        },
                    },
                    { status: 404 },
                );
            }

            const scene = sceneResult[0];
            console.log("[toonplay-api] ✅ Scene fetched:", {
                sceneId: scene.id,
                chapterId: scene.chapterId,
                title: scene.title,
                hasContent: !!scene.content,
            });

            // 3. Fetch chapter
            const chapterResult = await db
                .select()
                .from(chapters)
                .where(eq(chapters.id, scene.chapterId))
                .limit(1);

            if (chapterResult.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "CHAPTER_NOT_FOUND",
                            message: "Chapter not found for this scene",
                        },
                    },
                    { status: 404 },
                );
            }

            const chapter = chapterResult[0];
            console.log("[toonplay-api] ✅ Chapter fetched:", {
                chapterId: chapter.id,
                storyId: chapter.storyId,
                title: chapter.title,
            });

            // 4. Fetch part (optional)
            let _part = null;
            if (chapter.partId) {
                const partResult = await db
                    .select()
                    .from(parts)
                    .where(eq(parts.id, chapter.partId))
                    .limit(1);

                if (partResult.length > 0) {
                    _part = partResult[0];
                    console.log("[toonplay-api] ℹ️ Part context loaded:", {
                        partId: _part.id,
                        title: _part.title,
                    });
                }
            }

            // 5. Fetch story (from chapter)
            const storyResult = await db
                .select()
                .from(stories)
                .where(eq(stories.id, chapter.storyId))
                .limit(1);

            if (storyResult.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "STORY_NOT_FOUND",
                            message: "Story not found for this scene",
                        },
                    },
                    { status: 404 },
                );
            }

            const story = storyResult[0];
            console.log("[toonplay-api] ✅ Story fetched:", {
                storyId: story.id,
                authorId: story.authorId,
                title: story.title,
            });

            // Verify ownership
            // For API key auth, stories:write scope is already verified by requireScopes wrapper
            const isOwner = story.authorId === auth.userId;
            const hasApiKeyAccess = auth.type === "api-key"; // stories:write already verified

            if (!isOwner && !hasApiKeyAccess) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 },
                );
            }

            // 6. Fetch characters and settings for the story
            const storyCharacters = await db
                .select()
                .from(characters)
                .where(eq(characters.storyId, story.id));

            const storySettings = await db
                .select()
                .from(settings)
                .where(eq(settings.storyId, story.id));

            console.log(
                `[toonplay-api] Scene: ${scene.title}, Story: ${story.title}`,
            );
            console.log(
                `[toonplay-api] Context: ${storyCharacters.length} characters, ${storySettings.length} settings`,
            );
            console.log("[toonplay-api] Character IDs:", storyCharacters.map((c) => c.id));
            console.log("[toonplay-api] Setting IDs:", storySettings.map((s) => s.id));

            // Validate required data
            if (storySettings.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "SETTING_REQUIRED",
                            message: "At least one setting is required for toonplay generation",
                        },
                    },
                    { status: 400 },
                );
            }

            // 7. Generate toonplay with panel images
            const result = await generateCompleteToonplay({
                scene,
                story,
                characters: storyCharacters,
                settings: storySettings,
                storyId: story.id,
                chapterId: chapter.id,
                sceneId: scene.id,
                language: params.language,
                evaluationMode: params.evaluationMode,
            });

            console.log(
                `[toonplay-api] ✅ Toonplay generated: ${result.panels.length} panels, Score: ${result.evaluation.weighted_score.toFixed(2)}/5.0`,
            );
            console.log("[toonplay-api] Toonplay metadata:", {
                totalGenerationTime: result.metadata.totalGenerationTime,
                toonplayGenerationTime: result.metadata.toonplayGenerationTime,
                panelsGenerationTime: result.metadata.panelsGenerationTime,
            });

            // 4. Update scene with toonplay data
            await db
                .update(scenes)
                .set({
                    comicToonplay: result.toonplay,
                    comicStatus: "published" as const,
                    comicPanelCount: result.panels.length,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(scenes.id, params.sceneId));

            console.log(`[toonplay-api] ✅ Scene updated with toonplay data`);

            // 5. Return success response
            return NextResponse.json({
                success: true,
                result: {
                    toonplay: result.toonplay,
                    panels: result.panels.map((p) => ({
                        panel_number: p.panel_number,
                        imageUrl: p.imageUrl,
                        blobUrl: p.blobUrl,
                        width: p.width,
                        height: p.height,
                        optimizedSet: p.optimizedSet,
                    })),
                    evaluation: result.evaluation,
                    metadata: {
                        generationTime: result.metadata.totalGenerationTime,
                        toonplayTime: result.metadata.toonplayGenerationTime,
                        iterations: result.evaluation.iterations,
                    },
                },
            });
        } catch (error) {
            console.error("[toonplay-api] ❌ Error:", error);
            console.error("[toonplay-api] ❌ Error type:", typeof error);
            console.error("[toonplay-api] ❌ Error name:", error instanceof Error ? error.name : "N/A");
            console.error("[toonplay-api] ❌ Error stack:", error instanceof Error ? error.stack : "No stack");
            console.error("[toonplay-api] ❌ Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "VALIDATION_ERROR",
                            message: "Invalid request parameters",
                            details: (error as any).errors || error.message,
                        },
                    },
                    { status: 400 },
                );
            }

            const errorMessage = error instanceof Error ? error.message : "Toonplay generation failed";
            const errorStack = error instanceof Error ? error.stack : undefined;

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "GENERATION_FAILED",
                        message: errorMessage,
                        details: process.env.NODE_ENV === "development" ? { stack: errorStack } : undefined,
                    },
                },
                { status: 500 },
            );
        }
    }),
);
