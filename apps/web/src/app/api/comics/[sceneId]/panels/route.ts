/**
 * GET /api/comics/[sceneId]/panels
 *
 * Returns comic panel data for a scene from the comicToonplay field.
 * Used by the ComicViewer component for rendering panels.
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scenes } from "@/lib/schemas/database";

interface RouteParams {
    params: Promise<{ sceneId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    const { sceneId } = await params;

    if (!sceneId) {
        return NextResponse.json(
            { error: "Scene ID is required" },
            { status: 400 },
        );
    }

    try {
        // 1. Fetch scene with toonplay data
        const [scene] = await db
            .select({
                id: scenes.id,
                title: scenes.title,
                comicToonplay: scenes.comicToonplay,
                comicStatus: scenes.comicStatus,
                comicPanelCount: scenes.comicPanelCount,
                imageUrl: scenes.imageUrl,
            })
            .from(scenes)
            .where(eq(scenes.id, sceneId))
            .limit(1);

        if (!scene) {
            return NextResponse.json(
                { error: "Scene not found" },
                { status: 404 },
            );
        }

        // 2. Check if comic is published
        if (scene.comicStatus !== "published") {
            return NextResponse.json(
                { error: "Comic not published" },
                { status: 403 },
            );
        }

        // 3. Parse toonplay data
        const toonplay = scene.comicToonplay as any;

        if (!toonplay || !toonplay.panels) {
            return NextResponse.json(
                { error: "No comic panels available" },
                { status: 404 },
            );
        }

        // 4. Transform panels to expected format
        const panels = toonplay.panels.map((panel: any, index: number) => ({
            id: panel.id || `panel_${index + 1}`,
            panel_number: panel.panel_number || index + 1,
            shot_type: panel.shot_type || "medium",
            image_url: panel.image_url || scene.imageUrl,
            image_variants: panel.image_variants || null,
            narrative: panel.narrative || null,
            dialogue: panel.dialogue || [],
            sfx: panel.sfx || [],
            description: panel.description || panel.summary || null,
            layout: panel.layout || {
                y_position: index * 100,
                height: 100,
                total_height: toonplay.panels.length * 100,
            },
        }));

        // 5. Calculate metadata
        const totalHeight = panels.reduce(
            (sum: number, panel: any) => sum + (panel.layout?.height || 100),
            0,
        );
        const estimatedReadingTime = `${Math.max(1, Math.ceil(panels.length * 0.5))} min`;
        const pacing =
            panels.length <= 4 ? "slow" : panels.length <= 8 ? "moderate" : "fast";

        // 6. Return structured response
        return NextResponse.json({
            sceneId: scene.id,
            sceneTitle: scene.title,
            panels,
            layout: {
                total_height: totalHeight,
            },
            metadata: {
                total_panels: panels.length,
                total_height: totalHeight,
                estimated_reading_time: estimatedReadingTime,
                pacing,
            },
        });
    } catch (error) {
        console.error("[Comics Panels API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch comic panels" },
            { status: 500 },
        );
    }
}
