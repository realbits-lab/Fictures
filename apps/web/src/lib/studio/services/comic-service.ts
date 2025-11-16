/**
 * Comic Service - Service Layer for Comic Generation
 *
 * Orchestrates the complete comic generation workflow:
 * 1. Generate toonplay from scene (Generator Layer)
 * 2. Evaluate toonplay quality and improve if needed
 * 3. Generate panel images (Generator Layer)
 * 4. Save to database
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

import { generateToonplayWithEvaluation } from "@/lib/studio/services/toonplay-improvement-loop";
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
    evaluation: any; // AiToonplayEvaluationType from evaluator
    metadata: {
        generationTime: number;
        toonplayTime: number;
        panelGenerationTime: number;
        savedToDatabase: boolean;
        totalPanels: number;
    };
}

/**
 * Generate complete comic for a scene (Service Layer)
 *
 * This function orchestrates:
 * - Toonplay generation (Generator)
 * - Quality evaluation and improvement
 * - Panel image generation (Generator)
 * - Database persistence (Service)
 *
 * @param params - Comic generation parameters
 * @returns Complete generation result with database confirmation
 */
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
        `[comic-service] 🎬 Starting comic generation for scene: ${scene.title}`,
    );

    // Phase 1: Generate Toonplay with Quality Evaluation (20% of progress)
    if (onProgress) {
        onProgress(0, 100, "Generating toonplay from scene narrative...");
    }

    const toonplayStart = Date.now();

    // Use the improvement loop which handles quality evaluation
    const toonplayResult = await generateToonplayWithEvaluation({
        scene,
        characters,
        setting: settings[0] || {
            id: "default",
            name: "Default Setting",
            description: "A generic setting",
            summary: "",
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
        },
        storyGenre: story.genre,
        targetPanelCount,
    });

    const toonplayTime = Date.now() - toonplayStart;

    if (onProgress) {
        onProgress(
            20,
            100,
            `Generated ${toonplayResult.toonplay.total_panels} panels`,
        );
    }

    console.log(
        `[comic-service] ✅ Toonplay generated: ${toonplayResult.toonplay.total_panels} panels (score: ${toonplayResult.evaluation.weighted_score}/5.0)`,
    );

    // Phase 2: Generate Panel Images (20-90% of progress)
    const panelStart = Date.now();

    if (onProgress) {
        onProgress(20, 100, "Generating panel images...");
    }

    const panelImagesResult = await generateComicPanels({
        toonplay: toonplayResult.toonplay,
        storyId: story.id,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        characters,
        settings,
        storyGenre: story.genre || "drama",
        onProgress: (current: number, total: number) => {
            // Map panel generation progress to 20-90% range
            const progressPercent = 20 + Math.floor((current / total) * 70);
            if (onProgress) {
                onProgress(
                    progressPercent,
                    100,
                    `Generating panel ${current}/${total}...`,
                );
            }
        },
    });

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
        },
    };
}
