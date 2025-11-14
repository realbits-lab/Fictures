import { z } from "zod";
import { evaluationMetricsSchema } from "./metrics";

/**
 * Analysis point schema
 */
export const analysisPointSchema = z.object({
    point: z.string(),
    evidence: z.string(),
});

export type AnalysisPoint = z.infer<typeof analysisPointSchema>;

/**
 * Category analysis schema
 */
export const categoryAnalysisSchema = z.object({
    strengths: z.array(analysisPointSchema),
    improvements: z.array(analysisPointSchema),
});

export type CategoryAnalysis = z.infer<typeof categoryAnalysisSchema>;

/**
 * Actionable feedback schema (Diagnose & Suggest model)
 */
export const actionableFeedbackSchema = z.object({
    category: z.string(),
    diagnosis: z.string(),
    suggestion: z.string(),
    priority: z.enum(["high", "medium", "low"]),
});

export type ActionableFeedback = z.infer<typeof actionableFeedbackSchema>;

/**
 * Summary schema
 */
export const evaluationSummarySchema = z.object({
    plotEvents: z.string(),
    characterMoments: z.string(),
    keyStrengths: z.array(z.string()),
    keyImprovements: z.array(z.string()),
});

export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>;

/**
 * Complete evaluation result schema
 */
export const evaluationResultSchema = z.object({
    summary: evaluationSummarySchema,
    metrics: evaluationMetricsSchema,
    analysis: z.object({
        plot: categoryAnalysisSchema,
        character: categoryAnalysisSchema,
        pacing: categoryAnalysisSchema,
        prose: categoryAnalysisSchema,
        worldBuilding: categoryAnalysisSchema,
    }),
    actionableFeedback: z.array(actionableFeedbackSchema),
    overallScore: z.number().min(1).max(4),
    categoryScores: z.object({
        plot: z.number().min(1).max(4),
        character: z.number().min(1).max(4),
        pacing: z.number().min(1).max(4),
        prose: z.number().min(1).max(4),
        worldBuilding: z.number().min(1).max(4),
    }),
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
