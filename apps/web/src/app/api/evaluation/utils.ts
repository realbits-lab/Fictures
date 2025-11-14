/**
 * Shared utility functions for evaluation APIs
 */

import type {
    EvaluationError,
    MetricResult,
} from "@/lib/schemas/api/evaluation";
import { EVALUATION_ERROR_CODES } from "@/lib/schemas/api/evaluation";

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate overall score from metric results
 * Weighted average based on metric importance
 */
export function calculateOverallScore(metrics: MetricResult[]): number {
    if (metrics.length === 0) return 0;

    const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0);
    return Number((totalScore / metrics.length).toFixed(2));
}

/**
 * Determine pass/fail status based on thresholds
 * All metrics must pass their threshold
 */
export function determinePassStatus(metrics: MetricResult[]): boolean {
    return metrics.every((metric) => metric.passed);
}

/**
 * Calculate pass rate percentage
 */
export function calculatePassRate(passed: number, total: number): number {
    if (total === 0) return 0;
    return Number(((passed / total) * 100).toFixed(2));
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate recommendations from failed metrics
 */
export function generateRecommendations(metrics: MetricResult[]): string[] {
    const recommendations: string[] = [];

    for (const metric of metrics) {
        if (!metric.passed) {
            recommendations.push(
                `Improve ${metric.feedback} (current: ${metric.score}, target: ${metric.target})`,
            );
        }
    }

    return recommendations;
}

/**
 * Prioritize recommendations by score gap
 */
export function prioritizeRecommendations(
    metrics: MetricResult[],
): Array<{ metric: string; priority: "high" | "medium" | "low"; gap: number }> {
    const failedMetrics = metrics.filter((m) => !m.passed);

    return failedMetrics
        .map((metric) => ({
            metric: metric.feedback,
            gap: metric.target - metric.score,
            priority:
                metric.score < metric.threshold
                    ? ("high" as const)
                    : metric.score < metric.target * 0.9
                      ? ("medium" as const)
                      : ("low" as const),
        }))
        .sort((a, b) => b.gap - a.gap);
}

// ============================================================================
// Metric Evaluation
// ============================================================================

/**
 * Create a metric result with standard structure
 */
export function createMetricResult(params: {
    score: number;
    target: number;
    threshold: number;
    feedback: string;
    method: "automated" | "ai-evaluation";
    details?: Record<string, unknown>;
}): MetricResult {
    return {
        score: params.score,
        target: params.target,
        threshold: params.threshold,
        passed: params.score >= params.threshold,
        feedback: params.feedback,
        method: params.method,
        details: params.details,
    };
}

/**
 * Evaluate percentage-based metric
 */
export function evaluatePercentageMetric(params: {
    actualValue: number;
    totalValue: number;
    target: number;
    threshold: number;
    feedback: string;
    method?: "automated" | "ai-evaluation";
}): MetricResult {
    const percentage =
        params.totalValue > 0
            ? Number(
                  ((params.actualValue / params.totalValue) * 100).toFixed(2),
              )
            : 0;

    return createMetricResult({
        score: percentage,
        target: params.target,
        threshold: params.threshold,
        feedback: params.feedback,
        method: params.method || "automated",
    });
}

/**
 * Evaluate count-based metric
 */
export function evaluateCountMetric(params: {
    count: number;
    target: number;
    threshold: number;
    feedback: string;
    method?: "automated" | "ai-evaluation";
}): MetricResult {
    return createMetricResult({
        score: params.count,
        target: params.target,
        threshold: params.threshold,
        feedback: params.feedback,
        method: params.method || "automated",
    });
}

/**
 * Evaluate boolean-based metric
 */
export function evaluateBooleanMetric(params: {
    condition: boolean;
    feedback: string;
    method?: "automated" | "ai-evaluation";
}): MetricResult {
    const score = params.condition ? 100 : 0;

    return createMetricResult({
        score,
        target: 100,
        threshold: 100,
        feedback: params.feedback,
        method: params.method || "automated",
    });
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate unique evaluation ID
 */
export function generateEvaluationId(prefix = "eval"): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate batch ID
 */
export function generateBatchId(): string {
    return generateEvaluationId("batch");
}

// ============================================================================
// Timestamp Utilities
// ============================================================================

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Create standardized error response
 */
export function createErrorResponse(
    code: keyof typeof EVALUATION_ERROR_CODES,
    error: string,
    details?: unknown,
): EvaluationError {
    return {
        error,
        code: EVALUATION_ERROR_CODES[code],
        details,
        timestamp: getCurrentTimestamp(),
    };
}

/**
 * Check if error is evaluation error
 */
export function isEvaluationError(error: unknown): error is EvaluationError {
    return (
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        "code" in error &&
        "timestamp" in error
    );
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate evaluation mode
 */
export function validateEvaluationMode(
    mode: unknown,
): mode is "quick" | "standard" | "thorough" {
    return (
        typeof mode === "string" &&
        ["quick", "standard", "thorough"].includes(mode)
    );
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[],
): { valid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(
        (field) =>
            !(field in data) ||
            data[field] === undefined ||
            data[field] === null,
    );

    return {
        valid: missingFields.length === 0,
        missingFields,
    };
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Sanitize response data (remove null/undefined values)
 */
export function sanitizeResponse<T extends Record<string, unknown>>(
    data: T,
): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
            if (typeof value === "object" && !Array.isArray(value)) {
                sanitized[key] = sanitizeResponse(
                    value as Record<string, unknown>,
                );
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized as T;
}

/**
 * Extract metric names from metrics object
 */
export function extractMetricNames(
    metrics: Record<string, MetricResult>,
): string[] {
    return Object.keys(metrics);
}

/**
 * Filter metrics by names
 */
export function filterMetrics(
    metrics: Record<string, MetricResult>,
    metricNames?: string[],
): Record<string, MetricResult> {
    if (!metricNames || metricNames.length === 0) {
        return metrics;
    }

    const filtered: Record<string, MetricResult> = {};

    for (const name of metricNames) {
        if (name in metrics) {
            filtered[name] = metrics[name];
        }
    }

    return filtered;
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Calculate score trend
 */
export function calculateScoreTrend(
    currentScore: number,
    previousScore: number,
): {
    improving: boolean;
    scoreChange: number;
    percentChange: number;
} {
    const scoreChange = Number((currentScore - previousScore).toFixed(2));
    const percentChange =
        previousScore > 0
            ? Number(((scoreChange / previousScore) * 100).toFixed(2))
            : 0;

    return {
        improving: scoreChange > 0,
        scoreChange,
        percentChange,
    };
}

/**
 * Rank stories by score
 */
export function rankByScore<T extends { overallScore: number }>(
    items: T[],
): Array<T & { rank: number }> {
    const sorted = [...items].sort((a, b) => b.overallScore - a.overallScore);

    return sorted.map((item, index) => ({
        ...item,
        rank: index + 1,
    }));
}

// ============================================================================
// Word Count Utilities
// ============================================================================

/**
 * Count words in text
 */
export function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}

/**
 * Get word count range by cycle phase
 */
export function getWordCountRange(phase: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
        setup: { min: 300, max: 600 },
        transition: { min: 300, max: 600 },
        adversity: { min: 500, max: 800 },
        virtue: { min: 800, max: 1000 },
        consequence: { min: 600, max: 900 },
    };

    return ranges[phase] || { min: 300, max: 1000 };
}

/**
 * Check if word count is within range
 */
export function isWordCountInRange(
    wordCount: number,
    range: { min: number; max: number },
    tolerance = 0.1,
): boolean {
    const adjustedMin = range.min * (1 - tolerance);
    const adjustedMax = range.max * (1 + tolerance);

    return wordCount >= adjustedMin && wordCount <= adjustedMax;
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Group items by property
 */
export function groupBy<T>(
    items: T[],
    keyFn: (item: T) => string,
): Record<string, T[]> {
    return items.reduce(
        (acc, item) => {
            const key = keyFn(item);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        },
        {} as Record<string, T[]>,
    );
}

/**
 * Find unique values in array
 */
export function unique<T>(items: T[]): T[] {
    return [...new Set(items)];
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    return Number((sum / numbers.length).toFixed(2));
}
