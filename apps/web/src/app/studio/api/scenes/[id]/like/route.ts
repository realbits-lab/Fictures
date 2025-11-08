import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sceneLikes, scenes } from "@/lib/db/schema";

export const runtime = "nodejs";

// POST /studio/api/scenes/[id]/like - Toggle like on a scene
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: sceneId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if scene exists
		const [scene] = await db
			.select()
			.from(scenes)
			.where(eq(scenes.id, sceneId))
			.limit(1);

		if (!scene) {
			return NextResponse.json({ error: "Scene not found" }, { status: 404 });
		}

		// Check if user has already liked this scene
		const [existingLike] = await db
			.select()
			.from(sceneLikes)
			.where(
				and(
					eq(sceneLikes.sceneId, sceneId),
					eq(sceneLikes.userId, session.user.id),
				),
			)
			.limit(1);

		if (existingLike) {
			// Unlike: Remove the like
			await db
				.delete(sceneLikes)
				.where(
					and(
						eq(sceneLikes.sceneId, sceneId),
						eq(sceneLikes.userId, session.user.id),
					),
				);

			return NextResponse.json({
				liked: false,
				message: "Scene unliked",
			});
		} else {
			// Like: Add a like
			await db.insert(sceneLikes).values({
				sceneId,
				userId: session.user.id,
				createdAt: new Date().toISOString(),
			});

			return NextResponse.json({
				liked: true,
				message: "Scene liked",
			});
		}
	} catch (error) {
		console.error("Error toggling scene like:", error);
		return NextResponse.json(
			{ error: "Failed to toggle like" },
			{ status: 500 },
		);
	}
}
