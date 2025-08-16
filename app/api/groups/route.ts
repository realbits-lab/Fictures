import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { group, groupMember } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, like } from 'drizzle-orm';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const conditions = [eq(group.isActive, true)];

    if (type) {
      conditions.push(eq(group.type, type as any));
    }
    if (category) {
      conditions.push(eq(group.category, category as any));
    }

    const groups = await db
      .select()
      .from(group)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    const totalGroups = await db
      .select({ count: group.id })
      .from(group)
      .where(eq(group.isActive, true));

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total: totalGroups.length,
        totalPages: Math.ceil(totalGroups.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
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
    const { name, description, type, category, tags, memberLimit, rules } = body;

    if (!name || !type || !category) {
      return NextResponse.json(
        { error: 'Name, type, and category are required' },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);

    const [newGroup] = await db
      .insert(group)
      .values({
        name,
        description,
        slug,
        ownerId: session.user.id!,
        type,
        category,
        tags: tags || [],
        memberLimit,
        rules,
        memberCount: 1, // Owner is the first member
      })
      .returning();

    // Add owner as first member
    await db.insert(groupMember).values({
      groupId: newGroup.id,
      userId: session.user.id!,
      role: 'owner',
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}