/**
 * Scene Evaluation Module
 *
 * Provides AI-powered qualitative evaluation of web novel scenes
 * based on "The Architectonics of Engagement" framework.
 *
 * @module evaluation
 */

export * from './schemas';
export * from './prompts';

// Re-export commonly used types
export type {
  EvaluationRequest,
  EvaluationResult,
  EvaluationContext,
  EvaluationMetrics,
  PerformanceLevel,
  ActionableFeedback,
  CategoryAnalysis,
} from './schemas';

export { buildEvaluationPrompt } from './prompts';
