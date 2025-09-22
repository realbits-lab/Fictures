import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { characters as charactersTable, stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET /api/stories/[id]/characters - Get characters for a story
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

    // Fetch characters for this story
    const characters = await db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.storyId, id))
      .orderBy(charactersTable.createdAt);

    return NextResponse.json(characters);

  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}