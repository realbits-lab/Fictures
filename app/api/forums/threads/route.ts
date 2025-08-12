import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { forumThread, forumPost } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, title, content, tags } = body;

    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: 'Category ID, title, and content are required' },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);

    // Create thread and initial post in a transaction
    const [thread] = await db
      .insert(forumThread)
      .values({
        categoryId,
        title,
        slug,
        authorId: session.user.id!,
        tags: tags || [],
        postCount: 1,
        lastPostAt: new Date(),
        lastPostAuthorId: session.user.id!,
      })
      .returning();

    // Create the initial post
    await db.insert(forumPost).values({
      threadId: thread.id,
      authorId: session.user.id!,
      content,
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Error creating forum thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}