/**
 * Scene View Statistics API
 *
 * GET /api/stories/[storyId]/scene-stats
 * - Returns scene-level view statistics for a story
 * - Includes format-specific counts (novel/comic)
 * - Supports filtering, sorting, and pagination
 */

import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scenes as scenesTable, chapters as chaptersTable, stories as storiesTable } from '@/lib/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await context.params;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const format = searchParams.get('format') || 'all'; // all, novel, comic
    const sortBy = searchParams.get('sortBy') || 'views'; // views, novel, comic, recent
    const order = searchParams.get('order') || 'desc'; // asc, desc
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify story exists
    const story = await db
      .select({ id: storiesTable.id })
      .from(storiesTable)
      .where(eq(storiesTable.id, storyId))
      .limit(1);

    if (story.length === 0) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Fetch scenes with view stats
    const scenes = await db
      .select({
        id: scenesTable.id,
        title: scenesTable.title,
        sceneNumber: scenesTable.sceneNumber,
        chapterId: scenesTable.chapterId,
        chapterTitle: chaptersTable.title,
        chapterNumber: chaptersTable.chapterNumber,
        viewCount: scenesTable.viewCount,
        uniqueViewCount: scenesTable.uniqueViewCount,
        novelViewCount: scenesTable.novelViewCount,
        novelUniqueViewCount: scenesTable.novelUniqueViewCount,
        comicViewCount: scenesTable.comicViewCount,
        comicUniqueViewCount: scenesTable.comicUniqueViewCount,
        lastViewedAt: scenesTable.lastViewedAt,
      })
      .from(scenesTable)
      .innerJoin(chaptersTable, eq(scenesTable.chapterId, chaptersTable.id))
      .where(eq(chaptersTable.storyId, storyId))
      .orderBy(
        sortBy === 'novel'
          ? order === 'asc' ? asc(scenesTable.novelViewCount) : desc(scenesTable.novelViewCount)
          : sortBy === 'comic'
          ? order === 'asc' ? asc(scenesTable.comicViewCount) : desc(scenesTable.comicViewCount)
          : sortBy === 'recent'
          ? order === 'asc' ? asc(scenesTable.lastViewedAt) : desc(scenesTable.lastViewedAt)
          : order === 'asc' ? asc(scenesTable.viewCount) : desc(scenesTable.viewCount)
      )
      .limit(limit)
      .offset(offset);

    // Calculate aggregated stats
    const totalScenes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scenesTable)
      .innerJoin(chaptersTable, eq(scenesTable.chapterId, chaptersTable.id))
      .where(eq(chaptersTable.storyId, storyId));

    const aggregatedStats = await db
      .select({
        totalViews: sql<number>`sum(${scenesTable.viewCount})::int`,
        totalUniqueViews: sql<number>`sum(${scenesTable.uniqueViewCount})::int`,
        totalNovelViews: sql<number>`sum(${scenesTable.novelViewCount})::int`,
        totalComicViews: sql<number>`sum(${scenesTable.comicViewCount})::int`,
        avgViewsPerScene: sql<number>`avg(${scenesTable.viewCount})::int`,
      })
      .from(scenesTable)
      .innerJoin(chaptersTable, eq(scenesTable.chapterId, chaptersTable.id))
      .where(eq(chaptersTable.storyId, storyId));

    const stats = aggregatedStats[0];

    // Calculate format distribution
    const novelPercentage = stats.totalViews > 0
      ? Math.round((stats.totalNovelViews / stats.totalViews) * 100)
      : 0;
    const comicPercentage = stats.totalViews > 0
      ? Math.round((stats.totalComicViews / stats.totalViews) * 100)
      : 0;

    // Format scene data
    const formattedScenes = scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      sceneNumber: scene.sceneNumber,
      chapter: {
        id: scene.chapterId,
        title: scene.chapterTitle,
        number: scene.chapterNumber,
      },
      views: {
        total: scene.viewCount,
        unique: scene.uniqueViewCount,
        novel: scene.novelViewCount,
        novelUnique: scene.novelUniqueViewCount,
        comic: scene.comicViewCount,
        comicUnique: scene.comicUniqueViewCount,
      },
      lastViewedAt: scene.lastViewedAt,
    }));

    return NextResponse.json({
      success: true,
      storyId,
      scenes: formattedScenes,
      stats: {
        totalScenes: totalScenes[0].count,
        totalViews: stats.totalViews || 0,
        totalUniqueViews: stats.totalUniqueViews || 0,
        totalNovelViews: stats.totalNovelViews || 0,
        totalComicViews: stats.totalComicViews || 0,
        avgViewsPerScene: stats.avgViewsPerScene || 0,
        formatDistribution: {
          novel: novelPercentage,
          comic: comicPercentage,
        },
      },
      pagination: {
        limit,
        offset,
        hasMore: formattedScenes.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching scene stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene statistics' },
      { status: 500 }
    );
  }
}
