/**
 * Part Generator (Singular)
 *
 * Generates ONE next story part using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates parts one at a time,
 * with full context of all previous parts.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    GeneratePartParams,
    GeneratePartResult,
    PartPromptParams,
} from "./types";
import {
    type GeneratedPartData,
    GeneratedPartSchema,
} from "./zod-schemas.generated";

/**
 * Generate ONE next story part with full context
 *
 * @param params - Part generation parameters with previous parts context
 * @returns Part data (caller responsible for database save)
 */
export async function generatePart(
    params: GeneratePartParams,
): Promise<GeneratePartResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const { story, characters, previousParts, partIndex }: GeneratePartParams =
        params;

    console.log(
        `[part-generator] 🎬 Generating part ${partIndex + 1} with full context...`,
    );
    console.log(
        `[part-generator] Previous parts count: ${previousParts.length}`,
    );

    // 2. Build character list string
    const charactersStr: string = characters
        .map((c) => `- ${c.name}: ${c.coreTrait} (flaw: ${c.internalFlaw})`)
        .join("\n");

    // 3. Build previous parts context string (FULL CONTEXT)
    const previousPartsContext: string =
        previousParts.length > 0
            ? previousParts
                  .map((part, idx) => {
                      const arcs = part.characterArcs as Array<{
                          characterId: string;
                          macroAdversity?: {
                              internal?: string;
                              external?: string;
                          };
                          macroVirtue?: string;
                          macroConsequence?: string;
                      }> | null;

                      return `Part ${idx + 1}: ${part.title}
Summary: ${part.summary}
Character Arcs: ${
                          arcs
                              ?.map((arc) => {
                                  const char = characters.find(
                                      (c) => c.id === arc.characterId,
                                  );
                                  return `\n  - ${char?.name || "Unknown"}: ${arc.macroAdversity?.internal || "N/A"} → ${arc.macroVirtue || "N/A"} → ${arc.macroConsequence || "N/A"}`;
                              })
                              .join("") || "None"
                      }`;
                  })
                  .join("\n\n")
            : "None (this is the first part)";

    console.log(
        `[part-generator] Previous parts context prepared (${previousPartsContext.length} characters)`,
    );

    // 4. Get the prompt template for part generation
    const promptParams: PartPromptParams = {
        partNumber: String(partIndex + 1),
        storyTitle: story.title,
        storyGenre: story.genre ?? "General Fiction",
        storySummary: story.summary ?? "A story of adversity and triumph",
        moralFramework: story.moralFramework ?? "Universal human virtues",
        characters: charactersStr,
        previousPartsContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "part",
        promptParams,
    );

    console.log(
        `[part-generator] Generating part ${partIndex + 1} using structured output with full previous context`,
    );

    // 5. Generate part using structured output
    const partData: GeneratedPartData =
        await textGenerationClient.generateStructured(
            userPromptText,
            GeneratedPartSchema,
            {
                systemPrompt,
                temperature: 0.85,
                maxTokens: 8192,
            },
        );

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(`[part-generator] ✅ Generated part ${partIndex + 1}:`, {
        title: partData.title,
        summary: partData.summary?.substring(0, 50) || "N/A",
        characterArcs: partData.characterArcs?.length || 0,
        generationTime: totalTime,
    });

    // 7. Build and return result with metadata
    const result: GeneratePartResult = {
        part: partData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}
