/**
 * Toonplay Quality Evaluator
 *
 * Evaluates toonplay quality using the "Architectonics of Engagement" framework
 * as specified in docs/comics/comics-toonplay.md
 *
 * Scoring System:
 * - Category 1: Narrative Fidelity & Distillation (20%)
 * - Category 2: Visual Transformation & Externalization (30%)
 * - Category 3: Webtoon Pacing & Vertical Flow (30%)
 * - Category 4: Script Formatting & Pipeline Utility (20%)
 *
 * Scale: 1 (Poor) to 5 (Excellent)
 * Passing Score: 3.0/5.0 ("Effective" level)
 */

import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import type { characters, scenes, settings } from "@/lib/schemas/database";

// ============================================
// EVALUATION SCHEMA
// ============================================

export const ToonplayEvaluationSchema = z.object({
    category1_narrative_fidelity: z.object({
        score: z.number().min(1).max(5),
        reasoning: z
            .string()
            .describe("Explanation of score for narrative fidelity"),
        strengths: z.array(z.string()).describe("What the toonplay does well"),
        weaknesses: z.array(z.string()).describe("What needs improvement"),
    }),
    category2_visual_transformation: z.object({
        score: z.number().min(1).max(5),
        reasoning: z
            .string()
            .describe("Explanation of score for visual transformation"),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
    }),
    category3_webtoon_pacing: z.object({
        score: z.number().min(1).max(5),
        reasoning: z
            .string()
            .describe("Explanation of score for webtoon pacing"),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
    }),
    category4_script_formatting: z.object({
        score: z.number().min(1).max(5),
        reasoning: z
            .string()
            .describe("Explanation of score for script formatting"),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
    }),
    overall_assessment: z
        .string()
        .describe("Overall summary of toonplay quality"),
    improvement_suggestions: z
        .array(z.string())
        .describe("Specific actionable improvements"),
    narration_percentage: z
        .number()
        .min(0)
        .max(100)
        .describe("Percentage of panels using narration"),
    dialogue_to_visual_ratio: z
        .string()
        .describe("Assessment of dialogue vs visual action balance"),
});

export type ToonplayEvaluation = z.infer<typeof ToonplayEvaluationSchema>;

export interface ToonplayEvaluationResult extends ToonplayEvaluation {
    weighted_score: number;
    passes: boolean;
    metrics: {
        total_panels: number;
        panels_with_narration: number;
        panels_with_dialogue: number;
        panels_with_neither: number;
        shot_type_distribution: Record<string, number>;
        average_dialogue_length: number;
    };
}

// ============================================
// EVALUATION FUNCTION
// ============================================

export interface EvaluateToonplayOptions {
    toonplay: AiComicToonplayType;
    sourceScene: typeof scenes.$inferSelect;
    characters: (typeof characters.$inferSelect)[];
    setting: typeof settings.$inferSelect;
    storyGenre: string | null;
}

export async function evaluateToonplay(
    options: EvaluateToonplayOptions,
): Promise<ToonplayEvaluationResult> {
    const { toonplay, sourceScene, characters, setting, storyGenre } = options;

    console.log(
        `\n📊 Evaluating toonplay quality for: "${toonplay.scene_title}"`,
    );

    // Calculate metrics
    const metrics = calculateToonplayMetrics(toonplay);

    // Build evaluation prompt
    const evaluationPrompt = buildEvaluationPrompt(
        toonplay,
        sourceScene,
        characters,
        setting,
        storyGenre,
        metrics,
    );

    console.log(`   Sending evaluation request to AI...`);

    const result = await generateObject({
        model: gateway("google/gemini-2.5-flash-lite"),
        schema: ToonplayEvaluationSchema,
        prompt: evaluationPrompt,
        temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    const evaluation = result.object;

    // Calculate weighted score
    const weightedScore = calculateWeightedScore(evaluation);
    const passes = weightedScore >= 3.0;

    console.log(`   ✅ Evaluation complete`);
    console.log(`   Weighted Score: ${weightedScore.toFixed(2)}/5.0`);
    console.log(
        `   Passes: ${passes ? "✅ YES" : "❌ NO (needs improvement)"}`,
    );
    console.log(`   Category Scores:`);
    console.log(
        `     1. Narrative Fidelity: ${evaluation.category1_narrative_fidelity.score}/5 (weight: 20%)`,
    );
    console.log(
        `     2. Visual Transformation: ${evaluation.category2_visual_transformation.score}/5 (weight: 30%)`,
    );
    console.log(
        `     3. Webtoon Pacing: ${evaluation.category3_webtoon_pacing.score}/5 (weight: 30%)`,
    );
    console.log(
        `     4. Script Formatting: ${evaluation.category4_script_formatting.score}/5 (weight: 20%)`,
    );

    return {
        ...evaluation,
        weighted_score: weightedScore,
        passes,
        metrics,
    };
}

// ============================================
// METRICS CALCULATION
// ============================================

function calculateToonplayMetrics(toonplay: AiComicToonplayType) {
    const panels = toonplay.panels;
    const totalPanels = panels.length;

    // Count panels with narration, dialogue, or neither
    const panelsWithNarration = panels.filter(
        (p) => p.narrative && p.narrative.trim().length > 0,
    ).length;
    const panelsWithDialogue = panels.filter(
        (p) => p.dialogue && p.dialogue.length > 0,
    ).length;
    const panelsWithNeither = panels.filter(
        (p) =>
            (!p.narrative || p.narrative.trim().length === 0) &&
            (!p.dialogue || p.dialogue.length === 0),
    ).length;

    // Shot type distribution
    const shotTypeDistribution: Record<string, number> = {};
    panels.forEach((p) => {
        shotTypeDistribution[p.shot_type] =
            (shotTypeDistribution[p.shot_type] || 0) + 1;
    });

    // Average dialogue length
    let totalDialogueLength = 0;
    let dialogueCount = 0;
    panels.forEach((p) => {
        if (p.dialogue) {
            p.dialogue.forEach((d) => {
                totalDialogueLength += d.text.length;
                dialogueCount++;
            });
        }
    });
    const averageDialogueLength =
        dialogueCount > 0 ? totalDialogueLength / dialogueCount : 0;

    return {
        total_panels: totalPanels,
        panels_with_narration: panelsWithNarration,
        panels_with_dialogue: panelsWithDialogue,
        panels_with_neither: panelsWithNeither,
        shot_type_distribution: shotTypeDistribution,
        average_dialogue_length: averageDialogueLength,
    };
}

// ============================================
// PROMPT BUILDING
// ============================================

function buildEvaluationPrompt(
    toonplay: AiComicToonplayType,
    sourceScene: typeof scenes.$inferSelect,
    sceneCharacters: (typeof characters.$inferSelect)[],
    setting: typeof settings.$inferSelect,
    storyGenre: string | null,
    metrics: ReturnType<typeof calculateToonplayMetrics>,
): string {
    const sceneTitle = sourceScene.title;
    const sceneContent = sourceScene.content;
    const sceneSummary = sourceScene.summary || "";

    const characterNames = sceneCharacters.map((c) => c.name).join(", ");

    // Format toonplay for display
    const toonplayFormatted = toonplay.panels
        .map((p, i) => {
            const dialogueText =
                p.dialogue
                    ?.map((d) => `${d.character_id}: "${d.text}"`)
                    .join("; ") || "None";
            const narrativeText = p.narrative || "None";
            return `Panel ${i + 1} [${p.shot_type}]:
  Description: ${p.description}
  Dialogue: ${dialogueText}
  Narrative: ${narrativeText}
  Characters: ${p.characters_visible.join(", ") || "None"}`;
        })
        .join("\n\n");

    return `You are an expert webtoon script evaluator. Evaluate this toonplay using the "Architectonics of Engagement" framework.

SOURCE SCENE INFORMATION:
Title: ${sceneTitle}
Genre: ${storyGenre}
Characters: ${characterNames}
Setting: ${setting.name}

SOURCE SCENE SUMMARY:
${sceneSummary}

SOURCE SCENE CONTENT (ORIGINAL NARRATIVE):
${sceneContent}

GENERATED TOONPLAY (TO BE EVALUATED):
Total Panels: ${toonplay.total_panels}
Narrative Arc: ${toonplay.narrative_arc}

${toonplayFormatted}

CALCULATED METRICS:
- Total Panels: ${metrics.total_panels}
- Panels with Narration: ${metrics.panels_with_narration} (${((metrics.panels_with_narration / metrics.total_panels) * 100).toFixed(1)}%)
- Panels with Dialogue: ${metrics.panels_with_dialogue} (${((metrics.panels_with_dialogue / metrics.total_panels) * 100).toFixed(1)}%)
- Panels with NEITHER (critical issue): ${metrics.panels_with_neither}
- Shot Type Distribution: ${Object.entries(metrics.shot_type_distribution)
        .map(([type, count]) => `${type}=${count}`)
        .join(", ")}
- Average Dialogue Length: ${metrics.average_dialogue_length.toFixed(1)} chars

EVALUATION RUBRIC:

**Category 1: Narrative Fidelity & Distillation (20%)**
Did the adapter preserve the core themes, character arcs, and plot essence?
- 1 (Poor): Barely recognizable. Loses core themes and plot.
- 3 (Average): Keeps main plot points but strays erratically.
- 5 (Excellent): Masterfully distills essence. Preserves all key themes and arcs while intelligently discarding subplots.

**Category 2: Visual Transformation & Externalization (30%)**
How well does the script translate internal content into visual action?
- 1 (Poor): Relies heavily on narration and internal monologue captions. "Too much black" on the page.
- 3 (Average): Translates some interiority but falls back on narration for complex points.
- 5 (Excellent): Masterfully physicalizes emotion. All internal monologues translated into visual actions, expressions, or concise dialogue.

CRITICAL: Narration should be <5% of panels. Dialogue should be ~70%, visual action ~30%.

**Category 3: Webtoon Pacing & Vertical Flow (30%)**
Is the script optimized for thumb-scroll reading?
- 1 (Poor): Choppy, disjointed. Pacing is slow with heavy dialogue blocks.
- 3 (Average): Pacing is functional. Dialogue is broken up, but panel flow is uninspired.
- 5 (Excellent): Clear, logical flow. Masterful use of panel spacing to control time. Dialogue is digestible (max 150 chars) and perfectly integrated.

**Category 4: Script Formatting & Pipeline Utility (20%)**
Can the art team/AI pipeline actually use this document?
- 1 (Poor): Vague or missing panel descriptions. Unusable.
- 3 (Average): Format is correct, but descriptions are sometimes unclear or inconsistent.
- 5 (Excellent): Consistently formatted. Panel descriptions are concise yet clear, using proper visual grammar.

EXPECTED SHOT TYPE DISTRIBUTION (for ${metrics.total_panels} panels):
- 1 establishing_shot (scene opening)
- 2-3 wide_shot (full action, multiple characters)
- 3-5 medium_shot (main storytelling, conversations)
- 2-3 close_up (emotional beats, reactions)
- 0-1 extreme_close_up (climactic moments)
- 0-1 over_shoulder or dutch_angle (special moments)

EVALUATION INSTRUCTIONS:
1. Compare the source scene content with the generated toonplay
2. Assess each category using the rubric (1-5 scale)
3. Calculate narration_percentage: (panels_with_narration / total_panels) * 100
4. Assess dialogue_to_visual_ratio: Should be "Balanced (70% dialogue, 30% visual)" or describe the imbalance
5. Provide specific, actionable improvement suggestions
6. Be critical but fair - a score of 3.0/5.0 is "Effective" and acceptable

Return your evaluation as a structured JSON object.`;
}

// ============================================
// SCORING CALCULATION
// ============================================

function calculateWeightedScore(evaluation: ToonplayEvaluation): number {
    const weights = {
        narrative_fidelity: 0.2,
        visual_transformation: 0.3,
        webtoon_pacing: 0.3,
        script_formatting: 0.2,
    };

    const weightedScore =
        evaluation.category1_narrative_fidelity.score *
            weights.narrative_fidelity +
        evaluation.category2_visual_transformation.score *
            weights.visual_transformation +
        evaluation.category3_webtoon_pacing.score * weights.webtoon_pacing +
        evaluation.category4_script_formatting.score *
            weights.script_formatting;

    return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
}

// ============================================
// IMPROVEMENT SUGGESTIONS FORMATTER
// ============================================

export function formatEvaluationReport(
    result: ToonplayEvaluationResult,
): string {
    const report = `
═══════════════════════════════════════════════════════════════
TOONPLAY QUALITY EVALUATION REPORT
═══════════════════════════════════════════════════════════════

📊 OVERALL SCORE: ${result.weighted_score.toFixed(2)}/5.0
${result.passes ? "✅ PASSES (≥3.0)" : "❌ NEEDS IMPROVEMENT (<3.0)"}

───────────────────────────────────────────────────────────────
CATEGORY SCORES
───────────────────────────────────────────────────────────────

1️⃣  Narrative Fidelity & Distillation (20%)
    Score: ${result.category1_narrative_fidelity.score}/5
    ${result.category1_narrative_fidelity.reasoning}

2️⃣  Visual Transformation & Externalization (30%)
    Score: ${result.category2_visual_transformation.score}/5
    ${result.category2_visual_transformation.reasoning}

3️⃣  Webtoon Pacing & Vertical Flow (30%)
    Score: ${result.category3_webtoon_pacing.score}/5
    ${result.category3_webtoon_pacing.reasoning}

4️⃣  Script Formatting & Pipeline Utility (20%)
    Score: ${result.category4_script_formatting.score}/5
    ${result.category4_script_formatting.reasoning}

───────────────────────────────────────────────────────────────
METRICS
───────────────────────────────────────────────────────────────

Total Panels: ${result.metrics.total_panels}
Panels with Narration: ${result.metrics.panels_with_narration} (${result.narration_percentage.toFixed(1)}%)
  Target: <5% of panels
  Status: ${result.narration_percentage < 5 ? "✅ Within target" : "⚠️  Exceeds target"}

Panels with Dialogue: ${result.metrics.panels_with_dialogue}
Panels with NEITHER: ${result.metrics.panels_with_neither}
  Status: ${result.metrics.panels_with_neither === 0 ? "✅ All panels have text" : "❌ CRITICAL: Some panels lack text"}

Dialogue/Visual Balance: ${result.dialogue_to_visual_ratio}

Average Dialogue Length: ${result.metrics.average_dialogue_length.toFixed(0)} chars
  Target: ≤150 chars
  Status: ${result.metrics.average_dialogue_length <= 150 ? "✅ Within target" : "⚠️  Exceeds target"}

Shot Type Distribution:
${Object.entries(result.metrics.shot_type_distribution)
    .map(([type, count]) => `  - ${type}: ${count}`)
    .join("\n")}

───────────────────────────────────────────────────────────────
IMPROVEMENT SUGGESTIONS
───────────────────────────────────────────────────────────────

${result.improvement_suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

───────────────────────────────────────────────────────────────
OVERALL ASSESSMENT
───────────────────────────────────────────────────────────────

${result.overall_assessment}

═══════════════════════════════════════════════════════════════
`;

    return report;
}
