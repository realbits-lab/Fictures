import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-better";
import {
    createInvalidationContext,
    getCacheInvalidationHeaders,
    invalidateEntityCache,
} from "@/lib/cache/unified-invalidation";
import { db } from "@/lib/db";
import { communityPosts, postLikes, users } from "@/lib/schemas/database";

/**
 * Get or create user for the current session
 * - If authenticated: return user
 * - If anonymous session exists: return anonymous user
 * - Otherwise: create new anonymous user
 */
async function getUserOrCreateAnonymous() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user) {
        return session.user;
    }

    // No session exists - create anonymous user
    const anonymousUserId = `anon_${nanoid()}`;
    const anonymousEmail = `${anonymousUserId}@anonymous.fictures.xyz`;

    const [anonymousUser] = await db
        .insert(users)
        .values({
            id: anonymousUserId,
            name: `Anonymous User`,
            email: anonymousEmail,
            isAnonymous: true,
            role: "reader",
        })
        .returning();

    // Create anonymous session
    await auth.api.signInAnonymous({
        headers: await headers(),
    });

    return anonymousUser;
}

/**
 * POST /api/community/posts/[postId]/like
 * Toggle like on a community post
 * Supports authenticated and anonymous users
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        // Get user or create anonymous
        const user = await getUserOrCreateAnonymous();

        const { postId } = await params;

        if (!postId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Post ID is required" },
                { status: 400 },
            );
        }

        const existingLike = await db
            .select()
            .from(postLikes)
            .where(
                and(
                    eq(postLikes.postId, postId),
                    eq(postLikes.userId, user.id),
                ),
            )
            .limit(1);

        if (existingLike.length > 0) {
            await db
                .delete(postLikes)
                .where(
                    and(
                        eq(postLikes.postId, postId),
                        eq(postLikes.userId, user.id),
                    ),
                );

            await db
                .update(communityPosts)
                .set({
                    likes: sql`${communityPosts.likes} - 1`,
                })
                .where(eq(communityPosts.id, postId));

            // ✅ CACHE INVALIDATION: Invalidate community caches after unlike
            const invalidationContext = createInvalidationContext({
                entityType: "like",
                entityId: postId,
                userId: user.id,
            });
            await invalidateEntityCache(invalidationContext);

            return NextResponse.json(
                {
                    success: true,
                    liked: false,
                    message: "Like removed",
                    isAnonymous: user.isAnonymous || false,
                },
                {
                    headers: getCacheInvalidationHeaders(invalidationContext),
                },
            );
        } else {
            await db.insert(postLikes).values({
                postId,
                userId: user.id,
            });

            await db
                .update(communityPosts)
                .set({
                    likes: sql`${communityPosts.likes} + 1`,
                })
                .where(eq(communityPosts.id, postId));

            // ✅ CACHE INVALIDATION: Invalidate community caches after like
            const invalidationContext = createInvalidationContext({
                entityType: "like",
                entityId: postId,
                userId: user.id,
            });
            await invalidateEntityCache(invalidationContext);

            return NextResponse.json(
                {
                    success: true,
                    liked: true,
                    message: "Like added",
                    isAnonymous: user.isAnonymous || false,
                },
                {
                    headers: getCacheInvalidationHeaders(invalidationContext),
                },
            );
        }
    } catch (error) {
        console.error("Error toggling post like:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to toggle like",
            },
            { status: 500 },
        );
    }
}
