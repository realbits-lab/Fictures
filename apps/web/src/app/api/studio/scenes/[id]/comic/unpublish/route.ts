import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/schemas/drizzle";

export const runtime = "nodejs";

/**
 * POST /api/scenes/[id]/comic/unpublish
 * Unpublish comic panels for a scene (set to draft status)
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

        // Check if comic is currently published
        if (existingScene.comicStatus !== "published") {
            return NextResponse.json(
                { error: "Comic is not currently published" },
                { status: 400 },
            );
        }

        // Update scene comic status to draft
        const [updatedScene] = await db
            .update(scenes)
            .set({
                comicStatus: "draft",
                comicUnpublishedAt: new Date().toISOString(),
                comicUnpublishedBy: session.user.id,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(scenes.id, id))
            .returning();

        console.log(
            `📝 Unpublished comic panels for scene: ${existingScene.title}`,
        );

        return NextResponse.json({
            success: true,
            message: "Comic panels unpublished successfully",
            scene: {
                id: updatedScene.id,
                title: updatedScene.title,
                comicStatus: updatedScene.comicStatus,
                comicUnpublishedAt: updatedScene.comicUnpublishedAt,
            },
        });
    } catch (error) {
        console.error("Error unpublishing comic:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
