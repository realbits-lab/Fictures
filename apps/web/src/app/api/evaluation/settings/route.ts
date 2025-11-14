/**
 * Settings Evaluation API
 * POST /api/evaluation/settings - Evaluate setting metrics
 */

import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import type {
    SettingEvaluationRequest,
    SettingEvaluationResponse,
    SettingEvaluationResult,
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
        const body: SettingEvaluationRequest = await request.json();

        const validation = validateRequiredFields(body, [
            "settingIds",
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

        const { settingIds, evaluationMode = "standard" } = body;

        const settingRecords = await db.query.settings.findMany({
            where: inArray(settings.id, settingIds),
        });

        if (settingRecords.length === 0) {
            return NextResponse.json(
                createErrorResponse("RESOURCE_NOT_FOUND", "No settings found"),
                { status: 404 },
            );
        }

        const results: SettingEvaluationResult[] = settingRecords.map(
            (setting) => evaluateSetting(setting),
        );

        const response: SettingEvaluationResponse = {
            evaluationId: generateEvaluationId("settings"),
            timestamp: getCurrentTimestamp(),
            evaluationMode,
            overallScore: calculateOverallScore(
                results.flatMap((r) => Object.values(r.metrics)),
            ),
            passed: results.every((r) => r.passed),
            results,
            overallPassed: results.every((r) => r.passed),
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Settings evaluation error:", error);
        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Failed to evaluate settings",
                error instanceof Error ? error.message : String(error),
            ),
            { status: 500 },
        );
    }
}

function evaluateSetting(
    setting: typeof settings.$inferSelect,
): SettingEvaluationResult {
    // Symbolic Meaning Clarity
    const moralThemeAlignment = (setting.symbolicMeaning || "").length >= 50;

    const symbolicMeaningClarity = {
        ...createMetricResult({
            score: moralThemeAlignment ? 4 : 2,
            target: 4,
            threshold: 3,
            feedback: "Symbolic Meaning Clarity",
            method: "ai-evaluation" as const,
        }),
        moralThemeAlignment,
    };

    // Sensory Detail Richness
    const sensesEngaged = detectSenses(setting.description || "");

    const sensoryDetailRichness = {
        ...createMetricResult({
            score:
                sensesEngaged.length >= 3
                    ? 4
                    : sensesEngaged.length >= 2
                      ? 3
                      : 2,
            target: 4,
            threshold: 3,
            feedback: "Sensory Detail Richness",
            method: "automated" as const,
        }),
        sensesEngaged,
        sensesCount: sensesEngaged.length,
    };

    // Cycle Amplification Design
    const phasesWithAmplification = 0; // TODO: Implement

    const cycleAmplificationDesign = {
        ...createMetricResult({
            score:
                phasesWithAmplification >= 3
                    ? 4
                    : phasesWithAmplification >= 2
                      ? 3
                      : 2,
            target: 4,
            threshold: 3,
            feedback: "Cycle Amplification Design",
            method: "ai-evaluation" as const,
        }),
        phasesWithAmplification,
    };

    const metrics = [
        symbolicMeaningClarity,
        sensoryDetailRichness,
        cycleAmplificationDesign,
    ];

    return {
        settingId: setting.id,
        settingName: setting.name,
        metrics: {
            symbolicMeaningClarity,
            sensoryDetailRichness,
            cycleAmplificationDesign,
        },
        overallScore: calculateOverallScore(metrics),
        passed: determinePassStatus(metrics),
    };
}

function detectSenses(text: string): string[] {
    const senseKeywords = {
        sight: ["see", "look", "color", "bright", "dark", "light", "shadow"],
        sound: ["hear", "sound", "noise", "quiet", "loud", "whisper", "echo"],
        smell: ["smell", "scent", "aroma", "odor", "fragrance", "stench"],
        touch: [
            "feel",
            "touch",
            "rough",
            "smooth",
            "soft",
            "hard",
            "warm",
            "cold",
        ],
        taste: ["taste", "flavor", "sweet", "bitter", "sour", "salty"],
    };

    const detected: string[] = [];
    const lowercaseText = text.toLowerCase();

    for (const [sense, keywords] of Object.entries(senseKeywords)) {
        if (keywords.some((keyword) => lowercaseText.includes(keyword))) {
            detected.push(sense);
        }
    }

    return detected;
}
