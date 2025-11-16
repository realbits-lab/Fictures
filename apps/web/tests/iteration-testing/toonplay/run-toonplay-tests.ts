#!/usr/bin/env tsx

/**
 * Run Toonplay Tests - Generate and evaluate toonplays for iteration testing
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts \
 *     --version v1.0 \
 *     --scenes "emotional-moment,action-sequence" \
 *     --iterations 5 \
 *     --mode standard \
 *     --output results/v1.0/baseline.json
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { getTestScene, TEST_SCENES } from "./config/test-scenes";
import { ToonplayMetricsTracker } from "./src/metrics-tracker";
import type { ToonplayTestResult, ToonplayEvaluation } from "./src/types";

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
Run Toonplay Tests - Generate and evaluate toonplays for iteration testing

Usage:
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts [options]

Options:
  --version    <string>  Prompt version to test (default: v1.0)
  --scenes     <string>  Comma-separated test scene IDs (default: all)
  --iterations <number>  Number of toonplays per scene (default: 5)
  --mode       <string>  Evaluation mode: quick|standard|thorough (default: standard)
  --output     <string>  Output file path (default: results/{version}/suite-{timestamp}.json)
  --help                 Show this help message

Examples:
  # Run baseline test with all scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts --version v1.0 --iterations 5

  # Test specific scenes
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts --scenes "emotional-moment,action-sequence"

  # Quick evaluation mode for rapid testing
  dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/toonplay/run-toonplay-tests.ts --mode quick
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
         TOONPLAY EVALUATION SUITE - ITERATION TESTING
═══════════════════════════════════════════════════════════════
  Prompt Version:  ${PROMPT_VERSION}
  Evaluation Mode: ${EVALUATION_MODE}
  Test Scenes:     ${TEST_SCENE_IDS.length} scenes
  Iterations:      ${ITERATIONS} per scene
  Total Toonplays: ${TEST_SCENE_IDS.length * ITERATIONS}
  Output:          ${OUTPUT_FILE}
═══════════════════════════════════════════════════════════════
`);

/**
 * Generate a story for the test scene (minimal 1 chapter, 1 scene)
 */
async function generateStoryForScene(
    sceneContent: string,
): Promise<{ storyId: string; sceneId: string; generationTime: number }> {
    console.log(`  → Generating test story...`);

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

    // Wrap generation logic in authentication context
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
        const { db } = await import("@/lib/db");
        const { scenes } = await import("@/lib/schemas/database");
        const { eq } = await import("drizzle-orm");

        try {
            // 1. Generate minimal story foundation
            console.log(`    • Generating story foundation...`);
            const storyResult = await storyService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                userPrompt: sceneContent,
                language: "en",
            });

            const storyId = storyResult.story.id;

            // 2. Generate minimal characters (2 characters)
            console.log(`    • Generating characters...`);
            await characterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                characterCount: 2,
            });

            // 3. Generate minimal settings (1 setting)
            console.log(`    • Generating setting...`);
            await settingService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                settingCount: 1,
            });

            // 4. Generate single part
            console.log(`    • Generating part structure...`);
            const partResult = await partService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                // Note: partNumber is not part of ServicePartParams
            });

            // 5. Generate single chapter
            console.log(`    • Generating chapter...`);
            const chapterResult = await chapterService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                storyId,
                partId: partResult.part.id,
                // Note: chapterNumber is not part of ServiceChapterParams
            });

            // 6. Generate single scene summary
            console.log(`    • Generating scene summary...`);
            const sceneSummaryResult =
                await sceneSummaryService.generateAndSave({
                    userId: "usr_QKl8WRbF-U2u4ymj",
                    storyId,
                    chapterId: chapterResult.chapter.id,
                    // Note: sceneCount is not part of ServiceSceneSummaryParams
                });

            const sceneId = sceneSummaryResult.scene.id;

            // 7. Generate scene content
            console.log(`    • Generating scene content...`);
            await sceneContentService.generateAndSave({
                userId: "usr_QKl8WRbF-U2u4ymj",
                sceneId,
            });

            // Get the generated scene
            const scene = await db.query.scenes.findFirst({
                where: eq(scenes.id, sceneId),
            });

            if (!scene || !scene.content) {
                throw new Error("Scene content not generated");
            }

            const generationTime = Date.now() - startTime;
            console.log(
                `    ✓ Story generated in ${(generationTime / 1000).toFixed(1)}s`,
            );

            return {
                storyId,
                sceneId: scene.id,
                generationTime,
            };
        } catch (error) {
            console.error(`    ✗ Generation failed:`, error);
            throw error;
        }
    });
}

/**
 * Generate toonplay for a scene
 */
async function generateToonplay(
    sceneId: string,
): Promise<{ toonplayGenerationTime: number }> {
    console.log(`  → Generating toonplay for scene ${sceneId}...`);

    const startTime = Date.now();

    try {
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

        // Call comic generation API (new endpoint with dual auth)
        const response = await fetch(
            `http://localhost:3000/api/studio/scenes/${sceneId}/comic/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    targetPanelCount: 10,
                    regenerate: true,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(
                `Toonplay generation failed: ${response.statusText}`,
            );
        }

        const _result = await response.json();
        const toonplayGenerationTime = Date.now() - startTime;

        console.log(
            `    ✓ Toonplay generated in ${(toonplayGenerationTime / 1000).toFixed(1)}s`,
        );

        return { toonplayGenerationTime };
    } catch (error) {
        console.error(`    ✗ Toonplay generation failed:`, error);
        throw error;
    }
}

/**
 * Evaluate a toonplay
 */
async function evaluateToonplay(sceneId: string): Promise<ToonplayTestResult> {
    console.log(`  → Evaluating toonplay for scene ${sceneId}...`);

    const evalStartTime = Date.now();

    try {
        // Import database and schema
        const { db } = await import("@/lib/db");
        const { scenes, characters, settings, stories, chapters } = await import(
            "@/lib/schemas/database"
        );
        const { eq } = await import("drizzle-orm");

        // Get scene with toonplay
        const scene = await db.query.scenes.findFirst({
            where: eq(scenes.id, sceneId),
        });

        if (!scene?.comicToonplay) {
            throw new Error("Toonplay not found for scene");
        }

        // Get chapter to find storyId
        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, scene.chapterId),
        });

        if (!chapter) {
            throw new Error("Chapter not found for scene");
        }

        // Get related data for evaluation
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, chapter.storyId),
        });

        if (!story) {
            throw new Error("Story not found");
        }

        const characterList = await db.query.characters.findMany({
            where: eq(characters.storyId, chapter.storyId),
        });

        const settingList = await db.query.settings.findMany({
            where: eq(settings.storyId, chapter.storyId),
        });

        const setting = settingList[0];

        if (!setting) {
            throw new Error("Setting not found");
        }

        // Import evaluator
        const { evaluateToonplay } = await import(
            "@/lib/services/toonplay-evaluator"
        );

        // Evaluate toonplay
        const evaluation = await evaluateToonplay({
            toonplay: scene.comicToonplay as any, // Type assertion for toonplay data
            sourceScene: scene,
            characters: characterList,
            setting,
            storyGenre: story.genre || "Fantasy",
            // Note: evaluationMode is not part of EvaluateToonplayOptions
        });

        const evaluationTime = Date.now() - evalStartTime;

        console.log(
            `    ✓ Evaluation complete in ${(evaluationTime / 1000).toFixed(1)}s`,
        );
        console.log(
            `      Score: ${evaluation.weighted_score.toFixed(2)}/5.0 ${evaluation.passes ? "✓ PASS" : "✗ FAIL"}`,
        );

        // Convert evaluation result to test format (snake_case to camelCase)
        const testEvaluation: ToonplayEvaluation = {
            weightedScore: evaluation.weighted_score,
            passes: evaluation.passes,
            categoryScores: {
                narrativeFidelity: (evaluation.category1_narrative_fidelity as any).score || 0,
                visualTransformation: (evaluation.category2_visual_transformation as any).score || 0,
                webtoonPacing: (evaluation.category3_webtoon_pacing as any).score || 0,
                scriptFormatting: (evaluation.category4_script_formatting as any).score || 0,
            },
            metrics: {
                narrationPercentage: (evaluation.metrics.panels_with_narration / evaluation.metrics.total_panels) * 100,
                internalMonologuePercentage: 0, // Not available in current metrics
                dialoguePresence: (evaluation.metrics.panels_with_dialogue / evaluation.metrics.total_panels) * 100,
                shotTypeDistribution: evaluation.metrics.shot_type_distribution,
                shotVariety: Object.keys(evaluation.metrics.shot_type_distribution).length,
                textOverlayValidation: true, // Not available in current metrics
                dialogueLengthCompliance: true, // Not available in current metrics
                descriptionLengthCompliance: true, // Not available in current metrics
                panelCount: evaluation.metrics.total_panels,
                averageDescriptionLength: 0, // Not available in current metrics
                averageDialoguePerPanel: evaluation.metrics.average_dialogue_length,
                verticalFlowQuality: 0, // Not available in current metrics
                panelPacingRhythm: 0, // Not available in current metrics
            },
            recommendations: [], // Not available in current evaluation result
            finalReport: "", // Not available in current evaluation result
        };

        // Convert toonplay to test format
        const testToonplay = scene.comicToonplay as any;
        const convertedToonplay = {
            sceneId: scene.id,
            sceneTitle: testToonplay.scene_title || scene.title || "Untitled Scene",
            totalPanels: testToonplay.total_panels || 0,
            panels: (testToonplay.panels || []).map((p: any) => ({
                panelNumber: p.panel_number || 0,
                shotType: p.shot_type || "",
                description: p.description || "",
                charactersVisible: p.characters_visible || [],
                dialogue: (p.dialogue || []).map((d: any) => ({
                    characterId: d.character_id || "",
                    text: d.text || "",
                })),
                narrative: p.narrative || undefined,
                sfx: (p.sfx || []).map((s: any) => ({
                    text: s.text || "",
                    emphasis: s.emphasis || "",
                })),
            })),
            narrativeArc: testToonplay.narrative_arc || "",
        };

        // Create test result
        const testResult: ToonplayTestResult = {
            testId: `test-${Date.now()}`,
            sceneId: scene.id,
            sceneName: scene.title || "Untitled Scene",
            promptVersion: PROMPT_VERSION,
            timestamp: new Date().toISOString(),
            toonplay: convertedToonplay,
            evaluation: testEvaluation,
            metadata: {
                generationTime: 0, // Will be filled by caller
                evaluationTime,
                totalTime: 0, // Will be filled by caller
                iterations: 0, // Will be filled by caller
                model: "gemini-2.0-flash-exp",
                provider: "google",
            },
        };

        return testResult;
    } catch (error) {
        console.error(`    ✗ Evaluation failed:`, error);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    const metricsTracker = new ToonplayMetricsTracker();
    const startTime = Date.now();

    // Process each test scene
    for (const sceneId of TEST_SCENE_IDS) {
        const testScene = getTestScene(sceneId);
        if (!testScene) {
            console.warn(`⚠ Unknown scene ID: ${sceneId}`);
            continue;
        }

        console.log(`\n► Testing: ${testScene.name} (${sceneId})`);
        console.log(`  Focus: ${testScene.focusAreas.join(", ")}`);

        // Generate multiple iterations
        for (let i = 0; i < ITERATIONS; i++) {
            console.log(`\n  Iteration ${i + 1}/${ITERATIONS}:`);

            try {
                const iterationStartTime = Date.now();

                // 1. Generate story and scene
                const {
                    storyId: _storyId,
                    sceneId: generatedSceneId,
                    generationTime,
                } = await generateStoryForScene(testScene.sceneContent);

                // 2. Generate toonplay
                const { toonplayGenerationTime } =
                    await generateToonplay(generatedSceneId);

                // 3. Evaluate toonplay
                const testResult = await evaluateToonplay(generatedSceneId);

                // Update metadata
                testResult.metadata.generationTime =
                    generationTime + toonplayGenerationTime;
                testResult.metadata.totalTime = Date.now() - iterationStartTime;
                testResult.metadata.iterations = i;

                // Add to tracker
                metricsTracker.addResult(testResult);

                console.log(
                    `  ✓ Iteration ${i + 1} complete (${((Date.now() - iterationStartTime) / 1000).toFixed(1)}s total)`,
                );
            } catch (error) {
                console.error(`  ✗ Iteration ${i + 1} failed:`, error);
            }
        }
    }

    // Get aggregated metrics
    const aggregatedMetrics =
        metricsTracker.getAggregatedMetrics(PROMPT_VERSION);

    // Create output data
    const outputData = {
        version: PROMPT_VERSION,
        testDate: new Date().toISOString(),
        testScenes: TEST_SCENE_IDS,
        evaluationMode: EVALUATION_MODE,
        iterations: ITERATIONS,
        toonplays: metricsTracker.getResults(),
        aggregatedMetrics,
    };

    // Save results
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    // Print summary
    console.log(`
═══════════════════════════════════════════════════════════════
                      TEST COMPLETE
═══════════════════════════════════════════════════════════════
  Total Toonplays: ${aggregatedMetrics.totalTests}
  Total Time:      ${totalTime.toFixed(1)} minutes
  Results Saved:   ${OUTPUT_FILE}

  Quality Metrics:
  - Weighted Score:        ${aggregatedMetrics.averageWeightedScore.toFixed(2)}/5.0
  - Pass Rate:             ${(aggregatedMetrics.passRate * 100).toFixed(0)}%
  - First Pass Success:    ${(aggregatedMetrics.firstPassSuccessRate * 100).toFixed(0)}%

  Content Proportions:
  - Narration:             ${aggregatedMetrics.averageNarrationPercentage.toFixed(1)}% (target: <5%)
  - Internal Monologue:    ${aggregatedMetrics.averageInternalMonologuePercentage.toFixed(1)}% (target: <10%)
  - Dialogue Presence:     ${aggregatedMetrics.averageDialoguePresence.toFixed(1)}% (target: ~70%)

  Compliance Rates:
  - Narration Compliance:  ${(aggregatedMetrics.narrationComplianceRate * 100).toFixed(0)}%
  - Monologue Compliance:  ${(aggregatedMetrics.internalMonologueComplianceRate * 100).toFixed(0)}%
  - Dialogue Target:       ${(aggregatedMetrics.dialogueTargetRate * 100).toFixed(0)}%

  Category Scores:
  - Narrative Fidelity:    ${aggregatedMetrics.categoryAverages.narrativeFidelity.toFixed(2)}/5.0
  - Visual Transform:      ${aggregatedMetrics.categoryAverages.visualTransformation.toFixed(2)}/5.0
  - Webtoon Pacing:        ${aggregatedMetrics.categoryAverages.webtoonPacing.toFixed(2)}/5.0
  - Script Formatting:     ${aggregatedMetrics.categoryAverages.scriptFormatting.toFixed(2)}/5.0

  Top Issues:
${aggregatedMetrics.failurePatterns
    .slice(0, 5)
    .map(
        (p) =>
            `  - [${p.priority.toUpperCase()}] ${p.description} (${p.frequency}/${aggregatedMetrics.totalTests})`,
    )
    .join("\n")}

  Suggested Fixes:
${aggregatedMetrics.failurePatterns
    .slice(0, 3)
    .map((p) => `  - ${p.suggestedFix}`)
    .join("\n")}
═══════════════════════════════════════════════════════════════
`);
}

// Run the suite
main().catch(console.error);
