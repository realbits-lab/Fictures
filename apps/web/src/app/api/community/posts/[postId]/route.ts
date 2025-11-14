import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts } from "@/lib/schemas/database";

/**
 * DELETE /api/community/posts/[postId]
 * Delete a community post (soft delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                    message: "You must be logged in to delete posts",
                },
                { status: 401 },
            );
        }

        const { postId } = await params;

        if (!postId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Post ID is required" },
                { status: 400 },
            );
        }

        // Check if post exists and user is the author
        const existingPost = await db
            .select({ authorId: communityPosts.authorId })
            .from(communityPosts)
            .where(
                and(
                    eq(communityPosts.id, postId),
                    eq(communityPosts.isDeleted, false),
                ),
            )
            .limit(1);

        if (existingPost.length === 0) {
            return NextResponse.json(
                { error: "Not Found", message: "Post not found" },
                { status: 404 },
            );
        }

        // Check authorization - only post author can delete
        if (existingPost[0].authorId !== session.user.id) {
            return NextResponse.json(
                {
                    error: "Forbidden",
                    message: "You can only delete your own posts",
                },
                { status: 403 },
            );
        }

        // Soft delete the post
        await db
            .update(communityPosts)
            .set({
                isDeleted: true,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(communityPosts.id, postId));

        return NextResponse.json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting community post:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: "Failed to delete post",
            },
            { status: 500 },
        );
    }
}
