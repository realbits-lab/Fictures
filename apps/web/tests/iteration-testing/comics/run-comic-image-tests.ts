#!/usr/bin/env tsx

/**
 * Run Comic Image Tests - Generate comic panel images using static panel data
 *
 * This test focuses ONLY on image generation for comic panels.
 * It uses static panel descriptions from test-scenes.ts and calls the AI server
 * directly for image generation.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-image-tests.ts \
 *     --iterations 5 \
 *     --output results/v1.0/image-test.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { TEST_SCENES, type TestScene } from "./config/test-scenes";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        iterations: { type: "string", default: "5" },
        scenes: { type: "string" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Run Comic Image Tests - Generate comic panel images using static data

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/comics/run-comic-image-tests.ts [options]

Options:
  --iterations <number>  Number of image sets per scene (default: 5)
  --scenes     <string>  Comma-separated test scene IDs (default: all)
  --output     <string>  Output file path
  --help                 Show this help message
    `);
    process.exit(0);
}

// Configuration
const ITERATIONS = parseInt(values.iterations || "5", 10);
const TEST_SCENE_IDS = values.scenes
    ? values.scenes.split(",").map((s) => s.trim())
    : TEST_SCENES.map((s) => s.id);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output || `results/v1.0/image-test-${timestamp}.json`;

// AI Server configuration
const AI_SERVER_URL = process.env.AI_SERVER_IMAGE_URL || "http://localhost:8000";

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

console.log(`
═══════════════════════════════════════════════════════════════
         COMIC IMAGE GENERATION TEST - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  AI Server:       ${AI_SERVER_URL}
  Test Scenes:     ${TEST_SCENE_IDS.length} scenes
  Iterations:      ${ITERATIONS} per scene
  Total Images:    ${TEST_SCENE_IDS.length * ITERATIONS * 2} (2 panels per test)
  Output:          ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

interface ImageResult {
    testId: string;
    sceneId: string;
    sceneName: string;
    panelNumber: number;
    prompt: string;
    imageUrl: string;
    width: number;
    height: number;
    generationTime: number;
    success: boolean;
    error?: string;
}

interface TestResult {
    testId: string;
    sceneId: string;
    sceneName: string;
    timestamp: string;
    images: ImageResult[];
    totalTime: number;
    successRate: number;
    averageGenerationTime: number;
}

/**
 * Generate a single comic panel image via AI server
 */
async function generatePanelImage(
    prompt: string,
    panelNumber: number,
): Promise<{
    imageUrl: string;
    width: number;
    height: number;
    generationTime: number;
}> {
    const startTime = Date.now();

    // Comic panels use 9:16 aspect ratio (928x1664)
    const requestBody = {
        prompt: `Webtoon comic panel, ${prompt}, high quality manga style, clean lines, dramatic lighting`,
        width: 928,
        height: 1664,
        num_inference_steps: 4,
        guidance_scale: 1.0,
    };

    const response = await fetch(`${AI_SERVER_URL}/api/v1/images/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey!,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const generationTime = Date.now() - startTime;

    // The AI server returns base64 image data
    // For testing, we'll use a placeholder URL or the actual response format
    const imageData = result.image || result.images?.[0];

    return {
        imageUrl: imageData ? `data:image/png;base64,${imageData}` : "",
        width: result.width || 928,
        height: result.height || 1664,
        generationTime,
    };
}

/**
 * Run image tests for a single scene
 */
async function runSceneTest(
    scene: TestScene,
    iteration: number,
): Promise<TestResult> {
    const testId = `${scene.id}-${iteration}`;
    const startTime = Date.now();
    const images: ImageResult[] = [];

    // Generate 2 panel images per test (using first 2 panels from test data)
    const panelsToTest = scene.toonplay.panels.slice(0, 2);

    for (const panel of panelsToTest) {
        try {
            console.log(`    → Panel ${panel.panelNumber}: ${panel.shotType}`);

            const result = await generatePanelImage(
                panel.description,
                panel.panelNumber,
            );

            images.push({
                testId,
                sceneId: scene.id,
                sceneName: scene.name,
                panelNumber: panel.panelNumber,
                prompt: panel.description,
                imageUrl: result.imageUrl ? "[generated]" : "[failed]",
                width: result.width,
                height: result.height,
                generationTime: result.generationTime,
                success: !!result.imageUrl,
            });

            console.log(`      ✓ Generated in ${(result.generationTime / 1000).toFixed(1)}s`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`      ✗ Failed: ${errorMessage}`);

            images.push({
                testId,
                sceneId: scene.id,
                sceneName: scene.name,
                panelNumber: panel.panelNumber,
                prompt: panel.description,
                imageUrl: "",
                width: 0,
                height: 0,
                generationTime: 0,
                success: false,
                error: errorMessage,
            });
        }
    }

    const totalTime = Date.now() - startTime;
    const successCount = images.filter((img) => img.success).length;
    const successRate = images.length > 0 ? successCount / images.length : 0;
    const avgTime =
        images.length > 0
            ? images.reduce((sum, img) => sum + img.generationTime, 0) / images.length
            : 0;

    return {
        testId,
        sceneId: scene.id,
        sceneName: scene.name,
        timestamp: new Date().toISOString(),
        images,
        totalTime,
        successRate,
        averageGenerationTime: avgTime,
    };
}

/**
 * Main test execution
 */
async function main() {
    const results: TestResult[] = [];
    let totalTests = 0;
    const totalExpected = TEST_SCENE_IDS.length * ITERATIONS;

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    fs.mkdirSync(outputDir, { recursive: true });

    for (const sceneId of TEST_SCENE_IDS) {
        const scene = TEST_SCENES.find((s) => s.id === sceneId);
        if (!scene) {
            console.error(`  ✗ Scene not found: ${sceneId}`);
            continue;
        }

        console.log(`\n📸 Testing Scene: ${scene.name} (${sceneId})`);

        for (let i = 0; i < ITERATIONS; i++) {
            totalTests++;
            console.log(`\n[${totalTests}/${totalExpected}] Test ${i + 1}/${ITERATIONS}`);

            try {
                const result = await runSceneTest(scene, i + 1);
                results.push(result);

                const status = result.successRate === 1 ? "✓ PASS" : "✗ PARTIAL";
                console.log(
                    `  ${status} - ${(result.successRate * 100).toFixed(0)}% success, ${(result.totalTime / 1000).toFixed(1)}s total`,
                );
            } catch (error) {
                console.error(`  ✗ Test failed:`, error);
            }
        }
    }

    // Calculate aggregated metrics
    const totalImages = results.reduce((sum, r) => sum + r.images.length, 0);
    const successfulImages = results.reduce(
        (sum, r) => sum + r.images.filter((img) => img.success).length,
        0,
    );
    const overallSuccessRate = totalImages > 0 ? successfulImages / totalImages : 0;
    const avgGenerationTime =
        results.length > 0
            ? results.reduce((sum, r) => sum + r.averageGenerationTime, 0) / results.length
            : 0;

    // Save results
    const finalResult = {
        testDate: new Date().toISOString(),
        aiServer: AI_SERVER_URL,
        testScenes: TEST_SCENE_IDS,
        iterations: ITERATIONS,
        results,
        aggregatedMetrics: {
            totalTests: results.length,
            totalImages,
            successfulImages,
            overallSuccessRate,
            averageGenerationTime: avgGenerationTime / 1000, // Convert to seconds
        },
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalResult, null, 2), "utf-8");

    // Print summary
    console.log(`
═══════════════════════════════════════════════════════════════
                    TEST EXECUTION COMPLETE
═══════════════════════════════════════════════════════════════
  Total Tests:        ${results.length}/${totalExpected}
  Total Images:       ${totalImages}
  Successful Images:  ${successfulImages}
  Success Rate:       ${(overallSuccessRate * 100).toFixed(1)}%
  Avg Generation:     ${(avgGenerationTime / 1000).toFixed(2)}s per image

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
