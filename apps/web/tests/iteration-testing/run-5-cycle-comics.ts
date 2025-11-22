#!/usr/bin/env tsx

/**
 * 5-Cycle Comics Iteration Testing Script
 *
 * Performs 5-cycle iteration testing on comic panel image generation
 * using static panel data and calling AI server directly.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/run-5-cycle-comics.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { TEST_SCENES, type TestScene } from "./comics/config/test-scenes";

// Configuration
const OUTPUT_DIR = "results/5-cycle-comics-evaluation";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_FILE = `${OUTPUT_DIR}/comics-eval-report-${TIMESTAMP}.md`;

// AI Server configuration
const AI_SERVER_URL =
    process.env.AI_SERVER_IMAGE_URL || "http://localhost:8000";

// Load API key
let apiKey: string | undefined;
if (fs.existsSync(".auth/user.json")) {
    const authData = JSON.parse(fs.readFileSync(".auth/user.json", "utf8"));
    apiKey = authData.develop?.profiles?.writer?.apiKey;
}

if (!apiKey) {
    console.error("❌ API key not found in .auth/user.json");
    process.exit(1);
}

// Cycle configurations for comics
interface CycleConfig {
    cycle: number;
    name: string;
    hypothesis: string;
    scenes: string[];
    iterations: number;
    promptEnhancements: string[];
    improvements: string[];
}

// Evaluation-based cycle configurations aligned with comics-evaluation.md
// Categories: Narrative Fidelity (20%), Visual Transformation (30%), Webtoon Pacing (30%), Script Formatting (20%)
const CYCLE_CONFIGS: CycleConfig[] = [
    {
        cycle: 1,
        name: "Baseline",
        hypothesis: "Establish baseline metrics for comic panel generation",
        scenes: ["action-sequence", "dialogue-heavy", "emotional-beat"],
        iterations: 3,
        promptEnhancements: [],
        improvements: ["Baseline metrics established", "No changes from v1.0"],
    },
    {
        cycle: 2,
        name: "Visual Transformation Focus",
        hypothesis:
            "Improve visual storytelling - show emotions through visual cues instead of narration",
        scenes: ["action-sequence", "emotional-beat", "establishing-shot"],
        iterations: 3,
        promptEnhancements: [
            "expressive body language",
            "character emotion through pose",
            "environmental mood lighting",
            "visual storytelling emphasis",
        ],
        improvements: [
            "Show emotions through body language and poses",
            "Use environmental storytelling (lighting, atmosphere)",
            "Replace narration with visual cues",
            "Target: emotions visible without text",
        ],
    },
    {
        cycle: 3,
        name: "Webtoon Pacing Optimization",
        hypothesis:
            "Optimize for mobile vertical-scroll thumb reading with shot variety",
        scenes: ["action-sequence", "dialogue-heavy", "climactic-moment"],
        iterations: 3,
        promptEnhancements: [
            "clear visual hierarchy",
            "single focal point per panel",
            "thumb-scroll optimized composition",
            "distinct shot type characteristics",
        ],
        improvements: [
            "One key action per panel",
            "Clear visual hierarchy for mobile",
            "Shot type variety for visual rhythm",
            "Optimize for thumb scrolling",
        ],
    },
    {
        cycle: 4,
        name: "Narrative Fidelity Enhancement",
        hypothesis:
            "Preserve emotional beats and character expressions accurately",
        scenes: [
            "action-sequence",
            "emotional-beat",
            "establishing-shot",
            "climactic-moment",
        ],
        iterations: 3,
        promptEnhancements: [
            "detailed facial expressions",
            "emotional nuance in character stance",
            "dramatic tension in composition",
            "story beat emphasis",
        ],
        improvements: [
            "Capture character emotions accurately",
            "Preserve story climactic moments",
            "Show character relationships through positioning",
            "Maintain emotional arc visually",
        ],
    },
    {
        cycle: 5,
        name: "Production-Ready Quality",
        hypothesis:
            "Combine all evaluation criteria for professional webtoon quality",
        scenes: [
            "action-sequence",
            "dialogue-heavy",
            "emotional-beat",
            "establishing-shot",
            "climactic-moment",
        ],
        iterations: 5,
        promptEnhancements: [
            "professional webtoon comic panel",
            "expressive character poses and facial details",
            "cinematic mood lighting",
            "clear visual hierarchy",
            "emotional storytelling composition",
            "mobile-optimized vertical format",
        ],
        improvements: [
            "Visual Transformation: Show don't tell (target <5% narration)",
            "Webtoon Pacing: 8-12 panels with shot variety",
            "Narrative Fidelity: Preserve emotional beats",
            "Script Formatting: Production-ready detail level",
        ],
    },
];

interface PanelResult {
    panelNumber: number;
    prompt: string;
    generationTime: number;
    success: boolean;
    width: number;
    height: number;
    error?: string;
}

interface TestResult {
    testId: string;
    sceneId: string;
    sceneName: string;
    panels: PanelResult[];
    totalTime: number;
    successRate: number;
    averageGenerationTime: number;
}

interface CycleResult {
    cycle: number;
    name: string;
    results: TestResult[];
    metrics: {
        totalTests: number;
        totalPanels: number;
        successfulPanels: number;
        successRate: number;
        averageGenerationTime: number;
        minGenerationTime: number;
        maxGenerationTime: number;
    };
    improvements: string[];
    duration: number;
    timestamp: string;
}

const cycleResults: CycleResult[] = [];

/**
 * Build prompt with cycle-specific enhancements
 */
function buildPrompt(
    baseDescription: string,
    shotType: string,
    enhancements: string[],
): string {
    let prompt = `Webtoon comic panel, ${shotType}, ${baseDescription}`;

    if (enhancements.length > 0) {
        prompt += `, ${enhancements.join(", ")}`;
    }

    return prompt;
}

/**
 * Generate a single comic panel image via AI server
 */
async function generatePanelImage(prompt: string): Promise<{
    generationTime: number;
    success: boolean;
    width: number;
    height: number;
    error?: string;
}> {
    const startTime = Date.now();

    const requestBody = {
        prompt,
        width: 928,
        height: 1664,
        num_inference_steps: 4,
        guidance_scale: 1.0,
    };

    try {
        const response = await fetch(
            `${AI_SERVER_URL}/api/v1/images/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey!,
                },
                body: JSON.stringify(requestBody),
            },
        );

        const generationTime = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            return {
                generationTime,
                success: false,
                width: 0,
                height: 0,
                error: `${response.status}: ${errorText}`,
            };
        }

        const result = await response.json();

        return {
            generationTime,
            success: true,
            width: result.width || 928,
            height: result.height || 1664,
        };
    } catch (error) {
        return {
            generationTime: Date.now() - startTime,
            success: false,
            width: 0,
            height: 0,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Run tests for a single scene
 */
async function runSceneTest(
    scene: TestScene,
    iteration: number,
    enhancements: string[],
): Promise<TestResult> {
    const testId = `${scene.id}-${iteration}`;
    const startTime = Date.now();
    const panels: PanelResult[] = [];

    // Generate 2 panel images per test (using first 2 panels from test data)
    const panelsToTest = scene.toonplay.panels.slice(0, 2);

    for (const panel of panelsToTest) {
        const prompt = buildPrompt(
            panel.description,
            panel.shotType,
            enhancements,
        );

        console.log(`      Panel ${panel.panelNumber}: ${panel.shotType}`);

        const result = await generatePanelImage(prompt);

        panels.push({
            panelNumber: panel.panelNumber,
            prompt,
            generationTime: result.generationTime,
            success: result.success,
            width: result.width,
            height: result.height,
            error: result.error,
        });

        if (result.success) {
            console.log(
                `        ✓ ${(result.generationTime / 1000).toFixed(1)}s`,
            );
        } else {
            console.log(`        ✗ ${result.error}`);
        }
    }

    const totalTime = Date.now() - startTime;
    const successCount = panels.filter((p) => p.success).length;
    const successRate = panels.length > 0 ? successCount / panels.length : 0;
    const avgTime =
        panels.length > 0
            ? panels.reduce((sum, p) => sum + p.generationTime, 0) /
              panels.length
            : 0;

    return {
        testId,
        sceneId: scene.id,
        sceneName: scene.name,
        panels,
        totalTime,
        successRate,
        averageGenerationTime: avgTime,
    };
}

/**
 * Run a single cycle
 */
async function runCycle(config: CycleConfig): Promise<CycleResult> {
    const cycleStartTime = Date.now();
    const results: TestResult[] = [];

    console.log(`\n${"═".repeat(63)}`);
    console.log(`  CYCLE ${config.cycle}: ${config.name.toUpperCase()}`);
    console.log(`${"═".repeat(63)}`);
    console.log(`  Hypothesis: ${config.hypothesis}`);
    console.log(`  Scenes: ${config.scenes.join(", ")}`);
    console.log(`  Iterations: ${config.iterations}`);
    console.log(
        `  Enhancements: ${config.promptEnhancements.join(", ") || "None"}\n`,
    );

    let totalTests = 0;
    const totalExpected = config.scenes.length * config.iterations;

    for (const sceneId of config.scenes) {
        const scene = TEST_SCENES.find((s) => s.id === sceneId);
        if (!scene) {
            console.error(`  ✗ Scene not found: ${sceneId}`);
            continue;
        }

        console.log(`\n  📸 ${scene.name} (${sceneId})`);

        for (let i = 0; i < config.iterations; i++) {
            totalTests++;
            console.log(
                `    [${totalTests}/${totalExpected}] Test ${i + 1}/${config.iterations}`,
            );

            const result = await runSceneTest(
                scene,
                i + 1,
                config.promptEnhancements,
            );
            results.push(result);
        }
    }

    // Calculate metrics
    const allPanels = results.flatMap((r) => r.panels);
    const successfulPanels = allPanels.filter((p) => p.success);
    const generationTimes = allPanels
        .filter((p) => p.success)
        .map((p) => p.generationTime);

    const metrics = {
        totalTests: results.length,
        totalPanels: allPanels.length,
        successfulPanels: successfulPanels.length,
        successRate:
            allPanels.length > 0
                ? successfulPanels.length / allPanels.length
                : 0,
        averageGenerationTime:
            generationTimes.length > 0
                ? generationTimes.reduce((a, b) => a + b, 0) /
                  generationTimes.length /
                  1000
                : 0,
        minGenerationTime:
            generationTimes.length > 0
                ? Math.min(...generationTimes) / 1000
                : 0,
        maxGenerationTime:
            generationTimes.length > 0
                ? Math.max(...generationTimes) / 1000
                : 0,
    };

    const duration = (Date.now() - cycleStartTime) / 1000;

    console.log(`\n  ✅ Cycle ${config.cycle} Complete`);
    console.log(`     Duration: ${duration.toFixed(1)}s`);
    console.log(
        `     Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`,
    );
    console.log(
        `     Avg Generation: ${metrics.averageGenerationTime.toFixed(1)}s`,
    );

    return {
        cycle: config.cycle,
        name: config.name,
        results,
        metrics,
        improvements: config.improvements,
        duration,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Generate final report
 */
function generateReport(): string {
    let report = `# 5-Cycle Comics Evaluation-Based Iteration Testing Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**AI Server**: ${AI_SERVER_URL}\n`;
    report += `**Total Duration**: ${cycleResults.reduce((sum, r) => sum + r.duration, 0).toFixed(0)}s\n\n`;
    report += `**Evaluation Framework**: Based on comics-evaluation.md\n`;
    report += `- Visual Transformation (30%): Show emotions through visual cues\n`;
    report += `- Webtoon Pacing (30%): Mobile vertical-scroll optimization\n`;
    report += `- Narrative Fidelity (20%): Preserve story beats and emotions\n`;
    report += `- Script Formatting (20%): Production-ready specifications\n\n`;

    // Executive Summary
    report += `## Executive Summary\n\n`;

    if (cycleResults.length > 1) {
        const first = cycleResults[0].metrics;
        const last = cycleResults[cycleResults.length - 1].metrics;

        report += `| Metric | Baseline (Cycle 1) | Final (Cycle 5) | Change |\n`;
        report += `|--------|-------------------|-----------------|--------|\n`;
        report += `| Success Rate | ${(first.successRate * 100).toFixed(1)}% | ${(last.successRate * 100).toFixed(1)}% | ${((last.successRate - first.successRate) * 100).toFixed(1)}% |\n`;
        report += `| Avg Generation | ${first.averageGenerationTime.toFixed(1)}s | ${last.averageGenerationTime.toFixed(1)}s | ${(last.averageGenerationTime - first.averageGenerationTime).toFixed(1)}s |\n\n`;
    }

    // Cycle Details
    report += `## Cycle Results\n\n`;

    for (const cycle of cycleResults) {
        report += `### Cycle ${cycle.cycle}: ${cycle.name}\n\n`;
        report += `**Hypothesis**: ${CYCLE_CONFIGS[cycle.cycle - 1].hypothesis}\n\n`;

        report += `| Metric | Value |\n`;
        report += `|--------|-------|\n`;
        report += `| Tests | ${cycle.metrics.totalTests} |\n`;
        report += `| Panels | ${cycle.metrics.totalPanels} |\n`;
        report += `| Success Rate | ${(cycle.metrics.successRate * 100).toFixed(1)}% |\n`;
        report += `| Avg Time | ${cycle.metrics.averageGenerationTime.toFixed(1)}s |\n`;
        report += `| Min Time | ${cycle.metrics.minGenerationTime.toFixed(1)}s |\n`;
        report += `| Max Time | ${cycle.metrics.maxGenerationTime.toFixed(1)}s |\n`;
        report += `| Duration | ${cycle.duration.toFixed(1)}s |\n\n`;

        report += `**Improvements Applied**:\n`;
        for (const imp of cycle.improvements) {
            report += `- ${imp}\n`;
        }
        report += `\n`;
    }

    // Recommendations
    report += `## Recommendations\n\n`;

    const last = cycleResults[cycleResults.length - 1];
    if (last) {
        if (last.metrics.successRate >= 0.95) {
            report += `- ✅ Excellent success rate (${(last.metrics.successRate * 100).toFixed(1)}%)\n`;
        } else {
            report += `- ⚠️ Success rate needs improvement (${(last.metrics.successRate * 100).toFixed(1)}%)\n`;
        }

        if (last.metrics.averageGenerationTime < 15) {
            report += `- ✅ Good generation time (${last.metrics.averageGenerationTime.toFixed(1)}s avg)\n`;
        } else {
            report += `- ⚠️ Generation time could be optimized (${last.metrics.averageGenerationTime.toFixed(1)}s avg)\n`;
        }
    }

    return report;
}

/**
 * Main execution
 */
async function main() {
    console.log(`
═══════════════════════════════════════════════════════════════
              5-CYCLE COMICS ITERATION TESTING
═══════════════════════════════════════════════════════════════
  AI Server: ${AI_SERVER_URL}
  Total Cycles: ${CYCLE_CONFIGS.length}
  Output Directory: ${OUTPUT_DIR}
═══════════════════════════════════════════════════════════════
`);

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Run each cycle
    for (const config of CYCLE_CONFIGS) {
        const result = await runCycle(config);
        cycleResults.push(result);

        // Save cycle results
        const cycleFile = `${OUTPUT_DIR}/cycle${config.cycle}.json`;
        fs.writeFileSync(cycleFile, JSON.stringify(result, null, 2), "utf-8");

        // Wait between cycles
        if (config.cycle < CYCLE_CONFIGS.length) {
            console.log("\n  ⏸️  Waiting 5 seconds before next cycle...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    // Generate and save report
    const report = generateReport();
    fs.writeFileSync(REPORT_FILE, report, "utf-8");

    // Save all results
    const allResultsFile = `${OUTPUT_DIR}/all-cycles-${TIMESTAMP}.json`;
    fs.writeFileSync(
        allResultsFile,
        JSON.stringify({ cycles: cycleResults, timestamp: TIMESTAMP }, null, 2),
        "utf-8",
    );

    console.log(`
═══════════════════════════════════════════════════════════════
                    TESTING COMPLETE
═══════════════════════════════════════════════════════════════
  Results: ${allResultsFile}
  Report: ${REPORT_FILE}
═══════════════════════════════════════════════════════════════
`);

    process.exit(0);
}

// Run
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
