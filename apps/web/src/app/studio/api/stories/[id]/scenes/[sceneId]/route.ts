import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string; sceneId: string }> },
) {
    const params = await context.params;
    const { id: storyId, sceneId } = params;

    try {
        const scene = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, sceneId))
            .limit(1);

        if (!scene || scene.length === 0) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({ scene: scene[0] });
    } catch (error) {
        console.error("Failed to fetch scene:", error);
        return NextResponse.json(
            { error: "Failed to fetch scene" },
            { status: 500 },
        );
    }
}
