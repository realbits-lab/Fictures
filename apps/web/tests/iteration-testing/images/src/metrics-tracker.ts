/**
 * Metrics Tracker for Image Iteration Testing
 *
 * Aggregates metrics across multiple image evaluations and identifies patterns.
 */

import type {
    AggregatedImageMetrics,
    FailurePattern,
    ImageEvaluation,
    ImageTestResult,
} from "./types";

export class ImageMetricsTracker {
    private results: ImageTestResult[] = [];

    addResult(result: ImageTestResult): void {
        this.results.push(result);
    }

    addResults(results: ImageTestResult[]): void {
        this.results.push(...results);
    }

    getAggregatedMetrics(version: string): AggregatedImageMetrics {
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
            this.results.filter((r) => r.metadata.totalTime < 20).length /
            totalTests;

        // Calculate category averages
        const categoryAverages = {
            generationQuality:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.generationQuality,
                    0,
                ) / totalTests,
            optimizationQuality:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.optimizationQuality,
                    0,
                ) / totalTests,
            visualQuality:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.visualQuality,
                    0,
                ) / totalTests,
            performance:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.performance,
                    0,
                ) / totalTests,
        };

        // Calculate generation quality metrics
        const averageAspectRatioAccuracy =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.aspectRatioAccuracy,
                0,
            ) / totalTests;
        const resolutionComplianceRate =
            evaluations.filter((e) => e.metrics.resolutionCompliance).length /
            totalTests;
        const averagePromptAdherence =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.promptAdherence,
                0,
            ) / totalTests;
        const formatComplianceRate =
            evaluations.filter((e) => e.metrics.formatValidation).length /
            totalTests;
        const averageFileSize =
            evaluations.reduce((sum, e) => sum + e.metrics.fileSize, 0) /
            totalTests;

        // Calculate optimization quality metrics
        const averageAvifCompressionRatio =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.avifCompressionRatio,
                0,
            ) / totalTests;
        const averageAvif1xSize =
            evaluations.reduce((sum, e) => sum + e.metrics.avif1xSize, 0) /
            totalTests;
        const averageAvif2xSize =
            evaluations.reduce((sum, e) => sum + e.metrics.avif2xSize, 0) /
            totalTests;
        const averageTotalVariantSize =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.totalVariantSize,
                0,
            ) / totalTests;
        const averageStorageRatio =
            evaluations.reduce((sum, e) => sum + e.metrics.storageRatio, 0) /
            totalTests;

        // Calculate visual quality metrics
        const averageVisualQualityScore =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.visualQualityScore,
                0,
            ) / totalTests;
        const averageArtifactCount =
            evaluations.reduce((sum, e) => sum + e.metrics.artifactCount, 0) /
            totalTests;
        const aspectRatioPreservationRate =
            evaluations.filter(
                (e) => e.metrics.aspectRatioPreservation < 0.5,
            ).length / totalTests;
        const variantCountComplianceRate =
            evaluations.filter((e) => e.metrics.variantCount === 2).length /
            totalTests;

        // Calculate performance metrics
        const averageGenerationTime =
            this.results.reduce(
                (sum, r) => sum + r.metadata.generationTime,
                0,
            ) / totalTests;
        const averageOptimizationTime =
            this.results.reduce(
                (sum, r) => sum + r.metadata.optimizationTime,
                0,
            ) / totalTests;
        const averageTotalTime =
            this.results.reduce((sum, r) => sum + r.metadata.totalTime, 0) /
            totalTests;
        const successRate =
            this.results.filter((r) => r.evaluation.metrics.success).length /
            totalTests;

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
            averageAspectRatioAccuracy,
            resolutionComplianceRate,
            averagePromptAdherence,
            formatComplianceRate,
            averageFileSize,
            averageAvifCompressionRatio,
            averageAvif1xSize,
            averageAvif2xSize,
            averageTotalVariantSize,
            averageStorageRatio,
            averageVisualQualityScore,
            averageArtifactCount,
            aspectRatioPreservationRate,
            variantCountComplianceRate,
            averageGenerationTime,
            averageOptimizationTime,
            averageTotalTime,
            successRate,
            failurePatterns,
        };
    }

    private identifyFailurePatterns(
        evaluations: ImageEvaluation[],
    ): FailurePattern[] {
        const patterns: FailurePattern[] = [];

        // Generation quality failures
        const lowPromptAdherence = evaluations.filter(
            (e) => e.metrics.promptAdherence < 85,
        );
        if (lowPromptAdherence.length > 0) {
            patterns.push({
                category: "generation",
                description: "Low prompt adherence (<85%)",
                frequency: lowPromptAdherence.length,
                averageScore:
                    lowPromptAdherence.reduce(
                        (sum, e) => sum + e.categoryScores.generationQuality,
                        0,
                    ) / lowPromptAdherence.length,
                priority:
                    lowPromptAdherence.length / evaluations.length > 0.3
                        ? "critical"
                        : "high",
                suggestedFix:
                    "Improve prompt clarity and specificity, add style guidance",
            });
        }

        // Optimization quality failures
        const lowCompression = evaluations.filter(
            (e) => e.metrics.avifCompressionRatio < 90,
        );
        if (lowCompression.length > 0) {
            patterns.push({
                category: "optimization",
                description: "Low AVIF compression ratio (<90%)",
                frequency: lowCompression.length,
                averageScore:
                    lowCompression.reduce(
                        (sum, e) => sum + e.categoryScores.optimizationQuality,
                        0,
                    ) / lowCompression.length,
                priority:
                    lowCompression.length / evaluations.length > 0.2
                        ? "high"
                        : "medium",
                suggestedFix:
                    "Review AVIF quality settings, optimize compression parameters",
            });
        }

        // Visual quality failures
        const highArtifacts = evaluations.filter(
            (e) => e.metrics.artifactCount > 2,
        );
        if (highArtifacts.length > 0) {
            patterns.push({
                category: "visual",
                description: "High artifact count (>2)",
                frequency: highArtifacts.length,
                averageScore:
                    highArtifacts.reduce(
                        (sum, e) => sum + e.categoryScores.visualQuality,
                        0,
                    ) / highArtifacts.length,
                priority:
                    highArtifacts.length / evaluations.length > 0.2
                        ? "high"
                        : "medium",
                suggestedFix:
                    "Adjust generation parameters, review model settings",
            });
        }

        // Performance failures
        const slowGeneration = evaluations.filter(
            (e) => e.metrics.generationTime > 15,
        );
        if (slowGeneration.length > 0) {
            patterns.push({
                category: "performance",
                description: "Slow generation time (>15s)",
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
                    "Optimize API calls, consider provider switching, review timeout settings",
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

