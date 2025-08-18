import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { searchHierarchy } from '@/lib/db/queries/hierarchy';

// GET /api/books/[bookId]/search - Search across all hierarchy levels
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { bookId } = await params;
    const hasAccess = await canUserAccessBook(session.user.id, bookId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const levelsParam = url.searchParams.get('levels');
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }
    
    const levels = levelsParam ? levelsParam.split(',') as ('story' | 'part' | 'chapter' | 'scene')[] : undefined;
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const offset = offsetParam ? parseInt(offsetParam) : undefined;
    
    const results = await searchHierarchy(bookId, query, {
      levels,
      limit,
      offset
    });
    
    return NextResponse.json({
      query,
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching hierarchy:', error);
    return NextResponse.json(
      { error: 'Failed to search hierarchy' },
      { status: 500 }
    );
  }
}