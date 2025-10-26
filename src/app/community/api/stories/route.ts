import { NextRequest } from 'next/server';
import { getCommunityStories } from '@/lib/db/cached-queries';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  const reqId = Math.random().toString(36).substring(7);
  const requestStart = performance.now();

  console.log(`[${reqId}] 🌐 GET /community/api/stories - Request started at ${new Date().toISOString()}`);

  try {
    // Fetch community stories with Redis caching
    const cacheStart = performance.now();
    console.log(`[${reqId}] 🔍 Fetching community stories (with Redis cache)...`);

    const storiesWithStats = await getCommunityStories();

    const cacheDuration = Math.round(performance.now() - cacheStart);
    console.log(`[${reqId}] ✅ Stories fetched in ${cacheDuration}ms:`, {
      storiesCount: storiesWithStats.length,
      cached: true
    });

    // Build response with metadata
    const responseStart = performance.now();
    const lastUpdated = storiesWithStats.length > 0
      ? storiesWithStats.reduce((latest, story) =>
          !latest || (story.updatedAt && story.updatedAt > latest) ? story.updatedAt : latest,
          null as Date | null
        )
      : new Date();

    const response = {
      success: true,
      stories: storiesWithStats,
      total: storiesWithStats.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        lastUpdated: lastUpdated instanceof Date ? lastUpdated.toISOString() : lastUpdated
      }
    };

    // Generate ETag based on community stories data
    const etagStart = performance.now();
    console.log(`[${reqId}] 🔐 Generating ETag...`);

    const contentForHash = JSON.stringify({
      storiesData: storiesWithStats.map(story => ({
        id: story.id,
        title: story.title,
        updatedAt: story.updatedAt,
        totalPosts: story.totalPosts,
        totalMembers: story.totalMembers,
        lastActivity: story.lastActivity
      })),
      totalStories: storiesWithStats.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    const etagDuration = Math.round(performance.now() - etagStart);
    console.log(`[${reqId}] ✅ ETag generated in ${etagDuration}ms: ${etag.substring(0, 8)}...`);

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    console.log(`[${reqId}] 🔍 Checking client ETag:`, {
      clientETag: clientETag?.substring(0, 8) + '...' || 'none',
      serverETag: etag.substring(0, 8) + '...',
      match: clientETag === etag,
    });

    if (clientETag === etag) {
      const totalTime = Math.round(performance.now() - requestStart);
      console.log(`[${reqId}] 🎯 304 Not Modified - Returning cached response (${totalTime}ms total)`);
      return new Response(null, { status: 304 });
    }

    // Serialize response
    const serializeStart = performance.now();
    const responseJson = JSON.stringify(response);
    const serializeDuration = Math.round(performance.now() - serializeStart);
    const responseSize = new Blob([responseJson]).size;
    const responseSizeKB = (responseSize / 1024).toFixed(2);

    console.log(`[${reqId}] ✅ Response serialized in ${serializeDuration}ms:`, {
      sizeBytes: responseSize,
      sizeKB: responseSizeKB,
      storiesCount: storiesWithStats.length,
    });

    // Set cache headers optimized for community content
    const headers = {
      'Content-Type': 'application/json',
      'ETag': etag,
      // Optimized cache for community (aligned with Redis TTL)
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      'X-Content-Type': 'community-stories',
      'X-Last-Modified': response.metadata.lastUpdated || new Date().toISOString(),
      'X-Response-Time': `${Math.round(performance.now() - requestStart)}ms`,
      'X-Stories-Count': storiesWithStats.length.toString(),
      'X-Cache-Strategy': '3-layer (Redis + HTTP + localStorage)'
    };

    const totalTime = Math.round(performance.now() - requestStart);
    console.log(`[${reqId}] ✅ 200 OK - Request completed successfully in ${totalTime}ms`);
    console.log(`[${reqId}] 📊 Timing breakdown:`, {
      cache: `${cacheDuration}ms`,
      etag: `${etagDuration}ms`,
      serialize: `${serializeDuration}ms`,
      total: `${totalTime}ms`,
    });

    return new Response(responseJson, {
      status: 200,
      headers
    });

  } catch (error) {
    const errorTime = Math.round(performance.now() - requestStart);
    console.error(`[${reqId}] ❌ Request failed after ${errorTime}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch community stories',
        details: error instanceof Error ? error.message : 'Unknown error',
        reqId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}