/**
 * Chapter Evaluation API
 * POST /api/evaluation/chapter - Evaluate chapter metrics
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chapters } from "@/lib/db/schema";
import type {
    ChapterEvaluationRequest,
    ChapterEvaluationResponse,
} from "../types";
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
        const body: ChapterEvaluationRequest = await request.json();

        const validation = validateRequiredFields(body, ["chapterId"]);
        if (!validation.valid) {
            return NextResponse.json(
                createErrorResponse(
                    "INVALID_REQUEST",
                    `Missing required fields: ${validation.missingFields.join(", ")}`,
                ),
                { status: 400 },
            );
        }

        const { chapterId, evaluationMode = "standard" } = body;

        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });

        if (!chapter) {
            return NextResponse.json(
                createErrorResponse(
                    "RESOURCE_NOT_FOUND",
                    `Chapter with ID ${chapterId} not found`,
                ),
                { status: 404 },
            );
        }

        // Evaluate metrics (placeholder implementations)
        const singleCycleFocus = {
            ...createMetricResult({
                score: 4,
                target: 4,
                threshold: 3,
                feedback: "Single-Cycle Focus",
                method: "ai-evaluation" as const,
            }),
            cycleCount: 1,
            focusedCharacters: 2,
        };

        const seedTrackingCompleteness = {
            ...createMetricResult({
                score: 80,
                target: 80,
                threshold: 60,
                feedback: "Seed Tracking Completeness",
                method: "automated" as const,
            }),
            previousSeedsTracked: 0,
            totalPreviousSeeds: 0,
            trackingPercentage: 0,
        };

        const adversityConnection = {
            ...createMetricResult({
                score: 4,
                target: 4,
                threshold: 3,
                feedback: "Adversity Connection",
                method: "ai-evaluation" as const,
            }),
            causalLinkExists: true,
            previousChapterReference: true,
        };

        const stakesEscalation = {
            ...createMetricResult({
                score: 4,
                target: 4,
                threshold: 3,
                feedback: "Stakes Escalation",
                method: "ai-evaluation" as const,
            }),
            severityIncrease: true,
            severityScore: 4,
        };

        const resolutionAdversityTransition = {
            ...createMetricResult({
                score: 3.5,
                target: 3.0,
                threshold: 2.5,
                feedback: "Resolution-Adversity Transition",
                method: "ai-evaluation" as const,
            }),
            transitionQuality: 3.5,
        };

        const narrativeMomentum = {
            ...createMetricResult({
                score: 80,
                target: 80,
                threshold: 60,
                feedback: "Narrative Momentum",
                method: "ai-evaluation" as const,
            }),
            momentumRating: 4,
        };

        const metrics = [
            singleCycleFocus,
            seedTrackingCompleteness,
            adversityConnection,
            stakesEscalation,
            resolutionAdversityTransition,
            narrativeMomentum,
        ];

        const response: ChapterEvaluationResponse = {
            evaluationId: generateEvaluationId("chapter"),
            chapterId,
            timestamp: getCurrentTimestamp(),
            evaluationMode,
            overallScore: calculateOverallScore(metrics),
            passed: determinePassStatus(metrics),
            metrics: {
                singleCycleFocus,
                seedTrackingCompleteness,
                adversityConnection,
                stakesEscalation,
                resolutionAdversityTransition,
                narrativeMomentum,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Chapter evaluation error:", error);
        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Failed to evaluate chapter",
                error instanceof Error ? error.message : String(error),
            ),
            { status: 500 },
        );
    }
}
