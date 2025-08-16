import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/lib/db';
import { book, story, part, chapterEnhanced, scene } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

describe('Database Performance Optimization', () => {
  let testBookId: string;
  let performanceMetrics: {
    hierarchyQueryTime: number;
    indexUsage: boolean;
    queryPlanOptimal: boolean;
  };

  beforeAll(async () => {
    // Create test book with large hierarchy for performance testing
    const [bookRecord] = await db.insert(book).values({
      title: 'Performance Test Book',
      description: 'Large book for performance testing',
      userId: 'test-user-perf',
      authorName: 'Test Author',
      authorBio: 'Performance testing',
      genre: 'test',
      language: 'en',
      status: 'published',
      wordCount: 100000,
      chapterCount: 50
    }).returning();
    testBookId = bookRecord.id;

    // Create large hierarchy structure for performance testing
    for (let s = 1; s <= 5; s++) {
      const [storyRecord] = await db.insert(story).values({
        title: `Story ${s}`,
        description: `Performance test story ${s}`,
        bookId: testBookId,
        orderInBook: s,
        wordCount: 20000
      }).returning();

      for (let p = 1; p <= 4; p++) {
        const [partRecord] = await db.insert(part).values({
          title: `Part ${p} of Story ${s}`,
          description: `Performance test part ${p}`,
          storyId: storyRecord.id,
          orderInStory: p,
          wordCount: 5000
        }).returning();

        for (let c = 1; c <= 5; c++) {
          const [chapterRecord] = await db.insert(chapterEnhanced).values({
            title: `Chapter ${c}`,
            content: `Performance test content for chapter ${c}`,
            partId: partRecord.id,
            orderInPart: c,
            wordCount: 1000,
            status: 'published'
          }).returning();

          for (let sc = 1; sc <= 10; sc++) {
            await db.insert(scene).values({
              title: `Scene ${sc}`,
              content: `Performance test scene content ${sc}`,
              chapterId: chapterRecord.id,
              orderInChapter: sc,
              wordCount: 100
            });
          }
        }
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(book).where(eq(book.id, testBookId));
  });

  describe('Query Performance', () => {
    it('should execute hierarchy query within performance threshold (< 100ms)', async () => {
      const startTime = performance.now();
      
      // Complex hierarchy query that should be optimized
      const result = await db.select({
        bookTitle: book.title,
        storyTitle: story.title,
        partTitle: part.title,
        chapterTitle: chapterEnhanced.title,
        sceneTitle: scene.title,
        totalWordCount: sql<number>`${book.wordCount} + ${story.wordCount} + ${part.wordCount} + ${chapterEnhanced.wordCount} + ${scene.wordCount}`
      })
      .from(book)
      .leftJoin(story, eq(story.bookId, book.id))
      .leftJoin(part, eq(part.storyId, story.id))
      .leftJoin(chapterEnhanced, eq(chapterEnhanced.partId, part.id))
      .leftJoin(scene, eq(scene.chapterId, chapterEnhanced.id))
      .where(eq(book.id, testBookId))
      .limit(100);

      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      performanceMetrics = {
        ...performanceMetrics,
        hierarchyQueryTime: queryTime
      };

      expect(queryTime).toBeLessThan(100); // Should execute in under 100ms
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use database indexes for hierarchy navigation queries', async () => {
      // This test will check if proper indexes exist and are being used
      const explainQuery = sql`
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT b.title, s.title, p.title, c.title, sc.title
        FROM books b
        LEFT JOIN stories s ON s.book_id = b.id
        LEFT JOIN parts p ON p.story_id = s.id  
        LEFT JOIN chapters c ON c.part_id = p.id
        LEFT JOIN scenes sc ON sc.chapter_id = c.id
        WHERE b.id = ${testBookId}
      `;

      const [result] = await db.execute(explainQuery);
      const queryPlan = result.toString();
      
      // Check for index usage in query plan
      const hasIndexScan = queryPlan.includes('Index Scan') || queryPlan.includes('Bitmap Index Scan');
      const noSequentialScan = !queryPlan.includes('Seq Scan on books') && !queryPlan.includes('Seq Scan on stories');
      
      performanceMetrics = {
        ...performanceMetrics,
        indexUsage: hasIndexScan && noSequentialScan,
        queryPlanOptimal: hasIndexScan && noSequentialScan
      };

      expect(hasIndexScan).toBe(true);
      expect(noSequentialScan).toBe(true);
    });

    it('should efficiently handle word count aggregation queries', async () => {
      const startTime = performance.now();
      
      const wordCountQuery = await db.select({
        bookId: book.id,
        totalWords: sql<number>`
          COALESCE(${book.wordCount}, 0) +
          COALESCE(SUM(${story.wordCount}), 0) +
          COALESCE(SUM(${part.wordCount}), 0) +
          COALESCE(SUM(${chapterEnhanced.wordCount}), 0) +
          COALESCE(SUM(${scene.wordCount}), 0)
        `
      })
      .from(book)
      .leftJoin(story, eq(story.bookId, book.id))
      .leftJoin(part, eq(part.storyId, story.id))
      .leftJoin(chapterEnhanced, eq(chapterEnhanced.partId, part.id))
      .leftJoin(scene, eq(scene.chapterId, chapterEnhanced.id))
      .where(eq(book.id, testBookId))
      .groupBy(book.id);

      const endTime = performance.now();
      const aggregationTime = endTime - startTime;

      expect(aggregationTime).toBeLessThan(50); // Should be very fast
      expect(wordCountQuery[0].totalWords).toBeGreaterThan(0);
    });
  });

  describe('Index Optimization', () => {
    it('should have proper indexes for foreign key relationships', async () => {
      // Check for existence of critical indexes
      const indexQuery = sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename IN ('Story', 'Part', 'ChapterEnhanced', 'Scene')
        AND indexdef LIKE '%book_id%' 
        OR indexdef LIKE '%story_id%'
        OR indexdef LIKE '%part_id%'
        OR indexdef LIKE '%chapter_id%'
      `;

      const indexes = await db.execute(indexQuery);
      
      // Should have indexes on foreign key columns
      const hasStoryBookIndex = indexes.some((idx: any) => 
        idx.tablename === 'Story' && idx.indexdef.includes('book_id')
      );
      const hasPartStoryIndex = indexes.some((idx: any) => 
        idx.tablename === 'Part' && idx.indexdef.includes('story_id')
      );
      const hasChapterPartIndex = indexes.some((idx: any) => 
        idx.tablename === 'ChapterEnhanced' && idx.indexdef.includes('part_id')
      );
      const hasSceneChapterIndex = indexes.some((idx: any) => 
        idx.tablename === 'Scene' && idx.indexdef.includes('chapter_id')
      );

      expect(hasStoryBookIndex).toBe(true);
      expect(hasPartStoryIndex).toBe(true);
      expect(hasChapterPartIndex).toBe(true);
      expect(hasSceneChapterIndex).toBe(true);
    });

    it('should have composite indexes for order-based queries', async () => {
      // Check for composite indexes on (parent_id, order_in_parent)
      const compositeIndexQuery = sql`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename IN ('Story', 'Part', 'ChapterEnhanced', 'Scene')
        AND (
          indexdef LIKE '%book_id%order_in_book%' OR
          indexdef LIKE '%story_id%order_in_story%' OR
          indexdef LIKE '%part_id%order_in_part%' OR
          indexdef LIKE '%chapter_id%order_in_chapter%'
        )
      `;

      const compositeIndexes = await db.execute(compositeIndexQuery);
      
      expect(compositeIndexes.length).toBeGreaterThan(0);
    });
  });

  describe('Query Plan Analysis', () => {
    it('should use efficient join strategies for hierarchy queries', async () => {
      const explainQuery = sql`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT COUNT(*) as total_scenes
        FROM books b
        JOIN stories s ON s.book_id = b.id
        JOIN parts p ON p.story_id = s.id
        JOIN chapters c ON c.part_id = p.id
        JOIN scenes sc ON sc.chapter_id = c.id
        WHERE b.id = ${testBookId}
      `;

      const [result] = await db.execute(explainQuery);
      const queryPlan = JSON.parse(result.toString());
      
      // Check for efficient join types (Hash Join, Nested Loop with index)
      const planStr = JSON.stringify(queryPlan);
      const hasEfficientJoins = planStr.includes('Hash Join') || planStr.includes('Nested Loop');
      const executionTime = queryPlan[0]['Execution Time'];

      expect(hasEfficientJoins).toBe(true);
      expect(executionTime).toBeLessThan(100); // Should execute quickly
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should handle large result sets efficiently without memory issues', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Query that returns large dataset
      const largeQuery = await db.select()
        .from(scenes)
        .leftJoin(chapters, eq(chapters.id, scenes.chapterId))
        .leftJoin(parts, eq(parts.id, chapters.partId))
        .leftJoin(stories, eq(stories.id, parts.storyId))
        .where(eq(stories.bookId, testBookId));

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      
      // Memory increase should be reasonable (< 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(largeQuery.length).toBeGreaterThan(0);
    });
  });
});