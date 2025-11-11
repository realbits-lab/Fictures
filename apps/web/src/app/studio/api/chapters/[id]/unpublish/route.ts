import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateChapter } from "@/lib/db/queries";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: chapterId } = await params;

		// Update the chapter status to completed (unpublished)
		const updatedChapter = await updateChapter(chapterId, session.user.id, {
			status: "writing",
			publishedAt: undefined,
		});

		if (!updatedChapter) {
			return NextResponse.json(
				{ error: "Chapter not found or access denied" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			success: true,
			chapter: updatedChapter,
			message: "Chapter unpublished successfully!",
		});
	} catch (error) {
		console.error("Error unpublishing chapter:", error);
		return NextResponse.json(
			{ error: "Failed to unpublish chapter" },
			{ status: 500 },
		);
	}
}
