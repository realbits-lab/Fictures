import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '@/lib/db/drizzle';
import { chapter, story, user, chat } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

describe('Chapter V2 Database Migration', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(chapter);
    await db.delete(story);
    await db.delete(user);
    await db.delete(chat);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(chapter);
    await db.delete(story);
    await db.delete(user);
    await db.delete(chat);
  });

  describe('ChapterGeneration table creation', () => {
    it('should create ChapterGeneration table with correct schema', async () => {
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ChapterGeneration'
        );
      `);
      
      expect(tableExists[0]?.exists).toBe(true);
    });

    it('should have correct columns in ChapterGeneration table', async () => {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ChapterGeneration'
        ORDER BY column_name;
      `);

      const expectedColumns = [
        { column_name: 'id', data_type: 'uuid', is_nullable: 'NO' },
        { column_name: 'chapterId', data_type: 'uuid', is_nullable: 'NO' },
        { column_name: 'prompt', data_type: 'text', is_nullable: 'NO' },
        { column_name: 'generatedContent', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'status', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'error', data_type: 'text', is_nullable: 'YES' },
        { column_name: 'metadata', data_type: 'jsonb', is_nullable: 'YES' },
        { column_name: 'createdAt', data_type: 'timestamp without time zone', is_nullable: 'NO' },
        { column_name: 'completedAt', data_type: 'timestamp without time zone', is_nullable: 'YES' }
      ];

      expect(columns).toEqual(expect.arrayContaining(expectedColumns));
    });

    it('should have foreign key constraint to Chapter table', async () => {
      const constraints = await db.execute(sql`
        SELECT constraint_name, table_name, column_name, foreign_table_name
        FROM information_schema.key_column_usage
        WHERE table_name = 'ChapterGeneration'
        AND constraint_name LIKE '%fkey%';
      `);

      expect(constraints).toHaveLength(1);
      expect(constraints[0]).toMatchObject({
        table_name: 'ChapterGeneration',
        column_name: 'chapterId',
        foreign_table_name: 'Chapter'
      });
    });
  });

  describe('Chapter table modifications', () => {
    it('should add chatId column to Chapter table', async () => {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Chapter' AND column_name = 'chatId';
      `);

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({
        column_name: 'chatId',
        data_type: 'uuid',
        is_nullable: 'YES'
      });
    });

    it('should add generationPrompt column to Chapter table', async () => {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Chapter' AND column_name = 'generationPrompt';
      `);

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({
        column_name: 'generationPrompt',
        data_type: 'text',
        is_nullable: 'YES'
      });
    });

    it('should add previousChapterSummary column to Chapter table', async () => {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Chapter' AND column_name = 'previousChapterSummary';
      `);

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({
        column_name: 'previousChapterSummary',
        data_type: 'text',
        is_nullable: 'YES'
      });
    });
  });

  describe('Chat table modifications', () => {
    it('should add chatType column to Chat table', async () => {
      const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Chat' AND column_name = 'chatType';
      `);

      expect(columns).toHaveLength(1);
      expect(columns[0]).toMatchObject({
        column_name: 'chatType',
        data_type: 'character varying',
        is_nullable: 'YES'
      });
    });
  });

  describe('Indexes creation', () => {
    it('should create performance indexes', async () => {
      const indexes = await db.execute(sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename IN ('Chapter', 'ChapterGeneration')
        AND indexname LIKE 'idx_%';
      `);

      const expectedIndexes = [
        'idx_chapter_chatid',
        'idx_chapter_generation_chapterid',
        'idx_chapter_generation_status',
        'idx_chapter_generation_created'
      ];

      const indexNames = indexes.map(idx => idx.indexname);
      expectedIndexes.forEach(expectedIndex => {
        expect(indexNames).toContain(expectedIndex);
      });
    });
  });

  describe('Data integrity', () => {
    it('should maintain referential integrity with existing data', async () => {
      // Create test user
      const [testUser] = await db.insert(user).values({
        email: 'test@example.com',
        name: 'Test User'
      }).returning();

      // Create test story
      const [testStory] = await db.insert(story).values({
        title: 'Test Story',
        authorId: testUser.id
      }).returning();

      // Create test chapter
      const [testChapter] = await db.insert(chapter).values({
        storyId: testStory.id,
        chapterNumber: 1,
        title: 'Test Chapter',
        content: JSON.stringify([{ type: 'paragraph', children: [{ text: 'Test content' }] }])
      }).returning();

      expect(testChapter).toBeDefined();
      expect(testChapter.storyId).toBe(testStory.id);
    });
  });
});