import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { chapters, sceneEvaluations, scenes, stories } from "@/lib/db/schema";
import { buildEvaluationPrompt } from "@/lib/evaluation/prompts";
import {
    type EvaluationResult,
    evaluationRequestSchema,
    evaluationResultSchema,
} from "@/lib/evaluation/schemas";

/**
 * POST /api/evaluate/scene
 * Evaluate a scene using the Architectonics of Engagement framework
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user (supports both session and API key)
        const authResult = await authenticateRequest(request);
        if (!authResult) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        // Check if user has required scope
        if (!hasRequiredScope(authResult, "stories:read")) {
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:read",
                },
                { status: 403 },
            );
        }

        // 2. Parse and validate request body
        const body = await request.json();
        const validationResult = evaluationRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request",
                    details: validationResult.error.issues,
                },
                { status: 400 },
            );
        }

        const { sceneId, content, context, options } = validationResult.data;

        // 3. Verify scene exists and user has access
        const sceneData = await db
            .select({
                sceneId: scenes.id,
                sceneContent: scenes.content,
                chapterId: chapters.id,
                storyId: stories.id,
                authorId: stories.authorId,
            })
            .from(scenes)
            .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
            .innerJoin(stories, eq(chapters.storyId, stories.id))
            .where(eq(scenes.id, sceneId))
            .limit(1);

        if (sceneData.length === 0) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        const scene = sceneData[0];

        if (scene.authorId !== authResult.user.id) {
            return NextResponse.json(
                { error: "Forbidden: You do not have access to this scene" },
                { status: 403 },
            );
        }

        // 4. Build evaluation prompt
        const prompt = buildEvaluationPrompt(content, context);

        // 5. Generate evaluation using AI Gateway (OpenAI GPT-4o-mini)
        const startTime = Date.now();
        const result = await generateObject({
            model: gateway("openai/gpt-4o-mini"),
            schema: evaluationResultSchema,
            prompt: prompt,
            temperature: 0.3, // Lower temperature for more consistent evaluations
        });

        const evaluationTime = Date.now() - startTime;
        const evaluation = result.object as EvaluationResult;

        // 6. Calculate category scores from metrics
        const categoryScores = {
            plot: calculateCategoryScore([
                evaluation.metrics.plot.hookEffectiveness.score,
                evaluation.metrics.plot.goalClarity.score,
                evaluation.metrics.plot.conflictEngagement.score,
                evaluation.metrics.plot.cliffhangerTransition.score,
            ]),
            character: calculateCategoryScore([
                evaluation.metrics.character.agency.score,
                evaluation.metrics.character.voiceDistinction.score,
                evaluation.metrics.character.emotionalDepth.score,
                evaluation.metrics.character.relationshipDynamics.score,
            ]),
            pacing: calculateCategoryScore([
                evaluation.metrics.pacing.microPacing.score,
                evaluation.metrics.pacing.tensionManagement.score,
                evaluation.metrics.pacing.sceneEconomy.score,
            ]),
            prose: calculateCategoryScore([
                evaluation.metrics.prose.clarity.score,
                evaluation.metrics.prose.showDontTell.score,
                evaluation.metrics.prose.voiceConsistency.score,
                evaluation.metrics.prose.technicalQuality.score,
            ]),
            worldBuilding: calculateCategoryScore([
                evaluation.metrics.worldBuilding.integration.score,
                evaluation.metrics.worldBuilding.consistency.score,
                evaluation.metrics.worldBuilding.mysteryGeneration.score,
            ]),
        };

        // 7. Calculate overall score (weighted average)
        const overallScore = calculateWeightedScore(categoryScores);

        // 8. Store evaluation in database
        const evaluationId = crypto.randomUUID();
        await db.insert(sceneEvaluations).values({
            id: evaluationId,
            sceneId: sceneId,
            evaluation: {
                ...evaluation,
                categoryScores,
                overallScore,
            },
            overallScore: overallScore.toString(),
            plotScore: categoryScores.plot.toString(),
            characterScore: categoryScores.character.toString(),
            pacingScore: categoryScores.pacing.toString(),
            proseScore: categoryScores.prose.toString(),
            worldBuildingScore: categoryScores.worldBuilding.toString(),
            modelVersion: "gpt-4o-mini",
            tokenUsage: result.usage?.totalTokens || null,
            evaluationTimeMs: evaluationTime,
        });

        // 9. Return evaluation result
        return NextResponse.json({
            evaluationId,
            sceneId,
            timestamp: new Date().toISOString(),
            evaluation: {
                ...evaluation,
                categoryScores,
                overallScore,
            },
            metadata: {
                modelVersion: "gpt-4o-mini",
                tokenUsage: result.usage?.totalTokens,
                evaluationTimeMs: evaluationTime,
            },
        });
    } catch (error) {
        console.error("Scene evaluation error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: "Evaluation failed", message: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * Helper function to calculate average score for a category
 */
function calculateCategoryScore(scores: number[]): number {
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;
    // Round to 2 decimal places
    return Math.round(average * 100) / 100;
}

/**
 * Helper function to calculate weighted overall score
 * Plot and Character are weighted more heavily (25% each)
 * Pacing, Prose, WorldBuilding are weighted equally (16.67% each)
 */
function calculateWeightedScore(categoryScores: {
    plot: number;
    character: number;
    pacing: number;
    prose: number;
    worldBuilding: number;
}): number {
    const weighted =
        categoryScores.plot * 0.25 +
        categoryScores.character * 0.25 +
        categoryScores.pacing * 0.167 +
        categoryScores.prose * 0.167 +
        categoryScores.worldBuilding * 0.166;

    // Round to 2 decimal places
    return Math.round(weighted * 100) / 100;
}
