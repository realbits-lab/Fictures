import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getResearchById, updateResearch, deleteResearch } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';
import { canWrite, canManage } from '@/lib/auth/permissions';

export const runtime = 'nodejs';

// GET /api/research/[id] - Get single research item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-research-by-id-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'GET /api/research/[id]', { apiRoute: true });

    const { id } = await params;
    const session = await auth();

    // Only writers and managers can access research
    if (!canWrite(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only writers and managers can access research' },
        { status: 403 }
      );
    }

    const dbQueryStart = Date.now();
    const research = await getResearchById(id, session.user.id);
    const dbQueryDuration = Date.now() - dbQueryStart;

    if (!research) {
      return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
    }

    const totalDuration = perfLogger.end(operationId);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
      'X-Cache-Status': 'HIT',
      'Cache-Control': 'private, max-age=180, stale-while-revalidate=600', // 3min cache
    });

    return new NextResponse(
      JSON.stringify({ item: research }),
      { status: 200, headers }
    );
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error fetching research item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/research/[id] - Update research item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `update-research-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'PUT /api/research/[id]', { apiRoute: true });

    const { id } = await params;
    const session = await auth();

    // Only managers can update research
    if (!canManage(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only managers can update research' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, tags } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const dbQueryStart = Date.now();
    const updatedResearch = await updateResearch(id, session.user.id, {
      title,
      content,
      tags: tags || [],
    });
    const dbQueryDuration = Date.now() - dbQueryStart;

    if (!updatedResearch) {
      return NextResponse.json(
        { error: 'Research item not found or access denied' },
        { status: 404 }
      );
    }

    const totalDuration = perfLogger.end(operationId);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
    });

    return new NextResponse(
      JSON.stringify({ item: updatedResearch }),
      { status: 200, headers }
    );
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error updating research item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/research/[id] - Delete research item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfLogger = getPerformanceLogger();
  const operationId = `delete-research-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'DELETE /api/research/[id]', { apiRoute: true });

    const { id } = await params;
    const session = await auth();

    // Only managers can delete research
    if (!canManage(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only managers can delete research' },
        { status: 403 }
      );
    }

    const dbQueryStart = Date.now();
    const deletedResearch = await deleteResearch(id, session.user.id);
    const dbQueryDuration = Date.now() - dbQueryStart;

    if (!deletedResearch) {
      return NextResponse.json(
        { error: 'Research item not found or access denied' },
        { status: 404 }
      );
    }

    const totalDuration = perfLogger.end(operationId);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
    });

    return new NextResponse(
      JSON.stringify({
        message: 'Research item deleted successfully',
        id: deletedResearch.id
      }),
      { status: 200, headers }
    );
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error deleting research item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
