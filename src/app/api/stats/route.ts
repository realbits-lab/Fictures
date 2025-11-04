import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserStories } from '@/lib/db/queries';

export const runtime = 'nodejs';

// GET /api/stats - Get user's writing statistics
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        totalStories: 0,
        totalWords: 0,
        totalReaders: 0,
        avgRating: 0,
        isAuthenticated: false
      });
    }

    const userStories = await getUserStories(session.user.id);
    
    // Calculate basic stats
    const totalStories = userStories.length;
    const totalWords = 0; // TODO: Calculate from actual story content
    const totalReaders = userStories.reduce((sum, story) => sum + (story.viewCount || 0), 0);
    const avgRating = userStories.length > 0
      ? userStories.reduce((sum, story) => sum + (story.rating || 0), 0) / userStories.length / 10
      : 0;

    return NextResponse.json({
      totalStories,
      totalWords,
      totalReaders,
      avgRating: Number(avgRating.toFixed(1)),
      isAuthenticated: true,
      userName: session.user.name
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}