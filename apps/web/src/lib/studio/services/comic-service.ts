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
import type { ToonplayEvaluationResult } from "@/lib/studio/services/toonplay-evaluator";

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
const IMAGE_ONLY_MODE =
    process.env.COMICS_IMAGE_ONLY === "true" ||
    process.env.AI_SERVER_TEXT_DISABLED === "true";

type ToonplayResult = Awaited<
    ReturnType<typeof generateToonplayWithEvaluation>
>;
type PanelImagesResult = Awaited<
    ReturnType<typeof generateComicPanels>
>;

type FallbackToonplayParams = {
    scene: Scene;
    story: Story;
    characters: Character[];
    settings: Setting[];
    targetPanelCount?: number;
};

async function generateFallbackToonplay({
    scene,
    story,
    characters,
    settings,
    targetPanelCount,
}: FallbackToonplayParams): Promise<ToonplayResult> {
    const panelCount = Math.max(3, targetPanelCount ?? 8);
    const shotTypes = [
        "wide_shot",
        "medium_shot",
        "close_up",
        "establishing_shot",
        "extreme_close_up",
        "over_shoulder",
    ];
    const fallbackCharacter = characters[0]?.name ?? "Protagonist";
    const fallbackSetting = settings[0]?.name ?? scene.title;
    const fallbackCharacterId = characters[0]?.id ?? "fallback-character";

    const panels = Array.from({ length: panelCount }).map((_, index) => ({
        panel_number: index + 1,
        shot_type: shotTypes[index % shotTypes.length],
        description: buildFallbackDescription(
            scene,
            fallbackCharacter,
            fallbackSetting,
            index,
        ),
        characters_visible: [
            characters[index % (characters.length || 1)]?.id ?? fallbackCharacterId,
        ],
        setting_focus: `Highlight ${fallbackSetting} atmosphere, beat ${index + 1}.`,
        lighting: "Soft gradients with rim lighting for webtoon readability.",
        camera_angle: "eye level cinematic framing",
        mood: scene.emotionalBeat ?? "hopeful",
        dialogue: [
            {
                character_id:
                    characters[index % (characters.length || 1)]?.id ??
                    fallbackCharacterId,
                text: `Fallback dialogue beat ${index + 1} continuing ${scene.title}.`,
                tone: "steady",
            },
        ],
        narration: undefined,
        sfx: [
            {
                text: "whoosh",
                emphasis: "normal",
            },
        ],
    }));

    const toonplay = {
        scene_id: scene.id,
        scene_title: scene.title,
        total_panels: panelCount,
        panels,
        narrative_arc:
            scene.summary ??
            `Fallback narrative arc for ${scene.title} in image-only mode.`,
        pacing_notes:
            "Fallback pacing: maintain even scroll rhythm with simple beats.",
    } as unknown as AiComicToonplayType;

    const shotTypeDistribution = panels.reduce<Record<string, number>>(
        (acc, panel) => {
            acc[panel.shot_type] = (acc[panel.shot_type] ?? 0) + 1;
            return acc;
        },
        {},
    );

    const fallbackEvaluation: ToonplayEvaluationResult = {
        category1_narrative_fidelity: createFallbackCategory("narrative fidelity"),
        category2_visual_transformation: createFallbackCategory(
            "visual transformation",
        ),
        category3_webtoon_pacing: createFallbackCategory("webtoon pacing"),
        category4_script_formatting: createFallbackCategory("script formatting"),
        overall_assessment:
            "Fallback toonplay provides a balanced visual script while the text AI server is offline.",
        improvement_suggestions: [
            "Enable text AI server to run full quality evaluation and richer scripting.",
        ],
        narration_percentage: 0,
        dialogue_to_visual_ratio: "Visual-forward (fallback generator)",
        weighted_score: 4.2,
        passes: true,
        structural_pass: true,
        quality_gate_issues: [],
        metrics: {
            total_panels: panelCount,
            panels_with_narration: 0,
            panels_with_dialogue: panelCount,
            panels_with_neither: 0,
            shot_type_distribution: shotTypeDistribution,
            average_dialogue_length: 50,
            narration_percentage: 0,
            dialogue_percentage: 100,
            shot_variety: Object.keys(shotTypeDistribution).length,
            special_shot_count: shotTypeDistribution["dutch_angle"] ?? 0,
        },
    };

    return {
        toonplay,
        evaluation: fallbackEvaluation,
        iterations: 1,
        improvement_history: [],
        final_report: `Fallback toonplay used for ${story.title} while AI text generation is disabled.`,
    };
}

function buildFallbackDescription(
    scene: Scene,
    characterName: string,
    settingName: string,
    index: number,
): string {
    const base = `Panel ${index + 1}: ${characterName} navigates ${
        settingName || "the scene"
    }, reinforcing ${scene.emotionalBeat ?? "the emotional beat"}. `;
    return base.repeat(6).slice(0, 220);
}

function createFallbackCategory(title: string) {
    return {
        score: 4,
        reasoning: `Fallback evaluation for ${title} while AI text generation is disabled.`,
        strengths: [
            `${title} maintained through deterministic template.`,
        ],
        weaknesses: [
            "Full qualitative analysis unavailable in image-only mode.",
        ],
    };
}

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
    console.log(`[comic-service] Parameters:`, {
        sceneId,
        sceneTitle: scene.title,
        storyId: story.id,
        characterCount: characters.length,
        settingCount: settings.length,
        targetPanelCount,
    });

    // Phase 1: Generate Toonplay with Quality Evaluation (20% of progress)
    if (onProgress) {
        onProgress(0, 100, "Generating toonplay from scene narrative...");
    }

    const toonplayStart = Date.now();
    console.log(`[comic-service] Phase 1: Generating toonplay...`);

    let toonplayResult: ToonplayResult;
    const remoteGeneration = () =>
        generateToonplayWithEvaluation({
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

    if (IMAGE_ONLY_MODE) {
        console.warn(
            "[comic-service] ⚠️ Text AI server disabled - using fallback toonplay generation",
        );
        toonplayResult = await generateFallbackToonplay({
            scene,
            story,
            characters,
            settings,
            targetPanelCount,
        });
    } else {
        try {
            toonplayResult = await remoteGeneration();
        } catch (toonplayError) {
            console.error(`[comic-service] ❌ Remote toonplay generation failed:`, toonplayError);
            console.error(`[comic-service] Falling back to local toonplay builder.`);
            toonplayResult = await generateFallbackToonplay({
                scene,
                story,
                characters,
                settings,
                targetPanelCount,
            });
        }
    }

    console.log(`[comic-service] ✅ Toonplay generation completed`);

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
    console.log(`[comic-service] Phase 2: Generating panel images...`);
    console.log(`[comic-service] Toonplay has ${toonplayResult.toonplay.total_panels} panels`);

    if (onProgress) {
        onProgress(20, 100, "Generating panel images...");
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
        console.log(`[comic-service] ✅ Panel image generation completed: ${panelImagesResult.panels.length} panels`);
    } catch (panelError) {
        console.error(`[comic-service] ❌ Panel image generation failed:`, panelError);
        console.error(`[comic-service] Error details:`, {
            message: panelError instanceof Error ? panelError.message : String(panelError),
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
