/**
 * Jest Test Suite for /studio/api/scene-summaries
 *
 * Tests scene summary generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-summaries.test.ts
 */

import type {
    GenerateChaptersRequest,
    GenerateCharactersRequest,
    GeneratePartsRequest,
    GenerateSceneSummariesErrorResponse,
    GenerateSceneSummariesRequest,
    GenerateSceneSummariesResponse,
    GenerateStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Summary API", () => {
    let testStoryId: string = "";
    let testChapterId: string = "";

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create test story (no auto-generation)
        const storyRequestBody: GenerateStoryRequest = {
            userPrompt: "A test story for scene summary testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        const storyResponse: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
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
        const charactersRequestBody: GenerateCharactersRequest = {
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

        // 3. Generate parts
        console.log("🔧 Generating parts for story...");
        const partsRequestBody: GeneratePartsRequest = {
            storyId: testStoryId,
            partsCount: 1,
            language: "English",
        };

        const partsResponse: Response = await fetch(
            "http://localhost:3000/studio/api/parts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(partsRequestBody),
            },
        );

        const partsData: { parts: Array<{ id: string }> } =
            await partsResponse.json();
        if (!partsResponse.ok) {
            throw new Error(
                `Failed to generate parts: ${JSON.stringify(partsData)}`,
            );
        }

        console.log(`✅ Test part created: ${partsData.parts[0].id}`);

        // 4. Generate chapters
        console.log("🔧 Generating chapters...");
        const chaptersRequestBody: GenerateChaptersRequest = {
            storyId: testStoryId,
            chaptersPerPart: 1,
            language: "English",
        };

        const chaptersResponse: Response = await fetch(
            "http://localhost:3000/studio/api/chapters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(chaptersRequestBody),
            },
        );

        const chaptersData: { chapters: Array<{ id: string }> } =
            await chaptersResponse.json();
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

        // 1. Prepare request body with proper TypeScript type
        const requestBody: GenerateSceneSummariesRequest = {
            storyId: testStoryId,
            scenesPerChapter: 3,
            language: "English",
        };

        // 2. Send POST request to scene summaries generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/scene-summaries",
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
            | GenerateSceneSummariesResponse
            | GenerateSceneSummariesErrorResponse = await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Scene Summaries API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error(
                "Expected GenerateSceneSummariesResponse but got error",
            );
        }

        // 7. Cast to success response type
        const successData: GenerateSceneSummariesResponse =
            data as GenerateSceneSummariesResponse;

        // ========================================================================
        // 8. Verify ALL fields of GenerateSceneSummariesResponse
        // ========================================================================

        // 8a. Validate 'success' field (required, must be true)
        expect(successData.success).toBe(true);

        // 8b. Validate 'scenes' field (required, must be array of Scene objects)
        expect(successData).toHaveProperty("scenes");
        expect(Array.isArray(successData.scenes)).toBe(true);
        expect(successData.scenes.length).toBeGreaterThan(0);
        expect(successData.scenes.length).toBe(requestBody.scenesPerChapter); // Should match request

        // 8c. Validate 'metadata' field (required object)
        expect(successData).toHaveProperty("metadata");
        expect(typeof successData.metadata).toBe("object");
        expect(successData.metadata).not.toBeNull();

        // 8d. Validate 'metadata.totalGenerated' (required number)
        expect(successData.metadata).toHaveProperty("totalGenerated");
        expect(typeof successData.metadata.totalGenerated).toBe("number");
        expect(successData.metadata.totalGenerated).toBe(
            successData.scenes.length,
        );

        // 8e. Validate 'metadata.generationTime' (required number, positive)
        expect(successData.metadata).toHaveProperty("generationTime");
        expect(typeof successData.metadata.generationTime).toBe("number");
        expect(successData.metadata.generationTime).toBeGreaterThan(0);

        // 8f. Ensure no extra fields in response (type safety)
        const responseKeys: string[] = Object.keys(successData);
        expect(responseKeys.sort()).toEqual(["metadata", "scenes", "success"]);

        // 8g. Ensure no extra fields in metadata
        const metadataKeys: string[] = Object.keys(successData.metadata);
        expect(metadataKeys.sort()).toEqual([
            "generationTime",
            "totalGenerated",
        ]);

        // ========================================================================
        // 9. Validate ALL fields of Scene objects in the array
        // ========================================================================
        const { scenes }: { scenes: GenerateSceneSummariesResponse["scenes"] } =
            successData;

        for (const scene of scenes) {
            // === IDENTITY ===
            expect(scene).toHaveProperty("id");
            expect(typeof scene.id).toBe("string");
            expect(scene.id).toMatch(/^scene_/);

            expect(scene).toHaveProperty("chapterId");
            expect(typeof scene.chapterId).toBe("string");
            expect(scene.chapterId).toBe(testChapterId);

            expect(scene).toHaveProperty("title");
            expect(typeof scene.title).toBe("string");
            expect(scene.title.length).toBeGreaterThan(0);

            // === SCENE SPECIFICATION (Planning Layer) ===
            expect(scene).toHaveProperty("summary");
            if (scene.summary !== null) {
                expect(typeof scene.summary).toBe("string");
                expect(scene.summary.length).toBeGreaterThan(0);
            }

            // === CYCLE PHASE TRACKING ===
            expect(scene).toHaveProperty("cyclePhase");
            // cyclePhase: 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition' | null

            expect(scene).toHaveProperty("emotionalBeat");
            // emotionalBeat: 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy' | null

            // === PLANNING METADATA (Guides Content Generation) ===
            expect(scene).toHaveProperty("characterFocus");
            expect(Array.isArray(scene.characterFocus)).toBe(true);

            expect(scene).toHaveProperty("settingId");
            // settingId is nullable

            expect(scene).toHaveProperty("sensoryAnchors");
            expect(Array.isArray(scene.sensoryAnchors)).toBe(true);

            expect(scene).toHaveProperty("dialogueVsDescription");
            // dialogueVsDescription is nullable

            expect(scene).toHaveProperty("suggestedLength");
            // suggestedLength: 'short' | 'medium' | 'long' | null

            // === GENERATED PROSE (Execution Layer) ===
            expect(scene).toHaveProperty("content");
            expect(typeof scene.content).toBe("string");
            // content should be empty string for new scene summaries

            // === VISUAL ===
            expect(scene).toHaveProperty("imageUrl");
            expect(scene.imageUrl).toBeNull(); // Should be null for new scenes

            expect(scene).toHaveProperty("imageVariants");
            expect(scene.imageVariants).toBeNull(); // Should be null for new scenes

            // === PUBLISHING (Novel Format) ===
            expect(scene).toHaveProperty("visibility");
            expect(typeof scene.visibility).toBe("string");
            // visibility: 'public' | 'private'

            expect(scene).toHaveProperty("publishedAt");
            // publishedAt is nullable timestamp

            expect(scene).toHaveProperty("publishedBy");
            // publishedBy is nullable

            expect(scene).toHaveProperty("unpublishedAt");
            // unpublishedAt is nullable timestamp

            expect(scene).toHaveProperty("unpublishedBy");
            // unpublishedBy is nullable

            expect(scene).toHaveProperty("scheduledFor");
            // scheduledFor is nullable timestamp

            expect(scene).toHaveProperty("autoPublish");
            expect(typeof scene.autoPublish).toBe("boolean");

            // === COMIC FORMAT ===
            expect(scene).toHaveProperty("comicStatus");
            expect(typeof scene.comicStatus).toBe("string");
            // comicStatus: 'none' | 'generating' | 'published' | 'unpublished'

            expect(scene).toHaveProperty("comicPublishedAt");
            // comicPublishedAt is nullable timestamp

            expect(scene).toHaveProperty("comicPublishedBy");
            // comicPublishedBy is nullable

            expect(scene).toHaveProperty("comicUnpublishedAt");
            // comicUnpublishedAt is nullable timestamp

            expect(scene).toHaveProperty("comicUnpublishedBy");
            // comicUnpublishedBy is nullable

            expect(scene).toHaveProperty("comicGeneratedAt");
            // comicGeneratedAt is nullable timestamp

            expect(scene).toHaveProperty("comicPanelCount");
            expect(typeof scene.comicPanelCount).toBe("number");

            expect(scene).toHaveProperty("comicVersion");
            expect(typeof scene.comicVersion).toBe("number");

            // === ANALYTICS ===
            expect(scene).toHaveProperty("viewCount");
            expect(typeof scene.viewCount).toBe("number");

            expect(scene).toHaveProperty("uniqueViewCount");
            expect(typeof scene.uniqueViewCount).toBe("number");

            expect(scene).toHaveProperty("novelViewCount");
            expect(typeof scene.novelViewCount).toBe("number");

            expect(scene).toHaveProperty("novelUniqueViewCount");
            expect(typeof scene.novelUniqueViewCount).toBe("number");

            expect(scene).toHaveProperty("comicViewCount");
            expect(typeof scene.comicViewCount).toBe("number");

            expect(scene).toHaveProperty("comicUniqueViewCount");
            expect(typeof scene.comicUniqueViewCount).toBe("number");

            expect(scene).toHaveProperty("lastViewedAt");
            // lastViewedAt is nullable timestamp

            // === ORDERING ===
            expect(scene).toHaveProperty("orderIndex");
            expect(typeof scene.orderIndex).toBe("number");
            expect(scene.orderIndex).toBeGreaterThan(0);

            // === METADATA ===
            expect(scene).toHaveProperty("createdAt");
            expect(typeof scene.createdAt).toBe("string");

            expect(scene).toHaveProperty("updatedAt");
            expect(typeof scene.updatedAt).toBe("string");
        }

        // 10. Verify metadata
        const {
            metadata,
        }: { metadata: GenerateSceneSummariesResponse["metadata"] } =
            successData;
        expect(metadata.totalGenerated).toBeGreaterThan(0);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // 11. Log success details
        console.log("✅ Scene summaries generated successfully:");
        console.log(`  Total scenes: ${scenes.length}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);

        // Log each scene
        for (const scene of scenes) {
            console.log(`  - ${scene.title} (${scene.id})`);
            console.log(`    Chapter ID: ${scene.chapterId}`);
            console.log(`    Order: ${scene.orderIndex}`);
            console.log(`    Summary: ${scene.summary?.substring(0, 80)}...`);
        }
    }, 120000); // 2 min timeout for scene generation
});
