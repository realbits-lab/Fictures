import { auth } from '@/app/auth';
import { db } from '@/lib/db';
import { reportContent } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, reason, description } = body;

    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Content type, ID, and reason are required' },
        { status: 400 }
      );
    }

    const [report] = await db
      .insert(reportContent)
      .values({
        reporterId: session.user.id!,
        contentType,
        contentId,
        reason,
        description,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}