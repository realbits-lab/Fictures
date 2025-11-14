#!/usr/bin/env tsx

/**
 * A/B Testing Script - Compare toonplay prompt versions
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --scenes "emotional-moment" \
 *     --sample-size 5
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScene } from "./config/test-scenes";
import { calculateStatisticalSignificance } from "./src/metrics-tracker";
import type {
    ABTestComparison,
    AggregatedToonplayMetrics,
    ToonplayTestResult,
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
A/B Testing Script - Compare toonplay prompt versions

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --scenes       <string>  Comma-separated test scene IDs (default: emotional-moment)
  --sample-size  <number>  Toonplays per version (default: 5)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message

Examples:
  # Basic A/B test
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts --control v1.0 --experiment v1.1

  # Test with specific scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts --scenes "emotional-moment,action-sequence"

  # Test with hypothesis
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/ab-test-toonplay.ts \\
    --hypothesis "Reduce narration from 8% to <5%"
  `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const SAMPLE_SIZE = parseInt(values["sample-size"] || "5", 10);
const TEST_SCENE_IDS = values.scenes
    ? values.scenes.split(",").map((s) => s.trim())
    : ["emotional-moment"];
const HYPOTHESIS =
    values.hypothesis || "Experiment version will improve toonplay quality";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/ab-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
              A/B TESTING - TOONPLAY PROMPT COMPARISON
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Scenes:    ${TEST_SCENE_IDS.join(", ")}
  Sample Size:    ${SAMPLE_SIZE} toonplays per version
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
    results: ToonplayTestResult[];
    metrics: AggregatedToonplayMetrics;
}> {
    // Check if results already exist
    const resultsFile = `results/${version}/suite-latest.json`;

    try {
        const existingData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(existingData);

        // Filter results for requested scenes
        const filteredResults = suiteResult.toonplays.filter(
            (toonplay: ToonplayTestResult) => {
                return scenes.some((sceneId) => {
                    const testScene = getTestScene(sceneId);
                    return testScene && toonplay.sceneName === testScene.name;
                });
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
    console.log(`  → Generating ${sampleSize} toonplays with ${version}...`);

    // Import and run test suite
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);

    const scenesArg = scenes.join(",");
    const command = `dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts --version ${version} --scenes "${scenesArg}" --iterations ${sampleSize} --mode standard --output results/${version}/suite-latest.json`;

    try {
        console.log(`  → Running: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error(`  ✗ Failed to generate toonplays:`, error);
        return { results: [], metrics: {} as AggregatedToonplayMetrics };
    }

    // Load the newly generated results
    try {
        const newData = await fs.readFile(resultsFile, "utf-8");
        const suiteResult = JSON.parse(newData);
        return {
            results: suiteResult.toonplays.slice(0, sampleSize),
            metrics: suiteResult.aggregatedMetrics,
        };
    } catch (error) {
        console.error(`  ✗ Failed to load generated results:`, error);
        return { results: [], metrics: {} as AggregatedToonplayMetrics };
    }
}

/**
 * Calculate metric deltas between control and experiment
 */
function calculateMetricDeltas(
    control: AggregatedToonplayMetrics,
    experiment: AggregatedToonplayMetrics,
): Record<string, number> {
    const deltas: Record<string, number> = {};

    // Core quality metrics
    deltas.averageWeightedScore =
        experiment.averageWeightedScore - control.averageWeightedScore;
    deltas.passRate = experiment.passRate - control.passRate;
    deltas.firstPassSuccessRate =
        experiment.firstPassSuccessRate - control.firstPassSuccessRate;

    // Content proportions (negative is better for narration/monologue)
    deltas.narrationPercentage =
        experiment.averageNarrationPercentage -
        control.averageNarrationPercentage;
    deltas.internalMonologuePercentage =
        experiment.averageInternalMonologuePercentage -
        control.averageInternalMonologuePercentage;
    deltas.dialoguePresence =
        experiment.averageDialoguePresence - control.averageDialoguePresence;

    // Compliance rates (higher is better)
    deltas.narrationComplianceRate =
        experiment.narrationComplianceRate - control.narrationComplianceRate;
    deltas.internalMonologueComplianceRate =
        experiment.internalMonologueComplianceRate -
        control.internalMonologueComplianceRate;
    deltas.dialogueTargetRate =
        experiment.dialogueTargetRate - control.dialogueTargetRate;

    // Category scores (higher is better)
    deltas.narrativeFidelity =
        experiment.categoryAverages.narrativeFidelity -
        control.categoryAverages.narrativeFidelity;
    deltas.visualTransformation =
        experiment.categoryAverages.visualTransformation -
        control.categoryAverages.visualTransformation;
    deltas.webtoonPacing =
        experiment.categoryAverages.webtoonPacing -
        control.categoryAverages.webtoonPacing;
    deltas.scriptFormatting =
        experiment.categoryAverages.scriptFormatting -
        control.categoryAverages.scriptFormatting;

    // Visual quality
    deltas.shotVariety =
        experiment.averageShotVariety - control.averageShotVariety;
    deltas.verticalFlowQuality =
        experiment.averageVerticalFlowQuality -
        control.averageVerticalFlowQuality;
    deltas.panelPacingRhythm =
        experiment.averagePanelPacingRhythm - control.averagePanelPacingRhythm;

    // Generation performance
    deltas.generationTime =
        experiment.averageGenerationTime - control.averageGenerationTime;
    deltas.iterations =
        experiment.averageIterations - control.averageIterations;

    return deltas;
}

/**
 * Identify improvements and regressions
 */
function categorizeChanges(deltas: Record<string, number>): {
    improvements: string[];
    regressions: string[];
    neutral: string[];
} {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const neutral: string[] = [];

    // Metrics where lower is better (negative deltas are improvements)
    const lowerIsBetter = [
        "narrationPercentage",
        "internalMonologuePercentage",
        "generationTime",
        "iterations",
    ];

    for (const [metric, delta] of Object.entries(deltas)) {
        const isLowerBetter = lowerIsBetter.includes(metric);
        const threshold = 0.05; // 5% threshold for significance

        if (Math.abs(delta) < threshold) {
            neutral.push(metric);
        } else if (
            (isLowerBetter && delta < -threshold) ||
            (!isLowerBetter && delta > threshold)
        ) {
            improvements.push(metric);
        } else {
            regressions.push(metric);
        }
    }

    return { improvements, regressions, neutral };
}

/**
 * Make recommendation based on test results
 */
function makeRecommendation(
    _deltas: Record<string, number>,
    pValue: number,
    improvements: string[],
    regressions: string[],
): "ADOPT" | "REVISE" | "REVERT" {
    // Check statistical significance
    if (pValue > 0.05) {
        console.log(
            `  ⚠ Results not statistically significant (p=${pValue.toFixed(3)})`,
        );
        return "REVERT";
    }

    // Check for critical regressions (major quality drops)
    const criticalMetrics = [
        "averageWeightedScore",
        "passRate",
        "narrativeFidelity",
        "visualTransformation",
        "webtoonPacing",
    ];
    const criticalRegressions = regressions.filter((m) =>
        criticalMetrics.includes(m),
    );

    if (criticalRegressions.length > 0) {
        console.log(
            `  ⚠ Critical regressions detected: ${criticalRegressions.join(", ")}`,
        );
        return "REVERT";
    }

    // Decision logic
    const improvementRatio = improvements.length / (regressions.length || 1);

    if (improvementRatio >= 2.0) {
        return "ADOPT"; // Clear improvement
    }
    if (improvementRatio >= 1.0) {
        return "REVISE"; // Mixed results, needs refinement
    }
    return "REVERT"; // More regressions than improvements
}

/**
 * Generate markdown report
 */
function generateReport(result: ABTestComparison): string {
    let report = `# A/B Test Report: ${result.config.controlVersion} vs ${result.config.experimentVersion}\n\n`;
    report += `**Date**: ${new Date(result.config.testDate).toLocaleDateString()}\n`;
    report += `**Hypothesis**: ${result.config.hypothesis}\n`;
    report += `**Sample Size**: ${result.config.sampleSize} toonplays per version\n`;
    report += `**Scenes Tested**: ${result.config.testScenes.join(", ")}\n`;
    report += `**Statistical Significance**: p=${result.comparison.statisticalSignificance.pValue.toFixed(4)} `;
    report +=
        result.comparison.statisticalSignificance.pValue < 0.05
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

    // Reasoning
    report += `## Analysis\n\n${result.comparison.reasoning}\n\n`;

    // Top Improvements
    if (result.comparison.improvements.length > 0) {
        report += "## Top Improvements\n\n";
        report += "| Metric | Control | Experiment | Change |\n";
        report += "|--------|---------|------------|--------|\n";

        for (const metric of result.comparison.improvements.slice(0, 5)) {
            const delta = result.comparison.deltas[metric];
            const controlValue =
                result.control[metric as keyof AggregatedToonplayMetrics];
            const experimentValue =
                result.experiment[metric as keyof AggregatedToonplayMetrics];
            report += `| ${metric} | ${typeof controlValue === "number" ? controlValue.toFixed(2) : controlValue} | ${typeof experimentValue === "number" ? experimentValue.toFixed(2) : experimentValue} | ${delta > 0 ? "+" : ""}${delta.toFixed(2)} |\n`;
        }
        report += "\n";
    }

    // Regressions
    if (result.comparison.regressions.length > 0) {
        report += "## Regressions\n\n";
        report += "| Metric | Control | Experiment | Change |\n";
        report += "|--------|---------|------------|--------|\n";

        for (const metric of result.comparison.regressions) {
            const delta = result.comparison.deltas[metric];
            const controlValue =
                result.control[metric as keyof AggregatedToonplayMetrics];
            const experimentValue =
                result.experiment[metric as keyof AggregatedToonplayMetrics];
            report += `| ${metric} | ${typeof controlValue === "number" ? controlValue.toFixed(2) : controlValue} | ${typeof experimentValue === "number" ? experimentValue.toFixed(2) : experimentValue} | ${delta > 0 ? "+" : ""}${delta.toFixed(2)} |\n`;
        }
        report += "\n";
    }

    // Neutral Changes
    if (result.comparison.neutral.length > 0) {
        report += "## Neutral Changes (No significant impact)\n\n";
        report += result.comparison.neutral.map((m) => `- ${m}`).join("\n");
        report += "\n\n";
    }

    return report;
}

/**
 * Main execution
 */
async function main() {
    const startTime = Date.now();

    // Load or generate control results
    console.log(`\n► Loading Control Results (${CONTROL_VERSION})...`);
    const controlData = await loadOrGenerateResults(
        CONTROL_VERSION,
        TEST_SCENE_IDS,
        SAMPLE_SIZE,
    );

    if (controlData.results.length === 0) {
        console.error("✗ Failed to load control results");
        process.exit(1);
    }

    // Load or generate experiment results
    console.log(`\n► Loading Experiment Results (${EXPERIMENT_VERSION})...`);
    const experimentData = await loadOrGenerateResults(
        EXPERIMENT_VERSION,
        TEST_SCENE_IDS,
        SAMPLE_SIZE,
    );

    if (experimentData.results.length === 0) {
        console.error("✗ Failed to load experiment results");
        process.exit(1);
    }

    // Calculate deltas
    console.log(`\n► Analyzing Results...`);
    const deltas = calculateMetricDeltas(
        controlData.metrics,
        experimentData.metrics,
    );

    // Categorize changes
    const { improvements, regressions, neutral } = categorizeChanges(deltas);

    // Calculate statistical significance
    const controlScores = controlData.results.map(
        (r) => r.evaluation.weightedScore,
    );
    const experimentScores = experimentData.results.map(
        (r) => r.evaluation.weightedScore,
    );
    const { pValue, confidenceLevel } = calculateStatisticalSignificance(
        controlScores,
        experimentScores,
    );

    // Make recommendation
    const recommendation = makeRecommendation(
        deltas,
        pValue,
        improvements,
        regressions,
    );

    // Generate reasoning
    let reasoning = `Statistical analysis (p=${pValue.toFixed(4)}, confidence=${(confidenceLevel * 100).toFixed(1)}%) `;
    reasoning +=
        pValue < 0.05
            ? "shows significant differences. "
            : "shows no significance. ";
    reasoning += `Found ${improvements.length} improvements, ${regressions.length} regressions, and ${neutral.length} neutral changes. `;

    if (recommendation === "ADOPT") {
        reasoning +=
            "The experiment version demonstrates clear improvements in key metrics without critical regressions.";
    } else if (recommendation === "REVISE") {
        reasoning +=
            "Results are mixed with both improvements and regressions. Further refinement recommended.";
    } else {
        reasoning +=
            "The control version performs better or results lack statistical significance.";
    }

    // Create A/B test result
    const result: ABTestComparison = {
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
            statisticalSignificance: {
                pValue,
                confidenceLevel,
                sampleSize: SAMPLE_SIZE,
            },
            improvements,
            regressions,
            neutral,
            recommendation,
            reasoning,
        },
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
  Control:        ${CONTROL_VERSION} (${controlData.results.length} toonplays)
  Experiment:     ${EXPERIMENT_VERSION} (${experimentData.results.length} toonplays)
  Statistical Significance: p=${pValue.toFixed(4)} ${pValue < 0.05 ? "✓" : "✗"}

  KEY METRICS COMPARISON:

  Quality Scores:
  • Weighted Score:     ${controlData.metrics.averageWeightedScore.toFixed(2)} → ${experimentData.metrics.averageWeightedScore.toFixed(2)} (${deltas.averageWeightedScore > 0 ? "+" : ""}${deltas.averageWeightedScore.toFixed(2)})
  • Pass Rate:          ${(controlData.metrics.passRate * 100).toFixed(0)}% → ${(experimentData.metrics.passRate * 100).toFixed(0)}% (${deltas.passRate > 0 ? "+" : ""}${(deltas.passRate * 100).toFixed(1)}%)

  Content Proportions:
  • Narration:          ${controlData.metrics.averageNarrationPercentage.toFixed(1)}% → ${experimentData.metrics.averageNarrationPercentage.toFixed(1)}% (${deltas.narrationPercentage > 0 ? "+" : ""}${deltas.narrationPercentage.toFixed(1)}%)
  • Internal Monologue: ${controlData.metrics.averageInternalMonologuePercentage.toFixed(1)}% → ${experimentData.metrics.averageInternalMonologuePercentage.toFixed(1)}% (${deltas.internalMonologuePercentage > 0 ? "+" : ""}${deltas.internalMonologuePercentage.toFixed(1)}%)
  • Dialogue:           ${controlData.metrics.averageDialoguePresence.toFixed(1)}% → ${experimentData.metrics.averageDialoguePresence.toFixed(1)}% (${deltas.dialoguePresence > 0 ? "+" : ""}${deltas.dialoguePresence.toFixed(1)}%)

  TOP IMPROVEMENTS (${improvements.length} total):
${improvements
    .slice(0, 3)
    .map((m) => `  • ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(3)}`)
    .join("\n")}

  TOP REGRESSIONS (${regressions.length} total):
${regressions
    .slice(0, 3)
    .map((m) => `  • ${m}: ${deltas[m] > 0 ? "+" : ""}${deltas[m].toFixed(3)}`)
    .join("\n")}

  RECOMMENDATION: ${recommendation}
  ${recommendation === "ADOPT" ? "✅ Experiment shows significant improvement" : recommendation === "REVISE" ? "⚠️ Mixed results - needs refinement" : "❌ Control performs better - revert changes"}

  Total Time:     ${totalTime.toFixed(1)} minutes
  Results Saved:  ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

    // Generate detailed report
    const reportFile = OUTPUT_FILE.replace(".json", "-report.md");
    const report = generateReport(result);
    await fs.writeFile(reportFile, report);
    console.log(`  Report saved: ${reportFile}`);
}

// Run the A/B test
main().catch(console.error);
