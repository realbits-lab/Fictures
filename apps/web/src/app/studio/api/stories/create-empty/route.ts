import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories } from "@/lib/db/schema";

/**
 * POST /studio/api/stories/create-empty
 * Create an empty story shell for "Create New Story" workflow
 *
 * This is called by the Studio Agent when a user clicks "Create New Story"
 * It creates a minimal story record that the agent can then populate through generation
 */
export async function POST(request: NextRequest) {
	try {
		const { userId, title = "Untitled Story" } = await request.json();

		// Authentication - verify user matches session
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const sessionUserId = session.user.id as string;
		if (userId !== sessionUserId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Create empty story
		const [story] = await db
			.insert(stories)
			.values({
				id: nanoid(),
				authorId: userId,
				title,
				genre: "Contemporary", // Default genre until agent generates it
				status: "writing",
				// All other fields will be null/default
				// The agent will populate them through generation
			})
			.returning();

		return NextResponse.json({
			success: true,
			storyId: story.id,
			title: story.title,
			message: "Empty story created successfully",
		});
	} catch (error) {
		console.error("Create empty story error:", error);
		return NextResponse.json(
			{
				error: "Internal Server Error",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
