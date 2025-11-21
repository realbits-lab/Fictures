import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings as settingsTable } from "@/lib/schemas/database";

export const runtime = "nodejs";

// GET /api/stories/[id]/settings - Get settings/places for a story
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        // Fetch settings for this story
        const settings = await db
            .select()
            .from(settingsTable)
            .where(eq(settingsTable.storyId, id))
            .orderBy(settingsTable.createdAt);

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
