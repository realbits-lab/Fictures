import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  storyId: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'isPublic must be a boolean value' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { storyId } = params;

    // Check if story exists and belongs to the authenticated user
    const [story] = await db
      .select({
        id: stories.id,
        title: stories.title,
        authorId: stories.authorId,
        isPublic: stories.isPublic,
      })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return new Response(
        JSON.stringify({ error: 'Story not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the author of the story
    if (story.authorId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only modify your own stories' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the story visibility
    const [updatedStory] = await db
      .update(stories)
      .set({
        isPublic,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, storyId))
      .returning({
        id: stories.id,
        title: stories.title,
        isPublic: stories.isPublic,
        updatedAt: stories.updatedAt,
      });

    console.log(`📚 Story visibility updated: ${story.title} is now ${isPublic ? 'public' : 'private'}`);

    return new Response(
      JSON.stringify({
        success: true,
        story: updatedStory,
        message: `Story is now ${isPublic ? 'public' : 'private'}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error updating story visibility:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update story visibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// GET endpoint to check current visibility status
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { storyId } = params;

    // Get story visibility status
    const [story] = await db
      .select({
        id: stories.id,
        title: stories.title,
        isPublic: stories.isPublic,
        authorId: stories.authorId,
      })
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (!story) {
      return new Response(
        JSON.stringify({ error: 'Story not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the author of the story
    if (story.authorId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only view your own story settings' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: story.id,
          title: story.title,
          isPublic: story.isPublic,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching story visibility:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch story visibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}