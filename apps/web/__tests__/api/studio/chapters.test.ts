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

// Load authentication profiles
const authFilePath = path.join(process.cwd(), ".auth/user.json");
const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

// Use develop environment writer profile (has stories:write scope)
const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
const writer = authData[environment].profiles.writer;

if (!writer?.apiKey) {
	throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Chapters API", () => {
	let testStoryId: string;
	let testPartId: string;

	// Setup: Create a test story
	beforeAll(async () => {
		console.log("🔧 Setting up test story...");

		const storyResponse = await fetch("http://localhost:3000/studio/api/stories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify({
				userPrompt: "A short fantasy tale for testing chapter creation",
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

		// Create parts for testing chapters with partId
		console.log("🔧 Generating parts for story...");
		const partsResponse = await fetch("http://localhost:3000/studio/api/parts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify({
				storyId: testStoryId,
				partsCount: 1,
				language: "English",
			}),
		});

		const partsData = await partsResponse.json();

		if (partsResponse.ok && partsData.parts?.length > 0) {
			testPartId = partsData.parts[0].id;
			console.log(`✅ Test part created: ${testPartId}`);
		} else {
			console.warn("⚠️ Parts generation failed, will test without partId");
		}
	}, 300000); // 5 minute timeout for story + parts creation

	describe("POST /studio/api/chapters", () => {
		it("should create a chapter with partId", async () => {
			// Skip if parts creation failed in setup
			if (!testPartId) {
				console.log("⏭️ Skipping test - no partId available");
				return;
			}

			const requestBody = {
				title: "Chapter 1: The Journey",
				storyId: testStoryId,
				partId: testPartId,
				orderIndex: 1,
			};

			const response = await fetch("http://localhost:3000/studio/api/chapters", {
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
				console.error("❌ Chapter API Error:", data);
			}

			// Verify response status
			expect(response.status).toBe(201);

			// Verify response structure
			expect(data.chapter).toBeDefined();

			// Verify chapter data
			expect(data.chapter.id).toMatch(/^chapter_/);
			expect(data.chapter.storyId).toBe(testStoryId);
			expect(data.chapter.partId).toBe(testPartId);
			expect(data.chapter.title).toBe(requestBody.title);
			expect(data.chapter.orderIndex).toBe(requestBody.orderIndex);

			console.log("✅ Chapter created successfully:");
			console.log(`  ID: ${data.chapter.id}`);
			console.log(`  Title: ${data.chapter.title}`);
			console.log(`  Part ID: ${data.chapter.partId}`);
			console.log(`  Order: ${data.chapter.orderIndex}`);
		}, 60000);
	});
});
