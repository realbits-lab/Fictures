import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { publishScene } from "@/lib/services/scene-publishing";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sceneId: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { sceneId } = await params;
        const body = await request.json();
        const { visibility = "public", scheduledFor } = body;

        await publishScene({
            sceneId,
            publishedBy: session.user.id,
            visibility,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to publish scene:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to publish scene",
            },
            { status: 500 },
        );
    }
}
