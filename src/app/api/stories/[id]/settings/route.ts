import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { places as placesTable, stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET /api/stories/[id]/settings - Get settings/places for a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user has access to this story
    const [story] = await db
      .select()
      .from(stories)
      .where(and(
        eq(stories.id, id),
        eq(stories.authorId, session.user.id)
      ))
      .limit(1);

    if (!story) {
      return NextResponse.json({ error: 'Story not found or access denied' }, { status: 404 });
    }

    // Fetch places/settings for this story
    const settings = await db
      .select()
      .from(placesTable)
      .where(eq(placesTable.storyId, id))
      .orderBy(placesTable.createdAt);

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}