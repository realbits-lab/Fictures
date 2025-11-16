#!/usr/bin/env tsx

/**
 * Scene Content Prompt Iteration Test
 * 
 * Tests different versions of scene content generation prompts to improve scene prose quality metrics.
 * 
 * Usage:
 *   pnpm tsx tests/iteration-testing/novels/scene-content-test.ts \
 *     --control v1.0 \
 *     --experiment v1.1 \
 *     --iterations 2 \
 *     --prompts "last-garden"
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "node:path";
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
        iterations: { type: "string", default: "2" },
        hypothesis: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Scene Content Prompt Iteration Test - Compare scene content generation prompt versions

Usage:
  pnpm tsx tests/iteration-testing/novels/scene-content-test.ts [options]

Options:
  --control      <string>  Control version (default: v1.0)
  --experiment   <string>  Experiment version (default: v1.1)
  --prompts      <string>  Comma-separated test prompt IDs (default: last-garden)
  --iterations   <number>  Stories per version (default: 2)
  --hypothesis   <string>  What you expect to improve
  --output       <string>  Output file path
  --help                   Show this help message
    `);
    process.exit(0);
}

// Configuration
const CONTROL_VERSION = values.control || "v1.0";
const EXPERIMENT_VERSION = values.experiment || "v1.1";
const ITERATIONS = parseInt(values.iterations || "2", 10);
const TEST_PROMPT_IDS = values.prompts
    ? values.prompts.split(",").map((s) => s.trim())
    : ["last-garden"];
const HYPOTHESIS =
    values.hypothesis ||
    "Experiment version will improve scene content metrics (word count compliance, cycle alignment, emotional resonance)";

// Configure to use AI server instead of Gemini
process.env.TEXT_GENERATION_PROVIDER = "ai-server";
process.env.AI_SERVER_TEXT_URL = process.env.AI_SERVER_TEXT_URL || "http://localhost:8000";
process.env.AI_SERVER_TEXT_TIMEOUT = process.env.AI_SERVER_TEXT_TIMEOUT || "120000";

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output ||
    `results/scene-content-test-${CONTROL_VERSION}-vs-${EXPERIMENT_VERSION}-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
            SCENE CONTENT PROMPT ITERATION TEST
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION}
  Experiment:     ${EXPERIMENT_VERSION}
  Test Prompts:   ${TEST_PROMPT_IDS.join(", ")}
  Iterations:     ${ITERATIONS} stories per version

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
        "usr_QKl8WRbF-U2u4ymj",
        "writer@fictures.xyz",
        ["stories:write", "images:write", "ai:use"],
        { requestId: `test-${Date.now()}`, timestamp: Date.now() },
    );
}

async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempts = 3,
    delayMs = 2000,
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(
                `    ⚠ Attempt ${attempt}/${attempts} failed:`,
                (error as Error)?.message || error,
            );
            if (attempt < attempts) {
                await new Promise((resolve) =>
                    setTimeout(resolve, delayMs * attempt),
                );
            }
        }
    }
    throw lastError;
}

/**
 * Generate pre-data (story, characters, settings, part, chapter, scene summaries) - shared across both versions
 */
async function generatePreData(
    prompt: string,
): Promise<{ storyId: string; chapterId: string; sceneIds: string[]; generationTime: number }> {
    console.log(`  → Generating pre-data (story, characters, settings, part, chapter, scene summaries)...`);

    const startTime = Date.now();
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    return await withAuth(authContext, async () => {
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
        const { chapterService } = await import(
            "@/lib/studio/services/chapter-service"
        );
        const { sceneSummaryService } = await import(
            "@/lib/studio/services/scene-summary-service"
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

            // 5. Generate 1 chapter for testing
            console.log(`    • Generating chapter...`);
            const chapterResult = await chapterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                partId: partResult.part.id,
                chapterNumber: 1,
            });

            // 6. Generate 5 scene summaries (standard for a chapter)
            console.log(`    • Generating scene summaries...`);
            const sceneIds: string[] = [];
            for (let i = 1; i <= 5; i++) {
                const sceneResult = await sceneSummaryService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj",
                    storyId,
                    chapterId: chapterResult.chapter.id,
                });
                sceneIds.push(sceneResult.scene.id);
            }

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ Pre-data generated in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return {
                storyId,
                chapterId: chapterResult.chapter.id,
                sceneIds,
                generationTime,
            };
        } catch (error) {
            console.error(`    ✗ Pre-data generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Generate scene content using existing scene summaries with specified prompt version
 */
async function generateSceneContentWithVersion(
    sceneIds: string[],
    sceneContentPromptVersion: string,
): Promise<{ sceneIds: string[]; generationTime: number }> {
    console.log(
        `  → Generating scene content with prompt version ${sceneContentPromptVersion}...`,
    );

    const startTime = Date.now();
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    return await withAuth(authContext, async () => {
        const { sceneContentService } = await import(
            "@/lib/studio/services/scene-content-service"
        );

        try {
            // Generate content for all scenes
            for (const sceneId of sceneIds) {
                await sceneContentService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj",
                    sceneId,
                    promptVersion:
                        sceneContentPromptVersion !== "v1.0"
                            ? sceneContentPromptVersion
                            : undefined,
                });
                console.log(`      ✓ Scene content generated for ${sceneId.substring(0, 8)}...`);
            }

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ Scene content generated for ${sceneIds.length} scenes in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return { sceneIds, generationTime };
        } catch (error) {
            console.error(`    ✗ Scene content generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Delete scene content (but keep scene summaries)
 */
async function clearSceneContent(sceneIds: string[]): Promise<void> {
    const authContext = getAuthContext();
    const { withAuth } = await import("@/lib/auth/server-context");

    await withAuth(authContext, async () => {
        const { db } = await import("@/lib/db");
        const { scenes } = await import("@/lib/schemas/database");
        const { eq } = await import("drizzle-orm");

        for (const sceneId of sceneIds) {
            try {
                await db
                    .update(scenes)
                    .set({ content: null })
                    .where(eq(scenes.id, sceneId));
            } catch (error) {
                console.warn(`    ⚠ Failed to clear content for scene ${sceneId}:`, error);
            }
        }
    });
}

/**
 * Evaluate scene content using the scene content evaluation API
 */
async function evaluateSceneContent(
    sceneIds: string[],
): Promise<Array<{ sceneId: string; evaluation: any }>> {
    console.log(`  → Evaluating ${sceneIds.length} scene content...`);

    const evaluations: Array<{ sceneId: string; evaluation: any }> = [];

    for (const sceneId of sceneIds) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/evaluation/scene-content`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sceneId,
                        evaluationMode: "thorough",
                    }),
                },
            );

            if (response.ok) {
                const evaluation = await response.json();
                evaluations.push({ sceneId, evaluation });
                console.log(
                    `    ✓ Scene ${sceneId.substring(0, 8)}... evaluated (score: ${evaluation.overallScore.toFixed(2)})`,
                );
            } else {
                console.warn(
                    `    ⚠ Scene ${sceneId.substring(0, 8)}... evaluation failed`,
                );
            }
        } catch (error) {
            console.error(`    ✗ Evaluation error for scene ${sceneId}:`, error);
        }
    }

    return evaluations;
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
 * Extract scene content metrics from evaluations
 */
function extractSceneContentMetrics(
    evaluations: Array<{ sceneId: string; evaluation: any }>,
): MetricSnapshot {
    const snapshot: MetricSnapshot = {};

    const metricSums: Record<string, number> = {};
    const metricCounts: Record<string, number> = {};

    for (const { evaluation } of evaluations) {
        if (evaluation.metrics) {
            for (const [metricName, metric] of Object.entries(
                evaluation.metrics,
            )) {
                if (typeof metric === "object" && "score" in metric) {
                    const score = (metric as { score: number }).score;
                    metricSums[metricName] = (metricSums[metricName] || 0) + score;
                    metricCounts[metricName] = (metricCounts[metricName] || 0) + 1;
                }
            }
        }
    }

    for (const [metricName, sum] of Object.entries(metricSums)) {
        const count = metricCounts[metricName];
        if (count > 0) {
            snapshot[metricName] = sum / count;
        }
    }

    return snapshot;
}

/**
 * Main execution
 */
async function main() {
    const startTime = Date.now();

    const controlResults: Array<{
        storyId: string;
        chapterId: string;
        sceneIds: string[];
        evaluations: Array<{ sceneId: string; evaluation: any }>;
        metrics: MetricSnapshot;
    }> = [];

    const experimentResults: Array<{
        storyId: string;
        chapterId: string;
        sceneIds: string[];
        evaluations: Array<{ sceneId: string; evaluation: any }>;
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
            console.log(`\n  Iteration ${i + 1}/${ITERATIONS} (${testPrompt.name}):`);

            try {
                // Step 1: Generate pre-data once (shared for both versions)
                const { storyId, chapterId, sceneIds, generationTime: preDataTime } =
                    await retryWithBackoff(
                        () => generatePreData(testPrompt.prompt),
                        3,
                        2000,
                    );

                // Step 2: Generate scene content with CONTROL version
                console.log(`\n  Testing ${CONTROL_VERSION}...`);
                const controlContent = await retryWithBackoff(
                    () =>
                        generateSceneContentWithVersion(
                            sceneIds,
                            CONTROL_VERSION,
                        ),
                    2,
                    2000,
                );

                const controlEvaluations = await evaluateSceneContent(
                    controlContent.sceneIds,
                );
                const controlMetrics = extractSceneContentMetrics(controlEvaluations);

                controlResults.push({
                    storyId,
                    chapterId,
                    sceneIds: controlContent.sceneIds,
                    evaluations: controlEvaluations,
                    metrics: controlMetrics,
                });

                console.log(
                    `  ✓ ${CONTROL_VERSION} complete (${(controlContent.generationTime / 1000).toFixed(1)}s)`,
                );

                // Step 3: Clear control content before generating experiment content
                console.log(`    • Clearing ${CONTROL_VERSION} content...`);
                await clearSceneContent(controlContent.sceneIds);

                // Step 4: Generate scene content with EXPERIMENT version (using same pre-data)
                console.log(`\n  Testing ${EXPERIMENT_VERSION}...`);
                const experimentContent = await retryWithBackoff(
                    () =>
                        generateSceneContentWithVersion(
                            sceneIds,
                            EXPERIMENT_VERSION,
                        ),
                    2,
                    2000,
                );

                const experimentEvaluations = await evaluateSceneContent(
                    experimentContent.sceneIds,
                );
                const experimentMetrics = extractSceneContentMetrics(
                    experimentEvaluations,
                );

                experimentResults.push({
                    storyId,
                    chapterId,
                    sceneIds: experimentContent.sceneIds,
                    evaluations: experimentEvaluations,
                    metrics: experimentMetrics,
                });

                console.log(
                    `  ✓ ${EXPERIMENT_VERSION} complete (${(experimentContent.generationTime / 1000).toFixed(1)}s)`,
                );
                console.log(
                    `  ✓ Iteration ${i + 1} complete (total: ${((preDataTime + controlContent.generationTime + experimentContent.generationTime) / 1000).toFixed(1)}s)`,
                );
            } catch (error) {
                console.error(`  ✗ Iteration ${i + 1} failed:`, error);
            }
        }
    }

    // Aggregate metrics
    console.log(`\n► Analyzing Results...`);

    const controlSnapshot: MetricSnapshot = {};
    const experimentSnapshot: MetricSnapshot = {};

    for (const result of controlResults) {
        for (const [metric, value] of Object.entries(result.metrics)) {
            controlSnapshot[metric] = (controlSnapshot[metric] || 0) + value;
        }
    }

    for (const [metric] of Object.entries(controlSnapshot)) {
        controlSnapshot[metric] = controlSnapshot[metric] / controlResults.length;
    }

    for (const result of experimentResults) {
        for (const [metric, value] of Object.entries(result.metrics)) {
            experimentSnapshot[metric] = (experimentSnapshot[metric] || 0) + value;
        }
    }

    for (const [metric] of Object.entries(experimentSnapshot)) {
        experimentSnapshot[metric] = experimentSnapshot[metric] / experimentResults.length;
    }

    // Calculate deltas and statistics
    const deltas: Record<string, MetricDelta> = {};
    for (const metric of Object.keys(controlSnapshot)) {
        const control = controlSnapshot[metric];
        const experiment = experimentSnapshot[metric] || 0;
        const delta = experiment - control;
        const percentage = control !== 0 ? (delta / control) * 100 : 0;

        deltas[metric] = {
            control,
            experiment,
            delta,
            percentage,
            improved: delta > 0,
        };
    }

    // Calculate p-value using t-test
    let pValue: number = 1.0;
    let recommendation = "REVERT";
    
    if (controlResults.length > 0 && experimentResults.length > 0 && Object.keys(deltas).length > 0) {
        try {
            // Extract metric values for t-test (use first available metric)
            const metricName = Object.keys(deltas)[0];
            const controlValues = controlResults.map((r) => r.metrics[metricName] || 0).filter(v => v > 0);
            const experimentValues = experimentResults.map((r) => r.metrics[metricName] || 0).filter(v => v > 0);
            
            if (controlValues.length > 0 && experimentValues.length > 0) {
                pValue = calculateTTest(controlValues, experimentValues);
            }

            // Determine recommendation
            if (pValue < 0.05) {
                const improvements = Object.values(deltas).filter((d) => d.improved).length;
                const regressions = Object.values(deltas).filter((d) => !d.improved && d.percentage < -5).length;
                if (improvements > regressions * 2) {
                    recommendation = "ADOPT";
                } else if (improvements > regressions) {
                    recommendation = "REVISE";
                }
            }
        } catch (error) {
            console.warn("⚠ Error calculating statistics:", error);
            pValue = 1.0;
        }
    } else {
        console.warn("⚠ No results to compare - cannot calculate statistics");
    }

    // Build result object
    const result: ABTestResult = {
        config: {
            controlVersion: CONTROL_VERSION,
            experimentVersion: EXPERIMENT_VERSION,
            testPrompts: TEST_PROMPT_IDS,
            sampleSize: ITERATIONS,
            hypothesis: HYPOTHESIS,
            expectedImprovement: "See hypothesis",
        },
        testDate: new Date().toISOString(),
        control: controlResults.map((r) => ({
            storyId: r.storyId,
            chapterId: r.chapterId,
            sceneIds: r.sceneIds,
            evaluations: r.evaluations,
        })),
        experiment: experimentResults.map((r) => ({
            storyId: r.storyId,
            chapterId: r.chapterId,
            sceneIds: r.sceneIds,
            evaluations: r.evaluations,
        })),
        comparison: {
            controlSnapshot,
            experimentSnapshot,
            deltas,
            pValue,
            recommendation,
        },
    };

    // Save results
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2));

    // Generate report
    const reportFile = OUTPUT_FILE.replace(".json", "-report.md");
    const report = generateReport(result);
    await fs.writeFile(reportFile, report);

    // Print summary
    const totalTime = (Date.now() - startTime) / 1000 / 60;
    console.log(`
═══════════════════════════════════════════════════════════════
              SCENE CONTENT TEST RESULTS
═══════════════════════════════════════════════════════════════
  Control:        ${CONTROL_VERSION} (${controlResults.length} stories)
  Experiment:     ${EXPERIMENT_VERSION} (${experimentResults.length} stories)
  Statistical Significance: p=${pValue.toFixed(4)} ${pValue < 0.05 ? "✓" : "✗"}

  SCENE CONTENT METRICS:
${Object.entries(deltas)
    .map(
        ([metric, delta]) =>
            `  • ${metric}: ${delta.control.toFixed(2)} → ${delta.experiment.toFixed(2)} (${delta.percentage > 0 ? "+" : ""}${delta.percentage.toFixed(1)}%)`,
    )
    .join("\n")}

  RECOMMENDATION: ${recommendation}
  ${recommendation === "ADOPT" ? "✅" : recommendation === "REVISE" ? "⚠️" : "❌"} ${recommendation === "ADOPT" ? "Adopt experiment version" : recommendation === "REVISE" ? "Revise and retest" : "Revert to control"}

  Total Time:     ${totalTime.toFixed(1)} minutes
  Results Saved:  ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════

  Report saved: ${reportFile}
`);

    process.exit(0);
}

/**
 * Generate markdown report
 */
function generateReport(result: ABTestResult): string {
    const { comparison } = result;
    const date = new Date(result.testDate).toLocaleDateString();

    return `# Scene Content Prompt Test Report: ${result.config.controlVersion} vs ${result.config.experimentVersion}

**Date**: ${date}
**Hypothesis**: ${result.config.hypothesis}
**Sample Size**: ${result.config.sampleSize} stories per version
**Statistical Significance**: p=${typeof comparison.pValue === 'number' ? comparison.pValue.toFixed(4) : 'N/A'} ${typeof comparison.pValue === 'number' && comparison.pValue < 0.05 ? "✅ Significant" : "❌ Not Significant"}

## Recommendation: ${comparison.recommendation}

${comparison.recommendation === "ADOPT" ? "✅" : comparison.recommendation === "REVISE" ? "⚠️" : "❌"} **${comparison.recommendation}** - ${comparison.recommendation === "ADOPT" ? "The experiment version shows significant improvement." : comparison.recommendation === "REVISE" ? "Mixed results, needs refinement." : "The control version performs better or results are not statistically significant."}

## Scene Content Metrics Comparison

| Metric | Control | Experiment | Change |
|--------|---------|------------|--------|
${Object.entries(comparison.deltas)
    .map(
        ([metric, delta]) =>
            `| ${metric} | ${delta.control.toFixed(2)} | ${delta.experiment.toFixed(2)} | ${delta.percentage > 0 ? "+" : ""}${delta.percentage.toFixed(1)}% |`,
    )
    .join("\n")}

## Top Improvements

${Object.entries(comparison.deltas)
    .filter(([, delta]) => delta.improved && delta.percentage > 5)
    .sort(([, a], [, b]) => b.percentage - a.percentage)
    .slice(0, 5)
    .map(([metric, delta]) => `- **${metric}**: +${delta.percentage.toFixed(1)}% (${delta.control.toFixed(2)} → ${delta.experiment.toFixed(2)})`)
    .join("\n") || "No significant improvements detected."}

## Regressions

${Object.entries(comparison.deltas)
    .filter(([, delta]) => !delta.improved && delta.percentage < -5)
    .sort(([, a], [, b]) => a.percentage - b.percentage)
    .slice(0, 5)
    .map(([metric, delta]) => `- **${metric}**: ${delta.percentage.toFixed(1)}% (${delta.control.toFixed(2)} → ${delta.experiment.toFixed(2)})`)
    .join("\n") || "No significant regressions detected."}
`;
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

