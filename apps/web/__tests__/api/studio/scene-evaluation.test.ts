/**
 * Jest Test Suite for /studio/api/scene-evaluation
 *
 * Tests scene quality evaluation update API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-evaluation.test.ts
 */

import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Evaluation API", () => {
    let testStoryId: string;
    let testPartId: string;
    let testChapterId: string;
    let testSceneId: string;

    beforeAll(async () => {
        // Create test story with full generation (includes parts, chapters, scenes)
        const storyResponse = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt: "A test story for scene evaluation testing",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "mysterious",
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

        // Story generation creates parts, chapters, and scenes automatically
        // We need to fetch the first scene to test evaluation updates
        const partsResponse = await fetch(
            `http://localhost:3000/studio/api/parts?storyId=${testStoryId}`,
            {
                headers: { "x-api-key": apiKey },
            },
        );
        const partsData = await partsResponse.json();
        testPartId = partsData.parts?.[0]?.id;

        if (testPartId) {
            const chaptersResponse = await fetch(
                `http://localhost:3000/studio/api/chapters?partId=${testPartId}`,
                {
                    headers: { "x-api-key": apiKey },
                },
            );
            const chaptersData = await chaptersResponse.json();
            testChapterId = chaptersData.chapters?.[0]?.id;

            if (testChapterId) {
                const scenesResponse = await fetch(
                    `http://localhost:3000/studio/api/scenes?chapterId=${testChapterId}`,
                    {
                        headers: { "x-api-key": apiKey },
                    },
                );
                const scenesData = await scenesResponse.json();
                testSceneId = scenesData.scenes?.[0]?.id;
            }
        }

        console.log(`✅ Test scene retrieved: ${testSceneId}`);
    }, 300000); // 5 min for full story generation

    it("should update scene evaluation via POST /studio/api/scene-evaluation", async () => {
        const requestBody = {
            sceneId: testSceneId,
            qualityScore: 3,
            evaluation: {
                plot: 3,
                character: 4,
                pacing: 3,
                prose: 3,
                worldBuilding: 3,
                overallScore: 3.2,
                strengths: ["Strong character development", "Good pacing"],
                improvements: ["Could enhance world-building details"],
            },
        };

        const response = await fetch(
            "http://localhost:3000/studio/api/scene-evaluation",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ API Error:", data);
        }

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.scene).toBeDefined();
        expect(data.scene.id).toBe(testSceneId);
        // Note: qualityScore is not stored in DB schema yet, so we don't check it

        console.log("✅ Scene evaluation updated successfully:");
        console.log(`  Scene ID: ${data.scene.id}`);
    }, 10000);
});
