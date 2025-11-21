import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStoriesAnalysis } from "@/lib/services/analysis";

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
        const timeRange = (searchParams.get("range") || "30d") as
            | "7d"
            | "30d"
            | "90d";

        const analysis = await getStoriesAnalysis(session.user.id, timeRange);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Reader analysis API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch reader analysis" },
            { status: 500 },
        );
    }
}
