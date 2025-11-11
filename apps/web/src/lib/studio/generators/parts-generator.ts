/**
 * Parts Generator
 *
 * Generates story parts (acts) using the Adversity-Triumph Engine.
 * This is the fourth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    GeneratePartsParams,
    GeneratePartsResult,
    PartPromptParams,
} from "./types";
import {
    type GeneratedPartData,
    GeneratedPartSchema,
} from "./zod-schemas.generated";

/**
 * Generate story parts (acts)
 *
 * @param params - Parts generation parameters
 * @returns Parts data (caller responsible for database save)
 */
export async function generateParts(
    params: GeneratePartsParams,
): Promise<GeneratePartsResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        story,
        characters,
        settings,
        partsCount,
        onProgress,
    }: GeneratePartsParams = params;

    const parts: GeneratedPartData[] = [];

    // 2. Generate each part in sequence
    for (let i = 0; i < partsCount; i++) {
        console.log(
            `[parts-generator] 🎬 Generating part ${i + 1}/${partsCount}...`,
        );

        // 3. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, partsCount);
        }

        // 4. Build comprehensive character list string
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

        console.log(
            `[parts-generator] Character list prepared: ${characters.length} characters`,
        );

        // 5. Build comprehensive settings list string
        const settingsStr: string = settings
            .map((s) => {
                const atmosphere =
                    typeof s.atmosphere === "object" && s.atmosphere !== null
                        ? (s.atmosphere as {
                              mood?: string;
                              lighting?: string;
                              sounds?: string;
                              temperature?: string;
                          })
                        : {};

                return `Setting: ${s.name} - Description: ${s.description || "N/A"} - Atmosphere: ${atmosphere.mood || "N/A"} (mood), ${atmosphere.lighting || "N/A"} (lighting), ${atmosphere.sounds || "N/A"} (sounds), ${atmosphere.temperature || "N/A"} (temperature) - Sensory Details: ${s.sensoryDetails || "N/A"}`;
            })
            .join("\n");

        console.log(
            `[parts-generator] Settings list prepared: ${settings.length} settings`,
        );

        // 6. Build merged story context string
        const storyContext: string = `Title: ${story.title}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;

        // 7. Get the prompt template for part generation
        const promptParams: PartPromptParams = {
            partNumber: String(i + 1),
            story: storyContext,
            characters: charactersStr,
            settings: settingsStr,
            previousPartsContext:
                "None (this is the first part in a batch generation)",
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
            `[parts-generator] Generating part ${i + 1} using structured output`,
        );

        // 8. Generate part using structured output
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

        parts.push(partData);

        console.log(
            `[parts-generator] ✅ Generated part ${i + 1}/${partsCount}:`,
            {
                title: partData.title,
                summary: partData.summary?.substring(0, 50) || "N/A",
                characterArcs: partData.characterArcs?.length || 0,
            },
        );
    }

    // 9. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[parts-generator] ✅ All parts generated successfully:", {
        count: parts.length,
        generationTime: totalTime,
    });

    // 10. Build and return result with metadata
    const result: GeneratePartsResult = {
        parts,
        metadata: {
            totalGenerated: parts.length,
            generationTime: totalTime,
        },
    };

    return result;
}
