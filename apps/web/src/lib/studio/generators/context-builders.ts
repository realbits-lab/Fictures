/**
 * Context Builders for Story Generation
 *
 * Common utilities for converting story entities to formatted context strings
 * used in AI prompts across all generators.
 *
 * Functions are organized by generation order:
 * 1. Story (Phase 1) - buildStoryContext
 * 2. Character (Phase 2) - buildCharactersContext
 * 3. Setting (Phase 3) - buildSettingContext, buildSettingsContext
 * 4. Part (Phase 4) - buildPartContext
 * 5. Chapter (Phase 5) - buildChapterContext
 * 6. Scene (Phase 6) - buildSceneContext
 */

import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "@/lib/schemas/zod/generated";

// =============================================================================
// Story Context Builders (Phase 1)
// =============================================================================

/**
 * Build story context for part/chapter generation
 * Includes ID and all fields
 */
export function buildStoryContext(story: Story): string {
    return `Story Information:
  ID: ${story.id || "N/A"}
  Title: ${story.title || "Untitled"}
  Genre: ${story.genre ?? "General Fiction"}
  Tone: ${story.tone ?? "hopeful"}
  Summary: ${story.summary ?? "A story of adversity and triumph"}
  Moral Framework: ${story.moralFramework ?? "Universal human virtues"}
  Status: ${story.status ?? "writing"}`;
}

// =============================================================================
// Part Context Builders (Phase 4)
// =============================================================================

/**
 * Build comprehensive part context string
 * Includes ID, summary, and character arcs with character names
 */
export function buildPartContext(part: Part, characters: Character[]): string {
    const arcs = part.characterArcs;
    const arcsContext =
        arcs && arcs.length > 0
            ? arcs
                  .map((arc) => {
                      const char = characters.find(
                          (c) => c.id === arc.characterId,
                      );
                      return `\n    - ${char?.name || "Unknown"}: ${arc.macroAdversity?.internal || "N/A"} / ${arc.macroAdversity?.external || "N/A"} → ${arc.macroVirtue || "N/A"} → ${arc.macroConsequence || "N/A"} → ${arc.macroNewAdversity || "N/A"}`;
                  })
                  .join("")
            : "None";

    return `Part: ${part.title}
  ID: ${part.id}
  Summary: ${part.summary}
  Character Arcs: ${arcsContext}`;
}

/**
 * Build multiple parts context string for part generation
 * Used to provide full context of all previously generated parts
 * Uses buildPartContext internally for each part
 */
export function buildPartsContext(
    parts: Part[],
    characters: Character[],
): string {
    if (parts.length === 0) {
        return "None (this is the first part)";
    }

    return parts
        .map((part, idx) => {
            return `Part ${idx + 1}:\n${buildPartContext(part, characters)}`;
        })
        .join("\n\n");
}

// =============================================================================
// Chapter Context Builders (Phase 5)
// =============================================================================

/**
 * Build comprehensive chapter context string
 * Includes all chapter information: title, summary, arc position, adversity/virtue types,
 * focus characters, seeds planted/resolved, and causal connections
 */
export function buildChapterContext(chapter: Chapter): string {
    // Format focus characters array
    const focusCharactersStr = Array.isArray(chapter.focusCharacters)
        ? chapter.focusCharacters.join(", ")
        : "N/A";

    // Format seeds planted array
    const seedsPlantedStr =
        Array.isArray(chapter.seedsPlanted) && chapter.seedsPlanted.length > 0
            ? chapter.seedsPlanted
                  .map(
                      (seed) =>
                          `\n    - ${seed.id}: ${seed.description} (Expected: ${seed.expectedPayoff || "N/A"})`,
                  )
                  .join("")
            : "None";

    // Format seeds resolved array
    const seedsResolvedStr =
        Array.isArray(chapter.seedsResolved) && chapter.seedsResolved.length > 0
            ? chapter.seedsResolved
                  .map(
                      (seed) =>
                          `\n    - Seed ${seed.seedId} from Chapter ${seed.sourceChapterId}, Scene ${seed.sourceSceneId}: ${seed.payoffDescription}`,
                  )
                  .join("")
            : "None";

    return `Title: ${chapter.title || "Untitled Chapter"}
Summary: ${chapter.summary || "N/A"}
Arc Position: ${chapter.arcPosition || "N/A"}
Contributes to Macro Arc: ${chapter.contributesToMacroArc || "N/A"}
Focus Characters: ${focusCharactersStr}
Adversity Type: ${chapter.adversityType || "N/A"}
Virtue Type: ${chapter.virtueType || "N/A"}
Seeds Planted: ${seedsPlantedStr}
Seeds Resolved: ${seedsResolvedStr}
Connects to Previous Chapter: ${chapter.connectsToPreviousChapter || "N/A"}
Creates Next Adversity: ${chapter.createsNextAdversity || "N/A"}`;
}

// =============================================================================
// Scene Context Builders (Phase 6)
// =============================================================================

/**
 * Build comprehensive scene context string
 * Includes title, summary, cycle phase, emotional beat
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
 * Build previous scenes context string for scene summary generation
 * Used to provide full context of all previously generated scenes in the chapter
 * Includes content preview if available
 * Uses buildSceneContext internally for each scene
 */
export function buildScenesContext(scenes: Scene[]): string {
    if (scenes.length === 0) {
        return "None (this is the first scene)";
    }

    return scenes
        .map((scene, idx) => {
            const sceneContext = buildSceneContext(scene);
            const contentPreview = scene.content
                ? `\nContent: ${scene.content.substring(0, 500)}...`
                : "\nContent: Not yet generated...";

            return `Scene ${idx + 1}:\n${sceneContext}${contentPreview}`;
        })
        .join("\n\n");
}

// =============================================================================
// Character Context Builders (Phase 2)
// =============================================================================

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

// =============================================================================
// Setting Context Builders (Phase 3)
// =============================================================================

/**
 * Build single setting context string (comprehensive format with all information)
 * Includes adversityElements, cycleAmplification, visual references, etc.
 */
export function buildSettingContext(setting: Setting): string {
    const adversityElements =
        typeof setting.adversityElements === "object" &&
        setting.adversityElements !== null
            ? (setting.adversityElements as {
                  physicalObstacles?: string[];
                  scarcityFactors?: string[];
                  dangerSources?: string[];
                  socialDynamics?: string[];
              })
            : {};

    // cycleAmplification field removed from schema
    const cycleAmplification = {};

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

    const visualReferences = Array.isArray(setting.visualReferences)
        ? setting.visualReferences
        : [];
    const colorPalette = Array.isArray(setting.colorPalette)
        ? setting.colorPalette
        : [];

    return `Setting: ${setting.name || "Unnamed"}
  ID: ${setting.id || "N/A"}
  Summary: ${setting.summary || "N/A"}
  Adversity Elements:
    - Physical Obstacles: ${adversityElements.physicalObstacles?.join(", ") || "N/A"}
    - Scarcity Factors: ${adversityElements.scarcityFactors?.join(", ") || "N/A"}
    - Danger Sources: ${adversityElements.dangerSources?.join(", ") || "N/A"}
    - Social Dynamics: ${adversityElements.socialDynamics?.join(", ") || "N/A"}
  Symbolic Meaning: ${setting.symbolicMeaning || "N/A"}
  Cycle Amplification:
    - Setup: N/A
    - Confrontation: N/A
    - Virtue: N/A
    - Consequence: N/A
    - Transition: N/A
  Mood: ${setting.mood || "N/A"}
  Emotional Resonance: ${setting.emotionalResonance || "N/A"}
  Sensory:
    - Sight: ${sensory.sight?.join(", ") || "N/A"}
    - Sound: ${sensory.sound?.join(", ") || "N/A"}
    - Smell: ${sensory.smell?.join(", ") || "N/A"}
    - Touch: ${sensory.touch?.join(", ") || "N/A"}
    - Taste: ${sensory.taste?.join(", ") || "N/A"}
  Architectural Style: ${setting.architecturalStyle || "N/A"}
  Visual References: ${visualReferences.join(", ") || "N/A"}
  Color Palette: ${colorPalette.join(", ") || "N/A"}`;
}

/**
 * Build multiple settings context string (comprehensive format)
 * Used for part/chapter/scene-summary generation
 * Uses buildSettingContext internally for each setting
 */
export function buildSettingsContext(settings: Setting[]): string {
    return settings.map((s) => buildSettingContext(s)).join("\n\n");
}

/**
 * Build generic setting context when no specific setting is provided
 * Fallback for scene content generation
 */
export function buildGenericSettingContext(): string {
    return "Generic setting - use appropriate environmental details";
}
