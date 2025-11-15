import { and, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sceneDislikes, sceneLikes, scenes } from "@/lib/schemas/database";

export const runtime = "nodejs";

// POST /api/scenes/[id]/dislike - Toggle dislike on a scene
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: sceneId } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Check if scene exists
        const [scene] = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, sceneId))
            .limit(1);

        if (!scene) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // Check existing like and dislike
        const [existingLike] = await db
            .select()
            .from(sceneLikes)
            .where(
                and(
                    eq(sceneLikes.sceneId, sceneId),
                    eq(sceneLikes.userId, session.user.id),
                ),
            )
            .limit(1);

        const [existingDislike] = await db
            .select()
            .from(sceneDislikes)
            .where(
                and(
                    eq(sceneDislikes.sceneId, sceneId),
                    eq(sceneDislikes.userId, session.user.id),
                ),
            )
            .limit(1);

        if (existingDislike) {
            // Remove dislike
            await db
                .delete(sceneDislikes)
                .where(
                    and(
                        eq(sceneDislikes.sceneId, sceneId),
                        eq(sceneDislikes.userId, session.user.id),
                    ),
                );

            // Get updated counts
            const [likeCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(sceneLikes)
                .where(eq(sceneLikes.sceneId, sceneId));

            const [dislikeCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(sceneDislikes)
                .where(eq(sceneDislikes.sceneId, sceneId));

            return NextResponse.json({
                liked: !!existingLike,
                disliked: false,
                likeCount: Number(likeCount.count),
                dislikeCount: Number(dislikeCount.count),
            });
        } else {
            // Remove like if exists
            if (existingLike) {
                await db
                    .delete(sceneLikes)
                    .where(
                        and(
                            eq(sceneLikes.sceneId, sceneId),
                            eq(sceneLikes.userId, session.user.id),
                        ),
                    );
            }

            // Add dislike
            await db.insert(sceneDislikes).values({
                sceneId,
                userId: session.user.id,
                createdAt: new Date().toISOString(),
            });

            // Get updated counts
            const [likeCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(sceneLikes)
                .where(eq(sceneLikes.sceneId, sceneId));

            const [dislikeCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(sceneDislikes)
                .where(eq(sceneDislikes.sceneId, sceneId));

            return NextResponse.json({
                liked: false,
                disliked: true,
                likeCount: Number(likeCount.count),
                dislikeCount: Number(dislikeCount.count),
            });
        }
    } catch (error) {
        console.error("Error toggling scene dislike:", error);
        return NextResponse.json(
            { error: "Failed to toggle dislike" },
            { status: 500 },
        );
    }
}
