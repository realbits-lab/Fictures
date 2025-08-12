import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { forumThread, user } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const threads = await db
      .select({
        id: forumThread.id,
        title: forumThread.title,
        slug: forumThread.slug,
        authorId: forumThread.authorId,
        authorName: user.name,
        isPinned: forumThread.isPinned,
        isLocked: forumThread.isLocked,
        tags: forumThread.tags,
        viewCount: forumThread.viewCount,
        postCount: forumThread.postCount,
        lastPostAt: forumThread.lastPostAt,
        createdAt: forumThread.createdAt,
      })
      .from(forumThread)
      .leftJoin(user, eq(forumThread.authorId, user.id))
      .where(eq(forumThread.categoryId, params.id))
      .orderBy(desc(forumThread.isPinned), desc(forumThread.lastPostAt))
      .limit(limit)
      .offset(offset);

    const totalThreads = await db
      .select({ count: forumThread.id })
      .from(forumThread)
      .where(eq(forumThread.categoryId, params.id));

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        total: totalThreads.length,
        totalPages: Math.ceil(totalThreads.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forum threads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}