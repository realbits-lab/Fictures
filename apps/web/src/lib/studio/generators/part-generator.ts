/**
 * Part Generator (Singular)
 *
 * Generates ONE next story part using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates parts one at a time,
 * with full context of all previous parts.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (service/API layer).
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
 * @param params - Part generation parameters with previous parts
 * @returns Part data (caller responsible for database save)
 */
export async function generatePart(
    params: GeneratePartParams,
): Promise<GeneratePartResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const {
        story,
        characters,
        settings,
        previousParts,
        partIndex,
    }: GeneratePartParams = params;

    console.log(
        `[part-generator] 🎬 Generating part ${partIndex + 1} with full context...`,
    );
    console.log(
        `[part-generator] Previous parts count: ${previousParts.length}`,
    );

    // 2. Build comprehensive character list string (ALL fields from schema)
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

    // 3. Build comprehensive settings list string (ALL fields from schema)
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

    // 4. Build previous parts context string (FULL CONTEXT)
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
                  .join("\n\n")
            : "None (this is the first part)";

    console.log(
        `[part-generator] Previous parts context prepared (${previousPartsContext.length} characters)`,
    );

    // 5. Build comprehensive story context string (ALL fields from schema)
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

    // 6. Get the prompt template for part generation
    const promptParams: PartPromptParams = {
        partNumber: String(partIndex + 1),
        story: storyContext,
        characters: charactersStr,
        settings: settingsStr,
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

    // 7. Generate part using structured output
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

    // 8. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(`[part-generator] ✅ Generated part ${partIndex + 1}:`, {
        title: partData.title,
        summary: partData.summary?.substring(0, 50) || "N/A",
        characterArcs: partData.characterArcs?.length || 0,
        generationTime: totalTime,
    });

    // 9. Build and return result with metadata
    const result: GeneratePartResult = {
        part: partData,
        metadata: {
            generationTime: totalTime,
        },
    };

    return result;
}
