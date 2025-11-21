import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characters as charactersTable } from "@/lib/schemas/database";

export const runtime = "nodejs";

// GET /api/stories/[id]/characters - Get characters for a story
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // Fetch characters for this story
        const characters = await db
            .select()
            .from(charactersTable)
            .where(eq(charactersTable.storyId, id))
            .orderBy(charactersTable.createdAt);

        return NextResponse.json({ characters });
    } catch (error) {
        console.error("Error fetching characters:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
