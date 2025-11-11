/**
 * Context Builders for Story Generation
 *
 * Common utilities for converting story entities to formatted context strings
 * used in AI prompts across all generators.
 */

import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "./zod-schemas.generated";

/**
 * Build story context string
 */
export function buildStoryContext(story: Story): string {
    return `Title: ${story.title || "Untitled"}
Genre: ${story.genre ?? "General Fiction"}
Summary: ${story.summary ?? "A story of adversity and triumph"}
Moral Framework: ${story.moralFramework ?? "Universal human virtues"}`;
}

/**
 * Build part context string
 */
export function buildPartContext(part: Part): string {
    return `Title: ${part.title || "Untitled Part"}
Summary: ${part.summary || "N/A"}`;
}

/**
 * Build chapter context string
 */
export function buildChapterContext(chapter: Chapter): string {
    return `Title: ${chapter.title || "Untitled Chapter"}
Summary: ${chapter.summary || "N/A"}
Arc Position: ${chapter.arcPosition || "N/A"}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}`;
}

/**
 * Build scene context string (specification)
 */
export function buildSceneContext(scene: Scene): string {
    return `Title: ${scene.title || "Untitled Scene"}
Summary: ${scene.summary || "N/A"}
Cycle Phase: ${scene.cyclePhase || "N/A"}
Emotional Beat: ${scene.emotionalBeat || "N/A"}
Suggested Length: ${scene.suggestedLength || "medium"}
Sensory Anchors: ${Array.isArray(scene.sensoryAnchors) ? scene.sensoryAnchors.join(", ") : "Use setting-appropriate details"}
Dialogue vs Description: ${scene.dialogueVsDescription || "Balanced mix"}`;
}

/**
 * Build comprehensive character list string
 */
export function buildCharactersContext(characters: Character[]): string {
    return characters
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

            return `Character: ${c.name || "Unnamed"} (${c.isMain ? "Main" : "Supporting"})
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
}

/**
 * Build single setting context string (with full sensory details)
 */
export function buildSettingContext(setting: Setting): string {
    const sensory =
        typeof setting.sensory === "object" && setting.sensory !== null
            ? (setting.sensory as {
                  sight?: string[];
                  sound?: string[];
                  smell?: string[];
                  touch?: string[];
                  taste?: string[];
              })
            : {};

    return `Setting: ${setting.name || "Unnamed Setting"}
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
}

/**
 * Build multiple settings context string (compact format)
 */
export function buildSettingsContext(settings: Setting[]): string {
    return settings
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

            return `Setting: ${s.name || "Unnamed"} - Summary: ${s.summary || "N/A"} - Mood: ${s.mood || "N/A"} - Emotional Resonance: ${s.emotionalResonance || "N/A"} - Sensory: sight (${sensory.sight?.join(", ") || "N/A"}), sound (${sensory.sound?.join(", ") || "N/A"}), smell (${sensory.smell?.join(", ") || "N/A"}), touch (${sensory.touch?.join(", ") || "N/A"})`;
        })
        .join("\n");
}

/**
 * Build generic setting context when no specific setting is provided
 */
export function buildGenericSettingContext(): string {
    return "Generic setting - use appropriate environmental details";
}

/**
 * Build detailed settings context for part/chapter generation
 * Includes adversityElements, cycleAmplification, visual references, etc.
 */
export function buildDetailedSettingsContext(settings: Setting[]): string {
    return settings
        .map((s) => {
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

            const visualReferences = Array.isArray(s.visualReferences)
                ? s.visualReferences
                : [];
            const colorPalette = Array.isArray(s.colorPalette)
                ? s.colorPalette
                : [];

            return `Setting: ${s.name || "Unnamed"}
  ID: ${s.id || "N/A"}
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
}

/**
 * Build detailed story context for part/chapter generation
 * Includes ID and all fields
 */
export function buildDetailedStoryContext(story: Story): string {
    return `Story Information:
  ID: ${story.id || "N/A"}
  Title: ${story.title || "Untitled"}
  Genre: ${story.genre ?? "General Fiction"}
  Tone: ${story.tone ?? "hopeful"}
  Summary: ${story.summary ?? "A story of adversity and triumph"}
  Moral Framework: ${story.moralFramework ?? "Universal human virtues"}
  Status: ${story.status ?? "writing"}`;
}

/**
 * Build detailed characters context for part/chapter generation
 * Includes ID and all fields
 */
export function buildDetailedCharactersContext(
    characters: Character[],
): string {
    return characters
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

            return `Character: ${c.name || "Unnamed"} (${c.isMain ? "Main" : "Supporting"})
  ID: ${c.id || "N/A"}
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
}
