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
    type EvaluateSceneServiceParams,
    type EvaluateSceneServiceResult,
    type EvaluateSceneWithDataParams,
    SceneEvaluationService,
    sceneEvaluationService,
} from "./scene-evaluation-service";
