import { createHash } from "crypto";
import { and, desc, eq, isNull, not } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCache } from "@/lib/cache/redis-cache";
import { db } from "@/lib/db";
import { comments, stories, users } from "@/lib/schemas/drizzle";

export const runtime = "nodejs";

// Cache TTL configuration
const CACHE_TTL = {
    PUBLISHED_CONTENT: 600, // 10 minutes for published stories (public content)
    PRIVATE_CONTENT: 180, // 3 minutes for private content
};

interface Comment {
    id: string;
    content: string;
    userId: string;
    userName: string | null;
    userImage: string | null;
    storyId: string;
    chapterId: string | null;
    sceneId: string | null;
    parentCommentId: string | null;
    depth: number;
    likeCount: number;
    replyCount: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    replies?: Comment[];
}

const createCommentSchema = z.object({
    content: z.string().min(1).max(5000),
    chapterId: z.string().optional(),
    sceneId: z.string().optional(),
    parentCommentId: z.string().optional(),
});

// GET /api/stories/[id]/comments - Fetch comments for a story with Redis caching
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const startTime = Date.now();

    try {
        const { id: storyId } = await params;
        const { searchParams } = new URL(request.url);
        const chapterId = searchParams.get("chapterId");
        const sceneId = searchParams.get("sceneId");

        // Build cache key based on scope
        let cacheKey = `comments:story:${storyId}`;
        if (sceneId) {
            cacheKey = `comments:scene:${sceneId}`;
        } else if (chapterId) {
            cacheKey = `comments:chapter:${chapterId}`;
        }

        // Check if story is published to determine cache strategy
        const [story] = await db
            .select({ status: stories.status })
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        const isPublished = story?.status === "published";
        const publicCacheKey = `${cacheKey}:public`;

        // Try public cache first (for published stories)
        if (isPublished) {
            const cached = await getCache().get<{ comments: Comment[] }>(
                publicCacheKey,
            );
            if (cached) {
                const duration = Date.now() - startTime;
                console.log(
                    `[Comments Cache] ✅ HIT public: ${cacheKey} (${duration}ms)`,
                );

                return new NextResponse(JSON.stringify(cached), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Cache-Status": "HIT",
                        "X-Cache-Type": "public",
                        "Cache-Control": "public, max-age=600", // 10 minutes CDN cache
                        "X-Server-Timing": `total;dur=${duration}`,
                    },
                });
            }
        }

        // Build the where clause
        let whereClause = eq(comments.storyId, storyId);

        if (sceneId) {
            whereClause = and(whereClause, eq(comments.sceneId, sceneId))!;
        } else if (chapterId) {
            whereClause = and(whereClause, eq(comments.chapterId, chapterId))!;
        }

        // Fetch ALL comments (both deleted and non-deleted) to preserve thread structure
        // Deleted comments will be shown as "[deleted]" placeholders in the UI
        const allComments = await db
            .select({
                id: comments.id,
                content: comments.content,
                userId: comments.userId,
                userName: users.name,
                userImage: users.image,
                storyId: comments.storyId,
                chapterId: comments.chapterId,
                sceneId: comments.sceneId,
                parentCommentId: comments.parentCommentId,
                depth: comments.depth,
                likeCount: comments.likeCount,
                replyCount: comments.replyCount,
                isEdited: comments.isEdited,
                isDeleted: comments.isDeleted,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
            })
            .from(comments)
            .leftJoin(users, eq(comments.userId, users.id))
            .where(whereClause)
            .orderBy(comments.createdAt);

        if (allComments.length === 0) {
            const emptyResult = { comments: [] };

            // Cache empty result too (prevents repeated queries for stories with no comments)
            if (isPublished) {
                await getCache().set(
                    publicCacheKey,
                    emptyResult,
                    CACHE_TTL.PUBLISHED_CONTENT,
                );
            }

            return NextResponse.json(emptyResult);
        }

        // Separate top-level comments and replies
        const topLevelComments = allComments.filter((c) => !c.parentCommentId);
        const replies = allComments.filter((c) => c.parentCommentId);

        // Build a map of comment ID to comment for quick lookups
        const commentMap = new Map<string, Comment>();
        allComments.forEach((comment) => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Build nested structure: attach replies to their parents
        replies.forEach((reply) => {
            const parent = commentMap.get(reply.parentCommentId!);
            if (parent) {
                if (!parent.replies) {
                    parent.replies = [];
                }
                parent.replies.push(commentMap.get(reply.id)!);
            }
        });

        // Get top-level comments with their nested replies, sorted by creation date (newest first)
        const result = topLevelComments
            .map((c) => commentMap.get(c.id)!)
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );

        const response = { comments: result };
        const duration = Date.now() - startTime;

        // Generate ETag based on comments data
        const contentForHash = JSON.stringify({
            commentsData: result.map((comment) => ({
                id: comment.id,
                content: comment.content,
                likeCount: comment.likeCount,
                replyCount: comment.replyCount,
                isEdited: comment.isEdited,
                updatedAt: comment.updatedAt,
            })),
            totalCount: result.length,
            cacheKey,
        });
        const etag = `"${createHash("md5").update(contentForHash).digest("hex")}"`;

        // Check if client has the same version (ETag match)
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            console.log(
                `[Comments ETag] ✅ 304 Not Modified: ${cacheKey} (${duration}ms)`,
            );
            return new NextResponse(null, {
                status: 304,
                headers: {
                    ETag: etag,
                    "X-Cache-Status": "HIT",
                    "X-Cache-Type": "etag",
                    "X-Server-Timing": `total;dur=${duration}`,
                },
            });
        }

        // Cache the result
        if (isPublished) {
            await getCache().set(
                publicCacheKey,
                response,
                CACHE_TTL.PUBLISHED_CONTENT,
            );
            console.log(
                `[Comments Cache] 💾 SET public: ${cacheKey} (${duration}ms, ${result.length} comments)`,
            );
        }

        return new NextResponse(JSON.stringify(response), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                ETag: etag,
                "X-Cache-Status": "MISS",
                "X-Cache-Type": isPublished ? "public" : "none",
                "Cache-Control": isPublished
                    ? "public, max-age=600"
                    : "private, max-age=180",
                "X-Server-Timing": `total;dur=${duration}`,
            },
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 },
        );
    }
}

// POST /api/stories/[id]/comments - Create a new comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: storyId } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const validatedData = createCommentSchema.parse(body);

        // Calculate depth if this is a reply
        let depth = 0;
        if (validatedData.parentCommentId) {
            const parentComment = await db
                .select({ depth: comments.depth })
                .from(comments)
                .where(eq(comments.id, validatedData.parentCommentId))
                .limit(1);

            if (parentComment.length === 0) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 },
                );
            }

            depth = parentComment[0].depth + 1;

            // Enforce max depth of 3 as per spec
            if (depth > 3) {
                return NextResponse.json(
                    { error: "Maximum comment depth exceeded" },
                    { status: 400 },
                );
            }

            // Increment reply count of parent comment
            await db
                .update(comments)
                .set({
                    replyCount: parentComment[0].depth + 1,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(comments.id, validatedData.parentCommentId));
        }

        // Create the comment
        const commentId = nanoid();
        const [newComment] = await db
            .insert(comments)
            .values({
                id: commentId,
                content: validatedData.content,
                userId: session.user.id,
                storyId,
                chapterId: validatedData.chapterId || null,
                sceneId: validatedData.sceneId || null,
                parentCommentId: validatedData.parentCommentId || null,
                depth,
                likeCount: 0,
                replyCount: 0,
                isEdited: false,
                isDeleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .returning();

        // Fetch user info to return with comment
        const [user] = await db
            .select({
                name: users.name,
                image: users.image,
            })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);

        // Invalidate cache for this story/chapter/scene
        // Build cache keys to invalidate
        const cacheKeysToInvalidate: string[] = [
            `comments:story:${storyId}:public`,
        ];

        if (validatedData.sceneId) {
            cacheKeysToInvalidate.push(
                `comments:scene:${validatedData.sceneId}:public`,
            );
        }

        if (validatedData.chapterId) {
            cacheKeysToInvalidate.push(
                `comments:chapter:${validatedData.chapterId}:public`,
            );
        }

        // Invalidate all relevant caches
        await Promise.all(
            cacheKeysToInvalidate.map((key) => getCache().del(key)),
        );

        console.log(
            `[Comments Cache] 🔄 Invalidated caches: ${cacheKeysToInvalidate.join(", ")}`,
        );

        return NextResponse.json(
            {
                comment: {
                    ...newComment,
                    userName: user?.name,
                    userImage: user?.image,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            );
        }

        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 },
        );
    }
}
