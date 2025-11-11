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
    type Setting,
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

    // 2. Build comprehensive character list string (same pattern as part-generator.ts)
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

    // 3. Build comprehensive settings list string (ALL fields from schema)
    const settingsStr: string = params.settings
        ? params.settings
              .map((s: Setting) => {
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

    // 5. Build parts context string with character arcs
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
