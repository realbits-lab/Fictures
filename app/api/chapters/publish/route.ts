import { auth } from '@/app/auth';
import { publishChapter, unpublishChapter, getChapterById } from '@/lib/db/chapter-queries';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId, action } = await request.json();
    
    if (!chapterId || !['publish', 'unpublish'].includes(action)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // Get chapter to verify ownership
    const chapter = await getChapterById(chapterId);
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Verify user owns the book this chapter belongs to
    const hasAccess = await canUserAccessBook(session.user.id, chapter.bookId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to modify this chapter' }, { status: 403 });
    }

    // Perform the action
    const updatedChapter = action === 'publish' 
      ? await publishChapter(chapterId)
      : await unpublishChapter(chapterId);

    return NextResponse.json({ 
      success: true, 
      chapter: updatedChapter,
      message: `Chapter ${action}ed successfully`
    });
    
  } catch (error) {
    console.error(`Chapter ${action} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update chapter status' },
      { status: 500 }
    );
  }
}