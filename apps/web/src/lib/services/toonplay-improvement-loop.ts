/**
 * Toonplay Iterative Improvement Loop
 *
 * Generates toonplay with automatic quality evaluation and improvement.
 * Implements the iterative refinement process described in docs/comics/comics-toonplay.md
 *
 * Process:
 * 1. Generate initial toonplay
 * 2. Evaluate quality using rubric
 * 3. If score < 3.0/5.0, improve and re-evaluate (max 2 improvement cycles)
 * 4. Return best version with evaluation report
 */

import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import type { characters, scenes, settings } from "@/lib/db/schema";

// Type aliases
type StoryScene = typeof scenes.$inferSelect;
type StoryCharacter = typeof characters.$inferSelect;
type StorySetting = typeof settings.$inferSelect;

import {
    type ComicToonplay,
    ComicToonplaySchema,
    type ConvertToToonplayOptions,
    convertSceneToToonplay,
} from "@/lib/ai/toonplay-converter";
import {
    evaluateToonplay,
    formatEvaluationReport,
    type ToonplayEvaluationResult,
} from "./toonplay-evaluator";

// ============================================
// TYPES
// ============================================

export interface ToonplayGenerationResult {
    toonplay: ComicToonplay;
    evaluation: ToonplayEvaluationResult;
    iterations: number;
    improvement_history: {
        iteration: number;
        score: number;
        passed: boolean;
    }[];
    final_report: string;
}

export interface GenerateToonplayWithEvaluationOptions {
    scene: typeof scenes.$inferSelect;
    characters: (typeof characters.$inferSelect)[];
    setting: typeof settings.$inferSelect;
    storyGenre: string | null;
    targetPanelCount?: number;
    maxIterations?: number;
    passingScore?: number;
}

// ============================================
// MAIN GENERATION FUNCTION WITH EVALUATION
// ============================================

export async function generateToonplayWithEvaluation(
    options: GenerateToonplayWithEvaluationOptions,
): Promise<ToonplayGenerationResult> {
    const {
        scene,
        characters,
        setting,
        storyGenre,
        targetPanelCount = 10,
        maxIterations = 2,
        passingScore = 3.0,
    } = options;

    const sceneTitle = scene.title;
    console.log(
        `\n🎬 ═══════════════════════════════════════════════════════════`,
    );
    console.log(`   TOONPLAY GENERATION WITH EVALUATION`);
    console.log(`   Scene: "${sceneTitle}"`);
    console.log(`   Max Iterations: ${maxIterations}`);
    console.log(`   Passing Score: ${passingScore}/5.0`);
    console.log(
        `   ═══════════════════════════════════════════════════════════\n`,
    );

    let currentToonplay: ComicToonplay | null = null;
    let currentEvaluation: ToonplayEvaluationResult | null = null;
    let bestToonplay: ComicToonplay | null = null;
    let bestEvaluation: ToonplayEvaluationResult | null = null;
    let bestScore = 0;

    const improvementHistory: {
        iteration: number;
        score: number;
        passed: boolean;
    }[] = [];

    // ========================================
    // ITERATION 0: Initial Generation
    // ========================================

    console.log(`\n📝 Iteration 0: Initial Toonplay Generation`);

    const safeStoryGenre = storyGenre || "Unknown";

    currentToonplay = await convertSceneToToonplay({
        scene,
        characters,
        setting,
        storyGenre: safeStoryGenre,
        targetPanelCount,
    });

    console.log(`   ✅ Generated ${currentToonplay.total_panels} panels`);

    // Evaluate initial toonplay
    console.log(`\n📊 Evaluating initial toonplay...`);

    currentEvaluation = await evaluateToonplay({
        toonplay: currentToonplay,
        sourceScene: scene,
        characters,
        setting,
        storyGenre: safeStoryGenre,
    });

    improvementHistory.push({
        iteration: 0,
        score: currentEvaluation.weighted_score,
        passed: currentEvaluation.passes,
    });

    bestToonplay = currentToonplay;
    bestEvaluation = currentEvaluation;
    bestScore = currentEvaluation.weighted_score;

    console.log(
        `\n   Score: ${currentEvaluation.weighted_score.toFixed(2)}/5.0`,
    );
    console.log(
        `   Status: ${currentEvaluation.passes ? "✅ PASSES" : "❌ NEEDS IMPROVEMENT"}`,
    );

    // If passing, return immediately
    if (currentEvaluation.passes) {
        console.log(
            `\n✅ Toonplay passes on first attempt! No improvement needed.`,
        );
        const finalReport = formatEvaluationReport(currentEvaluation);
        return {
            toonplay: currentToonplay,
            evaluation: currentEvaluation,
            iterations: 0,
            improvement_history: improvementHistory,
            final_report: finalReport,
        };
    }

    // ========================================
    // IMPROVEMENT ITERATIONS
    // ========================================

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
        console.log(
            `\n🔄 ─────────────────────────────────────────────────────────────`,
        );
        console.log(`   Iteration ${iteration}: Improving Toonplay`);
        console.log(
            `   ─────────────────────────────────────────────────────────────\n`,
        );

        // Generate improved toonplay based on evaluation feedback
        const improvedToonplay = await improveToonplay({
            currentToonplay: currentToonplay!,
            evaluation: currentEvaluation!,
            scene,
            characters,
            setting,
            storyGenre: safeStoryGenre,
            targetPanelCount,
        });

        console.log(
            `   ✅ Improved toonplay generated: ${improvedToonplay.total_panels} panels`,
        );

        // Evaluate improved version
        console.log(`\n📊 Evaluating improved toonplay...`);

        const improvedEvaluation = await evaluateToonplay({
            toonplay: improvedToonplay,
            sourceScene: scene,
            characters,
            setting,
            storyGenre: safeStoryGenre,
        });

        improvementHistory.push({
            iteration,
            score: improvedEvaluation.weighted_score,
            passed: improvedEvaluation.passes,
        });

        console.log(
            `\n   Score: ${improvedEvaluation.weighted_score.toFixed(2)}/5.0 (previous: ${currentEvaluation!.weighted_score.toFixed(2)})`,
        );
        console.log(
            `   Improvement: ${improvedEvaluation.weighted_score > currentEvaluation!.weighted_score ? "📈 Better" : "📉 Worse"}`,
        );
        console.log(
            `   Status: ${improvedEvaluation.passes ? "✅ PASSES" : "❌ STILL NEEDS WORK"}`,
        );

        // Update current version
        currentToonplay = improvedToonplay;
        currentEvaluation = improvedEvaluation;

        // Track best version
        if (improvedEvaluation.weighted_score > bestScore) {
            bestToonplay = improvedToonplay;
            bestEvaluation = improvedEvaluation;
            bestScore = improvedEvaluation.weighted_score;
            console.log(`   🏆 New best score!`);
        }

        // If passing, stop iterations
        if (improvedEvaluation.passes) {
            console.log(
                `\n✅ Toonplay now passes after ${iteration} improvement iteration(s)!`,
            );
            break;
        }
    }

    // ========================================
    // FINAL RESULTS
    // ========================================

    console.log(
        `\n═══════════════════════════════════════════════════════════`,
    );
    console.log(`   FINAL RESULTS`);
    console.log(
        `   ═══════════════════════════════════════════════════════════`,
    );
    console.log(
        `   Best Score: ${bestScore.toFixed(2)}/5.0 (iteration ${improvementHistory.findIndex((h) => h.score === bestScore)})`,
    );
    console.log(
        `   Status: ${bestEvaluation!.passes ? "✅ PASSES" : "⚠️  DOES NOT PASS (using best available)"}`,
    );
    console.log(`   Total Iterations: ${improvementHistory.length - 1}`);
    console.log(
        `   ═══════════════════════════════════════════════════════════\n`,
    );

    const finalReport = formatEvaluationReport(bestEvaluation!);

    return {
        toonplay: bestToonplay!,
        evaluation: bestEvaluation!,
        iterations: improvementHistory.length - 1,
        improvement_history: improvementHistory,
        final_report: finalReport,
    };
}

// ============================================
// IMPROVEMENT FUNCTION
// ============================================

interface ImproveToonplayOptions {
    currentToonplay: ComicToonplay;
    evaluation: ToonplayEvaluationResult;
    scene: StoryScene;
    characters: StoryCharacter[];
    setting: StorySetting;
    storyGenre: string;
    targetPanelCount: number;
}

async function improveToonplay(
    options: ImproveToonplayOptions,
): Promise<ComicToonplay> {
    const {
        currentToonplay,
        evaluation,
        scene,
        characters,
        setting,
        storyGenre,
        targetPanelCount,
    } = options;

    const sceneTitle = scene.title;
    const sceneContent = scene.content;
    const characterDescriptions = characters
        .map(
            (c) =>
                `${c.name}: ${c.summary || c.internalFlaw || c.externalGoal || "pursuing their goals"}`,
        )
        .join("\n");

    // Build improvement prompt based on evaluation feedback
    const improvementPrompt = `You are an expert comic storyboard artist. IMPROVE this toonplay based on the evaluation feedback.

SCENE INFORMATION:
Title: ${sceneTitle}
Genre: ${storyGenre}

NARRATIVE CONTENT:
${sceneContent}

CHARACTERS PRESENT:
${characterDescriptions}

SETTING:
${setting.name}: ${setting.description}

CURRENT TOONPLAY (TO BE IMPROVED):
Total Panels: ${currentToonplay.total_panels}
${JSON.stringify(currentToonplay, null, 2)}

EVALUATION RESULTS:
Overall Score: ${evaluation.weighted_score}/5.0 (NEEDS IMPROVEMENT - Target: ≥3.0)

Category Scores:
1. Narrative Fidelity: ${evaluation.category1_narrative_fidelity.score}/5
2. Visual Transformation: ${evaluation.category2_visual_transformation.score}/5
3. Webtoon Pacing: ${evaluation.category3_webtoon_pacing.score}/5
4. Script Formatting: ${evaluation.category4_script_formatting.score}/5

KEY WEAKNESSES TO ADDRESS:
${[
    ...evaluation.category1_narrative_fidelity.weaknesses,
    ...evaluation.category2_visual_transformation.weaknesses,
    ...evaluation.category3_webtoon_pacing.weaknesses,
    ...evaluation.category4_script_formatting.weaknesses,
]
    .map((w, i) => `${i + 1}. ${w}`)
    .join("\n")}

SPECIFIC IMPROVEMENT SUGGESTIONS:
${evaluation.improvement_suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

METRICS TO IMPROVE:
- Narration percentage: ${evaluation.narration_percentage.toFixed(1)}% (TARGET: <5%)
- Dialogue/Visual balance: ${evaluation.dialogue_to_visual_ratio}
- Panels without text: ${evaluation.metrics.panels_with_neither} (MUST BE 0)

IMPROVEMENT INSTRUCTIONS:
1. Address ALL weaknesses identified in the evaluation
2. Implement ALL improvement suggestions
3. Maintain panel count around ${targetPanelCount} panels (can vary 8-12)
4. CRITICAL: Reduce narration to <5% of panels - externalize through visual action and dialogue
5. CRITICAL: Every panel MUST have either dialogue OR narrative (no exceptions)
6. Improve shot type variety and distribution
7. Enhance visual descriptions for better image generation
8. Maintain character consistency across all panels
9. Improve pacing and flow for vertical scroll
10. Focus especially on low-scoring categories

SHOT TYPE DISTRIBUTION (for ${targetPanelCount} panels):
- 1 establishing_shot (scene opening)
- 2-3 wide_shot (full action, multiple characters)
- 3-5 medium_shot (main storytelling, conversations)
- 2-3 close_up (emotional beats, reactions)
- 0-1 extreme_close_up (climactic moments)
- 0-1 over_shoulder or dutch_angle (special moments)

CONTENT PROPORTION TARGET:
- Dialogue: ~70% (Primary story driver)
- Visual Action: ~30% (Shown in panels, not told)
- Narration: <5% (Only when absolutely necessary)

Return the IMPROVED toonplay as a valid JSON object matching the ComicToonplay schema.`;

    console.log(`   Sending improvement request to AI...`);

    const result = await generateObject({
        model: gateway("google/gemini-2.5-flash-lite"),
        schema: ComicToonplaySchema,
        prompt: improvementPrompt,
        temperature: 0.7,
    });

    return result.object;
}
