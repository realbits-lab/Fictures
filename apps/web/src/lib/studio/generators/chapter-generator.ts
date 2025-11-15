/**
 * Chapter Generator (Singular)
 *
 * Generates ONE next chapter using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates chapters one at a time,
 * with full context of all previous chapters within the part and story.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import type {
    ChapterPromptParams,
    GenerateChapterParams,
    GenerateChapterResult,
} from "@/lib/schemas/generators/types";
import { type AiChapterType, AiChapterZodSchema } from "@/lib/schemas/zod/ai";
import { createTextGenerationClient } from "./ai-client";
import {
    buildChapterContext,
    buildCharactersContext,
    buildPartContext,
    buildSettingsContext,
    buildStoryContext,
} from "./context-builders";
import { promptManager } from "./prompt-manager";

/**
 * Generate ONE next chapter with full context
 *
 * @param params - Chapter generation parameters with previous chapters context
 * @returns Chapter data (caller responsible for database save)
 */
export async function generateChapter(
    params: GenerateChapterParams,
): Promise<GenerateChapterResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const {
        story,
        part,
        characters,
        settings,
        previousChapters,
        chapterIndex,
        promptVersion,
    }: GenerateChapterParams = params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient();

    console.log(
        `[chapter-generator] 📖 Generating chapter ${chapterIndex + 1} (Part: ${part.title})...`,
    );
    console.log(
        `[chapter-generator] Previous chapters count: ${previousChapters.length}`,
    );

    console.log(`[chapter-generator] ========== PART DATA DEBUG ==========`);
    console.log(`[chapter-generator] Part ID: ${part.id}`);
    console.log(`[chapter-generator] Part title: ${part.title}`);
    console.log(
        `[chapter-generator] Part.characterArcs type: ${typeof part.characterArcs}`,
    );
    console.log(
        `[chapter-generator] Part.characterArcs value:`,
        part.characterArcs,
    );
    console.log(
        `[chapter-generator] Part.settingIds type: ${typeof part.settingIds}`,
    );
    console.log(`[chapter-generator] Part.settingIds value:`, part.settingIds);
    console.log(`[chapter-generator] ======================================`);

    // 2. Get character arc for this chapter (using first character as focus)
    const focusCharacter = characters[0];
    const characterArcs = part.characterArcs as
        | Array<{
              characterId: string;
              macroAdversity?: { internal?: string; external?: string };
          }>
        | null
        | undefined;
    const characterArc = characterArcs?.find(
        (arc: {
            characterId: string;
            macroAdversity?: { internal?: string; external?: string };
        }) => arc.characterId === focusCharacter.id,
    );

    console.log(`[chapter-generator] Focus character: ${focusCharacter.name}`);
    console.log(
        `[chapter-generator] Character arc: ${characterArc?.macroAdversity?.internal || "personal growth"}`,
    );

    // 3. Build context strings using comprehensive builders
    const charactersStr: string = buildCharactersContext(characters);
    const storyContext: string = buildStoryContext(story);
    const settingsStr: string = settings
        ? buildSettingsContext(settings)
        : "N/A";

    console.log(
        `[chapter-generator] Context prepared: ${characters.length} characters, ${settings?.length || 0} settings`,
    );

    // 4. Build comprehensive part context string using context builder
    const partContext: string = buildPartContext(part, characters);

    // 5. Build previous chapters context string using context builder
    const previousChaptersContext: string =
        previousChapters.length > 0
            ? previousChapters
                  .map((ch: typeof previousChapters[0], idx: number) => {
                      return `Chapter ${idx + 1}:\n${buildChapterContext(ch)}`;
                  })
                  .join("\n\n")
            : "None (this is the first chapter)";

    console.log(
        `[chapter-generator] Previous chapters context prepared (${previousChaptersContext.length} characters)`,
    );

    // 8. Get the prompt template for chapter generation
    const promptParams: ChapterPromptParams = {
        chapterNumber: String(chapterIndex + 1),
        story: storyContext,
        parts: partContext,
        characters: charactersStr,
        settings: settingsStr,
        previousChaptersContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        client.getProviderType(),
        "chapter",
        promptParams,
        promptVersion,
    );

    console.log(
        `[chapter-generator] Generating chapter ${chapterIndex + 1} using structured output with full previous context`,
    );

    // 9. Generate chapter using structured output
    // NOTE: For structured output with Qwen3, DO NOT specify maxTokens
    // The model automatically uses its maximum output capacity for JSON generation
    // Specifying maxTokens can cause JSON truncation and parsing failures
    const chapterData: AiChapterType = await client.generateStructured(
        userPromptText,
        AiChapterZodSchema,
        {
            systemPrompt,
            temperature: 0.3, // Low temperature for consistent JSON structure
            // maxTokens: undefined, // Intentionally omitted - let model use maximum
        },
    );

    // 10. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        `[chapter-generator] ✅ Generated chapter ${chapterIndex + 1}:`,
        {
            title: chapterData.title,
            summary: chapterData.summary?.substring(0, 50) || "N/A",
            generationTime: totalTime,
        },
    );

    // 11. Build and return result with metadata
    const result: GenerateChapterResult = {
        chapter: chapterData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}
