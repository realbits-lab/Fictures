#!/usr/bin/env tsx

/**
 * Chapter Prompt Iteration Test
 *
 * Tests different versions of chapter generation prompts to improve chapter quality metrics.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --iterations 5 \
 *     --prompts "last-garden"
 */

import { resolve } from "node:path";
// Load environment variables from .env.local
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

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
        iterations: { type: "string", default: "5" },
        hypothesis: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Chapter Prompt Iteration Test - Compare chapter generation prompt versions

Usage:
  pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --prompts      <string>  Comma-separated test prompt IDs (default: last-garden)
  --iterations   <number>  Stories per version (default: 5)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message

Examples:
  # Basic chapter prompt test
  pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts --control v1.0 --experiment v1.1

  # Test with specific prompts
  pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts --prompts "last-garden,broken-healer"

  # Test with hypothesis
  pnpm tsx tests/iteration-testing/novels/chapter-prompt-test.ts \\
    --hypothesis "Adversity connection will improve from 2/4 to 4/4"
  `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const ITERATIONS = parseInt(values.iterations || "5", 10);
const TEST_PROMPT_IDS = values.prompts
    ? values.prompts.split(",").map((s) => s.trim())
    : ["last-garden"];
const HYPOTHESIS =
    values.hypothesis ||
    "Experiment version will improve chapter-level metrics (adversity connection, seed tracking, etc.)";

// Configure to use AI server instead of Gemini
// This must be done before any AI client imports
process.env.TEXT_GENERATION_PROVIDER = "ai-server";
process.env.AI_SERVER_TEXT_URL =
    process.env.AI_SERVER_TEXT_URL || "http://localhost:8000";
process.env.AI_SERVER_TEXT_TIMEOUT =
    process.env.AI_SERVER_TEXT_TIMEOUT || "120000";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/chapter-prompt-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
              CHAPTER PROMPT ITERATION TEST
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Prompts:   ${TEST_PROMPT_IDS.join(", ")}
  Iterations:     ${ITERATIONS} stories per version
  Total Stories:  ${ITERATIONS * TEST_PROMPT_IDS.length * 2}

  Hypothesis:     ${HYPOTHESIS}
═══════════════════════════════════════════════════════════════
`);

/**
 * Get authentication context
 */
function getAuthContext() {
    const fs = require("node:fs");
    let apiKey: string | undefined;
    if (fs.existsSync(".auth/user.json")) {
        const authData = JSON.parse(fs.readFileSync(".auth/user.json", "utf8"));
        apiKey = authData.develop?.profiles?.writer?.apiKey;
    }

    if (!apiKey) {
        throw new Error(
            "API key not found in .auth/user.json. Please ensure writer profile exists in develop environment.",
        );
    }

    const { createApiKeyContext } = require("@/lib/auth/context");
    return createApiKeyContext(
        apiKey,
        "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
        "writer@fictures.xyz",
        ["stories:write", "images:write", "ai:use"],
        { requestId: `test-${Date.now()}`, timestamp: Date.now() },
    );
}

/**
 * Generate pre-data (story, characters, settings, part) - shared across both versions
 */
async function generatePreData(
    prompt: string,
): Promise<{ storyId: string; partId: string; generationTime: number }> {
    console.log(
        `  → Generating pre-data (story, characters, settings, part)...`,
    );

    const startTime = Date.now();
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    return await withAuth(authContext, async () => {
        // Import generation services
        const { storyService } = await import(
            "@/lib/studio/services/story-service"
        );
        const { characterService } = await import(
            "@/lib/studio/services/character-service"
        );
        const { settingService } = await import(
            "@/lib/studio/services/setting-service"
        );
        const { partService } = await import(
            "@/lib/studio/services/part-service"
        );

        try {
            // 1. Generate story foundation
            console.log(`    • Generating story foundation...`);
            const storyResult = await storyService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                userPrompt: prompt,
                language: "en",
            });

            const storyId = storyResult.story.id;

            // 2. Generate characters
            console.log(`    • Generating characters...`);
            await characterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                characterCount: 3,
            });

            // 3. Generate settings
            console.log(`    • Generating settings...`);
            await settingService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                settingCount: 3,
            });

            // 4. Generate part
            console.log(`    • Generating part structure...`);
            const partResult = await partService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                partNumber: 1,
            });

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ Pre-data generated in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return {
                storyId,
                partId: partResult.part.id,
                generationTime,
            };
        } catch (error) {
            console.error(`    ✗ Pre-data generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Generate chapters using existing pre-data with specified prompt version
 */
async function generateChaptersWithVersion(
    storyId: string,
    partId: string,
    chapterPromptVersion: string,
): Promise<{ chapterIds: string[]; generationTime: number }> {
    console.log(
        `  → Generating chapters with prompt version ${chapterPromptVersion}...`,
    );

    const startTime = Date.now();
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    return await withAuth(authContext, async () => {
        const { chapterService } = await import(
            "@/lib/studio/services/chapter-service"
        );

        try {
            const chapterIds: string[] = [];

            // Generate 3 chapters for testing (to test chapter-to-chapter connections)
            for (let i = 1; i <= 3; i++) {
                const chapterResult = await chapterService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj",
                    storyId,
                    partId,
                    chapterNumber: i,
                    promptVersion:
                        chapterPromptVersion !== "v1.0"
                            ? chapterPromptVersion
                            : undefined,
                });
                chapterIds.push(chapterResult.chapter.id);
                console.log(`      ✓ Chapter ${i} generated`);
            }

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ 3 chapters generated in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return { chapterIds, generationTime };
        } catch (error) {
            console.error(`    ✗ Chapter generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Evaluate chapters using the chapter evaluation API
 */
async function evaluateChapters(
    chapterIds: string[],
): Promise<Array<{ chapterId: string; evaluation: any }>> {
    console.log(`  → Evaluating ${chapterIds.length} chapters...`);

    const evaluations: Array<{ chapterId: string; evaluation: any }> = [];

    for (const chapterId of chapterIds) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/evaluation/chapter`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chapterId,
                        evaluationMode: "thorough",
                    }),
                },
            );

            if (response.ok) {
                const evaluation = await response.json();
                evaluations.push({ chapterId, evaluation });
                console.log(
                    `    ✓ Chapter ${chapterId.substring(0, 8)}... evaluated (score: ${evaluation.overallScore.toFixed(2)})`,
                );
            } else {
                console.warn(
                    `    ⚠ Chapter ${chapterId.substring(0, 8)}... evaluation failed`,
                );
            }
        } catch (error) {
            console.error(
                `    ✗ Evaluation error for chapter ${chapterId}:`,
                error,
            );
        }
    }

    return evaluations;
}

/**
 * Extract chapter-level metrics from evaluations
 */
function extractChapterMetrics(
    evaluations: Array<{ chapterId: string; evaluation: any }>,
): MetricSnapshot {
    const snapshot: MetricSnapshot = {};

    // Aggregate metrics across all chapters
    const metricSums: Record<string, number> = {};
    const metricCounts: Record<string, number> = {};

    for (const { evaluation } of evaluations) {
        if (evaluation.metrics) {
            for (const [metricName, metric] of Object.entries(
                evaluation.metrics,
            )) {
                if (typeof metric === "object" && "score" in metric) {
                    const score = (metric as { score: number }).score;
                    metricSums[metricName] =
                        (metricSums[metricName] || 0) + score;
                    metricCounts[metricName] =
                        (metricCounts[metricName] || 0) + 1;
                }
            }
        }
    }

    // Calculate averages
    for (const [metricName, sum] of Object.entries(metricSums)) {
        snapshot[metricName] = sum / metricCounts[metricName];
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

    // Approximate p-value (two-tailed)
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

    // Chapter-specific key metrics
    const keyMetrics = [
        "adversityConnection",
        "seedTrackingCompleteness",
        "singleCycleFocus",
        "stakesEscalation",
        "resolutionAdversityTransition",
        "narrativeMomentum",
    ];

    for (const [metricName, delta] of Object.entries(deltas)) {
        if (keyMetrics.some((key) => metricName.includes(key))) {
            if (delta.improved) {
                improvements++;
            } else if (delta.percentage < -5) {
                regressions++;
                if (delta.percentage < -20) {
                    majorRegressions++;
                }
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
 * Delete chapters from database
 */
async function deleteChapters(chapterIds: string[]): Promise<void> {
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    await withAuth(authContext, async () => {
        const { db } = await import("@/lib/db");
        const { chapters } = await import("@/lib/schemas/database");
        const { eq } = await import("drizzle-orm");

        for (const chapterId of chapterIds) {
            try {
                await db.delete(chapters).where(eq(chapters.id, chapterId));
            } catch (error) {
                console.warn(
                    `    ⚠ Failed to delete chapter ${chapterId}:`,
                    error,
                );
            }
        }
    });
}

/**
 * Main execution
 */
async function main() {
    const startTime = Date.now();

    const controlResults: Array<{
        storyId: string;
        chapterIds: string[];
        evaluations: Array<{ chapterId: string; evaluation: any }>;
        metrics: MetricSnapshot;
    }> = [];

    const experimentResults: Array<{
        storyId: string;
        chapterIds: string[];
        evaluations: Array<{ chapterId: string; evaluation: any }>;
        metrics: MetricSnapshot;
    }> = [];

    // For each test prompt and iteration, generate pre-data once and test both versions
    for (const promptId of TEST_PROMPT_IDS) {
        const testPrompt = getTestPrompt(promptId);
        if (!testPrompt) {
            console.warn(`⚠ Unknown prompt ID: ${promptId}`);
            continue;
        }

        for (let i = 0; i < ITERATIONS; i++) {
            console.log(
                `\n  Iteration ${i + 1}/${ITERATIONS} (${testPrompt.name}):`,
            );

            try {
                // Step 1: Generate pre-data once (shared for both versions)
                const {
                    storyId,
                    partId,
                    generationTime: preDataTime,
                } = await generatePreData(testPrompt.prompt);

                // Step 2: Generate chapters with CONTROL version
                console.log(`\n  Testing ${CONTROL_VERSION}...`);
                const controlChapters = await generateChaptersWithVersion(
                    storyId,
                    partId,
                    CONTROL_VERSION,
                );

                const controlEvaluations = await evaluateChapters(
                    controlChapters.chapterIds,
                );
                const controlMetrics =
                    extractChapterMetrics(controlEvaluations);

                controlResults.push({
                    storyId,
                    chapterIds: controlChapters.chapterIds,
                    evaluations: controlEvaluations,
                    metrics: controlMetrics,
                });

                console.log(
                    `  ✓ ${CONTROL_VERSION} complete (${(controlChapters.generationTime / 1000).toFixed(1)}s)`,
                );

                // Step 3: Delete control chapters before generating experiment chapters
                console.log(`    • Deleting ${CONTROL_VERSION} chapters...`);
                await deleteChapters(controlChapters.chapterIds);

                // Step 4: Generate chapters with EXPERIMENT version (using same pre-data)
                console.log(`\n  Testing ${EXPERIMENT_VERSION}...`);
                const experimentChapters = await generateChaptersWithVersion(
                    storyId,
                    partId,
                    EXPERIMENT_VERSION,
                );

                const experimentEvaluations = await evaluateChapters(
                    experimentChapters.chapterIds,
                );
                const experimentMetrics = extractChapterMetrics(
                    experimentEvaluations,
                );

                experimentResults.push({
                    storyId,
                    chapterIds: experimentChapters.chapterIds,
                    evaluations: experimentEvaluations,
                    metrics: experimentMetrics,
                });

                console.log(
                    `  ✓ ${EXPERIMENT_VERSION} complete (${(experimentChapters.generationTime / 1000).toFixed(1)}s)`,
                );
                console.log(
                    `  ✓ Iteration ${i + 1} complete (total: ${((preDataTime + controlChapters.generationTime + experimentChapters.generationTime) / 1000).toFixed(1)}s)`,
                );
            } catch (error) {
                console.error(`  ✗ Iteration ${i + 1} failed:`, error);
            }
        }
    }

    // Aggregate metrics
    console.log(`\n► Analyzing Results...`);

    // Aggregate control metrics
    const controlSnapshot: MetricSnapshot = {};
    for (const result of controlResults) {
        for (const [metricName, value] of Object.entries(result.metrics)) {
            controlSnapshot[metricName] =
                (controlSnapshot[metricName] || 0) + value;
        }
    }
    const controlCount = controlResults.length;
    for (const metricName of Object.keys(controlSnapshot)) {
        controlSnapshot[metricName] /= controlCount;
    }

    // Aggregate experiment metrics
    const experimentSnapshot: MetricSnapshot = {};
    for (const result of experimentResults) {
        for (const [metricName, value] of Object.entries(result.metrics)) {
            experimentSnapshot[metricName] =
                (experimentSnapshot[metricName] || 0) + value;
        }
    }
    const experimentCount = experimentResults.length;
    for (const metricName of Object.keys(experimentSnapshot)) {
        experimentSnapshot[metricName] /= experimentCount;
    }

    // Calculate deltas
    const metricDeltas = compareMetrics(controlSnapshot, experimentSnapshot);
    const deltasMap: Record<string, MetricDelta> = {};
    for (const delta of metricDeltas) {
        deltasMap[delta.metric] = delta;
    }

    // Calculate statistical significance for key metrics
    const keyMetrics = [
        "adversityConnection",
        "seedTrackingCompleteness",
        "singleCycleFocus",
    ];

    const controlValues: number[] = [];
    const experimentValues: number[] = [];

    for (const result of controlResults) {
        for (const metricName of keyMetrics) {
            const value = Object.entries(result.metrics).find(([key]) =>
                key.includes(metricName),
            )?.[1];
            if (value !== undefined) {
                controlValues.push(value);
            }
        }
    }

    for (const result of experimentResults) {
        for (const metricName of keyMetrics) {
            const value = Object.entries(result.metrics).find(([key]) =>
                key.includes(metricName),
            )?.[1];
            if (value !== undefined) {
                experimentValues.push(value);
            }
        }
    }

    const pValue = calculateTTest(controlValues, experimentValues);

    // Make recommendation
    const recommendation = makeRecommendation(deltasMap, pValue);

    // Create test result
    const config: ABTestConfig = {
        controlVersion: CONTROL_VERSION,
        experimentVersion: EXPERIMENT_VERSION,
        testPrompts: TEST_PROMPT_IDS,
        sampleSize: ITERATIONS,
        hypothesis: HYPOTHESIS,
        expectedImprovement: "See hypothesis",
    };

    const result = {
        config,
        control: controlResults,
        experiment: experimentResults,
        comparison: {
            controlSnapshot,
            experimentSnapshot,
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
                  CHAPTER PROMPT TEST RESULTS
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION} (${controlResults.length} stories)
  Experiment:     ${EXPERIMENT_VERSION} (${experimentResults.length} stories)
  Statistical Significance: p=${pValue.toFixed(4)} ${pValue < 0.05 ? "✓" : "✗"}

  CHAPTER-LEVEL METRICS:
${metricDeltas
    .filter((d) =>
        [
            "adversityConnection",
            "seedTracking",
            "singleCycleFocus",
            "stakesEscalation",
            "resolutionAdversityTransition",
            "narrativeMomentum",
        ].some((key) => d.metric.includes(key)),
    )
    .slice(0, 6)
    .map(
        (d) =>
            `  • ${d.metric}: ${d.baseline.toFixed(2)} → ${d.experiment.toFixed(2)} (${d.percentage > 0 ? "+" : ""}${d.percentage.toFixed(1)}%)`,
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
    const report = generateChapterTestReport(result);
    await fs.writeFile(reportFile, report);
    console.log(`  Report saved: ${reportFile}`);
}

/**
 * Generate markdown report for chapter prompt test
 */
function generateChapterTestReport(result: any): string {
    let report = `# Chapter Prompt Test Report: ${result.config.controlVersion} vs ${result.config.experimentVersion}\n\n`;
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
            "✅ **ADOPT** - The experiment version shows significant improvements in chapter-level metrics.\n\n";
    } else if (result.comparison.recommendation === "REVISE") {
        report +=
            "⚠️ **REVISE** - Mixed results. Some improvements but also concerning regressions. Further refinement needed.\n\n";
    } else {
        report +=
            "❌ **REVERT** - The control version performs better or results are not statistically significant.\n\n";
    }

    // Chapter-specific metrics
    report += "## Chapter-Level Metrics Comparison\n\n";
    report += "| Metric | Control | Experiment | Change |\n";
    report += "|--------|---------|------------|--------|\n";

    const chapterMetrics = [
        "adversityConnection",
        "seedTrackingCompleteness",
        "singleCycleFocus",
        "stakesEscalation",
        "resolutionAdversityTransition",
        "narrativeMomentum",
    ];

    const relevantDeltas = Object.values(result.comparison.deltas)
        .filter((d: any) =>
            chapterMetrics.some((key) => d.metric.includes(key)),
        )
        .sort((a: any, b: any) => b.percentage - a.percentage);

    for (const delta of relevantDeltas) {
        const d = delta as MetricDelta;
        report += `| ${d.metric} | ${d.baseline.toFixed(2)} | ${d.experiment.toFixed(2)} | ${d.percentage > 0 ? "+" : ""}${d.percentage.toFixed(1)}% |\n`;
    }

    // Improvements
    report += "\n## Top Improvements\n\n";
    const improvements = relevantDeltas
        .filter((d: any) => d.improved)
        .slice(0, 5);

    if (improvements.length > 0) {
        report += "| Metric | Improvement |\n";
        report += "|--------|-------------|\n";
        for (const delta of improvements) {
            const d = delta as MetricDelta;
            report += `| ${d.metric} | +${d.percentage.toFixed(1)}% |\n`;
        }
    } else {
        report += "No significant improvements detected.\n";
    }

    // Regressions
    report += "\n## Regressions\n\n";
    const regressions = relevantDeltas
        .filter((d: any) => !d.improved && d.percentage < -1)
        .sort((a: any, b: any) => a.percentage - b.percentage);

    if (regressions.length > 0) {
        report += "| Metric | Regression |\n";
        report += "|--------|-----------|\n";
        for (const delta of regressions) {
            const d = delta as MetricDelta;
            report += `| ${d.metric} | ${d.percentage.toFixed(1)}% |\n`;
        }
    } else {
        report += "No significant regressions detected.\n";
    }

    return report;
}

// Run the test
main().catch(console.error);
