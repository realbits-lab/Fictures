import { z } from 'zod';

// Performance level enum matching the evaluation framework
export const performanceLevelEnum = z.enum(['Nascent', 'Developing', 'Effective', 'Exemplary']);

// Metric score schema (1-4 scale)
export const metricScoreSchema = z.object({
  score: z.number().min(1).max(4),
  level: performanceLevelEnum,
  evidence: z.string().optional(),
});

// Plot metrics schema
export const plotMetricsSchema = z.object({
  hookEffectiveness: metricScoreSchema,
  goalClarity: metricScoreSchema,
  conflictEngagement: metricScoreSchema,
  cliffhangerTransition: metricScoreSchema,
});

// Character metrics schema
export const characterMetricsSchema = z.object({
  agency: metricScoreSchema,
  voiceDistinction: metricScoreSchema,
  emotionalDepth: metricScoreSchema,
  relationshipDynamics: metricScoreSchema,
});

// Pacing metrics schema
export const pacingMetricsSchema = z.object({
  microPacing: metricScoreSchema,
  tensionManagement: metricScoreSchema,
  sceneEconomy: metricScoreSchema,
});

// Prose metrics schema
export const proseMetricsSchema = z.object({
  clarity: metricScoreSchema,
  showDontTell: metricScoreSchema,
  voiceConsistency: metricScoreSchema,
  technicalQuality: metricScoreSchema,
});

// World-building metrics schema
export const worldBuildingMetricsSchema = z.object({
  integration: metricScoreSchema,
  consistency: metricScoreSchema,
  mysteryGeneration: metricScoreSchema,
});

// Full metrics schema
export const evaluationMetricsSchema = z.object({
  plot: plotMetricsSchema,
  character: characterMetricsSchema,
  pacing: pacingMetricsSchema,
  prose: proseMetricsSchema,
  worldBuilding: worldBuildingMetricsSchema,
});

// Analysis point schema
export const analysisPointSchema = z.object({
  point: z.string(),
  evidence: z.string(),
});

// Category analysis schema
export const categoryAnalysisSchema = z.object({
  strengths: z.array(analysisPointSchema),
  improvements: z.array(analysisPointSchema),
});

// Actionable feedback schema (Diagnose & Suggest model)
export const actionableFeedbackSchema = z.object({
  category: z.string(),
  diagnosis: z.string(),
  suggestion: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

// Summary schema
export const evaluationSummarySchema = z.object({
  plotEvents: z.string(),
  characterMoments: z.string(),
  keyStrengths: z.array(z.string()),
  keyImprovements: z.array(z.string()),
});

// Complete evaluation result schema
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

// Input context schema
export const evaluationContextSchema = z.object({
  storyGenre: z.string().optional(),
  arcPosition: z.enum(['beginning', 'middle', 'end']).optional(),
  chapterNumber: z.number().optional(),
  previousSceneSummary: z.string().optional(),
  characterContext: z.array(z.string()).optional(),
}).optional();

// Input request schema
export const evaluationRequestSchema = z.object({
  sceneId: z.string(),
  content: z.string().min(1),
  context: evaluationContextSchema,
  evaluationScope: z.array(z.enum(['plot', 'character', 'pacing', 'prose', 'worldbuilding'])).optional(),
  options: z.object({
    detailedFeedback: z.boolean().default(true),
    includeExamples: z.boolean().default(true),
  }).optional(),
});

// TypeScript types derived from schemas
export type PerformanceLevel = z.infer<typeof performanceLevelEnum>;
export type MetricScore = z.infer<typeof metricScoreSchema>;
export type PlotMetrics = z.infer<typeof plotMetricsSchema>;
export type CharacterMetrics = z.infer<typeof characterMetricsSchema>;
export type PacingMetrics = z.infer<typeof pacingMetricsSchema>;
export type ProseMetrics = z.infer<typeof proseMetricsSchema>;
export type WorldBuildingMetrics = z.infer<typeof worldBuildingMetricsSchema>;
export type EvaluationMetrics = z.infer<typeof evaluationMetricsSchema>;
export type AnalysisPoint = z.infer<typeof analysisPointSchema>;
export type CategoryAnalysis = z.infer<typeof categoryAnalysisSchema>;
export type ActionableFeedback = z.infer<typeof actionableFeedbackSchema>;
export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationContext = z.infer<typeof evaluationContextSchema>;
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
