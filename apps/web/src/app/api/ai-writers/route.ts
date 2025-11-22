import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiWriters } from "@/lib/schemas/database";
import { desc } from "drizzle-orm";

/**
 * GET /api/ai-writers
 * List all AI writers sorted by usage count
 */
export async function GET() {
    try {
        const writers = await db
            .select()
            .from(aiWriters)
            .orderBy(desc(aiWriters.usageCount))
            .limit(20);

        return NextResponse.json({
            success: true,
            data: writers,
        });
    } catch (error) {
        console.error("Failed to fetch AI writers:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch AI writers",
            },
            { status: 500 },
        );
    }
}
