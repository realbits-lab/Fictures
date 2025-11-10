/**
 * Jest Test Suite for /studio/api/scene-evaluation
 *
 * Tests scene quality evaluation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-evaluation.test.ts
 */

import type {
	EvaluateSceneErrorResponse,
	EvaluateSceneRequest,
	EvaluateSceneResponse,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Evaluation API", () => {
	let testStoryId: string = "";
	let testPartId: string = "";
	let testChapterId: string = "";
	let testSceneId: string = "";

	beforeAll(async () => {
		console.log("🔧 Setting up test story...");

		// 1. Create test story with full generation (includes parts, chapters, scenes)
		interface StoryRequestBody {
			userPrompt: string;
			language: string;
			preferredGenre: string;
			preferredTone: string;
		}

		const storyRequestBody: StoryRequestBody = {
			userPrompt: "A test story for scene evaluation testing",
			language: "English",
			preferredGenre: "Fantasy",
			preferredTone: "mysterious",
		};

		const storyResponse: Response = await fetch(
			"http://localhost:3000/studio/api/stories",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": apiKey,
				},
				body: JSON.stringify(storyRequestBody),
			},
		);

		interface StoryResponseData {
			story: {
				id: string;
			};
		}

		const storyData: StoryResponseData = await storyResponse.json();
		if (!storyResponse.ok) {
			throw new Error(
				`Failed to create test story: ${JSON.stringify(storyData)}`,
			);
		}

		testStoryId = storyData.story.id;
		console.log(`✅ Test story created: ${testStoryId}`);

		// 2. Story generation creates parts, chapters, and scenes automatically
		// We need to fetch the first scene to test evaluation updates
		const partsResponse: Response = await fetch(
			`http://localhost:3000/studio/api/parts?storyId=${testStoryId}`,
			{
				headers: { "x-api-key": apiKey },
			},
		);
		interface PartsResponseData {
			parts?: Array<{ id: string }>;
		}

		const partsData: PartsResponseData = await partsResponse.json();
		testPartId = partsData.parts?.[0]?.id || "";

		if (testPartId) {
			// 3. Fetch chapters for the part
			const chaptersResponse: Response = await fetch(
				`http://localhost:3000/studio/api/chapters?partId=${testPartId}`,
				{
					headers: { "x-api-key": apiKey },
				},
			);
			interface ChaptersResponseData {
				chapters?: Array<{ id: string }>;
			}

			const chaptersData: ChaptersResponseData =
				await chaptersResponse.json();
			testChapterId = chaptersData.chapters?.[0]?.id || "";

			if (testChapterId) {
				// 4. Fetch scenes for the chapter
				const scenesResponse: Response = await fetch(
					`http://localhost:3000/studio/api/scenes?chapterId=${testChapterId}`,
					{
						headers: { "x-api-key": apiKey },
					},
				);
				interface ScenesResponseData {
					scenes?: Array<{ id: string }>;
				}

				const scenesData: ScenesResponseData = await scenesResponse.json();
				testSceneId = scenesData.scenes?.[0]?.id || "";
			}
		}

		console.log(`✅ Test scene retrieved: ${testSceneId}`);
	}, 300000); // 5 min for full story generation

	it("should evaluate scene quality via POST /studio/api/scene-evaluation", async () => {
		// 1. Prepare request body with proper TypeScript type
		const requestBody: EvaluateSceneRequest = {
			sceneId: testSceneId,
			maxIterations: 2, // Allow up to 2 improvement iterations
		};

		// 2. Send POST request to scene evaluation API
		const response: Response = await fetch(
			"http://localhost:3000/studio/api/scene-evaluation",
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
		const data: EvaluateSceneResponse | EvaluateSceneErrorResponse =
			await response.json();

		// 4. Log error if request failed
		if (!response.ok) {
			console.error("❌ Scene Evaluation API Error:", data);
			expect(response.ok).toBe(true); // Force fail with proper error logged
		}

		// 5. Verify response status
		expect(response.status).toBe(200);

		// 6. Type guard to ensure we have success response
		if (!("success" in data) || !data.success) {
			throw new Error("Expected EvaluateSceneResponse but got error");
		}

		// 7. Cast to success response type
		const successData: EvaluateSceneResponse =
			data as EvaluateSceneResponse;

		// 8. Verify response structure
		expect(successData.success).toBe(true);
		expect(successData.scene).toBeDefined();
		expect(successData.scene.id).toBe(testSceneId);

		// 9. Verify evaluation data
		expect(successData.evaluation).toBeDefined();
		expect(successData.evaluation.score).toBeGreaterThan(0);
		expect(successData.evaluation.score).toBeLessThanOrEqual(4);
		expect(successData.evaluation.iterations).toBeGreaterThanOrEqual(1);
		expect(successData.evaluation.iterations).toBeLessThanOrEqual(
			requestBody.maxIterations || 2,
		);

		// 10. Verify evaluation categories
		expect(successData.evaluation.categories).toBeDefined();
		expect(successData.evaluation.categories.plot).toBeGreaterThan(0);
		expect(successData.evaluation.categories.character).toBeGreaterThan(0);
		expect(successData.evaluation.categories.pacing).toBeGreaterThan(0);
		expect(successData.evaluation.categories.prose).toBeGreaterThan(0);
		expect(successData.evaluation.categories.worldBuilding).toBeGreaterThan(
			0,
		);

		// 11. Verify evaluation feedback
		expect(successData.evaluation.feedback).toBeDefined();
		expect(Array.isArray(successData.evaluation.feedback.strengths)).toBe(
			true,
		);
		expect(
			Array.isArray(successData.evaluation.feedback.improvements),
		).toBe(true);

		// 12. Verify metadata
		expect(successData.metadata).toBeDefined();
		expect(successData.metadata.generationTime).toBeGreaterThan(0);

		// 13. Log success details
		console.log("✅ Scene evaluation completed successfully:");
		console.log(`  Scene ID: ${successData.scene.id}`);
		console.log(`  Quality Score: ${successData.evaluation.score}/4.0`);
		console.log(`  Iterations: ${successData.evaluation.iterations}`);
		console.log(`  Improved: ${successData.evaluation.improved}`);
		console.log("  Categories:");
		console.log(
			`    - Plot: ${successData.evaluation.categories.plot}/4.0`,
		);
		console.log(
			`    - Character: ${successData.evaluation.categories.character}/4.0`,
		);
		console.log(
			`    - Pacing: ${successData.evaluation.categories.pacing}/4.0`,
		);
		console.log(
			`    - Prose: ${successData.evaluation.categories.prose}/4.0`,
		);
		console.log(
			`    - World-Building: ${successData.evaluation.categories.worldBuilding}/4.0`,
		);
		console.log(
			`  Strengths: ${successData.evaluation.feedback.strengths.join(", ")}`,
		);
		console.log(
			`  Improvements: ${successData.evaluation.feedback.improvements.join(", ")}`,
		);
		console.log(
			`  Generation time: ${successData.metadata.generationTime}ms`,
		);
	}, 180000); // 3 minute timeout for AI evaluation with improvements
});
