/**
 * Scene Content Generator
 *
 * Generates prose content for individual scenes.
 * This is the seventh phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    settings,
    stories,
} from "@/lib/db/schema";
import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type {
    GenerateSceneContentParams,
    GenerateSceneContentResult,
    SceneContentPromptParams,
} from "./types";
import type {
    Chapter,
    Character,
    Part,
    Setting,
    Story,
} from "./zod-schemas.generated";

/**
 * Generate prose content for a single scene
 *
 * @param params - Scene content generation parameters
 * @returns Scene content (caller responsible for database save)
 */
export async function generateSceneContent(
    params: GenerateSceneContentParams,
): Promise<GenerateSceneContentResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const {
        storyId,
        partId,
        chapterId,
        story: storyParam,
        part: partParam,
        chapter: chapterParam,
        characters: charactersParam,
        settings: settingsParam,
        scene,
        language = "English",
    }: GenerateSceneContentParams = params;

    console.log(
        `[scene-content-generator] 📝 Generating content for scene: ${scene.title}`,
    );

    // 2. Get story - use provided object or fetch from database
    let story: Partial<Story>;
    if (storyParam) {
        // Orchestrator mode - use provided object
        story = storyParam;
    } else if (storyId) {
        // Service mode - fetch from database
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))) as Story[];
        const fetchedStory: Story | undefined = storyResult[0];

        if (!fetchedStory) {
            throw new Error(`Story not found: ${storyId}`);
        }
        story = fetchedStory;
    } else {
        throw new Error(
            "Either storyId or story object must be provided in params",
        );
    }

    // 3. Get part - use provided object or fetch from database
    let part: Partial<Part>;
    if (partParam) {
        // Orchestrator mode - use provided object
        part = partParam;
    } else if (partId) {
        // Service mode - fetch from database
        const partResult: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.id, partId))) as Part[];
        const fetchedPart: Part | undefined = partResult[0];

        if (!fetchedPart) {
            throw new Error(`Part not found: ${partId}`);
        }
        part = fetchedPart;
    } else {
        throw new Error(
            "Either partId or part object must be provided in params",
        );
    }

    // 4. Get chapter - use provided object or fetch from database
    let chapter: Partial<Chapter>;
    if (chapterParam) {
        // Orchestrator mode - use provided object
        chapter = chapterParam;
    } else if (chapterId) {
        // Service mode - fetch from database
        const chapterResult: Chapter[] = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId))) as Chapter[];
        const fetchedChapter: Chapter | undefined = chapterResult[0];

        if (!fetchedChapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        chapter = fetchedChapter;
    } else {
        throw new Error(
            "Either chapterId or chapter object must be provided in params",
        );
    }

    // 5. Get characters - use provided array or fetch from database
    let storyCharacters: Partial<Character>[];
    if (charactersParam) {
        // Orchestrator mode - use provided array
        storyCharacters = charactersParam;
    } else if (storyId) {
        // Service mode - fetch from database
        storyCharacters = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, storyId))) as Character[];
    } else {
        throw new Error(
            "Either storyId or characters array must be provided in params",
        );
    }

    // 6. Get setting - use provided array or fetch from database
    let setting: Partial<Setting> | undefined;
    if (scene.settingId) {
        if (settingsParam) {
            // Orchestrator mode - find in provided array
            setting = settingsParam.find((s) => s.id === scene.settingId);
        } else if (storyId) {
            // Service mode - fetch from database
            const settingResult: Setting[] = (await db
                .select()
                .from(settings)
                .where(eq(settings.id, scene.settingId))) as Setting[];
            setting = settingResult[0];
        }
    }

    // 7. Build story context string
    const storyContext: string = `Title: ${story.title}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;

    // 8. Build part context string
    const partContext: string = `Title: ${part.title}
Summary: ${part.summary || "N/A"}`;

    // 9. Build chapter context string
    const chapterContext: string = `Title: ${chapter.title}
Summary: ${chapter.summary}
Arc Position: ${chapter.arcPosition || "N/A"}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}`;

    // 10. Build scene context string (the summary/specification)
    const sceneContext: string = `Title: ${scene.title}
Summary: ${scene.summary || "N/A"}
Cycle Phase: ${scene.cyclePhase || "N/A"}
Emotional Beat: ${scene.emotionalBeat || "N/A"}
Suggested Length: ${scene.suggestedLength || "medium"}
Sensory Anchors: ${Array.isArray(scene.sensoryAnchors) ? scene.sensoryAnchors.join(", ") : "Use setting-appropriate details"}
Dialogue vs Description: ${scene.dialogueVsDescription || "Balanced mix"}`;

    // 11. Build comprehensive character list string
    const charactersStr: string = storyCharacters
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
        `[scene-content-generator] Character list prepared: ${storyCharacters.length} characters`,
    );

    // 12. Build setting context string (the specific setting for this scene)
    const settingStr: string = setting
        ? (() => {
              const sensory =
                  typeof setting.sensory === "object" &&
                  setting.sensory !== null
                      ? (setting.sensory as {
                            sight?: string[];
                            sound?: string[];
                            smell?: string[];
                            touch?: string[];
                            taste?: string[];
                        })
                      : {};

              return `Setting: ${setting.name}
Summary: ${setting.summary || "N/A"}
Mood: ${setting.mood || "N/A"}
Emotional Resonance: ${setting.emotionalResonance || "N/A"}
Architectural Style: ${setting.architecturalStyle || "N/A"}
Sensory Details:
  - Sight: ${sensory.sight?.join(", ") || "N/A"}
  - Sound: ${sensory.sound?.join(", ") || "N/A"}
  - Smell: ${sensory.smell?.join(", ") || "N/A"}
  - Touch: ${sensory.touch?.join(", ") || "N/A"}
  - Taste: ${sensory.taste?.join(", ") || "N/A"}`;
          })()
        : "Generic setting - use appropriate environmental details";

    console.log(
        `[scene-content-generator] Setting prepared: ${setting?.name || "Generic"}`,
    );

    // 13. Get the prompt template for scene content generation
    const promptParams: SceneContentPromptParams = {
        story: storyContext,
        part: partContext,
        chapter: chapterContext,
        scene: sceneContext,
        characters: charactersStr,
        setting: settingStr,
        language,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        textGenerationClient.getProviderType(),
        "scene_content",
        promptParams,
    );

    console.log(
        "[scene-content-generator] Generating scene content using text generation",
    );

    // 4. Generate scene content using direct text generation (no schema)
    const response = await textGenerationClient.generate({
        prompt: userPromptText,
        systemPrompt,
        temperature: 0.85,
        maxTokens: 8192,
    });

    // 5. Extract and process generated content
    const content: string = response.text.trim();
    const wordCount: number = content.split(/\s+/).length;

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[scene-content-generator] ✅ Generated scene content:", {
        sceneId: params.sceneId,
        wordCount,
        generationTime: totalTime,
    });

    // 7. Return scene content result
    return {
        content,
        wordCount,
        metadata: {
            generationTime: totalTime,
            model: response.model,
        },
    };
}
