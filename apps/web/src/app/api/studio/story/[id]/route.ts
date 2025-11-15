import { del } from "@vercel/blob";
import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoryById, getStoryChapters, updateStory } from "@/lib/db/queries";
import {
    chapters,
    characters,
    communityPosts,
    communityReplies,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";

export const runtime = "nodejs";

const updateStorySchema = z.object({
    title: z.string().min(1).max(255).optional(),
    summary: z.string().optional(),
    genre: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    isPublic: z.boolean().optional(),
    coverImage: z.string().url().optional(),
});

// GET /api/stories/[id] - Get story details with chapters
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const session = await auth();

        const story = await getStoryById(id, session?.user?.id);
        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        const chapters = await getStoryChapters(id, session?.user?.id);

        return NextResponse.json({ story, chapters });
    } catch (error) {
        console.error("Error fetching story:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// PATCH /api/stories/[id] - Update story
export async function PATCH(
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

        const body = await request.json();
        const validatedData = updateStorySchema.parse(body);

        const story = await updateStory(id, session.user.id, validatedData);
        if (!story) {
            return NextResponse.json(
                { error: "Story not found or access denied" },
                { status: 404 },
            );
        }

        return NextResponse.json({ story });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input", details: error.issues },
                { status: 400 },
            );
        }

        console.error("Error updating story:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// DELETE /api/stories/[id] - Delete story and all related data
export async function DELETE(
    _request: NextRequest,
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

        // Verify story exists and user owns it
        const story = await getStoryById(id, session.user.id);
        if (!story) {
            return NextResponse.json(
                { error: "Story not found or access denied" },
                { status: 404 },
            );
        }

        console.log(`Starting deletion of story ${id} (${story.title})`);

        // Collect all image URLs to delete from Vercel Blob
        const imageUrls: string[] = [];

        // Get story cover image if it exists in hnsData
        if (
            (story as any).hnsData &&
            typeof (story as any).hnsData === "object" &&
            "story" in (story as any).hnsData
        ) {
            const storyData = (story as any).hnsData.story as any;
            if (storyData?.coverImageUrl) {
                imageUrls.push(storyData.coverImageUrl);
            }
        }

        // Get all parts for this story
        const storyParts = await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, id));

        const partIds = storyParts.map((p) => p.id);
        console.log(`Found ${partIds.length} parts to delete`);

        // Get all chapters (both in parts and standalone)
        const storyChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, id));

        const chapterIds = storyChapters.map((c) => c.id);
        console.log(`Found ${chapterIds.length} chapters to delete`);

        // Get all scenes from these chapters
        let storyScenes: any[] = [];
        if (chapterIds.length > 0) {
            storyScenes = await db
                .select()
                .from(scenes)
                .where(inArray(scenes.chapterId, chapterIds));

            console.log(`Found ${storyScenes.length} scenes to delete`);

            // Collect scene images from hnsData
            for (const scene of storyScenes) {
                if (
                    scene.hnsData &&
                    typeof scene.hnsData === "object" &&
                    "scene_image_url" in scene.hnsData
                ) {
                    const sceneData = scene.hnsData as any;
                    if (sceneData.scene_image_url) {
                        imageUrls.push(sceneData.scene_image_url);
                    }
                }
            }
        }

        // Get all characters and their images
        const storyCharacters = await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, id));

        console.log(`Found ${storyCharacters.length} characters to delete`);
        for (const character of storyCharacters) {
            if (character.imageUrl) {
                imageUrls.push(character.imageUrl);
            }
        }

        // Get all settings and their images
        const storySettings = await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, id));

        console.log(`Found ${storySettings.length} settings to delete`);
        for (const setting of storySettings) {
            if (setting.imageUrl) {
                imageUrls.push(setting.imageUrl);
            }
        }

        // Get all community posts for this story (optional - table may not exist)
        let storyCommunityPosts: any[] = [];
        let postIds: string[] = [];

        try {
            storyCommunityPosts = await db
                .select()
                .from(communityPosts)
                .where(eq(communityPosts.storyId, id));

            postIds = storyCommunityPosts.map((p) => p.id);
            console.log(`Found ${postIds.length} community posts to delete`);
        } catch (_error) {
            console.log(
                "⚠️ Community posts table not found - skipping community data deletion",
            );
        }

        // Delete all related data in correct order (respecting foreign key constraints)

        // 1. Delete community replies (depends on posts)
        if (postIds.length > 0) {
            try {
                await db
                    .delete(communityReplies)
                    .where(inArray(communityReplies.postId, postIds));
                console.log("✓ Deleted community replies");
            } catch (error) {
                console.log(
                    "⚠️ Could not delete community replies:",
                    error instanceof Error ? error.message : "Unknown error",
                );
            }
        }

        // 2. Delete community posts
        if (postIds.length > 0) {
            try {
                await db
                    .delete(communityPosts)
                    .where(eq(communityPosts.storyId, id));
                console.log("✓ Deleted community posts");
            } catch (error) {
                console.log(
                    "⚠️ Could not delete community posts:",
                    error instanceof Error ? error.message : "Unknown error",
                );
            }
        }

        // 3. Delete scenes (depends on chapters)
        if (chapterIds.length > 0) {
            await db
                .delete(scenes)
                .where(inArray(scenes.chapterId, chapterIds));
            console.log("✓ Deleted scenes");
        }

        // 4. Delete chapters (depends on story and parts)
        await db.delete(chapters).where(eq(chapters.storyId, id));
        console.log("✓ Deleted chapters");

        // 5. Delete parts (depends on story)
        if (partIds.length > 0) {
            await db.delete(parts).where(eq(parts.storyId, id));
            console.log("✓ Deleted parts");
        }

        // 6. Delete characters (depends on story)
        await db.delete(characters).where(eq(characters.storyId, id));
        console.log("✓ Deleted characters");

        // 7. Delete settings (depends on story)
        await db.delete(settings).where(eq(settings.storyId, id));
        console.log("✓ Deleted settings");

        // 8. Delete the story itself
        await db.delete(stories).where(eq(stories.id, id));
        console.log("✓ Deleted story");

        // 10. Delete all images from Vercel Blob
        console.log(`Deleting ${imageUrls.length} images from Vercel Blob...`);
        const deletionResults = await Promise.allSettled(
            imageUrls.map((url) =>
                del(url).catch((err) => {
                    console.error(`Failed to delete image ${url}:`, err);
                    return null;
                }),
            ),
        );

        const successfulDeletions = deletionResults.filter(
            (r) => r.status === "fulfilled",
        ).length;
        const failedDeletions = deletionResults.filter(
            (r) => r.status === "rejected",
        ).length;
        console.log(
            `✓ Deleted ${successfulDeletions} images (${failedDeletions} failed)`,
        );

        console.log(`✅ Successfully deleted story ${id} and all related data`);

        return NextResponse.json({
            message: "Story deleted successfully",
            deleted: {
                story: 1,
                parts: partIds.length,
                chapters: chapterIds.length,
                scenes: storyScenes.length,
                characters: storyCharacters.length,
                places: storySettings.length,
                communityPosts: postIds.length,
                images: successfulDeletions,
            },
        });
    } catch (error) {
        console.error("Error deleting story:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
