#!/usr/bin/env tsx

/**
 * A/B Testing Script - Compare image prompt versions
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --scenarios "story-cover" \
 *     --sample-size 5
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScenario } from "./config/test-scenarios";
import { ImageMetricsTracker } from "./src/metrics-tracker";
import type {
    ABTestComparison,
    AggregatedImageMetrics,
    ImageTestResult,
} from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        control: { type: "string", default: "v1.0" },
        experiment: { type: "string", default: "v1.1" },
        scenarios: { type: "string" },
        "sample-size": { type: "string", default: "5" },
        hypothesis: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
A/B Testing Script - Compare image prompt versions

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --scenarios   <string>  Comma-separated test scenario IDs (default: story-cover)
  --sample-size  <number>  Images per version (default: 5)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message

Examples:
  # Basic A/B test
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts --control v1.0 --experiment v1.1

  # Test with specific scenarios
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts --scenarios "story-cover,character-portrait"

  # Test with hypothesis
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts \\
    --hypothesis "Improve prompt adherence from 85% to 90%+"
  `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const SAMPLE_SIZE = parseInt(values["sample-size"] || "5", 10);
const TEST_SCENARIO_IDS = values.scenarios
    ? values.scenarios.split(",").map((s) => s.trim())
    : ["story-cover"];
const HYPOTHESIS =
    values.hypothesis || "Experiment version will improve image quality";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/ab-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
              A/B TESTING - IMAGE PROMPT COMPARISON
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Scenarios: ${TEST_SCENARIO_IDS.join(", ")}
  Sample Size:    ${SAMPLE_SIZE} images per version
  Total Tests:    ${SAMPLE_SIZE * TEST_SCENARIO_IDS.length * 2}

  Hypothesis:     ${HYPOTHESIS}
═══════════════════════════════════════════════════════════════
`);

/**
 * Load test results from file or generate new ones
 */
async function loadOrGenerateResults(
    version: string,
    scenarios: string[],
    sampleSize: number,
): Promise<{
    results: ImageTestResult[];
    metrics: AggregatedImageMetrics;
}> {
    // Check if results already exist
    const resultsFile = `results/${version}/suite-latest.json`;

    try {
        const existingData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(existingData);

        // Filter results for requested scenarios
        const filteredResults = suiteResult.results.filter(
            (result: ImageTestResult) => {
                return scenarios.includes(result.scenarioId);
            },
        );

        if (filteredResults.length >= sampleSize) {
            console.log(`  ✓ Using existing results from ${resultsFile}`);
            return {
                results: filteredResults.slice(0, sampleSize),
                metrics: suiteResult.aggregatedMetrics,
            };
        }
    } catch (_error) {
        console.log(
            `  → No existing results found for ${version}, will generate new ones`,
        );
    }

    // Generate new results
    console.log(`  → Generating ${sampleSize} images with ${version}...`);

    // Import and run test suite
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const scenariosArg = scenarios.join(",");
    const command = `dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts --version ${version} --scenarios "${scenariosArg}" --iterations ${sampleSize} --mode standard --output results/${version}/suite-latest.json`;

    try {
        console.log(`  → Running: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error(`  ✗ Failed to generate images:`, error);
        return { results: [], metrics: {} as AggregatedImageMetrics };
    }

    // Load the newly generated results
    try {
        const newData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(newData);
        return {
            results: suiteResult.results.slice(0, sampleSize),
            metrics: suiteResult.aggregatedMetrics,
        };
    } catch (error) {
        console.error(`  ✗ Failed to load generated results:`, error);
        return { results: [], metrics: {} as AggregatedImageMetrics };
    }
}

/**
 * Calculate metric deltas between control and experiment
 */
function calculateMetricDeltas(
    control: AggregatedImageMetrics,
    experiment: AggregatedImageMetrics,
): Record<string, number> {
    const deltas: Record<string, number> = {};

    // Core quality metrics
    deltas.averageWeightedScore =
        experiment.averageWeightedScore - control.averageWeightedScore;
    deltas.passRate = experiment.passRate - control.passRate;
    deltas.firstPassSuccessRate =
        experiment.firstPassSuccessRate - control.firstPassSuccessRate;

    // Generation quality
    deltas.averagePromptAdherence =
        experiment.averagePromptAdherence - control.averagePromptAdherence;
    deltas.averageAspectRatioAccuracy =
        experiment.averageAspectRatioAccuracy -
        control.averageAspectRatioAccuracy;
    deltas.resolutionComplianceRate =
        experiment.resolutionComplianceRate - control.resolutionComplianceRate;

    // Optimization quality
    deltas.averageAvifCompressionRatio =
        experiment.averageAvifCompressionRatio -
        control.averageAvifCompressionRatio;
    deltas.averageAvif1xSize =
        experiment.averageAvif1xSize - control.averageAvif1xSize;
    deltas.averageAvif2xSize =
        experiment.averageAvif2xSize - control.averageAvif2xSize;

    // Visual quality
    deltas.averageVisualQualityScore =
        experiment.averageVisualQualityScore - control.averageVisualQualityScore;
    deltas.averageArtifactCount =
        experiment.averageArtifactCount - control.averageArtifactCount;

    // Performance
    deltas.averageGenerationTime =
        experiment.averageGenerationTime - control.averageGenerationTime;
    deltas.successRate = experiment.successRate - control.successRate;

    // Category scores
    deltas.generationQuality =
        experiment.categoryAverages.generationQuality -
        control.categoryAverages.generationQuality;
    deltas.optimizationQuality =
        experiment.categoryAverages.optimizationQuality -
        control.categoryAverages.optimizationQuality;
    deltas.visualQuality =
        experiment.categoryAverages.visualQuality -
        control.categoryAverages.visualQuality;
    deltas.performance =
        experiment.categoryAverages.performance -
        control.categoryAverages.performance;

    return deltas;
}

/**
 * Calculate statistical significance using t-test
 */
function calculateStatisticalSignificance(
    controlScores: number[],
    experimentScores: number[],
): { pValue: number; confidenceLevel: number } {
    // Simple t-test implementation
    const n1 = controlScores.length;
    const n2 = experimentScores.length;

    if (n1 < 2 || n2 < 2) {
        return { pValue: 1.0, confidenceLevel: 0 };
    }

    const mean1 =
        controlScores.reduce((a, b) => a + b, 0) / n1;
    const mean2 =
        experimentScores.reduce((a, b) => a + b, 0) / n2;

    const variance1 =
        controlScores.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) /
        (n1 - 1);
    const variance2 =
        experimentScores.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) /
        (n2 - 1);

    const pooledStd = Math.sqrt(
        ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2),
    );
    const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2);

    if (standardError === 0) {
        return { pValue: 1.0, confidenceLevel: 0 };
    }

    const tStatistic = (mean2 - mean1) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Simplified p-value calculation (two-tailed)
    // For more accuracy, use a proper t-distribution table
    const pValue = Math.min(1.0, Math.max(0.0, 2 * (1 - Math.abs(tStatistic) / 2)));
    const confidenceLevel = pValue < 0.05 ? 0.95 : pValue < 0.1 ? 0.90 : 0.0;

    return { pValue, confidenceLevel };
}

/**
 * Generate recommendation based on comparison
 */
function generateRecommendation(
    deltas: Record<string, number>,
    statisticalSignificance: { pValue: number; confidenceLevel: number },
): "ADOPT" | "REVISE" | "REVERT" {
    const significant = statisticalSignificance.pValue < 0.05;
    const weightedScoreImproved = deltas.averageWeightedScore > 0.1;
    const noCriticalRegressions =
        deltas.averagePromptAdherence > -5 &&
        deltas.successRate > -0.05 &&
        deltas.averageVisualQualityScore > -0.5;

    if (significant && weightedScoreImproved && noCriticalRegressions) {
        return "ADOPT";
    }

    if (weightedScoreImproved && noCriticalRegressions) {
        return "REVISE"; // Improve but needs more testing
    }

    return "REVERT";
}

/**
 * Main A/B test execution
 */
async function main() {
    // Load or generate control results
    console.log(`\n📊 Loading Control Results (${CONTROL_VERSION})...`);
    const controlData = await loadOrGenerateResults(
        CONTROL_VERSION,
        TEST_SCENARIO_IDS,
        SAMPLE_SIZE,
    );

    // Load or generate experiment results
    console.log(`\n📊 Loading Experiment Results (${EXPERIMENT_VERSION})...`);
    const experimentData = await loadOrGenerateResults(
        EXPERIMENT_VERSION,
        TEST_SCENARIO_IDS,
        SAMPLE_SIZE,
    );

    if (controlData.results.length === 0 || experimentData.results.length === 0) {
        console.error("  ✗ Insufficient results for comparison");
        process.exit(1);
    }

    // Calculate deltas
    console.log(`\n📈 Calculating Metric Deltas...`);
    const deltas = calculateMetricDeltas(
        controlData.metrics,
        experimentData.metrics,
    );

    // Calculate statistical significance
    const controlScores = controlData.results.map(
        (r) => r.evaluation.weightedScore,
    );
    const experimentScores = experimentData.results.map(
        (r) => r.evaluation.weightedScore,
    );
    const statisticalSignificance = calculateStatisticalSignificance(
        controlScores,
        experimentScores,
    );

    // Identify improvements and regressions
    const improvements: string[] = [];
    const regressions: string[] = [];
    const neutral: string[] = [];

    for (const [metric, delta] of Object.entries(deltas)) {
        if (Math.abs(delta) < 0.01) {
            neutral.push(metric);
        } else if (delta > 0) {
            improvements.push(metric);
        } else {
            regressions.push(metric);
        }
    }

    // Generate recommendation
    const recommendation = generateRecommendation(
        deltas,
        statisticalSignificance,
    );

    // Create comparison result
    const comparison: ABTestComparison = {
        config: {
            controlVersion: CONTROL_VERSION,
            experimentVersion: EXPERIMENT_VERSION,
            testScenarios: TEST_SCENARIO_IDS,
            sampleSize: SAMPLE_SIZE,
            hypothesis: HYPOTHESIS,
            testDate: new Date().toISOString(),
        },
        control: controlData.metrics,
        experiment: experimentData.metrics,
        comparison: {
            deltas,
            statisticalSignificance,
            improvements,
            regressions,
            neutral,
            recommendation,
            reasoning: `Weighted score ${deltas.averageWeightedScore > 0 ? "improved" : "degraded"} by ${Math.abs(deltas.averageWeightedScore).toFixed(2)}. Statistical significance: ${statisticalSignificance.pValue < 0.05 ? "YES" : "NO"} (p=${statisticalSignificance.pValue.toFixed(3)})`,
        },
    };

    // Save results
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify(comparison, null, 2),
        "utf-8",
    );

    // Print summary
    console.log(`
═══════════════════════════════════════════════════════════════
                    A/B TEST COMPARISON RESULTS
═══════════════════════════════════════════════════════════════
  Control Score:    ${controlData.metrics.averageWeightedScore.toFixed(2)}/5.0
  Experiment Score: ${experimentData.metrics.averageWeightedScore.toFixed(2)}/5.0
  Delta:            ${deltas.averageWeightedScore > 0 ? "+" : ""}${deltas.averageWeightedScore.toFixed(2)}/5.0

  Statistical Significance:
    p-value:        ${statisticalSignificance.pValue.toFixed(3)}
    Confidence:     ${statisticalSignificance.confidenceLevel > 0 ? `${(statisticalSignificance.confidenceLevel * 100).toFixed(0)}%` : "Not significant"}

  Recommendation:   ${recommendation}

  Top Improvements:
${improvements
    .slice(0, 5)
    .map(
        (m) =>
            `    + ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(2)}`,
    )
    .join("\n")}

  Top Regressions:
${regressions
    .slice(0, 5)
    .map(
        (m) =>
            `    - ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(2)}`,
    )
    .join("\n")}

  Results saved to: ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

    process.exit(0);
}

// Run main function
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

