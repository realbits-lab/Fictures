import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '7d';

    // Mock reader analytics data
    const readerAnalytics = {
      timeRange,
      topPost: {
        title: "Maya's True Power Theory - MASSIVE PLOT TWIST INCOMING!",
        replies: Math.floor(Math.random() * 200) + 150,
        reactions: Math.floor(Math.random() * 50) + 10
      },
      recentComment: {
        text: "The way you write Maya's internal conflict is incredible. Can't wait for the finale!",
        likes: Math.floor(Math.random() * 100) + 20,
        author: '@FantasyLover99'
      },
      fanContent: {
        title: "Maya vs Void Collector fan art",
        author: '@ArtistPro',
        likes: Math.floor(Math.random() * 500) + 100,
        shares: Math.floor(Math.random() * 50) + 5
      },
      demographics: {
        ageGroups: {
          '18-24': Math.floor(Math.random() * 20) + 25, // 25-45%
          '25-34': Math.floor(Math.random() * 20) + 35, // 35-55%
          '35+': Math.floor(Math.random() * 15) + 15   // 15-30%
        },
        locations: {
          us: Math.floor(Math.random() * 20) + 40,     // 40-60%
          uk: Math.floor(Math.random() * 15) + 15,     // 15-30%
          ca: Math.floor(Math.random() * 10) + 10      // 10-20%
        }
      },
      readingTime: {
        peakHours: ['6-8 PM', '7-9 PM', '8-10 PM'][Math.floor(Math.random() * 3)],
        avgSession: Math.floor(Math.random() * 10) + 8, // 8-18 minutes
        returnRate: Math.floor(Math.random() * 20) + 70  // 70-90%
      },
      engagementMetrics: {
        activeReaders: Math.floor(Math.random() * 500) + 200,
        newReaders: Math.floor(Math.random() * 100) + 50,
        returningReaders: Math.floor(Math.random() * 300) + 150
      }
    };

    return NextResponse.json(readerAnalytics);
  } catch (error) {
    console.error("Reader analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reader analytics" },
      { status: 500 }
    );
  }
}