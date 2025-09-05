import { NextRequest, NextResponse } from 'next/server';
import { getPublishedStories } from '@/lib/db/queries';

export const runtime = 'nodejs';

// GET /api/stories/published - Get all published stories for browsing
export async function GET(request: NextRequest) {
  try {
    const publishedStories = await getPublishedStories();
    
    return NextResponse.json({
      stories: publishedStories,
      count: publishedStories.length
    });
  } catch (error) {
    console.error('Error fetching published stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}