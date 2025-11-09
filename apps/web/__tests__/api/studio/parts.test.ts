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

import fs from "node:fs";
import path from "node:path";

// Load authentication profiles
const authFilePath = path.join(process.cwd(), ".auth/user.json");
const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

// Use develop environment writer profile (has stories:write scope)
const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
const writer = authData[environment].profiles.writer;

if (!writer?.apiKey) {
	throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Parts API", () => {
	let testStoryId: string;

	// Setup: Create a test story first
	beforeAll(async () => {
		console.log("🔧 Setting up test story...");

		const storyResponse = await fetch("http://localhost:3000/studio/api/stories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify({
				userPrompt: "A short fantasy adventure for testing parts generation",
				language: "English",
				preferredGenre: "Fantasy",
				preferredTone: "hopeful",
			}),
		});

		const storyData = await storyResponse.json();

		if (!storyResponse.ok) {
			console.error("❌ Failed to create test story:", storyData);
			throw new Error("Test setup failed: could not create story");
		}

		testStoryId = storyData.story.id;
		console.log(`✅ Test story created: ${testStoryId}`);
	}, 120000); // 2 minute timeout for story creation

	describe("POST /studio/api/parts", () => {
		it("should generate parts for a story", async () => {
			const requestBody = {
				storyId: testStoryId,
				partsCount: 2, // Generate 2 parts for faster testing
				language: "English",
			};

			const response = await fetch("http://localhost:3000/studio/api/parts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": writer.apiKey,
				},
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();

			// Log error if request failed
			if (!response.ok) {
				console.error("❌ Parts API Error:", data);
			}

			// Verify response status
			expect(response.status).toBe(201);

			// Verify response structure
			expect(data.success).toBe(true);
			expect(data.parts).toBeDefined();
			expect(Array.isArray(data.parts)).toBe(true);
			expect(data.metadata).toBeDefined();

			// Verify parts data
			expect(data.parts.length).toBe(2);
			for (const part of data.parts) {
				expect(part.id).toMatch(/^part_/);
				expect(part.storyId).toBe(testStoryId);
				expect(part.title).toBeDefined();
				expect(typeof part.title).toBe("string");
				expect(part.orderIndex).toBeGreaterThan(0);
			}

			// Verify metadata
			expect(data.metadata.totalGenerated).toBe(2);
			expect(data.metadata.generationTime).toBeGreaterThan(0);

			console.log("✅ Parts generated successfully:");
			console.log(`  Total: ${data.parts.length}`);
			console.log(`  Generation time: ${data.metadata.generationTime}ms`);
			for (const part of data.parts) {
				console.log(`  - ${part.title} (${part.id})`);
			}
		}, 180000); // 3 minute timeout for parts generation
	});

	describe("GET /studio/api/parts", () => {
		it("should fetch parts for a story", async () => {
			const response = await fetch(
				`http://localhost:3000/studio/api/parts?storyId=${testStoryId}`,
				{
					method: "GET",
					headers: {
						"x-api-key": writer.apiKey,
					},
				},
			);

			const data = await response.json();

			// Verify response status
			expect(response.status).toBe(200);

			// Verify response structure
			expect(data.parts).toBeDefined();
			expect(Array.isArray(data.parts)).toBe(true);

			// Verify parts data
			for (const part of data.parts) {
				expect(part.id).toMatch(/^part_/);
				expect(part.storyId).toBe(testStoryId);
				expect(part.story).toBeDefined();
				expect(part.story.id).toBe(testStoryId);
			}

			console.log("✅ Fetched parts successfully:");
			console.log(`  Total: ${data.parts.length}`);
		}, 30000);

		it("should require storyId parameter", async () => {
			const response = await fetch("http://localhost:3000/studio/api/parts", {
				method: "GET",
				headers: {
					"x-api-key": writer.apiKey,
				},
			});

			const data = await response.json();

			// Should fail with 400 Bad Request
			expect(response.status).toBe(400);
			expect(data.error).toContain("storyId");

			console.log("✅ Correctly rejected request without storyId");
		}, 30000);
	});
});
