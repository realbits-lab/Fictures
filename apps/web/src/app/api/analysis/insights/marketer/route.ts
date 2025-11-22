import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { stories } from "@/lib/schemas/database";
import { generateMarketerInsights } from "@/lib/services/insights";

/**
 * POST /api/analysis/insights/marketer
 * Generate AI Marketer insights for ad optimization and revenue growth
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        if (!hasAnyRole(session, ["writer", "manager"])) {
            return NextResponse.json(
                { error: "Forbidden: Writer or Manager role required" },
                { status: 403 },
            );
        }

        const body = await request.json();
        const { storyId } = body;

        if (!storyId) {
            return NextResponse.json(
                { error: "Story ID is required" },
                { status: 400 },
            );
        }

        // Verify user owns the story
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden: You don't own this story" },
                { status: 403 },
            );
        }

        // Generate marketer insights
        await generateMarketerInsights({ storyId });

        return NextResponse.json({
            success: true,
            message: "Marketer insights generated successfully",
        });
    } catch (error) {
        console.error("Failed to generate marketer insights:", error);
        return NextResponse.json(
            {
                error: "Failed to generate marketer insights",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
