import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/db/schema";

// GET /api/scenes/[id]/write - Get scene data for writing
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        // Get scene with hnsData
        const [scene] = await db.select().from(scenes).where(eq(scenes.id, id));

        if (!scene) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // Get chapter to check story ownership
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, scene.chapterId));
        if (!chapter) {
            return NextResponse.json(
                { error: "Chapter not found" },
                { status: 404 },
            );
        }

        // Check ownership through story
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

        // Parse HNS data if it exists
        let parsedHnsData = null;
        if ((scene as any).hnsData) {
            try {
                parsedHnsData =
                    typeof (scene as any).hnsData === "object"
                        ? (scene as any).hnsData
                        : JSON.parse((scene as any).hnsData as any);
            } catch (error) {
                console.error("Failed to parse scene HNS data:", error);
            }
        }

        return NextResponse.json({
            scene: {
                ...scene,
                hnsData: parsedHnsData,
            },
        });
    } catch (error) {
        console.error("Error fetching scene data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// PATCH /api/scenes/[id]/write - Update scene HNS data
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        const { hnsData } = await request.json();

        if (!hnsData) {
            return NextResponse.json(
                { error: "Scene data is required (hnsData)" },
                { status: 400 },
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

        // Get chapter to check story ownership
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

        // Check story ownership
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

        // Update scene with new HNS data
        // Drizzle ORM will handle JSON serialization automatically
        await db
            .update(scenes)
            .set({
                ...(hnsData ? ({ hnsData } as any) : {}),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(scenes.id, id));

        return NextResponse.json({
            success: true,
            message: "Scene data saved successfully",
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error saving scene data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
