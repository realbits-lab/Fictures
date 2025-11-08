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

// Load authentication profiles
const authFilePath = path.join(process.cwd(), ".auth/user.json");
const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

// Use develop environment writer profile (has stories:write scope)
const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
const writer = authData[environment].profiles.writer;

if (!writer?.apiKey) {
	throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Story Generation API", () => {
	it("should generate and save story via POST /studio/api/stories", async () => {
		const requestBody = {
			userPrompt: "A short story about a brave knight on a quest",
			language: "English",
			preferredGenre: "Fantasy",
			preferredTone: "hopeful",
		};

		const response = await fetch("http://localhost:3000/studio/api/stories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${writer.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		// Log error if request failed
		if (!response.ok) {
			console.error("❌ API Error:", data);
		}

		// Verify response status
		expect(response.status).toBe(201);

		// Verify response structure
		expect(data.success).toBe(true);
		expect(data.story).toBeDefined();
		expect(data.metadata).toBeDefined();

		// Verify story fields
		expect(data.story.id).toMatch(/^story_/);
		expect(data.story.title).toBeDefined();
		expect(typeof data.story.title).toBe("string");
		expect(data.story.title.length).toBeGreaterThan(0);
		expect(data.story.tone).toBe("hopeful");
		expect(data.story.status).toBe("writing");
		expect(data.story.authorId).toBeDefined();

		// Verify metadata
		expect(data.metadata.generationTime).toBeGreaterThan(0);
		expect(data.metadata.model).toBeDefined();

		console.log("✅ Story created successfully:");
		console.log(`  ID: ${data.story.id}`);
		console.log(`  Title: ${data.story.title}`);
		console.log(`  Genre: ${data.story.genre}`);
		console.log(`  Generation time: ${data.metadata.generationTime}ms`);
	}, 60000); // 60 second timeout for AI generation
});
