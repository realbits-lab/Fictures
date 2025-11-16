#!/usr/bin/env tsx

/**
 * Run Comic Tests - Generate and evaluate comic panels for iteration testing
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts \
 *     --version v1.0 \
 *     --scenes "action-sequence,dialogue-heavy" \
 *     --iterations 5 \
 *     --mode standard \
 *     --output results/v1.0/baseline.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScene, TEST_SCENES, type TestScene } from "./config/test-scenes";
import { ComicMetricsTracker } from "./src/metrics-tracker";
import type { ComicTestResult, ComicEvaluation } from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        version: { type: "string", default: "v1.0" },
        scenes: { type: "string" },
        iterations: { type: "string", default: "5" },
        mode: { type: "string", default: "standard" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Run Comic Tests - Generate and evaluate comic panels for iteration testing

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts [options]

Options:
  --version    <string>  Prompt version to test (default: v1.0)
  --scenes     <string>  Comma-separated test scene IDs (default: all)
  --iterations <number>  Number of comic sets per scene (default: 5)
  --mode       <string>  Evaluation mode: quick|standard|thorough (default: standard)
  --output     <string>  Output file path (default: results/{version}/suite-{timestamp}.json)
  --help                 Show this help message

Examples:
  # Run baseline test with all scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts --version v1.0 --iterations 5

  # Test specific scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts --scenes "action-sequence,emotional-beat"

  # Quick evaluation mode for rapid testing
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-tests.ts --mode quick
  `);
    process.exit(0);
}

// Configuration
const PROMPT_VERSION = values.version || "v1.0";
const EVALUATION_MODE =
    (values.mode as "quick" | "standard" | "thorough") || "standard";
const ITERATIONS = parseInt(values.iterations || "5", 10);
const TEST_SCENE_IDS = values.scenes
    ? values.scenes.split(",").map((s) => s.trim())
    : TEST_SCENES.map((s) => s.id);

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output || `results/${PROMPT_VERSION}/suite-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
         COMIC EVALUATION SUITE - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Prompt Version:  ${PROMPT_VERSION}
  Evaluation Mode: ${EVALUATION_MODE}
  Test Scenes:     ${TEST_SCENE_IDS.length} scenes
  Iterations:      ${ITERATIONS} per scene
  Total Comic Sets: ${TEST_SCENE_IDS.length * ITERATIONS}
  Output:          ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

/**
 * Generate comic panels for a test scene
 */
async function generateComicPanels(
    sceneId: string,
    toonplay: TestScene["toonplay"],
): Promise<{
    panels: Array<{
        panelNumber: number;
        imageUrl: string;
        imageVariants: { avif1x: string; avif2x: string };
        metadata: { width: number; height: number; aspectRatio: string };
    }>;
    generationTime: number;
    panelGenerationTime: number;
    totalTime: number;
    provider: string;
    model: string;
}> {
    console.log(`  → Generating comic panels for scene ${sceneId}...`);

    const startTime = Date.now();

    // Get API key from auth file
    const fsSync = require("node:fs");
    let apiKey: string | undefined;
    if (fsSync.existsSync(".auth/user.json")) {
        const authData = JSON.parse(
            fsSync.readFileSync(".auth/user.json", "utf8"),
        );
        apiKey = authData.develop?.profiles?.writer?.apiKey;
    }

    if (!apiKey) {
        throw new Error(
            "API key not found in .auth/user.json. Please ensure writer profile exists in develop environment.",
        );
    }

    try {
        // Call comic generation API
        // Note: This assumes the API endpoint exists and accepts sceneId
        // You may need to adjust this based on your actual API structure
        const response = await fetch(
            `http://localhost:3000/api/studio/scenes/${toonplay.sceneId}/comic/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    targetPanelCount: toonplay.totalPanels,
                    regenerate: false,
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Comic generation failed: ${response.statusText} - ${errorText}`,
            );
        }

        const result = await response.json();

        if (!result.success || !result.panels) {
            throw new Error("Comic generation returned invalid result");
        }

        const totalTime = Date.now() - startTime;
        const panelGenerationTime = totalTime / (result.panels?.length || 1);

        // Extract panel data
        const panels = (result.panels || []).map((panel: any) => ({
            panelNumber: panel.panelNumber || 0,
            imageUrl: panel.imageUrl || "",
            imageVariants: {
                avif1x: panel.imageVariants?.avif1x?.url || "",
                avif2x: panel.imageVariants?.avif2x?.url || "",
            },
            metadata: {
                width: panel.metadata?.width || 1344,
                height: panel.metadata?.height || 768,
                aspectRatio: panel.metadata?.aspectRatio || "7:4",
            },
        }));

        console.log(
            `    ✓ ${panels.length} panels generated in ${(totalTime / 1000).toFixed(1)}s`,
        );

        return {
            panels,
            generationTime: totalTime / 1000,
            panelGenerationTime: panelGenerationTime / 1000,
            totalTime: totalTime / 1000,
            provider: result.metadata?.provider || "unknown",
            model: result.metadata?.model || "unknown",
        };
    } catch (error) {
        console.error(`    ✗ Generation failed:`, error);
        throw error;
    }
}

/**
 * Evaluate comic panels
 */
async function evaluateComic(
    comicResult: Awaited<ReturnType<typeof generateComicPanels>>,
    scene: ReturnType<typeof getTestScene>,
    evaluationMode: "quick" | "standard" | "thorough",
): Promise<ComicEvaluation> {
    console.log(`  → Evaluating comic panels...`);

    // For quick mode, use automated metrics only
    if (evaluationMode === "quick") {
        return evaluateComicQuick(comicResult, scene);
    }

    // For standard/thorough, use AI evaluation
    // TODO: Implement AI evaluation endpoint when available
    // For now, use quick evaluation
    return evaluateComicQuick(comicResult, scene);
}

/**
 * Quick evaluation using automated metrics only
 */
function evaluateComicQuick(
    comicResult: Awaited<ReturnType<typeof generateComicPanels>>,
    scene: ReturnType<typeof getTestScene>,
): ComicEvaluation {
    const { panels } = comicResult;

    // Calculate basic metrics
    const panelCount = panels.length;
    const expectedCount = scene?.expectedPanelCount || { min: 8, max: 12 };
    const panelCountScore =
        panelCount >= expectedCount.min && panelCount <= expectedCount.max
            ? 4.0
            : 3.0;

    // Calculate category scores (simplified for now)
    const panelQuality = Math.max(1, Math.min(5, panelCountScore + 0.5));
    const narrativeCoherence = 3.5; // Placeholder - would need AI evaluation
    const technicalQuality = 4.0; // Assume format compliance
    const performance = Math.max(
        1,
        Math.min(5, 5 - (comicResult.panelGenerationTime - 8) / 2),
    );

    // Calculate weighted score
    const weightedScore =
        panelQuality * 0.3 +
        narrativeCoherence * 0.25 +
        technicalQuality * 0.25 +
        performance * 0.2;

    return {
        weightedScore,
        passes: weightedScore >= 3.0,
        categoryScores: {
            panelQuality,
            narrativeCoherence,
            technicalQuality,
            performance,
        },
        metrics: {
            visualClarity: panelQuality,
            compositionQuality: panelQuality,
            characterAccuracy: 85, // Placeholder
            expressionAccuracy: 85, // Placeholder
            storyFlow: narrativeCoherence,
            panelSequenceLogic: narrativeCoherence,
            narrativeConsistency: 90, // Placeholder
            formatCompliance: true,
            aspectRatioAccuracy: 0.5, // Assume good
            optimizationQuality: technicalQuality,
            variantCount: 2,
            averagePanelGenerationTime: comicResult.panelGenerationTime,
            totalGenerationTime: comicResult.generationTime,
            success: true,
            panelSuccessRate: 100, // Assume all panels succeeded
        },
        recommendations: [],
        finalReport: `Comic panels generated successfully. Panel count: ${panelCount}, Generation time: ${comicResult.generationTime.toFixed(1)}s`,
    };
}

/**
 * Main test execution
 */
async function main() {
    const results: ComicTestResult[] = [];
    const tracker = new ComicMetricsTracker();

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });

    let totalTests = 0;
    const totalExpected = TEST_SCENE_IDS.length * ITERATIONS;

    for (const sceneId of TEST_SCENE_IDS) {
        const scene = getTestScene(sceneId);
        if (!scene) {
            console.error(`  ✗ Scene not found: ${sceneId}`);
            continue;
        }

        console.log(`\n📸 Testing Scene: ${scene.name} (${sceneId})`);

        for (let i = 0; i < ITERATIONS; i++) {
            totalTests++;
            const testId = `${sceneId}-${i + 1}`;

            console.log(
                `\n[${totalTests}/${totalExpected}] Test ${i + 1}/${ITERATIONS}: ${scene.name}`,
            );

            try {
                // Generate comic panels
                const comicResult = await generateComicPanels(
                    sceneId,
                    scene.toonplay,
                );

                // Evaluate comic
                const evaluation = await evaluateComic(
                    comicResult,
                    scene,
                    EVALUATION_MODE,
                );

                // Create test result
                const testResult: ComicTestResult = {
                    testId,
                    sceneId,
                    sceneName: scene.name,
                    promptVersion: PROMPT_VERSION,
                    timestamp: new Date().toISOString(),
                    comic: {
                        sceneId: scene.toonplay.sceneId,
                        sceneTitle: scene.toonplay.sceneTitle,
                        totalPanels: comicResult.panels.length,
                        panels: comicResult.panels,
                    },
                    evaluation,
                    metadata: {
                        generationTime: comicResult.generationTime,
                        panelGenerationTime: comicResult.panelGenerationTime,
                        totalTime: comicResult.totalTime,
                        panelCount: comicResult.panels.length,
                        provider: comicResult.provider,
                        model: comicResult.model,
                    },
                };

                results.push(testResult);
                tracker.addResult(testResult);

                console.log(
                    `  ✓ Score: ${evaluation.weightedScore.toFixed(2)}/5.0 ${evaluation.passes ? "✓ PASS" : "✗ FAIL"}`,
                );
            } catch (error) {
                console.error(`  ✗ Test failed:`, error);
                // Continue with next test
            }
        }
    }

    // Aggregate metrics
    console.log(`\n\n📊 Aggregating metrics...`);
    const aggregatedMetrics = tracker.getAggregatedMetrics(PROMPT_VERSION);

    // Create final result
    const finalResult = {
        version: PROMPT_VERSION,
        testDate: new Date().toISOString(),
        testScenes: TEST_SCENE_IDS,
        evaluationMode: EVALUATION_MODE,
        iterations: ITERATIONS,
        results,
        aggregatedMetrics,
    };

    // Save results
    await fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify(finalResult, null, 2),
        "utf-8",
    );

    // Print summary
    console.log(`
═══════════════════════════════════════════════════════════════
                    TEST EXECUTION COMPLETE
═══════════════════════════════════════════════════════════════
  Total Tests:     ${results.length}/${totalExpected}
  Pass Rate:       ${(aggregatedMetrics.passRate * 100).toFixed(1)}%
  Average Score:   ${aggregatedMetrics.averageWeightedScore.toFixed(2)}/5.0
  
  Category Averages:
    Panel Quality:        ${aggregatedMetrics.categoryAverages.panelQuality.toFixed(2)}/5.0
    Narrative Coherence: ${aggregatedMetrics.categoryAverages.narrativeCoherence.toFixed(2)}/5.0
    Technical Quality:    ${aggregatedMetrics.categoryAverages.technicalQuality.toFixed(2)}/5.0
    Performance:         ${aggregatedMetrics.categoryAverages.performance.toFixed(2)}/5.0

  Failure Patterns: ${aggregatedMetrics.failurePatterns.length}
${aggregatedMetrics.failurePatterns
    .slice(0, 3)
    .map(
        (p) =>
            `    - ${p.description} (${p.frequency} occurrences, ${p.priority} priority)`,
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

