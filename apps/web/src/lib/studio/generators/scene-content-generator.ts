/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    settings,
    stories,
} from "@/lib/db/schema";
import { textGenerationClient } from "./ai-client";
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
    GenerateSceneContentParams,
    GenerateSceneContentResult,
    SceneContentPromptParams,
} from "./types";
import type {
    Chapter,
    Character,
    Part,
    Setting,
    Story,
} from "./zod-schemas.generated";

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
        storyId,
        partId,
        chapterId,
        story: storyParam,
        part: partParam,
        chapter: chapterParam,
        characters: charactersParam,
        settings: settingsParam,
        scene,
        language = "English",
    }: GenerateSceneContentParams = params;

    console.log(
        `[scene-content-generator] 📝 Generating content for scene: ${scene.title}`,
    );

    // 2. Get story - use provided object or fetch from database
    let story: Partial<Story>;
    if (storyParam) {
        // Orchestrator mode - use provided object
        story = storyParam;
    } else if (storyId) {
        // Service mode - fetch from database
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))) as Story[];
        const fetchedStory: Story | undefined = storyResult[0];

        if (!fetchedStory) {
            throw new Error(`Story not found: ${storyId}`);
        }
        story = fetchedStory;
    } else {
        throw new Error(
            "Either storyId or story object must be provided in params",
        );
    }

    // 3. Get part - use provided object or fetch from database
    let part: Partial<Part>;
    if (partParam) {
        // Orchestrator mode - use provided object
        part = partParam;
    } else if (partId) {
        // Service mode - fetch from database
        const partResult: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.id, partId))) as Part[];
        const fetchedPart: Part | undefined = partResult[0];

        if (!fetchedPart) {
            throw new Error(`Part not found: ${partId}`);
        }
        part = fetchedPart;
    } else {
        throw new Error(
            "Either partId or part object must be provided in params",
        );
    }

    // 4. Get chapter - use provided object or fetch from database
    let chapter: Partial<Chapter>;
    if (chapterParam) {
        // Orchestrator mode - use provided object
        chapter = chapterParam;
    } else if (chapterId) {
        // Service mode - fetch from database
        const chapterResult: Chapter[] = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId))) as Chapter[];
        const fetchedChapter: Chapter | undefined = chapterResult[0];

        if (!fetchedChapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        chapter = fetchedChapter;
    } else {
        throw new Error(
            "Either chapterId or chapter object must be provided in params",
        );
    }

    // 5. Get characters - use provided array or fetch from database
    let storyCharacters: Partial<Character>[];
    if (charactersParam) {
        // Orchestrator mode - use provided array
        storyCharacters = charactersParam;
    } else if (storyId) {
        // Service mode - fetch from database
        storyCharacters = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, storyId))) as Character[];
    } else {
        throw new Error(
            "Either storyId or characters array must be provided in params",
        );
    }

    // 6. Get setting - use provided array or fetch from database
    let setting: Partial<Setting> | undefined;
    if (scene.settingId) {
        if (settingsParam) {
            // Orchestrator mode - find in provided array
            setting = settingsParam.find((s) => s.id === scene.settingId);
        } else if (storyId) {
            // Service mode - fetch from database
            const settingResult: Setting[] = (await db
                .select()
                .from(settings)
                .where(eq(settings.id, scene.settingId))) as Setting[];
            setting = settingResult[0];
        }
    }

    // 7. Build context strings using common builders
    const storyContext: string = buildStoryContext(story);
    const partContext: string = buildPartContext(part);
    const chapterContext: string = buildChapterContext(chapter);
    const sceneContext: string = buildSceneContext(scene);
    const charactersStr: string = buildCharactersContext(storyCharacters);
    const settingStr: string = setting
        ? buildSettingContext(setting)
        : buildGenericSettingContext();

    console.log(
        `[scene-content-generator] Context prepared: ${storyCharacters.length} characters, ${setting?.name || "generic"} setting`,
    );

    // 13. Get the prompt template for scene content generation
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
