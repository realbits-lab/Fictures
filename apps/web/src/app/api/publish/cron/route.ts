import { and, eq, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    publishingSchedules,
    scenes,
    scheduledPublications,
} from "@/lib/schemas/drizzle";
import { publishScene } from "@/lib/services/publishing";

/**
 * Vercel Cron Job Endpoint
 * Runs daily at 8:00 AM UTC
 * Publishes all scenes scheduled for today or earlier
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (security check)
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const now = new Date();
        console.log(
            `[Cron Job] Starting publication check at ${now.toISOString()}`,
        );

        // Get all pending publications due now or earlier
        const pendingPublications = await db
            .select()
            .from(scheduledPublications)
            .where(
                and(
                    eq(scheduledPublications.status, "pending"),
                    lte(scheduledPublications.scheduledFor, now),
                ),
            )
            .limit(100); // Process max 100 per run

        console.log(
            `[Cron Job] Found ${pendingPublications.length} pending publications`,
        );

        const results = {
            total: pendingPublications.length,
            succeeded: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Process each publication
        for (const publication of pendingPublications) {
            try {
                if (publication.sceneId) {
                    // Publish scene
                    await publishScene(publication.sceneId, "system");

                    // Mark as published
                    await db
                        .update(scheduledPublications)
                        .set({
                            status: "published",
                            publishedAt: now,
                            updatedAt: now,
                        })
                        .where(eq(scheduledPublications.id, publication.id));

                    // Update schedule stats
                    if (publication.scheduleId) {
                        await db
                            .update(publishingSchedules)
                            .set({
                                lastPublishedAt: now,
                                totalPublished: sql`${publishingSchedules.totalPublished} + 1`,
                                updatedAt: now,
                            })
                            .where(
                                eq(
                                    publishingSchedules.id,
                                    publication.scheduleId,
                                ),
                            );
                    }

                    results.succeeded++;
                    console.log(
                        `[Cron Job]  Published scene ${publication.sceneId}`,
                    );
                }
            } catch (error) {
                // Mark as failed
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";

                await db
                    .update(scheduledPublications)
                    .set({
                        status: "failed",
                        errorMessage,
                        retryCount: sql`${scheduledPublications.retryCount} + 1`,
                        updatedAt: now,
                    })
                    .where(eq(scheduledPublications.id, publication.id));

                results.failed++;
                results.errors.push(
                    `Scene ${publication.sceneId}: ${errorMessage}`,
                );
                console.error(
                    `[Cron Job] L Failed to publish scene ${publication.sceneId}:`,
                    error,
                );
            }
        }

        console.log(
            `[Cron Job] Completed: ${results.succeeded} succeeded, ${results.failed} failed`,
        );

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            results,
        });
    } catch (error) {
        console.error("[Cron Job] Fatal error:", error);
        return NextResponse.json(
            {
                error: "Cron job failed",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
