import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";
import {
	getCachedUserStories,
	invalidateStudioCache,
} from "@/lib/db/studio-queries";
import { generateStory } from "@/lib/studio/generators/story-generator";
import type { GenerateStoryParams } from "@/lib/studio/generators/types";
import { insertStorySchema } from "@/lib/studio/generators/zod-schemas.generated";
import type {
	GenerateStoryErrorResponse,
	GenerateStoryRequest,
	GenerateStoryResponse,
} from "../types";

export const runtime = "nodejs";

// GET /api/stories - Get user's stories with detailed data for dashboard
export async function GET(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user has permission to read stories
		if (!hasRequiredScope(authResult, "stories:read")) {
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:read" },
				{ status: 403 },
			);
		}

		// ⚡ Use Redis-cached query for better performance
		const stories = (await getCachedUserStories(authResult.user.id)) || [];

		// Transform the data to match the Dashboard component expectations
		const transformedStories = Array.isArray(stories)
			? stories.map((story) => ({
					id: story.id,
					title: story.title,
					summary: story.summary || "", // Story summary for card descriptions
					genre: story.genre || "General",
					parts: {
						completed: story.completedParts || 0,
						total: story.totalParts || 0,
					},
					chapters: {
						completed: story.completedChapters || 0,
						total: story.totalChapters || 0,
					},
					readers: story.viewCount || 0,
					rating: (story.rating || 0) / 10, // Convert from database format (47 = 4.7)
					status: story.status as
						| "draft"
						| "publishing"
						| "completed"
						| "published",
					firstChapterId: story.firstChapterId,
					isPublic: story.status === "published",
					imageUrl: story.imageUrl,
					imageVariants: story.imageVariants,
				}))
			: [];

		const response = {
			stories: transformedStories,
			metadata: {
				fetchedAt: new Date().toISOString(),
				userId: authResult.user.id,
				totalStories: transformedStories.length,
				lastUpdated: new Date().toISOString(),
			},
		};

		// Generate ETag based on user stories data
		const contentForHash = JSON.stringify({
			userId: authResult.user.id,
			storiesData: Array.isArray(stories)
				? stories.map((story) => ({
						id: story.id,
						title: story.title,
						updatedAt: story.updatedAt,
						status: story.status,
						completedChapters: story.completedChapters,
						totalChapters: story.totalChapters,
						rating: story.rating,
						viewCount: story.viewCount,
					}))
				: [],
			totalStories: transformedStories.length,
			lastUpdated: response.metadata.lastUpdated,
		});
		const etag = createHash("md5").update(contentForHash).digest("hex");

		// Check if client has the same version
		const clientETag = request.headers.get("if-none-match");
		if (clientETag === etag) {
			return new NextResponse(null, { status: 304 });
		}

		// Set cache headers optimized for user dashboard (medium cache)
		const headers = new Headers({
			"Content-Type": "application/json",
			ETag: etag,
			// Medium cache for user dashboard - changes when user modifies stories
			"Cache-Control": "private, max-age=900, stale-while-revalidate=1800", // 15min cache, 30min stale
			"X-Content-Type": "user-dashboard",
			"X-User-Id": authResult.user.id,
			"X-Auth-Type": authResult.type,
			"X-Last-Modified":
				response.metadata.lastUpdated || new Date().toISOString(),
		});

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Error fetching stories:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/stories - Generate and create a new story using AI
export async function POST(request: NextRequest) {
	try {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("📚 [STORIES API] POST request received");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

		const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
			await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [STORIES API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user has permission to write stories
		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [STORIES API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [STORIES API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse request body with type safety
		const body: GenerateStoryRequest =
			(await request.json()) as GenerateStoryRequest;
		const {
			userPrompt,
			language = "English",
			preferredGenre,
			preferredTone,
		}: GenerateStoryRequest = body;

		console.log("[STORIES API] Request parameters:", {
			userPromptLength: userPrompt?.length || 0,
			userPromptPreview: userPrompt?.substring(0, 100) || "(empty)",
			language,
			preferredGenre,
			preferredTone,
		});

		// Validate required parameters
		if (!userPrompt || typeof userPrompt !== "string") {
			console.error("❌ [STORIES API] Validation failed: userPrompt missing");
			const errorResponse: GenerateStoryErrorResponse = {
				error: "userPrompt is required and must be a string",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		console.log("✅ [STORIES API] Validation passed");

		// Generate story using story-generator
		console.log("[STORIES API] 🤖 Calling story generator...");
		const generateParams: GenerateStoryParams = {
			userPrompt,
			language,
			preferredGenre,
			preferredTone,
		};

		const generationResult: Awaited<ReturnType<typeof generateStory>> =
			await generateStory(generateParams);

		console.log("[STORIES API] ✅ Story generation completed:", {
			title: generationResult.story.title,
			genre: generationResult.story.genre,
			tone: generationResult.story.tone,
			generationTime: generationResult.metadata.generationTime,
		});

		// Save story to database with validation
		console.log("[STORIES API] 💾 Validating and saving story to database...");
		const storyId: string = `story_${nanoid(16)}`;

		// Validate story data before insert
		const storyData: ReturnType<typeof insertStorySchema.parse> =
			insertStorySchema.parse({
				id: storyId,
				authorId: authResult.user.id,
				title: generationResult.story.title || "Untitled Story",
				summary: generationResult.story.summary || null,
				genre: generationResult.story.genre || null,
				tone: generationResult.story.tone || "hopeful",
				moralFramework: generationResult.story.moralFramework || null,
				status: "writing",
				viewCount: 0,
				rating: 0,
				ratingCount: 0,
				imageUrl: null,
				imageVariants: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

		const [savedStory] = await db.insert(stories).values(storyData).returning();

		console.log("[STORIES API] ✅ Story saved to database:", {
			storyId: savedStory.id,
			title: savedStory.title,
		});

		// ⚡ Invalidate cache after creating new story
		await invalidateStudioCache(authResult.user.id);
		console.log("[STORIES API] ✅ Cache invalidated");

		console.log("✅ [STORIES API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return the created story with metadata (typed response)
		const response: GenerateStoryResponse = {
			success: true,
			story: {
				id: savedStory.id,
				authorId: savedStory.authorId,
				title: savedStory.title,
				summary: savedStory.summary,
				genre: savedStory.genre,
				tone: savedStory.tone || "hopeful",
				moralFramework: savedStory.moralFramework,
				status: savedStory.status,
				createdAt: new Date(savedStory.createdAt),
				updatedAt: new Date(savedStory.updatedAt),
			},
			metadata: {
				generationTime: generationResult.metadata.generationTime,
				model: generationResult.metadata.model,
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [STORIES API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		const errorResponse: GenerateStoryErrorResponse = {
			error: "Failed to generate and save story",
			details: error instanceof Error ? error.message : "Unknown error",
		};

		return NextResponse.json(errorResponse, { status: 500 });
	}
}
