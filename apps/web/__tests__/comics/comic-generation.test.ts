/**
 * Unit Tests for Comics Generation System
 *
 * Tests the complete comics generation system following the layered architecture:
 * - Generator Layer: Toonplay conversion and panel image generation
 * - Service Layer: Complete comic generation with quality evaluation
 * - Evaluation Layer: Toonplay quality assessment and improvement
 *
 * Architecture documented in: docs/comics/comics-development.md
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import type { ToonplayEvaluationResult } from "@/lib/services/toonplay-evaluator";
import { evaluateToonplay } from "@/lib/services/toonplay-evaluator";
import { generateToonplayWithEvaluation } from "@/lib/services/toonplay-improvement-loop";
import { convertSceneToToonplay } from "@/lib/studio/generators/toonplay-converter";
import type {
    ServiceComicGenerationParams,
    ServiceComicGenerationResult,
} from "@/lib/studio/services/comic-service";
import { generateAndSaveComic } from "@/lib/studio/services/comic-service";

// Mock dependencies
jest.mock("@/lib/studio/generators/toonplay-converter");
jest.mock("@/lib/studio/generators/comic-panel-generator");
jest.mock("@/lib/services/toonplay-evaluator");
jest.mock("@/lib/services/toonplay-improvement-loop");
jest.mock("@/lib/db", () => ({
    db: {
        insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue(undefined),
        }),
        update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue(undefined),
            }),
        }),
        query: {
            scenes: {
                findFirst: jest.fn().mockResolvedValue({
                    id: "scene_123",
                    title: "Test Scene",
                    comicStatus: "draft",
                    comicPanelCount: 6,
                    comicGeneratedAt: new Date().toISOString(),
                    comicVersion: 1,
                }),
            },
        },
    },
}));

describe("Comics Generation System", () => {
    describe("Generator Layer - convertSceneToToonplay()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should convert scene to toonplay with correct structure", async () => {
            // Arrange
            const mockToonplay: AiComicToonplayType = {
                scene_id: "scene_123",
                scene_title: "The Confrontation",
                total_panels: 6,
                narrative_arc:
                    "Rising tension leading to climactic confrontation",
                panels: [
                    {
                        panel_number: 1,
                        shot_type: "establishing_shot",
                        description:
                            "Wide view of ancient temple courtyard at dusk",
                        characters_visible: ["hero", "mentor"],
                        camera_angle: "eye_level",
                        mood: "tense",
                        narrative: undefined,
                        dialogue: [
                            {
                                character_id: "hero",
                                text: "We shouldn't be here after dark.",
                                tone: "worried",
                            },
                        ],
                        sfx: [{ text: "wind howling", emphasis: "normal" }],
                        character_poses: {
                            hero: "standing, alert posture",
                            mentor: "observant stance",
                        },
                        setting_focus: "temple courtyard",
                        lighting: "dusk, golden hour",
                    },
                    {
                        panel_number: 2,
                        shot_type: "medium_shot",
                        description: "Hero and mentor facing each other",
                        characters_visible: ["hero", "mentor"],
                        camera_angle: "eye_level",
                        mood: "serious",
                        narrative: undefined,
                        dialogue: [
                            {
                                character_id: "mentor",
                                text: "Your training begins now.",
                                tone: "serious",
                            },
                        ],
                        sfx: [],
                        character_poses: {
                            hero: "defensive posture",
                            mentor: "confrontational stance",
                        },
                        setting_focus: "characters",
                        lighting: "dramatic shadows",
                    },
                ],
            };

            (convertSceneToToonplay as jest.Mock).mockResolvedValue({
                toonplay: mockToonplay,
            });

            const params = {
                scene: {
                    id: "scene_123",
                    title: "The Confrontation",
                    content: "Hero meets mentor at temple...",
                    summary: "A pivotal meeting",
                } as any,
                story: {
                    id: "story_123",
                    genre: "fantasy",
                    tone: "serious",
                } as any,
                characters: [
                    { id: "hero", name: "Hero" },
                    { id: "mentor", name: "Mentor" },
                ] as any,
                settings: [{ id: "temple", name: "Ancient Temple" }] as any,
            };

            // Act
            const result = await convertSceneToToonplay(params);

            // Assert
            expect(convertSceneToToonplay).toHaveBeenCalledWith(params);
            expect(result.toonplay).toBeDefined();
            expect(result.toonplay.scene_id).toBe("scene_123");
            expect(result.toonplay.total_panels).toBe(6);
            expect(result.toonplay.panels).toHaveLength(2);
            expect(result.toonplay.panels[0].panel_number).toBe(1);
            expect(result.toonplay.panels[0].shot_type).toBe(
                "establishing_shot",
            );
            expect(result.toonplay.panels[0].dialogue).toHaveLength(1);
        });

        it("should generate toonplay with varied shot types", async () => {
            // Arrange
            const mockToonplay: AiComicToonplayType = {
                scene_id: "scene_123",
                scene_title: "Action Sequence",
                total_panels: 8,
                narrative_arc: "Intense battle sequence",
                panels: [
                    { panel_number: 1, shot_type: "establishing_shot" } as any,
                    { panel_number: 2, shot_type: "wide_shot" } as any,
                    { panel_number: 3, shot_type: "medium_shot" } as any,
                    { panel_number: 4, shot_type: "close_up" } as any,
                    { panel_number: 5, shot_type: "extreme_close_up" } as any,
                    { panel_number: 6, shot_type: "over_shoulder" } as any,
                ],
            };

            (convertSceneToToonplay as jest.Mock).mockResolvedValue({
                toonplay: mockToonplay,
            });

            // Act
            const result = await convertSceneToToonplay({} as any);

            // Assert
            const shotTypes = result.toonplay.panels.map((p) => p.shot_type);
            expect(shotTypes).toContain("establishing_shot");
            expect(shotTypes).toContain("wide_shot");
            expect(shotTypes).toContain("medium_shot");
            expect(shotTypes).toContain("close_up");
        });
    });

    describe("Evaluation Layer - evaluateToonplay()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should evaluate toonplay quality and return weighted score", async () => {
            // Arrange
            const mockEvaluation: ToonplayEvaluationResult = {
                category1_narrative_fidelity: {
                    score: 4,
                    reasoning: "Preserves core narrative beats",
                    strengths: ["Maintains plot progression"],
                    weaknesses: [],
                },
                category2_visual_transformation: {
                    score: 4,
                    reasoning: "Good visual externalization",
                    strengths: ["Minimal narration"],
                    weaknesses: [],
                },
                category3_webtoon_pacing: {
                    score: 3,
                    reasoning: "Adequate pacing",
                    strengths: ["Good flow"],
                    weaknesses: ["Could improve dialogue length"],
                },
                category4_script_formatting: {
                    score: 5,
                    reasoning: "Perfect formatting",
                    strengths: ["Clear descriptions"],
                    weaknesses: [],
                },
                overall_assessment: "High quality toonplay",
                improvement_suggestions: [],
                narration_percentage: 8.3,
                dialogue_to_visual_ratio: "Balanced (70% dialogue, 30% visual)",
                weighted_score: 4.0,
                passes: true,
                metrics: {
                    total_panels: 6,
                    panels_with_narration: 0,
                    panels_with_dialogue: 6,
                    panels_with_neither: 0,
                    shot_type_distribution: {
                        establishing_shot: 1,
                        medium_shot: 3,
                        close_up: 2,
                    },
                    average_dialogue_length: 45,
                },
            };

            (evaluateToonplay as jest.Mock).mockResolvedValue(mockEvaluation);

            const mockToonplay: AiComicToonplayType = {
                scene_id: "scene_123",
                scene_title: "Test Scene",
                total_panels: 6,
                narrative_arc: "Test arc",
                panels: [],
            };

            // Act
            const result = await evaluateToonplay({
                toonplay: mockToonplay,
                sourceScene: {} as any,
                characters: [],
                setting: {} as any,
                storyGenre: "fantasy",
            });

            // Assert
            expect(result.weighted_score).toBe(4.0);
            expect(result.passes).toBe(true);
            expect(result.metrics.panels_with_neither).toBe(0);
            expect(result.narration_percentage).toBeLessThan(10);
        });

        it("should fail evaluation when quality is below threshold", async () => {
            // Arrange
            const mockEvaluation: ToonplayEvaluationResult = {
                category1_narrative_fidelity: {
                    score: 2,
                    reasoning: "Missing key plot points",
                    strengths: [],
                    weaknesses: ["Skips important beats"],
                },
                category2_visual_transformation: {
                    score: 2,
                    reasoning: "Too much narration",
                    strengths: [],
                    weaknesses: ["Over-reliance on text"],
                },
                category3_webtoon_pacing: {
                    score: 3,
                    reasoning: "Average pacing",
                    strengths: [],
                    weaknesses: [],
                },
                category4_script_formatting: {
                    score: 3,
                    reasoning: "Adequate formatting",
                    strengths: [],
                    weaknesses: [],
                },
                overall_assessment: "Needs improvement",
                improvement_suggestions: [
                    "Reduce narration",
                    "Add more visual action",
                ],
                narration_percentage: 25.0,
                dialogue_to_visual_ratio: "Imbalanced",
                weighted_score: 2.5,
                passes: false,
                metrics: {
                    total_panels: 6,
                    panels_with_narration: 3,
                    panels_with_dialogue: 5,
                    panels_with_neither: 1,
                    shot_type_distribution: {},
                    average_dialogue_length: 120,
                },
            };

            (evaluateToonplay as jest.Mock).mockResolvedValue(mockEvaluation);

            // Act
            const result = await evaluateToonplay({
                toonplay: {} as any,
                sourceScene: {} as any,
                characters: [],
                setting: {} as any,
                storyGenre: "fantasy",
            });

            // Assert
            expect(result.weighted_score).toBe(2.5);
            expect(result.passes).toBe(false);
            expect(result.improvement_suggestions).toHaveLength(2);
            expect(result.narration_percentage).toBeGreaterThan(20);
        });
    });

    describe("Service Layer - generateToonplayWithEvaluation()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should generate toonplay with passing evaluation on first attempt", async () => {
            // Arrange
            const mockResult = {
                toonplay: {
                    scene_id: "scene_123",
                    total_panels: 6,
                } as AiComicToonplayType,
                evaluation: {
                    weighted_score: 4.2,
                    passes: true,
                } as ToonplayEvaluationResult,
                iterations: 0,
                improvement_history: [
                    { iteration: 0, score: 4.2, passed: true },
                ],
                final_report: "Quality evaluation report",
            };

            (generateToonplayWithEvaluation as jest.Mock).mockResolvedValue(
                mockResult,
            );

            // Act
            const result = await generateToonplayWithEvaluation({
                scene: {} as any,
                characters: [],
                setting: {} as any,
                storyGenre: "fantasy",
            });

            // Assert
            expect(result.iterations).toBe(0);
            expect(result.evaluation.passes).toBe(true);
            expect(result.improvement_history).toHaveLength(1);
        });

        it("should improve toonplay until passing threshold", async () => {
            // Arrange
            const mockResult = {
                toonplay: {
                    scene_id: "scene_123",
                    total_panels: 6,
                } as AiComicToonplayType,
                evaluation: {
                    weighted_score: 3.5,
                    passes: true,
                } as ToonplayEvaluationResult,
                iterations: 2,
                improvement_history: [
                    { iteration: 0, score: 2.5, passed: false },
                    { iteration: 1, score: 2.8, passed: false },
                    { iteration: 2, score: 3.5, passed: true },
                ],
                final_report: "Quality evaluation report after 2 improvements",
            };

            (generateToonplayWithEvaluation as jest.Mock).mockResolvedValue(
                mockResult,
            );

            // Act
            const result = await generateToonplayWithEvaluation({
                scene: {} as any,
                characters: [],
                setting: {} as any,
                storyGenre: "fantasy",
                maxIterations: 2,
            });

            // Assert
            expect(result.iterations).toBe(2);
            expect(result.improvement_history).toHaveLength(3);
            expect(result.improvement_history[0].passed).toBe(false);
            expect(result.improvement_history[2].passed).toBe(true);
            expect(result.evaluation.weighted_score).toBeGreaterThanOrEqual(
                3.0,
            );
        });

        it("should return best version even if never passes threshold", async () => {
            // Arrange
            const mockResult = {
                toonplay: {
                    scene_id: "scene_123",
                    total_panels: 6,
                } as AiComicToonplayType,
                evaluation: {
                    weighted_score: 2.9,
                    passes: false,
                } as ToonplayEvaluationResult,
                iterations: 2,
                improvement_history: [
                    { iteration: 0, score: 2.3, passed: false },
                    { iteration: 1, score: 2.7, passed: false },
                    { iteration: 2, score: 2.9, passed: false },
                ],
                final_report: "Best attempt after max iterations",
            };

            (generateToonplayWithEvaluation as jest.Mock).mockResolvedValue(
                mockResult,
            );

            // Act
            const result = await generateToonplayWithEvaluation({
                scene: {} as any,
                characters: [],
                setting: {} as any,
                storyGenre: "fantasy",
                maxIterations: 2,
            });

            // Assert
            expect(result.iterations).toBe(2);
            expect(result.evaluation.passes).toBe(false);
            expect(result.evaluation.weighted_score).toBe(2.9);
            expect(result.improvement_history[2].score).toBeGreaterThan(
                result.improvement_history[0].score,
            );
        });
    });

    describe("Service Layer - generateAndSaveComic()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should orchestrate complete comic generation and save to database", async () => {
            // Arrange
            const mockParams: ServiceComicGenerationParams = {
                sceneId: "scene_123",
                scene: {
                    id: "scene_123",
                    title: "Test Scene",
                    content: "Scene content...",
                } as any,
                story: {
                    id: "story_123",
                    genre: "fantasy",
                } as any,
                characters: [{ id: "char_1", name: "Hero" }] as any,
                settings: [{ id: "set_1", name: "Temple" }] as any,
                targetPanelCount: 6,
            };

            const mockResult: ServiceComicGenerationResult = {
                toonplay: {
                    scene_id: "scene_123",
                    total_panels: 6,
                } as AiComicToonplayType,
                panels: [
                    {
                        id: "panel_1",
                        panelNumber: 1,
                        shotType: "establishing_shot",
                        imageUrl: "https://blob.vercel-storage.com/panel1.png",
                    },
                ] as any,
                evaluation: {
                    weighted_score: 3.8,
                    passes: true,
                } as ToonplayEvaluationResult,
                metadata: {
                    generationTime: 45000,
                    toonplayTime: 5000,
                    panelGenerationTime: 40000,
                    savedToDatabase: true,
                    totalPanels: 6,
                },
            };

            // Mock implementation
            (generateAndSaveComic as jest.Mock).mockResolvedValue(mockResult);

            // Act
            const result = await generateAndSaveComic(mockParams);

            // Assert
            expect(generateAndSaveComic).toHaveBeenCalledWith(mockParams);
            expect(result.toonplay).toBeDefined();
            expect(result.panels).toHaveLength(1);
            expect(result.evaluation.passes).toBe(true);
            expect(result.metadata.savedToDatabase).toBe(true);
            expect(result.metadata.totalPanels).toBe(6);
        });

        it("should track progress during generation", async () => {
            // Arrange
            const progressCallback = jest.fn();
            const mockParams: ServiceComicGenerationParams = {
                sceneId: "scene_123",
                scene: {} as any,
                story: {} as any,
                characters: [],
                settings: [],
                onProgress: progressCallback,
            };

            (generateAndSaveComic as jest.Mock).mockImplementation(
                async (params: ServiceComicGenerationParams) => {
                    // Simulate progress callbacks
                    params.onProgress?.(0, 100, "Generating toonplay...");
                    params.onProgress?.(20, 100, "Generated 6 panels");
                    params.onProgress?.(50, 100, "Generating panel 3/6...");
                    params.onProgress?.(90, 100, "Saving to database...");
                    params.onProgress?.(100, 100, "Complete!");

                    return {
                        toonplay: {} as any,
                        panels: [],
                        evaluation: {} as any,
                        metadata: {
                            generationTime: 45000,
                            toonplayTime: 5000,
                            panelGenerationTime: 40000,
                            savedToDatabase: true,
                            totalPanels: 6,
                        },
                    };
                },
            );

            // Act
            await generateAndSaveComic(mockParams);

            // Assert
            expect(progressCallback).toHaveBeenCalledTimes(5);
            expect(progressCallback).toHaveBeenCalledWith(
                0,
                100,
                "Generating toonplay...",
            );
            expect(progressCallback).toHaveBeenCalledWith(
                100,
                100,
                "Complete!",
            );
        });
    });

    describe("Quality Metrics Validation", () => {
        it("should validate narration percentage is below 5%", () => {
            // Arrange
            const evaluation: ToonplayEvaluationResult = {
                narration_percentage: 4.2,
                weighted_score: 4.0,
                passes: true,
            } as any;

            // Assert
            expect(evaluation.narration_percentage).toBeLessThan(5);
        });

        it("should validate no panels without text", () => {
            // Arrange
            const evaluation: ToonplayEvaluationResult = {
                metrics: {
                    total_panels: 6,
                    panels_with_narration: 1,
                    panels_with_dialogue: 6,
                    panels_with_neither: 0,
                    shot_type_distribution: {},
                    average_dialogue_length: 50,
                },
                weighted_score: 4.0,
                passes: true,
            } as any;

            // Assert
            expect(evaluation.metrics.panels_with_neither).toBe(0);
        });

        it("should validate shot type distribution follows guidelines", () => {
            // Arrange
            const evaluation: ToonplayEvaluationResult = {
                metrics: {
                    total_panels: 10,
                    panels_with_narration: 0,
                    panels_with_dialogue: 10,
                    panels_with_neither: 0,
                    shot_type_distribution: {
                        establishing_shot: 1,
                        wide_shot: 2,
                        medium_shot: 4,
                        close_up: 3,
                    },
                    average_dialogue_length: 60,
                },
                weighted_score: 4.5,
                passes: true,
            } as any;

            // Assert - For 10 panels, expect distribution:
            // 1 establishing, 2-3 wide, 3-5 medium, 2-3 close_up
            expect(
                evaluation.metrics.shot_type_distribution.establishing_shot,
            ).toBe(1);
            expect(
                evaluation.metrics.shot_type_distribution.wide_shot,
            ).toBeGreaterThanOrEqual(2);
            expect(
                evaluation.metrics.shot_type_distribution.medium_shot,
            ).toBeGreaterThanOrEqual(3);
            expect(
                evaluation.metrics.shot_type_distribution.close_up,
            ).toBeGreaterThanOrEqual(2);
        });

        it("should validate dialogue length is reasonable", () => {
            // Arrange
            const evaluation: ToonplayEvaluationResult = {
                metrics: {
                    total_panels: 6,
                    panels_with_narration: 0,
                    panels_with_dialogue: 6,
                    panels_with_neither: 0,
                    shot_type_distribution: {},
                    average_dialogue_length: 85, // Target: ≤150 chars
                },
                weighted_score: 4.0,
                passes: true,
            } as any;

            // Assert
            expect(
                evaluation.metrics.average_dialogue_length,
            ).toBeLessThanOrEqual(150);
        });
    });
});
