/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

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
import type {
    GeneratorSceneContentParams,
    GeneratorSceneContentResult,
    SceneContentPromptParams,
} from "@/lib/schemas/generators/types";

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
        ? settings.find((s) => s.id === scene.settingId)
        : undefined;

    // 3. Build context strings using common builders
    const storyContext: string = buildStoryContext(story);
    const partContext: string = buildPartContext(part, characters);
    const chapterContext: string = buildChapterContext(chapter);
    const sceneContext: string = buildSceneContext(scene);
    const charactersStr: string = buildCharactersContext(characters);
    const settingStr: string = setting
        ? buildSettingContext(setting)
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

    // 4. Generate scene content using direct text generation (no schema)
    const response = await client.generate({
        prompt: userPromptText,
        systemPrompt,
        temperature: 0.85,
        maxTokens: 24576, // Increased from 8192 to allow longer scene content
    });

    // 5. Extract and process generated content
    const content: string = response.text.trim();
    const wordCount: number = content.split(/\s+/).length;

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[scene-content-generator] ✅ Generated scene content:", {
        sceneId: scene.id,
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
