/**
 * Jest Test Suite for /studio/api/characters
 *
 * Tests AI-powered character generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/characters.test.ts
 */

import fs from "node:fs";
import path from "node:path";
import type {
    GenerateCharactersErrorResponse,
    GenerateCharactersRequest,
    GenerateCharactersResponse,
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

describe("Character Generation API", () => {
    let testStoryId: string;

    // First create a test story to use
    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request
        const apiKey: string = writer.apiKey as string;
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt: "A test story for character testing",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "hopeful",
                }),
            },
        );

        // 2. Parse story response
        const data: { story: { id: string } } = await response.json();

        // 3. Validate story response
        if (!response.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(data)}`,
            );
        }

        // 4. Store test story ID
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
        const apiKey: string = writer.apiKey as string;
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

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.characters).toBeDefined();
        expect(Array.isArray(successData.characters)).toBe(true);
        expect(successData.characters.length).toBe(3);
        expect(successData.metadata).toBeDefined();

        // 9. Verify metadata
        const {
            metadata,
        }: { metadata: GenerateCharactersResponse["metadata"] } = successData;
        expect(metadata.totalGenerated).toBe(3);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // 10. Verify characters data
        const {
            characters,
        }: { characters: GenerateCharactersResponse["characters"] } =
            successData;
        const firstCharacter = characters[0];
        expect(firstCharacter.id).toMatch(/^char_/);
        expect(firstCharacter.storyId).toBe(testStoryId);
        expect(firstCharacter.name).toBeDefined();
        expect(typeof firstCharacter.name).toBe("string");
        expect(firstCharacter.isMain).toBeDefined();
        expect(typeof firstCharacter.isMain).toBe("boolean");
        expect(firstCharacter.coreTrait).toBeDefined();
        expect(firstCharacter.internalFlaw).toBeDefined();
        expect(firstCharacter.externalGoal).toBeDefined();

        // 11. Log success details
        console.log("✅ Characters generated successfully:");
        console.log(`  Total Generated: ${characters.length}`);
        console.log(`  Generation Time: ${metadata.generationTime}ms`);
        for (let idx = 0; idx < characters.length; idx++) {
            const char = characters[idx];
            console.log(
                `  ${idx + 1}. ${char.name} (${char.isMain ? "Main" : "Supporting"})`,
            );
            console.log(`     ID: ${char.id}`);
            console.log(`     Core Trait: ${char.coreTrait}`);
            console.log(`     Internal Flaw: ${char.internalFlaw}`);
            console.log(`     External Goal: ${char.externalGoal}`);
        }
    }, 60000);
});
