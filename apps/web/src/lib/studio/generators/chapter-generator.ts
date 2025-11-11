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
        settings,
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

    // 3. Build comprehensive character list string (ALL fields from schema)
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

    // 4. Build comprehensive story context string (ALL fields from schema)
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

    // 5. Build comprehensive settings list string (ALL fields from schema)
    const settingsStr: string = settings
        ? settings
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
              .join("\n\n")
        : "N/A";

    // 6. Build comprehensive part context string (with character arcs)
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

    const partContext: string = `Part: ${part.title}
  ID: ${part.id}
  Summary: ${part.summary}
  Character Arcs: ${
      arcs
          ?.map((arc) => {
              const char = characters.find((c) => c.id === arc.characterId);
              return `\n    - ${char?.name || "Unknown"}: ${arc.macroAdversity?.internal || "N/A"} / ${arc.macroAdversity?.external || "N/A"} → ${arc.macroVirtue || "N/A"} → ${arc.macroConsequence || "N/A"} → ${arc.macroNewAdversity || "N/A"}`;
          })
          .join("") || "None"
  }`;

    // 7. Build previous chapters context string (FULL CONTEXT)
    const previousChaptersContext: string =
        previousChapters.length > 0
            ? previousChapters
                  .map((ch, idx) => {
                      return `Chapter ${idx + 1}: ${ch.title}
Summary: ${ch.summary || "N/A"}
Arc Position: ${ch.arcPosition || "N/A"}
Contributes to Macro Arc: ${ch.contributesToMacroArc || "N/A"}`;
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
        textGenerationClient.getProviderType(),
        "chapter",
        promptParams,
    );

    console.log(
        `[chapter-generator] Generating chapter ${chapterIndex + 1} using structured output with full previous context`,
    );

    // 9. Generate chapter using structured output
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
