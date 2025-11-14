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
import { scenes } from "@/lib/schemas/database";
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

        // 2. Fetch scene with related data
        const scene = await db.query.scenes.findFirst({
            where: eq(scenes.id, params.sceneId),
            with: {
                chapter: {
                    with: {
                        part: {
                            with: {
                                story: {
                                    with: {
                                        characters: true,
                                        settings: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!scene) {
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

        if (!scene.chapter?.part?.story) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "INVALID_SCENE_DATA",
                        message: "Scene is missing required relationships",
                    },
                },
                { status: 400 },
            );
        }

        const story = scene.chapter.part.story;
        const characters = story.characters || [];
        const settings = story.settings || [];

        console.log(
            `[toonplay-api] Scene: ${scene.title}, Story: ${story.title}`,
        );
        console.log(
            `[toonplay-api] Context: ${characters.length} characters, ${settings.length} settings`,
        );

        // 3. Generate toonplay with panel images
        const result = await generateCompleteToonplay({
            scene,
            story,
            characters,
            settings,
            storyId: story.id,
            chapterId: scene.chapter.id,
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
