#!/usr/bin/env tsx

/**
 * 5-Cycle Iteration Testing Script
 *
 * Performs comprehensive iteration testing on both images and comics generation
 * with progressive improvements across 5 cycles.
 *
 * Each cycle:
 * 1. Tests with updated prompts and parameters
 * 2. Collects metrics and evaluates quality
 * 3. Analyzes results and identifies improvements
 * 4. Updates configuration for next cycle
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/run-5-cycle-iteration.ts
 */

import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Configuration
const OUTPUT_DIR = "results/5-cycle-iteration";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_FILE = `${OUTPUT_DIR}/iteration-report-${TIMESTAMP}.md`;

// Test configuration for each cycle
interface CycleConfig {
    cycle: number;
    name: string;
    hypothesis: string;
    imageTests: {
        scenarios: string[];
        iterations: number;
        customParams?: Record<string, any>;
    };
    comicTests: {
        scenes: string[];
        iterations: number;
        customParams?: Record<string, any>;
    };
    improvements: string[];
}

const CYCLE_CONFIGS: CycleConfig[] = [
    {
        cycle: 1,
        name: "Baseline",
        hypothesis: "Establish baseline metrics for images and comics",
        imageTests: {
            scenarios: [
                "story-cover",
                "character-portrait",
                "setting-landscape",
                "scene-action",
                "emotional-moment",
            ],
            iterations: 3,
        },
        comicTests: {
            scenes: ["action-sequence", "dialogue-heavy", "emotional-beat"],
            iterations: 2,
        },
        improvements: ["Baseline metrics established", "No changes from v1.0"],
    },
    {
        cycle: 2,
        name: "Enhanced Prompt Specificity",
        hypothesis:
            "Improve visual quality and prompt adherence by adding more specific descriptive elements",
        imageTests: {
            scenarios: [
                "story-cover",
                "character-portrait",
                "emotional-moment",
            ],
            iterations: 3,
            customParams: {
                promptEnhancements: [
                    "Add lighting details (e.g., 'soft golden hour lighting', 'dramatic rim lighting')",
                    "Add composition guides (e.g., 'rule of thirds', 'leading lines')",
                    "Add quality descriptors (e.g., 'highly detailed', 'professional photography')",
                ],
            },
        },
        comicTests: {
            scenes: ["action-sequence", "emotional-beat"],
            iterations: 2,
            customParams: {
                promptEnhancements: [
                    "Add camera angle specifics",
                    "Add depth cues (foreground, midground, background)",
                    "Add panel flow indicators",
                ],
            },
        },
        improvements: [
            "Add lighting and atmosphere descriptors to prompts",
            "Include composition guidelines in prompts",
            "Add quality indicators (professional, detailed, etc.)",
        ],
    },
    {
        cycle: 3,
        name: "Optimized Model Parameters",
        hypothesis:
            "Improve generation quality by fine-tuning inference steps and guidance scale",
        imageTests: {
            scenarios: ["story-cover", "scene-action", "emotional-moment"],
            iterations: 3,
            customParams: {
                inferenceSteps: 6, // Increased from 4
                guidanceScale: 1.5, // Increased from 1.0
            },
        },
        comicTests: {
            scenes: ["action-sequence", "dialogue-heavy"],
            iterations: 2,
            customParams: {
                inferenceSteps: 6,
                guidanceScale: 1.5,
            },
        },
        improvements: [
            "Increase inference steps from 4 to 6 for better detail",
            "Increase guidance scale from 1.0 to 1.5 for better prompt adherence",
        ],
    },
    {
        cycle: 4,
        name: "Genre-Specific Prompt Patterns",
        hypothesis:
            "Improve quality through specialized prompt patterns for different genres and scene types",
        imageTests: {
            scenarios: [
                "story-cover",
                "character-portrait",
                "setting-landscape",
            ],
            iterations: 3,
            customParams: {
                genrePromptPatterns: {
                    fantasy:
                        "epic fantasy art style, detailed environment, magical atmosphere",
                    action: "dynamic action scene, motion blur, high energy, dramatic composition",
                    slice: "intimate realistic style, natural lighting, emotional depth",
                },
            },
        },
        comicTests: {
            scenes: ["action-sequence", "emotional-beat", "establishing-shot"],
            iterations: 2,
            customParams: {
                panelPromptPattern:
                    "webtoon style, clean linework, vibrant colors, professional comic art",
            },
        },
        improvements: [
            "Implement genre-specific prompt templates",
            "Add style consistency markers",
            "Include professional quality benchmarks",
        ],
    },
    {
        cycle: 5,
        name: "Final Optimizations",
        hypothesis:
            "Combine all improvements for optimal generation quality across all scenarios",
        imageTests: {
            scenarios: [
                "story-cover",
                "character-portrait",
                "setting-landscape",
                "scene-action",
                "emotional-moment",
            ],
            iterations: 5,
            customParams: {
                inferenceSteps: 6,
                guidanceScale: 1.5,
                promptEnhancements: "all",
                genrePromptPatterns: "all",
            },
        },
        comicTests: {
            scenes: [
                "action-sequence",
                "dialogue-heavy",
                "emotional-beat",
                "establishing-shot",
                "climactic-moment",
            ],
            iterations: 3,
            customParams: {
                inferenceSteps: 6,
                guidanceScale: 1.5,
                promptEnhancements: "all",
                panelPromptPattern: "all",
            },
        },
        improvements: [
            "Combine enhanced prompts from Cycle 2",
            "Use optimized model parameters from Cycle 3",
            "Apply genre-specific patterns from Cycle 4",
            "Full integration test with all improvements",
        ],
    },
];

interface CycleResult {
    cycle: number;
    name: string;
    imageMetrics: any;
    comicMetrics: any;
    improvements: string[];
    duration: number;
    timestamp: string;
}

const cycleResults: CycleResult[] = [];

/**
 * Run image tests for a cycle
 */
async function runImageTests(config: CycleConfig): Promise<any> {
    console.log(`\n📸 Running image tests for Cycle ${config.cycle}...`);
    console.log(`   Scenarios: ${config.imageTests.scenarios.join(", ")}`);
    console.log(`   Iterations: ${config.imageTests.iterations}`);

    const scenariosArg = config.imageTests.scenarios.join(",");
    const outputFile = `${OUTPUT_DIR}/cycle${config.cycle}/images.json`;

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    const command = `cd /home/thomas/GitHub/@dev.realbits/Fictures/apps/web && pnpm exec dotenv -e .env.local -- tsx tests/iteration-testing/images/run-image-tests.ts --version v1.${config.cycle} --scenarios "${scenariosArg}" --iterations ${config.imageTests.iterations} --mode standard --output ${outputFile}`;

    console.log(`   Command: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error("   Warning:", stderr);

        // Load results
        const resultsData = await fs.readFile(outputFile, "utf-8");
        return JSON.parse(resultsData);
    } catch (error: any) {
        console.error(
            `   ✗ Image tests failed for Cycle ${config.cycle}:`,
            error.message,
        );
        return null;
    }
}

/**
 * Run comic tests for a cycle
 */
async function runComicTests(config: CycleConfig): Promise<any> {
    console.log(`\n🎨 Running comic tests for Cycle ${config.cycle}...`);
    console.log(`   Scenes: ${config.comicTests.scenes.join(", ")}`);
    console.log(`   Iterations: ${config.comicTests.iterations}`);

    const scenesArg = config.comicTests.scenes.join(",");
    const outputFile = `${OUTPUT_DIR}/cycle${config.cycle}/comics.json`;

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    const command = `cd /home/thomas/GitHub/@dev.realbits/Fictures/apps/web && pnpm exec dotenv -e .env.local -- tsx tests/iteration-testing/comics/run-comic-tests.ts --version v1.${config.cycle} --scenes "${scenesArg}" --iterations ${config.comicTests.iterations} --mode standard --output ${outputFile}`;

    console.log(`   Command: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error("   Warning:", stderr);

        // Load results
        const resultsData = await fs.readFile(outputFile, "utf-8");
        return JSON.parse(resultsData);
    } catch (error: any) {
        console.error(
            `   ✗ Comic tests failed for Cycle ${config.cycle}:`,
            error.message,
        );
        return null;
    }
}

/**
 * Analyze cycle results and identify improvements
 */
function analyzeCycleResults(
    cycleConfig: CycleConfig,
    imageResults: any,
    comicResults: any,
    previousCycle?: CycleResult,
): string {
    let analysis = `\n## Cycle ${cycleConfig.cycle}: ${cycleConfig.name}\n\n`;
    analysis += `**Hypothesis**: ${cycleConfig.hypothesis}\n\n`;

    // Image metrics analysis
    if (imageResults) {
        const imageMetrics =
            imageResults.aggregatedMetrics ||
            imageResults.summary?.aggregatedMetrics;
        if (imageMetrics) {
            analysis += `### Image Generation Metrics\n\n`;
            analysis += `| Metric | Value | Target | Status |\n`;
            analysis += `|--------|-------|--------|--------|\n`;
            analysis += `| Weighted Score | ${imageMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0 | ≥4.0 | ${(imageMetrics.averageWeightedScore || 0) >= 4.0 ? "✅" : "⚠️"} |\n`;
            analysis += `| Visual Quality | ${imageMetrics.averageVisualQualityScore?.toFixed(2) || "N/A"}/5.0 | ≥4.0 | ${(imageMetrics.averageVisualQualityScore || 0) >= 4.0 ? "✅" : "⚠️"} |\n`;
            analysis += `| Prompt Adherence | ${imageMetrics.averagePromptAdherence?.toFixed(1) || "N/A"}% | ≥90% | ${(imageMetrics.averagePromptAdherence || 0) >= 90 ? "✅" : "⚠️"} |\n`;
            analysis += `| Generation Time | ${imageMetrics.averageGenerationTime?.toFixed(1) || "N/A"}s | <15s | ${(imageMetrics.averageGenerationTime || 0) < 15 ? "✅" : "⚠️"} |\n`;
            analysis += `| Success Rate | ${(imageMetrics.successRate || 0) * 100}% | ≥95% | ${(imageMetrics.successRate || 0) >= 0.95 ? "✅" : "⚠️"} |\n\n`;
        } else {
            analysis += `### Image Generation Metrics\n\n`;
            analysis += `No image metrics available for this cycle.\n\n`;
        }
    }

    // Comparison with previous cycle for images
    if (imageResults && previousCycle && previousCycle.imageMetrics) {
        const imageMetrics =
            imageResults.aggregatedMetrics ||
            imageResults.summary?.aggregatedMetrics;
        if (imageMetrics) {
            const prevMetrics = previousCycle.imageMetrics;
            const currentMetrics = imageMetrics;

            analysis += `#### Changes from Previous Cycle\n\n`;
            const scoreDelta =
                (currentMetrics.averageWeightedScore || 0) -
                (prevMetrics.averageWeightedScore || 0);
            const visualDelta =
                (currentMetrics.averageVisualQualityScore || 0) -
                (prevMetrics.averageVisualQualityScore || 0);
            const adherenceDelta =
                (currentMetrics.averagePromptAdherence || 0) -
                (prevMetrics.averagePromptAdherence || 0);

            analysis += `- Weighted Score: ${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(2)} (${scoreDelta > 0 ? "✅ Improved" : scoreDelta < 0 ? "❌ Degraded" : "➖ No change"})\n`;
            analysis += `- Visual Quality: ${visualDelta > 0 ? "+" : ""}${visualDelta.toFixed(2)} (${visualDelta > 0 ? "✅ Improved" : visualDelta < 0 ? "❌ Degraded" : "➖ No change"})\n`;
            analysis += `- Prompt Adherence: ${adherenceDelta > 0 ? "+" : ""}${adherenceDelta.toFixed(1)}% (${adherenceDelta > 0 ? "✅ Improved" : adherenceDelta < 0 ? "❌ Degraded" : "➖ No change"})\n\n`;
        }
    }

    // Comic metrics analysis
    if (comicResults) {
        const comicMetrics =
            comicResults.aggregatedMetrics ||
            comicResults.summary?.aggregatedMetrics;
        if (comicMetrics) {
            analysis += `### Comic Generation Metrics\n\n`;
            analysis += `| Metric | Value | Target | Status |\n`;
            analysis += `|--------|-------|--------|--------|\n`;
            analysis += `| Weighted Score | ${comicMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0 | ≥4.0 | ${(comicMetrics.averageWeightedScore || 0) >= 4.0 ? "✅" : "⚠️"} |\n`;
            analysis += `| Panel Quality | ${comicMetrics.categoryAverages?.panelQuality?.toFixed(2) || "N/A"}/5.0 | ≥4.0 | ${(comicMetrics.categoryAverages?.panelQuality || 0) >= 4.0 ? "✅" : "⚠️"} |\n`;
            analysis += `| Narrative Coherence | ${comicMetrics.categoryAverages?.narrativeCoherence?.toFixed(2) || "N/A"}/5.0 | ≥4.0 | ${(comicMetrics.categoryAverages?.narrativeCoherence || 0) >= 4.0 ? "✅" : "⚠️"} |\n`;
            analysis += `| Generation Time/Panel | ${comicMetrics.averageGenerationTimePerPanel?.toFixed(1) || "N/A"}s | <15s | ${(comicMetrics.averageGenerationTimePerPanel || 0) < 15 ? "✅" : "⚠️"} |\n`;
            analysis += `| Success Rate | ${(comicMetrics.successRate || 0) * 100}% | ≥95% | ${(comicMetrics.successRate || 0) >= 0.95 ? "✅" : "⚠️"} |\n\n`;

            // Comparison with previous cycle
            if (previousCycle && previousCycle.comicMetrics) {
                const prevMetrics = previousCycle.comicMetrics;
                const currentMetrics = comicMetrics;

                analysis += `#### Changes from Previous Cycle\n\n`;
                const scoreDelta =
                    (currentMetrics.averageWeightedScore || 0) -
                    (prevMetrics.averageWeightedScore || 0);
                const panelDelta =
                    (currentMetrics.categoryAverages?.panelQuality || 0) -
                    (prevMetrics.categoryAverages?.panelQuality || 0);

                analysis += `- Weighted Score: ${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(2)} (${scoreDelta > 0 ? "✅ Improved" : scoreDelta < 0 ? "❌ Degraded" : "➖ No change"})\n`;
                analysis += `- Panel Quality: ${panelDelta > 0 ? "+" : ""}${panelDelta.toFixed(2)} (${panelDelta > 0 ? "✅ Improved" : panelDelta < 0 ? "❌ Degraded" : "➖ No change"})\n\n`;
            }
        } else {
            analysis += `### Comic Generation Metrics\n\n`;
            analysis += `No comic metrics available for this cycle (comics test requires database scenes).\n\n`;
        }
    }

    // Improvements applied
    analysis += `### Improvements Applied\n\n`;
    for (const improvement of cycleConfig.improvements) {
        analysis += `- ${improvement}\n`;
    }
    analysis += `\n`;

    return analysis;
}

/**
 * Generate comprehensive final report
 */
async function generateFinalReport(): Promise<void> {
    console.log("\n📝 Generating comprehensive final report...");

    let report = `# 5-Cycle Iteration Testing Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n\n`;
    report += `**Total Duration**: ${cycleResults.reduce((sum, r) => sum + r.duration, 0).toFixed(0)}s (${(cycleResults.reduce((sum, r) => sum + r.duration, 0) / 60).toFixed(1)} minutes)\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This report documents the results of 5 comprehensive iteration cycles testing both image and comic generation systems.\n\n`;

    // Overall improvements
    if (cycleResults.length > 1) {
        const firstCycle = cycleResults[0];
        const lastCycle = cycleResults[cycleResults.length - 1];

        if (firstCycle.imageMetrics && lastCycle.imageMetrics) {
            const imageImprovement =
                (lastCycle.imageMetrics.averageWeightedScore || 0) -
                (firstCycle.imageMetrics.averageWeightedScore || 0);
            report += `### Image Generation Improvement\n\n`;
            report += `- **Baseline** (Cycle 1): ${firstCycle.imageMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0\n`;
            report += `- **Final** (Cycle 5): ${lastCycle.imageMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0\n`;
            report += `- **Improvement**: ${imageImprovement > 0 ? "+" : ""}${imageImprovement.toFixed(2)} (${((imageImprovement / (firstCycle.imageMetrics.averageWeightedScore || 1)) * 100).toFixed(1)}%)\n\n`;
        }

        if (firstCycle.comicMetrics && lastCycle.comicMetrics) {
            const comicImprovement =
                (lastCycle.comicMetrics.averageWeightedScore || 0) -
                (firstCycle.comicMetrics.averageWeightedScore || 0);
            report += `### Comic Generation Improvement\n\n`;
            report += `- **Baseline** (Cycle 1): ${firstCycle.comicMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0\n`;
            report += `- **Final** (Cycle 5): ${lastCycle.comicMetrics.averageWeightedScore?.toFixed(2) || "N/A"}/5.0\n`;
            report += `- **Improvement**: ${comicImprovement > 0 ? "+" : ""}${comicImprovement.toFixed(2)} (${((comicImprovement / (firstCycle.comicMetrics.averageWeightedScore || 1)) * 100).toFixed(1)}%)\n\n`;
        }
    }

    // Detailed cycle results
    report += `## Detailed Cycle Results\n\n`;
    for (let i = 0; i < cycleResults.length; i++) {
        const result = cycleResults[i];
        const config = CYCLE_CONFIGS[i];
        const previousCycle = i > 0 ? cycleResults[i - 1] : undefined;

        report += analyzeCycleResults(
            config,
            result.imageMetrics,
            result.comicMetrics,
            previousCycle,
        );
    }

    // Key findings
    report += `## Key Findings\n\n`;
    report += `### Most Effective Improvements\n\n`;

    // Calculate which cycle had the biggest improvement
    let maxImageImprovement = 0;
    let maxImageCycle = 0;
    let maxComicImprovement = 0;
    let maxComicCycle = 0;

    for (let i = 1; i < cycleResults.length; i++) {
        const current = cycleResults[i];
        const previous = cycleResults[i - 1];

        if (current.imageMetrics && previous.imageMetrics) {
            const improvement =
                (current.imageMetrics.averageWeightedScore || 0) -
                (previous.imageMetrics.averageWeightedScore || 0);
            if (improvement > maxImageImprovement) {
                maxImageImprovement = improvement;
                maxImageCycle = i + 1;
            }
        }

        if (current.comicMetrics && previous.comicMetrics) {
            const improvement =
                (current.comicMetrics.averageWeightedScore || 0) -
                (previous.comicMetrics.averageWeightedScore || 0);
            if (improvement > maxComicImprovement) {
                maxComicImprovement = improvement;
                maxComicCycle = i + 1;
            }
        }
    }

    report += `- **Biggest Image Improvement**: Cycle ${maxComicCycle} (${CYCLE_CONFIGS[maxImageCycle - 1]?.name}) with +${maxImageImprovement.toFixed(2)} improvement\n`;
    report += `- **Biggest Comic Improvement**: Cycle ${maxComicCycle} (${CYCLE_CONFIGS[maxComicCycle - 1]?.name}) with +${maxComicImprovement.toFixed(2)} improvement\n\n`;

    // Recommendations
    report += `## Recommendations\n\n`;

    const lastCycle = cycleResults[cycleResults.length - 1];

    if (lastCycle.imageMetrics) {
        const imageScore = lastCycle.imageMetrics.averageWeightedScore || 0;
        const visualScore =
            lastCycle.imageMetrics.averageVisualQualityScore || 0;
        const adherence = lastCycle.imageMetrics.averagePromptAdherence || 0;

        report += `### Image Generation\n\n`;
        if (imageScore >= 4.5) {
            report += `- ✅ **Overall quality is excellent** (${imageScore.toFixed(2)}/5.0)\n`;
        } else if (imageScore >= 4.0) {
            report += `- ⚠️ **Quality is good but has room for improvement** (${imageScore.toFixed(2)}/5.0)\n`;
        } else {
            report += `- ❌ **Quality needs significant improvement** (${imageScore.toFixed(2)}/5.0)\n`;
        }

        if (visualScore < 4.0) {
            report += `- 🎨 **Focus on visual quality improvements** (current: ${visualScore.toFixed(2)}/5.0)\n`;
            report += `  - Consider higher inference steps\n`;
            report += `  - Add more detailed composition guidelines\n`;
            report += `  - Test different art styles and quality descriptors\n`;
        }

        if (adherence < 90) {
            report += `- 📝 **Improve prompt adherence** (current: ${adherence.toFixed(1)}%)\n`;
            report += `  - Use more specific and structured prompts\n`;
            report += `  - Add emphasis markers for key elements\n`;
            report += `  - Test higher guidance scale values\n`;
        }
        report += `\n`;
    }

    if (lastCycle.comicMetrics) {
        const comicScore = lastCycle.comicMetrics.averageWeightedScore || 0;
        const panelQuality =
            lastCycle.comicMetrics.categoryAverages?.panelQuality || 0;

        report += `### Comic Generation\n\n`;
        if (comicScore >= 4.5) {
            report += `- ✅ **Overall quality is excellent** (${comicScore.toFixed(2)}/5.0)\n`;
        } else if (comicScore >= 4.0) {
            report += `- ⚠️ **Quality is good but has room for improvement** (${comicScore.toFixed(2)}/5.0)\n`;
        } else {
            report += `- ❌ **Quality needs significant improvement** (${comicScore.toFixed(2)}/5.0)\n`;
        }

        if (panelQuality < 4.0) {
            report += `- 🎨 **Focus on panel quality improvements** (current: ${panelQuality.toFixed(2)}/5.0)\n`;
            report += `  - Refine character consistency prompts\n`;
            report += `  - Add more specific camera angle guidelines\n`;
            report += `  - Test panel-specific composition rules\n`;
        }
        report += `\n`;
    }

    // Next steps
    report += `## Next Steps\n\n`;
    report += `1. **Implement best-performing parameters** from Cycle ${cycleResults.length} as defaults\n`;
    report += `2. **Update prompt templates** with successful patterns identified\n`;
    report += `3. **Run validation tests** to confirm improvements in production\n`;
    report += `4. **Monitor quality metrics** in real-world usage\n`;
    report += `5. **Schedule next iteration cycle** in 1-2 months to continue improvements\n\n`;

    // Appendix
    report += `## Appendix\n\n`;
    report += `### Test Configuration\n\n`;
    for (let i = 0; i < CYCLE_CONFIGS.length; i++) {
        const config = CYCLE_CONFIGS[i];
        report += `#### Cycle ${config.cycle}: ${config.name}\n\n`;
        report += `- **Hypothesis**: ${config.hypothesis}\n`;
        report += `- **Image Scenarios**: ${config.imageTests.scenarios.join(", ")}\n`;
        report += `- **Image Iterations**: ${config.imageTests.iterations}\n`;
        report += `- **Comic Scenes**: ${config.comicTests.scenes.join(", ")}\n`;
        report += `- **Comic Iterations**: ${config.comicTests.iterations}\n\n`;
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
              5-CYCLE ITERATION TESTING
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

        // Run image tests
        const imageResults = await runImageTests(config);

        // Wait a bit between test types to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Run comic tests
        const comicResults = await runComicTests(config);

        const cycleDuration = (Date.now() - cycleStartTime) / 1000;

        // Store results
        const cycleResult: CycleResult = {
            cycle: config.cycle,
            name: config.name,
            imageMetrics:
                imageResults?.aggregatedMetrics ||
                imageResults?.summary?.aggregatedMetrics,
            comicMetrics:
                comicResults?.aggregatedMetrics ||
                comicResults?.summary?.aggregatedMetrics,
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
    console.log(`\n✅ 5-cycle iteration testing completed!`);
    console.log(`\n📊 Review the comprehensive report at: ${REPORT_FILE}`);

    process.exit(0);
}

// Run main function
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
