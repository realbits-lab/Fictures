import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateChapter, getStoryWithStructure } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
    
    // Check if chapter has scenes before allowing publishing
    const chapterScenes = await db.select().from(scenes)
      .where(eq(scenes.chapterId, chapterId));
    
    if (chapterScenes.length === 0) {
      return NextResponse.json({ 
        error: 'Cannot publish chapter without scenes. Please add at least one scene before publishing.' 
      }, { status: 400 });
    }

    // Check if chapter has any content (at least one scene with content)
    const scenesWithContent = chapterScenes.filter(scene => 
      scene.content && scene.content.trim().length > 0
    );
    
    if (scenesWithContent.length === 0) {
      return NextResponse.json({ 
        error: 'Cannot publish chapter with empty scenes. Please add content to at least one scene before publishing.' 
      }, { status: 400 });
    }
    
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