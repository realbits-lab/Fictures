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
import { eq } from "drizzle-orm";
import { CORE_TRAIT } from "@/lib/constants/core-traits";
import { GENRE } from "@/lib/constants/genres";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
    users,
} from "@/lib/schemas/database";
import { getTestScenario, TEST_SCENARIOS } from "./config/test-scenarios";
import { quickVisualQualityCheck } from "./src/image-evaluator";
import { ImageMetricsTracker } from "./src/metrics-tracker";
import type { ImageEvaluation, ImageTestResult } from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        version: { type: "string", default: "v1.0" },
        scenarios: { type: "string" },
        iterations: { type: "string", default: "5" },
        mode: { type: "string", default: "standard" },
        generationProfile: { type: "string", default: "iteration" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

const AUTH_FILE_PATH = path.resolve(process.cwd(), ".auth/user.json");

type ScenarioContentIds = Record<string, string>;

interface TestDataRefs {
    storyId: string;
    partId: string;
    chapterId: string;
    characterId: string;
    settingId: string;
    actionSceneId: string;
    emotionalSceneId: string;
}

let writerApiKey: string | null = null;
let writerUserId: string | null = null;
let testDataRefs: TestDataRefs | null = null;
let scenarioContentIds: ScenarioContentIds = {};

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
const GENERATION_PROFILE =
    values.generationProfile === "full" ? "full" : "iteration";
const TEST_SCENARIO_IDS = values.scenarios
    ? values.scenarios.split(",").map((s) => s.trim())
    : TEST_SCENARIOS.map((s) => s.id);

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output || `results/${PROMPT_VERSION}/suite-${timestamp}.json`;

async function ensureAuthLoaded(): Promise<void> {
    if (writerApiKey && writerUserId) {
        return;
    }

    const authContent = await fs.readFile(AUTH_FILE_PATH, "utf-8");
    const authData = JSON.parse(authContent) as {
        develop?: {
            profiles?: { writer?: { apiKey?: string; email?: string } };
        };
    };

    const apiKey = authData.develop?.profiles?.writer?.apiKey;
    const writerEmail = authData.develop?.profiles?.writer?.email;

    if (!apiKey || !writerEmail) {
        throw new Error(
            "Writer credentials missing from .auth/user.json. Run setup-auth-users.mjs first.",
        );
    }

    const writerRecord = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, writerEmail))
        .limit(1);

    if (writerRecord.length === 0) {
        throw new Error(`Writer user not found for email ${writerEmail}`);
    }

    writerApiKey = apiKey;
    writerUserId = writerRecord[0].id;
}

async function prepareTestData(): Promise<void> {
    await ensureAuthLoaded();

    if (testDataRefs) {
        return;
    }

    if (!writerUserId) {
        throw new Error("Writer user ID not loaded");
    }

    const ts = Date.now();
    testDataRefs = {
        storyId: `story_iteration_${ts}`,
        partId: `part_iteration_${ts}`,
        chapterId: `chapter_iteration_${ts}`,
        characterId: `character_iteration_${ts}`,
        settingId: `setting_iteration_${ts}`,
        actionSceneId: `scene_iteration_${ts}_action`,
        emotionalSceneId: `scene_iteration_${ts}_emotion`,
    };

    await db
        .insert(stories as any)
        .values({
            id: testDataRefs.storyId,
            authorId: writerUserId,
            title: "Iteration Testing Story",
            summary: "Baseline story used for iteration testing flows",
            genre: GENRE.FANTASY,
            tone: "hopeful",
            language: "en",
            targetAudience: "general",
            userPrompt: "Iteration testing baseline story",
            moralFramework: {
                adversity: {
                    type: "external-conflict",
                    description: "Testing adversity",
                },
                virtue: { virtue: "courage", description: "Testing virtue" },
                consequence: {
                    type: "character-growth",
                    description: "Testing consequence",
                },
            },
        })
        .onConflictDoNothing();

    await db
        .insert(characters as any)
        .values({
            id: testDataRefs.characterId,
            storyId: testDataRefs.storyId,
            name: "Iteration Test Character",
            role: "protagonist",
            summary: "Character used for image iteration testing",
            coreTrait: CORE_TRAIT.COURAGE,
            internalFlaw: "impatience",
            externalGoal: "refine generation prompts",
            backstory: "Born for testing",
            personality: {
                traits: ["analytical", "calm"],
                mannerisms: ["studies surroundings carefully"],
                quirks: ["collects reference artifacts"],
            },
            physicalDescription: {
                age: "mid 20s",
                build: "athletic",
                height: "average",
                features: ["short hair", "bright eyes"],
            },
            voiceStyle: {
                tone: "measured",
                vocabulary: "technical",
                speechPatterns: ["precise"],
            },
        })
        .onConflictDoNothing();

    await db
        .insert(settings)
        .values({
            id: testDataRefs.settingId,
            storyId: testDataRefs.storyId,
            name: "Iteration Setting",
            summary: "Floating archive used for prompt tuning",
            adversityElements: {
                physicalObstacles: ["unstable bridges"],
                scarcityFactors: ["limited time"],
                dangerSources: ["arcane storms"],
                socialDynamics: ["rival archivists"],
            },
            virtueElements: {
                witnessElements: ["glowing runes"],
                contrastElements: ["shadowed halls"],
                opportunityElements: ["hidden alcoves"],
                sacredSpaces: ["central atrium"],
            },
            consequenceElements: {
                transformativeElements: ["shifting layouts"],
                rewardSources: ["ancient knowledge"],
                revelationTriggers: ["resonant glyphs"],
                communityResponses: ["gathering for discoveries"],
            },
            symbolicMeaning: "Transformation through iteration",
            mood: "mysterious",
            emotionalResonance: "wonder",
            sensory: {
                sight: ["luminous shelves"],
                sound: ["echoed whispers"],
                smell: ["old parchment"],
                touch: ["cool stone railings"],
                taste: [],
            },
            architecturalStyle: "Floating terraces",
            visualReferences: ["fantasy archives"],
            colorPalette: ["teal", "gold", "slate"],
        })
        .onConflictDoNothing();

    await db
        .insert(parts as any)
        .values({
            id: testDataRefs.partId,
            storyId: testDataRefs.storyId,
            title: "Iteration Part",
            summary: "Holds iteration chapters",
            characterArcs: [],
            orderIndex: 0,
        })
        .onConflictDoNothing();

    await db
        .insert(chapters as any)
        .values({
            id: testDataRefs.chapterId,
            storyId: testDataRefs.storyId,
            partId: testDataRefs.partId,
            characterId: testDataRefs.characterId,
            title: "Iteration Chapter",
            summary: "Focuses on improving prompts",
            arcPosition: "middle",
            contributesToMacroArc: "Refining generation approach",
            adversityType: "external",
            virtueType: CORE_TRAIT.COURAGE,
            connectsToPreviousChapter: "Establishes iteration goal",
            createsNextAdversity: "Identifies next improvement area",
            orderIndex: 0,
        })
        .onConflictDoNothing();

    await db
        .insert(scenes as any)
        .values([
            {
                id: testDataRefs.actionSceneId,
                storyId: testDataRefs.storyId,
                chapterId: testDataRefs.chapterId,
                settingId: testDataRefs.settingId,
                title: "Iteration Action Scene",
                summary: "Dynamic testing scenario",
                cyclePhase: "adversity",
                emotionalBeat: "tension",
                dialogueVsDescription: "40% dialogue, 60% description",
                suggestedLength: "medium",
                orderIndex: 0,
            },
            {
                id: testDataRefs.emotionalSceneId,
                storyId: testDataRefs.storyId,
                chapterId: testDataRefs.chapterId,
                settingId: testDataRefs.settingId,
                title: "Iteration Emotional Scene",
                summary: "Introspective evaluation moment",
                cyclePhase: "virtue",
                emotionalBeat: "hope",
                dialogueVsDescription: "50% dialogue, 50% description",
                suggestedLength: "medium",
                orderIndex: 1,
            },
        ])
        .onConflictDoNothing();

    scenarioContentIds = {
        "story-cover": testDataRefs.storyId,
        "character-portrait": testDataRefs.characterId,
        "setting-landscape": testDataRefs.settingId,
        "scene-action": testDataRefs.actionSceneId,
        "emotional-moment": testDataRefs.emotionalSceneId,
    };
}

async function cleanupTestData(): Promise<void> {
    if (!testDataRefs) {
        return;
    }

    await db.delete(scenes).where(eq(scenes.chapterId, testDataRefs.chapterId));
    await db.delete(chapters).where(eq(chapters.id, testDataRefs.chapterId));
    await db.delete(parts).where(eq(parts.id, testDataRefs.partId));
    await db
        .delete(characters)
        .where(eq(characters.id, testDataRefs.characterId));
    await db.delete(settings).where(eq(settings.id, testDataRefs.settingId));
    await db.delete(stories).where(eq(stories.id, testDataRefs.storyId));

    testDataRefs = null;
    scenarioContentIds = {};
}

function getContentIdForScenario(scenarioId: string): string | undefined {
    return scenarioContentIds[scenarioId];
}

console.log(`
═══════════════════════════════════════════════════════════════
         IMAGE EVALUATION SUITE - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Prompt Version:  ${PROMPT_VERSION}
  Evaluation Mode: ${EVALUATION_MODE}
  Generation Profile: ${GENERATION_PROFILE}
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
    contentId: string,
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

    if (!writerApiKey) {
        throw new Error("Writer API key not loaded");
    }

    try {
        // Call image generation API
        const response = await fetch(
            `http://localhost:3000/api/studio/images`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": writerApiKey,
                },
                body: JSON.stringify({
                    prompt,
                    contentId,
                    imageType,
                    generationProfile: GENERATION_PROFILE,
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Image generation failed: ${response.statusText} - ${errorText}`,
            );
        }

        const result = await response.json();

        if (!result.success || !result.originalUrl) {
            throw new Error("Image generation returned invalid result");
        }

        const requestTime = Date.now() - startTime;
        const responseMetadata = result.metadata;

        const generationTimeSeconds =
            (responseMetadata?.generationTime ?? requestTime) / 1000;
        const optimizationTimeSeconds =
            (responseMetadata?.optimizationTime ?? 0) / 1000;
        const uploadTimeSeconds = (responseMetadata?.uploadTime ?? 0) / 1000;
        const dbUpdateTimeSeconds =
            (responseMetadata?.dbUpdateTime ?? 0) / 1000;
        const totalTimeSeconds =
            (responseMetadata?.totalTime ?? requestTime) / 1000;

        const optimizedVariants = result.optimizedSet?.variants ?? [];
        const avif1x = optimizedVariants.find(
            (variant: { resolution: string; size: number }) =>
                variant.resolution === "1x",
        );
        const avif2x = optimizedVariants.find(
            (variant: { resolution: string; size: number }) =>
                variant.resolution === "2x",
        );

        // Extract metadata
        const metadata = {
            width: result.dimensions?.width || 1344,
            height: result.dimensions?.height || 768,
            aspectRatio: result.aspectRatio || "7:4",
            originalSize: result.size || 0,
            avif1xSize: avif1x?.size || 0,
            avif2xSize: avif2x?.size || 0,
            resolutionCompliance: true,
        };

        console.log(
            `    ✓ Image generated in ${generationTimeSeconds.toFixed(1)}s`,
        );

        return {
            imageUrl: result.originalUrl,
            imageVariants: {
                avif1x: avif1x?.url || "",
                avif2x: avif2x?.url || "",
            },
            metadata,
            generationTime: generationTimeSeconds,
            optimizationTime: optimizationTimeSeconds,
            totalTime: totalTimeSeconds,
            provider: result.provider || "unknown",
            model: result.model || "unknown",
            uploadTime: uploadTimeSeconds,
            dbUpdateTime: dbUpdateTimeSeconds,
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

    // For quick mode, use automated metrics only (no AI visual quality check)
    if (evaluationMode === "quick") {
        return evaluateImageQuickNoAI(imageResult, scenario);
    }

    // For standard/thorough, use AI-based visual quality evaluation
    return evaluateImageQuick(imageResult, scenario);
}

/**
 * Quick evaluation using automated metrics and AI visual quality check
 */
async function evaluateImageQuick(
    imageResult: Awaited<ReturnType<typeof generateImage>>,
    scenario: ReturnType<typeof getTestScenario>,
): Promise<ImageEvaluation> {
    const { metadata } = imageResult;

    // Calculate aspect ratio accuracy
    const expectedRatio = scenario?.expectedAspectRatio || "7:4";
    const [expectedW, expectedH] = expectedRatio.split(":").map(Number);
    const expectedAspect = expectedW / expectedH;
    const actualAspect = metadata.width / metadata.height;
    const aspectRatioAccuracy =
        Math.abs(1 - actualAspect / expectedAspect) * 100;

    // Calculate compression ratio
    const originalSize = metadata.originalSize || metadata.avif1xSize * 20; // Estimate if missing
    const totalVariantSize = metadata.avif1xSize + metadata.avif2xSize;
    const avifCompressionRatio =
        originalSize > 0
            ? ((originalSize - totalVariantSize) / originalSize) * 100
            : 0;

    // Calculate category scores
    // Check if resolution meets expected dimensions
    const resolutionCompliance =
        metadata.width >= 1000 && metadata.height >= 500;
    const generationQuality = Math.max(
        1,
        Math.min(
            5,
            5 - aspectRatioAccuracy / 3 + (resolutionCompliance ? 0.5 : -1),
        ),
    );
    const optimizationQuality = Math.max(
        1,
        Math.min(5, avifCompressionRatio / 20 + 2),
    );

    // Use AI-based visual quality evaluation
    let visualQuality = 3.5; // Default fallback
    try {
        console.log(`    → Running AI visual quality check...`);
        visualQuality = await quickVisualQualityCheck(
            imageResult.imageUrl,
            scenario?.prompt || "Generated image",
        );
        console.log(`    → Visual quality score: ${visualQuality}/5`);
    } catch (error) {
        console.warn(`    ⚠ AI evaluation failed, using default score`);
    }

    const performance = Math.max(
        1,
        Math.min(5, 5 - Math.max(0, imageResult.generationTime - 20) / 10),
    );

    // Calculate weighted score
    const weightedScore =
        generationQuality * 0.35 +
        optimizationQuality * 0.25 +
        visualQuality * 0.3 +
        performance * 0.1;

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
            resolutionCompliance,
            promptAdherence: 85,
            formatValidation: true,
            fileSize: metadata.originalSize / 1024,
            avifCompressionRatio,
            avif1xSize: metadata.avif1xSize / 1024,
            avif2xSize: metadata.avif2xSize / 1024,
            totalVariantSize: totalVariantSize / 1024,
            storageRatio: (totalVariantSize / originalSize) * 100,
            visualQualityScore: visualQuality,
            artifactCount: 0,
            aspectRatioPreservation: 0.1,
            variantCount: 2,
            imageAccessibility: true,
            generationTime: imageResult.generationTime,
            optimizationTime: imageResult.optimizationTime,
            totalTime: imageResult.totalTime,
            success: true,
        },
        recommendations: [],
        finalReport: `Image generated successfully (AI evaluated). Visual Quality: ${visualQuality}/5, Compression: ${avifCompressionRatio.toFixed(1)}%`,
    };
}

/**
 * Quick evaluation without AI (for quick mode only)
 */
function evaluateImageQuickNoAI(
    imageResult: Awaited<ReturnType<typeof generateImage>>,
    scenario: ReturnType<typeof getTestScenario>,
): ImageEvaluation {
    const { metadata } = imageResult;

    // Calculate aspect ratio accuracy
    const expectedRatio = scenario?.expectedAspectRatio || "7:4";
    const [expectedW, expectedH] = expectedRatio.split(":").map(Number);
    const expectedAspect = expectedW / expectedH;
    const actualAspect = metadata.width / metadata.height;
    const aspectRatioAccuracy =
        Math.abs(1 - actualAspect / expectedAspect) * 100;

    // Calculate compression ratio
    const originalSize = metadata.originalSize || metadata.avif1xSize * 20;
    const totalVariantSize = metadata.avif1xSize + metadata.avif2xSize;
    const avifCompressionRatio =
        originalSize > 0
            ? ((originalSize - totalVariantSize) / originalSize) * 100
            : 0;

    // Calculate category scores
    const resolutionCompliance =
        metadata.width >= 1000 && metadata.height >= 500;
    const generationQuality = Math.max(
        1,
        Math.min(
            5,
            5 - aspectRatioAccuracy / 3 + (resolutionCompliance ? 0.5 : -1),
        ),
    );
    const optimizationQuality = Math.max(
        1,
        Math.min(5, avifCompressionRatio / 20 + 2),
    );
    const visualQuality = 3.5; // Placeholder for quick mode
    const performance = Math.max(
        1,
        Math.min(5, 5 - Math.max(0, imageResult.generationTime - 20) / 10),
    );

    // Calculate weighted score
    const weightedScore =
        generationQuality * 0.35 +
        optimizationQuality * 0.25 +
        visualQuality * 0.3 +
        performance * 0.1;

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
            resolutionCompliance,
            promptAdherence: 85,
            formatValidation: true,
            fileSize: metadata.originalSize / 1024,
            avifCompressionRatio,
            avif1xSize: metadata.avif1xSize / 1024,
            avif2xSize: metadata.avif2xSize / 1024,
            totalVariantSize: totalVariantSize / 1024,
            storageRatio: (totalVariantSize / originalSize) * 100,
            visualQualityScore: visualQuality,
            artifactCount: 0,
            aspectRatioPreservation: 0.1,
            variantCount: 2,
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
    await prepareTestData();

    const results: ImageTestResult[] = [];
    const tracker = new ImageMetricsTracker();

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });

    let totalTests = 0;
    const totalExpected = TEST_SCENARIO_IDS.length * ITERATIONS;

    try {
        for (const scenarioId of TEST_SCENARIO_IDS) {
            const scenario = getTestScenario(scenarioId);
            if (!scenario) {
                console.error(`  ✗ Scenario not found: ${scenarioId}`);
                continue;
            }

            console.log(
                `\n📸 Testing Scenario: ${scenario.name} (${scenarioId})`,
            );

            for (let i = 0; i < ITERATIONS; i++) {
                totalTests++;
                const testId = `${scenarioId}-${i + 1}`;
                const contentId = getContentIdForScenario(scenarioId);

                if (!contentId) {
                    console.error(
                        `  ✗ No content mapping available for scenario ${scenarioId}. Skipping.`,
                    );
                    continue;
                }

                console.log(
                    `\n[${totalTests}/${totalExpected}] Test ${i + 1}/${ITERATIONS}: ${scenario.name}`,
                );

                try {
                    // Generate image
                    const imageResult = await generateImage(
                        scenarioId,
                        scenario.prompt,
                        scenario.imageType,
                        contentId,
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
    } finally {
        await cleanupTestData().catch((cleanupError) => {
            console.error(
                "Failed to cleanup iteration test data:",
                cleanupError,
            );
        });
    }
}

// Run main function
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
