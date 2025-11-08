import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStoriesAnalytics } from "@/lib/services/analytics";

/**
 * GET /analysis/api/list
 *
 * Get analytics for all stories owned by the current user
 * Used for the analytics landing page story cards
 */
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const range = (searchParams.get("range") || "30d") as "7d" | "30d" | "90d";

		const stories = await getStoriesAnalytics(session.user.id, range);

		return NextResponse.json({ stories });
	} catch (error) {
		console.error("Failed to fetch stories analytics list:", error);
		return NextResponse.json(
			{ error: "Failed to fetch stories" },
			{ status: 500 },
		);
	}
}
