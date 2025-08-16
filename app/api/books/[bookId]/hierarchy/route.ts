import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { canUserAccessBook } from '@/lib/db/queries/books';
import { db } from '@/lib/db';
import { story, part, chapterEnhanced, scene } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/books/[bookId]/hierarchy - Get full hierarchy tree
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
    
    // Get all stories for the book
    const stories = await db.select()
      .from(story)
      .where(eq(story.bookId, bookId))
      .orderBy(story.order);
    
    // Build the complete hierarchy tree
    const hierarchyData = await Promise.all(
      stories.map(async (storyItem) => {
        // Get parts for this story
        const parts = await db.select()
          .from(part)
          .where(eq(part.storyId, storyItem.id))
          .orderBy(part.order);
        
        const partsWithChapters = await Promise.all(
          parts.map(async (partItem) => {
            // Get chapters for this part
            const chapters = await db.select()
              .from(chapterEnhanced)
              .where(eq(chapterEnhanced.partId, partItem.id))
              .orderBy(chapterEnhanced.order);
            
            const chaptersWithScenes = await Promise.all(
              chapters.map(async (chapterItem) => {
                // Get scenes for this chapter
                const scenes = await db.select()
                  .from(scene)
                  .where(eq(scene.chapterId, chapterItem.id))
                  .orderBy(scene.order);
                
                return {
                  ...chapterItem,
                  scenes
                };
              })
            );
            
            return {
              ...partItem,
              chapters: chaptersWithScenes
            };
          })
        );
        
        return {
          ...storyItem,
          parts: partsWithChapters
        };
      })
    );
    
    return NextResponse.json({
      hierarchy: {
        bookId,
        stories: hierarchyData
      }
    });
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy' },
      { status: 500 }
    );
  }
}