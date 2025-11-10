/**
 * Scene Content API Route
 *
 * POST /studio/api/scene-content - Generate scene content using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    scenes,
    settings,
    stories,
} from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSceneContent } from "@/lib/studio/generators/scene-content-generator";
import type {
    GenerateSceneContentParams,
    GenerateSceneContentResult,
} from "@/lib/studio/generators/types";
import type {
    Chapter,
    Character,
    Scene,
    Setting,
    Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateSceneContentErrorResponse,
    GenerateSceneContentRequest,
    GenerateSceneContentResponse,
} from "../types";
import { generateSceneContentSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * POST /studio/api/scene-content
 *
 * Generate scene content for a scene using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SCENE-CONTENT API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SCENE-CONTENT API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SCENE-CONTENT API] Insufficient scopes:", {
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

        console.log("✅ [SCENE-CONTENT API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body
        const body: GenerateSceneContentRequest =
            (await request.json()) as GenerateSceneContentRequest;
        const validatedData: z.infer<typeof generateSceneContentSchema> =
            generateSceneContentSchema.parse(body);

        console.log("[SCENE-CONTENT API] Request parameters:", {
            sceneId: validatedData.sceneId,
            language: validatedData.language,
        });

        // 4. Fetch scene and verify ownership
        const sceneResults = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, validatedData.sceneId));

        const scene: Scene | undefined = sceneResults[0] as Scene | undefined;

        if (!scene) {
            console.error("❌ [SCENE-CONTENT API] Scene not found");
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // 5. Get chapter to access storyId
        const chapterResults = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, scene.chapterId));

        const chapter: Chapter | undefined = chapterResults[0] as
            | Chapter
            | undefined;

        if (!chapter) {
            console.error("❌ [SCENE-CONTENT API] Chapter not found");
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // 6. Get story to verify ownership
        const storyResults = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));

        const story: Story | undefined = storyResults[0] as Story | undefined;

        if (!story) {
            console.error("❌ [SCENE-CONTENT API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error(
                "❌ [SCENE-CONTENT API] Access denied - not story author",
            );
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [SCENE-CONTENT API] Scene verified:", {
            id: scene.id,
            title: scene.title,
            storyId: story.id,
        });

        // 7. Fetch characters for the story
        const storyCharacters = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, story.id))) as Character[];

        console.log(
            `✅ [SCENE-CONTENT API] Found ${storyCharacters.length} characters`,
        );

        // 8. Fetch settings for the story
        const storySettings = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, story.id))) as Setting[];

        console.log(
            `[SCENE-CONTENT API] Found ${storySettings.length} settings`,
        );

        // 9. Generate scene content using AI
        console.log(
            "[SCENE-CONTENT API] 🤖 Calling scene content generator...",
        );
        const generateParams: GenerateSceneContentParams = {
            sceneId: validatedData.sceneId,
            scene: scene,
            characters: storyCharacters,
            settings: storySettings,
            language: validatedData.language,
        };

        const generationResult: GenerateSceneContentResult =
            await generateSceneContent(generateParams);

        console.log(
            "[SCENE-CONTENT API] ✅ Scene content generation completed:",
            {
                wordCount: generationResult.wordCount,
                generationTime: generationResult.metadata.generationTime,
            },
        );

        // 10. Update scene with generated content
        console.log(
            "[SCENE-CONTENT API] 💾 Saving scene content to database...",
        );
        const now: string = new Date().toISOString();

        const updatedSceneResults: Scene[] = (await db
            .update(scenes)
            .set({
                content: generationResult.content,
                updatedAt: now,
            })
            .where(eq(scenes.id, validatedData.sceneId))
            .returning()) as Scene[];

        const updatedScene: Scene = updatedSceneResults[0];

        console.log("[SCENE-CONTENT API] ✅ Scene content saved to database");

        // 11. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SCENE-CONTENT API] ✅ Cache invalidated");

        console.log("✅ [SCENE-CONTENT API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 12. Return typed response
        const response: GenerateSceneContentResponse = {
            success: true,
            scene: updatedScene,
            metadata: {
                wordCount: generationResult.wordCount,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SCENE-CONTENT API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateSceneContentErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateSceneContentErrorResponse = {
            error: "Failed to generate and save scene content",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
