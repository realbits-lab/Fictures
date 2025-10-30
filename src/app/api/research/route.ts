import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllResearch, createResearch } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';
import { canWrite, canManage } from '@/lib/auth/permissions';
import { createHash } from 'crypto';
import { z } from 'zod';

export const runtime = 'nodejs';

const createResearchSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

// GET /api/research - Get all research items for current user
export async function GET(request: NextRequest) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-research-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'GET /api/research', { apiRoute: true });

    const session = await auth();

    // Only writers and managers can access research
    if (!canWrite(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only writers and managers can access research' },
        { status: 403 }
      );
    }

    const dbQueryStart = Date.now();
    const researchItems = await getAllResearch(session.user.id);
    const dbQueryDuration = Date.now() - dbQueryStart;

    const response = {
      items: researchItems,
      count: researchItems.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };

    // Generate ETag based on research data
    const contentForHash = JSON.stringify({
      itemsData: researchItems.map(item => ({
        id: item.id,
        title: item.title,
        viewCount: item.viewCount,
        createdAt: item.createdAt
      })),
      totalCount: researchItems.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      perfLogger.end(operationId, { cached: true, etag304: true });
      return new NextResponse(null, { status: 304 });
    }

    const totalDuration = perfLogger.end(operationId, {
      itemsCount: researchItems.length
    });

    // Set cache headers for private content (user-specific)
    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'private, max-age=180, stale-while-revalidate=600', // 3min cache
      'X-Content-Type': 'research-items',
      'X-Last-Modified': response.metadata.lastUpdated || new Date().toISOString(),
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
      'X-Server-Cache': 'ENABLED'
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error fetching research items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/research - Create new research item
export async function POST(request: NextRequest) {
  const perfLogger = getPerformanceLogger();
  const operationId = `create-research-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'POST /api/research', { apiRoute: true });

    const session = await auth();

    // Only managers can create research
    if (!canManage(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only managers can create research' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createResearchSchema.parse(body);

    const dbQueryStart = Date.now();
    const newResearch = await createResearch(session.user.id, validatedData);
    const dbQueryDuration = Date.now() - dbQueryStart;

    const totalDuration = perfLogger.end(operationId);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
    });

    return new NextResponse(
      JSON.stringify({ item: newResearch }),
      { status: 201, headers }
    );
  } catch (error) {
    perfLogger.end(operationId, { error: true });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating research:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
