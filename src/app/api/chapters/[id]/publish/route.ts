import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateChapter, getStoryWithStructure } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chapterId } = await params;
    
    // Update the chapter status to published
    const updatedChapter = await updateChapter(chapterId, session.user.id, {
      status: 'published',
      publishedAt: new Date()
    });

    if (!updatedChapter) {
      return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
    }

    // Get the story structure to check if story should also be published
    const storyStructure = await getStoryWithStructure(updatedChapter.storyId, session.user.id);
    
    if (storyStructure) {
      // Check if all chapters in the story are completed/published
      const allChapters = [
        ...storyStructure.parts.flatMap(part => part.chapters),
        ...storyStructure.chapters
      ];
      
      const publishedChapters = allChapters.filter(ch => 
        ch.status === 'published' || ch.status === 'completed'
      ).length;
      
      // If all chapters are published/completed and story has substantial content,
      // we could potentially mark the story as published too
      // But for now, let's keep story publishing as a separate action
    }

    return NextResponse.json({
      success: true,
      chapter: updatedChapter,
      message: 'Chapter published successfully!'
    });

  } catch (error) {
    console.error('Error publishing chapter:', error);
    return NextResponse.json(
      { error: 'Failed to publish chapter' },
      { status: 500 }
    );
  }
}