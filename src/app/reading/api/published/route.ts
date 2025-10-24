import { NextRequest, NextResponse } from 'next/server';
import { getPublishedStories } from '@/lib/db/queries';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

// GET /api/stories/published - Get all published stories for browsing
export async function GET(request: NextRequest) {
  const reqId = Math.random().toString(36).substring(7);
  const requestStart = performance.now();

  console.log(`[${reqId}] 🌐 GET /reading/api/published - Request started at ${new Date().toISOString()}`);
  console.log(`[${reqId}] 📋 Request details:`, {
    method: request.method,
    url: request.url,
    headers: {
      userAgent: request.headers.get('user-agent'),
      ifNoneMatch: request.headers.get('if-none-match'),
      cacheControl: request.headers.get('cache-control'),
    },
  });

  try {
    // Fetch published stories
    const dbQueryStart = performance.now();
    console.log(`[${reqId}] 🔍 Querying database for published stories...`);

    const publishedStories = await getPublishedStories();

    const dbQueryEnd = performance.now();
    const dbQueryDuration = Math.round(dbQueryEnd - dbQueryStart);

    console.log(`[${reqId}] ✅ Database query completed in ${dbQueryDuration}ms:`, {
      storiesCount: publishedStories.length,
      hasStories: publishedStories.length > 0,
    });

    // Build response
    const responseStart = performance.now();

    const response = {
      stories: publishedStories,
      count: publishedStories.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };

    // Generate ETag
    const etagStart = performance.now();
    console.log(`[${reqId}] 🔐 Generating ETag...`);

    const contentForHash = JSON.stringify({
      storiesData: publishedStories.map(story => ({
        id: story.id,
        title: story.title,
        status: story.status,
        currentWordCount: story.currentWordCount,
        rating: story.rating,
        viewCount: story.viewCount
      })),
      totalCount: publishedStories.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    const etagEnd = performance.now();
    const etagDuration = Math.round(etagEnd - etagStart);

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
      console.log(`[${reqId}] 📊 Timing breakdown: DB=${dbQueryDuration}ms, ETag=${etagDuration}ms, Total=${totalTime}ms`);

      return new NextResponse(null, { status: 304 });
    }

    // Set cache headers optimized for published content (longer cache)
    const serializeStart = performance.now();
    console.log(`[${reqId}] 📦 Serializing response...`);

    const responseJson = JSON.stringify(response);
    const serializeEnd = performance.now();
    const serializeDuration = Math.round(serializeEnd - serializeStart);

    const responseSize = new Blob([responseJson]).size;
    const responseSizeKB = (responseSize / 1024).toFixed(2);

    console.log(`[${reqId}] ✅ Response serialized in ${serializeDuration}ms:`, {
      sizeBytes: responseSize,
      sizeKB: responseSizeKB,
      storiesCount: publishedStories.length,
    });

    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      // Longer cache for published content since it changes less frequently
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30min cache, 1hr stale
      'X-Content-Type': 'published-stories',
      'X-Last-Modified': response.metadata.lastUpdated || new Date().toISOString(),
      'X-Response-Time': `${Math.round(performance.now() - requestStart)}ms`,
      'X-Stories-Count': publishedStories.length.toString(),
    });

    const totalTime = Math.round(performance.now() - requestStart);

    console.log(`[${reqId}] ✅ 200 OK - Request completed successfully in ${totalTime}ms`);
    console.log(`[${reqId}] 📊 Timing breakdown:`, {
      dbQuery: `${dbQueryDuration}ms`,
      etag: `${etagDuration}ms`,
      serialize: `${serializeDuration}ms`,
      total: `${totalTime}ms`,
    });
    console.log(`[${reqId}] 📚 Response summary:`, {
      storiesCount: publishedStories.length,
      responseSize: `${responseSizeKB} KB`,
      etag: etag.substring(0, 8) + '...',
      cacheControl: 'public, max-age=1800',
    });

    // Log detailed story statistics
    if (publishedStories.length > 0) {
      const totalWordCount = publishedStories.reduce((sum, s) => sum + (s.currentWordCount || 0), 0);
      const avgWordCount = Math.round(totalWordCount / publishedStories.length);
      const genres = [...new Set(publishedStories.map(s => s.genre))];

      console.log(`[${reqId}] 📈 Story statistics:`, {
        totalStories: publishedStories.length,
        totalWords: totalWordCount.toLocaleString(),
        avgWords: avgWordCount.toLocaleString(),
        uniqueGenres: genres.length,
        genres: genres.slice(0, 5).join(', ') + (genres.length > 5 ? '...' : ''),
        topStory: publishedStories[0]?.title,
      });
    }

    return new NextResponse(responseJson, {
      status: 200,
      headers
    });
  } catch (error) {
    const errorTime = Math.round(performance.now() - requestStart);
    console.error(`[${reqId}] ❌ Request failed after ${errorTime}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error(`[${reqId}] 💥 Error details:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        reqId,
      },
      { status: 500 }
    );
  }
}