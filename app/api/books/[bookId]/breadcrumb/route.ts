import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { getHierarchyPath } from '@/lib/db/queries/hierarchy';
import { db } from '@/lib/db';
import { book, story, part, chapterEnhanced, scene } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/books/[bookId]/breadcrumb - Get breadcrumb for current position
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
    const level = url.searchParams.get('level');
    const entityId = url.searchParams.get('entityId');
    
    if (!level || !entityId) {
      return NextResponse.json(
        { error: 'Both "level" and "entityId" parameters are required' },
        { status: 400 }
      );
    }
    
    // Build breadcrumb based on the level and entity
    const breadcrumb = [];
    
    // Always start with the book
    const bookData = await db.select()
      .from(book)
      .where(eq(book.id, bookId));
    
    if (bookData.length === 0) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }
    
    breadcrumb.push({
      level: 'book',
      id: bookId,
      title: bookData[0].title,
      url: `/books/${bookId}`
    });
    
    if (level === 'story' || level === 'part' || level === 'chapter' || level === 'scene') {
      // Get story information
      let storyData;
      if (level === 'story') {
        storyData = await db.select().from(story).where(eq(story.id, entityId));
      } else {
        // Need to traverse up to get story
        if (level === 'part') {
          const partData = await db.select().from(part).where(eq(part.id, entityId));
          if (partData.length > 0) {
            storyData = await db.select().from(story).where(eq(story.id, partData[0].storyId));
          }
        } else if (level === 'chapter') {
          const chapterData = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.id, entityId));
          if (chapterData.length > 0) {
            const partData = await db.select().from(part).where(eq(part.id, chapterData[0].partId));
            if (partData.length > 0) {
              storyData = await db.select().from(story).where(eq(story.id, partData[0].storyId));
            }
          }
        } else if (level === 'scene') {
          const sceneData = await db.select().from(scene).where(eq(scene.id, entityId));
          if (sceneData.length > 0) {
            const chapterData = await db.select().from(chapterEnhanced).where(eq(chapterEnhanced.id, sceneData[0].chapterId));
            if (chapterData.length > 0) {
              const partData = await db.select().from(part).where(eq(part.id, chapterData[0].partId));
              if (partData.length > 0) {
                storyData = await db.select().from(story).where(eq(story.id, partData[0].storyId));
              }
            }
          }
        }
      }
      
      if (storyData && storyData.length > 0) {
        breadcrumb.push({
          level: 'story',
          id: storyData[0].id,
          title: storyData[0].title,
          url: `/books/${bookId}/stories/${storyData[0].id}`
        });
      }
    }
    
    // Continue building breadcrumb for part, chapter, scene levels...
    // (Implementation would continue for each level)
    
    return NextResponse.json({ breadcrumb });
  } catch (error) {
    console.error('Error building breadcrumb:', error);
    return NextResponse.json(
      { error: 'Failed to build breadcrumb' },
      { status: 500 }
    );
  }
}