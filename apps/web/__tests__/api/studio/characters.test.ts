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

// Load authentication profiles
const authFilePath = path.join(process.cwd(), ".auth/user.json");
const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

// Use develop environment writer profile (has stories:write scope)
const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
const writer = authData[environment].profiles.writer;

if (!writer?.apiKey) {
	throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Character Generation API", () => {
	let testStoryId: string;

	// First create a test story to use
	beforeAll(async () => {
		const response = await fetch("http://localhost:3000/studio/api/stories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify({
				userPrompt: "A test story for character testing",
				language: "English",
				preferredGenre: "Fantasy",
				preferredTone: "hopeful",
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(`Failed to create test story: ${JSON.stringify(data)}`);
		}

		testStoryId = data.story.id;
		console.log(`✅ Test story created: ${testStoryId}`);
	}, 120000);

	it("should generate characters via POST /studio/api/characters", async () => {
		const requestBody = {
			storyId: testStoryId,
			characterCount: 3,
			language: "English",
		};

		const response = await fetch(
			"http://localhost:3000/studio/api/characters",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": writer.apiKey,
				},
				body: JSON.stringify(requestBody),
			},
		);

		const data = await response.json();

		if (!response.ok) {
			console.error("❌ API Error:", data);
		}

		expect(response.status).toBe(201);
		expect(data.success).toBe(true);
		expect(data.characters).toBeDefined();
		expect(Array.isArray(data.characters)).toBe(true);
		expect(data.characters.length).toBe(3);
		expect(data.metadata).toBeDefined();
		expect(data.metadata.totalGenerated).toBe(3);
		expect(data.metadata.generationTime).toBeGreaterThan(0);

		// Verify first character structure
		const firstCharacter = data.characters[0];
		expect(firstCharacter.id).toMatch(/^char_/);
		expect(firstCharacter.storyId).toBe(testStoryId);
		expect(firstCharacter.name).toBeDefined();
		expect(typeof firstCharacter.name).toBe("string");
		expect(firstCharacter.isMain).toBeDefined();
		expect(typeof firstCharacter.isMain).toBe("boolean");
		expect(firstCharacter.coreTrait).toBeDefined();
		expect(firstCharacter.internalFlaw).toBeDefined();
		expect(firstCharacter.externalGoal).toBeDefined();

		console.log("✅ Characters generated successfully:");
		console.log(`  Total Generated: ${data.characters.length}`);
		console.log(`  Generation Time: ${data.metadata.generationTime}ms`);
		data.characters.forEach((char: any, idx: number) => {
			console.log(
				`  ${idx + 1}. ${char.name} (${char.isMain ? "Main" : "Supporting"})`,
			);
		});
	}, 60000);
});
