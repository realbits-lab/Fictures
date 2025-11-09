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
import { ChapterJsonSchema } from "./json-schemas.generated";
import type { GenerateChaptersParams, GenerateChaptersResult } from "./types";
import type { Chapter } from "./zod-schemas.generated";

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

    const chapters: Chapter[] = [];
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
            const characterArc = part.characterArcs?.find(
                (arc) => arc.characterId === focusCharacter.id,
            );

            console.log(
                `[chapters-generator] Focus character: ${focusCharacter.name}`,
            );
            console.log(
                `[chapters-generator] Character arc: ${characterArc?.macroAdversity?.internal || "personal growth"}`,
            );

            // 5. Generate chapter using template
            const response: Awaited<
                ReturnType<typeof textGenerationClient.generateWithTemplate>
            > = await textGenerationClient.generateWithTemplate(
                "chapter",
                {
                    chapterNumber: String(chapterIndex),
                    totalChapters: String(parts.length * chaptersPerPart),
                    partTitle: part.title,
                    storyTitle: story.title,
                    storyGenre: story.genre ?? "General Fiction",
                    storySummary:
                        story.summary ?? "A story of adversity and triumph",
                    partSummary: part.summary,
                    characterName: focusCharacter.name,
                    characterFlaw:
                        focusCharacter.internalFlaw || "unresolved fear",
                    characterArc:
                        characterArc?.macroAdversity?.internal ||
                        "personal growth",
                    previousChapterContext:
                        chapters.length > 0
                            ? chapters[chapters.length - 1].summary
                            : "None (this is the first chapter)",
                },
                {
                    temperature: 0.85,
                    maxTokens: 8192,
                    responseFormat: "json",
                    responseSchema: ChapterJsonSchema,
                },
            );

            console.log(
                `[chapters-generator] AI response received for chapter ${chapterIndex}`,
            );

            // 6. Parse and validate chapter data
            const chapterData: Chapter = JSON.parse(response.text) as Chapter;
            chapters.push(chapterData);

            console.log(
                `[chapters-generator] ✅ Generated chapter ${chapterIndex}/${parts.length * chaptersPerPart}:`,
                {
                    title: chapterData.title,
                    partId: chapterData.partId,
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
