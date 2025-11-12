/**
 * Jest Test Suite for /studio/api/part (Singular - Extreme Incremental)
 *
 * Tests singular part generation API endpoint.
 *
 * Prerequisites:
 * - Requires a story with characters (part generation dependency)
 * - Uses writer API key with stories:write scope
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/part.test.ts
 */

import type {
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiPartErrorResponse,
    ApiPartRequest,
    ApiPartResponse,
    ApiStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Part API (Singular - Extreme Incremental)", () => {
    let testStoryId: string = "";

    // Setup: Create a test story and characters first
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: ApiStoryRequest = {
            userPrompt:
                "A short fantasy adventure for testing singular part generation",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        // 2. Send POST request to story creation API
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

        // 3. Parse response
        const storyData: { story: { id: string } } = await storyResponse.json();

        // 4. Validate response
        if (!storyResponse.ok) {
            console.error("❌ Failed to create test story:", storyData);
            throw new Error("Test setup failed: could not create story");
        }

        // 5. Store test story ID
        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // 6. Generate characters (required for part generation)
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

        // 7. Validate characters response
        const charactersData: ApiCharactersResponse =
            await charactersResponse.json();
        if (!charactersResponse.ok) {
            console.error("❌ Failed to generate characters:", charactersData);
            throw new Error("Test setup failed: could not generate characters");
        }

        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );
    }, 180000); // 3 minute timeout for story + character creation

    it("should generate first part via POST /studio/api/part", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: ApiPartRequest = {
            storyId: testStoryId,
        };

        // 2. Send POST request to singular part generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/part",
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
        const data: ApiPartResponse | ApiPartErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Part API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiPartResponse but got error");
        }

        // 7. Cast to success response type
        const successData: ApiPartResponse = data as ApiPartResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.part).toBeDefined();
        expect(successData.metadata).toBeDefined();

        // 9. Verify part attributes
        const { part } = successData;

        // === IDENTITY FIELDS ===
        expect(part.id).toMatch(/^part_/);
        expect(part.storyId).toBe(testStoryId);
        expect(part.title).toBeDefined();
        expect(typeof part.title).toBe("string");
        expect(part.title.length).toBeGreaterThan(0);

        // === ADVERSITY-TRIUMPH CORE ===
        expect(part.summary === null || typeof part.summary === "string").toBe(
            true,
        );

        // === MACRO ARC TRACKING ===
        expect(
            part.characterArcs === null ||
                typeof part.characterArcs === "object",
        ).toBe(true);

        // === ORDERING ===
        expect(
            part.orderIndex === null || typeof part.orderIndex === "number",
        ).toBe(true);
        if (part.orderIndex !== null) {
            expect(part.orderIndex).toBe(1); // First part should have orderIndex 1
        }

        // === METADATA FIELDS ===
        expect(part.createdAt).toBeDefined();
        expect(typeof part.createdAt).toBe("string");
        expect(part.updatedAt).toBeDefined();
        expect(typeof part.updatedAt).toBe("string");

        // 10. Verify metadata
        const { metadata } = successData;
        expect(metadata.partIndex).toBe(0); // First part (0-indexed)
        expect(metadata.totalParts).toBe(1); // Total should be 1 after generating first
        expect(metadata.generationTime).toBeGreaterThan(0);

        // 11. Log success details
        console.log("✅ Part generated successfully:");
        console.log(`  Title: ${part.title}`);
        console.log(`  ID: ${part.id}`);
        console.log(`  Part index: ${metadata.partIndex}`);
        console.log(`  Total parts: ${metadata.totalParts}`);
        console.log(`  Order: ${part.orderIndex}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
        console.log(`  Summary: ${part.summary?.substring(0, 80) || "N/A"}...`);
    }, 180000); // 3 minute timeout for part generation

    it("should generate second part with context via POST /studio/api/part", async () => {
        // 1. Prepare request body
        const requestBody: ApiPartRequest = {
            storyId: testStoryId,
        };

        // 2. Send POST request to generate second part
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/part",
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
        const data: ApiPartResponse | ApiPartErrorResponse =
            await response.json();

        if (!response.ok) {
            console.error("❌ Second Part API Error:", data);
            expect(response.ok).toBe(true);
        }

        expect(response.status).toBe(201);

        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiPartResponse but got error");
        }

        const successData: ApiPartResponse = data as ApiPartResponse;

        // 4. Verify second part
        const { part, metadata } = successData;

        expect(part.id).toMatch(/^part_/);
        expect(part.storyId).toBe(testStoryId);
        expect(part.orderIndex).toBe(2); // Second part should have orderIndex 2

        // 5. Verify metadata shows context awareness
        expect(metadata.partIndex).toBe(1); // Second part (0-indexed)
        expect(metadata.totalParts).toBe(2); // Total should be 2 after generating second

        console.log("✅ Second part generated successfully with context:");
        console.log(`  Title: ${part.title}`);
        console.log(`  ID: ${part.id}`);
        console.log(`  Part index: ${metadata.partIndex}`);
        console.log(`  Total parts: ${metadata.totalParts}`);
        console.log(`  Order: ${part.orderIndex}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 180000);
});
