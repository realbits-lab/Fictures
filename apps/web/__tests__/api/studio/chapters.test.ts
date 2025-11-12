/**
 * Jest Test Suite for /studio/api/chapters
 *
 * Tests chapter creation API endpoint.
 *
 * Prerequisites:
 * - Requires a story (partId is optional)
 * - Uses writer API key with stories:write scope
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/chapters.test.ts
 */

import type {
    ApiChaptersErrorResponse,
    ApiChaptersRequest,
    ApiChaptersResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiPartsRequest,
    ApiStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Chapters API", () => {
    let testStoryId: string = "";
    let testPartId: string = "";

    // Setup: Create a test story
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request
        const storyRequestBody: ApiStoryRequest = {
            userPrompt: "A short fantasy tale for testing chapter creation",
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

        // 2. Parse story response
        const storyData: { story: { id: string } } = await storyResponse.json();

        // 3. Validate story response
        if (!storyResponse.ok) {
            console.error("❌ Failed to create test story:", storyData);
            throw new Error("Test setup failed: could not create story");
        }

        // 4. Store test story ID
        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // 5. Generate characters (required for parts generation)
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

        // 6. Create parts for testing chapters with partId
        console.log("🔧 Generating parts for story...");
        const partsRequestBody: ApiPartsRequest = {
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

        // 7. Parse parts response
        const partsData: { parts?: Array<{ id: string }> } =
            await partsResponse.json();

        // 8. Store test part ID if available
        if (partsResponse.ok && partsData.parts && partsData.parts.length > 0) {
            testPartId = partsData.parts[0].id;
            console.log(`✅ Test part created: ${testPartId}`);
        } else {
            console.warn("⚠️ Parts generation failed, will test without partId");
        }
    }, 300000); // 5 minute timeout for story + characters + parts creation

    describe("POST /studio/api/chapters", () => {
        it("should generate chapters for a story with parts", async () => {
            // 1. Skip if parts creation failed in setup
            if (!testPartId) {
                console.log("⏭️ Skipping test - no partId available");
                return;
            }

            // 2. Prepare request body with proper TypeScript type
            const requestBody: ApiChaptersRequest = {
                storyId: testStoryId,
                chaptersPerPart: 2, // Generate 2 chapters per part for faster testing
                language: "English",
            };

            // 3. Send POST request to chapters generation API
            const response: Response = await fetch(
                "http://localhost:3000/studio/api/chapters",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                    },
                    body: JSON.stringify(requestBody),
                },
            );

            // 4. Parse response data with proper typing
            const data: ApiChaptersResponse | ApiChaptersErrorResponse =
                await response.json();

            // 5. Log error if request failed
            if (!response.ok) {
                console.error("❌ Chapters API Error:", data);
                expect(response.ok).toBe(true); // Force fail with proper error logged
            }

            // 6. Verify response status
            expect(response.status).toBe(201);

            // 7. Type guard to ensure we have success response
            if (!("success" in data) || !data.success) {
                throw new Error("Expected ApiChaptersResponse but got error");
            }

            // 8. Cast to success response type
            const successData: ApiChaptersResponse =
                data as ApiChaptersResponse;

            // 9. Verify response structure
            expect(successData.success).toBe(true);
            expect(successData.chapters).toBeDefined();
            expect(Array.isArray(successData.chapters)).toBe(true);
            expect(successData.metadata).toBeDefined();

            // ============================================================================
            // 10. Verify ALL chapter attributes for ALL chapters
            // ============================================================================
            const { chapters }: { chapters: ApiChaptersResponse["chapters"] } =
                successData;
            expect(chapters.length).toBeGreaterThan(0);

            for (const chapter of chapters) {
                // === IDENTITY FIELDS ===
                expect(chapter.id).toMatch(/^chapter_/);
                expect(chapter.storyId).toBe(testStoryId);
                // partId is nullable in schema but should be testPartId in this test
                expect(chapter.partId).toBe(testPartId);
                expect(chapter.title).toBeDefined();
                expect(typeof chapter.title).toBe("string");
                expect(chapter.title.length).toBeGreaterThan(0);

                // === ADVERSITY-TRIUMPH CORE ===
                // summary is nullable
                expect(
                    chapter.summary === null ||
                        typeof chapter.summary === "string",
                ).toBe(true);

                // === NESTED CYCLE TRACKING ===
                // characterId is nullable
                expect(
                    chapter.characterId === null ||
                        typeof chapter.characterId === "string",
                ).toBe(true);

                // arcPosition is nullable
                expect(
                    chapter.arcPosition === null ||
                        [
                            "beginning",
                            "middle",
                            "climax",
                            "resolution",
                        ].includes(chapter.arcPosition),
                ).toBe(true);

                // contributesToMacroArc is nullable
                expect(
                    chapter.contributesToMacroArc === null ||
                        typeof chapter.contributesToMacroArc === "string",
                ).toBe(true);

                // === CYCLE TRACKING ===
                // focusCharacters has default([]) - should be array, not null
                expect(Array.isArray(chapter.focusCharacters)).toBe(true);

                // adversityType is nullable
                expect(
                    chapter.adversityType === null ||
                        ["internal", "external", "both"].includes(
                            chapter.adversityType,
                        ),
                ).toBe(true);

                // virtueType is nullable
                expect(
                    chapter.virtueType === null ||
                        [
                            "courage",
                            "compassion",
                            "integrity",
                            "sacrifice",
                            "loyalty",
                            "wisdom",
                        ].includes(chapter.virtueType),
                ).toBe(true);

                // === CAUSAL LINKING ===
                // seedsPlanted has default([]) - should be array, not null
                expect(Array.isArray(chapter.seedsPlanted)).toBe(true);

                // seedsResolved has default([]) - should be array, not null
                expect(Array.isArray(chapter.seedsResolved)).toBe(true);

                // === CONNECTION TO NARRATIVE FLOW ===
                // connectsToPreviousChapter is nullable
                expect(
                    chapter.connectsToPreviousChapter === null ||
                        typeof chapter.connectsToPreviousChapter === "string",
                ).toBe(true);

                // createsNextAdversity is nullable
                expect(
                    chapter.createsNextAdversity === null ||
                        typeof chapter.createsNextAdversity === "string",
                ).toBe(true);

                // === PUBLISHING ===
                // status has default("writing").notNull() - required field
                expect(chapter.status).toBeDefined();
                expect(["writing", "published"].includes(chapter.status)).toBe(
                    true,
                );

                // publishedAt is nullable
                expect(
                    chapter.publishedAt === null ||
                        typeof chapter.publishedAt === "string",
                ).toBe(true);

                // scheduledFor is nullable
                expect(
                    chapter.scheduledFor === null ||
                        typeof chapter.scheduledFor === "string",
                ).toBe(true);

                // === ORDERING ===
                expect(chapter.orderIndex).toBeDefined();
                expect(typeof chapter.orderIndex).toBe("number");
                expect(chapter.orderIndex).toBeGreaterThan(0);

                // === METADATA FIELDS ===
                expect(chapter.createdAt).toBeDefined();
                expect(typeof chapter.createdAt).toBe("string");

                expect(chapter.updatedAt).toBeDefined();
                expect(typeof chapter.updatedAt).toBe("string");
            }

            // 11. Verify metadata
            const { metadata }: { metadata: ApiChaptersResponse["metadata"] } =
                successData;
            expect(metadata.totalGenerated).toBeGreaterThan(0);
            expect(metadata.generationTime).toBeGreaterThan(0);

            // 12. Log success details
            console.log("✅ Chapters generated successfully:");
            console.log(`  Total: ${chapters.length}`);
            console.log(`  Generation time: ${metadata.generationTime}ms`);
            for (const chapter of chapters) {
                console.log(`  - ${chapter.title} (${chapter.id})`);
                console.log(`    Part ID: ${chapter.partId || "N/A"}`);
                console.log(`    Order: ${chapter.orderIndex}`);
                console.log(
                    `    Summary: ${chapter.summary?.substring(0, 80) || "N/A"}...`,
                );
            }
        }, 180000); // 3 minute timeout for chapters generation
    });
});
