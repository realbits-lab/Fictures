import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { characters as charactersTable, stories } from "@/lib/db/schema";

export const runtime = "nodejs";

// GET /api/stories/[id]/characters - Get characters for a story
export async function GET(
    request: NextRequest,
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
