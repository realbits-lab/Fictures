#!/usr/bin/env tsx

/**
 * A/B Testing Script - Compare prompt versions
 *
 * Usage:
 *   pnpm tsx test-scripts/iteration-testing/ab-test.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --prompts "last-garden" \
 *     --sample-size 5
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestPrompt } from "./config/test-prompts";
import {
    aggregateMetrics,
    calculateMetricStatistics,
    compareMetrics,
} from "./src/metrics-tracker";
import type {
    ABTestConfig,
    ABTestResult,
    MetricDelta,
    MetricSnapshot,
    TestStoryResult,
} from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        control: { type: "string", default: "v1.0" },
        experiment: { type: "string", default: "v1.1" },
        prompts: { type: "string" },
        "sample-size": { type: "string", default: "5" },
        hypothesis: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
A/B Testing Script - Compare prompt versions

Usage:
  pnpm tsx test-scripts/iteration-testing/ab-test.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --prompts      <string>  Comma-separated test prompt IDs (default: last-garden)
  --sample-size  <number>  Stories per version (default: 5)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message

Examples:
  # Basic A/B test
  pnpm tsx test-scripts/iteration-testing/ab-test.ts --control v1.0 --experiment v1.1

  # Test with specific prompts
  pnpm tsx test-scripts/iteration-testing/ab-test.ts --prompts "last-garden,broken-healer"

  # Test with hypothesis
  pnpm tsx test-scripts/iteration-testing/ab-test.ts \\
    --hypothesis "Virtue scenes will increase from 683 to 900+ words"
  `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const SAMPLE_SIZE = parseInt(values["sample-size"] || "5", 10);
const TEST_PROMPT_IDS = values.prompts
    ? values.prompts.split(",").map((s) => s.trim())
    : ["last-garden"];
const HYPOTHESIS =
    values.hypothesis || "Experiment version will improve metrics";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/ab-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
                    A/B TESTING - PROMPT COMPARISON
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Prompts:   ${TEST_PROMPT_IDS.join(", ")}
  Sample Size:    ${SAMPLE_SIZE} stories per version
  Total Stories:  ${SAMPLE_SIZE * TEST_PROMPT_IDS.length * 2}

  Hypothesis:     ${HYPOTHESIS}
═══════════════════════════════════════════════════════════════
`);

/**
 * Load test results from file or generate new ones
 */
async function loadOrGenerateResults(
    version: string,
    prompts: string[],
    sampleSize: number,
): Promise<TestStoryResult[]> {
    // Check if results already exist
    const resultsFile = `results/${version}/suite-latest.json`;

    try {
        const existingData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(existingData);

        // Filter results for requested prompts
        const filteredResults = suiteResult.stories.filter(
            (story: TestStoryResult) => {
                return prompts.some((promptId) => {
                    const testPrompt = getTestPrompt(promptId);
                    return testPrompt && story.prompt === testPrompt.prompt;
                });
            },
        );

        if (filteredResults.length >= sampleSize) {
            console.log(`  ✓ Using existing results from ${resultsFile}`);
            return filteredResults.slice(0, sampleSize);
        }
    } catch (_error) {
        console.log(
            `  → No existing results found for ${version}, will generate new ones`,
        );
    }

    // Generate new results
    console.log(`  → Generating ${sampleSize} stories with ${version}...`);

    // Import and run evaluation suite
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const promptsArg = prompts.join(",");
    const command = `pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts --version ${version} --prompts "${promptsArg}" --iterations ${sampleSize} --mode standard`;

    try {
        console.log(`  → Running: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error(`  ✗ Failed to generate stories:`, error);
        return [];
    }

    // Load the newly generated results
    try {
        const newData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(newData);
        return suiteResult.stories.slice(0, sampleSize);
    } catch (error) {
        console.error(`  ✗ Failed to load generated results:`, error);
        return [];
    }
}

/**
 * Extract metric snapshot from test results
 */
function extractMetricSnapshot(results: TestStoryResult[]): MetricSnapshot {
    const aggregated = aggregateMetrics(results);
    const snapshot: MetricSnapshot = {};

    // Flatten all metrics into single snapshot
    for (const principle of Object.values(aggregated)) {
        for (const [metricName, value] of Object.entries(principle)) {
            snapshot[metricName] = value as number;
        }
    }

    return snapshot;
}

/**
 * Calculate t-test p-value for statistical significance
 */
function calculateTTest(control: number[], experiment: number[]): number {
    if (control.length === 0 || experiment.length === 0) return 1.0;

    const controlStats = calculateMetricStatistics(control);
    const experimentStats = calculateMetricStatistics(experiment);

    // Welch's t-test (for potentially unequal variances)
    const t =
        (experimentStats.mean - controlStats.mean) /
        Math.sqrt(
            controlStats.variance / control.length +
                experimentStats.variance / experiment.length,
        );

    // Degrees of freedom (Welch-Satterthwaite equation)
    const _df =
        (controlStats.variance / control.length +
            experimentStats.variance / experiment.length) **
            2 /
        ((controlStats.variance / control.length) ** 2 / (control.length - 1) +
            (experimentStats.variance / experiment.length) ** 2 /
                (experiment.length - 1));

    // Approximate p-value (two-tailed)
    // This is a simplified approximation - in production, use a proper statistics library
    const pValue = 2 * (1 - normalCDF(Math.abs(t), 0, 1));
    return Math.min(1, Math.max(0, pValue));
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(x: number, mean: number, stdDev: number): number {
    const z = (x - mean) / stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const prob =
        d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
}

/**
 * Make recommendation based on test results
 */
function makeRecommendation(
    deltas: Record<string, MetricDelta>,
    pValue: number,
): "ADOPT" | "REVISE" | "REVERT" {
    // Check statistical significance
    if (pValue > 0.05) {
        console.log(
            `  ⚠ Results not statistically significant (p=${pValue.toFixed(3)})`,
        );
        return "REVERT";
    }

    // Count improvements vs regressions
    let improvements = 0;
    let regressions = 0;
    let majorRegressions = 0;

    for (const delta of Object.values(deltas)) {
        if (delta.improved) {
            improvements++;
        } else if (delta.percentage < -5) {
            regressions++;
            if (delta.percentage < -20) {
                majorRegressions++;
            }
        }
    }

    console.log(
        `  → Improvements: ${improvements}, Regressions: ${regressions}, Major: ${majorRegressions}`,
    );

    // Decision logic
    if (majorRegressions > 0) {
        return "REVERT"; // Major regression detected
    }
    if (improvements > regressions * 2) {
        return "ADOPT"; // Clear improvement
    }
    if (improvements > regressions) {
        return "REVISE"; // Mixed results, needs refinement
    }
    return "REVERT"; // More regressions than improvements
}

/**
 * Main execution
 */
async function main() {
    const startTime = Date.now();

    // Load or generate control results
    console.log(`\n► Loading Control Results (${CONTROL_VERSION})...`);
    const controlResults = await loadOrGenerateResults(
        CONTROL_VERSION,
        TEST_PROMPT_IDS,
        SAMPLE_SIZE,
    );

    if (controlResults.length === 0) {
        console.error("✗ Failed to load control results");
        process.exit(1);
    }

    // Load or generate experiment results
    console.log(`\n► Loading Experiment Results (${EXPERIMENT_VERSION})...`);
    const experimentResults = await loadOrGenerateResults(
        EXPERIMENT_VERSION,
        TEST_PROMPT_IDS,
        SAMPLE_SIZE,
    );

    if (experimentResults.length === 0) {
        console.error("✗ Failed to load experiment results");
        process.exit(1);
    }

    // Extract metric snapshots
    console.log(`\n► Analyzing Results...`);
    const controlSnapshot = extractMetricSnapshot(controlResults);
    const experimentSnapshot = extractMetricSnapshot(experimentResults);

    // Calculate deltas
    const metricDeltas = compareMetrics(controlSnapshot, experimentSnapshot);
    const deltasMap: Record<string, MetricDelta> = {};
    for (const delta of metricDeltas) {
        deltasMap[delta.metric] = delta;
    }

    // Calculate statistical significance
    const _keyMetrics = [
        "gamdongAchievement",
        "sceneQualityScore",
        "virtueSceneWordCount",
    ];
    const controlValues = controlResults.map(
        (r) => r.corePrincipleScores.emotionalResonance,
    );
    const experimentValues = experimentResults.map(
        (r) => r.corePrincipleScores.emotionalResonance,
    );
    const pValue = calculateTTest(controlValues, experimentValues);

    // Make recommendation
    const recommendation = makeRecommendation(deltasMap, pValue);

    // Create A/B test result
    const config: ABTestConfig = {
        controlVersion: CONTROL_VERSION,
        experimentVersion: EXPERIMENT_VERSION,
        testPrompts: TEST_PROMPT_IDS,
        sampleSize: SAMPLE_SIZE,
        hypothesis: HYPOTHESIS,
        expectedImprovement: "See hypothesis",
    };

    const result: ABTestResult = {
        config,
        control: controlResults,
        experiment: experimentResults,
        comparison: {
            deltas: deltasMap,
            pValue,
            recommendation,
        },
        testDate: new Date().toISOString(),
    };

    // Save results
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));

    // Display results
    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log(`
═══════════════════════════════════════════════════════════════
                        A/B TEST RESULTS
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION} (${controlResults.length} stories)
  Experiment:     ${EXPERIMENT_VERSION} (${experimentResults.length} stories)
  Statistical Significance: p=${pValue.toFixed(4)} ${pValue < 0.05 ? "✓" : "✗"}

  TOP IMPROVEMENTS:
${metricDeltas
    .slice(0, 3)
    .map(
        (d) =>
            `  • ${d.metric}: ${(d.baseline * 100).toFixed(0)}% → ${(d.experiment * 100).toFixed(0)}% (${d.percentage > 0 ? "+" : ""}${d.percentage.toFixed(1)}%)`,
    )
    .join("\n")}

  TOP REGRESSIONS:
${metricDeltas
    .slice(-3)
    .map(
        (d) =>
            `  • ${d.metric}: ${(d.baseline * 100).toFixed(0)}% → ${(d.experiment * 100).toFixed(0)}% (${d.percentage > 0 ? "+" : ""}${d.percentage.toFixed(1)}%)`,
    )
    .join("\n")}

  RECOMMENDATION: ${recommendation}
  ${
      recommendation === "ADOPT"
          ? "✅ Experiment shows significant improvement"
          : recommendation === "REVISE"
            ? "⚠️ Mixed results - needs refinement"
            : "❌ Control performs better - revert changes"
  }

  Total Time:     ${totalTime.toFixed(1)} minutes
  Results Saved:  ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

    // Generate detailed report
    const reportFile = OUTPUT_FILE.replace(".json", "-report.md");
    const report = generateABTestReport(result);
    await fs.writeFile(reportFile, report);
    console.log(`  Report saved: ${reportFile}`);
}

/**
 * Generate markdown report for A/B test
 */
function generateABTestReport(result: ABTestResult): string {
    let report = `# A/B Test Report: ${result.config.controlVersion} vs ${result.config.experimentVersion}\n\n`;
    report += `**Date**: ${new Date(result.testDate).toLocaleDateString()}\n`;
    report += `**Hypothesis**: ${result.config.hypothesis}\n`;
    report += `**Sample Size**: ${result.config.sampleSize} stories per version\n`;
    report += `**Statistical Significance**: p=${result.comparison.pValue.toFixed(4)} `;
    report +=
        result.comparison.pValue < 0.05
            ? "✅ Significant\n\n"
            : "❌ Not Significant\n\n";

    // Recommendation
    report += `## Recommendation: ${result.comparison.recommendation}\n\n`;
    if (result.comparison.recommendation === "ADOPT") {
        report +=
            "✅ **ADOPT** - The experiment version shows significant improvements with minimal regressions.\n\n";
    } else if (result.comparison.recommendation === "REVISE") {
        report +=
            "⚠️ **REVISE** - Mixed results. Some improvements but also concerning regressions. Further refinement needed.\n\n";
    } else {
        report +=
            "❌ **REVERT** - The control version performs better or results are not statistically significant.\n\n";
    }

    // Top Improvements
    report += "## Top Improvements\n\n";
    report += "| Metric | Control | Experiment | Change |\n";
    report += "|--------|---------|------------|--------|\n";

    const improvements = Object.values(result.comparison.deltas)
        .filter((d) => d.improved)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

    for (const delta of improvements) {
        report += `| ${delta.metric} | ${(delta.baseline * 100).toFixed(1)}% | ${(delta.experiment * 100).toFixed(1)}% | +${delta.percentage.toFixed(1)}% |\n`;
    }

    // Regressions
    report += "\n## Regressions\n\n";
    const regressions = Object.values(result.comparison.deltas)
        .filter((d) => !d.improved && d.percentage < -1)
        .sort((a, b) => a.percentage - b.percentage);

    if (regressions.length > 0) {
        report += "| Metric | Control | Experiment | Change |\n";
        report += "|--------|---------|------------|--------|\n";
        for (const delta of regressions) {
            report += `| ${delta.metric} | ${(delta.baseline * 100).toFixed(1)}% | ${(delta.experiment * 100).toFixed(1)}% | ${delta.percentage.toFixed(1)}% |\n`;
        }
    } else {
        report += "No significant regressions detected.\n";
    }

    // Core Principles Summary
    report += "\n## Core Principles Summary\n\n";
    const principles = [
        "cyclicStructure",
        "intrinsicMotivation",
        "earnedConsequence",
        "characterTransformation",
        "emotionalResonance",
    ];

    for (const principle of principles) {
        const principleMetrics = Object.values(result.comparison.deltas).filter(
            (d) =>
                d.metric
                    .toLowerCase()
                    .includes(
                        principle
                            .toLowerCase()
                            .replace(/[A-Z]/g, (m) => m.toLowerCase()),
                    ),
        );

        if (principleMetrics.length > 0) {
            const avgImprovement =
                principleMetrics.reduce((sum, d) => sum + d.percentage, 0) /
                principleMetrics.length;
            const label = principle.replace(/([A-Z])/g, " $1").trim();
            report += `- **${label}**: ${avgImprovement > 0 ? "+" : ""}${avgImprovement.toFixed(1)}% average change\n`;
        }
    }

    return report;
}

// Run the A/B test
main().catch(console.error);
