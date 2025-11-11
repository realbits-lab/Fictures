/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    GenerateSceneContentParams,
    GenerateSceneContentResult,
    SceneContentPromptParams,
} from "./types";

/**
 * Generate prose content for a single scene
 *
 * @param params - Scene content generation parameters
 * @returns Scene content (caller responsible for database save)
 */
export async function generateSceneContent(
    params: GenerateSceneContentParams,
): Promise<GenerateSceneContentResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        scene,
        characters,
        settings,
        language = "English",
    }: GenerateSceneContentParams = params;

    // 2. Find the setting and character for this scene
    const setting = settings.find((s) => s.id === scene.settingId);

    // Type guard for characterFocus array
    const characterFocusArray = Array.isArray(scene.characterFocus)
        ? scene.characterFocus
        : [];

    const character = characters.find((c) =>
        characterFocusArray.includes(c.id),
    );

    // 3. Get the prompt template for scene content generation
    const promptParams: SceneContentPromptParams = {
        sceneSummary: scene.summary ?? "",
        cyclePhase: scene.cyclePhase ?? "",
        emotionalBeat: scene.emotionalBeat || "neutral",
        suggestedLength: scene.suggestedLength || "medium",
        settingDescription: setting
            ? `${setting.name} - ${setting.summary || ""}`
            : "Generic setting",
        sensoryAnchors: Array.isArray(scene.sensoryAnchors)
            ? scene.sensoryAnchors.join(", ")
            : "Use setting-appropriate details",
        characterName: character ? character.name : "Unknown character",
        voiceStyle:
            character?.voiceStyle &&
            typeof character.voiceStyle === "object" &&
            "tone" in character.voiceStyle &&
            "vocabulary" in character.voiceStyle
                ? `${character.voiceStyle.tone}, ${character.voiceStyle.vocabulary}`
                : "Neutral",
        language,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "scene_content",
        promptParams,
    );

    console.log(
        "[scene-content-generator] Generating scene content using text generation",
    );

    // 4. Generate scene content using direct text generation (no schema)
    const response = await textGenerationClient.generate({
        prompt: userPromptText,
        systemPrompt,
        temperature: 0.85,
        maxTokens: 8192,
    });

    // 5. Extract and process generated content
    const content: string = response.text.trim();
    const wordCount: number = content.split(/\s+/).length;

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[scene-content-generator] ✅ Generated scene content:", {
        sceneId: params.sceneId,
        wordCount,
        generationTime: totalTime,
    });

    // 7. Return scene content result
    return {
        content,
        wordCount,
        metadata: {
            generationTime: totalTime,
            model: response.model,
        },
    };
}
