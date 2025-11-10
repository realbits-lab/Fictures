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
import {
    insertStorySchema,
    type Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateStoryErrorResponse,
    GenerateStoryRequest,
    GenerateStoryResponse,
} from "../types";

export const runtime = "nodejs";

// GET /api/stories - Get user's stories with detailed data for dashboard
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate the request
        const authResult = await authenticateRequest(request);

        if (!authResult) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to read stories
        if (!hasRequiredScope(authResult, "stories:read")) {
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:read",
                },
                { status: 403 },
            );
        }

        // 3. Fetch user stories from Redis cache
        const stories = (await getCachedUserStories(authResult.user.id)) || [];

        // 4. Transform data to match Dashboard component expectations
        const transformedStories = Array.isArray(stories)
            ? stories.map((story) => ({
                  id: story.id,
                  title: story.title,
                  summary: story.summary || "",
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
                  rating: (story.rating || 0) / 10,
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

        // 5. Build response object with metadata
        const response = {
            stories: transformedStories,
            metadata: {
                fetchedAt: new Date().toISOString(),
                userId: authResult.user.id,
                totalStories: transformedStories.length,
                lastUpdated: new Date().toISOString(),
            },
        };

        // 6. Generate ETag for cache validation
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

        // 7. Check if client has the same version
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            return new NextResponse(null, { status: 304 });
        }

        // 8. Set cache headers optimized for user dashboard
        const headers = new Headers({
            "Content-Type": "application/json",
            ETag: etag,
            // Medium cache for user dashboard - changes when user modifies stories
            "Cache-Control":
                "private, max-age=900, stale-while-revalidate=1800", // 15min cache, 30min stale
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

        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [STORIES API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [STORIES API] Insufficient scopes:", {
                required: "stories:write",
                actual: authResult.scopes,
            });
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:write",
                },
                { status: 403 },
            );
        }

        console.log("✅ [STORIES API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse request body with type safety
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

        // 4. Validate required parameters
        if (!userPrompt || typeof userPrompt !== "string") {
            console.error(
                "❌ [STORIES API] Validation failed: userPrompt missing",
            );
            const errorResponse: GenerateStoryErrorResponse = {
                error: "userPrompt is required and must be a string",
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        console.log("✅ [STORIES API] Validation passed");

        // 5. Generate story using story-generator
        console.log("[STORIES API] 🤖 Calling story generator...");
        const generateParams: GenerateStoryParams = {
            userPrompt,
            language,
            preferredGenre,
            preferredTone,
        };

        const generationResult: GenerateStoryResult =
            await generateStory(generateParams);

        console.log("[STORIES API] ✅ Story generation completed:", {
            title: generationResult.story.title,
            genre: generationResult.story.genre,
            tone: generationResult.story.tone,
            generationTime: generationResult.metadata.generationTime,
        });

        // 6. Validate and save story to database
        console.log(
            "[STORIES API] 💾 Validating and saving story to database...",
        );
        const storyId: string = `story_${nanoid(16)}`;
        const now: string = new Date().toISOString();

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
                createdAt: now,
                updatedAt: now,
            });

        const savedStoryArray: Story[] = (await db
            .insert(stories)
            .values(storyData)
            .returning()) as Story[];
        const savedStory: Story = savedStoryArray[0];

        console.log("[STORIES API] ✅ Story saved to database:", {
            storyId: savedStory.id,
            title: savedStory.title,
        });

        // 7. Invalidate cache after creating new story
        await invalidateStudioCache(authResult.user.id);
        console.log("[STORIES API] ✅ Cache invalidated");

        console.log("✅ [STORIES API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 8. Return the created story with metadata
        const response: GenerateStoryResponse = {
            success: true,
            story: savedStory,
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
