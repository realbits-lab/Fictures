import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createInvalidationContext,
    getCacheInvalidationHeaders,
    invalidateEntityCache,
} from "@/lib/cache/unified-invalidation";
import { db } from "@/lib/db";
import { communityPosts } from "@/lib/db/schema";

/**
 * POST /api/community/posts
 * Create a new community post
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                    message: "You must be logged in to create posts",
                },
                { status: 401 },
            );
        }

        const body = await request.json();
        const {
            title,
            content,
            contentHtml,
            storyId,
            type = "discussion",
            tags = [],
            mentions = [],
        } = body;

        if (!title || !content || !storyId) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "Title, content, and storyId are required",
                },
                { status: 400 },
            );
        }

        if (title.length > 255) {
            return NextResponse.json(
                {
                    error: "Bad Request",
                    message: "Title must be 255 characters or less",
                },
                { status: 400 },
            );
        }

        const post = await db
            .insert(communityPosts)
            .values({
                id: nanoid(),
                title,
                content,
                contentType: "markdown",
                contentHtml,
                storyId,
                authorId: session.user.id,
                type,
                tags,
                mentions,
                moderationStatus: "approved",
            })
            .returning();

        // ✅ CACHE INVALIDATION: Invalidate community caches after post creation
        const invalidationContext = createInvalidationContext({
            entityType: "post",
            entityId: post[0].id,
            storyId,
            userId: session.user.id,
        });
        await invalidateEntityCache(invalidationContext);

        return NextResponse.json(
            {
                success: true,
                post: post[0],
            },
            {
                status: 201,
                headers: getCacheInvalidationHeaders(invalidationContext),
            },
        );
    } catch (error) {
        console.error("Error creating community post:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to create post",
            },
            { status: 500 },
        );
    }
}
