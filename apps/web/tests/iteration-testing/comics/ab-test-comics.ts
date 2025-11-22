#!/usr/bin/env tsx

/**
 * A/B Testing Script - Compare comic prompt versions
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --scenes "action-sequence" \
 *     --sample-size 5
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScene } from "./config/test-scenes";
import { ComicMetricsTracker } from "./src/metrics-tracker";
import type {
    ABTestComparison,
    AggregatedComicMetrics,
    ComicTestResult,
} from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        control: { type: "string", default: "v1.0" },
        experiment: { type: "string", default: "v1.1" },
        scenes: { type: "string" },
        "sample-size": { type: "string", default: "5" },
        hypothesis: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
A/B Testing Script - Compare comic prompt versions

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --scenes       <string>  Comma-separated test scene IDs (default: action-sequence)
  --sample-size  <number>  Comic sets per version (default: 5)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message

Examples:
  # Basic A/B test
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts --control v1.0 --experiment v1.1

  # Test with specific scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts --scenes "action-sequence,emotional-beat"

  # Test with hypothesis
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/ab-test-comics.ts \\
    --hypothesis "Improve visual clarity from 3.2 to 3.8+"
  `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const SAMPLE_SIZE = parseInt(values["sample-size"] || "5", 10);
const TEST_SCENE_IDS = values.scenes
    ? values.scenes.split(",").map((s) => s.trim())
    : ["action-sequence"];
const HYPOTHESIS =
    values.hypothesis || "Experiment version will improve comic quality";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/ab-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
              A/B TESTING - COMIC PROMPT COMPARISON
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Scenes:    ${TEST_SCENE_IDS.join(", ")}
  Sample Size:    ${SAMPLE_SIZE} comic sets per version
  Total Tests:    ${SAMPLE_SIZE * TEST_SCENE_IDS.length * 2}

  Hypothesis:     ${HYPOTHESIS}
═══════════════════════════════════════════════════════════════
`);

/**
 * Load test results from file or generate new ones
 */
async function loadOrGenerateResults(
    version: string,
    scenes: string[],
    sampleSize: number,
): Promise<{
    results: ComicTestResult[];
    metrics: AggregatedComicMetrics;
}> {
    // Check if results already exist
    const resultsFile = `results/${version}/suite-latest.json`;

    try {
        const existingData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(existingData);

        // Filter results for requested scenes
        const filteredResults = suiteResult.results.filter(
            (result: ComicTestResult) => {
                return scenes.includes(result.sceneId);
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
    console.log(`  → Generating ${sampleSize} comic sets with ${version}...`);

    // Import and run test suite
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const scenesArg = scenes.join(",");
    const command = `dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts --version ${version} --scenes "${scenesArg}" --iterations ${sampleSize} --mode standard --output results/${version}/suite-latest.json`;

    try {
        console.log(`  → Running: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error(`  ✗ Failed to generate comics:`, error);
        return { results: [], metrics: {} as AggregatedComicMetrics };
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
        return { results: [], metrics: {} as AggregatedComicMetrics };
    }
}

/**
 * Calculate metric deltas between control and experiment
 */
function calculateMetricDeltas(
    control: AggregatedComicMetrics,
    experiment: AggregatedComicMetrics,
): Record<string, number> {
    const deltas: Record<string, number> = {};

    // Core quality metrics
    deltas.averageWeightedScore =
        experiment.averageWeightedScore - control.averageWeightedScore;
    deltas.passRate = experiment.passRate - control.passRate;
    deltas.firstPassSuccessRate =
        experiment.firstPassSuccessRate - control.firstPassSuccessRate;

    // Panel quality
    deltas.averageVisualClarity =
        experiment.averageVisualClarity - control.averageVisualClarity;
    deltas.averageCompositionQuality =
        experiment.averageCompositionQuality -
        control.averageCompositionQuality;
    deltas.averageCharacterAccuracy =
        experiment.averageCharacterAccuracy - control.averageCharacterAccuracy;

    // Narrative coherence
    deltas.averageStoryFlow =
        experiment.averageStoryFlow - control.averageStoryFlow;
    deltas.averagePanelSequenceLogic =
        experiment.averagePanelSequenceLogic -
        control.averagePanelSequenceLogic;

    // Performance
    deltas.averagePanelGenerationTime =
        experiment.averagePanelGenerationTime -
        control.averagePanelGenerationTime;
    deltas.successRate = experiment.successRate - control.successRate;

    // Category scores
    deltas.panelQuality =
        experiment.categoryAverages.panelQuality -
        control.categoryAverages.panelQuality;
    deltas.narrativeCoherence =
        experiment.categoryAverages.narrativeCoherence -
        control.categoryAverages.narrativeCoherence;
    deltas.technicalQuality =
        experiment.categoryAverages.technicalQuality -
        control.categoryAverages.technicalQuality;
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
): { pValue: number; confidenceLevel: number; sampleSize: number } {
    // Simple t-test implementation
    const n1 = controlScores.length;
    const n2 = experimentScores.length;

    if (n1 < 2 || n2 < 2) {
        return { pValue: 1.0, confidenceLevel: 0, sampleSize: n1 + n2 };
    }

    const mean1 = controlScores.reduce((a, b) => a + b, 0) / n1;
    const mean2 = experimentScores.reduce((a, b) => a + b, 0) / n2;

    const variance1 =
        controlScores.reduce((sum, x) => sum + (x - mean1) ** 2, 0) / (n1 - 1);
    const variance2 =
        experimentScores.reduce((sum, x) => sum + (x - mean2) ** 2, 0) /
        (n2 - 1);

    const pooledStd = Math.sqrt(
        ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2),
    );
    const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2);

    if (standardError === 0) {
        return { pValue: 1.0, confidenceLevel: 0, sampleSize: n1 + n2 };
    }

    const tStatistic = (mean2 - mean1) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Simplified p-value calculation (two-tailed)
    const pValue = Math.min(
        1.0,
        Math.max(0.0, 2 * (1 - Math.abs(tStatistic) / 2)),
    );
    const confidenceLevel = pValue < 0.05 ? 0.95 : pValue < 0.1 ? 0.9 : 0.0;

    return { pValue, confidenceLevel, sampleSize: n1 + n2 };
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
        deltas.averageVisualClarity > -0.5 &&
        deltas.successRate > -0.05 &&
        deltas.averageCharacterAccuracy > -5;

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
        TEST_SCENE_IDS,
        SAMPLE_SIZE,
    );

    // Load or generate experiment results
    console.log(`\n📊 Loading Experiment Results (${EXPERIMENT_VERSION})...`);
    const experimentData = await loadOrGenerateResults(
        EXPERIMENT_VERSION,
        TEST_SCENE_IDS,
        SAMPLE_SIZE,
    );

    if (
        controlData.results.length === 0 ||
        experimentData.results.length === 0
    ) {
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
            testScenes: TEST_SCENE_IDS,
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
        (m) => `    + ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(2)}`,
    )
    .join("\n")}

  Top Regressions:
${regressions
    .slice(0, 5)
    .map(
        (m) => `    - ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(2)}`,
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
