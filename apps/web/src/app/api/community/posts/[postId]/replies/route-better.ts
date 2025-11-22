import { and, desc, eq, sql } from "drizzle-orm";
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
import {
    communityPosts,
    communityReplies,
    users,
} from "@/lib/schemas/database";

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
 * GET /api/community/posts/[postId]/replies
 * Get all replies for a specific post
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const { postId } = await params;

        if (!postId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Post ID is required" },
                { status: 400 },
            );
        }

        const replies = await db
            .select({
                id: communityReplies.id,
                content: communityReplies.content,
                contentType: communityReplies.contentType,
                contentHtml: communityReplies.contentHtml,
                contentImages: communityReplies.contentImages,
                postId: communityReplies.postId,
                parentReplyId: communityReplies.parentReplyId,
                depth: communityReplies.depth,
                isEdited: communityReplies.isEdited,
                editCount: communityReplies.editCount,
                lastEditedAt: communityReplies.lastEditedAt,
                likes: communityReplies.likes,
                mentions: communityReplies.mentions,
                createdAt: communityReplies.createdAt,
                updatedAt: communityReplies.updatedAt,
                author: {
                    id: users.id,
                    name: users.name,
                    username: users.username,
                    image: users.image,
                    isAnonymous: users.isAnonymous,
                },
            })
            .from(communityReplies)
            .leftJoin(users, eq(communityReplies.authorId, users.id))
            .where(
                and(
                    eq(communityReplies.postId, postId),
                    eq(communityReplies.isDeleted, false),
                ),
            )
            .orderBy(desc(communityReplies.createdAt));

        return NextResponse.json({
            success: true,
            replies,
            total: replies.length,
        });
    } catch (error) {
        console.error("Error fetching post replies:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to fetch replies",
            },
            { status: 500 },
        );
    }
}

/**
 * POST /api/community/posts/[postId]/replies
 * Create a new reply to a post
 * Supports authenticated and anonymous users
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        // Get user or create anonymous
        const user = await getUserOrCreateAnonymous();

        const { postId } = await params;
        const body = await request.json();
        const {
            content,
            contentHtml,
            parentReplyId = null,
            mentions = [],
        } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Bad Request", message: "Content is required" },
                { status: 400 },
            );
        }

        let depth = 0;
        if (parentReplyId) {
            const parentReply = await db
                .select({ depth: communityReplies.depth })
                .from(communityReplies)
                .where(eq(communityReplies.id, parentReplyId))
                .limit(1);

            if (parentReply.length > 0) {
                depth = (parentReply[0].depth || 0) + 1;
            }
        }

        const reply = await db
            .insert(communityReplies)
            .values({
                id: nanoid(),
                content,
                contentType: "markdown",
                contentHtml,
                postId,
                authorId: user.id,
                parentReplyId,
                depth,
                mentions,
            })
            .returning();

        await db
            .update(communityPosts)
            .set({
                replies: sql`${communityPosts.replies} + 1`,
                lastActivityAt: new Date().toISOString(),
            })
            .where(eq(communityPosts.id, postId));

        // ✅ CACHE INVALIDATION: Invalidate community caches after reply creation
        const invalidationContext = createInvalidationContext({
            entityType: "comment",
            entityId: reply[0].id,
            userId: user.id,
            additionalData: { postId },
        });
        await invalidateEntityCache(invalidationContext);

        return NextResponse.json(
            {
                success: true,
                reply: reply[0],
                isAnonymous: user.isAnonymous || false,
            },
            {
                status: 201,
                headers: getCacheInvalidationHeaders(invalidationContext),
            },
        );
    } catch (error) {
        console.error("Error creating post reply:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to create reply",
            },
            { status: 500 },
        );
    }
}
