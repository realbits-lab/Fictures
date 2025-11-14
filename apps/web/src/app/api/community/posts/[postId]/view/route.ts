import { createHash } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communityPosts, postViews } from "@/lib/schemas/database";

/**
 * POST /api/community/posts/[postId]/view
 * Track a view on a community post
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const session = await auth();
        const { postId } = await params;

        if (!postId) {
            return NextResponse.json(
                { error: "Bad Request", message: "Post ID is required" },
                { status: 400 },
            );
        }

        const sessionId = request.cookies.get("sessionId")?.value || nanoid();
        const ip =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const ipHash = createHash("sha256").update(ip).digest("hex");

        const recentView = await db
            .select()
            .from(postViews)
            .where(
                and(
                    eq(postViews.postId, postId),
                    session?.user?.id
                        ? eq(postViews.userId, session.user.id)
                        : eq(postViews.sessionId, sessionId),
                    sql`${postViews.createdAt} > NOW() - INTERVAL '1 hour'`,
                ),
            )
            .limit(1);

        if (recentView.length > 0) {
            return NextResponse.json({
                success: true,
                tracked: false,
                message: "View already tracked recently",
            });
        }

        await db.insert(postViews).values({
            id: nanoid(),
            postId,
            userId: session?.user?.id || null,
            sessionId,
            ipHash,
        });

        await db
            .update(communityPosts)
            .set({
                views: sql`${communityPosts.views} + 1`,
            })
            .where(eq(communityPosts.id, postId));

        const response = NextResponse.json({
            success: true,
            tracked: true,
            message: "View tracked",
        });

        if (!request.cookies.get("sessionId")) {
            response.cookies.set("sessionId", sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365,
            });
        }

        return response;
    } catch (error) {
        console.error("Error tracking post view:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: "Failed to track view" },
            { status: 500 },
        );
    }
}
