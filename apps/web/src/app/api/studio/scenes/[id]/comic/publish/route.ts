import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, comicPanels, scenes, stories } from "@/lib/schemas/drizzle";

export const runtime = "nodejs";

/**
 * POST /api/scenes/[id]/comic/publish
 * Publish comic panels for a scene
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get scene and verify ownership
        const [existingScene] = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, id));
        if (!existingScene) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // Check chapter and story ownership
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, existingScene.chapterId));
        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId));
        if (!story || story.authorId !== session.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // Verify comic panels exist
        const panels = await db.query.comicPanels.findMany({
            where: eq(comicPanels.sceneId, id),
        });

        if (panels.length === 0) {
            return NextResponse.json(
                {
                    error: "No comic panels to publish. Generate comic panels first.",
                },
                { status: 400 },
            );
        }

        // Update scene comic status to published
        const [updatedScene] = await db
            .update(scenes)
            .set({
                comicStatus: "published",
                comicPublishedAt: new Date().toISOString(),
                comicPublishedBy: session.user.id,
                comicPanelCount: panels.length,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(scenes.id, id))
            .returning();

        console.log(
            `✅ Published ${panels.length} comic panels for scene: ${existingScene.title}`,
        );

        return NextResponse.json({
            success: true,
            message: "Comic panels published successfully",
            scene: {
                id: updatedScene.id,
                title: updatedScene.title,
                comicStatus: updatedScene.comicStatus,
                comicPanelCount: updatedScene.comicPanelCount,
                comicPublishedAt: updatedScene.comicPublishedAt,
            },
        });
    } catch (error) {
        console.error("Error publishing comic:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
