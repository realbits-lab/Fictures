import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { db } from '@/lib/db/drizzle';
import { story, chapter, character } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = request.nextUrl || request.url;
    if (!url) {
      return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
    }
    
    const searchParams = typeof url === 'string' 
      ? new URL(url).searchParams 
      : url.searchParams;
    
    const storyId = searchParams.get('storyId');
    const chapterNumberStr = searchParams.get('chapterNumber');

    // Validate input
    if (!storyId) {
      return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
    }

    const chapterNumber = chapterNumberStr ? parseInt(chapterNumberStr) : 1;
    if (chapterNumberStr && (isNaN(chapterNumber) || chapterNumber <= 0)) {
      return NextResponse.json({ error: 'Invalid chapterNumber' }, { status: 400 });
    }

    // Check if story exists and user owns it
    const storyResult = await db
      .select({
        id: story.id,
        title: story.title,
        description: story.description,
        genre: story.genre,
        authorId: story.authorId,
      })
      .from(story)
      .where(eq(story.id, storyId))
      .limit(1);

    if (storyResult.length === 0) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const storyData = storyResult[0];

    if (storyData.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get previous chapters (up to the current chapter number - 1)
    const previousChapters = await db
      .select({
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        summary: chapter.summary,
        content: chapter.content,
      })
      .from(chapter)
      .where(and(
        eq(chapter.storyId, storyId),
        lt(chapter.chapterNumber, chapterNumber)
      ))
      .orderBy(chapter.chapterNumber);

    // Generate summaries for chapters that don't have them
    const chaptersWithSummaries = previousChapters.map(ch => {
      let summary = ch.summary;
      
      if (!summary && ch.content) {
        try {
          const contentObj = JSON.parse(ch.content);
          const text = extractTextFromContent(contentObj);
          // Generate a simple summary (first 200 characters + ellipsis)
          summary = text.length > 200 ? `${text.substring(0, 200)}...` : text;
        } catch (error) {
          summary = 'Chapter summary not available';
        }
      }

      return {
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        summary: summary || 'No summary available',
      };
    });

    // Get characters for this story (if character table exists)
    let characters: any[] = [];
    try {
      characters = await db
        .select({
          name: character.name,
          description: character.description,
          role: character.role,
        })
        .from(character)
        .where(eq(character.storyId, storyId));
    } catch (error) {
      // Character table might not exist or be populated yet
      console.log('Characters not available:', error);
    }

    // Build context response
    const context = {
      storyTitle: storyData.title,
      storyDescription: storyData.description,
      genre: storyData.genre,
      previousChapters: chaptersWithSummaries,
      characters: characters.length > 0 ? characters : undefined,
    };

    return NextResponse.json(context);

  } catch (error) {
    console.error('Chapter context error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function extractTextFromContent(contentObj: any): string {
  if (!contentObj || !Array.isArray(contentObj)) {
    return '';
  }

  return contentObj
    .map((node: any) => {
      if (node.children && Array.isArray(node.children)) {
        return node.children
          .map((child: any) => child.text || '')
          .join('');
      }
      return node.text || '';
    })
    .join('\n')
    .trim();
}