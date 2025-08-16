import { db } from '@/lib/db';
import { books, stories, parts, chapters, scenes } from '@/lib/db/schema';
import { eq, sql, desc, and, isNotNull } from 'drizzle-orm';

/**
 * Optimized hierarchy queries with performance considerations
 */

// Cached query for full hierarchy with optimized joins
export async function getOptimizedHierarchy(bookId: string) {
  // Use a single query with optimized joins instead of multiple queries
  const result = await db
    .select({
      // Book data
      bookId: books.id,
      bookTitle: books.title,
      bookWordCount: books.wordCount,
      
      // Story data
      storyId: stories.id,
      storyTitle: stories.title,
      storyOrder: stories.orderInBook,
      storyWordCount: stories.wordCount,
      
      // Part data
      partId: parts.id,
      partTitle: parts.title,
      partOrder: parts.orderInStory,
      partWordCount: parts.wordCount,
      
      // Chapter data
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      chapterOrder: chapters.orderInPart,
      chapterWordCount: chapters.wordCount,
      chapterStatus: chapters.status,
      
      // Scene data
      sceneId: scenes.id,
      sceneTitle: scenes.title,
      sceneOrder: scenes.orderInChapter,
      sceneWordCount: scenes.wordCount
    })
    .from(books)
    .leftJoin(stories, eq(stories.bookId, books.id))
    .leftJoin(parts, eq(parts.storyId, stories.id))
    .leftJoin(chapters, eq(chapters.partId, parts.id))
    .leftJoin(scenes, eq(scenes.chapterId, chapters.id))
    .where(eq(books.id, bookId))
    .orderBy(
      stories.orderInBook,
      parts.orderInStory,
      chapters.orderInPart,
      scenes.orderInChapter
    );

  // Transform flat result into hierarchical structure
  const hierarchyMap = new Map();
  
  result.forEach(row => {
    if (!hierarchyMap.has(row.bookId)) {
      hierarchyMap.set(row.bookId, {
        id: row.bookId,
        title: row.bookTitle,
        wordCount: row.bookWordCount,
        stories: new Map()
      });
    }
    
    const book = hierarchyMap.get(row.bookId);
    
    if (row.storyId && !book.stories.has(row.storyId)) {
      book.stories.set(row.storyId, {
        id: row.storyId,
        title: row.storyTitle,
        orderInBook: row.storyOrder,
        wordCount: row.storyWordCount,
        parts: new Map()
      });
    }
    
    if (row.storyId && row.partId) {
      const story = book.stories.get(row.storyId);
      if (!story.parts.has(row.partId)) {
        story.parts.set(row.partId, {
          id: row.partId,
          title: row.partTitle,
          orderInStory: row.partOrder,
          wordCount: row.partWordCount,
          chapters: new Map()
        });
      }
      
      if (row.chapterId) {
        const part = story.parts.get(row.partId);
        if (!part.chapters.has(row.chapterId)) {
          part.chapters.set(row.chapterId, {
            id: row.chapterId,
            title: row.chapterTitle,
            orderInPart: row.chapterOrder,
            wordCount: row.chapterWordCount,
            status: row.chapterStatus,
            scenes: new Map()
          });
        }
        
        if (row.sceneId) {
          const chapter = part.chapters.get(row.chapterId);
          chapter.scenes.set(row.sceneId, {
            id: row.sceneId,
            title: row.sceneTitle,
            orderInChapter: row.sceneOrder,
            wordCount: row.sceneWordCount
          });
        }
      }
    }
  });

  // Convert Maps to Arrays for JSON serialization
  const book = hierarchyMap.get(bookId);
  if (!book) return null;

  return {
    ...book,
    stories: Array.from(book.stories.values()).map(story => ({
      ...story,
      parts: Array.from(story.parts.values()).map(part => ({
        ...part,
        chapters: Array.from(part.chapters.values()).map(chapter => ({
          ...chapter,
          scenes: Array.from(chapter.scenes.values())
        }))
      }))
    }))
  };
}

// Optimized word count aggregation with cached computation
export async function getOptimizedWordCount(bookId: string) {
  const result = await db
    .select({
      totalWords: sql<number>`
        COALESCE(${books.wordCount}, 0) +
        COALESCE(SUM(${stories.wordCount}), 0) +
        COALESCE(SUM(${parts.wordCount}), 0) +
        COALESCE(SUM(${chapters.wordCount}), 0) +
        COALESCE(SUM(${scenes.wordCount}), 0)
      `.as('totalWords')
    })
    .from(books)
    .leftJoin(stories, eq(stories.bookId, books.id))
    .leftJoin(parts, eq(parts.storyId, stories.id))
    .leftJoin(chapters, eq(chapters.partId, parts.id))
    .leftJoin(scenes, eq(scenes.chapterId, chapters.id))
    .where(eq(books.id, bookId))
    .groupBy(books.id);

  return result[0]?.totalWords || 0;
}

// Optimized breadcrumb query with minimal joins
export async function getOptimizedBreadcrumb(sceneId: string) {
  const result = await db
    .select({
      bookId: books.id,
      bookTitle: books.title,
      storyId: stories.id,
      storyTitle: stories.title,
      storyOrder: stories.orderInBook,
      partId: parts.id,
      partTitle: parts.title,
      partOrder: parts.orderInStory,
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      chapterOrder: chapters.orderInPart,
      sceneId: scenes.id,
      sceneTitle: scenes.title,
      sceneOrder: scenes.orderInChapter
    })
    .from(scenes)
    .innerJoin(chapters, eq(chapters.id, scenes.chapterId))
    .innerJoin(parts, eq(parts.id, chapters.partId))
    .innerJoin(stories, eq(stories.id, parts.storyId))
    .innerJoin(books, eq(books.id, stories.bookId))
    .where(eq(scenes.id, sceneId))
    .limit(1);

  return result[0] || null;
}

// Paginated content query for large hierarchies
export async function getPaginatedHierarchyLevel(
  parentId: string,
  parentType: 'book' | 'story' | 'part' | 'chapter',
  page: number = 1,
  limit: number = 50
) {
  const offset = (page - 1) * limit;

  switch (parentType) {
    case 'book':
      return db
        .select({
          id: stories.id,
          title: stories.title,
          orderInBook: stories.orderInBook,
          wordCount: stories.wordCount
        })
        .from(stories)
        .where(eq(stories.bookId, parentId))
        .orderBy(stories.orderInBook)
        .limit(limit)
        .offset(offset);

    case 'story':
      return db
        .select({
          id: parts.id,
          title: parts.title,
          orderInStory: parts.orderInStory,
          wordCount: parts.wordCount
        })
        .from(parts)
        .where(eq(parts.storyId, parentId))
        .orderBy(parts.orderInStory)
        .limit(limit)
        .offset(offset);

    case 'part':
      return db
        .select({
          id: chapters.id,
          title: chapters.title,
          orderInPart: chapters.orderInPart,
          wordCount: chapters.wordCount,
          status: chapters.status
        })
        .from(chapters)
        .where(eq(chapters.partId, parentId))
        .orderBy(chapters.orderInPart)
        .limit(limit)
        .offset(offset);

    case 'chapter':
      return db
        .select({
          id: scenes.id,
          title: scenes.title,
          orderInChapter: scenes.orderInChapter,
          wordCount: scenes.wordCount
        })
        .from(scenes)
        .where(eq(scenes.chapterId, parentId))
        .orderBy(scenes.orderInChapter)
        .limit(limit)
        .offset(offset);

    default:
      throw new Error(`Invalid parent type: ${parentType}`);
  }
}

// Optimized search across hierarchy with full-text search
export async function searchHierarchyContent(
  bookId: string,
  searchTerm: string,
  limit: number = 20
) {
  const searchQuery = `%${searchTerm}%`;
  
  // Use full-text search indexes for better performance
  const results = await db
    .select({
      type: sql<string>`'chapter'`.as('type'),
      id: chapters.id,
      title: chapters.title,
      content: sql<string>`LEFT(${chapters.content}, 200)`.as('content'),
      wordCount: chapters.wordCount,
      relevance: sql<number>`
        ts_rank(
          to_tsvector('english', ${chapters.title} || ' ' || COALESCE(${chapters.content}, '')),
          plainto_tsquery('english', ${searchTerm})
        )
      `.as('relevance')
    })
    .from(chapters)
    .innerJoin(parts, eq(parts.id, chapters.partId))
    .innerJoin(stories, eq(stories.id, parts.storyId))
    .where(
      and(
        eq(stories.bookId, bookId),
        sql`to_tsvector('english', ${chapters.title} || ' ' || COALESCE(${chapters.content}, '')) @@ plainto_tsquery('english', ${searchTerm})`
      )
    )
    .orderBy(desc(sql`ts_rank(to_tsvector('english', ${chapters.title} || ' ' || COALESCE(${chapters.content}, '')), plainto_tsquery('english', ${searchTerm}))`))
    .limit(limit / 2)
    
    .union(
      db
        .select({
          type: sql<string>`'scene'`.as('type'),
          id: scenes.id,
          title: scenes.title,
          content: sql<string>`LEFT(${scenes.content}, 200)`.as('content'),
          wordCount: scenes.wordCount,
          relevance: sql<number>`
            ts_rank(
              to_tsvector('english', ${scenes.title} || ' ' || COALESCE(${scenes.content}, '')),
              plainto_tsquery('english', ${searchTerm})
            )
          `.as('relevance')
        })
        .from(scenes)
        .innerJoin(chapters, eq(chapters.id, scenes.chapterId))
        .innerJoin(parts, eq(parts.id, chapters.partId))
        .innerJoin(stories, eq(stories.id, parts.storyId))
        .where(
          and(
            eq(stories.bookId, bookId),
            sql`to_tsvector('english', ${scenes.title} || ' ' || COALESCE(${scenes.content}, '')) @@ plainto_tsquery('english', ${searchTerm})`
          )
        )
        .orderBy(desc(sql`ts_rank(to_tsvector('english', ${scenes.title} || ' ' || COALESCE(${scenes.content}, '')), plainto_tsquery('english', ${searchTerm}))`))
        .limit(limit / 2)
    );

  return results;
}

// Performance monitoring utilities
export async function getQueryPerformanceStats() {
  const result = await db.execute(sql`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      max_time,
      rows
    FROM pg_stat_statements
    WHERE query LIKE '%books%' OR query LIKE '%stories%' OR query LIKE '%parts%' OR query LIKE '%chapters%' OR query LIKE '%scenes%'
    ORDER BY total_time DESC
    LIMIT 10
  `);

  return result;
}

// Cache-friendly hierarchy structure for serialization
export interface OptimizedHierarchy {
  id: string;
  title: string;
  wordCount: number;
  stories: Array<{
    id: string;
    title: string;
    orderInBook: number;
    wordCount: number;
    parts: Array<{
      id: string;
      title: string;
      orderInStory: number;
      wordCount: number;
      chapters: Array<{
        id: string;
        title: string;
        orderInPart: number;
        wordCount: number;
        status: string;
        scenes: Array<{
          id: string;
          title: string;
          orderInChapter: number;
          wordCount: number;
        }>;
      }>;
    }>;
  }>;
}

// Batch operations for better performance
export async function batchUpdateWordCounts(bookId: string) {
  // Update scene word counts first
  await db.execute(sql`
    UPDATE scenes 
    SET word_count = (
      SELECT COALESCE(
        array_length(
          string_to_array(
            regexp_replace(content, '[^a-zA-Z0-9\s]', ' ', 'g'), 
            ' '
          ), 
          1
        ), 
        0
      )
    )
    WHERE chapter_id IN (
      SELECT c.id 
      FROM chapters c
      JOIN parts p ON p.id = c.part_id
      JOIN stories s ON s.id = p.story_id
      WHERE s.book_id = ${bookId}
    )
  `);

  // Update chapter word counts
  await db.execute(sql`
    UPDATE chapters 
    SET word_count = (
      SELECT COALESCE(SUM(sc.word_count), 0) + COALESCE(
        array_length(
          string_to_array(
            regexp_replace(chapters.content, '[^a-zA-Z0-9\s]', ' ', 'g'), 
            ' '
          ), 
          1
        ), 
        0
      )
      FROM scenes sc 
      WHERE sc.chapter_id = chapters.id
    )
    WHERE part_id IN (
      SELECT p.id 
      FROM parts p
      JOIN stories s ON s.id = p.story_id
      WHERE s.book_id = ${bookId}
    )
  `);

  // Update part word counts
  await db.execute(sql`
    UPDATE parts 
    SET word_count = (
      SELECT COALESCE(SUM(c.word_count), 0)
      FROM chapters c 
      WHERE c.part_id = parts.id
    )
    WHERE story_id IN (
      SELECT s.id 
      FROM stories s
      WHERE s.book_id = ${bookId}
    )
  `);

  // Update story word counts
  await db.execute(sql`
    UPDATE stories 
    SET word_count = (
      SELECT COALESCE(SUM(p.word_count), 0)
      FROM parts p 
      WHERE p.story_id = stories.id
    )
    WHERE book_id = ${bookId}
  `);

  // Update book word count
  await db.execute(sql`
    UPDATE books 
    SET word_count = (
      SELECT COALESCE(SUM(s.word_count), 0)
      FROM stories s 
      WHERE s.book_id = books.id
    )
    WHERE id = ${bookId}
  `);
}