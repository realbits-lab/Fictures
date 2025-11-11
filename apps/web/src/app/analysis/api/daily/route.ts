import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDailyMetrics } from "@/lib/services/analytics";

/**
 * GET /analysis/api/daily?storyId={id}&range={7d|30d|90d}
 *
 * Get daily time-series metrics for a specific story
 * Used for charts on the story detail page
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const storyId = searchParams.get("storyId");
		const range = (searchParams.get("range") || "30d") as "7d" | "30d" | "90d";

		if (!storyId) {
			return NextResponse.json({ error: "storyId required" }, { status: 400 });
		}

		const data = await getDailyMetrics(storyId, session.user.id, range);

		return NextResponse.json({ data });
	} catch (error) {
		console.error("Failed to fetch daily metrics:", error);
		return NextResponse.json(
			{ error: "Failed to fetch metrics" },
			{ status: 500 },
		);
	}
}
