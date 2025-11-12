/**
 * Studio Agent Tools
 *
 * Complete toolset for the Studio Agent system integrating:
 * - CRUD operations for story entities
 * - Generation tools for Adversity-Triumph Engine
 * - Advisory tools for prerequisites and validation
 * - Utility tools for API keys and progress tracking
 */

import { studioAgentAdvisoryTools } from "./agent-advisory-tools";
import { studioAgentCrudTools } from "./agent-crud-tools";
import { studioAgentGenerationTools } from "./agent-generation-tools";
import { studioAgentUtilityTools } from "./agent-utility-tools";

// ==============================================================================
// COMBINED TOOLS EXPORT
// ==============================================================================

export const studioAgentTools = {
    // CRUD Operations (22 tools)
    ...studioAgentCrudTools,

    // Generation Pipeline (9 tools)
    ...studioAgentGenerationTools,

    // Advisory & Validation (3 tools)
    ...studioAgentAdvisoryTools,

    // Utility (4 tools)
    ...studioAgentUtilityTools,
};

// Type-safe tool names
export type StudioAgentToolName = keyof typeof studioAgentTools;

// Total: 38 tools

/**
 * Tool Categories
 *
 * CRUD Tools (22):
 * - Story: getStory, updateStory
 * - Part: getPart, createPart, updatePart, deletePart
 * - Chapter: getChapter, createChapter, updateChapter, deleteChapter
 * - Scene: getScene, createScene, updateScene, deleteScene
 * - Character: getCharacter, createCharacter, updateCharacter, deleteCharacter
 * - Setting: getSetting, createSetting, updateSetting, deleteSetting
 *
 * Generation Tools (9):
 * - generateStorySummary (Phase 1)
 * - generateCharacters (Phase 2)
 * - generateSettings (Phase 3)
 * - generateParts (Phase 4)
 * - generateChapters (Phase 5)
 * - generateSceneSummaries (Phase 6)
 * - generateSceneContent (Phase 7)
 * - evaluateScene (Phase 8)
 * - generateImages (Phase 9)
 *
 * Advisory Tools (3):
 * - checkPrerequisites
 * - validateStoryStructure
 * - suggestNextPhase
 *
 * Utility Tools (4):
 * - validateApiKey
 * - updatePhaseProgress
 * - getGenerationProgress
 * - createEmptyStory
 */

// Export individual tool categories for selective use
export {
    studioAgentCrudTools,
    studioAgentGenerationTools,
    studioAgentAdvisoryTools,
    studioAgentUtilityTools,
};
