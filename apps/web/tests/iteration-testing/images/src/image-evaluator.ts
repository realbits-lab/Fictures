/**
 * Image Visual Quality Evaluator
 *
 * Uses AI (Gemini) to evaluate visual quality of generated images.
 * Based on the evaluation pattern from src/lib/services/evaluation.ts
 */

import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/config";

// Image evaluation response schema
const ImageVisualQualitySchema = z.object({
    composition: z
        .number()
        .min(1)
        .max(5)
        .describe("Composition and framing quality (1-5)"),
    technicalQuality: z
        .number()
        .min(1)
        .max(5)
        .describe("Technical quality - sharpness, detail, no artifacts (1-5)"),
    colorHarmony: z
        .number()
        .min(1)
        .max(5)
        .describe("Color palette and harmony (1-5)"),
    atmosphericEffectiveness: z
        .number()
        .min(1)
        .max(5)
        .describe("How well it conveys mood/atmosphere (1-5)"),
    promptAdherence: z
        .number()
        .min(1)
        .max(5)
        .describe("How well the image matches the prompt (1-5)"),
    overallVisualQuality: z
        .number()
        .min(1)
        .max(5)
        .describe("Overall visual quality score (1-5)"),
    strengths: z
        .array(z.string())
        .describe("Key visual strengths of the image"),
    weaknesses: z.array(z.string()).describe("Areas for improvement"),
    recommendations: z
        .array(z.string())
        .describe("Specific recommendations for better results"),
});

export type ImageVisualQualityResult = z.infer<typeof ImageVisualQualitySchema>;

export interface ImageEvaluationInput {
    imageUrl: string;
    prompt: string;
    scenario?: {
        id: string;
        name: string;
        focusAreas?: string[];
        expectedAspectRatio?: string;
    };
    genre?: string;
    imageType?: "story" | "character" | "setting" | "scene" | "comic-panel";
}

/**
 * Evaluate image visual quality using AI
 *
 * Uses Gemini multimodal capability to analyze the generated image
 * and provide quality scores across multiple dimensions.
 */
export async function evaluateImageVisualQuality(
    input: ImageEvaluationInput,
): Promise<ImageVisualQualityResult> {
    try {
        const { imageUrl, prompt, scenario, genre, imageType } = input;

        // Build context for the evaluation
        const contextParts: string[] = [];

        if (scenario) {
            contextParts.push(`Scenario: ${scenario.name}`);
            if (scenario.focusAreas?.length) {
                contextParts.push(
                    `Focus Areas: ${scenario.focusAreas.join(", ")}`,
                );
            }
        }

        if (genre) {
            contextParts.push(`Genre: ${genre}`);
        }

        if (imageType) {
            contextParts.push(`Image Type: ${imageType}`);
        }

        const contextString =
            contextParts.length > 0
                ? `\nContext:\n${contextParts.join("\n")}`
                : "";

        const evaluationPrompt = `You are an expert image quality evaluator for AI-generated art used in storytelling platforms.

Evaluate the following image based on these criteria. Score each from 1 (poor) to 5 (exceptional).

**Original Prompt Used to Generate This Image:**
${prompt}
${contextString}

**Scoring Guide:**
- 5 = Exceptional - Professional quality, no flaws
- 4 = High - Minor imperfections only visible on close inspection
- 3 = Acceptable - Meets minimum standards, suitable for web
- 2 = Poor - Noticeable quality issues
- 1 = Unacceptable - Major problems, not usable

**Evaluate These Dimensions:**

1. **Composition** (1-5): Framing, balance, visual hierarchy, focal point clarity
2. **Technical Quality** (1-5): Sharpness, detail level, absence of artifacts, coherence
3. **Color Harmony** (1-5): Color palette effectiveness, mood support, visual appeal
4. **Atmospheric Effectiveness** (1-5): How well it conveys the intended mood/atmosphere
5. **Prompt Adherence** (1-5): How accurately it matches the original prompt's intent

Then provide an **Overall Visual Quality** score (1-5) considering all factors.

Also provide:
- 2-3 specific strengths
- 1-2 areas for improvement
- 1-2 actionable recommendations for better results

Analyze the image URL provided: ${imageUrl}`;

        const { object } = await generateObject({
            model: AI_MODELS.analysis,
            schema: ImageVisualQualitySchema,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: evaluationPrompt },
                        { type: "image", image: imageUrl },
                    ],
                },
            ],
        });

        return object;
    } catch (error) {
        console.error("[image-evaluator] Error evaluating image:", error);

        // Return default scores on error
        return {
            composition: 3,
            technicalQuality: 3,
            colorHarmony: 3,
            atmosphericEffectiveness: 3,
            promptAdherence: 3,
            overallVisualQuality: 3,
            strengths: ["Unable to evaluate at this time"],
            weaknesses: [],
            recommendations: [],
        };
    }
}

/**
 * Calculate a simple visual quality score (1-5) from the detailed evaluation
 */
export function calculateVisualQualityScore(
    evaluation: ImageVisualQualityResult,
): number {
    // Use the overall score if available, otherwise calculate weighted average
    if (evaluation.overallVisualQuality) {
        return evaluation.overallVisualQuality;
    }

    // Weighted average of dimensions
    const weights = {
        composition: 0.2,
        technicalQuality: 0.25,
        colorHarmony: 0.15,
        atmosphericEffectiveness: 0.2,
        promptAdherence: 0.2,
    };

    const score =
        evaluation.composition * weights.composition +
        evaluation.technicalQuality * weights.technicalQuality +
        evaluation.colorHarmony * weights.colorHarmony +
        evaluation.atmosphericEffectiveness * weights.atmosphericEffectiveness +
        evaluation.promptAdherence * weights.promptAdherence;

    return Math.round(score * 10) / 10;
}

/**
 * Quick visual quality check (faster, less detailed)
 *
 * Returns a single 1-5 score without detailed breakdown.
 * Useful for iteration testing where speed matters.
 */
export async function quickVisualQualityCheck(
    imageUrl: string,
    prompt: string,
): Promise<number> {
    try {
        const { object } = await generateObject({
            model: AI_MODELS.analysis,
            schema: z.object({
                score: z
                    .number()
                    .min(1)
                    .max(5)
                    .describe("Overall visual quality score (1-5)"),
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Rate this AI-generated image's visual quality from 1 (poor) to 5 (exceptional).

Prompt used: "${prompt}"

Consider: composition, technical quality, color harmony, atmosphere, and prompt adherence.

Provide a single overall score.`,
                        },
                        { type: "image", image: imageUrl },
                    ],
                },
            ],
        });

        return object.score;
    } catch (error) {
        console.error("[image-evaluator] Quick check error:", error);
        return 3.5; // Default fallback
    }
}
