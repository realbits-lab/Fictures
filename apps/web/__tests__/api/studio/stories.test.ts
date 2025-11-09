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
		// Use proper TypeScript type for request
		const requestBody: GenerateStoryRequest = {
			userPrompt: "A short story about a brave knight on a quest",
			language: "English",
			preferredGenre: "Fantasy",
			preferredTone: "hopeful",
		};

		const response: Response = await fetch(
			"http://localhost:3000/studio/api/stories",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${writer.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			},
		);

		// Type the response data
		const data: GenerateStoryResponse | GenerateStoryErrorResponse =
			await response.json();

		// Log error if request failed
		if (!response.ok) {
			console.error("❌ API Error:", data);
			expect(response.ok).toBe(true); // Force fail with proper error logged
		}

		// Verify response status
		expect(response.status).toBe(201);

		// Type guard to ensure we have success response
		if (!("success" in data) || !data.success) {
			throw new Error("Expected GenerateStoryResponse but got error");
		}

		// Now TypeScript knows data is GenerateStoryResponse
		const successData = data as GenerateStoryResponse;

		// ============================================================================
		// Verify ALL top-level response structure
		// ============================================================================
		expect(successData.success).toBe(true);
		expect(successData.story).toBeDefined();
		expect(successData.metadata).toBeDefined();

		// ============================================================================
		// Verify ALL story object attributes (as defined in GenerateStoryResponse)
		// ============================================================================
		const { story }: { story: GenerateStoryResponse["story"] } = successData;

		// Identity fields
		expect(story.id).toBeDefined();
		expect(typeof story.id).toBe("string");
		expect(story.id).toMatch(/^story_/);

		expect(story.authorId).toBeDefined();
		expect(typeof story.authorId).toBe("string");

		expect(story.title).toBeDefined();
		expect(typeof story.title).toBe("string");
		expect(story.title.length).toBeGreaterThan(0);

		// Adversity-Triumph Core fields
		// summary can be null, so check for string or null
		expect(story.summary === null || typeof story.summary === "string").toBe(
			true,
		);

		// genre can be null, so check for string or null
		expect(story.genre === null || typeof story.genre === "string").toBe(true);

		expect(story.tone).toBeDefined();
		expect(typeof story.tone).toBe("string");
		expect(["hopeful", "dark", "bittersweet", "satirical"]).toContain(
			story.tone,
		);

		// moralFramework can be null, so check for string or null
		expect(
			story.moralFramework === null || typeof story.moralFramework === "string",
		).toBe(true);

		// Publishing & Engagement fields
		expect(story.status).toBeDefined();
		expect(typeof story.status).toBe("string");
		expect(story.status).toBe("writing"); // Should be 'writing' for new stories

		// Metadata fields
		expect(story.createdAt).toBeDefined();
		// createdAt should be a valid date (can be Date object or ISO string)
		expect(
			story.createdAt instanceof Date ||
				typeof story.createdAt === "string" ||
				typeof story.createdAt === "object",
		).toBe(true);

		expect(story.updatedAt).toBeDefined();
		// updatedAt should be a valid date (can be Date object or ISO string)
		expect(
			story.updatedAt instanceof Date ||
				typeof story.updatedAt === "string" ||
				typeof story.updatedAt === "object",
		).toBe(true);

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
		console.log(`  Author ID: ${story.authorId}`);
		console.log(`  Created: ${story.createdAt}`);
		console.log(`  Updated: ${story.updatedAt}`);
		console.log(`  Generation time: ${metadata.generationTime}ms`);
		console.log(`  Model: ${metadata.model || "N/A"}`);
	}, 60000); // 60 second timeout for AI generation
});
