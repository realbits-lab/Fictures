/**
 * Toonplay Converter Tests
 *
 * Tests for scene-to-toonplay conversion
 */

import fs from "node:fs";
import path from "node:path";
// Jest globals are available in test environment via jest.setup.js
import type { InferSelectModel } from "drizzle-orm";
import {
    characters,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";

type Character = InferSelectModel<typeof characters>;
type Scene = InferSelectModel<typeof scenes>;
type Setting = InferSelectModel<typeof settings>;
type Story = InferSelectModel<typeof stories>;
import { convertSceneToToonplay } from "@/lib/studio/generators/toonplay-converter";

describe("Toonplay Converter", () => {
    // Note: API key authentication is handled by the auth context system
    // Tests should use withAuth wrapper if needed, or pass API key as parameter
    // Mock data
    const mockStory: Story = {
        id: "story-1",
        authorId: "author-1",
        title: "Test Story",
        summary: "A test story for toonplay conversion",
        genre: "Fantasy",
        tone: "hopeful",
        moralFramework: "Test moral framework",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Story;

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
        title: "The Challenge",
        summary: "Hero faces a difficult decision",
        content:
            "The hero stood at the crossroads. To the left, the safe path home. To the right, danger and adventure. He gripped his sword tightly. 'I must do this,' he whispered. Taking a deep breath, he turned right.",
        settingId: "setting-1",
        cyclePhase: "virtue",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as unknown as Scene;

    it("should convert scene to toonplay", async () => {
        const result = await convertSceneToToonplay({
            scene: mockScene,
            story: mockStory,
            characters: [mockCharacter],
            settings: [mockSetting],
            language: "English",
        });

        // Check result structure
        expect(result).toHaveProperty("toonplay");
        expect(result).toHaveProperty("metadata");

        // Check toonplay structure
        expect(result.toonplay).toHaveProperty("scene_id", "scene-1");
        expect(result.toonplay).toHaveProperty("scene_title");
        expect(result.toonplay).toHaveProperty("total_panels");
        expect(result.toonplay).toHaveProperty("panels");
        expect(result.toonplay).toHaveProperty("narrative_arc");

        // Check panel count (8-12 panels)
        expect(result.toonplay.total_panels).toBeGreaterThanOrEqual(8);
        expect(result.toonplay.total_panels).toBeLessThanOrEqual(12);
        expect(result.toonplay.panels).toHaveLength(
            result.toonplay.total_panels,
        );

        // Check metadata
        expect(result.metadata).toHaveProperty("generationTime");
        expect(result.metadata).toHaveProperty("model");
    }, 60000); // 60 second timeout for AI generation

    it("should generate panels with required fields", async () => {
        const result = await convertSceneToToonplay({
            scene: mockScene,
            story: mockStory,
            characters: [mockCharacter],
            settings: [mockSetting],
        });

        // Check each panel has required fields
        for (const panel of result.toonplay.panels) {
            expect(panel).toHaveProperty("panel_number");
            expect(panel).toHaveProperty("shot_type");
            expect(panel).toHaveProperty("description");
            expect(panel).toHaveProperty("characters_visible");
            expect(panel).toHaveProperty("character_poses");
            expect(panel).toHaveProperty("setting_focus");
            expect(panel).toHaveProperty("lighting");
            expect(panel).toHaveProperty("camera_angle");
            expect(panel).toHaveProperty("dialogue");
            expect(panel).toHaveProperty("sfx");
            expect(panel).toHaveProperty("mood");

            // Check description length (200-400 chars)
            expect(panel.description.length).toBeGreaterThanOrEqual(200);
            expect(panel.description.length).toBeLessThanOrEqual(400);
        }
    }, 60000);

    it("should maintain content proportions", async () => {
        const result = await convertSceneToToonplay({
            scene: mockScene,
            story: mockStory,
            characters: [mockCharacter],
            settings: [mockSetting],
        });

        const totalPanels: number = result.toonplay.panels.length;

        // Count panels with dialogue
        const dialoguePanels: number = result.toonplay.panels.filter(
            (p) => p.dialogue && p.dialogue.length > 0,
        ).length;
        const dialoguePercentage: number = (dialoguePanels / totalPanels) * 100;

        // Count panels with narration
        const narrationPanels: number = result.toonplay.panels.filter(
            (p) => p.narrative,
        ).length;
        const narrationPercentage: number =
            (narrationPanels / totalPanels) * 100;

        // Dialogue should be around 70% (allow 40-90% range)
        expect(dialoguePercentage).toBeGreaterThanOrEqual(40);
        expect(dialoguePercentage).toBeLessThanOrEqual(90);

        // Narration should be minimal (<20%)
        expect(narrationPercentage).toBeLessThanOrEqual(20);
    }, 60000);
});
