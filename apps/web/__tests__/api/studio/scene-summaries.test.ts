/**
 * Jest Test Suite for /studio/api/scene-summaries
 *
 * Tests scene summary generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-summaries.test.ts
 */

import type { GenerateSceneSummariesResponse } from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Summary API", () => {
    let testStoryId: string;
    let testChapterId: string;

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create test story (no auto-generation)
        const storyResponse = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt: "A test story for scene summary testing",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "adventurous",
                }),
            },
        );

        const storyData = await storyResponse.json();
        if (!storyResponse.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(storyData)}`,
            );
        }

        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // 2. Generate characters
        console.log("🔧 Generating characters...");
        const charactersResponse = await fetch(
            "http://localhost:3000/studio/api/characters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    storyId: testStoryId,
                    characterCount: 2,
                    language: "English",
                }),
            },
        );

        const charactersData = await charactersResponse.json();
        if (!charactersResponse.ok) {
            throw new Error(
                `Failed to generate characters: ${JSON.stringify(charactersData)}`,
            );
        }
        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );

        // 3. Generate parts
        console.log("🔧 Generating parts for story...");
        const partsResponse = await fetch(
            "http://localhost:3000/studio/api/parts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    storyId: testStoryId,
                    partCount: 1,
                    language: "English",
                }),
            },
        );

        const partsData = await partsResponse.json();
        if (!partsResponse.ok) {
            throw new Error(
                `Failed to generate parts: ${JSON.stringify(partsData)}`,
            );
        }

        console.log(`✅ Test part created: ${partsData.parts[0].id}`);

        // 4. Generate chapters
        console.log("🔧 Generating chapters...");
        const chaptersResponse = await fetch(
            "http://localhost:3000/studio/api/chapters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    storyId: testStoryId,
                    chaptersPerPart: 1,
                    language: "English",
                }),
            },
        );

        const chaptersData = await chaptersResponse.json();
        if (!chaptersResponse.ok) {
            throw new Error(
                `Failed to generate chapters: ${JSON.stringify(chaptersData)}`,
            );
        }

        testChapterId = chaptersData.chapters[0].id;
        console.log(`✅ Test chapter created: ${testChapterId}`);
    }, 300000); // 5 min for full story generation

    it("should generate scene summaries via POST /studio/api/scene-summaries", async () => {
        console.log("🔧 Generating scene summaries...");

        const scenesPerChapter: number = 3;

        const response: Response = await fetch(
            "http://localhost:3000/studio/api/scene-summaries",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    storyId: testStoryId,
                    scenesPerChapter: scenesPerChapter,
                    language: "English",
                }),
            },
        );

        const data: GenerateSceneSummariesResponse = await response.json();

        if (!response.ok) {
            console.error("❌ API Error:", data);
        }

        // Validate response status and structure
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);

        // Validate scenes array
        expect(data.scenes).toBeDefined();
        expect(Array.isArray(data.scenes)).toBe(true);
        expect(data.scenes.length).toBeGreaterThan(0);

        // Validate metadata
        expect(data.metadata).toBeDefined();
        expect(data.metadata.totalGenerated).toBe(data.scenes.length);
        expect(typeof data.metadata.generationTime).toBe("number");
        expect(data.metadata.generationTime).toBeGreaterThan(0);

        // Validate each scene has all required attributes
        for (const scene of data.scenes) {
            // Identity fields
            expect(scene.id).toBeDefined();
            expect(typeof scene.id).toBe("string");
            expect(scene.id).toMatch(/^scene_/);

            expect(scene.chapterId).toBeDefined();
            expect(typeof scene.chapterId).toBe("string");
            expect(scene.chapterId).toBe(testChapterId);

            expect(scene.title).toBeDefined();
            expect(typeof scene.title).toBe("string");
            expect(scene.title.length).toBeGreaterThan(0);

            // Scene specification
            expect(scene.summary).toBeDefined();
            expect(scene.summary).not.toBeNull();
            expect(typeof scene.summary).toBe("string");
            if (scene.summary) {
                expect(scene.summary.length).toBeGreaterThan(0);
            }

            // Content (should be null for scene summaries, not yet generated)
            expect(scene.content).toBeDefined();

            // Images (should be null for new scenes)
            expect(scene.imageUrl).toBeNull();
            expect(scene.imageVariants).toBeNull();

            // Order index
            expect(scene.orderIndex).toBeDefined();
            expect(typeof scene.orderIndex).toBe("number");
            expect(scene.orderIndex).toBeGreaterThan(0);

            // Timestamps
            expect(scene.createdAt).toBeDefined();
            expect(typeof scene.createdAt).toBe("string");

            expect(scene.updatedAt).toBeDefined();
            expect(typeof scene.updatedAt).toBe("string");
        }

        console.log("✅ Scene summaries generated successfully:");
        console.log(`  Total scenes: ${data.scenes.length}`);
        console.log(`  Generation time: ${data.metadata.generationTime}ms`);

        // Log each scene
        for (const scene of data.scenes) {
            console.log(`  - ${scene.title} (${scene.id})`);
            console.log(`    Chapter ID: ${scene.chapterId}`);
            console.log(`    Order: ${scene.orderIndex}`);
            console.log(`    Summary: ${scene.summary?.substring(0, 80)}...`);
        }
    }, 120000); // 2 min timeout for scene generation
});
