/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import type {
    GeneratorSceneContentParams,
    GeneratorSceneContentResult,
    SceneContentPromptParams,
    TextGenerationResponse,
} from "@/lib/schemas/generators/types";
import { createTextGenerationClient } from "./ai-client";
import {
    buildChapterContext,
    buildCharactersContext,
    buildGenericSettingContext,
    buildPartContext,
    buildSceneContext,
    buildSettingContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";

/**
 * Check if content appears to be truncated (ends mid-sentence)
 */
function isContentTruncated(content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed) return true;

    // Get the last character
    const lastChar = trimmed[trimmed.length - 1];

    // Valid sentence endings
    const validEndings = [".", "!", "?", '"', "'", ")", "】", "」", "』"];

    // Check if ends with valid punctuation
    if (validEndings.includes(lastChar)) {
        return false;
    }

    // Check for ellipsis (intentional trailing)
    if (trimmed.endsWith("...") || trimmed.endsWith("…")) {
        return false;
    }

    // Content likely truncated if it doesn't end with valid punctuation
    return true;
}

/**
 * Check if the API response indicates truncation due to token limit
 */
function isResponseTruncated(response: TextGenerationResponse): boolean {
    // Gemini uses "MAX_TOKENS" or "STOP" for finish reason
    // AI Server uses "length" for truncation
    const truncationReasons = ["MAX_TOKENS", "length", "SAFETY"];
    return truncationReasons.includes(response.finishReason || "");
}

/**
 * Generate prose content for a single scene
 *
 * @param params - Scene content generation parameters
 * @returns Scene content (caller responsible for database save)
 */
export async function generateSceneContent(
    params: GeneratorSceneContentParams,
): Promise<GeneratorSceneContentResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const {
        story,
        part,
        chapter,
        scene,
        characters,
        settings,
        language = "English",
        promptVersion,
    }: GeneratorSceneContentParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    console.log(
        `[scene-content-generator] 📝 Generating content for scene: ${scene.title}`,
    );

    // 2. Find setting if scene has one
    const setting = scene.settingId
        ? settings.find((s: any) => s.id === scene.settingId)
        : undefined;

    // 3. Build context strings using common builders
    const storyContext: string = buildStoryContext(story as any);
    const partContext: string = buildPartContext(
        part as any,
        characters as any,
    );
    const chapterContext: string = buildChapterContext(chapter as any);
    const sceneContext: string = buildSceneContext(scene as any);
    const charactersStr: string = buildCharactersContext(characters as any);
    const settingStr: string = setting
        ? buildSettingContext(setting as any)
        : buildGenericSettingContext();

    console.log(
        `[scene-content-generator] Context prepared: ${characters.length} characters, ${setting?.name || "generic"} setting`,
    );

    // 4. Get the prompt template for scene content generation
    const promptParams: SceneContentPromptParams = {
        story: storyContext,
        part: partContext,
        chapter: chapterContext,
        scene: sceneContext,
        characters: charactersStr,
        setting: settingStr,
        language,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        client.getProviderType(),
        "scene_content",
        promptParams,
        promptVersion !== "v1.0" ? promptVersion : undefined,
    );

    console.log(
        "[scene-content-generator] Generating scene content using text generation",
    );

    // 4. Calculate appropriate token limit based on scene cycle phase
    // Token-to-word ratio: ~0.75 (1000 tokens ≈ 750 words)
    // Phase-specific limits (with 50% buffer to prevent truncation):
    // - setup/transition: 600 words max → 1200 tokens (600/0.75 × 1.5)
    // - adversity: 800 words max → 1600 tokens (800/0.75 × 1.5)
    // - virtue: 1000 words max → 2000 tokens (1000/0.75 × 1.5)
    // - consequence: 900 words max → 1800 tokens (900/0.75 × 1.5)
    const maxTokensByPhase: Record<string, number> = {
        setup: 1200,
        transition: 1200,
        adversity: 1600,
        virtue: 2000,
        consequence: 1800,
    };

    // Use phase-specific limit or default to 2000 (virtue scene limit)
    const baseMaxTokens: number =
        maxTokensByPhase[scene.cyclePhase || ""] || 2000;

    console.log(
        `[scene-content-generator] Token limit for ${scene.cyclePhase || "unknown"} phase: ${baseMaxTokens}`,
    );

    // 5. Generate scene content with retry logic for truncation
    const MAX_RETRIES = 2;
    let currentMaxTokens = baseMaxTokens;
    let response: TextGenerationResponse | null = null;
    let content = "";
    let retryCount = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        response = await client.generate({
            prompt: userPromptText,
            systemPrompt,
            temperature: 0.85,
            maxTokens: currentMaxTokens,
            // Lower topP from default 0.95 to 0.5 to reduce premature stop token selection
            // This helps prevent truncation issues with Gemini 2.5 models
            topP: 0.5,
        });

        content = response.text.trim();

        // Check for truncation
        const apiTruncated = isResponseTruncated(response);
        const contentTruncated = isContentTruncated(content);

        if (apiTruncated || contentTruncated) {
            console.warn(
                `[scene-content-generator] ⚠️ Content truncated (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
                {
                    apiTruncated,
                    contentTruncated,
                    finishReason: response.finishReason,
                    currentMaxTokens,
                    contentEnding: content.slice(-50),
                },
            );

            if (attempt < MAX_RETRIES) {
                // Increase token limit by 50% for retry
                currentMaxTokens = Math.floor(currentMaxTokens * 1.5);
                retryCount++;
                console.log(
                    `[scene-content-generator] 🔄 Retrying with increased token limit: ${currentMaxTokens}`,
                );
                continue;
            }

            // Final attempt still truncated - log warning but continue
            console.error(
                `[scene-content-generator] ❌ Content still truncated after ${MAX_RETRIES + 1} attempts. Using truncated content.`,
            );
        } else {
            // Content looks complete
            if (attempt > 0) {
                console.log(
                    `[scene-content-generator] ✅ Content completed on retry ${attempt}`,
                );
            }
            break;
        }
    }

    // 6. Extract and process generated content
    const wordCount: number = content.split(/\s+/).length;

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[scene-content-generator] ✅ Generated scene content:", {
        sceneId: (scene as any).id || "unknown",
        cyclePhase: scene.cyclePhase,
        wordCount,
        tokenLimit: currentMaxTokens,
        retries: retryCount,
        finishReason: response?.finishReason,
        generationTime: totalTime,
    });

    // 8. Return scene content result
    return {
        content,
        wordCount,
        metadata: {
            generationTime: totalTime,
            model: response?.model || "unknown",
        },
    };
}
