/**
 * Jest Test Suite for /studio/api/chapter (Singular - Extreme Incremental)
 *
 * Tests singular chapter generation API endpoint.
 *
 * Prerequisites:
 * - Requires a story with characters and at least one part
 * - Uses writer API key with stories:write scope
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/chapter.test.ts
 */

import type {
    ApiChapterErrorResponse,
    ApiChapterRequest,
    ApiChapterResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiPartRequest,
    ApiPartResponse,
    ApiSettingsRequest,
    ApiSettingsResponse,
    ApiStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Chapter API (Singular - Extreme Incremental)", () => {
    let testStoryId: string = "";
    let testPartId: string = "";

    // Setup: Create a test story, characters, and part first
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create story
        const storyRequestBody: ApiStoryRequest = {
            userPrompt:
                "A short fantasy adventure for testing singular chapter generation",
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

        // 4. Generate part (required for chapter generation)
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

        testPartId = partData.part.id;
        console.log(`✅ Part generated: ${testPartId}`);
    }, 300000); // 5 minute timeout for full setup

    it("should generate first chapter via POST /studio/api/chapter", async () => {
        // 1. Prepare request body
        const requestBody: ApiChapterRequest = {
            storyId: testStoryId,
            partId: testPartId,
        };

        // 2. Send POST request
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/chapter",
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
        const data: ApiChapterResponse | ApiChapterErrorResponse =
            await response.json();

        if (!response.ok) {
            console.error("❌ Chapter API Error:", data);
            expect(response.ok).toBe(true);
        }

        expect(response.status).toBe(201);

        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiChapterResponse but got error");
        }

        const successData: ApiChapterResponse = data as ApiChapterResponse;

        // 4. Verify chapter attributes
        const { chapter, metadata } = successData;

        expect(chapter.id).toMatch(/^chapter_/);
        expect(chapter.storyId).toBe(testStoryId);
        expect(chapter.partId).toBe(testPartId);
        expect(chapter.title).toBeDefined();
        expect(typeof chapter.title).toBe("string");

        // 5. Verify metadata
        expect(metadata.chapterIndex).toBe(0); // First chapter (global index)
        expect(metadata.totalChapters).toBe(1); // Total chapters in story
        expect(metadata.generationTime).toBeGreaterThan(0);

        console.log("✅ Chapter generated successfully:");
        console.log(`  Title: ${chapter.title}`);
        console.log(`  ID: ${chapter.id}`);
        console.log(`  Chapter index: ${metadata.chapterIndex}`);
        console.log(`  Total chapters: ${metadata.totalChapters}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 180000);

    it("should generate second chapter with context via POST /studio/api/chapter", async () => {
        // 1. Prepare request body
        const requestBody: ApiChapterRequest = {
            storyId: testStoryId,
            partId: testPartId,
        };

        // 2. Send POST request
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/chapter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        const data: ApiChapterResponse | ApiChapterErrorResponse =
            await response.json();

        if (!response.ok) {
            console.error("❌ Second Chapter API Error:", data);
            expect(response.ok).toBe(true);
        }

        expect(response.status).toBe(201);

        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiChapterResponse but got error");
        }

        const successData: ApiChapterResponse = data as ApiChapterResponse;

        // 3. Verify second chapter
        const { chapter, metadata } = successData;

        expect(chapter.id).toMatch(/^chapter_/);
        expect(chapter.storyId).toBe(testStoryId);
        expect(chapter.partId).toBe(testPartId);

        // 4. Verify metadata shows context awareness
        expect(metadata.chapterIndex).toBe(1); // Second chapter (global index)
        expect(metadata.totalChapters).toBe(2); // Total chapters in story

        console.log("✅ Second chapter generated successfully with context:");
        console.log(`  Title: ${chapter.title}`);
        console.log(`  ID: ${chapter.id}`);
        console.log(`  Chapter index: ${metadata.chapterIndex}`);
        console.log(`  Total chapters: ${metadata.totalChapters}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 180000);
});
