import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackEvent } from "@/lib/services/event-tracker";

/**
 * POST /analysis/api/track
 *
 * Track an analytics event
 * Called from client-side event tracking components
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		const body = await request.json();

		const {
			eventType,
			storyId,
			chapterId,
			sceneId,
			postId,
			metadata = {},
		} = body;

		if (!eventType) {
			return NextResponse.json(
				{ error: "eventType required" },
				{ status: 400 },
			);
		}

		await trackEvent({
			eventType,
			userId: session?.user?.id,
			storyId,
			chapterId,
			sceneId,
			postId,
			metadata,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to track event:", error);
		// Don't return error - analytics failures should be silent
		return NextResponse.json({ success: false });
	}
}
