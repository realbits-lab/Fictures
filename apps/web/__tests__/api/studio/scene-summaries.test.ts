/**
 * Jest Test Suite for /studio/api/scene-summaries
 *
 * Tests scene summary update API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-summaries.test.ts
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

describe("Scene Summary API", () => {
	let testStoryId: string;
	let testPartId: string;
	let testChapterId: string;
	let testSceneId: string;

	beforeAll(async () => {
		// Create test story with full generation (includes parts, chapters, scenes)
		const storyResponse = await fetch(
			"http://localhost:3000/studio/api/stories",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": writer.apiKey,
				},
				body: JSON.stringify({
					userPrompt: "A test story for scene summary testing",
					language: "English",
					preferredGenre: "Fantasy",
					preferredTone: "adventurous",
				}),
			},
		);

		const storyData = await storyResponse.json();
		if (!storyResponse.ok) {
			throw new Error(
				`Failed to create test story: ${JSON.stringify(storyData)}`,
			);
		}

		testStoryId = storyData.story.id;
		console.log(`✅ Test story created: ${testStoryId}`);

		// Story generation creates parts, chapters, and scenes automatically
		// We need to fetch the first scene to test summary updates
		const partsResponse = await fetch(
			`http://localhost:3000/studio/api/parts?storyId=${testStoryId}`,
			{
				headers: { "x-api-key": writer.apiKey },
			},
		);
		const partsData = await partsResponse.json();
		testPartId = partsData.parts?.[0]?.id;

		if (testPartId) {
			const chaptersResponse = await fetch(
				`http://localhost:3000/studio/api/chapters?partId=${testPartId}`,
				{
					headers: { "x-api-key": writer.apiKey },
				},
			);
			const chaptersData = await chaptersResponse.json();
			testChapterId = chaptersData.chapters?.[0]?.id;

			if (testChapterId) {
				const scenesResponse = await fetch(
					`http://localhost:3000/studio/api/scenes?chapterId=${testChapterId}`,
					{
						headers: { "x-api-key": writer.apiKey },
					},
				);
				const scenesData = await scenesResponse.json();
				testSceneId = scenesData.scenes?.[0]?.id;
			}
		}

		console.log(`✅ Test scene retrieved: ${testSceneId}`);
	}, 300000); // 5 min for full story generation

	it("should update scene summary via POST /studio/api/scene-summaries", async () => {
		const requestBody = {
			sceneId: testSceneId,
			summary:
				"The hero discovers a hidden passage leading to an ancient temple. They must overcome magical wards and face their inner doubts to proceed.",
		};

		const response = await fetch(
			"http://localhost:3000/studio/api/scene-summaries",
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

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.scene).toBeDefined();
		expect(data.scene.id).toBe(testSceneId);
		expect(data.scene.summary).toBe(requestBody.summary);

		console.log("✅ Scene summary updated successfully:");
		console.log(`  Scene ID: ${data.scene.id}`);
		console.log(`  Summary: ${data.scene.summary}`);
	}, 10000);
});
