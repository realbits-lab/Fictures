import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishingSchedules } from "@/lib/schemas/database";
import { createPublishingSchedule } from "@/lib/services/publishing";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const {
            storyId,
            chapterId,
            name,
            description,
            scheduleType,
            startDate,
            endDate,
            publishTime,
            intervalDays,
            daysOfWeek,
            scenesPerPublish,
        } = body;

        const scheduleId = await createPublishingSchedule({
            storyId,
            chapterId,
            createdBy: session.user.id,
            name,
            description,
            scheduleType,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            publishTime,
            intervalDays,
            daysOfWeek,
            scenesPerPublish,
        });

        return NextResponse.json({ scheduleId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create schedule:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create schedule",
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const storyId = searchParams.get("storyId");

        // Get schedules
        let query = db
            .select()
            .from(publishingSchedules)
            .where(eq(publishingSchedules.createdBy, session.user.id));

        if (storyId) {
            query = db
                .select()
                .from(publishingSchedules)
                .where(eq(publishingSchedules.storyId, storyId));
        }

        const schedules = await query.orderBy(
            desc(publishingSchedules.createdAt),
        );

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error("Failed to fetch schedules:", error);
        return NextResponse.json(
            { error: "Failed to fetch schedules" },
            { status: 500 },
        );
    }
}
