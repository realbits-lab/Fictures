/**
 * Comic Service - Service Layer for Comic Panel Image Generation
 *
 * Orchestrates comic panel image generation workflow:
 * 1. Read existing toonplay from scene (already generated via /api/studio/toonplay)
 * 2. Generate panel images (Generator Layer)
 * 3. Save to database
 *
 * Note: Toonplay generation is handled separately by /api/studio/toonplay endpoint.
 * This service only generates panel images from existing toonplay data.
 *
 * This service combines generator functions with database operations,
 * following the Service Layer pattern from comics-development.md.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import {
    type characters,
    comicPanels,
    type scenes,
    scenes as scenesTable,
    type settings,
    type stories,
} from "@/lib/schemas/database";

// Type aliases
type Scene = typeof scenes.$inferSelect;
type Character = typeof characters.$inferSelect;
type Setting = typeof settings.$inferSelect;
type Story = typeof stories.$inferSelect;
type ComicPanel = typeof comicPanels.$inferSelect;

import type { ToonplayEvaluationResult } from "@/lib/studio/services/toonplay-evaluator";
import type { generateToonplayWithEvaluation } from "@/lib/studio/services/toonplay-improvement-loop";
import { generateComicPanels } from "../generators/comic-panel-generator";

/**
 * Service Layer: Parameters for complete comic generation
 */
export interface ServiceComicGenerationParams {
    sceneId: string;
    scene: Scene;
    story: Story;
    characters: Character[];
    settings: Setting[];
    targetPanelCount?: number;
    onProgress?: (current: number, total: number, status: string) => void;
}

/**
 * Service Layer: Result of complete comic generation
 */
export interface ServiceComicGenerationResult {
    toonplay: AiComicToonplayType;
    panels: ComicPanel[];
    evaluation: ToonplayEvaluationResult;
    metadata: {
        generationTime: number;
        toonplayTime: number;
        panelGenerationTime: number;
        savedToDatabase: boolean;
        totalPanels: number;
        model?: string;
        provider?: string;
        aspectRatio?: string;
    };
}

/**
 * Generate comic panel images for a scene (Service Layer)
 *
 * This function orchestrates:
 * - Reading existing toonplay from scene
 * - Panel image generation (Generator)
 * - Database persistence (Service)
 *
 * Note: Toonplay must already exist in the scene (generated via /api/studio/toonplay)
 *
 * @param params - Comic generation parameters
 * @returns Complete generation result with database confirmation
 */

type ToonplayResult = Awaited<
    ReturnType<typeof generateToonplayWithEvaluation>
>;
type PanelImagesResult = Awaited<ReturnType<typeof generateComicPanels>>;

export async function generateAndSaveComic(
    params: ServiceComicGenerationParams,
): Promise<ServiceComicGenerationResult> {
    const startTime = Date.now();
    const {
        sceneId,
        scene,
        story,
        characters,
        settings,
        targetPanelCount,
        onProgress,
    } = params;

    console.log(
        `[comic-service] 🎬 Starting comic panel image generation for scene: ${scene.title}`,
    );
    console.log(`[comic-service] Parameters:`, {
        sceneId,
        sceneTitle: scene.title,
        storyId: story.id,
        characterCount: characters.length,
        settingCount: settings.length,
        targetPanelCount,
    });

    // Phase 1: Read existing toonplay from scene (10% of progress)
    if (onProgress) {
        onProgress(0, 100, "Loading toonplay data from scene...");
    }

    const toonplayStart = Date.now();
    console.log(`[comic-service] Phase 1: Loading existing toonplay...`);

    // Read existing toonplay from scene - it should already be generated via /api/studio/toonplay
    const existingToonplay = scene.comicToonplay as AiComicToonplayType | null;

    if (
        !existingToonplay ||
        !existingToonplay.panels ||
        existingToonplay.panels.length === 0
    ) {
        throw new Error(
            `No toonplay data found for scene ${sceneId}. Please generate toonplay first using /api/studio/toonplay endpoint.`,
        );
    }

    // Create a minimal evaluation result since toonplay was already evaluated
    const toonplayResult: ToonplayResult = {
        toonplay: existingToonplay,
        evaluation: {
            category1_narrative_fidelity: {
                score: 4,
                reasoning: "Pre-generated toonplay",
                strengths: [],
                weaknesses: [],
            },
            category2_visual_transformation: {
                score: 4,
                reasoning: "Pre-generated toonplay",
                strengths: [],
                weaknesses: [],
            },
            category3_webtoon_pacing: {
                score: 4,
                reasoning: "Pre-generated toonplay",
                strengths: [],
                weaknesses: [],
            },
            category4_script_formatting: {
                score: 4,
                reasoning: "Pre-generated toonplay",
                strengths: [],
                weaknesses: [],
            },
            overall_assessment: "Toonplay loaded from existing scene data",
            improvement_suggestions: [],
            narration_percentage: 0,
            dialogue_to_visual_ratio: "N/A",
            weighted_score: 4.0,
            passes: true,
            structural_pass: true,
            quality_gate_issues: [],
            metrics: {
                total_panels: existingToonplay.total_panels,
                panels_with_narration: 0,
                panels_with_dialogue: existingToonplay.panels.length,
                panels_with_neither: 0,
                shot_type_distribution: {},
                average_dialogue_length: 0,
                narration_percentage: 0,
                dialogue_percentage: 100,
                shot_variety: 0,
                special_shot_count: 0,
            },
        },
        iterations: 0,
        improvement_history: [],
        final_report: "Toonplay loaded from existing scene data",
    };

    const toonplayTime = Date.now() - toonplayStart;

    if (onProgress) {
        onProgress(
            10,
            100,
            `Loaded ${toonplayResult.toonplay.total_panels} panels from existing toonplay`,
        );
    }

    console.log(
        `[comic-service] ✅ Toonplay loaded: ${toonplayResult.toonplay.total_panels} panels`,
    );

    // Phase 2: Generate Panel Images (10-90% of progress)
    const panelStart = Date.now();
    console.log(`[comic-service] Phase 2: Generating panel images...`);
    console.log(
        `[comic-service] Toonplay has ${toonplayResult.toonplay.total_panels} panels`,
    );

    if (onProgress) {
        onProgress(10, 100, "Generating panel images...");
    }

    let panelImagesResult: PanelImagesResult;
    try {
        panelImagesResult = await generateComicPanels({
            toonplay: toonplayResult.toonplay,
            storyId: story.id,
            chapterId: scene.chapterId,
            sceneId: scene.id,
            characters,
            settings,
            storyGenre: story.genre || "drama",
            onProgress: (current: number, total: number) => {
                // Map panel generation progress to 10-90% range
                const progressPercent = 10 + Math.floor((current / total) * 80);
                if (onProgress) {
                    onProgress(
                        progressPercent,
                        100,
                        `Generating panel ${current}/${total}...`,
                    );
                }
            },
        });
        console.log(
            `[comic-service] ✅ Panel image generation completed: ${panelImagesResult.panels.length} panels`,
        );
    } catch (panelError) {
        console.error(
            `[comic-service] ❌ Panel image generation failed:`,
            panelError,
        );
        console.error(`[comic-service] Error details:`, {
            message:
                panelError instanceof Error
                    ? panelError.message
                    : String(panelError),
            stack: panelError instanceof Error ? panelError.stack : undefined,
            name: panelError instanceof Error ? panelError.name : undefined,
        });
        throw panelError;
    }

    const panelGenerationTime = Date.now() - panelStart;

    if (onProgress) {
        onProgress(90, 100, "Saving comic panels to database...");
    }

    console.log(
        `[comic-service] ✅ Panel images generated: ${panelImagesResult.panels.length} panels`,
    );

    // Phase 3: Save to Database (90-100% of progress)
    const comicPanelRecords: (typeof comicPanels.$inferInsert)[] =
        panelImagesResult.panels.map((panelResult, _index) => {
            const panelSpec = panelResult.toonplaySpec;
            const aspectRatio =
                panelResult.width && panelResult.height
                    ? `${panelResult.width}:${panelResult.height}`
                    : "9:16";

            return {
                id: `panel_${nanoid(16)}`,
                sceneId,
                panelNumber: panelResult.panel_number,
                shotType: panelSpec.shot_type,
                imageUrl: panelResult.imageUrl,
                imageVariants: panelResult.optimizedSet || null,
                narrative: panelSpec.narrative || null,
                dialogue: panelSpec.dialogue || [],
                sfx: panelSpec.sfx || [],
                description: panelSpec.description,
                metadata: {
                    prompt: panelSpec.description, // Store full description as prompt
                    characters_visible: panelSpec.characters_visible,
                    camera_angle: panelSpec.camera_angle,
                    mood: panelSpec.mood,
                    generated_at: new Date().toISOString(),
                    model: panelResult.model,
                    provider: panelResult.provider,
                    width: panelResult.width,
                    height: panelResult.height,
                    aspectRatio,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        });

    // Insert panels into database
    await db.insert(comicPanels).values(comicPanelRecords);

    // Update scene metadata
    await db
        .update(scenesTable)
        .set({
            comicStatus: "draft",
            comicGeneratedAt: new Date().toISOString(),
            comicPanelCount: comicPanelRecords.length,
            comicVersion: (scene.comicVersion || 0) + 1,
            comicToonplay: toonplayResult.toonplay,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(scenesTable.id, sceneId));

    if (onProgress) {
        onProgress(100, 100, "Comic generation complete!");
    }

    const generationTime = Date.now() - startTime;

    console.log(
        `[comic-service] ✅ Comic saved to database: ${comicPanelRecords.length} panels`,
    );
    console.log(
        `[comic-service] ⏱️ Total generation time: ${(generationTime / 1000).toFixed(1)}s`,
    );

    // Fetch the saved panels to return proper ComicPanel type
    const savedPanels = await db.query.comicPanels.findMany({
        where: eq(comicPanels.sceneId, sceneId),
        orderBy: (panels, { asc }) => [asc(panels.panelNumber)],
    });

    return {
        toonplay: toonplayResult.toonplay,
        panels: savedPanels,
        evaluation: toonplayResult.evaluation,
        metadata: {
            generationTime,
            toonplayTime,
            panelGenerationTime,
            savedToDatabase: true,
            totalPanels: savedPanels.length,
            model: panelImagesResult.metadata.model,
            provider: panelImagesResult.metadata.provider,
            aspectRatio: "9:16",
        },
    };
}
