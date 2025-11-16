/**
 * Toonplay Evaluator Tests
 *
 * Tests for toonplay quality evaluation
 */

// Jest globals are available in test environment via jest.setup.js
import type { InferSelectModel } from "drizzle-orm";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import { characters, scenes, settings } from "@/lib/schemas/database";

type Character = InferSelectModel<typeof characters>;
type Scene = InferSelectModel<typeof scenes>;
type Setting = InferSelectModel<typeof settings>;
import { evaluateToonplay } from "@/lib/services/toonplay-evaluator";

describe("Toonplay Evaluator", () => {
    const mockCharacter: Character = {
        id: "char-1",
        storyId: "story-1",
        name: "Test Hero",
        role: "protagonist",
        summary: "A brave hero",
        coreTrait: "courage",
        internalFlaw: "fears failure",
        externalGoal: "save the kingdom",
        backstory: "Born in a small village",
        physicalDescription: {
            age: "mid-20s",
            appearance: "tall with dark hair",
            distinctiveFeatures: "scar on left cheek",
            style: "adventurer gear",
        },
        voiceStyle: {
            tone: "confident",
            vocabulary: "educated",
            quirks: [],
            emotionalRange: "moderate",
        },
        personality: {
            traits: ["brave", "stubborn"],
            values: ["justice", "loyalty"],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as unknown as Character;

    const mockSetting: Setting = {
        id: "setting-1",
        storyId: "story-1",
        name: "Test Castle",
        description: "A grand medieval castle",
        atmosphere: "mysterious and imposing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as unknown as Setting;

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
    } as unknown as Scene;

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
            characters: [mockCharacter],
            setting: mockSetting,
            storyGenre: "Fantasy",
            // Note: evaluationMode is not part of EvaluateToonplayOptions
        });

        // Check result structure
        expect(result).toHaveProperty("weighted_score");
        expect(result).toHaveProperty("passes");
        expect(result).toHaveProperty("category1_narrative_fidelity");
        expect(result).toHaveProperty("category2_visual_transformation");
        expect(result).toHaveProperty("category3_webtoon_pacing");
        expect(result).toHaveProperty("category4_script_formatting");
        expect(result).toHaveProperty("metrics");

        // Check weighted score is in valid range
        expect(result.weighted_score).toBeGreaterThanOrEqual(1.0);
        expect(result.weighted_score).toBeLessThanOrEqual(5.0);

        // Check category scores (using snake_case property names)
        expect(result.category1_narrative_fidelity).toBeDefined();
        expect(result.category2_visual_transformation).toBeDefined();
        expect(result.category3_webtoon_pacing).toBeDefined();
        expect(result.category4_script_formatting).toBeDefined();

        // Check metrics (basic properties only)
        expect(result.metrics).toHaveProperty("total_panels");
        expect(result.metrics).toHaveProperty("panels_with_narration");
        expect(result.metrics).toHaveProperty("panels_with_dialogue");
        expect(result.metrics).toHaveProperty("panels_with_neither");
        expect(result.metrics).toHaveProperty("shot_type_distribution");
        expect(result.metrics).toHaveProperty("average_dialogue_length");

        // passes should match weighted_score >= 3.0
        expect(result.passes).toBe(result.weighted_score >= 3.0);
    }, 60000);

    it("should calculate automatic metrics correctly", async () => {
        const result = await evaluateToonplay({
            toonplay: mockToonplay,
            sourceScene: mockScene,
            characters: [mockCharacter],
            setting: mockSetting,
            storyGenre: "Fantasy",
            // Note: evaluationMode is not part of EvaluateToonplayOptions
        });

        // Check metric ranges (using actual properties)
        expect(result.metrics.total_panels).toBeGreaterThan(0);
        expect(result.metrics.panels_with_narration).toBeGreaterThanOrEqual(0);
        expect(result.metrics.panels_with_dialogue).toBeGreaterThanOrEqual(0);
        expect(result.metrics.panels_with_neither).toBeGreaterThanOrEqual(0);
        
        // Calculate percentages from actual data
        const narrationPercentage = (result.metrics.panels_with_narration / result.metrics.total_panels) * 100;
        expect(narrationPercentage).toBeGreaterThanOrEqual(0);
        expect(narrationPercentage).toBeLessThanOrEqual(100);

        const dialoguePercentage = (result.metrics.panels_with_dialogue / result.metrics.total_panels) * 100;
        expect(dialoguePercentage).toBeGreaterThanOrEqual(0);
        expect(dialoguePercentage).toBeLessThanOrEqual(100);

        expect(result.metrics.average_dialogue_length).toBeGreaterThanOrEqual(0);

        // Shot type distribution should have counts
        expect(
            Object.keys(result.metrics.shot_type_distribution).length,
        ).toBeGreaterThan(0);
    }, 60000);
});
