/**
 * Jest Test Suite for /studio/api/characters
 *
 * Tests character creation API with real API calls.
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

describe("Character API", () => {
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

	it("should create a character via POST /studio/api/characters", async () => {
		const requestBody = {
			storyId: testStoryId,
			name: "Sir Galahad",
			isMain: true,
			summary: "A courageous knight seeking to prove his worth",
			coreTrait: "courage",
			internalFlaw: "Pride and overconfidence",
			externalGoal: "Must prove himself to the kingdom",
			personality: {
				traits: ["brave", "noble", "impulsive"],
				values: ["honor", "justice", "loyalty"],
			},
			physicalDescription: {
				age: "25 years old",
				appearance: "Tall and muscular with golden hair",
				distinctiveFeatures: "Scar across left cheek",
				style: "Wears polished silver armor",
			},
			voiceStyle: {
				tone: "Confident and commanding",
				vocabulary: "Formal and archaic",
				quirks: ["Often quotes old proverbs", "Uses thee and thou"],
				emotionalRange: "Reserved but passionate when provoked",
			},
			backstory: "Raised as an orphan, trained to become a knight",
		};

		const response = await fetch("http://localhost:3000/studio/api/characters", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error("❌ API Error:", data);
		}

		expect(response.status).toBe(201);
		expect(data.success).toBe(true);
		expect(data.character).toBeDefined();
		expect(data.character.id).toMatch(/^char_/);
		expect(data.character.name).toBe("Sir Galahad");
		expect(data.character.isMain).toBe(true);
		expect(data.character.coreTrait).toBe("courage");

		console.log("✅ Character created successfully:");
		console.log(`  ID: ${data.character.id}`);
		console.log(`  Name: ${data.character.name}`);
	}, 10000);
});
