/**
 * Scene Summaries API Route
 *
 * GET /studio/api/scene-summaries - Get scenes for a chapter
 * POST /studio/api/scene-summaries - Generate scene summaries using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { chapters, scenes, settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSceneSummaries } from "@/lib/studio/generators/scene-summaries-generator";
import type { GenerateSceneSummariesParams } from "@/lib/studio/generators/types";
import {
    type Chapter,
    insertSceneSchema,
    type Scene,
    type Setting,
    type Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateSceneSummariesErrorResponse,
    GenerateSceneSummariesRequest,
    GenerateSceneSummariesResponse,
} from "../types";
import { generateSceneSummariesSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * GET /studio/api/scene-summaries
 *
 * Get scenes for a chapter
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");

        if (!chapterId) {
            return NextResponse.json(
                { error: "chapterId parameter is required" },
                { status: 400 },
            );
        }

        // Get chapter and check access
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId));
        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // Get story and check access permissions
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));
        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Check access permissions - only allow author access for now
        if (story.authorId !== authResult.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // Get scenes for the chapter
        const chapterScenes = await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(scenes.orderIndex);

        return NextResponse.json({
            scenes: chapterScenes.map((scene) => ({
                ...scene,
                chapter: {
                    id: chapter.id,
                    title: chapter.title,
                    storyId: chapter.storyId,
                },
                story: {
                    id: story.id,
                    title: story.title,
                    authorId: story.authorId,
                },
            })),
        });
    } catch (error) {
        console.error("Error fetching scenes:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /studio/api/scene-summaries
 *
 * Generate scene summaries for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE SUMMARIES API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE SUMMARIES API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE SUMMARIES API] Insufficient scopes:", {
                required: "stories:write",
                actual: authResult.scopes,
            });
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:write",
                },
                { status: 403 },
            );
        }

        console.log("✅ [SCENE SUMMARIES API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: unknown = await request.json();
        const validatedData: GenerateSceneSummariesRequest =
            generateSceneSummariesSchema.parse(
                body as GenerateSceneSummariesRequest,
            );

        console.log("[SCENE SUMMARIES API] Request parameters:", {
            storyId: validatedData.storyId,
            scenesPerChapter: validatedData.scenesPerChapter,
            language: validatedData.language,
        });

        // 4. Fetch story and verify ownership
        const storyResults = await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedData.storyId));

        const story: Story | undefined = storyResults[0] as Story | undefined;

        if (!story) {
            console.error("❌ [SCENE SUMMARIES API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error(
                "❌ [SCENE SUMMARIES API] Access denied - not story author",
            );
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [SCENE SUMMARIES API] Story verified:", {
            id: story.id,
            title: story.title,
        });

        // 5. Fetch chapters for the story
        const storyChapters = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, validatedData.storyId))
            .orderBy(chapters.orderIndex)) as Chapter[];

        if (storyChapters.length === 0) {
            console.error(
                "❌ [SCENE SUMMARIES API] No chapters found for story",
            );
            return NextResponse.json(
                { error: "Story must have chapters before generating scenes" },
                { status: 400 },
            );
        }

        console.log(
            `✅ [SCENE SUMMARIES API] Found ${storyChapters.length} chapters`,
        );

        // 6. Fetch settings for the story
        const storySettings = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, validatedData.storyId))) as Setting[];

        console.log(
            `[SCENE SUMMARIES API] Found ${storySettings.length} settings`,
        );

        // 7. Generate scene summaries using AI
        console.log(
            "[SCENE SUMMARIES API] 🤖 Calling scene summaries generator...",
        );
        const generateParams: GenerateSceneSummariesParams = {
            chapters: storyChapters,
            settings: storySettings,
            scenesPerChapter: validatedData.scenesPerChapter ?? 3,
        };

        const generationResult: Awaited<
            ReturnType<typeof generateSceneSummaries>
        > = await generateSceneSummaries(generateParams);

        console.log(
            "[SCENE SUMMARIES API] ✅ Scene summaries generation completed:",
            {
                count: generationResult.scenes.length,
                generationTime: generationResult.metadata.generationTime,
            },
        );

        // 8. Save generated scene summaries to database
        console.log(
            "[SCENE SUMMARIES API] 💾 Saving scene summaries to database...",
        );
        const savedScenes: Scene[] = [];

        for (let i = 0; i < generationResult.scenes.length; i++) {
            const sceneData: (typeof generationResult.scenes)[number] =
                generationResult.scenes[i];
            const sceneId: string = `scene_${nanoid(16)}`;
            const now: string = new Date().toISOString();

            // Validate scene data before insert
            const validatedScene: z.infer<typeof insertSceneSchema> =
                insertSceneSchema.parse({
                    // === IDENTITY ===
                    id: sceneId,
                    chapterId: sceneData.chapterId,
                    title: sceneData.title || `Scene ${i + 1}`,

                    // === SCENE SPECIFICATION (Planning Layer) ===
                    summary: sceneData.summary || null,

                    // === CYCLE PHASE TRACKING ===
                    cyclePhase: sceneData.cyclePhase || null,
                    emotionalBeat: sceneData.emotionalBeat || null,

                    // === PLANNING METADATA (Guides Content Generation) ===
                    characterFocus: sceneData.characterFocus || [],
                    settingId: sceneData.settingId || null,
                    sensoryAnchors: sceneData.sensoryAnchors || [],
                    dialogueVsDescription:
                        sceneData.dialogueVsDescription || null,
                    suggestedLength: sceneData.suggestedLength || null,

                    // === GENERATED PROSE (Execution Layer) ===
                    content: "",

                    // === VISUAL ===
                    imageUrl: null,
                    imageVariants: null,

                    // === PUBLISHING (Novel Format) ===
                    visibility: "private",
                    publishedAt: null,
                    publishedBy: null,
                    unpublishedAt: null,
                    unpublishedBy: null,
                    scheduledFor: null,
                    autoPublish: false,

                    // === COMIC FORMAT ===
                    comicStatus: "none",
                    comicPublishedAt: null,
                    comicPublishedBy: null,
                    comicUnpublishedAt: null,
                    comicUnpublishedBy: null,
                    comicGeneratedAt: null,
                    comicPanelCount: 0,
                    comicVersion: 1,

                    // === ANALYTICS ===
                    viewCount: 0,
                    uniqueViewCount: 0,
                    novelViewCount: 0,
                    novelUniqueViewCount: 0,
                    comicViewCount: 0,
                    comicUniqueViewCount: 0,
                    lastViewedAt: null,

                    // === ORDERING ===
                    orderIndex: i + 1,

                    // === METADATA ===
                    createdAt: now,
                    updatedAt: now,
                });

            const savedSceneResults: Scene[] = (await db
                .insert(scenes)
                .values(validatedScene)
                .returning()) as Scene[];

            const savedScene: Scene = savedSceneResults[0];
            savedScenes.push(savedScene);
        }

        console.log(
            `[SCENE SUMMARIES API] ✅ Saved ${savedScenes.length} scene summaries to database`,
        );

        // 9. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE SUMMARIES API] ✅ Cache invalidated");

        console.log("✅ [SCENE SUMMARIES API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 10. Return typed response
        const response: GenerateSceneSummariesResponse = {
            success: true,
            scenes: savedScenes,
            metadata: {
                totalGenerated: savedScenes.length,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE SUMMARIES API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateSceneSummariesErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateSceneSummariesErrorResponse = {
            error: "Failed to generate and save scene summaries",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
