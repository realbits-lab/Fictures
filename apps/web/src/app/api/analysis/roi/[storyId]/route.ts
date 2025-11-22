import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, scenes } from "@/lib/schemas/database";
import {
    calculateROISummary,
    formatCost,
    type TokenUsageSummary,
} from "@/lib/utils/token-cost";
import { eq } from "drizzle-orm";

/**
 * GET /api/analysis/roi/[storyId]
 *
 * Get ROI (Return on Investment) analysis for a story
 *
 * Returns:
 * - Token usage breakdown by scene
 * - Total costs
 * - Ad revenue estimates
 * - ROI calculations
 * - Profit margins
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ storyId: string }> },
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { storyId } = await params;

        // Fetch story with token and revenue data
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
            columns: {
                id: true,
                title: true,
                authorId: true,
                totalInputTokens: true,
                totalOutputTokens: true,
                totalTokenCost: true,
                totalAdImpressions: true,
                totalAdRevenue: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Check authorization - only author can view ROI
        if (story.authorId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch scenes with token and ad data
        const storyScenes = await db.query.scenes.findMany({
            where: (scenes, { eq, inArray }) => {
                // Get chapters for this story
                return eq(scenes.chapterId, storyId);
            },
            columns: {
                id: true,
                title: true,
                chapterId: true,
                inputTokens: true,
                outputTokens: true,
                tokenCost: true,
                modelUsed: true,
                adImpressions: true,
                adRevenue: true,
                viewCount: true,
                novelViewCount: true,
                comicViewCount: true,
                createdAt: true,
            },
        });

        // Build token usage summary
        const tokenUsageByScene: TokenUsageSummary[] = storyScenes.map(
            (scene) => ({
                inputTokens: scene.inputTokens ?? 0,
                outputTokens: scene.outputTokens ?? 0,
                totalTokens:
                    (scene.inputTokens ?? 0) + (scene.outputTokens ?? 0),
                cost: scene.tokenCost ?? 0,
                model: scene.modelUsed ?? "unknown",
            }),
        );

        // Calculate ROI summary
        const roiSummary = calculateROISummary(
            tokenUsageByScene,
            story.totalAdImpressions ?? 0,
            story.totalAdRevenue ?? 0, // Use actual tracked revenue
        );

        // Build scene breakdown
        const sceneBreakdown = storyScenes.map((scene) => ({
            id: scene.id,
            title: scene.title,
            chapterId: scene.chapterId,
            inputTokens: scene.inputTokens ?? 0,
            outputTokens: scene.outputTokens ?? 0,
            totalTokens:
                (scene.inputTokens ?? 0) + (scene.outputTokens ?? 0),
            cost: scene.tokenCost ?? 0,
            costFormatted: formatCost(scene.tokenCost ?? 0),
            modelUsed: scene.modelUsed ?? "unknown",
            adImpressions: scene.adImpressions ?? 0,
            adRevenue: scene.adRevenue ?? 0,
            adRevenueFormatted: formatCost(scene.adRevenue ?? 0),
            viewCount: scene.viewCount ?? 0,
            novelViewCount: scene.novelViewCount ?? 0,
            comicViewCount: scene.comicViewCount ?? 0,
            profit: (scene.adRevenue ?? 0) - (scene.tokenCost ?? 0),
            profitFormatted: formatCost(
                (scene.adRevenue ?? 0) - (scene.tokenCost ?? 0),
            ),
            createdAt: scene.createdAt,
        }));

        // Calculate aggregate stats
        const totalScenes = storyScenes.length;
        const totalInputTokens =
            tokenUsageByScene.reduce(
                (sum, usage) => sum + usage.inputTokens,
                0,
            ) || story.totalInputTokens;
        const totalOutputTokens =
            tokenUsageByScene.reduce(
                (sum, usage) => sum + usage.outputTokens,
                0,
            ) || story.totalOutputTokens;
        const totalTokens = totalInputTokens + totalOutputTokens;

        // Return comprehensive ROI analysis
        return NextResponse.json({
            story: {
                id: story.id,
                title: story.title,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt,
            },
            summary: {
                totalScenes,
                totalInputTokens,
                totalOutputTokens,
                totalTokens,
                totalCost: roiSummary.totalCost,
                totalCostFormatted: formatCost(roiSummary.totalCost),
                totalRevenue: roiSummary.totalRevenue,
                totalRevenueFormatted: formatCost(roiSummary.totalRevenue),
                profit: roiSummary.profit,
                profitFormatted: formatCost(roiSummary.profit),
                roi: roiSummary.roi,
                profitMargin: roiSummary.profitMargin,
                totalAdImpressions: roiSummary.impressions,
            },
            sceneBreakdown,
            insights: generateInsights(roiSummary, sceneBreakdown),
        });
    } catch (error) {
        console.error("Error fetching ROI data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * Generate insights based on ROI data
 */
function generateInsights(
    roiSummary: ReturnType<typeof calculateROISummary>,
    sceneBreakdown: any[],
) {
    const insights: string[] = [];

    // ROI insights
    if (roiSummary.roi !== null) {
        if (roiSummary.roi > 100) {
            insights.push(
                `Strong ROI of ${roiSummary.roi.toFixed(1)}% - Your story is highly profitable!`,
            );
        } else if (roiSummary.roi > 0) {
            insights.push(
                `Positive ROI of ${roiSummary.roi.toFixed(1)}% - Your story is profitable.`,
            );
        } else {
            insights.push(
                `Negative ROI of ${roiSummary.roi.toFixed(1)}% - Consider increasing views to boost ad revenue.`,
            );
        }
    }

    // Profit margin insights
    if (roiSummary.profitMargin !== null) {
        if (roiSummary.profitMargin > 80) {
            insights.push(
                `Excellent profit margin of ${roiSummary.profitMargin.toFixed(1)}% - Low production costs relative to revenue.`,
            );
        } else if (roiSummary.profitMargin < 0) {
            insights.push(
                `Negative profit margin - Costs exceed revenue. Focus on growing your audience.`,
            );
        }
    }

    // Scene-level insights
    const lossScenes = sceneBreakdown.filter(
        (scene) => scene.profit < 0,
    ).length;
    if (lossScenes > 0) {
        insights.push(
            `${lossScenes} scene(s) are not yet profitable. More views will help these become profitable.`,
        );
    }

    // Most profitable scene
    const mostProfitable = sceneBreakdown.reduce(
        (max, scene) => (scene.profit > max.profit ? scene : max),
        sceneBreakdown[0],
    );
    if (mostProfitable && mostProfitable.profit > 0) {
        insights.push(
            `Most profitable scene: "${mostProfitable.title}" with ${mostProfitable.profitFormatted} profit`,
        );
    }

    return insights;
}
