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

        // 4. Build comprehensive character list string (ALL fields from schema)
        const charactersStr: string = characters
            .map((c) => {
                // Type assertion for personality
                const personality =
                    typeof c.personality === "object" && c.personality !== null
                        ? (c.personality as {
                              traits?: string[];
                              values?: string[];
                          })
                        : { traits: [], values: [] };

                // Type assertion for physicalDescription
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

                // Type assertion for voiceStyle
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
  ID: ${c.id}
  Summary: ${c.summary || "N/A"}
  Core Trait: ${c.coreTrait || "N/A"}
  Internal Flaw: ${c.internalFlaw || "N/A"}
  External Goal: ${c.externalGoal || "N/A"}
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

        // 5. Build comprehensive settings list string (ALL fields from schema)
        const settingsStr: string = settings
            .map((s) => {
                // Type assertion for adversityElements
                const adversityElements =
                    typeof s.adversityElements === "object" &&
                    s.adversityElements !== null
                        ? (s.adversityElements as {
                              physicalObstacles?: string[];
                              scarcityFactors?: string[];
                              dangerSources?: string[];
                              socialDynamics?: string[];
                          })
                        : {};

                // Type assertion for cycleAmplification
                const cycleAmplification =
                    typeof s.cycleAmplification === "object" &&
                    s.cycleAmplification !== null
                        ? (s.cycleAmplification as {
                              setup?: string;
                              confrontation?: string;
                              virtue?: string;
                              consequence?: string;
                              transition?: string;
                          })
                        : {};

                // Type assertion for sensory
                const sensory =
                    typeof s.sensory === "object" && s.sensory !== null
                        ? (s.sensory as {
                              sight?: string[];
                              sound?: string[];
                              smell?: string[];
                              touch?: string[];
                              taste?: string[];
                          })
                        : {};

                // Type assertion for visualReferences and colorPalette
                const visualReferences = Array.isArray(s.visualReferences)
                    ? s.visualReferences
                    : [];
                const colorPalette = Array.isArray(s.colorPalette)
                    ? s.colorPalette
                    : [];

                return `Setting: ${s.name}
  ID: ${s.id}
  Summary: ${s.summary || "N/A"}
  Adversity Elements:
    - Physical Obstacles: ${adversityElements.physicalObstacles?.join(", ") || "N/A"}
    - Scarcity Factors: ${adversityElements.scarcityFactors?.join(", ") || "N/A"}
    - Danger Sources: ${adversityElements.dangerSources?.join(", ") || "N/A"}
    - Social Dynamics: ${adversityElements.socialDynamics?.join(", ") || "N/A"}
  Symbolic Meaning: ${s.symbolicMeaning || "N/A"}
  Cycle Amplification:
    - Setup: ${cycleAmplification.setup || "N/A"}
    - Confrontation: ${cycleAmplification.confrontation || "N/A"}
    - Virtue: ${cycleAmplification.virtue || "N/A"}
    - Consequence: ${cycleAmplification.consequence || "N/A"}
    - Transition: ${cycleAmplification.transition || "N/A"}
  Mood: ${s.mood || "N/A"}
  Emotional Resonance: ${s.emotionalResonance || "N/A"}
  Sensory:
    - Sight: ${sensory.sight?.join(", ") || "N/A"}
    - Sound: ${sensory.sound?.join(", ") || "N/A"}
    - Smell: ${sensory.smell?.join(", ") || "N/A"}
    - Touch: ${sensory.touch?.join(", ") || "N/A"}
    - Taste: ${sensory.taste?.join(", ") || "N/A"}
  Architectural Style: ${s.architecturalStyle || "N/A"}
  Visual References: ${visualReferences.join(", ") || "N/A"}
  Color Palette: ${colorPalette.join(", ") || "N/A"}`;
            })
            .join("\n\n");

        console.log(
            `[parts-generator] Settings list prepared: ${settings.length} settings`,
        );

        // 6. Build comprehensive story context string (ALL fields from schema)
        const storyContext: string = `Story Information:
  ID: ${story.id}
  Title: ${story.title}
  Genre: ${story.genre ?? "General Fiction"}
  Tone: ${story.tone ?? "hopeful"}
  Summary: ${story.summary ?? "A story of adversity and triumph"}
  Moral Framework: ${story.moralFramework ?? "Universal human virtues"}
  Status: ${story.status ?? "writing"}
  View Count: ${story.viewCount ?? 0}
  Rating: ${story.rating ?? 0} (${story.ratingCount ?? 0} ratings)`;

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
