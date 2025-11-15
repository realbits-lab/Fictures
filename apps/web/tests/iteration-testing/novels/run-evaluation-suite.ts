#!/usr/bin/env tsx

/**
 * Run Evaluation Suite - Generate and evaluate stories for iteration testing
 *
 * Usage:
 *   pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts \
 *     --version v1.0 \
 *     --prompts "last-garden,broken-healer" \
 *     --iterations 5 \
 *     --mode thorough \
 *     --output results/v1.0/baseline.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestPrompt, TEST_PROMPTS } from "./config/test-prompts";
import type { TestStoryResult, TestSuiteResult } from "./src/types";

// Parse command-line arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        version: { type: "string", default: "v1.0" },
        prompts: { type: "string" },
        iterations: { type: "string", default: "5" },
        mode: { type: "string", default: "thorough" },
        output: { type: "string" },
        help: { type: "boolean", default: false },
    },
});

if (values.help) {
    console.log(`
Run Evaluation Suite - Generate and evaluate stories for iteration testing

Usage:
  pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts [options]

Options:
  --version    <string>  Prompt version to test (default: v1.0)
  --prompts    <string>  Comma-separated test prompt IDs (default: all)
  --iterations <number>  Number of stories per prompt (default: 5)
  --mode       <string>  Evaluation mode: quick|standard|thorough (default: thorough)
  --output     <string>  Output file path (default: results/{version}/suite-{timestamp}.json)
  --help                 Show this help message

Examples:
  # Run baseline test with all prompts
  pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts --version v1.0 --iterations 5

  # Test specific prompts
  pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts --prompts "last-garden,broken-healer"

  # Quick evaluation mode for rapid testing
  pnpm tsx test-scripts/iteration-testing/run-evaluation-suite.ts --mode quick
  `);
    process.exit(0);
}

// Configuration
const PROMPT_VERSION = values.version || "v1.0";
const EVALUATION_MODE =
    (values.mode as "quick" | "standard" | "thorough") || "thorough";
const ITERATIONS = parseInt(values.iterations || "5", 10);
const TEST_PROMPT_IDS = values.prompts
    ? values.prompts.split(",").map((s) => s.trim())
    : TEST_PROMPTS.map((p) => p.id);

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUTPUT_FILE =
    values.output || `results/${PROMPT_VERSION}/suite-${timestamp}.json`;

console.log(`
═══════════════════════════════════════════════════════════════
           NOVELS EVALUATION SUITE - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Prompt Version:  ${PROMPT_VERSION}
  Evaluation Mode: ${EVALUATION_MODE}
  Test Prompts:    ${TEST_PROMPT_IDS.length} prompts
  Iterations:      ${ITERATIONS} per prompt
  Total Stories:   ${TEST_PROMPT_IDS.length * ITERATIONS}
  Output:          ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

/**
 * Generate a story using the studio API
 */
async function generateStory(
    prompt: string,
): Promise<{ storyId: string; generationTime: number }> {
    console.log(`  → Generating story: "${prompt.substring(0, 50)}..."`);

    const startTime = Date.now();

    // Get API key from auth file and create authentication context
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

    // Import authentication context functions
    const { withAuth } = await import("@/lib/auth/server-context");
    const { createApiKeyContext } = await import("@/lib/auth/context");

    // Create authentication context
    const authContext = createApiKeyContext(
        apiKey,
        "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
        "writer@fictures.xyz",
        ["stories:write", "images:write", "ai:use"],
        { requestId: `test-${Date.now()}`, timestamp: Date.now() },
    );

    // Wrap entire generation logic in authentication context
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
        const { chapterService } = await import(
            "@/lib/studio/services/chapter-service"
        );
        const { sceneSummaryService } = await import(
            "@/lib/studio/services/scene-summary-service"
        );
        const { sceneContentService } = await import(
            "@/lib/studio/services/scene-content-service"
        );

        try {
            // 1. Generate story foundation
            console.log(`    • Generating story foundation (version: ${PROMPT_VERSION})...`);
            const storyResult = await storyService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                userPrompt: prompt,
                language: "en",
                promptVersion: PROMPT_VERSION !== "v1.0" ? PROMPT_VERSION : undefined,
            });

            const storyId = storyResult.story.id;

            // 2. Generate characters (2-4 main characters)
            console.log(`    • Generating characters...`);
            const _charactersResult = await characterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                storyId,
                characterCount: 3,
            });

            // 3. Generate settings (2-4 primary settings)
            console.log(`    • Generating settings...`);
            const _settingsResult = await settingService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                storyId,
                settingCount: 3,
            });

            // 4. Generate part (single part for test)
            console.log(
                `    • Generating part structure (version: ${PROMPT_VERSION})...`,
            );
            const partResult = await partService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                storyId,
                partNumber: 1,
                promptVersion:
                    PROMPT_VERSION !== "v1.0" ? PROMPT_VERSION : undefined, // Pass version for A/B testing
            });

            // 5. Generate 2 chapters for testing
            console.log(`    • Generating chapters...`);
            const chapter1Result = await chapterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                storyId,
                partId: partResult.part.id,
                chapterNumber: 1,
            });

            const _chapter2Result = await chapterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                storyId,
                partId: partResult.part.id,
                chapterNumber: 2,
            });

            // 6. Generate scene summaries for chapter 1 (one at a time)
            console.log(`    • Generating scene summaries...`);
            const generatedScenes: Array<{ id: string }> = [];
            const scenesToGenerate = 5;

            for (let i = 0; i < scenesToGenerate; i++) {
                const sceneResult = await sceneSummaryService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                    storyId,
                    chapterId: chapter1Result.chapter.id,
                });
                generatedScenes.push({ id: sceneResult.scene.id });
            }

            // 7. Generate scene content for first 3 scenes (for testing)
            console.log(`    • Generating scene content...`);
            for (let i = 0; i < Math.min(3, generatedScenes.length); i++) {
                await sceneContentService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj", // writer@fictures.xyz user ID
                    sceneId: generatedScenes[i].id,
                });
            }

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ Story generated in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return { storyId, generationTime };
        } catch (error) {
            console.error(`    ✗ Generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Evaluate a story using the evaluation APIs
 */
async function evaluateStory(
    storyId: string,
): Promise<TestStoryResult["evaluationResults"]> {
    console.log(`  → Evaluating story ${storyId}...`);

    const evaluationResults: TestStoryResult["evaluationResults"] = {};

    try {
        // Story evaluation
        console.log(`    • Evaluating story-level metrics...`);
        const storyEvalResponse = await fetch(
            `http://localhost:3000/api/evaluation/story`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyId,
                    evaluationMode: EVALUATION_MODE,
                }),
            },
        );
        if (storyEvalResponse.ok) {
            evaluationResults.story = await storyEvalResponse.json();
        }

        // Characters evaluation
        console.log(`    • Evaluating characters...`);
        const charactersEvalResponse = await fetch(
            `http://localhost:3000/api/evaluation/characters`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyId,
                    evaluationMode: EVALUATION_MODE,
                }),
            },
        );
        if (charactersEvalResponse.ok) {
            evaluationResults.characters = await charactersEvalResponse.json();
        }

        // Settings evaluation
        console.log(`    • Evaluating settings...`);
        const settingsEvalResponse = await fetch(
            `http://localhost:3000/api/evaluation/settings`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyId,
                    evaluationMode: EVALUATION_MODE,
                }),
            },
        );
        if (settingsEvalResponse.ok) {
            evaluationResults.settings = await settingsEvalResponse.json();
        }

        // Get part ID for part evaluation
        const { db } = await import("@/lib/db");
        const { parts, chapters, scenes } = await import(
            "@/lib/schemas/database"
        );
        const { eq } = await import("drizzle-orm");

        const part = await db.query.parts.findFirst({
            where: eq(parts.storyId, storyId),
        });

        if (part) {
            // Part evaluation
            console.log(`    • Evaluating part structure...`);
            const partEvalResponse = await fetch(
                `http://localhost:3000/api/evaluation/part`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        partId: part.id,
                        evaluationMode: EVALUATION_MODE,
                    }),
                },
            );
            if (partEvalResponse.ok) {
                evaluationResults.part = await partEvalResponse.json();
            }

            // Get chapter for chapter evaluation
            const chapter = await db.query.chapters.findFirst({
                where: eq(chapters.partId, part.id),
            });

            if (chapter) {
                // Chapter evaluation
                console.log(`    • Evaluating chapter...`);
                const chapterEvalResponse = await fetch(
                    `http://localhost:3000/api/evaluation/chapter`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chapterId: chapter.id,
                            evaluationMode: EVALUATION_MODE,
                        }),
                    },
                );
                if (chapterEvalResponse.ok) {
                    evaluationResults.chapter =
                        await chapterEvalResponse.json();
                }

                // Get scene for scene evaluations
                const scene = await db.query.scenes.findFirst({
                    where: eq(scenes.chapterId, chapter.id),
                });

                if (scene) {
                    // Scene summary evaluation
                    console.log(`    • Evaluating scene summary...`);
                    const sceneSummaryEvalResponse = await fetch(
                        `http://localhost:3000/api/evaluation/scene-summary`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                sceneId: scene.id,
                                evaluationMode: EVALUATION_MODE,
                            }),
                        },
                    );
                    if (sceneSummaryEvalResponse.ok) {
                        evaluationResults.sceneSummary =
                            await sceneSummaryEvalResponse.json();
                    }

                    // Scene content evaluation (if content exists)
                    if (scene.content) {
                        console.log(`    • Evaluating scene content...`);
                        const sceneContentEvalResponse = await fetch(
                            `http://localhost:3000/api/evaluation/scene-content`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    sceneId: scene.id,
                                    evaluationMode: EVALUATION_MODE,
                                }),
                            },
                        );
                        if (sceneContentEvalResponse.ok) {
                            evaluationResults.sceneContent =
                                await sceneContentEvalResponse.json();
                        }
                    }
                }
            }
        }

        console.log(`    ✓ Evaluation complete`);
        return evaluationResults;
    } catch (error) {
        console.error(`    ✗ Evaluation failed:`, error);
        return evaluationResults;
    }
}

/**
 * Calculate Core Principle scores from evaluation results
 *
 * Maps actual evaluation API metrics to Core Principles using weighted averages
 * where multiple metrics contribute to a single principle.
 */
function calculateCorePrincipleScores(
    evaluationResults: TestStoryResult["evaluationResults"],
): TestStoryResult["corePrincipleScores"] {
    const scores = {
        cyclicStructure: 0,
        intrinsicMotivation: 0,
        earnedConsequence: 0,
        characterTransformation: 0,
        emotionalResonance: 0,
    };

    // CYCLIC STRUCTURE - Combination of chapter and part level metrics
    const cyclicMetrics: number[] = [];
    if (evaluationResults.chapter?.metrics?.singleCycleFocus?.score) {
        cyclicMetrics.push(
            evaluationResults.chapter.metrics.singleCycleFocus.score,
        );
    }
    if (evaluationResults.part?.metrics?.cycleCoherence?.score) {
        cyclicMetrics.push(evaluationResults.part.metrics.cycleCoherence.score);
    }
    if (evaluationResults.sceneContent?.metrics?.cycleAlignment?.score) {
        cyclicMetrics.push(
            evaluationResults.sceneContent.metrics.cycleAlignment.score,
        );
    }
    if (cyclicMetrics.length > 0) {
        scores.cyclicStructure =
            cyclicMetrics.reduce((a, b) => a + b, 0) / cyclicMetrics.length;
    }

    // INTRINSIC MOTIVATION - Story-level moral framework + character virtues
    const motivationMetrics: number[] = [];
    if (evaluationResults.story?.metrics?.moralFrameworkClarity?.score) {
        motivationMetrics.push(
            evaluationResults.story.metrics.moralFrameworkClarity.score,
        );
    }
    // TODO: Add characters evaluation when available
    // if (evaluationResults.characters?.metrics?.genuineVirtue?.score) {
    //     motivationMetrics.push(evaluationResults.characters.metrics.genuineVirtue.score);
    // }
    if (motivationMetrics.length > 0) {
        scores.intrinsicMotivation =
            motivationMetrics.reduce((a, b) => a + b, 0) /
            motivationMetrics.length;
    }

    // EARNED CONSEQUENCE - Part-level seed tracking + chapter adversity connection
    const consequenceMetrics: number[] = [];
    if (evaluationResults.part?.metrics?.earnedLuckTracking?.score) {
        consequenceMetrics.push(
            evaluationResults.part.metrics.earnedLuckTracking.score,
        );
    }
    if (evaluationResults.chapter?.metrics?.adversityConnection?.score) {
        consequenceMetrics.push(
            evaluationResults.chapter.metrics.adversityConnection.score,
        );
    }
    if (evaluationResults.chapter?.metrics?.seedTrackingCompleteness?.score) {
        // Normalize from 0-100 to 0-4 scale
        consequenceMetrics.push(
            evaluationResults.chapter.metrics.seedTrackingCompleteness.score /
                25,
        );
    }
    if (consequenceMetrics.length > 0) {
        scores.earnedConsequence =
            consequenceMetrics.reduce((a, b) => a + b, 0) /
            consequenceMetrics.length;
    }

    // CHARACTER TRANSFORMATION - Chapter-level stakes escalation + transition quality
    const transformationMetrics: number[] = [];
    if (evaluationResults.chapter?.metrics?.stakesEscalation?.score) {
        transformationMetrics.push(
            evaluationResults.chapter.metrics.stakesEscalation.score,
        );
    }
    if (
        evaluationResults.chapter?.metrics?.resolutionAdversityTransition?.score
    ) {
        transformationMetrics.push(
            evaluationResults.chapter.metrics.resolutionAdversityTransition
                .score,
        );
    }
    // TODO: Add character arc evaluation when available
    // if (evaluationResults.characters?.metrics?.arcProgression?.score) {
    //     transformationMetrics.push(evaluationResults.characters.metrics.arcProgression.score);
    // }
    if (transformationMetrics.length > 0) {
        scores.characterTransformation =
            transformationMetrics.reduce((a, b) => a + b, 0) /
            transformationMetrics.length;
    }

    // EMOTIONAL RESONANCE - Scene content emotional metrics + story thematic coherence
    const resonanceMetrics: number[] = [];
    if (evaluationResults.sceneContent?.metrics?.emotionalResonance?.score) {
        resonanceMetrics.push(
            evaluationResults.sceneContent.metrics.emotionalResonance.score,
        );
    }
    if (evaluationResults.story?.metrics?.thematicCoherence?.score) {
        resonanceMetrics.push(
            evaluationResults.story.metrics.thematicCoherence.score,
        );
    }
    if (evaluationResults.chapter?.metrics?.narrativeMomentum?.score) {
        // Normalize from 0-100 to 0-4 scale
        resonanceMetrics.push(
            evaluationResults.chapter.metrics.narrativeMomentum.score / 25,
        );
    }
    if (resonanceMetrics.length > 0) {
        scores.emotionalResonance =
            resonanceMetrics.reduce((a, b) => a + b, 0) /
            resonanceMetrics.length;
    }

    return scores;
}

/**
 * Main execution
 */
async function main() {
    const testResults: TestStoryResult[] = [];
    const startTime = Date.now();

    // Process each test prompt
    for (const promptId of TEST_PROMPT_IDS) {
        const testPrompt = getTestPrompt(promptId);
        if (!testPrompt) {
            console.warn(`⚠ Unknown prompt ID: ${promptId}`);
            continue;
        }

        console.log(`\n► Testing: ${testPrompt.name} (${promptId})`);
        console.log(`  Focus: ${testPrompt.focusPrinciples.join(", ")}`);

        // Generate multiple iterations
        for (let i = 0; i < ITERATIONS; i++) {
            console.log(`\n  Iteration ${i + 1}/${ITERATIONS}:`);

            try {
                // Generate story
                const { storyId, generationTime } = await generateStory(
                    testPrompt.prompt,
                );

                // Evaluate story
                const evaluationResults = await evaluateStory(storyId);

                // Calculate Core Principle scores
                const corePrincipleScores =
                    calculateCorePrincipleScores(evaluationResults);

                // Store results
                const result: TestStoryResult = {
                    storyId,
                    prompt: testPrompt.prompt,
                    promptVersion: PROMPT_VERSION,
                    generationTime,
                    evaluationResults,
                    corePrincipleScores,
                    timestamp: new Date().toISOString(),
                };

                testResults.push(result);
            } catch (error) {
                console.error(`  ✗ Test failed:`, error);
            }
        }
    }

    // Aggregate metrics across all stories
    const aggregatedMetrics = aggregateMetrics(testResults);

    // Identify failure patterns
    const failurePatterns = identifyFailurePatterns(testResults);

    // Create suite result
    const suiteResult: TestSuiteResult = {
        version: PROMPT_VERSION,
        testDate: new Date().toISOString(),
        testPrompts: TEST_PROMPT_IDS,
        evaluationMode: EVALUATION_MODE,
        iterations: ITERATIONS,
        stories: testResults,
        aggregatedMetrics,
        failurePatterns,
    };

    // Save results
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(suiteResult, null, 2));

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log(`
═══════════════════════════════════════════════════════════════
                        TEST COMPLETE
═══════════════════════════════════════════════════════════════
  Total Stories:   ${testResults.length}
  Total Time:      ${totalTime.toFixed(1)} minutes
  Results Saved:   ${OUTPUT_FILE}

  Summary:
  - Cyclic Structure:        ${((aggregatedMetrics.cyclicStructure.cycleCompleteness || 0) * 100).toFixed(0)}%
  - Intrinsic Motivation:    ${((aggregatedMetrics.intrinsicMotivation.cycleCompleteness || 0) * 100).toFixed(0)}%
  - Earned Consequence:      ${((aggregatedMetrics.earnedConsequence.cycleCompleteness || 0) * 100).toFixed(0)}%
  - Character Transformation: ${((aggregatedMetrics.characterTransformation.cycleCompleteness || 0) * 100).toFixed(0)}%
  - Emotional Resonance:     ${((aggregatedMetrics.emotionalResonance.cycleCompleteness || 0) * 100).toFixed(0)}%

  Top Issues:
${failurePatterns
    .slice(0, 3)
    .map((p) => `  - ${p.description} (${p.frequency} failures)`)
    .join("\n")}
═══════════════════════════════════════════════════════════════
`);
}

/**
 * Aggregate metrics across all test stories
 */
function aggregateMetrics(
    results: TestStoryResult[],
): TestSuiteResult["aggregatedMetrics"] {
    // This is a simplified aggregation - implement proper averaging
    const aggregated: any = {
        cyclicStructure: {},
        intrinsicMotivation: {},
        earnedConsequence: {},
        characterTransformation: {},
        emotionalResonance: {},
    };

    // Initialize with zeros
    for (const principle of Object.keys(aggregated)) {
        aggregated[principle] = {
            cycleCompleteness: 0,
            chapterCycleFocus: 0,
            phaseCoverage: 0,
            resolutionAdversityTransition: 0,
            stakesEscalation: 0,
            narrativeMomentum: 0,
            nestedCycleAlignment: 0,
            causalChainContinuity: 0,
            forwardMomentum: 0,
        };
    }

    // Average scores across all stories
    // Scores are 0-4 scale, so we normalize to 0-1 by dividing by 4
    const MAX_SCORE = 4;
    for (const result of results) {
        for (const [principle, score] of Object.entries(
            result.corePrincipleScores,
        )) {
            if (aggregated[principle]) {
                // Normalize score to 0-1 range, then average
                aggregated[principle].cycleCompleteness +=
                    score / MAX_SCORE / results.length;
            }
        }
    }

    return aggregated;
}

/**
 * Identify common failure patterns
 */
function identifyFailurePatterns(
    results: TestStoryResult[],
): TestSuiteResult["failurePatterns"] {
    const patterns: TestSuiteResult["failurePatterns"] = [];

    // Count failures by metric
    const failureCounts: Record<string, number> = {};

    for (const result of results) {
        for (const evalType of Object.values(result.evaluationResults)) {
            if (evalType?.metrics) {
                for (const [metricName, metric] of Object.entries(
                    evalType.metrics,
                )) {
                    if (!metric.passed) {
                        failureCounts[metricName] =
                            (failureCounts[metricName] || 0) + 1;
                    }
                }
            }
        }
    }

    // Create failure patterns
    for (const [metricName, count] of Object.entries(failureCounts)) {
        patterns.push({
            category: categorizeFailure(metricName),
            description: `${metricName} failed`,
            frequency: count,
            affectedMetrics: [metricName],
            rootCause: "To be analyzed",
            proposedFix: "To be determined",
            priority:
                count > results.length * 0.5
                    ? "high"
                    : count > results.length * 0.25
                      ? "medium"
                      : "low",
        });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Categorize failure by type
 */
function categorizeFailure(
    metricName: string,
): TestSuiteResult["failurePatterns"][0]["category"] {
    if (metricName.includes("cycle") || metricName.includes("phase"))
        return "structural";
    if (metricName.includes("emotion") || metricName.includes("gamdong"))
        return "emotional";
    if (metricName.includes("word") || metricName.includes("prose"))
        return "prose";
    if (metricName.includes("seed") || metricName.includes("causal"))
        return "causal";
    if (metricName.includes("character") || metricName.includes("arc"))
        return "character";
    return "structural";
}

// Run the suite
main().catch(console.error);
