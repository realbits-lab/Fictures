/**
 * Toonplay Schema Tests
 *
 * Tests for toonplay schema validation (no API calls)
 */

// Jest globals are available in test environment via jest.setup.js
import {
    AiComicPanelSpecZodSchema,
    AiComicToonplayZodSchema,
    AiToonplayEvaluationZodSchema,
} from "@/lib/schemas/ai/ai-toonplay";

describe("Toonplay Schemas", () => {
    describe("AiComicPanelSpecZodSchema", () => {
        it("should validate a valid panel", () => {
            const validPanel = {
                panel_number: 1,
                shot_type: "medium_shot",
                description:
                    "A character stands in a room with dramatic lighting. The scene shows tension and anticipation. Background details include furniture and windows. The character's body language conveys determination. Visual focus is on the character's expression and posture. The mood is intense and focused.",
                characters_visible: ["char-1"],
                character_poses: { "char-1": "standing with arms crossed" },
                setting_focus: "interior room with dramatic shadows",
                lighting: "harsh overhead lighting creating dramatic shadows",
                camera_angle: "low angle looking up at character",
                dialogue: [
                    {
                        character_id: "char-1",
                        text: "This is my moment.",
                        tone: "determined",
                    },
                ],
                sfx: [],
                mood: "tense",
            };

            const result = AiComicPanelSpecZodSchema.safeParse(validPanel);
            expect(result.success).toBe(true);
        });

        it("should reject panel with short description", () => {
            const invalidPanel = {
                panel_number: 1,
                shot_type: "medium_shot",
                description: "Too short", // Less than 200 chars
                characters_visible: [],
                character_poses: {},
                setting_focus: "room",
                lighting: "bright",
                camera_angle: "eye level",
                dialogue: [],
                sfx: [],
                mood: "neutral",
            };

            const result = AiComicPanelSpecZodSchema.safeParse(invalidPanel);
            expect(result.success).toBe(false);
        });

        it("should reject panel with long dialogue", () => {
            const invalidPanel = {
                panel_number: 1,
                shot_type: "medium_shot",
                description:
                    "A valid description that is exactly two hundred characters long to meet the minimum length requirement for panel descriptions in the toonplay schema. This should pass the length validation check successfully now.",
                characters_visible: ["char-1"],
                character_poses: { "char-1": "standing" },
                setting_focus: "room",
                lighting: "natural light",
                camera_angle: "eye level",
                dialogue: [
                    {
                        character_id: "char-1",
                        text: "This is way too long for a single dialogue bubble. Webtoon readers need short, digestible text that doesn't overwhelm the panel. This exceeds the 150 character limit significantly.", // Over 150 chars
                    },
                ],
                sfx: [],
                mood: "neutral",
            };

            const result = AiComicPanelSpecZodSchema.safeParse(invalidPanel);
            expect(result.success).toBe(false);
        });
    });

    describe("AiComicToonplayZodSchema", () => {
        it("should validate a complete toonplay", () => {
            const validToonplay = {
                scene_id: "scene-1",
                scene_title: "Test Scene",
                total_panels: 10,
                panels: Array.from({ length: 10 }, (_, i) => ({
                    panel_number: i + 1,
                    shot_type: "medium_shot",
                    description:
                        "A character stands in a room with dramatic lighting showing intense emotion and determination. The scene captures a pivotal moment in the narrative with careful attention to body language and facial expression. Background elements support the mood.",
                    characters_visible: ["char-1"],
                    character_poses: { "char-1": "standing" },
                    setting_focus: "interior room",
                    lighting: "dramatic overhead",
                    camera_angle: "eye level",
                    dialogue: [
                        {
                            character_id: "char-1",
                            text: "This is important.",
                        },
                    ],
                    sfx: [],
                    mood: "tense",
                })),
                narrative_arc: "Setup to climax to resolution",
            };

            const result = AiComicToonplayZodSchema.safeParse(validToonplay);
            expect(result.success).toBe(true);
        });

        it("should reject toonplay with too few panels", () => {
            const invalidToonplay = {
                scene_id: "scene-1",
                scene_title: "Test Scene",
                total_panels: 5, // Less than 8
                panels: [],
                narrative_arc: "Too short",
            };

            const result = AiComicToonplayZodSchema.safeParse(invalidToonplay);
            expect(result.success).toBe(false);
        });

        it("should reject toonplay with mismatched panel count", () => {
            const invalidToonplay = {
                scene_id: "scene-1",
                scene_title: "Test Scene",
                total_panels: 10,
                panels: Array.from({ length: 8 }, (_, i) => ({
                    // Only 8 panels, but total_panels says 10
                    panel_number: i + 1,
                    shot_type: "medium_shot",
                    description:
                        "Valid description with enough characters to meet the minimum length requirement of two hundred characters. This ensures the panel description provides sufficient detail for visualization and artistic implementation.",
                    characters_visible: [],
                    character_poses: {},
                    setting_focus: "room",
                    lighting: "natural",
                    camera_angle: "eye level",
                    dialogue: [],
                    sfx: [],
                    mood: "neutral",
                })),
                narrative_arc: "Test arc",
            };

            const result = AiComicToonplayZodSchema.safeParse(invalidToonplay);
            expect(result.success).toBe(false);
        });
    });

    describe("AiToonplayEvaluationZodSchema", () => {
        it("should validate a complete evaluation", () => {
            const validEvaluation = {
                weighted_score: 3.5,
                passes: true,
                category_scores: {
                    narrative_fidelity: 4,
                    visual_transformation: 3,
                    webtoon_pacing: 4,
                    script_formatting: 3,
                },
                metrics: {
                    narration_percentage: 5,
                    internal_monologue_percentage: 8,
                    dialogue_presence: 70,
                    shot_type_distribution: {
                        medium_shot: 5,
                        close_up: 3,
                        wide_shot: 2,
                    },
                    text_overlay_validation: true,
                    dialogue_length_compliance: true,
                },
                recommendations: [
                    "Increase visual storytelling in panels 3-5",
                    "Consider adding more shot variety",
                ],
                final_report:
                    "Overall solid adaptation with good dialogue distribution and proper formatting. Minor improvements suggested for visual variety.",
            };

            const result =
                AiToonplayEvaluationZodSchema.safeParse(validEvaluation);
            expect(result.success).toBe(true);
        });

        it("should reject evaluation with invalid score range", () => {
            const invalidEvaluation = {
                weighted_score: 6.0, // Over 5.0
                passes: true,
                category_scores: {
                    narrative_fidelity: 4,
                    visual_transformation: 3,
                    webtoon_pacing: 4,
                    script_formatting: 3,
                },
                metrics: {
                    narration_percentage: 5,
                    internal_monologue_percentage: 8,
                    dialogue_presence: 70,
                    shot_type_distribution: {},
                    text_overlay_validation: true,
                    dialogue_length_compliance: true,
                },
                recommendations: [],
                final_report: "Test",
            };

            const result =
                AiToonplayEvaluationZodSchema.safeParse(invalidEvaluation);
            expect(result.success).toBe(false);
        });
    });
});
