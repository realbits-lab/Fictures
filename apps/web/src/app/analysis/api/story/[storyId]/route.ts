import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStoryAnalytics } from "@/lib/services/analytics";

/**
 * GET /analysis/api/story/{storyId}?range={7d|30d|90d}
 *
 * Get comprehensive analytics for a single story
 * Used for the story detail analytics dashboard
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ storyId: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { storyId } = await params;
		const { searchParams } = new URL(request.url);
		const range = (searchParams.get("range") || "30d") as "7d" | "30d" | "90d";

		const analytics = await getStoryAnalytics(storyId, session.user.id, range);

		return NextResponse.json(analytics);
	} catch (error) {
		console.error("Failed to fetch story analytics:", error);

		if (error instanceof Error && error.message === "Story not found") {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
