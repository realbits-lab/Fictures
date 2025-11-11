/**
 * Scene Summary Generator (Singular)
 *
 * Generates ONE next scene summary using the Adversity-Triumph Engine.
 * This is the extreme incremental version that generates scene summaries one at a time,
 * with full context of all previous scenes in the chapter.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    CyclePhase,
    GenerateSceneSummaryParams,
    GenerateSceneSummaryResult,
    SceneSummaryPromptParams,
} from "./types";
import {
    type GeneratedSceneSummaryData,
    GeneratedSceneSummarySchema,
} from "./zod-schemas.generated";

/**
 * Generate ONE next scene summary with full context
 *
 * @param params - Scene summary generation parameters with previous scenes context
 * @returns Scene summary data (caller responsible for database save)
 */
export async function generateSceneSummary(
    params: GenerateSceneSummaryParams,
): Promise<GenerateSceneSummaryResult> {
    const startTime = Date.now();

    // 1. Extract parameters
    const {
        story,
        part,
        chapter,
        characters,
        settings,
        previousScenes,
        sceneIndex,
    }: GenerateSceneSummaryParams = params;

    console.log(
        `[scene-summary-generator] 📄 Generating scene ${sceneIndex + 1} (Chapter: ${chapter.title})...`,
    );
    console.log(
        `[scene-summary-generator] Previous scenes count: ${previousScenes.length}`,
    );

    // 2. Determine cycle phase
    const cyclePhases: CyclePhase[] = [
        "setup",
        "confrontation",
        "virtue",
        "consequence",
        "transition",
    ];
    const cyclePhase =
        cyclePhases[Math.min(sceneIndex, cyclePhases.length - 1)];

    console.log(`[scene-summary-generator] Cycle phase: ${cyclePhase}`);

    // 3. Build merged story context string
    const storyContext: string = `Title: ${story.title}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;

    // 4. Build part context string
    const partContext: string = `Title: ${part.title}
Summary: ${part.summary || "N/A"}`;

    // 5. Build chapter context string
    const chapterContext: string = `Title: ${chapter.title}
Summary: ${chapter.summary}
Arc Position: ${chapter.arcPosition || "N/A"}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}`;

    // 6. Build comprehensive character list string
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
        `[scene-summary-generator] Character list prepared: ${characters.length} characters`,
    );

    // 7. Build comprehensive settings list string
    const settingsStr: string = settings
        .map((s) => {
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

            return `Setting: ${s.name} - Summary: ${s.summary || "N/A"} - Mood: ${s.mood || "N/A"} - Emotional Resonance: ${s.emotionalResonance || "N/A"} - Sensory: sight (${sensory.sight?.join(", ") || "N/A"}), sound (${sensory.sound?.join(", ") || "N/A"}), smell (${sensory.smell?.join(", ") || "N/A"}), touch (${sensory.touch?.join(", ") || "N/A"})`;
        })
        .join("\n");

    console.log(
        `[scene-summary-generator] Settings list prepared: ${settings.length} settings`,
    );

    // 8. Build previous scenes context string (FULL CONTEXT with FULL CONTENT)
    const previousScenesContext: string =
        previousScenes.length > 0
            ? previousScenes
                  .map((scene, idx) => {
                      return `Scene ${idx + 1}: ${scene.title}
Phase: ${scene.cyclePhase || "N/A"}
Summary: ${scene.summary || "N/A"}
Content: ${scene.content ? scene.content.substring(0, 500) : "Not yet generated"}...
Emotional Beat: ${scene.emotionalBeat || "N/A"}`;
                  })
                  .join("\n\n")
            : "None (this is the first scene)";

    console.log(
        `[scene-summary-generator] Previous scenes context prepared (${previousScenesContext.length} characters)`,
    );

    // 9. Get the prompt template for scene summary generation
    const promptParams: SceneSummaryPromptParams = {
        sceneNumber: String(sceneIndex + 1),
        sceneCount: String(5), // Standard 5 scenes per chapter
        story: storyContext,
        part: partContext,
        chapter: chapterContext,
        characters: charactersStr,
        settings: settingsStr,
        previousScenesContext,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "scene_summary",
        promptParams,
    );

    console.log(
        `[scene-summary-generator] Generating scene summary ${sceneIndex + 1} using structured output with full previous context`,
    );

    // 6. Generate scene summary using structured output
    const sceneData: GeneratedSceneSummaryData =
        await textGenerationClient.generateStructured(
            userPromptText,
            GeneratedSceneSummarySchema,
            {
                systemPrompt,
                temperature: 0.8,
                maxTokens: 8192,
            },
        );

    // 7. Calculate total generation time
    const totalTime = Date.now() - startTime;

    console.log(
        `[scene-summary-generator] ✅ Generated scene summary ${sceneIndex + 1}:`,
        {
            title: sceneData.title,
            cyclePhase: sceneData.cyclePhase,
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    return {
        scene: sceneData,
        metadata: {
            generationTime: totalTime,
        },
    };
}
