import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { forumThread, forumPost, user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get thread details
    const [thread] = await db
      .select()
      .from(forumThread)
      .where(eq(forumThread.id, id));

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Update view count
    await db
      .update(forumThread)
      .set({ viewCount: thread.viewCount + 1 })
      .where(eq(forumThread.id, id));

    // Get posts
    const posts = await db
      .select({
        id: forumPost.id,
        content: forumPost.content,
        authorId: forumPost.authorId,
        authorName: user.name,
        isEdited: forumPost.isEdited,
        editedAt: forumPost.editedAt,
        parentPostId: forumPost.parentPostId,
        likeCount: forumPost.likeCount,
        createdAt: forumPost.createdAt,
      })
      .from(forumPost)
      .leftJoin(user, eq(forumPost.authorId, user.id))
      .where(eq(forumPost.threadId, id))
      .orderBy(forumPost.createdAt)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      thread: { ...thread, viewCount: thread.viewCount + 1 },
      posts,
    });
  } catch (error) {
    console.error('Error fetching forum thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}