import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { forumPost } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check if post exists and user owns it
    const [existingPost] = await db
      .select()
      .from(forumPost)
      .where(eq(forumPost.id, params.id));

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this post' }, { status: 403 });
    }

    const [updatedPost] = await db
      .update(forumPost)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
      })
      .where(eq(forumPost.id, params.id))
      .returning();

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating forum post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}