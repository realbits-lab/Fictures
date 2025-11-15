/**
 * Toonplay Generation API
 *
 * POST /api/studio/toonplay
 *
 * Converts a narrative scene to webtoon toonplay with panel images.
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
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
import { generateCompleteToonplay } from "@/lib/services/toonplay-service";

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
 */
export async function POST(request: Request) {
    try {
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
            }
        }

        // 5. Fetch story
        const storyResult = await db
            .select()
            .from(stories)
            .where(eq(stories.id, scene.storyId))
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

        // 4. Update scene with toonplay data
        await db
            .update(scenes)
            .set({
                comicToonplay: result.toonplay,
                comicStatus: "completed",
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
                metadata: result.metadata,
            },
        });
    } catch (error) {
        console.error("[toonplay-api] ❌ Error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid request parameters",
                        details: error.errors,
                    },
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "GENERATION_FAILED",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Toonplay generation failed",
                },
            },
            { status: 500 },
        );
    }
}
