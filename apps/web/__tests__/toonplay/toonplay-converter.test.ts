/**
 * Toonplay Converter Tests
 *
 * Tests for scene-to-toonplay conversion
 */

import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import type { Character, Scene, Setting, Story } from "@/lib/schemas/database";
import { convertSceneToToonplay } from "@/lib/studio/generators/toonplay-converter";
import { auth } from "@/lib/auth/context";

describe("Toonplay Converter", () => {
    // Load API key from .auth/user.json
    const authFilePath = path.join(process.cwd(), ".auth/user.json");
    const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));
    const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
    const writerApiKey = authData[environment].profiles.writer.apiKey;

    // Setup authentication context before all tests
    beforeAll(() => {
        // Set API key in authentication context
        auth.apiKey = writerApiKey;
    });
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
    } as Character;

    const mockSetting: Setting = {
        id: "setting-1",
        storyId: "story-1",
        name: "Test Castle",
        description: "A grand medieval castle",
        atmosphere: "mysterious and imposing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Setting;

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
    } as Scene;

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
