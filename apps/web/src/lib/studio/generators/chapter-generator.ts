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

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    ChapterPromptParams,
    GenerateChapterParams,
    GenerateChapterResult,
} from "./types";
import {
    type GeneratedChapterData,
    GeneratedChapterSchema,
} from "./zod-schemas.generated";

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
        previousChapters,
        chapterIndex,
    }: GenerateChapterParams = params;

    console.log(
        `[chapter-generator] 📖 Generating chapter ${chapterIndex + 1} (Part: ${part.title})...`,
    );
    console.log(
        `[chapter-generator] Previous chapters count: ${previousChapters.length}`,
    );

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

    // 3. Build previous chapters context string (FULL CONTEXT)
    const previousChaptersContext: string =
        previousChapters.length > 0
            ? previousChapters
                  .map((ch, idx) => {
                      return `Chapter ${idx + 1}: ${ch.title}
Summary: ${ch.summary}
Adversity: ${ch.adversityType || "N/A"}
Virtue: ${ch.virtueType || "N/A"}
Arc Position: ${ch.arcPosition || "N/A"}`;
                  })
                  .join("\n\n")
            : "None (this is the first chapter)";

    // 4. Get previous chapter's specific context (most recent)
    const previousChapterContext: string =
        previousChapters.length > 0
            ? (previousChapters[previousChapters.length - 1].summary ??
              "Previous chapter")
            : "None (this is the first chapter)";

    console.log(
        `[chapter-generator] Previous chapters context prepared (${previousChaptersContext.length} characters)`,
    );

    // 5. Get the prompt template for chapter generation
    const promptParams: ChapterPromptParams = {
        chapterNumber: String(chapterIndex + 1),
        totalChapters: String(chapterIndex + 10), // Estimate, will be updated
        partTitle: part.title,
        storyTitle: story.title,
        storyGenre: story.genre ?? "General Fiction",
        storySummary: story.summary ?? "A story of adversity and triumph",
        partSummary: part.summary ?? "Part of the story",
        characterName: focusCharacter.name,
        characterFlaw: focusCharacter.internalFlaw || "unresolved fear",
        characterArc:
            characterArc?.macroAdversity?.internal || "personal growth",
        previousChapterContext,
        previousChaptersContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "chapter",
        promptParams,
    );

    console.log(
        `[chapter-generator] Generating chapter ${chapterIndex + 1} using structured output with full previous context`,
    );

    // 6. Generate chapter using structured output
    const chapterData: GeneratedChapterData =
        await textGenerationClient.generateStructured(
            userPromptText,
            GeneratedChapterSchema,
            {
                systemPrompt,
                temperature: 0.85,
                maxTokens: 8192,
            },
        );

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        `[chapter-generator] ✅ Generated chapter ${chapterIndex + 1}:`,
        {
            title: chapterData.title,
            summary: chapterData.summary?.substring(0, 50) || "N/A",
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    const result: GenerateChapterResult = {
        chapter: chapterData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}
