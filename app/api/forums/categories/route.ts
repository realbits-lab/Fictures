import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { forumCategory } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await db
      .select()
      .from(forumCategory)
      .where(eq(forumCategory.isVisible, true))
      .orderBy(forumCategory.order);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, slug, parentId, isVisible, moderatorIds } = body;

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const [category] = await db
      .insert(forumCategory)
      .values({
        name,
        description,
        slug,
        parentId,
        isVisible: isVisible ?? true,
        moderatorIds: moderatorIds ?? [],
      })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating forum category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}