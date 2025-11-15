/**
 * Comic Panel Generator
 *
 * Generates images for webtoon panels based on toonplay specifications.
 * Uses database-driven character descriptions for visual consistency.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route or service).
 */

import type {
    AiComicPanelSpecType,
    AiComicToonplayType,
} from "@/lib/schemas/ai/ai-toonplay";
import { type InferSelectModel } from "drizzle-orm";
import { characters, settings } from "@/lib/schemas/database";

// Database row types
type Character = InferSelectModel<typeof characters>;
type Setting = InferSelectModel<typeof settings>;
import type { GeneratorImageResult } from "@/lib/schemas/generators/types";
import { generateImage } from "@/lib/studio/generators/images-generator";

/**
 * Parameters for comic panel generation
 */
export interface GenerateComicPanelsParams {
    toonplay: AiComicToonplayType;
    storyId: string;
    chapterId: string;
    sceneId: string;
    characters: Character[];
    settings: Setting[];
    storyGenre: string;
    onProgress?: (current: number, total: number) => void;
}

/**
 * Result for a single generated panel
 */
export interface GeneratedPanelResult {
    panel_number: number;
    imageUrl: string;
    blobUrl: string;
    width: number;
    height: number;
    optimizedSet?: any; // OptimizedImageSet from image-optimization-service
    model: string;
    provider: string;
    toonplaySpec: AiComicPanelSpecType;
}

/**
 * Result for comic panel generation
 */
export interface GenerateComicPanelsResult {
    panels: GeneratedPanelResult[];
    metadata: {
        totalPanels: number;
        generationTime: number;
        model: string;
        provider: string;
    };
}

/**
 * Generate images for all panels in a toonplay
 *
 * @param params - Comic panel generation parameters
 * @returns Generated panel images (caller responsible for database save)
 */
export async function generateComicPanels(
    params: GenerateComicPanelsParams,
): Promise<GenerateComicPanelsResult> {
    const startTime: number = Date.now();

    const {
        toonplay,
        storyId,
        chapterId,
        sceneId,
        characters,
        settings,
        storyGenre,
        onProgress,
    }: GenerateComicPanelsParams = params;

    console.log(
        `[comic-panel-generator] 🎨 Generating ${toonplay.total_panels} panel images`,
    );

    // 1. Build character prompt cache for consistency
    const characterPromptCache: Map<string, string> = new Map();

    for (const character of characters) {
        const physDesc = character.physicalDescription;
        const characterPrompt: string = `${physDesc.age} ${physDesc.appearance}, ${physDesc.distinctiveFeatures}, ${physDesc.style}`;

        characterPromptCache.set(character.id, characterPrompt);

        console.log(
            `[comic-panel-generator] Cached character prompt: ${character.name}`,
        );
    }

    // 2. Build settings map for quick lookup
    const settingsMap: Map<string, Setting> = new Map(
        settings.map((s) => [s.id, s]),
    );

    // 3. Generate images for each panel
    const generatedPanels: GeneratedPanelResult[] = [];
    let firstModel = "";
    let firstProvider = "";

    for (let i = 0; i < toonplay.panels.length; i++) {
        const panel: AiComicPanelSpecType = toonplay.panels[i];

        // Report progress
        if (onProgress) {
            onProgress(i + 1, toonplay.total_panels);
        }

        console.log(
            `[comic-panel-generator] Generating panel ${panel.panel_number}/${toonplay.total_panels}`,
        );

        // 4. Build image prompt for this panel
        const imagePrompt: string = buildPanelImagePrompt(
            panel,
            characterPromptCache,
            settingsMap,
            storyGenre,
        );

        console.log(
            `[comic-panel-generator] Panel ${panel.panel_number} prompt: ${imagePrompt.substring(0, 100)}...`,
        );

        // 5. Generate panel image using studio images-generator
        const result: GeneratorImageResult = await generateImage({
            prompt: imagePrompt,
            aspectRatio: "9:16",
            imageType: "comic-panel",
        });

        // Track first model/provider for metadata
        if (i === 0) {
            firstModel = result.model;
            firstProvider = result.provider;
        }

        generatedPanels.push({
            panel_number: panel.panel_number,
            imageUrl: result.imageUrl,
            blobUrl: result.imageUrl,
            width: result.width,
            height: result.height,
            optimizedSet: undefined, // No optimization in generator layer
            model: result.model,
            provider: result.provider,
            toonplaySpec: panel,
        });

        console.log(
            `[comic-panel-generator] ✅ Generated panel ${panel.panel_number}: ${result.imageUrl}`,
        );
    }

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        `[comic-panel-generator] ✅ All panels generated: ${generatedPanels.length} panels in ${totalTime}ms`,
    );

    return {
        panels: generatedPanels,
        metadata: {
            totalPanels: generatedPanels.length,
            generationTime: totalTime,
            model: firstModel,
            provider: firstProvider,
        },
    };
}

/**
 * Build AI image prompt for a single panel
 *
 * Uses layered prompt pattern with visual grammar + database character descriptions
 */
function buildPanelImagePrompt(
    panel: AiComicPanelSpecType,
    characterPromptCache: Map<string, string>,
    _settingsMap: Map<string, Setting>,
    genre: string,
): string {
    // 1. Get character descriptions from cache
    const characterPrompts: string[] = panel.characters_visible
        .map((id) => characterPromptCache.get(id))
        .filter((prompt): prompt is string => Boolean(prompt));

    const charactersStr: string =
        characterPrompts.length > 0
            ? characterPrompts.join("; ")
            : "no characters visible";

    // 2. Get setting atmosphere (if available)
    // Note: toonplay panels may reference setting_focus as a string description
    // rather than a specific setting ID, so we use the setting_focus directly
    const settingDesc: string = panel.setting_focus;

    // 3. Build layered prompt
    const prompt: string = `Professional ${genre} comic panel, ${panel.shot_type}, ${panel.camera_angle}.

SCENE: ${settingDesc}.

CHARACTERS: ${charactersStr}

LIGHTING: ${panel.lighting}

ACTION: ${panel.description}

MOOD: ${panel.mood}

COMPOSITION RULES FOR 9:16 PORTRAIT FORMAT (928×1664):
- Vertical webtoon composition - taller than wide
- Frame composition: Utilize vertical space for scroll-based storytelling
- For establishing shots: Show expansive height with depth layers
- For medium shots: Position characters with vertical balance
- For close-ups: Frame character detail with vertical flow

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional ${genre} comic art style
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances - ${charactersStr}`;

    return prompt;
}
