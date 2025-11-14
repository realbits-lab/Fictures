/**
 * Jest Test Suite for /studio/api/characters
 *
 * Tests AI-powered character generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/characters.test.ts
 */

import type {
    ApiCharactersErrorResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiStoryRequest,
} from "@/app/api/studio/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Character Generation API", () => {
    let testStoryId: string = "";

    // First create a test story to use
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: ApiStoryRequest = {
            userPrompt: "A test story for character testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        // 2. Send POST request to story creation API
        const response: Response = await fetch(
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
        const requestBody: ApiCharactersRequest = {
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
        const data: ApiCharactersResponse | ApiCharactersErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Characters API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiCharactersResponse but got error");
        }

        // 7. Cast to success response type
        const successData = data as ApiCharactersResponse;

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
        const { metadata }: { metadata: ApiCharactersResponse["metadata"] } =
            successData;
        expect(metadata.totalGenerated).toBe(3);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // ============================================================================
        // 10. Verify ALL character attributes for ALL characters (not just index 0)
        // ============================================================================
        const {
            characters,
        }: { characters: ApiCharactersResponse["characters"] } = successData;

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

            // summary is required (.notNull())
            expect(character.summary).toBeDefined();
            expect(typeof character.summary).toBe("string");
            expect(character.summary.length).toBeGreaterThan(0);

            // === ADVERSITY-TRIUMPH CORE FIELDS ===
            // coreTrait is required (.notNull())
            expect(character.coreTrait).toBeDefined();
            expect(typeof character.coreTrait).toBe("string");
            expect(character.coreTrait.length).toBeGreaterThan(0);

            // internalFlaw is required (.notNull())
            expect(character.internalFlaw).toBeDefined();
            expect(typeof character.internalFlaw).toBe("string");
            expect(character.internalFlaw.length).toBeGreaterThan(0);

            // externalGoal is required (.notNull())
            expect(character.externalGoal).toBeDefined();
            expect(typeof character.externalGoal).toBe("string");
            expect(character.externalGoal.length).toBeGreaterThan(0);

            // === CHARACTER DEPTH FIELDS ===
            // personality is required (.notNull())
            expect(character.personality).toBeDefined();
            expect(typeof character.personality).toBe("object");

            // backstory is required (.notNull())
            expect(character.backstory).toBeDefined();
            expect(typeof character.backstory).toBe("string");
            expect(character.backstory.length).toBeGreaterThan(0);

            // === PROSE GENERATION FIELDS ===
            // physicalDescription is required (.notNull())
            expect(character.physicalDescription).toBeDefined();
            expect(typeof character.physicalDescription).toBe("object");

            // voiceStyle is required (.notNull())
            expect(character.voiceStyle).toBeDefined();
            expect(typeof character.voiceStyle).toBe("object");

            // === VISUAL GENERATION FIELDS ===
            // imageUrl is nullable (one of three nullable fields)
            expect(
                character.imageUrl === null ||
                    typeof character.imageUrl === "string",
            ).toBe(true);

            // imageVariants is nullable (one of three nullable fields)
            expect(
                character.imageVariants === null ||
                    typeof character.imageVariants === "object",
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
        }
    }, 60000);
});
