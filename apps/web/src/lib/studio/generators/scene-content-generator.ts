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
    const partContext: string = buildPartContext(part as any, characters as any);
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
    );

    console.log(
        "[scene-content-generator] Generating scene content using text generation",
    );

    // 4. Calculate appropriate token limit based on scene cycle phase
    // Token-to-word ratio: ~0.75 (1000 tokens ≈ 750 words)
    // Phase-specific limits (with 20% buffer for flexibility):
    // - setup/transition: 600 words max → 800 tokens (600/0.75 × 1.2)
    // - adversity: 800 words max → 1067 tokens (800/0.75 × 1.2)
    // - virtue: 1000 words max → 1333 tokens (1000/0.75 × 1.2)
    // - consequence: 900 words max → 1200 tokens (900/0.75 × 1.2)
    const maxTokensByPhase: Record<string, number> = {
        setup: 800,
        transition: 800,
        adversity: 1067,
        virtue: 1333,
        consequence: 1200,
    };

    // Use phase-specific limit or default to 1333 (virtue scene limit)
    const maxTokens: number = maxTokensByPhase[scene.cyclePhase || ""] || 1333;

    console.log(
        `[scene-content-generator] Token limit for ${scene.cyclePhase || "unknown"} phase: ${maxTokens}`,
    );

    // 5. Generate scene content using direct text generation (no schema)
    const response = await client.generate({
        prompt: userPromptText,
        systemPrompt,
        temperature: 0.85,
        maxTokens,
    });

    // 6. Extract and process generated content
    const content: string = response.text.trim();
    const wordCount: number = content.split(/\s+/).length;

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[scene-content-generator] ✅ Generated scene content:", {
        sceneId: (scene as any).id || "unknown",
        cyclePhase: scene.cyclePhase,
        wordCount,
        tokenLimit: maxTokens,
        generationTime: totalTime,
    });

    // 8. Return scene content result
    return {
        content,
        wordCount,
        metadata: {
            generationTime: totalTime,
            model: response.model,
        },
    };
}
