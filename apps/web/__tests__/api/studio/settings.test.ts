/**
 * Jest Test Suite for /studio/api/settings
 *
 * Tests setting creation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/settings.test.ts
 */

import fs from "node:fs";
import path from "node:path";

const authFilePath = path.join(process.cwd(), ".auth/user.json");
const authData = JSON.parse(fs.readFileSync(authFilePath, "utf-8"));

const environment = process.env.NODE_ENV === "production" ? "main" : "develop";
const writer = authData[environment].profiles.writer;

if (!writer?.apiKey) {
	throw new Error("❌ Writer API key not found in .auth/user.json");
}

describe("Setting API", () => {
	let testStoryId: string;

	beforeAll(async () => {
		const response = await fetch("http://localhost:3000/studio/api/stories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": writer.apiKey,
			},
			body: JSON.stringify({
				userPrompt: "A test story for setting testing",
				language: "English",
				preferredGenre: "Fantasy",
				preferredTone: "dark",
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(`Failed to create test story: ${JSON.stringify(data)}`);
		}

		testStoryId = data.story.id;
		console.log(`✅ Test story created: ${testStoryId}`);
	}, 120000);

	it("should create a setting via POST /studio/api/settings", async () => {
		const requestBody = {
			storyId: testStoryId,
			name: "Dark Forest of Trials",
			description: "A mystical forest where shadows come alive and test the courage of those who enter",
			timeframe: "Medieval times, autumn season",
			socialStructure: "Isolated from civilization, ruled by ancient forest spirits",
			geographyClimate: "Dense woodland with perpetual mist, cool and damp climate",
			adversityElements: {
				physicalObstacles: ["Treacherous paths", "Thorny undergrowth", "Deep ravines"],
				scarcityFactors: ["Limited food", "No fresh water", "Darkness"],
				dangerSources: ["Wild beasts", "Forest spirits", "Poisonous plants"],
				socialDynamics: ["Spirits test worthiness", "Ancient curses", "Forbidden zones"],
			},
			cycleAmplification: {
				setup: "The forest appears tranquil at first",
				confrontation: "Shadows begin to move and whisper",
				virtue: "Characters must show courage to proceed",
				consequence: "The forest either grants passage or traps the unworthy",
				transition: "Each trial leads deeper into the heart of darkness",
			},
			sensory: {
				sight: ["Twisted tree branches", "Glowing mushrooms", "Moving shadows"],
				sound: ["Rustling leaves", "Distant howls", "Whispers in unknown tongues"],
				smell: ["Damp earth", "Decaying vegetation", "Sweet poison flowers"],
				touch: ["Rough bark", "Cold mist", "Thorny vines"],
				taste: ["Bitter berries", "Metallic fear"],
			},
		};

		const response = await fetch("http://localhost:3000/studio/api/settings", {
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
		expect(data.setting).toBeDefined();
		expect(data.setting.id).toMatch(/^setting_/);
		expect(data.setting.name).toBe("Dark Forest of Trials");

		console.log("✅ Setting created successfully:");
		console.log(`  ID: ${data.setting.id}`);
		console.log(`  Name: ${data.setting.name}`);
	}, 10000);
});
