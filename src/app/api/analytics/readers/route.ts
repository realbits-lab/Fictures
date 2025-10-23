import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReaderAnalytics } from "@/lib/services/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d' | 'all';

    const analytics = await getReaderAnalytics(session.user.id, timeRange);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Reader analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reader analytics" },
      { status: 500 }
    );
  }
}