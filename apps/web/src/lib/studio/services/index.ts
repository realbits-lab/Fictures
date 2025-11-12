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
    type GenerateChaptersServiceParams,
    type GenerateChaptersServiceResult,
} from "./chapters-service";

export {
    CharacterService,
    characterService,
    type ServiceCharactersParams,
    type ServiceCharactersResult,
} from "./character-service";
export {
    type GeneratePartsServiceParams,
    type GeneratePartsServiceResult,
    PartService,
    partService,
} from "./parts-service";
export {
    SceneContentService,
    type ServiceSceneContentParams,
    type ServiceSceneContentResult,
    sceneContentService,
} from "./scene-content-service";
export {
    type EvaluateSceneWithDataParams,
    SceneEvaluationService,
    type ServiceSceneEvaluationParams,
    type ServiceSceneEvaluationResult,
    sceneEvaluationService,
} from "./scene-evaluation-service";

export {
    type GenerateSceneSummariesServiceParams,
    type GenerateSceneSummariesServiceResult,
    SceneSummariesService,
    sceneSummariesService,
} from "./scene-summaries-service";
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
