/**
 * Jest Test Suite for /studio/api/characters
 *
 * Tests AI-powered character generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/characters.test.ts
 */

import type {
    GenerateCharactersErrorResponse,
    GenerateCharactersRequest,
    GenerateCharactersResponse,
    GenerateStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Character Generation API", () => {
    let testStoryId: string = "";

    // First create a test story to use
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: GenerateStoryRequest = {
            userPrompt: "A test story for character testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        // 2. Send POST request to story creation API
        const response: Response = await fetch(
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

        // 3. Parse story response
        const data: { story: { id: string } } = await response.json();

        // 4. Validate story response
        if (!response.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(data)}`,
            );
        }

        // 5. Store test story ID
        testStoryId = data.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);
    }, 120000);

    it("should generate characters via POST /studio/api/characters", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: GenerateCharactersRequest = {
            storyId: testStoryId,
            characterCount: 3,
            language: "English",
        };

        // 2. Send POST request to characters generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/characters",
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
            | GenerateCharactersResponse
            | GenerateCharactersErrorResponse = await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Characters API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error(
                "Expected GenerateCharactersResponse but got error",
            );
        }

        // 7. Cast to success response type
        const successData = data as GenerateCharactersResponse;

        // ============================================================================
        // 8. Verify ALL top-level response structure
        // ============================================================================
        expect(successData.success).toBe(true);
        expect(successData.characters).toBeDefined();
        expect(Array.isArray(successData.characters)).toBe(true);
        expect(successData.characters.length).toBe(3);
        expect(successData.metadata).toBeDefined();

        // ============================================================================
        // 9. Verify ALL metadata attributes
        // ============================================================================
        const {
            metadata,
        }: { metadata: GenerateCharactersResponse["metadata"] } = successData;
        expect(metadata.totalGenerated).toBe(3);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // ============================================================================
        // 10. Verify ALL character attributes for ALL characters (not just index 0)
        // ============================================================================
        const {
            characters,
        }: { characters: GenerateCharactersResponse["characters"] } =
            successData;

        // 11. Loop through ALL characters and verify each one
        for (const character of characters) {
            // === IDENTITY FIELDS ===
            expect(character.id).toMatch(/^char_/);
            expect(character.storyId).toBe(testStoryId);
            expect(character.name).toBeDefined();
            expect(typeof character.name).toBe("string");
            expect(character.name.length).toBeGreaterThan(0);

            expect(character.isMain).toBeDefined();
            expect(typeof character.isMain).toBe("boolean");

            // summary can be null or string
            expect(
                character.summary === null ||
                    typeof character.summary === "string",
            ).toBe(true);

            // === ADVERSITY-TRIUMPH CORE FIELDS ===
            // coreTrait can be null or string
            expect(
                character.coreTrait === null ||
                    typeof character.coreTrait === "string",
            ).toBe(true);

            // internalFlaw can be null or string
            expect(
                character.internalFlaw === null ||
                    typeof character.internalFlaw === "string",
            ).toBe(true);

            // externalGoal can be null or string
            expect(
                character.externalGoal === null ||
                    typeof character.externalGoal === "string",
            ).toBe(true);

            // === CHARACTER DEPTH FIELDS ===
            // personality can be null or object
            expect(
                character.personality === null ||
                    typeof character.personality === "object",
            ).toBe(true);

            // backstory can be null or string
            expect(
                character.backstory === null ||
                    typeof character.backstory === "string",
            ).toBe(true);

            // === RELATIONSHIPS (JEONG SYSTEM) ===
            // relationships can be null or object
            expect(
                character.relationships === null ||
                    typeof character.relationships === "object",
            ).toBe(true);

            // === PROSE GENERATION FIELDS ===
            // physicalDescription can be null or object
            expect(
                character.physicalDescription === null ||
                    typeof character.physicalDescription === "object",
            ).toBe(true);

            // voiceStyle can be null or object
            expect(
                character.voiceStyle === null ||
                    typeof character.voiceStyle === "object",
            ).toBe(true);

            // === VISUAL GENERATION FIELDS ===
            // imageUrl can be null or string
            expect(
                character.imageUrl === null ||
                    typeof character.imageUrl === "string",
            ).toBe(true);

            // imageVariants can be null or object
            expect(
                character.imageVariants === null ||
                    typeof character.imageVariants === "object",
            ).toBe(true);

            // visualStyle can be null or string
            expect(
                character.visualStyle === null ||
                    typeof character.visualStyle === "string",
            ).toBe(true);

            // === METADATA FIELDS ===
            expect(character.createdAt).toBeDefined();
            expect(typeof character.createdAt).toBe("string");

            expect(character.updatedAt).toBeDefined();
            expect(typeof character.updatedAt).toBe("string");
        }

        // ============================================================================
        // 12. Log success details
        // ============================================================================
        console.log("✅ Characters generated successfully:");
        console.log(`  Total Generated: ${characters.length}`);
        console.log(`  Generation Time: ${metadata.generationTime}ms`);
        for (const [idx, char] of characters.entries()) {
            console.log(
                `  ${idx + 1}. ${char.name} (${char.isMain ? "Main" : "Supporting"})`,
            );
            console.log(`     ID: ${char.id}`);
            console.log(`     Core Trait: ${char.coreTrait}`);
            console.log(`     Internal Flaw: ${char.internalFlaw}`);
            console.log(`     External Goal: ${char.externalGoal}`);
            console.log(
                `     Summary: ${char.summary?.substring(0, 80) || "N/A"}...`,
            );
            console.log(
                `     Backstory: ${char.backstory ? "Present" : "N/A"}`,
            );
            console.log(
                `     Personality: ${char.personality ? "Present" : "N/A"}`,
            );
            console.log(
                `     Physical Description: ${char.physicalDescription ? "Present" : "N/A"}`,
            );
            console.log(
                `     Voice Style: ${char.voiceStyle ? "Present" : "N/A"}`,
            );
            console.log(`     Image URL: ${char.imageUrl || "N/A"}`);
            console.log(
                `     Image Variants: ${char.imageVariants ? "Present" : "N/A"}`,
            );
            console.log(`     Visual Style: ${char.visualStyle || "N/A"}`);
        }
    }, 60000);
});
