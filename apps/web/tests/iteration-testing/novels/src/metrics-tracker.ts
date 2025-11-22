/**
 * Metrics Tracker - Aggregate and analyze metrics across test runs
 */

import type {
    CharacterTransformationMetrics,
    CorePrincipleMetrics,
    CyclicStructureMetrics,
    EarnedConsequenceMetrics,
    EmotionalResonanceMetrics,
    IntrinsicMotivationMetrics,
    MetricDelta,
    MetricSnapshot,
    TestStoryResult,
} from "./types";

/**
 * Metric thresholds and targets based on novels-evaluation.md
 */
export const METRIC_THRESHOLDS = {
    // Cyclic Structure Metrics
    cycleCompleteness: { target: 1.0, threshold: 0.9 },
    chapterCycleFocus: { target: 1.0, threshold: 1.0 },
    phaseCoverage: { target: 1.0, threshold: 0.9 },
    resolutionAdversityTransition: { target: 0.8, threshold: 0.7 },
    stakesEscalation: { target: 0.85, threshold: 0.75 },
    narrativeMomentum: { target: 0.9, threshold: 0.8 },
    nestedCycleAlignment: { target: 0.85, threshold: 0.75 },
    causalChainContinuity: { target: 1.0, threshold: 0.95 },
    forwardMomentum: { target: 0.9, threshold: 0.8 },

    // Intrinsic Motivation Metrics
    characterActionAuthenticity: { target: 0.9, threshold: 0.8 },
    transactionalLanguageAbsence: { target: 0.85, threshold: 0.75 },
    strategicGoodDeeds: { target: 0.0, threshold: 0.0 },
    rewardExpectationDisplay: { target: 0.0, threshold: 0.0 },
    genuineGoodnessPerception: { target: 0.85, threshold: 0.75 },
    moralElevationTrigger: { target: 0.8, threshold: 0.7 },
    dramaticIrony: { target: 0.9, threshold: 0.8 },

    // Earned Consequence Metrics
    causalConnectionClarity: { target: 0.9, threshold: 0.7 },
    deusExMachinaIncidents: { target: 0.0, threshold: 0.0 },
    temporalSeparation: { target: 0.85, threshold: 0.75 },
    earnedSuccessPerception: { target: 0.8, threshold: 0.7 },
    surprisingButInevitable: { target: 0.85, threshold: 0.75 },
    earnedLuckFeeling: { target: 0.9, threshold: 0.8 },
    seedResolutionRate: { target: 0.7, threshold: 0.5 },
    seedPlantingSuccess: { target: 0.85, threshold: 0.75 },
    seedTrackingCompleteness: { target: 1.0, threshold: 1.0 },
    seedResolutionQuality: { target: 0.9, threshold: 0.8 },
    relationshipSeedDepth: { target: 0.75, threshold: 0.6 },

    // Character Transformation Metrics
    internalFlawDefinition: { target: 1.0, threshold: 1.0 },
    characterDepth: { target: 1.0, threshold: 0.9 },
    flawDrivenAdversity: { target: 0.9, threshold: 0.8 },
    virtueConfrontsFlaw: { target: 0.9, threshold: 0.8 },
    consequenceEnablesGrowth: { target: 0.85, threshold: 0.75 },
    arcProgressionPerception: { target: 0.8, threshold: 0.7 },
    transformationArticulation: { target: 0.75, threshold: 0.6 },
    earnedTransformation: { target: 0.85, threshold: 0.75 },
    arcStructureClarity: { target: 0.9, threshold: 0.8 },

    // Emotional Resonance Metrics
    sceneQualityScore: { target: 3.5 / 4.0, threshold: 3.0 / 4.0 },
    firstPassSuccessRate: { target: 0.85, threshold: 0.7 },
    moralElevationDetection: { target: 0.8, threshold: 0.7 },
    gamdongAchievement: { target: 0.8, threshold: 0.6 },
    empathyBuilding: { target: 0.75, threshold: 0.6 },
    catharsisExperience: { target: 0.7, threshold: 0.5 },
    moralFrameworkClarity: { target: 0.9, threshold: 0.75 },
    emotionalBeatAccuracy: { target: 0.75, threshold: 0.6 },
    emotionalBeatAssignment: { target: 0.75, threshold: 0.6 },
    sceneMemorability: { target: 0.6, threshold: 0.5 },
    settingAmplification: { target: 0.8, threshold: 0.7 },
    wordCountAccuracy: { target: 0.9, threshold: 0.75 },
    formattingCompliance: { target: 1.0, threshold: 0.95 },
    proseVariety: { target: 20, threshold: 15 }, // Average sentence length variance
};

/**
 * Aggregate metrics from multiple test stories
 */
export function aggregateMetrics(
    stories: TestStoryResult[],
): CorePrincipleMetrics {
    const aggregated: CorePrincipleMetrics = {
        cyclicStructure: createEmptyMetrics(
            "cyclicStructure",
        ) as CyclicStructureMetrics,
        intrinsicMotivation: createEmptyMetrics(
            "intrinsicMotivation",
        ) as IntrinsicMotivationMetrics,
        earnedConsequence: createEmptyMetrics(
            "earnedConsequence",
        ) as EarnedConsequenceMetrics,
        characterTransformation: createEmptyMetrics(
            "characterTransformation",
        ) as CharacterTransformationMetrics,
        emotionalResonance: createEmptyMetrics(
            "emotionalResonance",
        ) as EmotionalResonanceMetrics,
    };

    if (stories.length === 0) return aggregated;

    // Extract and average metrics from each story
    for (const story of stories) {
        extractAndAddMetrics(story, aggregated);
    }

    // Average all metrics
    normalizeMetrics(aggregated, stories.length);

    return aggregated;
}

/**
 * Create empty metrics object for a principle
 */
function createEmptyMetrics(
    principle: keyof CorePrincipleMetrics,
):
    | CyclicStructureMetrics
    | IntrinsicMotivationMetrics
    | EarnedConsequenceMetrics
    | CharacterTransformationMetrics
    | EmotionalResonanceMetrics {
    switch (principle) {
        case "cyclicStructure":
            return {
                cycleCompleteness: 0,
                chapterCycleFocus: 0,
                phaseCoverage: 0,
                resolutionAdversityTransition: 0,
                stakesEscalation: 0,
                narrativeMomentum: 0,
                nestedCycleAlignment: 0,
                causalChainContinuity: 0,
                forwardMomentum: 0,
            } as CyclicStructureMetrics;
        case "intrinsicMotivation":
            return {
                characterActionAuthenticity: 0,
                transactionalLanguageAbsence: 0,
                strategicGoodDeeds: 0,
                rewardExpectationDisplay: 0,
                genuineGoodnessPerception: 0,
                moralElevationTrigger: 0,
                dramaticIrony: 0,
            } as IntrinsicMotivationMetrics;
        case "earnedConsequence":
            return {
                causalConnectionClarity: 0,
                deusExMachinaIncidents: 0,
                temporalSeparation: 0,
                earnedSuccessPerception: 0,
                surprisingButInevitable: 0,
                earnedLuckFeeling: 0,
                seedResolutionRate: 0,
                seedPlantingSuccess: 0,
                seedTrackingCompleteness: 0,
                seedResolutionQuality: 0,
                relationshipSeedDepth: 0,
            } as EarnedConsequenceMetrics;
        case "characterTransformation":
            return {
                internalFlawDefinition: 0,
                characterDepth: 0,
                flawDrivenAdversity: 0,
                virtueConfrontsFlaw: 0,
                consequenceEnablesGrowth: 0,
                arcProgressionPerception: 0,
                transformationArticulation: 0,
                earnedTransformation: 0,
                arcStructureClarity: 0,
            } as CharacterTransformationMetrics;
        case "emotionalResonance":
            return {
                sceneQualityScore: 0,
                firstPassSuccessRate: 0,
                moralElevationDetection: 0,
                gamdongAchievement: 0,
                empathyBuilding: 0,
                catharsisExperience: 0,
                moralFrameworkClarity: 0,
                emotionalBeatAccuracy: 0,
                emotionalBeatAssignment: 0,
                sceneMemorability: 0,
                settingAmplification: 0,
                wordCountAccuracy: 0,
                formattingCompliance: 0,
                proseVariety: 0,
            } as EmotionalResonanceMetrics;
        default:
            throw new Error(`Unknown principle: ${principle}`);
    }
}

/**
 * Extract metrics from a story and add to aggregated totals
 */
function extractAndAddMetrics(
    story: TestStoryResult,
    aggregated: CorePrincipleMetrics,
): void {
    // Extract from chapter evaluation (Cyclic Structure)
    if (story.evaluationResults.chapter?.metrics) {
        const metrics = story.evaluationResults.chapter.metrics;
        if (metrics.singleCycleFocus) {
            aggregated.cyclicStructure.cycleCompleteness +=
                metrics.singleCycleFocus.score / 4.0;
            aggregated.cyclicStructure.chapterCycleFocus +=
                metrics.singleCycleFocus.score / 4.0;
        }
        if (metrics.seedTracking) {
            aggregated.earnedConsequence.seedTrackingCompleteness +=
                metrics.seedTracking.score / 4.0;
        }
        if (metrics.stakesEscalation) {
            aggregated.cyclicStructure.stakesEscalation +=
                metrics.stakesEscalation.score / 4.0;
        }
        if (metrics.momentum) {
            aggregated.cyclicStructure.narrativeMomentum +=
                metrics.momentum.score / 4.0;
        }
    }

    // Extract from character evaluation (Intrinsic Motivation & Transformation)
    if (story.evaluationResults.characters?.metrics) {
        const metrics = story.evaluationResults.characters.metrics;
        if (metrics.characterDepth) {
            aggregated.characterTransformation.characterDepth +=
                metrics.characterDepth.score / 4.0;
            aggregated.intrinsicMotivation.characterActionAuthenticity +=
                metrics.characterDepth.score / 4.0;
        }
        if (metrics.voiceDistinctiveness) {
            aggregated.intrinsicMotivation.dramaticIrony +=
                metrics.voiceDistinctiveness.score / 4.0;
        }
    }

    // Extract from part evaluation (Earned Consequence)
    if (story.evaluationResults.part?.metrics) {
        const metrics = story.evaluationResults.part.metrics;
        if (metrics.cycleCoherence) {
            aggregated.cyclicStructure.nestedCycleAlignment +=
                metrics.cycleCoherence.score / 4.0;
        }
        if (metrics.conflictDefinition) {
            aggregated.characterTransformation.flawDrivenAdversity +=
                metrics.conflictDefinition.score / 4.0;
        }
        if (metrics.seedTracking) {
            aggregated.earnedConsequence.seedPlantingSuccess +=
                metrics.seedTracking.score / 4.0;
        }
    }

    // Extract from scene content evaluation (Emotional Resonance)
    if (story.evaluationResults.sceneContent?.metrics) {
        const metrics = story.evaluationResults.sceneContent.metrics;
        if (metrics.wordCountCompliance) {
            aggregated.emotionalResonance.wordCountAccuracy +=
                metrics.wordCountCompliance.score / 4.0;
        }
        if (metrics.cycleAlignment) {
            aggregated.cyclicStructure.phaseCoverage +=
                metrics.cycleAlignment.score / 4.0;
        }
        if (metrics.emotionalResonance) {
            aggregated.emotionalResonance.gamdongAchievement +=
                metrics.emotionalResonance.score / 4.0;
            aggregated.emotionalResonance.moralElevationDetection +=
                metrics.emotionalResonance.score / 4.0;
        }
    }

    // Extract from story evaluation (Moral Framework)
    if (story.evaluationResults.story?.metrics) {
        const metrics = story.evaluationResults.story.metrics;
        if (metrics.moralFrameworkClarity) {
            aggregated.emotionalResonance.moralFrameworkClarity +=
                metrics.moralFrameworkClarity.score / 4.0;
        }
        if (metrics.thematicCoherence) {
            aggregated.intrinsicMotivation.genuineGoodnessPerception +=
                metrics.thematicCoherence.score / 4.0;
        }
    }
}

/**
 * Normalize metrics by dividing by the number of stories
 */
function normalizeMetrics(
    aggregated: CorePrincipleMetrics,
    storyCount: number,
): void {
    for (const principle of Object.keys(aggregated) as Array<
        keyof CorePrincipleMetrics
    >) {
        for (const metric of Object.keys(aggregated[principle]) as string[]) {
            // Type-safe access to metric values
            const principleMetrics = aggregated[principle] as unknown as Record<
                string,
                number
            >;
            principleMetrics[metric] /= storyCount;
        }
    }
}

/**
 * Calculate pass rates for all metrics
 */
export function calculatePassRates(
    stories: TestStoryResult[],
): Record<string, number> {
    const passRates: Record<string, number> = {};
    const metricCounts: Record<string, { passed: number; total: number }> = {};

    for (const story of stories) {
        for (const evalType of Object.values(story.evaluationResults)) {
            if (evalType?.metrics) {
                for (const [metricName, metric] of Object.entries(
                    evalType.metrics,
                )) {
                    if (!metricCounts[metricName]) {
                        metricCounts[metricName] = { passed: 0, total: 0 };
                    }
                    metricCounts[metricName].total++;
                    if (metric.passed) {
                        metricCounts[metricName].passed++;
                    }
                }
            }
        }
    }

    for (const [metricName, counts] of Object.entries(metricCounts)) {
        passRates[metricName] =
            counts.total > 0 ? counts.passed / counts.total : 0;
    }

    return passRates;
}

/**
 * Compare two metric snapshots and calculate deltas
 */
export function compareMetrics(
    baseline: MetricSnapshot,
    experiment: MetricSnapshot,
): MetricDelta[] {
    const deltas: MetricDelta[] = [];

    for (const metric of Object.keys(baseline)) {
        const baselineValue = baseline[metric];
        const experimentValue = experiment[metric] || 0;
        const delta = experimentValue - baselineValue;
        const percentage =
            baselineValue > 0 ? (delta / baselineValue) * 100 : 0;

        deltas.push({
            metric,
            baseline: baselineValue,
            experiment: experimentValue,
            delta,
            percentage,
            improved: delta > 0,
        });
    }

    // Sort by largest improvement first
    return deltas.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calculate metric statistics (mean, median, variance)
 */
export function calculateMetricStatistics(values: number[]): {
    mean: number;
    median: number;
    variance: number;
    stdDev: number;
    min: number;
    max: number;
} {
    if (values.length === 0) {
        return { mean: 0, median: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
    }

    // Mean
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const median =
        values.length % 2 === 0
            ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
            : sorted[Math.floor(values.length / 2)];

    // Variance and Standard Deviation
    const variance =
        values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
        mean,
        median,
        variance,
        stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

/**
 * Calculate Pearson correlation coefficient
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate percentile value from sorted array
 */
export function calculatePercentile(
    values: number[],
    percentile: number,
): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
        return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Generate metric report summary
 */
export function generateMetricReport(
    aggregated: CorePrincipleMetrics,
    passRates: Record<string, number>,
): string {
    const principles = [
        { name: "Cyclic Structure", metrics: aggregated.cyclicStructure },
        {
            name: "Intrinsic Motivation",
            metrics: aggregated.intrinsicMotivation,
        },
        { name: "Earned Consequence", metrics: aggregated.earnedConsequence },
        {
            name: "Character Transformation",
            metrics: aggregated.characterTransformation,
        },
        { name: "Emotional Resonance", metrics: aggregated.emotionalResonance },
    ];

    let report = "# Metrics Report\n\n";

    for (const principle of principles) {
        // Calculate average score for principle
        const scores = Object.values(principle.metrics);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const passRate = calculatePrinciplePassRate(
            principle.name.toLowerCase().replace(" ", ""),
            passRates,
        );

        report += `## ${principle.name}\n`;
        report += `- **Average Score**: ${(avgScore * 100).toFixed(1)}%\n`;
        report += `- **Pass Rate**: ${(passRate * 100).toFixed(1)}%\n`;
        report += `- **Status**: ${passRate >= 0.9 ? "✅ Passing" : passRate >= 0.7 ? "⚠️ Warning" : "❌ Failing"}\n\n`;

        // List individual metrics
        report += "| Metric | Score | Target | Status |\n";
        report += "|--------|-------|--------|--------|\n";

        for (const [metricName, value] of Object.entries(principle.metrics)) {
            const threshold =
                METRIC_THRESHOLDS[metricName as keyof typeof METRIC_THRESHOLDS];
            const status =
                value >= threshold.target
                    ? "✅"
                    : value >= threshold.threshold
                      ? "⚠️"
                      : "❌";
            report += `| ${metricName} | ${(value * 100).toFixed(0)}% | ${(threshold.target * 100).toFixed(0)}% | ${status} |\n`;
        }

        report += "\n";
    }

    return report;
}

/**
 * Calculate pass rate for a Core Principle
 */
function calculatePrinciplePassRate(
    principle: string,
    passRates: Record<string, number>,
): number {
    const relevantMetrics = Object.keys(passRates).filter((metric) => {
        // Map metrics to principles based on naming patterns
        if (principle.includes("cyclic")) {
            return (
                metric.includes("cycle") ||
                metric.includes("phase") ||
                metric.includes("momentum")
            );
        }
        if (principle.includes("intrinsic")) {
            return (
                metric.includes("authentic") ||
                metric.includes("transactional") ||
                metric.includes("genuine")
            );
        }
        if (principle.includes("earned")) {
            return (
                metric.includes("seed") ||
                metric.includes("causal") ||
                metric.includes("temporal")
            );
        }
        if (principle.includes("transformation")) {
            return (
                metric.includes("flaw") ||
                metric.includes("arc") ||
                metric.includes("transform")
            );
        }
        if (principle.includes("emotional")) {
            return (
                metric.includes("emotion") ||
                metric.includes("gamdong") ||
                metric.includes("moral")
            );
        }
        return false;
    });

    if (relevantMetrics.length === 0) return 0;

    const totalPassRate = relevantMetrics.reduce(
        (sum, metric) => sum + passRates[metric],
        0,
    );
    return totalPassRate / relevantMetrics.length;
}
