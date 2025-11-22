import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiDesigners } from "@/lib/schemas/database";
import { desc } from "drizzle-orm";

/**
 * GET /api/ai-designers
 * List all AI designers sorted by usage count
 */
export async function GET() {
    try {
        const designers = await db
            .select()
            .from(aiDesigners)
            .orderBy(desc(aiDesigners.usageCount))
            .limit(20);

        return NextResponse.json({
            success: true,
            data: designers,
        });
    } catch (error) {
        console.error("Failed to fetch AI designers:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch AI designers",
            },
            { status: 500 },
        );
    }
}
