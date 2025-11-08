import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parts, stories } from "@/lib/db/schema";

// GET /api/parts/[id]/write - Get part data for writing
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Get part with hnsData
		const [part] = await db.select().from(parts).where(eq(parts.id, id));

		if (!part) {
			return NextResponse.json({ error: "Part not found" }, { status: 404 });
		}

		// Check ownership through story
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, part.storyId));
		if (!story || story.authorId !== session.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Parse HNS data if it exists
		let parsedHnsData = null;
		if ((part as any).hnsData) {
			try {
				parsedHnsData =
					typeof (part as any).hnsData === "object"
						? (part as any).hnsData
						: JSON.parse((part as any).hnsData as any);
			} catch (error) {
				console.error("Failed to parse part HNS data:", error);
			}
		}

		return NextResponse.json({
			part: {
				...part,
				hnsData: parsedHnsData,
			},
		});
	} catch (error) {
		console.error("Error fetching part data:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/parts/[id]/write - Update part HNS data
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const { hnsData } = await request.json();

		if (!hnsData) {
			return NextResponse.json(
				{ error: "Part data is required (hnsData)" },
				{ status: 400 },
			);
		}

		// Get part and verify ownership
		const [existingPart] = await db
			.select()
			.from(parts)
			.where(eq(parts.id, id));
		if (!existingPart) {
			return NextResponse.json({ error: "Part not found" }, { status: 404 });
		}

		// Check story ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, existingPart.storyId));
		if (!story || story.authorId !== session.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Update part with new HNS data
		// Drizzle ORM will handle JSON serialization automatically
		await db
			.update(parts)
			.set({
				...(hnsData ? ({ hnsData } as any) : {}),
				updatedAt: new Date().toISOString(),
			})
			.where(eq(parts.id, id));

		return NextResponse.json({
			success: true,
			message: "Part data saved successfully",
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error saving part data:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
