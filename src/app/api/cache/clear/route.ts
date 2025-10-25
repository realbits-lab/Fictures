import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCache } from '@/lib/cache/redis-cache';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cache = getCache();
    await cache.clear();

    return NextResponse.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cache = getCache();
    const perfLogger = getPerformanceLogger();

    const cacheMetrics = cache.getMetrics();
    const perfMetrics = perfLogger.getMetrics();

    return NextResponse.json({
      cache: cacheMetrics,
      performance: perfMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
