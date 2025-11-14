/**
 * Jest Test Suite for /studio/api/scene-evaluation
 *
 * Tests scene quality evaluation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/scene-evaluation.test.ts
 */

import type {
    ApiChapterRequest,
    ApiChapterResponse,
    ApiCharactersRequest,
    ApiPartRequest,
    ApiPartResponse,
    ApiSceneContentRequest,
    ApiSceneImprovementErrorResponse,
    ApiSceneImprovementRequest,
    ApiSceneImprovementResponse,
    ApiSceneSummaryRequest,
    ApiSceneSummaryResponse,
    ApiSettingsRequest,
    ApiStoryRequest,
} from "@/lib/schemas/api/studio";
import type {
    SceneContentEvaluationRequest,
    SceneContentEvaluationResponse,
    EvaluationError,
} from "@/lib/schemas/api/evaluation";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Scene Evaluation API", () => {
    let testStoryId: string = "";
    let testChapterId: string = "";
    let testSceneId: string = "";

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Create test story (no auto-generation)
        const storyRequestBody: ApiStoryRequest = {
            userPrompt: "A test story for scene evaluation testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "dark",
        };

        const storyResponse: Response = await fetch(
            "http://localhost:3000/api/studio/story",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(storyRequestBody),
            },
        );

        const storyData: { story: { id: string } } = await storyResponse.json();
        if (!storyResponse.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(storyData)}`,
            );
        }

        testStoryId = storyData.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);

        // 2. Generate characters
        console.log("🔧 Generating characters...");
        const charactersRequestBody: ApiCharactersRequest = {
            storyId: testStoryId,
            characterCount: 2,
            language: "English",
        };

        const charactersResponse: Response = await fetch(
            "http://localhost:3000/api/studio/characters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(charactersRequestBody),
            },
        );

        const charactersData: { characters: Array<{ id: string }> } =
            await charactersResponse.json();
        if (!charactersResponse.ok) {
            throw new Error(
                `Failed to generate characters: ${JSON.stringify(charactersData)}`,
            );
        }
        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );

        // 3. Generate settings (required for parts generation)
        console.log("🔧 Generating settings...");
        const settingsRequestBody: ApiSettingsRequest = {
            storyId: testStoryId,
            settingCount: 2,
        };

        const settingsResponse: Response = await fetch(
            "http://localhost:3000/api/studio/settings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(settingsRequestBody),
            },
        );

        const settingsData: { settings: Array<{ id: string }> } =
            await settingsResponse.json();
        if (!settingsResponse.ok) {
            throw new Error(
                `Failed to generate settings: ${JSON.stringify(settingsData)}`,
            );
        }
        console.log(`✅ Settings generated: ${settingsData.settings.length}`);

        // 4. Generate part (singular)
        console.log("🔧 Generating part...");
        const partRequestBody: ApiPartRequest = {
            storyId: testStoryId,
        };

        const partResponse: Response = await fetch(
            "http://localhost:3000/api/studio/part",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(partRequestBody),
            },
        );

        const partData: ApiPartResponse = await partResponse.json();
        if (!partResponse.ok) {
            throw new Error(
                `Failed to generate part: ${JSON.stringify(partData)}`,
            );
        }

        const testPartId = partData.part.id;
        console.log(`✅ Test part created: ${testPartId}`);

        // 5. Generate chapter (singular)
        console.log("🔧 Generating chapter...");
        const chapterRequestBody: ApiChapterRequest = {
            storyId: testStoryId,
            partId: testPartId,
        };

        const chapterResponse: Response = await fetch(
            "http://localhost:3000/api/studio/chapter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(chapterRequestBody),
            },
        );

        const chapterData: ApiChapterResponse = await chapterResponse.json();
        if (!chapterResponse.ok) {
            throw new Error(
                `Failed to generate chapter: ${JSON.stringify(chapterData)}`,
            );
        }

        testChapterId = chapterData.chapter.id;
        console.log(`✅ Test chapter created: ${testChapterId}`);

        // 6. Generate scene summary (singular)
        console.log("🔧 Generating scene summary...");
        const sceneSummaryRequestBody: ApiSceneSummaryRequest = {
            storyId: testStoryId,
            chapterId: testChapterId,
        };

        const sceneSummaryResponse: Response = await fetch(
            "http://localhost:3000/api/studio/scene-summary",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(sceneSummaryRequestBody),
            },
        );

        const sceneSummaryData: ApiSceneSummaryResponse =
            await sceneSummaryResponse.json();
        if (!sceneSummaryResponse.ok) {
            throw new Error(
                `Failed to generate scene summary: ${JSON.stringify(sceneSummaryData)}`,
            );
        }

        testSceneId = sceneSummaryData.scene.id;
        console.log(`✅ Test scene summary created: ${testSceneId}`);

        // 6. Generate scene content
        console.log("🔧 Generating scene content...");
        const sceneContentRequestBody: ApiSceneContentRequest = {
            sceneId: testSceneId,
            language: "English",
        };

        const sceneContentResponse: Response = await fetch(
            "http://localhost:3000/api/studio/scene-content",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(sceneContentRequestBody),
            },
        );

        const sceneContentData: { scene: { id: string } } =
            await sceneContentResponse.json();
        if (!sceneContentResponse.ok) {
            throw new Error(
                `Failed to generate scene content: ${JSON.stringify(sceneContentData)}`,
            );
        }

        console.log(`✅ Scene content generated: ${sceneContentData.scene.id}`);
    }, 300000); // 5 min for full story generation

    it("should evaluate scene quality via POST /studio/api/scene-evaluation", async () => {
        console.log("🔧 Evaluating scene quality...");

        // 1. Prepare request body with proper TypeScript type
        const requestBody: SceneContentEvaluationRequest = {
            sceneId: testSceneId,
            maxIterations: 2, // Allow up to 2 improvement iterations
        };

        // 2. Send POST request to scene evaluation API
        const response: Response = await fetch(
            "http://localhost:3000/api/studio/scene-evaluation",
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
        const data:
            | SceneContentEvaluationResponse
            | EvaluationError = await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Scene Evaluation API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(200);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error(
                "Expected SceneContentEvaluationResponse but got error",
            );
        }

        // 7. Cast to success response type
        const successData: SceneContentEvaluationResponse =
            data as SceneContentEvaluationResponse;

        // ========================================================================
        // 8. Verify ALL fields of SceneContentEvaluationResponse
        // ========================================================================

        // 8a. Validate 'success' field (required, must be true)
        expect(successData.success).toBe(true);

        // 8b. Validate 'scene' field (required Scene object)
        expect(successData).toHaveProperty("scene");
        expect(typeof successData.scene).toBe("object");
        expect(successData.scene).not.toBeNull();
        expect(successData.scene.id).toBe(testSceneId);

        // 8c. Validate 'evaluation' field (required object)
        expect(successData).toHaveProperty("evaluation");
        expect(typeof successData.evaluation).toBe("object");
        expect(successData.evaluation).not.toBeNull();

        // 8d. Validate 'evaluation.score' (required number, 1-4 scale)
        expect(successData.evaluation).toHaveProperty("score");
        expect(typeof successData.evaluation.score).toBe("number");
        expect(successData.evaluation.score).toBeGreaterThan(0);
        expect(successData.evaluation.score).toBeLessThanOrEqual(4);

        // 8e. Validate 'evaluation.iterations' (required number)
        expect(successData.evaluation).toHaveProperty("iterations");
        expect(typeof successData.evaluation.iterations).toBe("number");
        expect(successData.evaluation.iterations).toBeGreaterThanOrEqual(1);
        expect(successData.evaluation.iterations).toBeLessThanOrEqual(
            requestBody.maxIterations || 2,
        );

        // 8f. Validate 'evaluation.improved' (required boolean)
        expect(successData.evaluation).toHaveProperty("improved");
        expect(typeof successData.evaluation.improved).toBe("boolean");

        // 8g. Validate 'evaluation.categories' (required object)
        expect(successData.evaluation).toHaveProperty("categories");
        expect(typeof successData.evaluation.categories).toBe("object");
        expect(successData.evaluation.categories).not.toBeNull();

        // 8h. Validate category scores (all required, 1-4 scale)
        expect(successData.evaluation.categories).toHaveProperty("plot");
        expect(typeof successData.evaluation.categories.plot).toBe("number");
        expect(successData.evaluation.categories.plot).toBeGreaterThan(0);
        expect(successData.evaluation.categories.plot).toBeLessThanOrEqual(4);

        expect(successData.evaluation.categories).toHaveProperty("character");
        expect(typeof successData.evaluation.categories.character).toBe(
            "number",
        );
        expect(successData.evaluation.categories.character).toBeGreaterThan(0);
        expect(successData.evaluation.categories.character).toBeLessThanOrEqual(
            4,
        );

        expect(successData.evaluation.categories).toHaveProperty("pacing");
        expect(typeof successData.evaluation.categories.pacing).toBe("number");
        expect(successData.evaluation.categories.pacing).toBeGreaterThan(0);
        expect(successData.evaluation.categories.pacing).toBeLessThanOrEqual(4);

        expect(successData.evaluation.categories).toHaveProperty("prose");
        expect(typeof successData.evaluation.categories.prose).toBe("number");
        expect(successData.evaluation.categories.prose).toBeGreaterThan(0);
        expect(successData.evaluation.categories.prose).toBeLessThanOrEqual(4);

        expect(successData.evaluation.categories).toHaveProperty(
            "worldBuilding",
        );
        expect(typeof successData.evaluation.categories.worldBuilding).toBe(
            "number",
        );
        expect(successData.evaluation.categories.worldBuilding).toBeGreaterThan(
            0,
        );
        expect(
            successData.evaluation.categories.worldBuilding,
        ).toBeLessThanOrEqual(4);

        // 8i. Validate 'evaluation.feedback' (required object)
        expect(successData.evaluation).toHaveProperty("feedback");
        expect(typeof successData.evaluation.feedback).toBe("object");
        expect(successData.evaluation.feedback).not.toBeNull();

        // 8j. Validate 'evaluation.feedback.strengths' (required array)
        expect(successData.evaluation.feedback).toHaveProperty("strengths");
        expect(Array.isArray(successData.evaluation.feedback.strengths)).toBe(
            true,
        );
        expect(
            successData.evaluation.feedback.strengths.length,
        ).toBeGreaterThan(0);

        // 8k. Validate 'evaluation.feedback.improvements' (required array)
        expect(successData.evaluation.feedback).toHaveProperty("improvements");
        expect(
            Array.isArray(successData.evaluation.feedback.improvements),
        ).toBe(true);

        // 8l. Validate 'metadata' field (required object)
        expect(successData).toHaveProperty("metadata");
        expect(typeof successData.metadata).toBe("object");
        expect(successData.metadata).not.toBeNull();

        // 8m. Validate 'metadata.generationTime' (required number, positive)
        expect(successData.metadata).toHaveProperty("generationTime");
        expect(typeof successData.metadata.generationTime).toBe("number");
        expect(successData.metadata.generationTime).toBeGreaterThan(0);

        // 8n. Ensure no extra fields in response (type safety)
        const responseKeys: string[] = Object.keys(successData);
        expect(responseKeys.sort()).toEqual([
            "evaluation",
            "metadata",
            "scene",
            "success",
        ]);

        // 8o. Ensure no extra fields in evaluation
        const evaluationKeys: string[] = Object.keys(successData.evaluation);
        expect(evaluationKeys.sort()).toEqual([
            "categories",
            "feedback",
            "improved",
            "iterations",
            "score",
        ]);

        // 8p. Ensure no extra fields in metadata
        const metadataKeys: string[] = Object.keys(successData.metadata);
        expect(metadataKeys.sort()).toEqual(["generationTime"]);

        // ========================================================================
        // 9. Verify evaluation data quality
        // ========================================================================
        const {
            evaluation,
        }: { evaluation: SceneContentEvaluationResponse["evaluation"] } =
            successData;
        const {
            metadata,
        }: { metadata: SceneContentEvaluationResponse["metadata"] } = successData;

        expect(evaluation.score).toBeGreaterThan(0);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // 10. Log success details
        console.log("✅ Scene evaluation completed successfully:");
        console.log(`  Scene ID: ${successData.scene.id}`);
        console.log(`  Quality Score: ${evaluation.score}/4.0`);
        console.log(`  Iterations: ${evaluation.iterations}`);
        console.log(`  Improved: ${evaluation.improved}`);
        console.log("  Categories:");
        console.log(`    - Plot: ${evaluation.categories.plot}/4.0`);
        console.log(`    - Character: ${evaluation.categories.character}/4.0`);
        console.log(`    - Pacing: ${evaluation.categories.pacing}/4.0`);
        console.log(`    - Prose: ${evaluation.categories.prose}/4.0`);
        console.log(
            `    - World-Building: ${evaluation.categories.worldBuilding}/4.0`,
        );
        console.log(`  Strengths: ${evaluation.feedback.strengths.join(", ")}`);
        console.log(
            `  Improvements: ${evaluation.feedback.improvements.join(", ")}`,
        );
        console.log(`  Generation time: ${metadata.generationTime}ms`);
    }, 1200000); // 20 minute timeout for AI evaluation with improvements
});
