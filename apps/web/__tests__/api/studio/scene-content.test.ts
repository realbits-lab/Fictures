/**
 * Jest Test Suite for /studio/api/scene-content
 *
 * Tests scene content generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-content.test.ts
 */

import type {
    ApiChapterRequest,
    ApiChapterResponse,
    ApiCharactersRequest,
    ApiPartRequest,
    ApiPartResponse,
    ApiSceneContentErrorResponse,
    ApiSceneContentRequest,
    ApiSceneContentResponse,
    ApiSceneSummaryRequest,
    ApiSceneSummaryResponse,
    ApiSettingsRequest,
    ApiStoryRequest,
} from "@/lib/schemas/api/studio";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Content API", () => {
    let testStoryId: string = "";
    let testSceneId: string = "";

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create test story
        const storyRequestBody: ApiStoryRequest = {
            userPrompt: "A test story for scene content testing",
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
            throw new Error(
                `Failed to create test story: ${JSON.stringify(storyData)}`,
            );
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

        const charactersData: { characters: Array<{ id: string }> } =
            await charactersResponse.json();
        if (!charactersResponse.ok) {
            throw new Error(
                `Failed to generate characters: ${JSON.stringify(charactersData)}`,
            );
        }
        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );

        // 3. Generate settings (required for parts generation)
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

        const settingsData: { settings: Array<{ id: string }> } =
            await settingsResponse.json();
        if (!settingsResponse.ok) {
            throw new Error(
                `Failed to generate settings: ${JSON.stringify(settingsData)}`,
            );
        }
        console.log(`✅ Settings generated: ${settingsData.settings.length}`);

        // 4. Generate part (singular)
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
            throw new Error(
                `Failed to generate part: ${JSON.stringify(partData)}`,
            );
        }
        const testPartId = partData.part.id;
        console.log(`✅ Test part created: ${testPartId}`);

        // 5. Generate chapter (singular)
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
            throw new Error(
                `Failed to generate chapter: ${JSON.stringify(chapterData)}`,
            );
        }
        const testChapterId = chapterData.chapter.id;
        console.log(`✅ Test chapter created: ${testChapterId}`);

        // 6. Generate scene summary (singular)
        console.log("🔧 Generating scene summary...");
        const sceneSummaryRequestBody: ApiSceneSummaryRequest = {
            storyId: testStoryId,
            chapterId: testChapterId,
        };

        const sceneSummaryResponse: Response = await fetch(
            "http://localhost:3000/studio/api/scene-summary",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(sceneSummaryRequestBody),
            },
        );

        const sceneSummaryData: ApiSceneSummaryResponse =
            await sceneSummaryResponse.json();
        if (!sceneSummaryResponse.ok) {
            throw new Error(
                `Failed to generate scene summary: ${JSON.stringify(sceneSummaryData)}`,
            );
        }

        testSceneId = sceneSummaryData.scene.id;
        console.log(`✅ Test scene created: ${testSceneId}`);
    }, 300000); // 5 min for full story generation

    it("should generate scene content via POST /studio/api/scene-content", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: ApiSceneContentRequest = {
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
        const data: ApiSceneContentResponse | ApiSceneContentErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Scene Content API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(200);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiSceneContentResponse but got error");
        }

        // 7. Cast to success response type
        const successData: ApiSceneContentResponse =
            data as ApiSceneContentResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.scene).toBeDefined();

        // ============================================================================
        // 9. Verify ALL scene attributes
        // ============================================================================
        const { scene } = successData;

        // === IDENTITY ===
        expect(scene.id).toBe(testSceneId);
        expect(scene.chapterId).toBeDefined();
        expect(typeof scene.chapterId).toBe("string");
        expect(scene.title).toBeDefined();
        expect(typeof scene.title).toBe("string");
        expect(scene.title.length).toBeGreaterThan(0);

        // === SCENE SPECIFICATION (Planning Layer) ===
        expect(
            scene.summary === null || typeof scene.summary === "string",
        ).toBe(true);

        // === CYCLE PHASE TRACKING ===
        expect(
            scene.cyclePhase === null ||
                [
                    "setup",
                    "confrontation",
                    "virtue",
                    "consequence",
                    "transition",
                ].includes(scene.cyclePhase),
        ).toBe(true);

        expect(
            scene.emotionalBeat === null ||
                [
                    "fear",
                    "hope",
                    "tension",
                    "relief",
                    "elevation",
                    "catharsis",
                    "despair",
                    "joy",
                ].includes(scene.emotionalBeat),
        ).toBe(true);

        // === PLANNING METADATA (Guides Content Generation) ===
        expect(
            scene.characterFocus === null ||
                Array.isArray(scene.characterFocus),
        ).toBe(true);

        expect(
            scene.settingId === null || typeof scene.settingId === "string",
        ).toBe(true);

        expect(
            scene.sensoryAnchors === null ||
                Array.isArray(scene.sensoryAnchors),
        ).toBe(true);

        expect(
            scene.dialogueVsDescription === null ||
                typeof scene.dialogueVsDescription === "string",
        ).toBe(true);

        expect(
            scene.suggestedLength === null ||
                ["short", "medium", "long"].includes(scene.suggestedLength),
        ).toBe(true);

        // === GENERATED PROSE (Execution Layer) ===
        expect(scene.content).toBeDefined();
        expect(scene.content).not.toBeNull();
        if (scene.content) {
            expect(typeof scene.content).toBe("string");
            expect(scene.content.length).toBeGreaterThan(0);
        }

        // === VISUAL ===
        expect(
            scene.imageUrl === null || typeof scene.imageUrl === "string",
        ).toBe(true);

        expect(
            scene.imageVariants === null ||
                typeof scene.imageVariants === "object",
        ).toBe(true);

        // === PUBLISHING (Novel Format) ===
        expect(scene.visibility).toBeDefined();
        expect(
            ["private", "public", "unlisted"].includes(scene.visibility),
        ).toBe(true);

        expect(
            scene.publishedAt === null || typeof scene.publishedAt === "string",
        ).toBe(true);

        expect(
            scene.publishedBy === null || typeof scene.publishedBy === "string",
        ).toBe(true);

        expect(
            scene.unpublishedAt === null ||
                typeof scene.unpublishedAt === "string",
        ).toBe(true);

        expect(
            scene.unpublishedBy === null ||
                typeof scene.unpublishedBy === "string",
        ).toBe(true);

        expect(
            scene.scheduledFor === null ||
                typeof scene.scheduledFor === "string",
        ).toBe(true);

        expect(typeof scene.autoPublish).toBe("boolean");

        // === COMIC FORMAT ===
        expect(scene.comicStatus).toBeDefined();
        expect(
            ["none", "pending", "generating", "ready", "published"].includes(
                scene.comicStatus,
            ),
        ).toBe(true);

        expect(
            scene.comicPublishedAt === null ||
                typeof scene.comicPublishedAt === "string",
        ).toBe(true);

        expect(
            scene.comicPublishedBy === null ||
                typeof scene.comicPublishedBy === "string",
        ).toBe(true);

        expect(
            scene.comicUnpublishedAt === null ||
                typeof scene.comicUnpublishedAt === "string",
        ).toBe(true);

        expect(
            scene.comicUnpublishedBy === null ||
                typeof scene.comicUnpublishedBy === "string",
        ).toBe(true);

        expect(
            scene.comicGeneratedAt === null ||
                typeof scene.comicGeneratedAt === "string",
        ).toBe(true);

        expect(typeof scene.comicPanelCount).toBe("number");
        expect(scene.comicPanelCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.comicVersion).toBe("number");
        expect(scene.comicVersion).toBeGreaterThan(0);

        // === ANALYTICS ===
        expect(typeof scene.viewCount).toBe("number");
        expect(scene.viewCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.uniqueViewCount).toBe("number");
        expect(scene.uniqueViewCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.novelViewCount).toBe("number");
        expect(scene.novelViewCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.novelUniqueViewCount).toBe("number");
        expect(scene.novelUniqueViewCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.comicViewCount).toBe("number");
        expect(scene.comicViewCount).toBeGreaterThanOrEqual(0);

        expect(typeof scene.comicUniqueViewCount).toBe("number");
        expect(scene.comicUniqueViewCount).toBeGreaterThanOrEqual(0);

        expect(
            scene.lastViewedAt === null ||
                typeof scene.lastViewedAt === "string",
        ).toBe(true);

        // === ORDERING ===
        expect(scene.orderIndex).toBeDefined();
        expect(typeof scene.orderIndex).toBe("number");
        expect(scene.orderIndex).toBeGreaterThan(0);

        // === METADATA FIELDS ===
        expect(scene.createdAt).toBeDefined();
        expect(typeof scene.createdAt).toBe("string");

        expect(scene.updatedAt).toBeDefined();
        expect(typeof scene.updatedAt).toBe("string");

        // 10. Verify metadata
        expect(successData.metadata).toBeDefined();
        expect(successData.metadata.wordCount).toBeGreaterThan(0);
        expect(successData.metadata.generationTime).toBeGreaterThan(0);

        // 11. Log success details
        console.log("✅ Scene content generated successfully:");
        console.log(`  Scene ID: ${scene.id}`);
        console.log(`  Title: ${scene.title}`);
        console.log(`  Chapter ID: ${scene.chapterId}`);
        if (scene.content) {
            console.log(`  Content length: ${scene.content.length} characters`);
            console.log(
                `  Content preview: ${scene.content.substring(0, 100)}...`,
            );
        }
        console.log(`  Word count: ${successData.metadata.wordCount}`);
        console.log(
            `  Generation time: ${successData.metadata.generationTime}ms`,
        );
        console.log(`  Cycle phase: ${scene.cyclePhase || "N/A"}`);
        console.log(`  Emotional beat: ${scene.emotionalBeat || "N/A"}`);
    }, 1200000); // 20 minute timeout for AI content generation
});
