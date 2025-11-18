#!/usr/bin/env tsx

/**
 * 5-Cycle Iteration Testing Script for Toonplay
 *
 * Performs comprehensive iteration testing on toonplay generation
 * with progressive improvements across 5 cycles.
 *
 * Each cycle:
 * 1. Tests with updated prompts and parameters
 * 2. Collects metrics and evaluates quality
 * 3. Analyzes results and identifies improvements
 * 4. Updates configuration for next cycle
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-5-cycle-toonplay.ts
 */

import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Configuration
const OUTPUT_DIR = "tests/iteration-testing/toonplay/results/5-cycle-iteration";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_FILE = `${OUTPUT_DIR}/iteration-report-${TIMESTAMP}.md`;

// Test configuration for each cycle
interface CycleConfig {
    cycle: number;
    name: string;
    hypothesis: string;
    testScenes: string[];
    iterations: number;
    customParams?: Record<string, unknown>;
    improvements: string[];
}

const CYCLE_CONFIGS: CycleConfig[] = [
    {
        cycle: 1,
        name: "Baseline",
        hypothesis: "Establish baseline metrics for toonplay generation",
        testScenes: [
            "emotional-moment",
            "action-sequence",
            "dialogue-heavy",
            "setting-atmosphere",
            "mixed-elements",
        ],
        iterations: 3,
        improvements: ["Baseline metrics established", "No changes from v1.0"],
    },
    {
        cycle: 2,
        name: "Enhanced Shot Variety",
        hypothesis:
            "Improve visual storytelling by enforcing diverse shot types and camera angles",
        testScenes: [
            "emotional-moment",
            "action-sequence",
            "setting-atmosphere",
        ],
        iterations: 3,
        customParams: {
            shotVarietyEnhancements: [
                "Enforce establishing shot for scene openers",
                "Require minimum 5 different shot types per scene",
                "Add dynamic angle transitions (dutch, low, high)",
            ],
        },
        improvements: [
            "Add establishing shot requirement for first panel",
            "Enforce minimum shot type variety (5+ types)",
            "Include dynamic angles for emotional moments",
        ],
    },
    {
        cycle: 3,
        name: "Optimized Dialogue-Narration Balance",
        hypothesis:
            "Improve content proportions by reducing narration and increasing dialogue presence",
        testScenes: [
            "emotional-moment",
            "dialogue-heavy",
            "mixed-elements",
        ],
        iterations: 3,
        customParams: {
            narrationCap: 0.05, // 5% max narration
            dialogueTarget: 0.70, // 70% dialogue target
            internalMonologueCap: 0.10, // 10% max internal monologue
        },
        improvements: [
            "Enforce strict 5% narration cap with fallback to dialogue",
            "Target 70% dialogue presence across panels",
            "Convert internal monologue to visual expression where possible",
        ],
    },
    {
        cycle: 4,
        name: "Genre-Specific Visual Patterns",
        hypothesis:
            "Improve quality through specialized visual patterns for different scene types",
        testScenes: [
            "action-sequence",
            "dialogue-heavy",
            "setting-atmosphere",
        ],
        iterations: 3,
        customParams: {
            genrePatterns: {
                action: "dynamic motion lines, impact panels, speed emphasis",
                dialogue: "reaction shots, eye contact, gesture emphasis",
                atmosphere: "wide establishing, environmental details, mood lighting",
            },
        },
        improvements: [
            "Implement scene-type specific panel patterns",
            "Add visual style markers for different emotions",
            "Include professional webtoon composition guides",
        ],
    },
    {
        cycle: 5,
        name: "Final Optimizations",
        hypothesis:
            "Combine all improvements for optimal toonplay quality across all scene types",
        testScenes: [
            "emotional-moment",
            "action-sequence",
            "dialogue-heavy",
            "setting-atmosphere",
            "mixed-elements",
        ],
        iterations: 5,
        customParams: {
            shotVarietyEnhancements: "all",
            narrationCap: 0.05,
            dialogueTarget: 0.70,
            genrePatterns: "all",
        },
        improvements: [
            "Combine shot variety improvements from Cycle 2",
            "Apply narration/dialogue balance from Cycle 3",
            "Use genre-specific patterns from Cycle 4",
            "Full integration test with all improvements",
        ],
    },
];

interface CycleResult {
    cycle: number;
    name: string;
    metrics: CycleMetrics | null;
    improvements: string[];
    duration: number;
    timestamp: string;
}

interface CycleMetrics {
    totalTests: number;
    averageWeightedScore: number;
    passRate: number;
    firstPassSuccessRate: number;
    averageNarrationPercentage: number;
    averageInternalMonologuePercentage: number;
    averageDialoguePresence: number;
    narrationComplianceRate: number;
    internalMonologueComplianceRate: number;
    dialogueTargetRate: number;
    categoryAverages: {
        narrativeFidelity: number;
        visualTransformation: number;
        webtoonPacing: number;
        scriptFormatting: number;
    };
    failurePatterns: Array<{
        description: string;
        priority: string;
        frequency: number;
        suggestedFix: string;
    }>;
}

const cycleResults: CycleResult[] = [];

/**
 * Run toonplay tests for a cycle
 */
async function runToonplayTests(config: CycleConfig): Promise<CycleMetrics | null> {
    console.log(`\n🎨 Running toonplay tests for Cycle ${config.cycle}...`);
    console.log(`   Scenes: ${config.testScenes.join(", ")}`);
    console.log(`   Iterations: ${config.iterations}`);

    const scenesArg = config.testScenes.join(",");
    const outputFile = `${OUTPUT_DIR}/cycle${config.cycle}/toonplay.json`;

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    const command = `cd /home/web/GitHub/@dev.realbits/Fictures/apps/web && pnpm exec dotenv -e .env.local -- tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts --version v1.${config.cycle} --scenes "${scenesArg}" --iterations ${config.iterations} --mode standard --output ${outputFile}`;

    console.log(`   Command: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 2 * 60 * 60 * 1000, // 2 hours timeout
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error("   Warning:", stderr);

        // Load results
        const resultsData = await fs.readFile(outputFile, "utf-8");
        const results = JSON.parse(resultsData);
        return results.aggregatedMetrics || null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
            `   ✗ Toonplay tests failed for Cycle ${config.cycle}:`,
            errorMessage,
        );
        return null;
    }
}

/**
 * Analyze cycle results and generate report section
 */
function analyzeCycleResults(
    cycleConfig: CycleConfig,
    metrics: CycleMetrics | null,
    previousCycle?: CycleResult,
): string {
    let analysis = `\n## Cycle ${cycleConfig.cycle}: ${cycleConfig.name}\n\n`;
    analysis += `**Hypothesis**: ${cycleConfig.hypothesis}\n\n`;

    if (!metrics) {
        analysis += `### Toonplay Generation Metrics\n\n`;
        analysis += `No metrics available for this cycle.\n\n`;
        return analysis;
    }

    // Metrics table
    analysis += `### Toonplay Generation Metrics\n\n`;
    analysis += `| Metric | Value | Target | Status |\n`;
    analysis += `|--------|-------|--------|--------|\n`;
    analysis += `| Weighted Score | ${metrics.averageWeightedScore.toFixed(2)}/5.0 | ≥3.5 | ${metrics.averageWeightedScore >= 3.5 ? "✅" : "⚠️"} |\n`;
    analysis += `| Pass Rate | ${(metrics.passRate * 100).toFixed(0)}% | ≥80% | ${metrics.passRate >= 0.8 ? "✅" : "⚠️"} |\n`;
    analysis += `| First Pass Success | ${(metrics.firstPassSuccessRate * 100).toFixed(0)}% | ≥70% | ${metrics.firstPassSuccessRate >= 0.7 ? "✅" : "⚠️"} |\n`;
    analysis += `| Narration | ${metrics.averageNarrationPercentage.toFixed(1)}% | <5% | ${metrics.averageNarrationPercentage <= 5 ? "✅" : "⚠️"} |\n`;
    analysis += `| Dialogue Presence | ${metrics.averageDialoguePresence.toFixed(1)}% | ~70% | ${Math.abs(metrics.averageDialoguePresence - 70) <= 15 ? "✅" : "⚠️"} |\n\n`;

    // Category scores
    analysis += `### Category Scores\n\n`;
    analysis += `| Category | Score | Target |\n`;
    analysis += `|----------|-------|--------|\n`;
    analysis += `| Narrative Fidelity | ${metrics.categoryAverages.narrativeFidelity.toFixed(2)}/5.0 | ≥3.5 |\n`;
    analysis += `| Visual Transformation | ${metrics.categoryAverages.visualTransformation.toFixed(2)}/5.0 | ≥3.5 |\n`;
    analysis += `| Webtoon Pacing | ${metrics.categoryAverages.webtoonPacing.toFixed(2)}/5.0 | ≥3.5 |\n`;
    analysis += `| Script Formatting | ${metrics.categoryAverages.scriptFormatting.toFixed(2)}/5.0 | ≥3.5 |\n\n`;

    // Comparison with previous cycle
    if (previousCycle?.metrics) {
        const prevMetrics = previousCycle.metrics;
        const scoreDelta = metrics.averageWeightedScore - prevMetrics.averageWeightedScore;
        const passRateDelta = (metrics.passRate - prevMetrics.passRate) * 100;
        const narrationDelta = metrics.averageNarrationPercentage - prevMetrics.averageNarrationPercentage;

        analysis += `### Changes from Previous Cycle\n\n`;
        analysis += `- Weighted Score: ${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(2)} (${scoreDelta > 0 ? "✅ Improved" : scoreDelta < 0 ? "❌ Degraded" : "➖ No change"})\n`;
        analysis += `- Pass Rate: ${passRateDelta > 0 ? "+" : ""}${passRateDelta.toFixed(1)}% (${passRateDelta > 0 ? "✅ Improved" : passRateDelta < 0 ? "❌ Degraded" : "➖ No change"})\n`;
        analysis += `- Narration: ${narrationDelta > 0 ? "+" : ""}${narrationDelta.toFixed(1)}% (${narrationDelta < 0 ? "✅ Improved" : narrationDelta > 0 ? "❌ Increased" : "➖ No change"})\n\n`;
    }

    // Improvements applied
    analysis += `### Improvements Applied\n\n`;
    for (const improvement of cycleConfig.improvements) {
        analysis += `- ${improvement}\n`;
    }
    analysis += `\n`;

    // Top issues
    if (metrics.failurePatterns && metrics.failurePatterns.length > 0) {
        analysis += `### Top Issues\n\n`;
        for (const pattern of metrics.failurePatterns.slice(0, 3)) {
            analysis += `- **[${pattern.priority.toUpperCase()}]** ${pattern.description}\n`;
            analysis += `  - Fix: ${pattern.suggestedFix}\n`;
        }
        analysis += `\n`;
    }

    return analysis;
}

/**
 * Generate comprehensive final report
 */
async function generateFinalReport(): Promise<void> {
    console.log("\n📝 Generating comprehensive final report...");

    let report = `# 5-Cycle Toonplay Iteration Testing Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    report += `**Total Duration**: ${cycleResults.reduce((sum, r) => sum + r.duration, 0).toFixed(0)}s (${(cycleResults.reduce((sum, r) => sum + r.duration, 0) / 60).toFixed(1)} minutes)\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This report documents the results of 5 comprehensive iteration cycles testing toonplay generation systems with progressive improvements.\n\n`;

    // Overall improvements
    if (cycleResults.length > 1) {
        const firstCycle = cycleResults[0];
        const lastCycle = cycleResults[cycleResults.length - 1];

        if (firstCycle.metrics && lastCycle.metrics) {
            const scoreImprovement =
                lastCycle.metrics.averageWeightedScore - firstCycle.metrics.averageWeightedScore;
            const passRateImprovement =
                (lastCycle.metrics.passRate - firstCycle.metrics.passRate) * 100;

            report += `### Overall Improvement\n\n`;
            report += `- **Baseline** (Cycle 1): ${firstCycle.metrics.averageWeightedScore.toFixed(2)}/5.0\n`;
            report += `- **Final** (Cycle 5): ${lastCycle.metrics.averageWeightedScore.toFixed(2)}/5.0\n`;
            report += `- **Score Improvement**: ${scoreImprovement > 0 ? "+" : ""}${scoreImprovement.toFixed(2)} (${((scoreImprovement / firstCycle.metrics.averageWeightedScore) * 100).toFixed(1)}%)\n`;
            report += `- **Pass Rate Improvement**: ${passRateImprovement > 0 ? "+" : ""}${passRateImprovement.toFixed(1)}%\n\n`;
        }
    }

    // Detailed cycle results
    report += `## Detailed Cycle Results\n\n`;
    for (let i = 0; i < cycleResults.length; i++) {
        const result = cycleResults[i];
        const config = CYCLE_CONFIGS[i];
        const previousCycle = i > 0 ? cycleResults[i - 1] : undefined;

        report += analyzeCycleResults(config, result.metrics, previousCycle);
    }

    // Key findings
    report += `## Key Findings\n\n`;
    report += `### Most Effective Improvements\n\n`;

    // Calculate which cycle had the biggest improvement
    let maxImprovement = 0;
    let maxImprovementCycle = 0;

    for (let i = 1; i < cycleResults.length; i++) {
        const current = cycleResults[i];
        const previous = cycleResults[i - 1];

        if (current.metrics && previous.metrics) {
            const improvement =
                current.metrics.averageWeightedScore - previous.metrics.averageWeightedScore;
            if (improvement > maxImprovement) {
                maxImprovement = improvement;
                maxImprovementCycle = i + 1;
            }
        }
    }

    if (maxImprovementCycle > 0) {
        report += `- **Biggest Improvement**: Cycle ${maxImprovementCycle} (${CYCLE_CONFIGS[maxImprovementCycle - 1]?.name}) with +${maxImprovement.toFixed(2)} improvement\n\n`;
    }

    // Recommendations
    report += `## Recommendations\n\n`;

    const lastCycle = cycleResults[cycleResults.length - 1];

    if (lastCycle.metrics) {
        const score = lastCycle.metrics.averageWeightedScore;
        const passRate = lastCycle.metrics.passRate;
        const narration = lastCycle.metrics.averageNarrationPercentage;

        if (score >= 4.0) {
            report += `- ✅ **Overall quality is excellent** (${score.toFixed(2)}/5.0)\n`;
        } else if (score >= 3.5) {
            report += `- ⚠️ **Quality is good but has room for improvement** (${score.toFixed(2)}/5.0)\n`;
        } else {
            report += `- ❌ **Quality needs significant improvement** (${score.toFixed(2)}/5.0)\n`;
        }

        if (passRate < 0.8) {
            report += `- 📈 **Improve pass rate** (current: ${(passRate * 100).toFixed(0)}%, target: ≥80%)\n`;
        }

        if (narration > 5) {
            report += `- 📝 **Reduce narration** (current: ${narration.toFixed(1)}%, target: <5%)\n`;
        }
    }

    // Next steps
    report += `\n## Next Steps\n\n`;
    report += `1. **Implement best-performing parameters** from Cycle ${cycleResults.length} as defaults\n`;
    report += `2. **Update prompt templates** with successful patterns identified\n`;
    report += `3. **Run validation tests** to confirm improvements in production\n`;
    report += `4. **Monitor quality metrics** in real-world usage\n`;
    report += `5. **Schedule next iteration cycle** in 1-2 months to continue improvements\n\n`;

    // Appendix
    report += `## Appendix\n\n`;
    report += `### Test Configuration\n\n`;
    for (const config of CYCLE_CONFIGS) {
        report += `#### Cycle ${config.cycle}: ${config.name}\n\n`;
        report += `- **Hypothesis**: ${config.hypothesis}\n`;
        report += `- **Test Scenes**: ${config.testScenes.join(", ")}\n`;
        report += `- **Iterations**: ${config.iterations}\n\n`;
    }

    // Save report
    await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
    await fs.writeFile(REPORT_FILE, report, "utf-8");

    console.log(`✅ Final report generated: ${REPORT_FILE}`);
}

/**
 * Main execution
 */
async function main() {
    console.log(`
═══════════════════════════════════════════════════════════════
              5-CYCLE TOONPLAY ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Total Cycles: ${CYCLE_CONFIGS.length}
  Output Directory: ${OUTPUT_DIR}
  Report File: ${REPORT_FILE}
═══════════════════════════════════════════════════════════════
`);

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Run each cycle
    for (let i = 0; i < CYCLE_CONFIGS.length; i++) {
        const config = CYCLE_CONFIGS[i];
        const cycleStartTime = Date.now();

        console.log(`\n${"═".repeat(63)}`);
        console.log(`  CYCLE ${config.cycle}: ${config.name.toUpperCase()}`);
        console.log(`${"═".repeat(63)}`);
        console.log(`  Hypothesis: ${config.hypothesis}\n`);

        // Run toonplay tests
        const metrics = await runToonplayTests(config);

        const cycleDuration = (Date.now() - cycleStartTime) / 1000;

        // Store results
        const cycleResult: CycleResult = {
            cycle: config.cycle,
            name: config.name,
            metrics,
            improvements: config.improvements,
            duration: cycleDuration,
            timestamp: new Date().toISOString(),
        };

        cycleResults.push(cycleResult);

        // Save cycle results
        const cycleResultFile = `${OUTPUT_DIR}/cycle${config.cycle}/result.json`;
        await fs.mkdir(path.dirname(cycleResultFile), { recursive: true });
        await fs.writeFile(
            cycleResultFile,
            JSON.stringify(cycleResult, null, 2),
            "utf-8",
        );

        console.log(
            `\n✅ Cycle ${config.cycle} completed in ${cycleDuration.toFixed(1)}s`,
        );

        // Wait between cycles
        if (i < CYCLE_CONFIGS.length - 1) {
            console.log("\n⏸️  Waiting 10 seconds before next cycle...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }

    // Generate final report
    await generateFinalReport();

    // Save all results
    const allResultsFile = `${OUTPUT_DIR}/all-cycles-${TIMESTAMP}.json`;
    await fs.writeFile(
        allResultsFile,
        JSON.stringify({ cycles: cycleResults, timestamp: TIMESTAMP }, null, 2),
        "utf-8",
    );

    console.log(`\n✅ All results saved to: ${allResultsFile}`);
    console.log(`\n✅ 5-cycle toonplay iteration testing completed!`);
    console.log(`\n📊 Review the comprehensive report at: ${REPORT_FILE}`);

    process.exit(0);
}

// Run main function
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
