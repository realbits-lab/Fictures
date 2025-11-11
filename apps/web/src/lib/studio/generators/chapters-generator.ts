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
import {
    buildDetailedCharactersContext,
    buildDetailedSettingsContext,
    buildDetailedStoryContext,
} from "./context-builders";
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

    // 2. Build context strings using detailed builders
    const charactersStr: string = buildDetailedCharactersContext(characters);
    const settingsStr: string = params.settings
        ? buildDetailedSettingsContext(params.settings)
        : "N/A";
    const storyContext: string = buildDetailedStoryContext(story);

    console.log(
        `[chapters-generator] Context prepared: ${characters.length} characters, ${params.settings?.length || 0} settings`,
    );

    // 3. Build parts context string with character arcs
    const partsStr: string = parts
        .map((part, idx) => {
            const arcs = part.characterArcs as Array<{
                characterId: string;
                macroAdversity?: {
                    internal?: string;
                    external?: string;
                };
                macroVirtue?: string;
                macroConsequence?: string;
                macroNewAdversity?: string;
            }> | null;

            return `Part ${idx + 1}: ${part.title}
Summary: ${part.summary}
Character Arcs: ${
                arcs
                    ?.map((arc) => {
                        const char = characters.find(
                            (c) => c.id === arc.characterId,
                        );
                        return `\n  - ${char?.name || "Unknown"}: ${arc.macroAdversity?.internal || "N/A"} / ${arc.macroAdversity?.external || "N/A"} → ${arc.macroVirtue || "N/A"} → ${arc.macroConsequence || "N/A"} → ${arc.macroNewAdversity || "N/A"}`;
                    })
                    .join("") || "None"
            }`;
        })
        .join("\n\n");

    // 6. Generate chapters for each part
    for (const part of parts) {
        console.log(
            `[chapters-generator] 📖 Generating ${chaptersPerPart} chapters for part: ${part.title}`,
        );

        for (let i = 0; i < chaptersPerPart; i++) {
            chapterIndex++;

            console.log(
                `[chapters-generator] 📄 Generating chapter ${chapterIndex}/${parts.length * chaptersPerPart}...`,
            );

            // 7. Report progress callback if provided
            if (onProgress) {
                onProgress(chapterIndex, parts.length * chaptersPerPart);
            }

            // 8. Build previous chapters context string
            const previousChaptersContext: string =
                chapters.length > 0
                    ? chapters
                          .map((ch, idx) => {
                              return `Chapter ${idx + 1}: ${ch.title}
Summary: ${ch.summary || "N/A"}
Arc Position: ${ch.arcPosition || "N/A"}
Contributes to Macro Arc: ${ch.contributesToMacroArc || "N/A"}`;
                          })
                          .join("\n\n")
                    : "None (this is the first chapter)";

            console.log(
                `[chapters-generator] Previous chapters context prepared (${chapters.length} chapters)`,
            );

            // 9. Get the prompt template for chapter generation
            const promptParams: ChapterPromptParams = {
                chapterNumber: String(chapterIndex),
                story: storyContext,
                parts: partsStr,
                characters: charactersStr,
                settings: settingsStr,
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
