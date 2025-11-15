/**
 * Comic Panels Retrieval API Endpoint
 *
 * GET /api/comics/{sceneId}/panels
 *
 * Retrieves all comic panels for a specific scene, including layout information.
 */

import { asc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comicPanels, scenes } from "@/lib/schemas/database";
import {
    calculateTotalHeight,
    estimateReadingTime,
} from "@/lib/services/comic-layout";

interface RouteContext {
    params: Promise<{
        sceneId: string;
    }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
    try {
        const { sceneId } = await context.params;

        // Fetch scene to verify ownership
        const scene = await db.query.scenes.findFirst({
            where: eq(scenes.id, sceneId),
            with: {
                chapter: {
                    with: {
                        story: true,
                    },
                },
            },
        });

        if (!scene || !scene.chapter) {
            return new Response(JSON.stringify({ error: "Scene not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check if story is published or user is owner/admin
        const session = await auth();
        // Note: TypeScript doesn't infer nested 'with' relationships properly
        const story = scene.chapter.story as
            | typeof scene.chapter.story
            | undefined;

        if (!story) {
            return new Response(JSON.stringify({ error: "Story not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Compare user IDs for ownership check
        const isOwner = session?.user?.id === story.authorId;

        // Check if user is admin
        const isAdmin =
            session?.user?.role === "manager" ||
            session?.user?.role === "admin";

        // Check if story is public (using is_public from database)
        const isPublished = story.isPublic === true || story.is_public === true;

        if (!isPublished && !isOwner && !isAdmin) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch all panels for this scene, ordered by panel number
        const panels = await db.query.comicPanels.findMany({
            where: eq(comicPanels.sceneId, sceneId),
            orderBy: [asc(comicPanels.panelNumber)],
        });

        if (panels.length === 0) {
            return new Response(
                JSON.stringify({
                    sceneId,
                    panels: [],
                    metadata: {
                        total_panels: 0,
                        total_height: 0,
                        estimated_reading_time: "0s",
                    },
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // Calculate reading time
        const readingTime = estimateReadingTime(
            panels.map((p) => ({
                dialogue: (p.dialogue as Array<{ text: string }>) || [],
                sfx: (p.sfx as Array<{ text: string }>) || [],
            })),
        );

        // Calculate total height with static 24px spacing (matches viewer)
        const totalHeight = calculateTotalHeight(panels);

        // Prepare response
        const response = {
            sceneId,
            sceneTitle: scene.title,
            panels: panels.map((panel) => ({
                id: panel.id,
                panel_number: panel.panelNumber,
                shot_type: panel.shotType,
                image_url: panel.imageUrl,
                image_variants: panel.imageVariants,
                narrative: panel.narrative,
                dialogue: panel.dialogue,
                sfx: panel.sfx,
                description: panel.description,
                metadata: panel.metadata,
            })),
            metadata: {
                total_panels: panels.length,
                total_height: totalHeight,
                estimated_reading_time: readingTime.formatted,
            },
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error("Panel retrieval API error:", error);
        return new Response(
            JSON.stringify({
                error: "Internal server error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
