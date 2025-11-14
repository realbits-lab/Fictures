/**
 * Jest Test Suite for /studio/api/scene-summary (Singular - Extreme Incremental)
 *
 * Tests singular scene summary generation API endpoint.
 *
 * Prerequisites:
 * - Requires a story with characters, part, and chapter
 * - Uses writer API key with stories:write scope
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-summary.test.ts
 */

import type {
    ApiChapterRequest,
    ApiChapterResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiPartRequest,
    ApiPartResponse,
    ApiSceneSummaryErrorResponse,
    ApiSceneSummaryRequest,
    ApiSceneSummaryResponse,
    ApiSettingsRequest,
    ApiSettingsResponse,
    ApiStoryRequest,
} from "@/app/api/studio/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Summary API (Singular - Extreme Incremental)", () => {
    let testStoryId: string = "";
    let testChapterId: string = "";

    // Setup: Create a test story, characters, part, and chapter first
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create story
        const storyRequestBody: ApiStoryRequest = {
            userPrompt:
                "A short fantasy adventure for testing singular scene summary generation",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        const storyResponse: Response = await fetch(
            "http://localhost:3000/studio/api/story",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(storyRequestBody),
            },
        );

        const storyData: { story: { id: string } } = await storyResponse.json();

        if (!storyResponse.ok) {
            console.error("❌ Failed to create test story:", storyData);
            throw new Error("Test setup failed: could not create story");
        }

        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // 2. Generate characters
        console.log("🔧 Generating characters...");
        const charactersRequestBody: ApiCharactersRequest = {
            storyId: testStoryId,
            characterCount: 2,
            language: "English",
        };

        const charactersResponse: Response = await fetch(
            "http://localhost:3000/studio/api/characters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(charactersRequestBody),
            },
        );

        const charactersData: ApiCharactersResponse =
            await charactersResponse.json();
        if (!charactersResponse.ok) {
            console.error("❌ Failed to generate characters:", charactersData);
            throw new Error("Test setup failed: could not generate characters");
        }

        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );

        // 3. Generate settings (required for part generation)
        console.log("🔧 Generating settings...");
        const settingsRequestBody: ApiSettingsRequest = {
            storyId: testStoryId,
            settingCount: 2,
        };

        const settingsResponse: Response = await fetch(
            "http://localhost:3000/studio/api/settings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(settingsRequestBody),
            },
        );

        const settingsData: ApiSettingsResponse = await settingsResponse.json();
        if (!settingsResponse.ok) {
            console.error("❌ Failed to generate settings:", settingsData);
            throw new Error("Test setup failed: could not generate settings");
        }

        console.log(`✅ Settings generated: ${settingsData.settings.length}`);

        // 4. Generate part
        console.log("🔧 Generating part...");
        const partRequestBody: ApiPartRequest = {
            storyId: testStoryId,
        };

        const partResponse: Response = await fetch(
            "http://localhost:3000/studio/api/part",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(partRequestBody),
            },
        );

        const partData: ApiPartResponse = await partResponse.json();
        if (!partResponse.ok) {
            console.error("❌ Failed to generate part:", partData);
            throw new Error("Test setup failed: could not generate part");
        }

        const testPartId = partData.part.id;
        console.log(`✅ Part generated: ${testPartId}`);

        // 4. Generate chapter (required for scene summary generation)
        console.log("🔧 Generating chapter...");
        const chapterRequestBody: ApiChapterRequest = {
            storyId: testStoryId,
            partId: testPartId,
        };

        const chapterResponse: Response = await fetch(
            "http://localhost:3000/studio/api/chapter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(chapterRequestBody),
            },
        );

        const chapterData: ApiChapterResponse = await chapterResponse.json();
        if (!chapterResponse.ok) {
            console.error("❌ Failed to generate chapter:", chapterData);
            throw new Error("Test setup failed: could not generate chapter");
        }

        testChapterId = chapterData.chapter.id;
        console.log(`✅ Chapter generated: ${testChapterId}`);
    }, 420000); // 7 minute timeout for full setup

    it("should generate first scene summary via POST /studio/api/scene-summary", async () => {
        // 1. Prepare request body
        const requestBody: ApiSceneSummaryRequest = {
            storyId: testStoryId,
            chapterId: testChapterId,
        };

        // 2. Send POST request
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/scene-summary",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        // 3. Parse response
        const data: ApiSceneSummaryResponse | ApiSceneSummaryErrorResponse =
            await response.json();

        if (!response.ok) {
            console.error("❌ Scene Summary API Error:", data);
            expect(response.ok).toBe(true);
        }

        expect(response.status).toBe(201);

        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiSceneSummaryResponse but got error");
        }

        const successData: ApiSceneSummaryResponse =
            data as ApiSceneSummaryResponse;

        // 4. Verify scene attributes
        const { scene, metadata } = successData;

        expect(scene.id).toMatch(/^scene_/);
        expect(scene.chapterId).toBe(testChapterId);
        expect(scene.title).toBeDefined();
        expect(typeof scene.title).toBe("string");

        // Verify cycle phase and emotional beat
        expect(scene.cyclePhase).toBeDefined();
        expect(scene.emotionalBeat).toBeDefined();

        // 5. Verify metadata
        expect(metadata.sceneIndex).toBe(0); // First scene (global index)
        expect(metadata.totalScenes).toBe(1); // Total scenes in story
        expect(metadata.generationTime).toBeGreaterThan(0);

        console.log("✅ Scene summary generated successfully:");
        console.log(`  Title: ${scene.title}`);
        console.log(`  ID: ${scene.id}`);
        console.log(`  Cycle phase: ${scene.cyclePhase}`);
        console.log(`  Emotional beat: ${scene.emotionalBeat}`);
        console.log(`  Scene index: ${metadata.sceneIndex}`);
        console.log(`  Total scenes: ${metadata.totalScenes}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 180000);

    it("should generate second scene with context via POST /studio/api/scene-summary", async () => {
        // 1. Prepare request body
        const requestBody: ApiSceneSummaryRequest = {
            storyId: testStoryId,
            chapterId: testChapterId,
        };

        // 2. Send POST request
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/scene-summary",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        const data: ApiSceneSummaryResponse | ApiSceneSummaryErrorResponse =
            await response.json();

        if (!response.ok) {
            console.error("❌ Second Scene Summary API Error:", data);
            expect(response.ok).toBe(true);
        }

        expect(response.status).toBe(201);

        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiSceneSummaryResponse but got error");
        }

        const successData: ApiSceneSummaryResponse =
            data as ApiSceneSummaryResponse;

        // 3. Verify second scene
        const { scene, metadata } = successData;

        expect(scene.id).toMatch(/^scene_/);
        expect(scene.chapterId).toBe(testChapterId);

        // 4. Verify metadata shows context awareness
        expect(metadata.sceneIndex).toBe(1); // Second scene (global index)
        expect(metadata.totalScenes).toBe(2); // Total scenes in story

        console.log(
            "✅ Second scene summary generated successfully with context:",
        );
        console.log(`  Title: ${scene.title}`);
        console.log(`  ID: ${scene.id}`);
        console.log(`  Cycle phase: ${scene.cyclePhase}`);
        console.log(`  Scene index: ${metadata.sceneIndex}`);
        console.log(`  Total scenes: ${metadata.totalScenes}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 180000);
});
