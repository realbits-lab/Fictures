/**
 * Chapters Generator
 *
 * Generates story chapters using the Adversity-Triumph Engine.
 * This is the fifth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    ChapterPromptParams,
    GenerateChaptersParams,
    GenerateChaptersResult,
} from "./types";
import {
    type GeneratedChapterData,
    GeneratedChapterSchema,
} from "./zod-schemas.generated";

/**
 * Generate story chapters
 *
 * @param params - Chapters generation parameters
 * @returns Chapters data (caller responsible for database save)
 */
export async function generateChapters(
    params: GenerateChaptersParams,
): Promise<GenerateChaptersResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        story,
        parts,
        characters,
        chaptersPerPart,
        onProgress,
    }: GenerateChaptersParams = params;

    const chapters: GeneratedChapterData[] = [];
    let chapterIndex: number = 0;

    // 2. Generate chapters for each part
    for (const part of parts) {
        console.log(
            `[chapters-generator] 📖 Generating ${chaptersPerPart} chapters for part: ${part.title}`,
        );

        for (let i = 0; i < chaptersPerPart; i++) {
            chapterIndex++;

            console.log(
                `[chapters-generator] 📄 Generating chapter ${chapterIndex}/${parts.length * chaptersPerPart}...`,
            );

            // 3. Report progress callback if provided
            if (onProgress) {
                onProgress(chapterIndex, parts.length * chaptersPerPart);
            }

            // 4. Get character arc for this chapter (simplified - using first character)
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

            console.log(
                `[chapters-generator] Focus character: ${focusCharacter.name}`,
            );
            console.log(
                `[chapters-generator] Character arc: ${characterArc?.macroAdversity?.internal || "personal growth"}`,
            );

            // 5. Get the prompt template for chapter generation
            const promptParams: ChapterPromptParams = {
                chapterNumber: String(chapterIndex),
                totalChapters: String(parts.length * chaptersPerPart),
                partTitle: part.title,
                storyTitle: story.title,
                storyGenre: story.genre ?? "General Fiction",
                storySummary:
                    story.summary ?? "A story of adversity and triumph",
                partSummary: part.summary ?? "Part of the story",
                characterName: focusCharacter.name,
                characterFlaw: focusCharacter.internalFlaw || "unresolved fear",
                characterArc:
                    characterArc?.macroAdversity?.internal || "personal growth",
                previousChapterContext:
                    chapters.length > 0
                        ? (chapters[chapters.length - 1].summary ??
                          "Previous chapter")
                        : "None (this is the first chapter)",
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
                `[chapters-generator] Generating chapter ${chapterIndex} using structured output`,
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

            chapters.push(chapterData);

            console.log(
                `[chapters-generator] ✅ Generated chapter ${chapterIndex}/${parts.length * chaptersPerPart}:`,
                {
                    title: chapterData.title,
                    summary: chapterData.summary?.substring(0, 50) || "N/A",
                },
            );
        }
    }

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        "[chapters-generator] ✅ All chapters generated successfully:",
        {
            count: chapters.length,
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    const result: GenerateChaptersResult = {
        chapters,
        metadata: {
            totalGenerated: chapters.length,
            generationTime: totalTime,
        },
    };

    return result;
}
