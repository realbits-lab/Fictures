/**
 * Jest Test Suite for /studio/api/scene-content
 *
 * Tests scene content generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-content.test.ts
 */

import type {
    GenerateSceneContentErrorResponse,
    GenerateSceneContentRequest,
    GenerateSceneContentResponse,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Content API", () => {
    let testStoryId: string = "";
    let testPartId: string = "";
    let testChapterId: string = "";
    let testSceneId: string = "";

    beforeAll(async () => {
        // Create test story with full generation (includes parts, chapters, scenes)
        const storyResponse: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt: "A test story for scene content testing",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "epic",
                }),
            },
        );

        const storyData: { story: { id: string } } = await storyResponse.json();
        if (!storyResponse.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(storyData)}`,
            );
        }

        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // Story generation creates parts, chapters, and scenes automatically
        // We need to fetch the first scene to test content updates
        const partsResponse: Response = await fetch(
            `http://localhost:3000/studio/api/parts?storyId=${testStoryId}`,
            {
                headers: { "x-api-key": apiKey },
            },
        );
        const partsData: { parts?: Array<{ id: string }> } =
            await partsResponse.json();
        testPartId = partsData.parts?.[0]?.id || "";

        if (testPartId) {
            const chaptersResponse: Response = await fetch(
                `http://localhost:3000/studio/api/chapters?partId=${testPartId}`,
                {
                    headers: { "x-api-key": apiKey },
                },
            );
            const chaptersData: { chapters?: Array<{ id: string }> } =
                await chaptersResponse.json();
            testChapterId = chaptersData.chapters?.[0]?.id || "";

            if (testChapterId) {
                const scenesResponse: Response = await fetch(
                    `http://localhost:3000/studio/api/scenes?chapterId=${testChapterId}`,
                    {
                        headers: { "x-api-key": apiKey },
                    },
                );
                const scenesData: { scenes?: Array<{ id: string }> } =
                    await scenesResponse.json();
                testSceneId = scenesData.scenes?.[0]?.id || "";
            }
        }

        console.log(`✅ Test scene retrieved: ${testSceneId}`);
    }, 300000); // 5 min for full story generation

    it("should generate scene content via POST /studio/api/scene-content", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: GenerateSceneContentRequest = {
            sceneId: testSceneId,
            language: "English",
        };

        // 2. Send POST request to scene content generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/scene-content",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        // 3. Parse response data with proper typing
        const data:
            | GenerateSceneContentResponse
            | GenerateSceneContentErrorResponse = await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Scene Content API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(200);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error(
                "Expected GenerateSceneContentResponse but got error",
            );
        }

        // 7. Cast to success response type
        const successData: GenerateSceneContentResponse =
            data as GenerateSceneContentResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.scene).toBeDefined();
        expect(successData.scene.id).toBe(testSceneId);
        expect(successData.scene.content).toBeDefined();
        expect(successData.scene.content).not.toBeNull();
        if (successData.scene.content) {
            expect(successData.scene.content.length).toBeGreaterThan(0);
        }

        // 9. Verify metadata
        expect(successData.metadata).toBeDefined();
        expect(successData.metadata.wordCount).toBeGreaterThan(0);
        expect(successData.metadata.generationTime).toBeGreaterThan(0);

        // 10. Log success details
        console.log("✅ Scene content generated successfully:");
        console.log(`  Scene ID: ${successData.scene.id}`);
        if (successData.scene.content) {
            console.log(
                `  Content length: ${successData.scene.content.length} characters`,
            );
        }
        console.log(`  Word count: ${successData.metadata.wordCount}`);
        console.log(
            `  Generation time: ${successData.metadata.generationTime}ms`,
        );
    }, 120000); // 2 minute timeout for AI content generation
});
