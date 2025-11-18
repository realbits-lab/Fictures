import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import {
    getCachedUserStories,
    invalidateStudioCache,
} from "@/lib/db/studio-queries";
import type {
    ApiStoryErrorResponse,
    ApiStoryRequest,
    ApiStoryResponse,
} from "@/lib/schemas/api/studio";
import { storyService } from "@/lib/studio/services";

export const runtime = "nodejs";

// GET /api/story - Get user's stories with detailed data for dashboard
export const GET = requireScopes("stories:read")(
    async (request: NextRequest) => {
        try {
            // 1. Get authentication from context
            const auth = getAuth();

            // 2. Fetch user stories from Redis cache
            const stories = (await getCachedUserStories(auth.userId!)) || [];

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

            // 3. Build response object with metadata
            const response = {
                stories: transformedStories,
                metadata: {
                    fetchedAt: new Date().toISOString(),
                    userId: auth.userId!,
                    totalStories: transformedStories.length,
                    lastUpdated: new Date().toISOString(),
                },
            };

            // 4. Generate ETag for cache validation
            const contentForHash = JSON.stringify({
                userId: auth.userId!,
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

            // 5. Check if client has the same version
            const clientETag = request.headers.get("if-none-match");
            if (clientETag === etag) {
                return new NextResponse(null, { status: 304 });
            }

            // 6. Set cache headers optimized for user dashboard
            const headers = new Headers({
                "Content-Type": "application/json",
                ETag: etag,
                // Medium cache for user dashboard - changes when user modifies stories
                "Cache-Control":
                    "private, max-age=900, stale-while-revalidate=1800", // 15min cache, 30min stale
                "X-Content-Type": "user-dashboard",
                "X-User-Id": auth.userId!,
                "X-Auth-Type": auth.type,
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
    },
);

// POST /api/story - Generate and create a new story using AI
export const POST = requireScopes("stories:write")(
    async (request: NextRequest) => {
        try {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📚 [STORY API] POST request received");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [STORY API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // 3. Parse request body with type safety
            const body: ApiStoryRequest =
                (await request.json()) as ApiStoryRequest;
            const {
                userPrompt,
                language = "English",
                preferredGenre,
                preferredTone,
            }: ApiStoryRequest = body;

            console.log("[STORY API] Request parameters:", {
                userPromptLength: userPrompt?.length || 0,
                userPromptPreview: userPrompt?.substring(0, 100) || "(empty)",
                language,
                preferredGenre,
                preferredTone,
            });

            // 4. Validate required parameters
            if (!userPrompt || typeof userPrompt !== "string") {
                console.error(
                    "❌ [STORY API] Validation failed: userPrompt missing",
                );
                const errorResponse: ApiStoryErrorResponse = {
                    error: "userPrompt is required and must be a string",
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            console.log("✅ [STORY API] Validation passed");

            // 2. Generate using service (handles generation and persistence)
            // API key is automatically retrieved from context - no need to pass it!
            console.log("[STORY API] 🤖 Calling story service...");
            const serviceResult = await storyService.generateAndSave({
                userPrompt,
                language,
                preferredGenre,
                preferredTone,
                userId: auth.userId!,
            });

            console.log("[STORY API] ✅ Story generation and save completed:", {
                storyId: serviceResult.story.id,
                title: serviceResult.story.title,
                generationTime: serviceResult.metadata.generationTime,
            });

            // 3. Invalidate cache after creating new story
            await invalidateStudioCache(auth.userId!);
            console.log("[STORY API] ✅ Cache invalidated");

            console.log("✅ [STORY API] Request completed successfully");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 4. Return the created story with metadata
            const response: ApiStoryResponse = {
                success: true,
                story: serviceResult.story,
                metadata: {
                    generationTime: serviceResult.metadata.generationTime,
                    model: serviceResult.metadata.model,
                },
            };

            return NextResponse.json(response, { status: 201 });
        } catch (error) {
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.error("❌ [STORY API] Error:", error);
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            const errorResponse: ApiStoryErrorResponse = {
                error: "Failed to generate and save story",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    },
);
