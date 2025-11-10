/**
 * Scene Evaluation Service
 *
 * Service layer that handles scene evaluation generation and database persistence.
 * Implements the Service Layer Pattern to separate generation logic from data access.
 *
 * This service:
 * 1. Orchestrates scene evaluation using pure generator functions
 * 2. Handles database operations (fetch, insert, update)
 * 3. Manages transaction coordination
 * 4. Provides reusable business logic for both API routes and orchestrator
 *
 * Architecture:
 * - Generator (pure): Generation logic only
 * - Service (this file): Generation + Persistence
 * - Route: Authentication + Service call
 * - Orchestrator: Coordinates multiple services
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/db/schema";
import { evaluateScene } from "../generators/scene-evaluation-generator";
import type {
    EvaluateSceneParams,
    EvaluateSceneResult,
} from "../generators/types";

/**
 * Service parameters for scene evaluation
 */
export interface EvaluateSceneServiceParams {
    sceneId: string;
    userId?: string; // Optional: For ownership verification
    maxIterations?: number;
}

/**
 * Service parameters with pre-fetched data
 */
export interface EvaluateSceneWithDataParams {
    sceneId: string;
    scene: {
        id: string;
        chapterId: string;
        title: string;
        content: string;
        updatedAt: string;
    };
    story: {
        id: string;
        title: string;
        genre: string;
        moralFramework: string;
        summary: string;
        tone: "hopeful" | "dark" | "bittersweet" | "satirical";
    };
    userId?: string; // Optional: For ownership verification
    maxIterations?: number;
}

/**
 * Service result including database record
 */
export interface EvaluateSceneServiceResult {
    scene: {
        id: string;
        chapterId: string;
        title: string;
        content: string;
        updatedAt: string;
    };
    evaluation: {
        score: number;
        categories: EvaluateSceneResult["categories"];
        feedback: EvaluateSceneResult["feedback"];
        iterations: number;
        improved: boolean;
    };
    metadata: {
        generationTime: number;
    };
}

/**
 * Scene Evaluation Service Class
 *
 * Handles scene evaluation with automatic database persistence.
 * Separates generation logic from data access for better testing and reusability.
 */
export class SceneEvaluationService {
    /**
     * Evaluate and improve a scene with automatic database update
     *
     * This method:
     * 1. Fetches scene from database
     * 2. Calls pure generator for evaluation
     * 3. Updates database with improved content if quality threshold met
     * 4. Returns complete result with database record
     *
     * @param params - Scene evaluation parameters
     * @returns Complete evaluation result with updated scene record
     * @throws Error if scene not found or evaluation fails
     */
    async evaluateAndSave(
        params: EvaluateSceneServiceParams,
    ): Promise<EvaluateSceneServiceResult> {
        const { sceneId, userId, maxIterations = 2 } = params;

        // 1. Fetch scene from database
        const sceneResults = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, sceneId));

        const scene = sceneResults[0];

        if (!scene) {
            throw new Error(`Scene not found: ${sceneId}`);
        }

        if (!scene.content || scene.content.trim() === "") {
            throw new Error("Scene must have content before evaluation");
        }

        // 2. Get chapter to fetch story ID
        const chapterResults = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, scene.chapterId));

        const chapter = chapterResults[0];

        if (!chapter) {
            throw new Error(`Chapter not found: ${scene.chapterId}`);
        }

        // 3. Get story information for evaluation context
        const storyResults = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));

        const story = storyResults[0];

        if (!story) {
            throw new Error(`Story not found: ${chapter.storyId}`);
        }

        // 4. Verify ownership if userId provided
        if (userId && story.authorId !== userId) {
            throw new Error(
                "Access denied: You do not have permission to evaluate this scene",
            );
        }

        const storyContext: import("../generators/types").SceneEvaluationStoryContext =
            {
                id: story.id,
                title: story.title,
                genre: story.genre || "Contemporary",
                moralFramework: story.moralFramework || "courage",
                summary: story.summary || "",
                tone: story.tone || "hopeful",
            };

        // 5. Call pure generator for evaluation
        const evaluateParams: EvaluateSceneParams = {
            content: scene.content,
            story: storyContext,
            maxIterations,
        };

        const evaluationResult: EvaluateSceneResult =
            await evaluateScene(evaluateParams);

        // 6. Check if score meets quality threshold before updating
        const QUALITY_THRESHOLD = 3.0; // Minimum "Effective" level (3.0/4.0)
        const meetsThreshold: boolean =
            evaluationResult.score >= QUALITY_THRESHOLD;

        console.log(
            `[SceneEvaluationService] Quality check: ${evaluationResult.score}/4.0 (threshold: ${QUALITY_THRESHOLD}/4.0) - ${meetsThreshold ? "PASS ✅" : "FAIL ❌"}`,
        );

        let updatedScene: {
            id: string;
            chapterId: string;
            title: string;
            content: string;
            updatedAt: string;
        };

        // 7. Update scene with improved content if threshold met or content improved
        if (meetsThreshold || evaluationResult.improved) {
            console.log(
                "[SceneEvaluationService] 💾 Saving evaluation results...",
            );
            const now: string = new Date().toISOString();

            const updatedSceneResults = await db
                .update(scenes)
                .set({
                    content: evaluationResult.finalContent,
                    updatedAt: now,
                })
                .where(eq(scenes.id, sceneId))
                .returning();

            const dbScene = updatedSceneResults[0];
            updatedScene = {
                id: dbScene.id,
                chapterId: dbScene.chapterId,
                title: dbScene.title,
                content: dbScene.content || "",
                updatedAt: dbScene.updatedAt,
            };
            console.log(
                "[SceneEvaluationService] ✅ Evaluation results saved (content updated)",
            );
        } else {
            // 8. Keep original content if threshold not met and no improvement
            console.log(
                "[SceneEvaluationService] ⚠️ Quality threshold not met - keeping original content",
            );
            updatedScene = {
                id: scene.id,
                chapterId: scene.chapterId,
                title: scene.title,
                content: scene.content || "",
                updatedAt: scene.updatedAt,
            };
        }

        // 9. Return service result
        return {
            scene: updatedScene,
            evaluation: {
                score: evaluationResult.score,
                categories: evaluationResult.categories,
                feedback: evaluationResult.feedback,
                iterations: evaluationResult.iterations,
                improved: evaluationResult.improved,
            },
            metadata: {
                generationTime: evaluationResult.metadata.generationTime,
            },
        };
    }

    /**
     * Evaluate and save scene using pre-fetched data (optimized for routes)
     *
     * This method is optimized for API routes that have already fetched
     * the scene and story data as part of authentication/authorization flow.
     *
     * @param params - Evaluation parameters with pre-fetched data
     * @returns Complete evaluation result with updated scene record
     */
    async evaluateAndSaveWithData(
        params: EvaluateSceneWithDataParams,
    ): Promise<EvaluateSceneServiceResult> {
        const { sceneId, scene, story, maxIterations = 2 } = params;

        if (!scene.content || scene.content.trim() === "") {
            throw new Error("Scene must have content before evaluation");
        }

        // 1. Call pure generator for evaluation
        const evaluateParams: EvaluateSceneParams = {
            content: scene.content,
            story: {
                id: story.id,
                title: story.title,
                genre: story.genre,
                moralFramework: story.moralFramework,
                summary: story.summary,
                tone: story.tone,
            },
            maxIterations,
        };

        const evaluationResult: EvaluateSceneResult =
            await evaluateScene(evaluateParams);

        // 2. Check if score meets quality threshold before updating
        const QUALITY_THRESHOLD = 3.0; // Minimum "Effective" level (3.0/4.0)
        const meetsThreshold: boolean =
            evaluationResult.score >= QUALITY_THRESHOLD;

        console.log(
            `[SceneEvaluationService] Quality check: ${evaluationResult.score}/4.0 (threshold: ${QUALITY_THRESHOLD}/4.0) - ${meetsThreshold ? "PASS ✅" : "FAIL ❌"}`,
        );

        let updatedScene: typeof scene;

        // 3. Update scene with improved content if threshold met or content improved
        if (meetsThreshold || evaluationResult.improved) {
            console.log(
                "[SceneEvaluationService] 💾 Saving evaluation results...",
            );
            const now: string = new Date().toISOString();

            const updatedSceneResults = await db
                .update(scenes)
                .set({
                    content: evaluationResult.finalContent,
                    updatedAt: now,
                })
                .where(eq(scenes.id, sceneId))
                .returning();

            const dbScene = updatedSceneResults[0];
            updatedScene = {
                id: dbScene.id,
                chapterId: dbScene.chapterId,
                title: dbScene.title,
                content: dbScene.content || "",
                updatedAt: dbScene.updatedAt,
            };
            console.log(
                "[SceneEvaluationService] ✅ Evaluation results saved (content updated)",
            );
        } else {
            // 4. Keep original content if threshold not met and no improvement
            console.log(
                "[SceneEvaluationService] ⚠️ Quality threshold not met - keeping original content",
            );
            updatedScene = scene;
        }

        // 5. Return service result
        return {
            scene: updatedScene,
            evaluation: {
                score: evaluationResult.score,
                categories: evaluationResult.categories,
                feedback: evaluationResult.feedback,
                iterations: evaluationResult.iterations,
                improved: evaluationResult.improved,
            },
            metadata: {
                generationTime: evaluationResult.metadata.generationTime,
            },
        };
    }

    /**
     * Evaluate a scene without saving to database (preview mode)
     *
     * Useful for:
     * - Testing evaluation logic
     * - Previewing improvements before committing
     * - Running evaluations in contexts without database access
     *
     * @param content - Scene content to evaluate
     * @param storyContext - Story context for evaluation
     * @param maxIterations - Maximum improvement iterations
     * @returns Evaluation result without database update
     */
    async evaluateOnly(
        content: string,
        storyContext: {
            title: string;
            genre: string;
            moralFramework: string;
        },
        maxIterations = 2,
    ): Promise<EvaluateSceneResult> {
        const evaluateParams: EvaluateSceneParams = {
            content,
            story: {
                id: "temp",
                title: storyContext.title,
                genre: storyContext.genre,
                moralFramework: storyContext.moralFramework,
                summary: "",
                tone: "hopeful" as const,
            },
            maxIterations,
        };

        return await evaluateScene(evaluateParams);
    }
}

/**
 * Default service instance
 * Use this for most cases unless you need custom configuration
 */
export const sceneEvaluationService = new SceneEvaluationService();
