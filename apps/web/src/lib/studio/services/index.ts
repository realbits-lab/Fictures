/**
 * Studio Services
 *
 * Service layer exports for story generation and management.
 * Services handle both generation logic and database persistence.
 *
 * Architecture:
 * - Generators: Pure generation logic (no DB operations)
 * - Services: Generation + Persistence (orchestrate generators + DB)
 * - Routes: Authentication + Service calls
 * - Orchestrator: Coordinates multiple services
 */

export {
    ChapterService,
    chapterService,
    type ServiceChapterParams,
    type ServiceChapterResult,
} from "./chapter-service";

export {
    CharacterService,
    characterService,
    type ServiceCharactersParams,
    type ServiceCharactersResult,
} from "./character-service";

export {
    PartService,
    partService,
    type ServicePartParams,
    type ServicePartResult,
} from "./part-service";

export {
    SceneContentService,
    type ServiceSceneContentParams,
    type ServiceSceneContentResult,
    sceneContentService,
} from "./scene-content-service";

export {
    type ImproveSceneWithDataParams,
    SceneImprovementService,
    type ServiceSceneImprovementParams,
    type ServiceSceneImprovementResult,
    sceneImprovementService,
} from "./scene-improvement-service";

export {
    SceneSummaryService,
    type ServiceSceneSummaryParams,
    type ServiceSceneSummaryResult,
    sceneSummaryService,
} from "./scene-summary-service";

export {
    type ServiceSettingsParams,
    type ServiceSettingsResult,
    SettingService,
    settingService,
} from "./setting-service";

export {
    type ServiceStoryParams,
    type ServiceStoryResult,
    StoryService,
    storyService,
} from "./story-service";
