/**
 * Metrics Tracker for Toonplay Iteration Testing
 *
 * Aggregates metrics across multiple toonplay evaluations and identifies patterns.
 */

import type {
    AggregatedToonplayMetrics,
    FailurePattern,
    ToonplayEvaluation,
    ToonplayTestResult,
} from "./types";

export class ToonplayMetricsTracker {
    private results: ToonplayTestResult[] = [];

    addResult(result: ToonplayTestResult): void {
        this.results.push(result);
    }

    addResults(results: ToonplayTestResult[]): void {
        this.results.push(...results);
    }

    getAggregatedMetrics(version: string): AggregatedToonplayMetrics {
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
            this.results.filter((r) => r.metadata.iterations === 0).length /
            totalTests;

        // Calculate category averages
        const categoryAverages = {
            narrativeFidelity:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.narrativeFidelity,
                    0,
                ) / totalTests,
            visualTransformation:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.visualTransformation,
                    0,
                ) / totalTests,
            webtoonPacing:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.webtoonPacing,
                    0,
                ) / totalTests,
            scriptFormatting:
                evaluations.reduce(
                    (sum, e) => sum + e.categoryScores.scriptFormatting,
                    0,
                ) / totalTests,
        };

        // Calculate content proportions
        const averageNarrationPercentage =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.narrationPercentage,
                0,
            ) / totalTests;
        const averageInternalMonologuePercentage =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.internalMonologuePercentage,
                0,
            ) / totalTests;
        const averageDialoguePresence =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.dialoguePresence,
                0,
            ) / totalTests;

        // Calculate compliance rates
        const narrationComplianceRate =
            evaluations.filter((e) => e.metrics.narrationPercentage < 5)
                .length / totalTests;
        const internalMonologueComplianceRate =
            evaluations.filter(
                (e) => e.metrics.internalMonologuePercentage < 10,
            ).length / totalTests;
        const dialogueTargetRate =
            evaluations.filter(
                (e) =>
                    e.metrics.dialoguePresence >= 60 &&
                    e.metrics.dialoguePresence <= 80,
            ).length / totalTests;

        // Calculate shot variety
        const averageShotVariety =
            evaluations.reduce((sum, e) => sum + e.metrics.shotVariety, 0) /
            totalTests;

        // Aggregate shot type distribution
        const shotTypeDistributionAggregate: Record<string, number> = {};
        for (const evaluation of evaluations) {
            for (const [shotType, count] of Object.entries(
                evaluation.metrics.shotTypeDistribution,
            )) {
                shotTypeDistributionAggregate[shotType] =
                    (shotTypeDistributionAggregate[shotType] || 0) + count;
            }
        }

        // Calculate panel quality
        const averagePanelCount =
            evaluations.reduce((sum, e) => sum + e.metrics.panelCount, 0) /
            totalTests;
        const averageDescriptionLength =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.averageDescriptionLength,
                0,
            ) / totalTests;
        const descriptionComplianceRate =
            evaluations.filter((e) => e.metrics.descriptionLengthCompliance)
                .length / totalTests;

        // Calculate dialogue quality
        const averageDialoguePerPanel =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.averageDialoguePerPanel,
                0,
            ) / totalTests;
        const dialogueLengthComplianceRate =
            evaluations.filter((e) => e.metrics.dialogueLengthCompliance)
                .length / totalTests;

        // Calculate webtoon optimization
        const averageVerticalFlowQuality =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.verticalFlowQuality,
                0,
            ) / totalTests;
        const averagePanelPacingRhythm =
            evaluations.reduce(
                (sum, e) => sum + e.metrics.panelPacingRhythm,
                0,
            ) / totalTests;

        // Calculate generation performance
        const averageGenerationTime =
            this.results.reduce(
                (sum, r) => sum + r.metadata.generationTime,
                0,
            ) / totalTests;
        const averageIterations =
            this.results.reduce((sum, r) => sum + r.metadata.iterations, 0) /
            totalTests;
        const averageTotalTime =
            this.results.reduce((sum, r) => sum + r.metadata.totalTime, 0) /
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
            averageNarrationPercentage,
            averageInternalMonologuePercentage,
            averageDialoguePresence,
            narrationComplianceRate,
            internalMonologueComplianceRate,
            dialogueTargetRate,
            averageShotVariety,
            shotTypeDistributionAggregate,
            averagePanelCount,
            averageDescriptionLength,
            descriptionComplianceRate,
            averageDialoguePerPanel,
            dialogueLengthComplianceRate,
            averageVerticalFlowQuality,
            averagePanelPacingRhythm,
            averageGenerationTime,
            averageIterations,
            averageTotalTime,
            failurePatterns,
        };
    }

    private identifyFailurePatterns(
        evaluations: ToonplayEvaluation[],
    ): FailurePattern[] {
        const patterns: FailurePattern[] = [];
        const totalTests = evaluations.length;

        // Pattern 1: Excessive Narration
        const excessiveNarration = evaluations.filter(
            (e) => e.metrics.narrationPercentage >= 5,
        );
        if (excessiveNarration.length > 0) {
            const avgNarration =
                excessiveNarration.reduce(
                    (sum, e) => sum + e.metrics.narrationPercentage,
                    0,
                ) / excessiveNarration.length;
            patterns.push({
                category: "proportion",
                description: `Excessive narration (≥5%): ${avgNarration.toFixed(1)}% average`,
                frequency: excessiveNarration.length,
                averageScore: avgNarration,
                priority:
                    excessiveNarration.length / totalTests > 0.5
                        ? "critical"
                        : "high",
                suggestedFix:
                    'Add "show, don\'t tell" rules to prompt. Transform internal states to visual actions.',
            });
        }

        // Pattern 2: Excessive Internal Monologue
        const excessiveMonologue = evaluations.filter(
            (e) => e.metrics.internalMonologuePercentage >= 10,
        );
        if (excessiveMonologue.length > 0) {
            const avgMonologue =
                excessiveMonologue.reduce(
                    (sum, e) => sum + e.metrics.internalMonologuePercentage,
                    0,
                ) / excessiveMonologue.length;
            patterns.push({
                category: "proportion",
                description: `Excessive internal monologue (≥10%): ${avgMonologue.toFixed(1)}% average`,
                frequency: excessiveMonologue.length,
                averageScore: avgMonologue,
                priority:
                    excessiveMonologue.length / totalTests > 0.5
                        ? "critical"
                        : "high",
                suggestedFix:
                    "Limit internal monologue to 1-2 pivotal panels. Convert to dialogue or visual action.",
            });
        }

        // Pattern 3: Insufficient Dialogue
        const insufficientDialogue = evaluations.filter(
            (e) => e.metrics.dialoguePresence < 60,
        );
        if (insufficientDialogue.length > 0) {
            const avgDialogue =
                insufficientDialogue.reduce(
                    (sum, e) => sum + e.metrics.dialoguePresence,
                    0,
                ) / insufficientDialogue.length;
            patterns.push({
                category: "proportion",
                description: `Insufficient dialogue (<60%): ${avgDialogue.toFixed(1)}% average`,
                frequency: insufficientDialogue.length,
                averageScore: avgDialogue,
                priority:
                    insufficientDialogue.length / totalTests > 0.5
                        ? "high"
                        : "medium",
                suggestedFix:
                    "Emphasize 70% dialogue target. Convert narration to dialogue wherever possible.",
            });
        }

        // Pattern 4: Weak Visual Transformation
        const weakVisual = evaluations.filter(
            (e) => e.categoryScores.visualTransformation < 3.5,
        );
        if (weakVisual.length > 0) {
            const avgScore =
                weakVisual.reduce(
                    (sum, e) => sum + e.categoryScores.visualTransformation,
                    0,
                ) / weakVisual.length;
            patterns.push({
                category: "visual",
                description: `Weak visual transformation (<3.5): ${avgScore.toFixed(2)} average`,
                frequency: weakVisual.length,
                averageScore: avgScore,
                priority:
                    weakVisual.length / totalTests > 0.5 ? "high" : "medium",
                suggestedFix:
                    "Enhance panel description requirements. Mandate body language, expressions, environmental details.",
            });
        }

        // Pattern 5: Poor Webtoon Pacing
        const poorPacing = evaluations.filter(
            (e) => e.categoryScores.webtoonPacing < 3.5,
        );
        if (poorPacing.length > 0) {
            const avgScore =
                poorPacing.reduce(
                    (sum, e) => sum + e.categoryScores.webtoonPacing,
                    0,
                ) / poorPacing.length;
            patterns.push({
                category: "pacing",
                description: `Poor webtoon pacing (<3.5): ${avgScore.toFixed(2)} average`,
                frequency: poorPacing.length,
                averageScore: avgScore,
                priority:
                    poorPacing.length / totalTests > 0.5 ? "high" : "medium",
                suggestedFix:
                    "Add pacing rhythm guidance: establish → build → peak → release → transition.",
            });
        }

        // Pattern 6: Description Length Issues
        const descriptionIssues = evaluations.filter(
            (e) => !e.metrics.descriptionLengthCompliance,
        );
        if (descriptionIssues.length > 0) {
            patterns.push({
                category: "formatting",
                description: `Description length non-compliance (not 200-400 chars)`,
                frequency: descriptionIssues.length,
                averageScore: 0,
                priority:
                    descriptionIssues.length / totalTests > 0.3
                        ? "medium"
                        : "low",
                suggestedFix:
                    "Enforce 200-400 character requirement in prompt. Provide examples.",
            });
        }

        // Pattern 7: Dialogue Length Issues
        const dialogueIssues = evaluations.filter(
            (e) => !e.metrics.dialogueLengthCompliance,
        );
        if (dialogueIssues.length > 0) {
            patterns.push({
                category: "formatting",
                description: `Dialogue length non-compliance (>150 chars per bubble)`,
                frequency: dialogueIssues.length,
                averageScore: 0,
                priority:
                    dialogueIssues.length / totalTests > 0.3 ? "medium" : "low",
                suggestedFix:
                    "Enforce 150 character max per speech bubble. Split long dialogue.",
            });
        }

        // Pattern 8: Low Shot Variety
        const lowVariety = evaluations.filter((e) => e.metrics.shotVariety < 5);
        if (lowVariety.length > 0) {
            const avgVariety =
                lowVariety.reduce((sum, e) => sum + e.metrics.shotVariety, 0) /
                lowVariety.length;
            patterns.push({
                category: "visual",
                description: `Low shot variety (<5 types): ${avgVariety.toFixed(1)} average`,
                frequency: lowVariety.length,
                averageScore: avgVariety,
                priority:
                    lowVariety.length / totalTests > 0.3 ? "medium" : "low",
                suggestedFix:
                    "Encourage variety: establishing, wide, medium, close-up, extreme close-up, special angles.",
            });
        }

        // Sort by priority and frequency
        patterns.sort((a, b) => {
            const priorityOrder = {
                critical: 0,
                high: 1,
                medium: 2,
                low: 3,
            };
            const priorityDiff =
                priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.frequency - a.frequency;
        });

        return patterns;
    }

    clear(): void {
        this.results = [];
    }

    getResults(): ToonplayTestResult[] {
        return this.results;
    }
}

export function calculateStatisticalSignificance(
    control: number[],
    experiment: number[],
): { pValue: number; confidenceLevel: number } {
    // Two-sample t-test
    const n1 = control.length;
    const n2 = experiment.length;

    if (n1 < 2 || n2 < 2) {
        return { pValue: 1.0, confidenceLevel: 0 };
    }

    const mean1 = control.reduce((a, b) => a + b, 0) / n1;
    const mean2 = experiment.reduce((a, b) => a + b, 0) / n2;

    const variance1 =
        control.reduce((sum, x) => sum + (x - mean1) ** 2, 0) / (n1 - 1);
    const variance2 =
        experiment.reduce((sum, x) => sum + (x - mean2) ** 2, 0) / (n2 - 1);

    const pooledVariance =
        ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));

    const tStatistic = (mean2 - mean1) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Approximate p-value using t-distribution
    const pValue = approximatePValue(Math.abs(tStatistic), degreesOfFreedom);
    const confidenceLevel = 1 - pValue;

    return { pValue, confidenceLevel };
}

function approximatePValue(t: number, _df: number): number {
    // Simplified p-value approximation
    // For more accuracy, use a proper t-distribution library
    if (t < 1.96) return 0.05; // Not significant
    if (t < 2.58) return 0.01; // Significant at 95%
    if (t < 3.29) return 0.001; // Significant at 99%
    return 0.0001; // Highly significant
}
