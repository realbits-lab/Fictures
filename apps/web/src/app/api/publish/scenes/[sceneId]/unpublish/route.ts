import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unpublishScene } from "@/lib/services/scene-publishing";

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

        await unpublishScene(sceneId, session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to unpublish scene:", error);
        return NextResponse.json(
            { error: "Failed to unpublish scene" },
            { status: 500 },
        );
    }
}
