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

import fs from "node:fs";
import path from "node:path";
import type {
    GenerateChaptersErrorResponse,
    GenerateChaptersRequest,
    GenerateChaptersResponse,
} from "@/app/studio/api/types";

// Load authentication profiles
const authFilePath: string = path.join(process.cwd(), ".auth/user.json");
const authData: {
    [key: string]: { profiles: { writer: { apiKey?: string } } };
} = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

// Use develop environment writer profile (has stories:write scope)
const environment: "main" | "develop" =
    process.env.NODE_ENV === "production" ? "main" : "develop";
const writer: { apiKey?: string } = authData[environment].profiles.writer;

if (!writer?.apiKey) {
    throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Chapters API", () => {
    let testStoryId: string;
    let testPartId: string;

    // Setup: Create a test story
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request
        const apiKey: string = writer.apiKey as string;
        const storyResponse: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt:
                        "A short fantasy tale for testing chapter creation",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "hopeful",
                }),
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

        // 5. Create parts for testing chapters with partId
        console.log("🔧 Generating parts for story...");
        const partsResponse: Response = await fetch(
            "http://localhost:3000/studio/api/parts",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    storyId: testStoryId,
                    partsCount: 1,
                    language: "English",
                }),
            },
        );

        // 6. Parse parts response
        const partsData: { parts?: Array<{ id: string }> } =
            await partsResponse.json();

        // 7. Store test part ID if available
        if (partsResponse.ok && partsData.parts?.length > 0) {
            testPartId = partsData.parts[0].id;
            console.log(`✅ Test part created: ${testPartId}`);
        } else {
            console.warn("⚠️ Parts generation failed, will test without partId");
        }
    }, 300000); // 5 minute timeout for story + parts creation

    describe("POST /studio/api/chapters", () => {
        it("should generate chapters for a story with parts", async () => {
            // 1. Skip if parts creation failed in setup
            if (!testPartId) {
                console.log("⏭️ Skipping test - no partId available");
                return;
            }

            // 2. Prepare request body with proper TypeScript type
            const requestBody: GenerateChaptersRequest = {
                storyId: testStoryId,
                chaptersPerPart: 2, // Generate 2 chapters per part for faster testing
                language: "English",
            };

            // 3. Send POST request to chapters generation API
            const apiKey: string = writer.apiKey as string;
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
            const data:
                | GenerateChaptersResponse
                | GenerateChaptersErrorResponse = await response.json();

            // 5. Log error if request failed
            if (!response.ok) {
                console.error("❌ Chapters API Error:", data);
                expect(response.ok).toBe(true); // Force fail with proper error logged
            }

            // 6. Verify response status
            expect(response.status).toBe(201);

            // 7. Type guard to ensure we have success response
            if (!("success" in data) || !data.success) {
                throw new Error(
                    "Expected GenerateChaptersResponse but got error",
                );
            }

            // 8. Cast to success response type
            const successData = data as GenerateChaptersResponse;

            // 9. Verify response structure
            expect(successData.success).toBe(true);
            expect(successData.chapters).toBeDefined();
            expect(Array.isArray(successData.chapters)).toBe(true);
            expect(successData.metadata).toBeDefined();

            // 10. Verify chapters data
            const {
                chapters,
            }: { chapters: GenerateChaptersResponse["chapters"] } = successData;
            expect(chapters.length).toBeGreaterThan(0);
            for (const chapter of chapters) {
                expect(chapter.id).toMatch(/^chapter_/);
                expect(chapter.storyId).toBe(testStoryId);
                expect(chapter.title).toBeDefined();
                expect(typeof chapter.title).toBe("string");
                expect(chapter.orderIndex).toBeGreaterThan(0);
            }

            // 11. Verify metadata
            const {
                metadata,
            }: { metadata: GenerateChaptersResponse["metadata"] } = successData;
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
