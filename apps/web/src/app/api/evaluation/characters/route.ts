/**
 * Characters Evaluation API
 * POST /api/evaluation/characters - Evaluate character metrics
 */

import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters } from "@/lib/schemas/database";
import type {
    CharacterEvaluationRequest,
    CharacterEvaluationResponse,
    CharacterEvaluationResult,
} from "@/lib/schemas/api/evaluation";
import {
    calculateOverallScore,
    createErrorResponse,
    createMetricResult,
    determinePassStatus,
    generateEvaluationId,
    getCurrentTimestamp,
    validateRequiredFields,
} from "../utils";

export async function POST(request: Request) {
    try {
        // 1. Parse request body
        const body: CharacterEvaluationRequest = await request.json();

        // 2. Validate required fields
        const validation = validateRequiredFields(body, [
            "characterIds",
            "storyId",
        ]);
        if (!validation.valid) {
            return NextResponse.json(
                createErrorResponse(
                    "INVALID_REQUEST",
                    `Missing required fields: ${validation.missingFields.join(", ")}`,
                ),
                { status: 400 },
            );
        }

        const { characterIds, evaluationMode = "standard" } = body;

        if (!Array.isArray(characterIds) || characterIds.length === 0) {
            return NextResponse.json(
                createErrorResponse(
                    "INVALID_REQUEST",
                    "characterIds must be a non-empty array",
                ),
                { status: 400 },
            );
        }

        // 3. Fetch characters from database
        const characterRecords = await db.query.characters.findMany({
            where: inArray(characters.id, characterIds),
        });

        if (characterRecords.length === 0) {
            return NextResponse.json(
                createErrorResponse(
                    "RESOURCE_NOT_FOUND",
                    "No characters found with provided IDs",
                ),
                { status: 404 },
            );
        }

        // 4. Evaluate each character
        const results: CharacterEvaluationResult[] = [];

        for (const character of characterRecords) {
            const characterResult = await evaluateCharacter(character);
            results.push(characterResult);
        }

        // 5. Calculate overall pass status
        const overallPassed = results.every((result) => result.passed);

        // 6. Construct response
        const response: CharacterEvaluationResponse = {
            evaluationId: generateEvaluationId("characters"),
            timestamp: getCurrentTimestamp(),
            evaluationMode,
            overallScore: calculateOverallScore(
                results.flatMap((r) => Object.values(r.metrics)),
            ),
            passed: overallPassed,
            results,
            overallPassed,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Characters evaluation error:", error);
        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Failed to evaluate characters",
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
 * Evaluate a single character
 */
async function evaluateCharacter(
    character: typeof characters.$inferSelect,
): Promise<CharacterEvaluationResult> {
    // Metric 1: Character Depth
    const internalFlawsCount = countInternalFlaws(character.internalFlaw || "");
    const moralTestPresent = false; // moralTest field doesn't exist in schema
    const backstoryLength = (character.backstory || "").length;

    const characterDepth = {
        ...createMetricResult({
            score: calculateCharacterDepthScore(
                internalFlawsCount,
                moralTestPresent,
                backstoryLength,
            ),
            target: 4,
            threshold: 3,
            feedback: "Character Depth",
            method: "automated" as const,
        }),
        details: {
            internalFlawsCount,
            moralTestPresent,
            backstoryLength,
        },
    };

    // Metric 2: Jeong System Implementation
    const relationshipsCount = countJeongRelationships(character);

    const jeongSystemImplementation = {
        ...createMetricResult({
            score:
                relationshipsCount >= 2 ? 4 : relationshipsCount >= 1 ? 3 : 1,
            target: 4,
            threshold: 3,
            feedback: "Jeong System Implementation",
            method: "automated" as const,
        }),
        relationshipsCount,
    };

    // Metric 3: Voice Distinctiveness
    const overlapPercentage = 0; // TODO: Implement voice analysis

    const voiceDistinctiveness = {
        ...createMetricResult({
            score: overlapPercentage < 30 ? 4 : overlapPercentage < 50 ? 3 : 2,
            target: 4,
            threshold: 3,
            feedback: "Voice Distinctiveness",
            method: "automated" as const,
        }),
        overlapPercentage,
    };

    // Calculate overall score
    const metrics = [
        characterDepth,
        jeongSystemImplementation,
        voiceDistinctiveness,
    ];
    const overallScore = calculateOverallScore(metrics);
    const passed = determinePassStatus(metrics);

    return {
        characterId: character.id,
        characterName: character.name,
        metrics: {
            characterDepth,
            jeongSystemImplementation,
            voiceDistinctiveness,
        },
        overallScore,
        passed,
    };
}

/**
 * Count internal flaws mentioned
 */
function countInternalFlaws(internalFlaw: string): number {
    if (!internalFlaw || internalFlaw.trim().length === 0) return 0;

    // Split by common delimiters
    const flaws = internalFlaw
        .split(/[,;]/)
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

    return Math.min(flaws.length, 3); // Cap at 3 for scoring
}

/**
 * Calculate character depth score
 */
function calculateCharacterDepthScore(
    flawsCount: number,
    hasMoralTest: boolean,
    backstoryLength: number,
): number {
    let score = 0;

    // Internal flaws (up to 2 points)
    if (flawsCount >= 1) score += 1;
    if (flawsCount >= 2) score += 1;

    // Moral test (1 point)
    if (hasMoralTest) score += 1;

    // Backstory (1 point)
    if (backstoryLength >= 200) score += 1;

    return score;
}

/**
 * Count Jeong relationships
 */
function countJeongRelationships(
    _character: typeof characters.$inferSelect,
): number {
    // TODO: Implement Jeong relationship counting from database
    // For now, return placeholder
    return 0;
}
