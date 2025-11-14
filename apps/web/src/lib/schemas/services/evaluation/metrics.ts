import { z } from "zod";

/**
 * Performance level enum matching the evaluation framework
 * Scale: Nascent (1) → Developing (2) → Effective (3) → Exemplary (4)
 */
export const performanceLevelEnum = z.enum([
    "Nascent",
    "Developing",
    "Effective",
    "Exemplary",
]);

export type PerformanceLevel = z.infer<typeof performanceLevelEnum>;

/**
 * Metric score schema (1-4 scale)
 */
export const metricScoreSchema = z.object({
    score: z.number().min(1).max(4),
    level: performanceLevelEnum,
    evidence: z.string().optional(),
});

export type MetricScore = z.infer<typeof metricScoreSchema>;

/**
 * Plot metrics schema
 */
export const plotMetricsSchema = z.object({
    hookEffectiveness: metricScoreSchema,
    goalClarity: metricScoreSchema,
    conflictEngagement: metricScoreSchema,
    cliffhangerTransition: metricScoreSchema,
});

export type PlotMetrics = z.infer<typeof plotMetricsSchema>;

/**
 * Character metrics schema
 */
export const characterMetricsSchema = z.object({
    agency: metricScoreSchema,
    voiceDistinction: metricScoreSchema,
    emotionalDepth: metricScoreSchema,
    relationshipDynamics: metricScoreSchema,
});

export type CharacterMetrics = z.infer<typeof characterMetricsSchema>;

/**
 * Pacing metrics schema
 */
export const pacingMetricsSchema = z.object({
    microPacing: metricScoreSchema,
    tensionManagement: metricScoreSchema,
    sceneEconomy: metricScoreSchema,
});

export type PacingMetrics = z.infer<typeof pacingMetricsSchema>;

/**
 * Prose metrics schema
 */
export const proseMetricsSchema = z.object({
    clarity: metricScoreSchema,
    showDontTell: metricScoreSchema,
    voiceConsistency: metricScoreSchema,
    technicalQuality: metricScoreSchema,
});

export type ProseMetrics = z.infer<typeof proseMetricsSchema>;

/**
 * World-building metrics schema
 */
export const worldBuildingMetricsSchema = z.object({
    integration: metricScoreSchema,
    consistency: metricScoreSchema,
    mysteryGeneration: metricScoreSchema,
});

export type WorldBuildingMetrics = z.infer<typeof worldBuildingMetricsSchema>;

/**
 * Full metrics schema
 */
export const evaluationMetricsSchema = z.object({
    plot: plotMetricsSchema,
    character: characterMetricsSchema,
    pacing: pacingMetricsSchema,
    prose: proseMetricsSchema,
    worldBuilding: worldBuildingMetricsSchema,
});

export type EvaluationMetrics = z.infer<typeof evaluationMetricsSchema>;
