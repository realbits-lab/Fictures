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

    // 2. Build comprehensive character list string
    const charactersStr: string = characters
        .map((c) => {
            const personality =
                typeof c.personality === "object" && c.personality !== null
                    ? (c.personality as {
                          traits?: string[];
                          values?: string[];
                      })
                    : { traits: [], values: [] };
            const physicalDesc =
                typeof c.physicalDescription === "object" &&
                c.physicalDescription !== null
                    ? (c.physicalDescription as {
                          age?: string;
                          appearance?: string;
                          distinctiveFeatures?: string;
                          style?: string;
                      })
                    : {};
            const voice =
                typeof c.voiceStyle === "object" && c.voiceStyle !== null
                    ? (c.voiceStyle as {
                          tone?: string;
                          vocabulary?: string;
                          quirks?: string[];
                          emotionalRange?: string;
                      })
                    : {};

            return `Character: ${c.name} (${c.isMain ? "Main" : "Supporting"})
  Summary: ${c.summary || "N/A"}
  External Goal: ${c.externalGoal || "N/A"}
  Core Trait: ${c.coreTrait || "N/A"}
  Internal Flaw: ${c.internalFlaw || "N/A"}
  Personality:
    - Traits: ${personality.traits?.join(", ") || "N/A"}
    - Values: ${personality.values?.join(", ") || "N/A"}
  Backstory: ${c.backstory || "N/A"}
  Physical Description:
    - Age: ${physicalDesc.age || "N/A"}
    - Appearance: ${physicalDesc.appearance || "N/A"}
    - Distinctive Features: ${physicalDesc.distinctiveFeatures || "N/A"}
    - Style: ${physicalDesc.style || "N/A"}
  Voice Style:
    - Tone: ${voice.tone || "N/A"}
    - Vocabulary: ${voice.vocabulary || "N/A"}
    - Quirks: ${voice.quirks?.join("; ") || "N/A"}
    - Emotional Range: ${voice.emotionalRange || "N/A"}`;
        })
        .join("\n\n");

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

    // 4. Build merged story context string
    const storyContext: string = `Title: ${story.title}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;

    // 5. Get the prompt template for part generation
    const promptParams: PartPromptParams = {
        partNumber: String(partIndex + 1),
        story: storyContext,
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

    // 6. Generate part using structured output
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

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(`[part-generator] ✅ Generated part ${partIndex + 1}:`, {
        title: partData.title,
        summary: partData.summary?.substring(0, 50) || "N/A",
        characterArcs: partData.characterArcs?.length || 0,
        generationTime: totalTime,
    });

    // 8. Build and return result with metadata
    const result: GeneratePartResult = {
        part: partData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}
