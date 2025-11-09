/**
 * Jest Test Suite for /studio/api/stories
 *
 * Tests story generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/stories.test.ts
 */

import fs from "node:fs";
import path from "node:path";
import type {
    GenerateStoryErrorResponse,
    GenerateStoryRequest,
    GenerateStoryResponse,
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

describe("Story Generation API", () => {
    it("should generate and save story via POST /studio/api/stories", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: GenerateStoryRequest = {
            userPrompt: "A short story about a brave knight on a quest",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        // 2. Send POST request to story generation API
        const apiKey: string = writer.apiKey as string;
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
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
        const data: GenerateStoryResponse | GenerateStoryErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected GenerateStoryResponse but got error");
        }

        // 7. Cast to success response type
        const successData = data as GenerateStoryResponse;

        // ============================================================================
        // 8. Verify ALL top-level response structure
        // ============================================================================
        expect(successData.success).toBe(true);
        expect(successData.story).toBeDefined();
        expect(successData.metadata).toBeDefined();

        // ============================================================================
        // 9. Verify ALL story object attributes (15 total fields from Story type)
        // ============================================================================
        const { story }: { story: GenerateStoryResponse["story"] } =
            successData;

        // 10. Identity fields (id, authorId, title)
        expect(story.id).toBeDefined();
        expect(typeof story.id).toBe("string");
        expect(story.id).toMatch(/^story_/);

        expect(story.authorId).toBeDefined();
        expect(typeof story.authorId).toBe("string");

        expect(story.title).toBeDefined();
        expect(typeof story.title).toBe("string");
        expect(story.title.length).toBeGreaterThan(0);

        // 11. Adversity-Triumph Core fields (summary, genre, tone, moralFramework)
        // summary can be null, so check for string or null
        expect(
            story.summary === null || typeof story.summary === "string",
        ).toBe(true);

        // genre can be null, so check for string or null
        expect(story.genre === null || typeof story.genre === "string").toBe(
            true,
        );

        expect(story.tone).toBeDefined();
        expect(typeof story.tone).toBe("string");
        expect(["hopeful", "dark", "bittersweet", "satirical"]).toContain(
            story.tone,
        );

        // moralFramework can be null, so check for string or null
        expect(
            story.moralFramework === null ||
                typeof story.moralFramework === "string",
        ).toBe(true);

        // 12. Publishing & Engagement fields (status, viewCount, rating, ratingCount)
        expect(story.status).toBeDefined();
        expect(typeof story.status).toBe("string");
        expect(story.status).toBe("writing"); // Should be 'writing' for new stories

        expect(story.viewCount).toBeDefined();
        expect(typeof story.viewCount).toBe("number");
        expect(story.viewCount).toBe(0); // Should be 0 for new stories

        expect(story.rating).toBeDefined();
        expect(typeof story.rating).toBe("number");
        expect(story.rating).toBe(0); // Should be 0 for new stories

        expect(story.ratingCount).toBeDefined();
        expect(typeof story.ratingCount).toBe("number");
        expect(story.ratingCount).toBe(0); // Should be 0 for new stories

        // 13. Visual fields (imageUrl, imageVariants)
        expect(
            story.imageUrl === null || typeof story.imageUrl === "string",
        ).toBe(true);

        // imageVariants can be null or an object
        expect(
            story.imageVariants === null ||
                typeof story.imageVariants === "object",
        ).toBe(true);

        // 14. Metadata fields (createdAt, updatedAt)
        expect(story.createdAt).toBeDefined();
        // createdAt should be a string (timestamp from database)
        expect(typeof story.createdAt).toBe("string");

        expect(story.updatedAt).toBeDefined();
        // updatedAt should be a string (timestamp from database)
        expect(typeof story.updatedAt).toBe("string");

        // ============================================================================
        // Verify ALL metadata attributes (as defined in GenerateStoryResponse)
        // ============================================================================
        const { metadata }: { metadata: GenerateStoryResponse["metadata"] } =
            successData;

        expect(metadata.generationTime).toBeDefined();
        expect(typeof metadata.generationTime).toBe("number");
        expect(metadata.generationTime).toBeGreaterThan(0);

        // model is optional, check if present
        if (metadata.model !== undefined) {
            expect(typeof metadata.model).toBe("string");
        }

        // ============================================================================
        // Log success details
        // ============================================================================
        console.log("✅ Story created successfully:");
        console.log(`  ID: ${story.id}`);
        console.log(`  Title: ${story.title}`);
        console.log(`  Genre: ${story.genre}`);
        console.log(`  Tone: ${story.tone}`);
        console.log(`  Summary: ${story.summary?.substring(0, 100)}...`);
        console.log(
            `  Moral Framework: ${story.moralFramework?.substring(0, 80)}...`,
        );
        console.log(`  Status: ${story.status}`);
        console.log(`  View Count: ${story.viewCount}`);
        console.log(`  Rating: ${story.rating}`);
        console.log(`  Rating Count: ${story.ratingCount}`);
        console.log(`  Image URL: ${story.imageUrl || "N/A"}`);
        console.log(
            `  Image Variants: ${story.imageVariants ? "Present" : "N/A"}`,
        );
        console.log(`  Author ID: ${story.authorId}`);
        console.log(`  Created: ${story.createdAt}`);
        console.log(`  Updated: ${story.updatedAt}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
        console.log(`  Model: ${metadata.model || "N/A"}`);
    }, 60000); // 60 second timeout for AI generation
});
