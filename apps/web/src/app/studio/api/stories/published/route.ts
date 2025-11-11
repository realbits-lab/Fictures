import { createHash } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getPublishedStories } from "@/lib/db/queries";

export const runtime = "nodejs";

// GET /api/stories/published - Get all published stories for browsing
export async function GET(request: NextRequest) {
	try {
		const publishedStories = await getPublishedStories();

		const response = {
			stories: publishedStories,
			count: publishedStories.length,
			metadata: {
				fetchedAt: new Date().toISOString(),
				lastUpdated: new Date().toISOString(),
			},
		};

		// Generate ETag based on published stories data
		const contentForHash = JSON.stringify({
			storiesData: publishedStories.map((story) => ({
				id: story.id,
				title: story.title,
				status: story.status,
				rating: story.rating,
				viewCount: story.viewCount,
			})),
			totalCount: publishedStories.length,
			lastUpdated: response.metadata.lastUpdated,
		});
		const etag = createHash("md5").update(contentForHash).digest("hex");

		// Check if client has the same version
		const clientETag = request.headers.get("if-none-match");
		if (clientETag === etag) {
			return new NextResponse(null, { status: 304 });
		}

		// Set cache headers optimized for published content (longer cache)
		const headers = new Headers({
			"Content-Type": "application/json",
			ETag: etag,
			// Longer cache for published content since it changes less frequently
			"Cache-Control": "public, max-age=1800, stale-while-revalidate=3600", // 30min cache, 1hr stale
			"X-Content-Type": "published-stories",
			"X-Last-Modified":
				response.metadata.lastUpdated || new Date().toISOString(),
		});

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("Error fetching published stories:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
