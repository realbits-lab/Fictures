/**
 * Jest Test Suite for /studio/api/parts
 *
 * Tests parts generation API endpoints.
 *
 * Prerequisites:
 * - Requires a story with characters and settings (parts generation dependency)
 * - Uses writer API key with stories:write scope
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/parts.test.ts
 */

import type {
    GenerateCharactersRequest,
    GenerateCharactersResponse,
    GeneratePartsErrorResponse,
    GeneratePartsRequest,
    GeneratePartsResponse,
    GenerateStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Parts API", () => {
    let testStoryId: string = "";

    // Setup: Create a test story and characters first
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: GenerateStoryRequest = {
            userPrompt:
                "A short fantasy adventure for testing parts generation",
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

        // 6. Generate characters (required for parts generation)
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

        // 7. Validate characters response
        const charactersData: GenerateCharactersResponse =
            await charactersResponse.json();
        if (!charactersResponse.ok) {
            console.error("❌ Failed to generate characters:", charactersData);
            throw new Error("Test setup failed: could not generate characters");
        }

        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );
    }, 180000); // 3 minute timeout for story + character creation

    it("should generate parts via POST /studio/api/parts", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: GeneratePartsRequest = {
            storyId: testStoryId,
            partsCount: 2, // Generate 2 parts for faster testing
            language: "English",
        };

        // 2. Send POST request to parts generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/parts",
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
        const data: GeneratePartsResponse | GeneratePartsErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Parts API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected GeneratePartsResponse but got error");
        }

        // 7. Cast to success response type
        const successData: GeneratePartsResponse =
            data as GeneratePartsResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.parts).toBeDefined();
        expect(Array.isArray(successData.parts)).toBe(true);
        expect(successData.metadata).toBeDefined();

        // ============================================================================
        // 9. Verify ALL part attributes for ALL parts
        // ============================================================================
        const { parts }: { parts: GeneratePartsResponse["parts"] } =
            successData;
        expect(parts.length).toBe(2);

        for (const part of parts) {
            // === IDENTITY FIELDS ===
            expect(part.id).toMatch(/^part_/);
            expect(part.storyId).toBe(testStoryId);
            expect(part.title).toBeDefined();
            expect(typeof part.title).toBe("string");
            expect(part.title.length).toBeGreaterThan(0);

            // === ADVERSITY-TRIUMPH CORE ===
            // summary can be null or string
            expect(
                part.summary === null || typeof part.summary === "string",
            ).toBe(true);

            // === MACRO ARC TRACKING ===
            // characterArcs can be null or object (array)
            expect(
                part.characterArcs === null ||
                    typeof part.characterArcs === "object",
            ).toBe(true);

            // === ORDERING ===
            // orderIndex can be null or number
            expect(
                part.orderIndex === null || typeof part.orderIndex === "number",
            ).toBe(true);
            if (part.orderIndex !== null) {
                expect(part.orderIndex).toBeGreaterThan(0);
            }

            // === METADATA FIELDS ===
            expect(part.createdAt).toBeDefined();
            expect(typeof part.createdAt).toBe("string");

            expect(part.updatedAt).toBeDefined();
            expect(typeof part.updatedAt).toBe("string");
        }

        // ============================================================================
        // 10. Verify metadata
        // ============================================================================
        const { metadata }: { metadata: GeneratePartsResponse["metadata"] } =
            successData;
        expect(metadata.totalGenerated).toBe(2);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // ============================================================================
        // 11. Log success details
        // ============================================================================
        console.log("✅ Parts generated successfully:");
        console.log(`  Total: ${parts.length}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
        for (const part of parts) {
            console.log(`  - ${part.title} (${part.id})`);
            console.log(`    Order: ${part.orderIndex}`);
            console.log(
                `    Summary: ${part.summary?.substring(0, 80) || "N/A"}...`,
            );
        }
    }, 180000); // 3 minute timeout for parts generation
});
