import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RelationshipManager } from "@/lib/db/relationships";
import { parts, stories } from "@/lib/db/schema";

export const runtime = "nodejs";

const createPartSchema = z.object({
	title: z.string().min(1).max(255),
	summary: z.string().optional(),
	storyId: z.string(),
	orderIndex: z.number().min(1),
	content: z.string().optional(),
});

// GET /api/parts - Get parts for a story
export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		const { searchParams } = new URL(request.url);
		const storyId = searchParams.get("storyId");

		if (!storyId) {
			return NextResponse.json(
				{ error: "storyId parameter is required" },
				{ status: 400 },
			);
		}

		// Get story and check access
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, storyId));
		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		// Check access permissions
		// Allow access if user is the author or story is published
		if (
			!session?.user?.id ||
			(story.authorId !== session.user.id && story.status !== "published")
		) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get parts for the story
		const storyParts = await db
			.select()
			.from(parts)
			.where(eq(parts.storyId, storyId))
			.orderBy(parts.orderIndex);

		return NextResponse.json({
			parts: storyParts.map((part) => ({
				...part,
				story: {
					id: story.id,
					title: story.title,
					authorId: story.authorId,
				},
			})),
		});
	} catch (error) {
		console.error("Error fetching parts:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST /api/parts - Create a new part
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = createPartSchema.parse(body);

		// Verify user owns the story
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, validatedData.storyId));
		if (!story || story.authorId !== session.user.id) {
			return NextResponse.json(
				{ error: "Story not found or access denied" },
				{ status: 404 },
			);
		}

		// Check if orderIndex is unique for this story
		const existingPart = await db
			.select()
			.from(parts)
			.where(
				and(
					eq(parts.storyId, validatedData.storyId),
					eq(parts.orderIndex, validatedData.orderIndex),
				),
			);

		if (existingPart.length > 0) {
			return NextResponse.json(
				{ error: "A part with this order index already exists for this story" },
				{ status: 400 },
			);
		}

		// Create the part using RelationshipManager for bi-directional consistency
		const partId = await RelationshipManager.addPartToStory(
			validatedData.storyId,
			{
				title: validatedData.title,
				summary:
					(validatedData as any).summary || (validatedData as any).description,
				orderIndex: validatedData.orderIndex,
			},
		);

		// Get the created part for response
		const [newPart] = await db
			.select()
			.from(parts)
			.where(eq(parts.id, partId))
			.limit(1);

		return NextResponse.json({ part: newPart }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		console.error("Error creating part:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
