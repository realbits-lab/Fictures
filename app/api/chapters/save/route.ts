import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { db } from '@/lib/db/drizzle';
import { story, chapter, chat } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { storyId, chapterNumber, title, content, summary } = body;

    // Validate input
    if (!storyId || typeof storyId !== 'string') {
      return NextResponse.json({ error: 'Invalid storyId' }, { status: 400 });
    }

    if (!chapterNumber || typeof chapterNumber !== 'number' || chapterNumber <= 0) {
      return NextResponse.json({ error: 'Invalid chapterNumber' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    // Check if story exists and user owns it
    const storyResult = await db
      .select()
      .from(story)
      .where(eq(story.id, storyId))
      .limit(1);

    if (storyResult.length === 0) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (storyResult[0].authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate word count
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Check if chapter already exists
    const existingChapter = await db
      .select()
      .from(chapter)
      .where(and(
        eq(chapter.storyId, storyId),
        eq(chapter.chapterNumber, chapterNumber)
      ))
      .limit(1);

    let savedChapter;

    if (existingChapter.length > 0) {
      // Update existing chapter
      [savedChapter] = await db
        .update(chapter)
        .set({
          title: title.trim(),
          content: content,
          summary: summary?.trim() || null,
          wordCount,
          updatedAt: new Date(),
        })
        .where(eq(chapter.id, existingChapter[0].id))
        .returning();
    } else {
      // Create new chapter (need to create chat first)
      const [newChat] = await db
        .insert(chat)
        .values({
          title: `${title.trim()}`,
          userId: session.user.id,
          chatType: 'chapter',
          visibility: 'private',
          createdAt: new Date(),
        })
        .returning();
      
      [savedChapter] = await db
        .insert(chapter)
        .values({
          storyId,
          chapterNumber,
          title: title.trim(),
          content: content,
          summary: summary?.trim() || null,
          wordCount,
          isPublished: false,
          chatId: newChat.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    // Update story's total word count and chapter count
    const allChapters = await db
      .select({ wordCount: chapter.wordCount })
      .from(chapter)
      .where(eq(chapter.storyId, storyId));

    const totalWordCount = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    const chapterCount = allChapters.length;

    await db
      .update(story)
      .set({
        wordCount: totalWordCount,
        chapterCount,
        updatedAt: new Date(),
      })
      .where(eq(story.id, storyId));

    return NextResponse.json({
      success: true,
      chapter: {
        id: savedChapter.id,
        chapterNumber: savedChapter.chapterNumber,
        title: savedChapter.title,
        wordCount: savedChapter.wordCount,
        updatedAt: savedChapter.updatedAt,
      },
      storyStats: {
        totalWordCount,
        chapterCount,
      },
    });

  } catch (error) {
    console.error('Chapter save error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}