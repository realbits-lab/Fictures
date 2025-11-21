/**
 * Chapter Evaluation API
 * POST /api/evaluation/chapter - Evaluate chapter metrics
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type {
    ChapterEvaluationRequest,
    ChapterEvaluationResponse,
} from "@/lib/schemas/api/evaluation";
import { chapters } from "@/lib/schemas/database";
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

        const validation = validateRequiredFields(body as unknown as Record<string, unknown>, ["chapterId"]);
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

        // Fetch previous chapters for seed tracking and causal linking
        const allChapters = await db.query.chapters.findMany({
            where: eq(chapters.storyId, chapter.storyId),
            orderBy: (chapters, { asc }) => [asc(chapters.orderIndex)],
        });

        const previousChapters = allChapters.filter(
            (ch) => ch.orderIndex < chapter.orderIndex,
        );

        // 1. Single-Cycle Focus: Check if chapter contains ONE complete micro-cycle
        const singleCycleFocus = evaluateSingleCycleFocus(chapter);

        // 2. Seed Tracking Completeness: Check if seeds from previous chapters are resolved
        const seedTrackingCompleteness = evaluateSeedTracking(
            chapter,
            previousChapters,
        );

        // 3. Adversity Connection: Check causal link to previous chapter
        const adversityConnection = evaluateAdversityConnection(
            chapter,
            previousChapters,
        );

        // 4. Stakes Escalation: Check if severity/complexity increases
        const stakesEscalation = evaluateStakesEscalation(
            chapter,
            previousChapters,
        );

        // 5. Resolution-Adversity Transition: Check quality of transition
        const resolutionAdversityTransition =
            evaluateResolutionAdversityTransition(chapter);

        // 6. Narrative Momentum: Check forward movement
        const narrativeMomentum = evaluateNarrativeMomentum(chapter);

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

// ============================================================================
// CHAPTER EVALUATION HELPER FUNCTIONS
// ============================================================================

/**
 * 1. Single-Cycle Focus
 * Checks if chapter contains ONE complete micro-cycle with all required components
 */
function evaluateSingleCycleFocus(chapter: any) {
    const characterArc = chapter.characterArc;
    const focusCharacters = chapter.focusCharacters || [];

    // Check if all micro-cycle components are present
    const hasAdversity =
        characterArc?.microAdversity?.internal &&
        characterArc?.microAdversity?.external;
    const hasVirtue = !!characterArc?.microVirtue;
    const hasConsequence = !!characterArc?.microConsequence;
    const hasNewAdversity = !!characterArc?.microNewAdversity;

    const componentsPresent = [
        hasAdversity,
        hasVirtue,
        hasConsequence,
        hasNewAdversity,
    ].filter(Boolean).length;

    // Score: 4 = all components, 3 = 3 components, 2 = 2 components, 1 = 1 component
    const score = componentsPresent;
    const cycleCount = score === 4 ? 1 : 0; // Only count as complete cycle if all 4 present

    return {
        ...createMetricResult({
            score,
            target: 4,
            threshold: 3,
            feedback:
                score === 4
                    ? "Complete micro-cycle with all components"
                    : `Incomplete micro-cycle: missing ${4 - score} component(s)`,
            method: "automated" as const,
        }),
        cycleCount,
        focusedCharacters: focusCharacters.length,
    };
}

/**
 * 2. Seed Tracking Completeness
 * Checks if seeds planted in previous chapters are being resolved
 */
function evaluateSeedTracking(chapter: any, previousChapters: any[]) {
    // Collect all seeds planted in previous chapters
    const allPreviousSeeds = previousChapters.flatMap(
        (ch) => ch.seedsPlanted || [],
    );
    const totalPreviousSeeds = allPreviousSeeds.length;

    // Check how many of those seeds are resolved in this chapter
    const resolvedSeeds = chapter.seedsResolved || [];
    const previousSeedsTracked = resolvedSeeds.filter((resolved: any) =>
        allPreviousSeeds.some((seed: any) => seed.id === resolved.seedId),
    ).length;

    // Calculate tracking percentage
    const trackingPercentage =
        totalPreviousSeeds > 0
            ? Math.round((previousSeedsTracked / totalPreviousSeeds) * 100)
            : 100; // 100% if no seeds to track

    // Score based on percentage
    const score = trackingPercentage;

    return {
        ...createMetricResult({
            score,
            target: 80,
            threshold: 60,
            feedback:
                trackingPercentage >= 80
                    ? `Excellent seed tracking: ${trackingPercentage}%`
                    : trackingPercentage >= 60
                      ? `Good seed tracking: ${trackingPercentage}%`
                      : `Low seed tracking: ${trackingPercentage}%`,
            method: "automated" as const,
        }),
        previousSeedsTracked,
        totalPreviousSeeds,
        trackingPercentage,
    };
}

/**
 * 3. Adversity Connection
 * Checks if current adversity has causal link to previous chapter
 */
function evaluateAdversityConnection(chapter: any, previousChapters: any[]) {
    const connectsText = chapter.connectsToPreviousChapter || "";

    // Check if connection field is filled with meaningful content
    const hasContent = connectsText.length > 20;

    // Check for causal linking keywords
    const causalKeywords = [
        "because",
        "as a result",
        "this led to",
        "caused",
        "created",
        "from",
        "after",
    ];
    const hasCausalLanguage = causalKeywords.some((keyword) =>
        connectsText.toLowerCase().includes(keyword),
    );

    // Check if previous chapter is referenced
    const previousChapterReference =
        previousChapters.length > 0 &&
        (connectsText.toLowerCase().includes("previous") ||
            connectsText.toLowerCase().includes("last chapter") ||
            connectsText.toLowerCase().includes("earlier"));

    const causalLinkExists = hasContent && hasCausalLanguage;

    // Score: 4 = strong link with reference, 3 = causal link, 2 = weak link, 1 = no link
    const score = causalLinkExists
        ? previousChapterReference
            ? 4
            : 3
        : hasContent
          ? 2
          : 1;

    return {
        ...createMetricResult({
            score,
            target: 4,
            threshold: 3,
            feedback:
                score === 4
                    ? "Strong causal link to previous chapter"
                    : score === 3
                      ? "Causal link present"
                      : score === 2
                        ? "Weak connection"
                        : "No clear causal link",
            method: "automated" as const,
        }),
        causalLinkExists,
        previousChapterReference,
    };
}

/**
 * 4. Stakes Escalation
 * Checks if stakes/severity increase from previous chapters
 */
function evaluateStakesEscalation(chapter: any, previousChapters: any[]) {
    if (previousChapters.length === 0) {
        // First chapter - no comparison needed
        return {
            ...createMetricResult({
                score: 4,
                target: 4,
                threshold: 3,
                feedback: "First chapter - baseline stakes established",
                method: "automated" as const,
            }),
            severityIncrease: true,
            severityScore: 4,
        };
    }

    // Check for escalation keywords in current chapter
    const escalationKeywords = [
        "worse",
        "more dangerous",
        "greater",
        "escalate",
        "intensif",
        "higher stakes",
        "more at risk",
    ];
    const summary = (chapter.summary || "").toLowerCase();
    const adversityText = [
        chapter.characterArc?.microAdversity?.internal || "",
        chapter.characterArc?.microAdversity?.external || "",
    ]
        .join(" ")
        .toLowerCase();

    const hasEscalationLanguage = escalationKeywords.some(
        (keyword) =>
            summary.includes(keyword) || adversityText.includes(keyword),
    );

    // Score based on presence of escalation indicators
    const severityIncrease = hasEscalationLanguage;
    const severityScore = severityIncrease ? 4 : 2;

    return {
        ...createMetricResult({
            score: severityScore,
            target: 4,
            threshold: 3,
            feedback: severityIncrease
                ? "Stakes escalation detected"
                : "No clear stakes escalation",
            method: "automated" as const,
        }),
        severityIncrease,
        severityScore,
    };
}

/**
 * 5. Resolution-Adversity Transition
 * Checks quality of transition from resolution to next adversity
 */
function evaluateResolutionAdversityTransition(chapter: any) {
    const createsNextText = chapter.createsNextAdversity || "";

    // Check if field is filled
    const hasContent = createsNextText.length > 20;

    // Check for transition quality indicators
    const transitionKeywords = [
        "but",
        "however",
        "yet",
        "creates",
        "leads to",
        "causes",
        "unintended",
        "consequence",
    ];
    const hasTransitionLanguage = transitionKeywords.some((keyword) =>
        createsNextText.toLowerCase().includes(keyword),
    );

    // Check for specificity (mentions specific problem/conflict)
    const hasSpecificity = createsNextText.length > 50;

    // Score: 4 = excellent, 3 = good, 2 = acceptable, 1 = poor
    const transitionQuality = hasContent
        ? hasTransitionLanguage && hasSpecificity
            ? 4
            : hasTransitionLanguage
              ? 3
              : 2
        : 1;

    return {
        ...createMetricResult({
            score: transitionQuality,
            target: 3.0,
            threshold: 2.5,
            feedback:
                transitionQuality === 4
                    ? "Excellent transition to next adversity"
                    : transitionQuality === 3
                      ? "Good transition"
                      : transitionQuality === 2
                        ? "Acceptable transition"
                        : "Poor transition",
            method: "automated" as const,
        }),
        transitionQuality,
    };
}

/**
 * 6. Narrative Momentum
 * Checks if chapter maintains forward movement
 */
function evaluateNarrativeMomentum(chapter: any) {
    // Check for forward momentum indicators
    const characterArc = chapter.characterArc;
    const hasNewAdversity = !!characterArc?.microNewAdversity;
    const hasConsequence = !!characterArc?.microConsequence;
    const createsNext = (chapter.createsNextAdversity || "").length > 20;

    const momentumIndicators = [
        hasNewAdversity,
        hasConsequence,
        createsNext,
    ].filter(Boolean).length;

    // Score: 100% = all 3, 67% = 2, 33% = 1, 0% = none
    const score = Math.round((momentumIndicators / 3) * 100);
    const momentumRating = Math.round((momentumIndicators / 3) * 4);

    return {
        ...createMetricResult({
            score,
            target: 80,
            threshold: 60,
            feedback:
                score >= 80
                    ? "Strong narrative momentum"
                    : score >= 60
                      ? "Adequate momentum"
                      : "Weak momentum",
            method: "automated" as const,
        }),
        momentumRating,
    };
}
