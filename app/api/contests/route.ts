import { auth } from '@/app/auth';
import { db } from '@/lib/db/index';
import { contest } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

function generateSlug(title: string): string {
  return title
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = db.select().from(contest);

    if (status) {
      query = query.where(eq(contest.status, status as any));
    }
    if (type) {
      query = query.where(eq(contest.type, type as any));
    }

    const contests = await query.limit(limit).offset(offset);

    const totalContests = await db.select({ count: contest.id }).from(contest);

    return NextResponse.json({
      contests,
      pagination: {
        page,
        limit,
        total: totalContests.length,
        totalPages: Math.ceil(totalContests.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
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
    const {
      title,
      description,
      type,
      rules,
      maxSubmissions,
      submissionStart,
      submissionEnd,
      votingStart,
      votingEnd,
      prizes,
      judgingCriteria,
    } = body;

    if (!title || !description || !type || !rules) {
      return NextResponse.json(
        { error: 'Title, description, type, and rules are required' },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);

    const [newContest] = await db
      .insert(contest)
      .values({
        title,
        description,
        slug,
        organizerId: session.user.id!,
        type,
        rules,
        maxSubmissions,
        submissionStart: new Date(submissionStart),
        submissionEnd: new Date(submissionEnd),
        votingStart: votingStart ? new Date(votingStart) : null,
        votingEnd: votingEnd ? new Date(votingEnd) : null,
        prizes,
        judgingCriteria,
      })
      .returning();

    return NextResponse.json(newContest, { status: 201 });
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}