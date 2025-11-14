/**
 * Scene Improvement Service
 *
 * Service layer that handles scene quality improvement (evaluation + content update) and database persistence.
 * Implements the Service Layer Pattern to separate generation logic from data access.
 *
 * This service:
 * 1. Orchestrates scene improvement using pure generator functions
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
import { GENRE } from "@/lib/constants/genres";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/schemas/drizzle";
import { improveScene } from "../generators/scene-improvement-generator";
import type {
    GeneratorSceneImprovementParams,
    GeneratorSceneImprovementResult,
} from "../generators/types";

/**
 * Service parameters for scene improvement
 */
export interface ServiceSceneImprovementParams {
    sceneId: string;
    userId?: string; // Optional: For ownership verification
    maxIterations?: number;
    apiKey?: string; // Optional: API key for AI server authentication
}

/**
 * Service parameters with pre-fetched data
 */
export interface ImproveSceneWithDataParams {
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
        genre: import("@/lib/constants/genres").StoryGenre;
        moralFramework: string;
        summary: string;
        tone: import("@/lib/constants/tones").StoryTone;
    };
    userId?: string; // Optional: For ownership verification
    maxIterations?: number;
    apiKey?: string; // Optional: API key for AI server authentication
}

/**
 * Service result including database record
 */
export interface ServiceSceneImprovementResult {
    scene: {
        id: string;
        chapterId: string;
        title: string;
        content: string;
        updatedAt: string;
    };
    improvement: {
        score: number;
        categories: GeneratorSceneImprovementResult["categories"];
        feedback: GeneratorSceneImprovementResult["feedback"];
        iterations: number;
        improved: boolean;
    };
    metadata: {
        generationTime: number;
    };
}

/**
 * Scene Improvement Service Class
 *
 * Handles scene quality improvement (evaluation + update) with automatic database persistence.
 * Separates generation logic from data access for better testing and reusability.
 */
export class SceneImprovementService {
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
    async improveAndSave(
        params: ServiceSceneImprovementParams,
    ): Promise<ServiceSceneImprovementResult> {
        const { sceneId, userId, maxIterations = 2, apiKey } = params;

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

        const storyContext: import("../generators/types").SceneImprovementStoryContext =
            {
                id: story.id,
                title: story.title,
                genre: story.genre || GENRE.SLICE,
                moralFramework: story.moralFramework || "courage",
                summary: story.summary || "",
                tone: story.tone || "hopeful",
            };

        // 5. Call pure generator for evaluation
        const improvementParams: GeneratorSceneImprovementParams = {
            content: scene.content,
            story: storyContext,
            maxIterations,
            apiKey,
        };

        const improvementResult: GeneratorSceneImprovementResult =
            await improveScene(improvementParams);

        // 6. Check if score meets quality threshold before updating
        const QUALITY_THRESHOLD = 3.0; // Minimum "Effective" level (3.0/4.0)
        const meetsThreshold: boolean =
            improvementResult.score >= QUALITY_THRESHOLD;

        console.log(
            `[SceneImprovementService] Quality check: ${improvementResult.score}/4.0 (threshold: ${QUALITY_THRESHOLD}/4.0) - ${meetsThreshold ? "PASS ✅" : "FAIL ❌"}`,
        );

        let updatedScene: {
            id: string;
            chapterId: string;
            title: string;
            content: string;
            updatedAt: string;
        };

        // 7. Update scene with improved content if threshold met or content improved
        if (meetsThreshold || improvementResult.improved) {
            console.log(
                "[SceneImprovementService] 💾 Saving evaluation results...",
            );
            const now: string = new Date().toISOString();

            const updatedSceneResults = await db
                .update(scenes)
                .set({
                    content: improvementResult.finalContent,
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
                "[SceneImprovementService] ✅ Evaluation results saved (content updated)",
            );
        } else {
            // 8. Keep original content if threshold not met and no improvement
            console.log(
                "[SceneImprovementService] ⚠️ Quality threshold not met - keeping original content",
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
            improvement: {
                score: improvementResult.score,
                categories: improvementResult.categories,
                feedback: improvementResult.feedback,
                iterations: improvementResult.iterations,
                improved: improvementResult.improved,
            },
            metadata: {
                generationTime: improvementResult.metadata.generationTime,
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
    async improveAndSaveWithData(
        params: ImproveSceneWithDataParams,
    ): Promise<ServiceSceneImprovementResult> {
        const { sceneId, scene, story, maxIterations = 2, apiKey } = params;

        if (!scene.content || scene.content.trim() === "") {
            throw new Error("Scene must have content before evaluation");
        }

        // 1. Call pure generator for evaluation
        const improvementParams: GeneratorSceneImprovementParams = {
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
            apiKey,
        };

        const improvementResult: GeneratorSceneImprovementResult =
            await improveScene(improvementParams);

        // 2. Check if score meets quality threshold before updating
        const QUALITY_THRESHOLD = 3.0; // Minimum "Effective" level (3.0/4.0)
        const meetsThreshold: boolean =
            improvementResult.score >= QUALITY_THRESHOLD;

        console.log(
            `[SceneImprovementService] Quality check: ${improvementResult.score}/4.0 (threshold: ${QUALITY_THRESHOLD}/4.0) - ${meetsThreshold ? "PASS ✅" : "FAIL ❌"}`,
        );

        let updatedScene: typeof scene;

        // 3. Update scene with improved content if threshold met or content improved
        if (meetsThreshold || improvementResult.improved) {
            console.log(
                "[SceneImprovementService] 💾 Saving evaluation results...",
            );
            const now: string = new Date().toISOString();

            const updatedSceneResults = await db
                .update(scenes)
                .set({
                    content: improvementResult.finalContent,
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
                "[SceneImprovementService] ✅ Evaluation results saved (content updated)",
            );
        } else {
            // 4. Keep original content if threshold not met and no improvement
            console.log(
                "[SceneImprovementService] ⚠️ Quality threshold not met - keeping original content",
            );
            updatedScene = scene;
        }

        // 5. Return service result
        return {
            scene: updatedScene,
            improvement: {
                score: improvementResult.score,
                categories: improvementResult.categories,
                feedback: improvementResult.feedback,
                iterations: improvementResult.iterations,
                improved: improvementResult.improved,
            },
            metadata: {
                generationTime: improvementResult.metadata.generationTime,
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
    async improveOnly(
        content: string,
        storyContext: {
            title: string;
            genre: string;
            moralFramework: string;
        },
        maxIterations = 2,
        apiKey?: string,
    ): Promise<GeneratorSceneImprovementResult> {
        const improvementParams: GeneratorSceneImprovementParams = {
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
            apiKey,
        };

        return await improveScene(improvementParams);
    }
}

/**
 * Default service instance
 * Use this for most cases unless you need custom configuration
 */
export const sceneImprovementService = new SceneImprovementService();
