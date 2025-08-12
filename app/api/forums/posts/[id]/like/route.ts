import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { forumPost } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// For simplicity, we'll store likes as a count. In a real app, you'd have a separate likes table
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [post] = await db
      .select()
      .from(forumPost)
      .where(eq(forumPost.id, params.id));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // For demo purposes, we'll just increment the like count
    // In a real app, you'd check if user already liked and toggle
    const [updatedPost] = await db
      .update(forumPost)
      .set({ likeCount: post.likeCount + 1 })
      .where(eq(forumPost.id, params.id))
      .returning();

    return NextResponse.json({
      liked: true,
      likeCount: updatedPost.likeCount,
    });
  } catch (error) {
    console.error('Error liking forum post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}