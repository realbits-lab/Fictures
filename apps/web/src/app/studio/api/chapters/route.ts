import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createChapter, getStoryById } from "@/lib/db/queries";

export const runtime = "nodejs";

const createChapterSchema = z.object({
	title: z.string().min(1).max(255),
	storyId: z.string(),
	partId: z.string().optional(), // Optional - supports standalone chapters
	orderIndex: z.number().min(0),
});

// POST /api/chapters - Create a new chapter
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = createChapterSchema.parse(body);

		// Verify user owns the story
		const story = await getStoryById(validatedData.storyId, session.user.id);
		if (!story || story.authorId !== session.user.id) {
			return NextResponse.json(
				{ error: "Story not found or access denied" },
				{ status: 404 },
			);
		}

		const chapter = await createChapter(
			validatedData.storyId,
			session.user.id,
			validatedData,
		);
		return NextResponse.json({ chapter }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid input", details: error.issues },
				{ status: 400 },
			);
		}

		console.error("Error creating chapter:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
