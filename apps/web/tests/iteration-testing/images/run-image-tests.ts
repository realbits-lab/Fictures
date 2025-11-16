#!/usr/bin/env tsx

/**
 * Run Image Tests - Generate and evaluate images for iteration testing
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts \
 *     --version v1.0 \
 *     --scenarios "story-cover,character-portrait" \
 *     --iterations 5 \
 *     --mode standard \
 *     --output results/v1.0/baseline.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScenario, TEST_SCENARIOS } from "./config/test-scenarios";
import { ImageMetricsTracker } from "./src/metrics-tracker";
import type { ImageTestResult, ImageEvaluation } from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        version: { type: "string", default: "v1.0" },
        scenarios: { type: "string" },
        iterations: { type: "string", default: "5" },
        mode: { type: "string", default: "standard" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Run Image Tests - Generate and evaluate images for iteration testing

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts [options]

Options:
  --version    <string>  Prompt version to test (default: v1.0)
  --scenarios  <string>  Comma-separated test scenario IDs (default: all)
  --iterations <number>  Number of images per scenario (default: 5)
  --mode       <string>  Evaluation mode: quick|standard|thorough (default: standard)
  --output     <string>  Output file path (default: results/{version}/suite-{timestamp}.json)
  --help                 Show this help message

Examples:
  # Run baseline test with all scenarios
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts --version v1.0 --iterations 5

  # Test specific scenarios
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts --scenarios "story-cover,character-portrait"

  # Quick evaluation mode for rapid testing
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts --mode quick
  `);
    process.exit(0);
}

// Configuration
const PROMPT_VERSION = values.version || "v1.0";
const EVALUATION_MODE =
    (values.mode as "quick" | "standard" | "thorough") || "standard";
const ITERATIONS = parseInt(values.iterations || "5", 10);
const TEST_SCENARIO_IDS = values.scenarios
    ? values.scenarios.split(",").map((s) => s.trim())
    : TEST_SCENARIOS.map((s) => s.id);

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output || `results/${PROMPT_VERSION}/suite-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
         IMAGE EVALUATION SUITE - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Prompt Version:  ${PROMPT_VERSION}
  Evaluation Mode: ${EVALUATION_MODE}
  Test Scenarios:   ${TEST_SCENARIO_IDS.length} scenarios
  Iterations:      ${ITERATIONS} per scenario
  Total Images:     ${TEST_SCENARIO_IDS.length * ITERATIONS}
  Output:          ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

/**
 * Generate an image for a test scenario
 */
async function generateImage(
    scenarioId: string,
    prompt: string,
    imageType: string,
): Promise<{
    imageUrl: string;
    imageVariants: { avif1x: string; avif2x: string };
    metadata: {
        width: number;
        height: number;
        aspectRatio: string;
        originalSize: number;
        avif1xSize: number;
        avif2xSize: number;
    };
    generationTime: number;
    optimizationTime: number;
    totalTime: number;
    provider: string;
    model: string;
}> {
    console.log(`  → Generating image: "${prompt.substring(0, 50)}..."`);

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
        // Call image generation API
        const response = await fetch(`http://localhost:3000/api/studio/images`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({
                prompt,
                contentId: `test-${scenarioId}-${Date.now()}`,
                imageType,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Image generation failed: ${response.statusText} - ${errorText}`,
            );
        }

        const result = await response.json();

        if (!result.success || !result.imageUrl) {
            throw new Error("Image generation returned invalid result");
        }

        const generationTime = Date.now() - startTime;
        const optimizationTime = result.metadata?.optimizationTime || 0;
        const totalTime = generationTime;

        // Extract metadata
        const metadata = {
            width: result.metadata?.width || 1344,
            height: result.metadata?.height || 768,
            aspectRatio: result.metadata?.aspectRatio || "7:4",
            originalSize: result.metadata?.originalSize || 0,
            avif1xSize: result.imageVariants?.avif1x?.size || 0,
            avif2xSize: result.imageVariants?.avif2x?.size || 0,
        };

        console.log(
            `    ✓ Image generated in ${(generationTime / 1000).toFixed(1)}s`,
        );

        return {
            imageUrl: result.imageUrl,
            imageVariants: {
                avif1x: result.imageVariants?.avif1x?.url || "",
                avif2x: result.imageVariants?.avif2x?.url || "",
            },
            metadata,
            generationTime: generationTime / 1000, // Convert to seconds
            optimizationTime: optimizationTime / 1000,
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
 * Evaluate an image
 */
async function evaluateImage(
    imageResult: Awaited<ReturnType<typeof generateImage>>,
    scenario: ReturnType<typeof getTestScenario>,
    evaluationMode: "quick" | "standard" | "thorough",
): Promise<ImageEvaluation> {
    console.log(`  → Evaluating image...`);

    // For quick mode, use automated metrics only
    if (evaluationMode === "quick") {
        return evaluateImageQuick(imageResult, scenario);
    }

    // For standard/thorough, use AI evaluation
    // TODO: Implement AI evaluation endpoint when available
    // For now, use quick evaluation
    return evaluateImageQuick(imageResult, scenario);
}

/**
 * Quick evaluation using automated metrics only
 */
function evaluateImageQuick(
    imageResult: Awaited<ReturnType<typeof generateImage>>,
    scenario: ReturnType<typeof getTestScenario>,
): ImageEvaluation {
    const { metadata } = imageResult;

    // Calculate aspect ratio accuracy
    const expectedRatio = scenario?.expectedAspectRatio || "7:4";
    const [expectedW, expectedH] = expectedRatio.split(":").map(Number);
    const expectedAspect = expectedW / expectedH;
    const actualAspect = metadata.width / metadata.height;
    const aspectRatioAccuracy = Math.abs(1 - actualAspect / expectedAspect) * 100;

    // Calculate compression ratio
    const originalSize = metadata.originalSize || metadata.avif1xSize * 20; // Estimate if missing
    const totalVariantSize = metadata.avif1xSize + metadata.avif2xSize;
    const avifCompressionRatio =
        originalSize > 0
            ? ((originalSize - totalVariantSize) / originalSize) * 100
            : 0;

    // Calculate category scores (simplified for now)
    const generationQuality = Math.max(
        1,
        Math.min(
            5,
            5 - aspectRatioAccuracy / 2 + (metadata.resolutionCompliance ? 0.5 : -1),
        ),
    );
    const optimizationQuality = Math.max(
        1,
        Math.min(5, (avifCompressionRatio / 20) + 2),
    );
    const visualQuality = 3.5; // Placeholder - would need AI evaluation
    const performance = Math.max(
        1,
        Math.min(5, 5 - (imageResult.generationTime - 8) / 2),
    );

    // Calculate weighted score
    const weightedScore =
        generationQuality * 0.3 +
        optimizationQuality * 0.25 +
        visualQuality * 0.25 +
        performance * 0.2;

    return {
        weightedScore,
        passes: weightedScore >= 3.0,
        categoryScores: {
            generationQuality,
            optimizationQuality,
            visualQuality,
            performance,
        },
        metrics: {
            aspectRatioAccuracy,
            resolutionCompliance: true, // Assume compliant if generated
            promptAdherence: 85, // Placeholder - would need AI evaluation
            formatValidation: true,
            fileSize: metadata.originalSize / 1024, // Convert to KB
            avifCompressionRatio,
            avif1xSize: metadata.avif1xSize / 1024,
            avif2xSize: metadata.avif2xSize / 1024,
            totalVariantSize: totalVariantSize / 1024,
            storageRatio: (totalVariantSize / originalSize) * 100,
            visualQualityScore: visualQuality,
            artifactCount: 0, // Placeholder
            aspectRatioPreservation: 0.1, // Assume good preservation
            variantCount: 2,
            formatValidation: true,
            imageAccessibility: true,
            generationTime: imageResult.generationTime,
            optimizationTime: imageResult.optimizationTime,
            totalTime: imageResult.totalTime,
            success: true,
        },
        recommendations: [],
        finalReport: `Image generated successfully. Aspect ratio: ${actualAspect.toFixed(2)}, Compression: ${avifCompressionRatio.toFixed(1)}%`,
    };
}

/**
 * Main test execution
 */
async function main() {
    const results: ImageTestResult[] = [];
    const tracker = new ImageMetricsTracker();

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });

    let totalTests = 0;
    const totalExpected = TEST_SCENARIO_IDS.length * ITERATIONS;

    for (const scenarioId of TEST_SCENARIO_IDS) {
        const scenario = getTestScenario(scenarioId);
        if (!scenario) {
            console.error(`  ✗ Scenario not found: ${scenarioId}`);
            continue;
        }

        console.log(`\n📸 Testing Scenario: ${scenario.name} (${scenarioId})`);

        for (let i = 0; i < ITERATIONS; i++) {
            totalTests++;
            const testId = `${scenarioId}-${i + 1}`;

            console.log(
                `\n[${totalTests}/${totalExpected}] Test ${i + 1}/${ITERATIONS}: ${scenario.name}`,
            );

            try {
                // Generate image
                const imageResult = await generateImage(
                    scenarioId,
                    scenario.prompt,
                    scenario.imageType,
                );

                // Evaluate image
                const evaluation = await evaluateImage(
                    imageResult,
                    scenario,
                    EVALUATION_MODE,
                );

                // Create test result
                const testResult: ImageTestResult = {
                    testId,
                    scenarioId,
                    scenarioName: scenario.name,
                    promptVersion: PROMPT_VERSION,
                    timestamp: new Date().toISOString(),
                    image: {
                        imageUrl: imageResult.imageUrl,
                        imageVariants: imageResult.imageVariants,
                        metadata: imageResult.metadata,
                    },
                    evaluation,
                    metadata: {
                        generationTime: imageResult.generationTime,
                        optimizationTime: imageResult.optimizationTime,
                        totalTime: imageResult.totalTime,
                        provider: imageResult.provider,
                        model: imageResult.model,
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
        testScenarios: TEST_SCENARIO_IDS,
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
    Generation Quality:   ${aggregatedMetrics.categoryAverages.generationQuality.toFixed(2)}/5.0
    Optimization Quality: ${aggregatedMetrics.categoryAverages.optimizationQuality.toFixed(2)}/5.0
    Visual Quality:       ${aggregatedMetrics.categoryAverages.visualQuality.toFixed(2)}/5.0
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

