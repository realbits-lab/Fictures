import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { forumPost, forumThread } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, parentPostId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if thread exists and is not locked
    const [thread] = await db
      .select()
      .from(forumThread)
      .where(eq(forumThread.id, params.id));

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
    }

    const [post] = await db
      .insert(forumPost)
      .values({
        threadId: params.id,
        authorId: session.user.id!,
        content,
        parentPostId,
      })
      .returning();

    // Update thread post count and last post info
    await db
      .update(forumThread)
      .set({
        postCount: thread.postCount + 1,
        lastPostAt: new Date(),
        lastPostAuthorId: session.user.id!,
      })
      .where(eq(forumThread.id, params.id));

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}