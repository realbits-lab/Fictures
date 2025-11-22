import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth/permissions";
import { generateEditorInsights } from "@/lib/services/insights";

/**
 * POST /api/analysis/insights/editor
 * Generate AI Editor insights for community engagement and retention
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

        // Generate editor insights for specific story or all user stories
        await generateEditorInsights({
            storyId: storyId || undefined,
            userId: !storyId ? session.user.id : undefined,
        });

        return NextResponse.json({
            success: true,
            message: "Editor insights generated successfully",
        });
    } catch (error) {
        console.error("Failed to generate editor insights:", error);
        return NextResponse.json(
            {
                error: "Failed to generate editor insights",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
