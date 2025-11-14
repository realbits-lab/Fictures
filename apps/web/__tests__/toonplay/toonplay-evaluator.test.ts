/**
 * Toonplay Evaluator Tests
 *
 * Tests for toonplay quality evaluation
 */

import { describe, expect, it } from "@jest/globals";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import type { Scene } from "@/lib/schemas/zod/ai";
import { evaluateToonplay } from "@/lib/services/toonplay-evaluator";

describe("Toonplay Evaluator", () => {
    const mockScene: Scene = {
        id: "scene-1",
        chapterId: "chapter-1",
        sceneNumber: 1,
        title: "Test Scene",
        summary: "A test scene",
        content: "Test content for evaluation",
        cyclePhase: "virtue",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Scene;

    const mockToonplay: AiComicToonplayType = {
        scene_id: "scene-1",
        scene_title: "Test Scene",
        total_panels: 10,
        narrative_arc: "Setup to resolution",
        panels: Array.from({ length: 10 }, (_, i) => ({
            panel_number: i + 1,
            shot_type: "medium_shot" as const,
            description:
                "A character stands in a room, looking determined. They are wearing casual clothes and the lighting is natural. The background shows a simple interior setting with furniture visible. The mood is contemplative and the character appears to be deep in thought about an important decision.",
            characters_visible: ["char-1"],
            character_poses: { "char-1": "standing with arms crossed" },
            setting_focus: "interior room",
            lighting: "natural daylight",
            camera_angle: "eye level",
            narrative:
                i === 0
                    ? "Time: Morning"
                    : i === 9
                      ? "This changes everything."
                      : undefined,
            dialogue:
                i % 3 === 0
                    ? []
                    : [
                          {
                              character_id: "char-1",
                              text: "I need to make a choice.",
                              tone: "thoughtful",
                          },
                      ],
            sfx: [],
            mood: "contemplative",
        })),
    };

    it("should evaluate toonplay and return score", async () => {
        const result = await evaluateToonplay({
            toonplay: mockToonplay,
            sourceScene: mockScene,
            evaluationMode: "standard",
        });

        // Check result structure
        expect(result).toHaveProperty("weighted_score");
        expect(result).toHaveProperty("passes");
        expect(result).toHaveProperty("category_scores");
        expect(result).toHaveProperty("metrics");
        expect(result).toHaveProperty("recommendations");
        expect(result).toHaveProperty("final_report");

        // Check weighted score is in valid range
        expect(result.weighted_score).toBeGreaterThanOrEqual(1.0);
        expect(result.weighted_score).toBeLessThanOrEqual(5.0);

        // Check category scores
        expect(result.category_scores).toHaveProperty("narrative_fidelity");
        expect(result.category_scores).toHaveProperty("visual_transformation");
        expect(result.category_scores).toHaveProperty("webtoon_pacing");
        expect(result.category_scores).toHaveProperty("script_formatting");

        // Check metrics
        expect(result.metrics).toHaveProperty("narration_percentage");
        expect(result.metrics).toHaveProperty("internal_monologue_percentage");
        expect(result.metrics).toHaveProperty("dialogue_presence");
        expect(result.metrics).toHaveProperty("shot_type_distribution");
        expect(result.metrics).toHaveProperty("text_overlay_validation");
        expect(result.metrics).toHaveProperty("dialogue_length_compliance");

        // passes should match weighted_score >= 3.0
        expect(result.passes).toBe(result.weighted_score >= 3.0);
    }, 60000);

    it("should calculate automatic metrics correctly", async () => {
        const result = await evaluateToonplay({
            toonplay: mockToonplay,
            sourceScene: mockScene,
            evaluationMode: "quick",
        });

        // Check metric ranges
        expect(result.metrics.narration_percentage).toBeGreaterThanOrEqual(0);
        expect(result.metrics.narration_percentage).toBeLessThanOrEqual(100);

        expect(
            result.metrics.internal_monologue_percentage,
        ).toBeGreaterThanOrEqual(0);
        expect(
            result.metrics.internal_monologue_percentage,
        ).toBeLessThanOrEqual(100);

        expect(result.metrics.dialogue_presence).toBeGreaterThanOrEqual(0);
        expect(result.metrics.dialogue_presence).toBeLessThanOrEqual(100);

        expect(result.metrics.text_overlay_validation).toBe(true);
        expect(result.metrics.dialogue_length_compliance).toBe(true);

        // Shot type distribution should have counts
        expect(
            Object.keys(result.metrics.shot_type_distribution).length,
        ).toBeGreaterThan(0);
    }, 60000);
});
