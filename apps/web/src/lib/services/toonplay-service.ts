/**
 * Toonplay Service
 *
 * Orchestrates the complete toonplay generation pipeline:
 * 1. Convert scene to toonplay (with iterative improvement)
 * 2. Generate panel images
 * 3. Save to database
 */

import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import { type InferSelectModel } from "drizzle-orm";
import { characters, scenes, settings, stories } from "@/lib/schemas/database";

// Database row types (for query results)
type Story = InferSelectModel<typeof stories>;
type Scene = InferSelectModel<typeof scenes>;
type Character = InferSelectModel<typeof characters>;
type Setting = InferSelectModel<typeof settings>;
import {
    type GeneratedPanelResult,
    generateComicPanels,
} from "../studio/generators/comic-panel-generator";
import { generateToonplayWithEvaluation } from "./toonplay-improvement-loop";

/**
 * Complete toonplay generation result
 */
export interface ToonplayGenerationResult {
    toonplay: AiComicToonplayType;
    panels: GeneratedPanelResult[];
    evaluation: {
        weighted_score: number;
        passes: boolean;
        iterations: number;
        final_report: string;
    };
    metadata: {
        totalGenerationTime: number;
        toonplayGenerationTime: number;
        panelsGenerationTime: number;
        model: string;
        provider: string;
    };
}

/**
 * Generate complete toonplay with panel images
 *
 * This is the main entry point for toonplay generation.
 */
export async function generateCompleteToonplay(params: {
    scene: Scene;
    story: Story;
    characters: Character[];
    settings: Setting[];
    storyId: string;
    chapterId: string;
    sceneId: string;
    language?: string;
    evaluationMode?: "quick" | "standard" | "thorough";
    onProgress?: (stage: string, current: number, total: number) => void;
}): Promise<ToonplayGenerationResult> {
    const {
        scene,
        story,
        characters,
        settings,
        storyId,
        chapterId,
        sceneId,
        language = "English",
        evaluationMode = "standard",
        onProgress,
    } = params;

    const totalStartTime: number = Date.now();

    console.log("[toonplay-service] =� Starting complete toonplay generation");
    console.log(
        `[toonplay-service] Scene: ${scene.title}, Story: ${story.title}`,
    );

    // Stage 1: Generate toonplay with iterative improvement
    if (onProgress) onProgress("toonplay", 0, 2);

    const toonplayStartTime: number = Date.now();
    const toonplayResult = await generateToonplayWithEvaluation({
        scene,
        characters,
        setting: settings[0], // Use first setting
        storyGenre: story.genre,
    });
    const toonplayGenerationTime: number = Date.now() - toonplayStartTime;

    console.log(
        `[toonplay-service]  Toonplay generated in ${toonplayGenerationTime}ms`,
    );
    console.log(
        `[toonplay-service] Score: ${toonplayResult.evaluation.weighted_score.toFixed(2)}/5.0, Iterations: ${toonplayResult.iterations}`,
    );

    if (onProgress) onProgress("toonplay", 1, 2);

    // Stage 2: Generate panel images
    if (onProgress)
        onProgress("panels", 0, toonplayResult.toonplay.total_panels);

    const panelsStartTime: number = Date.now();
    const panelsResult = await generateComicPanels({
        toonplay: toonplayResult.toonplay,
        storyId,
        chapterId,
        sceneId,
        characters,
        settings,
        storyGenre: story.genre,
        onProgress: (current, total) => {
            if (onProgress) onProgress("panels", current, total);
        },
    });
    const panelsGenerationTime: number = Date.now() - panelsStartTime;

    console.log(
        `[toonplay-service]  ${panelsResult.panels.length} panels generated in ${panelsGenerationTime}ms`,
    );

    if (onProgress)
        onProgress(
            "panels",
            toonplayResult.toonplay.total_panels,
            toonplayResult.toonplay.total_panels,
        );

    // Calculate total time
    const totalGenerationTime: number = Date.now() - totalStartTime;

    console.log(
        `[toonplay-service]  Complete toonplay generation finished in ${totalGenerationTime}ms`,
    );

    return {
        toonplay: toonplayResult.toonplay,
        panels: panelsResult.panels,
        evaluation: {
            weighted_score: toonplayResult.evaluation.weighted_score,
            passes: toonplayResult.evaluation.passes,
            iterations: toonplayResult.iterations,
            final_report: toonplayResult.final_report,
        },
        metadata: {
            totalGenerationTime,
            toonplayGenerationTime,
            panelsGenerationTime,
            model: panelsResult.metadata.model,
            provider: panelsResult.metadata.provider,
        },
    };
}
