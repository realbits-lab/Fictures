/**
 * Metrics Tracker for Comics Iteration Testing
 *
 * Aggregates metrics across multiple comic evaluations and identifies patterns.
 */

import type {
    AggregatedComicMetrics,
    ComicEvaluation,
    ComicTestResult,
    FailurePattern,
} from "./types";

export class ComicMetricsTracker {
    private results: ComicTestResult[] = [];

    addResult(result: ComicTestResult): void {
        this.results.push(result);
    }

    addResults(results: ComicTestResult[]): void {
        this.results.push(...results);
    }

    getAggregatedMetrics(version: string): AggregatedComicMetrics {
        if (this.results.length === 0) {
            throw new Error("No results to aggregate");
        }

        const totalTests = this.results.length;
        const evaluations = this.results.map((r) => r.evaluation);

        // Calculate core quality metrics
        const weightedScores = evaluations.map((e) => e.weightedScore);
        const averageWeightedScore =
            weightedScores.reduce((a, b) => a + b, 0) / totalTests;
        const passRate =
            evaluations.filter((e) => e.passes).length / totalTests;
        const firstPassSuccessRate =
            this.results.filter((r) => r.metadata.totalTime < 180).length /
            totalTests;

        // Calculate category averages
        const categoryAverages = {
            panelQuality:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.panelQuality,
                    0,
                ) / totalTests,
            narrativeCoherence:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.narrativeCoherence,
                    0,
                ) / totalTests,
            technicalQuality:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.technicalQuality,
                    0,
                ) / totalTests,
            performance:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.performance,
                    0,
                ) / totalTests,
        };

        // Calculate panel quality metrics
        const averageVisualClarity =
            evaluations.reduce((sum, e) => sum + e.metrics.visualClarity, 0) /
            totalTests;
        const averageCompositionQuality =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.compositionQuality,
                0,
            ) / totalTests;
        const averageCharacterAccuracy =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.characterAccuracy,
                0,
            ) / totalTests;
        const averageExpressionAccuracy =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.expressionAccuracy,
                0,
            ) / totalTests;

        // Calculate narrative coherence metrics
        const averageStoryFlow =
            evaluations.reduce((sum, e) => sum + e.metrics.storyFlow, 0) /
            totalTests;
        const averagePanelSequenceLogic =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.panelSequenceLogic,
                0,
            ) / totalTests;
        const averageNarrativeConsistency =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.narrativeConsistency,
                0,
            ) / totalTests;

        // Calculate technical quality metrics
        const formatComplianceRate =
            evaluations.filter((e) => e.metrics.formatCompliance).length /
            totalTests;
        const averageAspectRatioAccuracy =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.aspectRatioAccuracy,
                0,
            ) / totalTests;
        const averageOptimizationQuality =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.optimizationQuality,
                0,
            ) / totalTests;
        const variantCountComplianceRate =
            evaluations.filter((e) => e.metrics.variantCount === 2).length /
            totalTests;

        // Calculate performance metrics
        const averagePanelGenerationTime =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.averagePanelGenerationTime,
                0,
            ) / totalTests;
        const averageTotalGenerationTime =
            this.results.reduce((sum, r) => sum + r.metadata.totalTime, 0) /
            totalTests;
        const successRate =
            this.results.filter((r) => r.evaluation.metrics.success).length /
            totalTests;
        const averagePanelSuccessRate =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.panelSuccessRate,
                0,
            ) / totalTests;

        // Identify failure patterns
        const failurePatterns = this.identifyFailurePatterns(evaluations);

        return {
            version,
            totalTests,
            testDate: new Date().toISOString(),
            averageWeightedScore,
            passRate,
            firstPassSuccessRate,
            categoryAverages,
            averageVisualClarity,
            averageCompositionQuality,
            averageCharacterAccuracy,
            averageExpressionAccuracy,
            averageStoryFlow,
            averagePanelSequenceLogic,
            averageNarrativeConsistency,
            formatComplianceRate,
            averageAspectRatioAccuracy,
            averageOptimizationQuality,
            variantCountComplianceRate,
            averagePanelGenerationTime,
            averageTotalGenerationTime,
            successRate,
            averagePanelSuccessRate,
            failurePatterns,
        };
    }

    private identifyFailurePatterns(
        evaluations: ComicEvaluation[],
    ): FailurePattern[] {
        const patterns: FailurePattern[] = [];

        // Panel quality failures
        const lowVisualClarity = evaluations.filter(
            (e) => e.metrics.visualClarity < 3.0,
        );
        if (lowVisualClarity.length > 0) {
            patterns.push({
                category: "panel-quality",
                description: "Low visual clarity (<3.0)",
                frequency: lowVisualClarity.length,
                averageScore:
                    lowVisualClarity.reduce(
                        (sum, e) => sum + e.categoryScores.panelQuality,
                        0,
                    ) / lowVisualClarity.length,
                priority:
                    lowVisualClarity.length / evaluations.length > 0.3
                        ? "critical"
                        : "high",
                suggestedFix:
                    "Improve prompt specificity, add composition guidance",
            });
        }

        // Narrative coherence failures
        const poorStoryFlow = evaluations.filter(
            (e) => e.metrics.storyFlow < 3.0,
        );
        if (poorStoryFlow.length > 0) {
            patterns.push({
                category: "narrative",
                description: "Poor story flow (<3.0)",
                frequency: poorStoryFlow.length,
                averageScore:
                    poorStoryFlow.reduce(
                        (sum, e) => sum + e.categoryScores.narrativeCoherence,
                        0,
                    ) / poorStoryFlow.length,
                priority:
                    poorStoryFlow.length / evaluations.length > 0.3
                        ? "high"
                        : "medium",
                suggestedFix:
                    "Review panel sequence logic, improve toonplay-to-panel mapping",
            });
        }

        // Technical quality failures
        const formatIssues = evaluations.filter(
            (e) => !e.metrics.formatCompliance,
        );
        if (formatIssues.length > 0) {
            patterns.push({
                category: "technical",
                description: "Format compliance failures",
                frequency: formatIssues.length,
                averageScore:
                    formatIssues.reduce(
                        (sum, e) => sum + e.categoryScores.technicalQuality,
                        0,
                    ) / formatIssues.length,
                priority: "critical",
                suggestedFix:
                    "Fix format validation, review image generation pipeline",
            });
        }

        // Performance failures
        const slowGeneration = evaluations.filter(
            (e) => e.metrics.averagePanelGenerationTime > 15,
        );
        if (slowGeneration.length > 0) {
            patterns.push({
                category: "performance",
                description: "Slow panel generation (>15s/panel)",
                frequency: slowGeneration.length,
                averageScore:
                    slowGeneration.reduce(
                        (sum, e) => sum + e.categoryScores.performance,
                        0,
                    ) / slowGeneration.length,
                priority:
                    slowGeneration.length / evaluations.length > 0.3
                        ? "high"
                        : "medium",
                suggestedFix:
                    "Optimize API calls, consider batch processing, review timeout settings",
            });
        }

        return patterns.sort((a, b) => {
            const priorityOrder = {
                critical: 0,
                high: 1,
                medium: 2,
                low: 3,
            };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
}
