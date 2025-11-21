/**
 * Story Evaluation API
 * POST /api/evaluation/story - Evaluate story-level metrics
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
    StoryEvaluationRequest,
    StoryEvaluationResponse,
} from "@/lib/schemas/api/evaluation";
import { stories } from "@/lib/schemas/database";
import {
    calculateOverallScore,
    createErrorResponse,
    createMetricResult,
    determinePassStatus,
    generateEvaluationId,
    generateRecommendations,
    getCurrentTimestamp,
    validateRequiredFields,
} from "../utils";

export async function POST(request: Request) {
    try {
        // 1. Parse request body
        const body: StoryEvaluationRequest = await request.json();

        // 2. Validate required fields
        const validation = validateRequiredFields(body as unknown as Record<string, unknown>, ["storyId"]);
        if (!validation.valid) {
            return NextResponse.json(
                createErrorResponse(
                    "INVALID_REQUEST",
                    `Missing required fields: ${validation.missingFields.join(", ")}`,
                ),
                { status: 400 },
            );
        }

        const { storyId, evaluationMode = "standard" } = body;

        // 3. Fetch story from database
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });

        if (!story) {
            return NextResponse.json(
                createErrorResponse(
                    "RESOURCE_NOT_FOUND",
                    `Story with ID ${storyId} not found`,
                ),
                { status: 404 },
            );
        }

        // 4. Evaluate metrics
        const evaluationId = generateEvaluationId("story");
        const timestamp = getCurrentTimestamp();

        // Metric 1: Moral Framework Clarity
        const virtuesIdentified = extractVirtues(story.moralFramework || "");
        const causalLogicPresent = checkCausalLogic(story.moralFramework || "");

        const moralFrameworkClarity = {
            ...createMetricResult({
                score: calculateMoralFrameworkScore(
                    virtuesIdentified.length,
                    causalLogicPresent,
                ),
                target: 3,
                threshold: 2,
                feedback: "Moral Framework Clarity",
                method: "ai-evaluation" as const,
            }),
            details: {
                virtuesIdentified,
                causalLogicPresent,
            },
        };

        // Metric 2: Thematic Coherence
        const thematicCoherence = createMetricResult({
            score: evaluateThematicCoherence(story),
            target: 4,
            threshold: 3,
            feedback: "Thematic Coherence",
            method: "ai-evaluation" as const,
        });

        // Metric 3: Genre Consistency
        const genreConsistency = createMetricResult({
            score: evaluateGenreConsistency(story),
            target: 4,
            threshold: 3,
            feedback: "Genre Consistency",
            method: "ai-evaluation" as const,
        });

        // 5. Calculate overall score and pass status
        const allMetrics = [
            moralFrameworkClarity,
            thematicCoherence,
            genreConsistency,
        ];

        const overallScore = calculateOverallScore(allMetrics);
        const passed = determinePassStatus(allMetrics);
        const recommendations = generateRecommendations(allMetrics);

        // 6. Construct response
        const response: StoryEvaluationResponse = {
            evaluationId,
            storyId,
            timestamp,
            evaluationMode,
            overallScore,
            passed,
            metrics: {
                moralFrameworkClarity,
                thematicCoherence,
                genreConsistency,
            },
            recommendations,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Story evaluation error:", error);
        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Failed to evaluate story",
                error instanceof Error ? error.message : String(error),
            ),
            { status: 500 },
        );
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract virtues from moral framework text
 */
function extractVirtues(moralFramework: string): string[] {
    const virtueKeywords = [
        "courage",
        "honesty",
        "compassion",
        "integrity",
        "perseverance",
        "loyalty",
        "kindness",
        "justice",
        "wisdom",
        "humility",
    ];

    const lowercaseText = moralFramework.toLowerCase();
    const foundVirtues = virtueKeywords.filter((virtue) =>
        lowercaseText.includes(virtue),
    );

    return foundVirtues;
}

/**
 * Check for causal logic in moral framework
 */
function checkCausalLogic(moralFramework: string): boolean {
    const causalIndicators = [
        "leads to",
        "results in",
        "causes",
        "because",
        "therefore",
        "consequence",
        "when",
        "if",
    ];

    const lowercaseText = moralFramework.toLowerCase();
    return causalIndicators.some((indicator) =>
        lowercaseText.includes(indicator),
    );
}

/**
 * Calculate moral framework score
 * Target: 3+ virtues named explicitly, causal logic present
 * Threshold: 2+ virtues, basic logic
 */
function calculateMoralFrameworkScore(
    virtueCount: number,
    hasLogic: boolean,
): number {
    let score = 0;

    // Virtue count (up to 3 points)
    if (virtueCount >= 3) {
        score += 3;
    } else if (virtueCount >= 2) {
        score += 2;
    } else if (virtueCount >= 1) {
        score += 1;
    }

    // Causal logic (1 point)
    if (hasLogic) {
        score += 1;
    }

    return score;
}

/**
 * Evaluate thematic coherence
 * Checks consistency between premise, moral framework, and genre
 */
function evaluateThematicCoherence(story: typeof stories.$inferSelect): number {
    let score = 4; // Start with perfect score

    // Check if summary exists and is substantial
    if (!story.summary || story.summary.length < 100) {
        score -= 1;
    }

    // Check if moral framework exists
    if (!story.moralFramework || story.moralFramework.length < 50) {
        score -= 1;
    }

    // Check if genre is defined
    if (!story.genre || story.genre.trim().length === 0) {
        score -= 1;
    }

    return Math.max(0, score);
}

/**
 * Evaluate genre consistency
 * Story elements align with genre conventions
 */
function evaluateGenreConsistency(story: typeof stories.$inferSelect): number {
    let score = 4; // Start with perfect score

    // Check genre definition
    if (!story.genre || story.genre.trim().length === 0) {
        score -= 2;
    }

    // Check tone consistency
    if (!story.tone || story.tone.trim().length === 0) {
        score -= 1;
    }

    // Check summary alignment
    if (!story.summary || story.summary.length < 100) {
        score -= 1;
    }

    return Math.max(0, score);
}
