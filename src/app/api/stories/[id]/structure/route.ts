import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStoryWithStructure } from '@/lib/db/queries';

export const runtime = 'nodejs';

// GET /api/stories/[id]/structure - Get story with complete structure (parts, chapters, scenes)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    const storyWithStructure = await getStoryWithStructure(id, session?.user?.id);
    
    if (!storyWithStructure) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(storyWithStructure);
  } catch (error) {
    console.error('Error fetching story structure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}