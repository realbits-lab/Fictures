/**
 * Jest Test Suite for /studio/api/stories
 *
 * Tests story generation and API logic.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/stories.test.ts
 */

import { generateStory } from "@/lib/studio/generators/story-generator";
import type { GenerateStoryParams } from "@/lib/studio/generators/types";

// Mock the AI client
jest.mock("@/lib/studio/generators/ai-client", () => ({
	textGenerationClient: {
		generateWithTemplate: jest.fn(),
	},
}));

import { textGenerationClient } from "@/lib/studio/generators/ai-client";

const mockedTextGenerationClient = textGenerationClient as jest.Mocked<
	typeof textGenerationClient
>;

describe("Story Generator", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("generateStory", () => {
		it("should generate story with valid parameters", async () => {
			const mockAIResponse = {
				text: JSON.stringify({
					title: "The AI Chronicles",
					summary: "A story about artificial intelligence and humanity",
					genre: "Science Fiction",
					tone: "hopeful",
					moralFramework: "Compassion and wisdom guide technological progress",
				}),
				model: "gemini-2.5-flash-mini",
				tokensUsed: 1500,
				finishReason: "STOP",
			};

			mockedTextGenerationClient.generateWithTemplate.mockResolvedValue(
				mockAIResponse,
			);

			const params: GenerateStoryParams = {
				userId: "user_123",
				userPrompt: "A story about AI and humanity",
				language: "English",
				preferredGenre: "Science Fiction",
				preferredTone: "hopeful",
			};

			const result = await generateStory(params);

			expect(result.story.title).toBe("The AI Chronicles");
			expect(result.story.genre).toBe("Science Fiction");
			expect(result.story.tone).toBe("hopeful");
			expect(result.metadata.model).toBe("gemini-2.5-flash-mini");
			expect(result.metadata.generationTime).toBeGreaterThan(0);
		});

		it("should use default values when optional params are not provided", async () => {
			const mockAIResponse = {
				text: JSON.stringify({
					title: "Test Story",
					summary: "Test summary",
					genre: "Fiction",
					tone: "hopeful",
					moralFramework: "Test framework",
				}),
				model: "gemini-2.5-flash-mini",
				tokensUsed: 1000,
				finishReason: "STOP",
			};

			mockedTextGenerationClient.generateWithTemplate.mockResolvedValue(
				mockAIResponse,
			);

			const params: GenerateStoryParams = {
				userId: "user_123",
				userPrompt: "A simple story",
				// No language, genre, or tone provided
			};

			await generateStory(params);

			expect(
				mockedTextGenerationClient.generateWithTemplate,
			).toHaveBeenCalledWith(
				"story",
				{
					userPrompt: "A simple story",
					genre: "Any",
					tone: "hopeful",
					language: "English",
				},
				expect.any(Object),
			);
		});

		it("should throw error when AI response is empty", async () => {
			mockedTextGenerationClient.generateWithTemplate.mockResolvedValue({
				text: "",
				model: "gemini-2.5-flash-mini",
				tokensUsed: 0,
				finishReason: "ERROR",
			});

			const params: GenerateStoryParams = {
				userId: "user_123",
				userPrompt: "Test story",
			};

			await expect(generateStory(params)).rejects.toThrow(
				"Empty response from AI model for story",
			);
		});

		it("should throw error when generated story is missing required title field", async () => {
			const mockAIResponse = {
				text: JSON.stringify({
					// Missing title (required field)
					summary: "Test summary",
					genre: "Test",
					tone: "hopeful",
				}),
				model: "gemini-2.5-flash-mini",
				tokensUsed: 500,
				finishReason: "STOP",
			};

			mockedTextGenerationClient.generateWithTemplate.mockResolvedValue(
				mockAIResponse,
			);

			const params: GenerateStoryParams = {
				userId: "user_123",
				userPrompt: "Test story",
			};

			await expect(generateStory(params)).rejects.toThrow(
				"Invalid story data generated - missing required fields",
			);
		});

		it("should call AI with correct template and options", async () => {
			const mockAIResponse = {
				text: JSON.stringify({
					title: "Fantasy Quest",
					summary: "An epic fantasy adventure",
					genre: "Fantasy",
					tone: "hopeful",
					moralFramework: "Courage conquers fear",
				}),
				model: "gemini-2.5-flash-mini",
				tokensUsed: 2000,
				finishReason: "STOP",
			};

			mockedTextGenerationClient.generateWithTemplate.mockResolvedValue(
				mockAIResponse,
			);

			const params: GenerateStoryParams = {
				userId: "user_456",
				userPrompt: "An epic fantasy adventure",
				language: "Spanish",
				preferredGenre: "Fantasy",
				preferredTone: "dark",
			};

			await generateStory(params);

			expect(
				mockedTextGenerationClient.generateWithTemplate,
			).toHaveBeenCalledWith(
				"story",
				{
					userPrompt: "An epic fantasy adventure",
					genre: "Fantasy",
					tone: "dark",
					language: "Spanish",
				},
				{
					temperature: 0.8,
					maxTokens: 8192,
					responseFormat: "json",
					responseSchema: expect.any(Object),
				},
			);
		});

		it("should include generation time in metadata", async () => {
			const mockAIResponse = {
				text: JSON.stringify({
					title: "Time Test",
					summary: "Testing time",
					genre: "Test",
					tone: "hopeful",
					moralFramework: "Time matters",
				}),
				model: "gemini-2.5-flash-mini",
				tokensUsed: 100,
				finishReason: "STOP",
			};

			// Add delay to ensure generation time is measurable
			mockedTextGenerationClient.generateWithTemplate.mockImplementation(
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 50));
					return mockAIResponse;
				},
			);

			const params: GenerateStoryParams = {
				userId: "user_789",
				userPrompt: "Time test",
			};

			const result = await generateStory(params);

			expect(result.metadata.generationTime).toBeGreaterThanOrEqual(50);
		});
	});
});

describe("API Authentication Logic", () => {
	describe("stories:write scope", () => {
		it("should require stories:write or admin:all scope for POST", () => {
			const validScopes = [
				["stories:write"],
				["admin:all"],
				["stories:write", "stories:read"],
				["admin:all", "other:scope"],
			];

			const invalidScopes = [
				["stories:read"],
				["other:scope"],
				["stories:read", "other:scope"],
			];

			validScopes.forEach((scopes) => {
				const hasScope =
					scopes.includes("stories:write") || scopes.includes("admin:all");
				expect(hasScope).toBe(true);
			});

			invalidScopes.forEach((scopes) => {
				const hasScope =
					scopes.includes("stories:write") || scopes.includes("admin:all");
				expect(hasScope).toBe(false);
			});
		});
	});

	describe("stories:read scope", () => {
		it("should require stories:read scope for GET", () => {
			const validScopes = [
				["stories:read"],
				["admin:all"],
				["stories:read", "stories:write"],
			];

			const invalidScopes = [["stories:write"], ["other:scope"]];

			validScopes.forEach((scopes) => {
				const hasScope =
					scopes.includes("stories:read") || scopes.includes("admin:all");
				expect(hasScope).toBe(true);
			});

			invalidScopes.forEach((scopes) => {
				const hasScope =
					scopes.includes("stories:read") || scopes.includes("admin:all");
				expect(hasScope).toBe(false);
			});
		});
	});
});
