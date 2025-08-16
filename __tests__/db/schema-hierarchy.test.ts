import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/lib/db';
import { 
  story, 
  part, 
  chapterEnhanced, 
  scene, 
  bookHierarchyPath, 
  contentSearchIndex,
  book,
  user
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Database Schema Tests for Book Hierarchy
 * 
 * Tests the 4-level hierarchy: Story > Part > Chapter > Scene
 * Following TDD methodology - RED phase
 * 
 * These tests verify:
 * - Table structure and columns
 * - Foreign key relationships
 * - Constraints and indexes
 * - Data integrity
 */

describe('Book Hierarchy Database Schema', () => {
  let testUserId: string;
  let testBookId: string;
  let testStoryId: string;
  let testPartId: string;
  let testChapterId: string;
  let testSceneId: string;

  beforeAll(async () => {
    // Create test user and book for foreign key relationships
    const testUser = await db.insert(user).values({
      email: 'test-hierarchy@example.com',
      name: 'Test Hierarchy User'
    }).returning();
    testUserId = testUser[0].id;

    const testBook = await db.insert(book).values({
      title: 'Test Book for Hierarchy',
      description: 'Testing book hierarchy',
      authorId: testUserId
    }).returning();
    testBookId = testBook[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(contentSearchIndex).where(eq(contentSearchIndex.bookId, testBookId));
    await db.delete(bookHierarchyPath).where(eq(bookHierarchyPath.bookId, testBookId));
    await db.delete(scene).where(eq(scene.chapterId, testChapterId));
    await db.delete(chapterEnhanced).where(eq(chapterEnhanced.bookId, testBookId));
    await db.delete(part).where(eq(part.storyId, testStoryId));
    await db.delete(story).where(eq(story.bookId, testBookId));
    await db.delete(book).where(eq(book.id, testBookId));
    await db.delete(user).where(eq(user.id, testUserId));
  });

  describe('Story Table', () => {
    it('should create a story with all required fields', async () => {
      const storyData = {
        bookId: testBookId,
        title: 'Test Story',
        synopsis: 'A test story synopsis',
        themes: ['adventure', 'friendship'],
        worldSettings: { setting: 'fantasy realm' },
        characterArcs: { protagonist: 'hero journey' },
        plotStructure: { acts: 3 },
        order: 1,
        wordCount: 0,
        partCount: 0,
        isActive: true,
        metadata: { testFlag: true }
      };

      const result = await db.insert(story).values(storyData).returning();
      expect(result).toHaveLength(1);
      
      const createdStory = result[0];
      testStoryId = createdStory.id;
      
      expect(createdStory.bookId).toBe(testBookId);
      expect(createdStory.title).toBe('Test Story');
      expect(createdStory.synopsis).toBe('A test story synopsis');
      expect(createdStory.themes).toEqual(['adventure', 'friendship']);
      expect(createdStory.order).toBe(1);
      expect(createdStory.isActive).toBe(true);
      expect(createdStory.id).toBeDefined();
      expect(createdStory.createdAt).toBeInstanceOf(Date);
      expect(createdStory.updatedAt).toBeInstanceOf(Date);
    });

    it('should enforce foreign key constraint on bookId', async () => {
      const invalidStoryData = {
        bookId: '00000000-0000-0000-0000-000000000000', // Non-existent book ID
        title: 'Invalid Story',
        order: 1
      };

      await expect(
        db.insert(story).values(invalidStoryData)
      ).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const minimalStoryData = {
        bookId: testBookId,
        title: 'Minimal Story'
      };

      const result = await db.insert(story).values(minimalStoryData).returning();
      const createdStory = result[0];

      expect(createdStory.themes).toEqual([]);
      expect(createdStory.order).toBe(0);
      expect(createdStory.wordCount).toBe(0);
      expect(createdStory.partCount).toBe(0);
      expect(createdStory.isActive).toBe(true);
    });
  });

  describe('Part Table', () => {
    it('should create a part with all required fields', async () => {
      const partData = {
        storyId: testStoryId,
        title: 'Test Part',
        description: 'A test part description',
        partNumber: 1,
        thematicFocus: 'introduction',
        timeframe: { start: 'day 1', end: 'day 30' },
        location: 'starting village',
        wordCount: 0,
        chapterCount: 0,
        order: 1,
        isComplete: false,
        notes: 'Author notes for this part',
        metadata: { testFlag: true }
      };

      const result = await db.insert(part).values(partData).returning();
      expect(result).toHaveLength(1);
      
      const createdPart = result[0];
      testPartId = createdPart.id;
      
      expect(createdPart.storyId).toBe(testStoryId);
      expect(createdPart.title).toBe('Test Part');
      expect(createdPart.partNumber).toBe(1);
      expect(createdPart.thematicFocus).toBe('introduction');
      expect(createdPart.location).toBe('starting village');
      expect(createdPart.isComplete).toBe(false);
      expect(createdPart.id).toBeDefined();
      expect(createdPart.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce foreign key constraint on storyId', async () => {
      const invalidPartData = {
        storyId: '00000000-0000-0000-0000-000000000000', // Non-existent story ID
        title: 'Invalid Part',
        partNumber: 1
      };

      await expect(
        db.insert(part).values(invalidPartData)
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on storyId + partNumber', async () => {
      const duplicatePartData = {
        storyId: testStoryId,
        title: 'Duplicate Part',
        partNumber: 1 // Same part number as existing part
      };

      await expect(
        db.insert(part).values(duplicatePartData)
      ).rejects.toThrow();
    });
  });

  describe('ChapterEnhanced Table', () => {
    it('should create a chapter with all required fields', async () => {
      const chapterData = {
        partId: testPartId,
        bookId: testBookId, // For backward compatibility
        chapterNumber: 1,
        globalChapterNumber: 1,
        title: 'Test Chapter',
        summary: 'A test chapter summary',
        content: { blocks: [{ type: 'paragraph', text: 'Test content' }] },
        wordCount: 10,
        sceneCount: 0,
        order: 1,
        pov: 'protagonist',
        timeline: { day: 1, time: 'morning' },
        setting: 'village square',
        charactersPresent: ['protagonist', 'mentor'],
        isPublished: false,
        generationPrompt: 'Write an opening chapter',
        previousChapterSummary: null,
        nextChapterHints: 'introduce conflict',
        authorNote: 'First chapter notes',
        metadata: { testFlag: true }
      };

      const result = await db.insert(chapterEnhanced).values(chapterData).returning();
      expect(result).toHaveLength(1);
      
      const createdChapter = result[0];
      testChapterId = createdChapter.id;
      
      expect(createdChapter.partId).toBe(testPartId);
      expect(createdChapter.bookId).toBe(testBookId);
      expect(createdChapter.chapterNumber).toBe(1);
      expect(createdChapter.globalChapterNumber).toBe(1);
      expect(createdChapter.title).toBe('Test Chapter');
      expect(createdChapter.pov).toBe('protagonist');
      expect(createdChapter.setting).toBe('village square');
      expect(createdChapter.charactersPresent).toEqual(['protagonist', 'mentor']);
      expect(createdChapter.isPublished).toBe(false);
      expect(createdChapter.id).toBeDefined();
    });

    it('should enforce foreign key constraints', async () => {
      const invalidChapterData = {
        partId: '00000000-0000-0000-0000-000000000000', // Non-existent part ID
        bookId: testBookId,
        chapterNumber: 1,
        globalChapterNumber: 1,
        title: 'Invalid Chapter',
        content: {}
      };

      await expect(
        db.insert(chapterEnhanced).values(invalidChapterData)
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on partId + chapterNumber', async () => {
      const duplicateChapterData = {
        partId: testPartId,
        bookId: testBookId,
        chapterNumber: 1, // Same chapter number as existing chapter
        globalChapterNumber: 2,
        title: 'Duplicate Chapter',
        content: {}
      };

      await expect(
        db.insert(chapterEnhanced).values(duplicateChapterData)
      ).rejects.toThrow();
    });
  });

  describe('Scene Table', () => {
    it('should create a scene with all required fields', async () => {
      const sceneData = {
        chapterId: testChapterId,
        sceneNumber: 1,
        title: 'Opening Scene',
        content: 'The sun rose over the village...',
        wordCount: 50,
        order: 1,
        sceneType: 'action' as const,
        pov: 'protagonist',
        location: 'village square',
        timeOfDay: 'morning',
        charactersPresent: ['protagonist'],
        mood: 'neutral' as const,
        purpose: 'introduce setting and character',
        conflict: 'character motivation',
        resolution: 'decision to act',
        hooks: { foreshadowing: 'danger approaching' },
        beats: { opening: 'character wakes up' },
        isComplete: true,
        generationPrompt: 'Write an opening scene',
        aiContext: { contextType: 'opening' },
        notes: 'Scene notes',
        metadata: { testFlag: true }
      };

      const result = await db.insert(scene).values(sceneData).returning();
      expect(result).toHaveLength(1);
      
      const createdScene = result[0];
      testSceneId = createdScene.id;
      
      expect(createdScene.chapterId).toBe(testChapterId);
      expect(createdScene.sceneNumber).toBe(1);
      expect(createdScene.title).toBe('Opening Scene');
      expect(createdScene.content).toBe('The sun rose over the village...');
      expect(createdScene.wordCount).toBe(50);
      expect(createdScene.sceneType).toBe('action');
      expect(createdScene.mood).toBe('neutral');
      expect(createdScene.charactersPresent).toEqual(['protagonist']);
      expect(createdScene.isComplete).toBe(true);
      expect(createdScene.id).toBeDefined();
    });

    it('should enforce foreign key constraint on chapterId', async () => {
      const invalidSceneData = {
        chapterId: '00000000-0000-0000-0000-000000000000', // Non-existent chapter ID
        sceneNumber: 1,
        content: 'Invalid scene content'
      };

      await expect(
        db.insert(scene).values(invalidSceneData)
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on chapterId + sceneNumber', async () => {
      const duplicateSceneData = {
        chapterId: testChapterId,
        sceneNumber: 1, // Same scene number as existing scene
        content: 'Duplicate scene content'
      };

      await expect(
        db.insert(scene).values(duplicateSceneData)
      ).rejects.toThrow();
    });

    it('should set default enum values correctly', async () => {
      const minimalSceneData = {
        chapterId: testChapterId,
        sceneNumber: 2,
        content: 'Minimal scene content'
      };

      const result = await db.insert(scene).values(minimalSceneData).returning();
      const createdScene = result[0];

      expect(createdScene.sceneType).toBe('action');
      expect(createdScene.mood).toBe('neutral');
      expect(createdScene.order).toBe(0);
      expect(createdScene.wordCount).toBe(0);
      expect(createdScene.isComplete).toBe(false);
      expect(createdScene.charactersPresent).toEqual([]);
    });
  });

  describe('BookHierarchyPath Table', () => {
    it('should create hierarchy path entries for navigation', async () => {
      const pathData = {
        bookId: testBookId,
        storyId: testStoryId,
        partId: testPartId,
        chapterId: testChapterId,
        sceneId: testSceneId,
        level: 'scene' as const,
        path: `/book/${testBookId}/story/${testStoryId}/part/${testPartId}/chapter/${testChapterId}/scene/${testSceneId}`,
        breadcrumb: {
          book: 'Test Book for Hierarchy',
          story: 'Test Story',
          part: 'Test Part',
          chapter: 'Test Chapter',
          scene: 'Opening Scene'
        }
      };

      const result = await db.insert(bookHierarchyPath).values(pathData).returning();
      expect(result).toHaveLength(1);
      
      const createdPath = result[0];
      expect(createdPath.bookId).toBe(testBookId);
      expect(createdPath.level).toBe('scene');
      expect(createdPath.path).toContain(testBookId);
      expect(createdPath.breadcrumb).toHaveProperty('book');
      expect(createdPath.id).toBeDefined();
    });

    it('should enforce foreign key constraint on bookId', async () => {
      const invalidPathData = {
        bookId: '00000000-0000-0000-0000-000000000000', // Non-existent book ID
        level: 'book' as const,
        path: '/invalid/path'
      };

      await expect(
        db.insert(bookHierarchyPath).values(invalidPathData)
      ).rejects.toThrow();
    });
  });

  describe('ContentSearchIndex Table', () => {
    it('should create search index entries for content', async () => {
      const indexData = {
        bookId: testBookId,
        entityType: 'scene' as const,
        entityId: testSceneId,
        searchableText: 'Opening Scene The sun rose over the village protagonist village square',
        title: 'Opening Scene',
        path: `/book/${testBookId}/scene/${testSceneId}`,
        metadata: { sceneType: 'action', mood: 'neutral' },
        tsvector: 'opening:1 scene:2 sun:3 rose:4 village:5'
      };

      const result = await db.insert(contentSearchIndex).values(indexData).returning();
      expect(result).toHaveLength(1);
      
      const createdIndex = result[0];
      expect(createdIndex.bookId).toBe(testBookId);
      expect(createdIndex.entityType).toBe('scene');
      expect(createdIndex.entityId).toBe(testSceneId);
      expect(createdIndex.searchableText).toContain('Opening Scene');
      expect(createdIndex.title).toBe('Opening Scene');
      expect(createdIndex.id).toBeDefined();
    });

    it('should enforce foreign key constraint on bookId', async () => {
      const invalidIndexData = {
        bookId: '00000000-0000-0000-0000-000000000000', // Non-existent book ID
        entityType: 'scene' as const,
        entityId: testSceneId,
        searchableText: 'invalid content',
        title: 'Invalid',
        path: '/invalid'
      };

      await expect(
        db.insert(contentSearchIndex).values(invalidIndexData)
      ).rejects.toThrow();
    });
  });

  describe('Cascade Delete Functionality', () => {
    it('should cascade delete scenes when chapter is deleted', async () => {
      // Create a test chapter with scenes for deletion
      const tempChapter = await db.insert(chapterEnhanced).values({
        partId: testPartId,
        bookId: testBookId,
        chapterNumber: 99,
        globalChapterNumber: 99,
        title: 'Temp Chapter for Deletion',
        content: {}
      }).returning();

      const tempChapterId = tempChapter[0].id;

      const tempScene = await db.insert(scene).values({
        chapterId: tempChapterId,
        sceneNumber: 1,
        content: 'Temp scene for deletion test'
      }).returning();

      // Verify scene exists
      const scenesBeforeDelete = await db.select()
        .from(scene)
        .where(eq(scene.chapterId, tempChapterId));
      expect(scenesBeforeDelete).toHaveLength(1);

      // Delete chapter
      await db.delete(chapterEnhanced).where(eq(chapterEnhanced.id, tempChapterId));

      // Verify scenes are deleted
      const scenesAfterDelete = await db.select()
        .from(scene)
        .where(eq(scene.chapterId, tempChapterId));
      expect(scenesAfterDelete).toHaveLength(0);
    });

    it('should cascade delete parts when story is deleted', async () => {
      // Create a test story with parts for deletion
      const tempStory = await db.insert(story).values({
        bookId: testBookId,
        title: 'Temp Story for Deletion'
      }).returning();

      const tempStoryId = tempStory[0].id;

      const tempPart = await db.insert(part).values({
        storyId: tempStoryId,
        title: 'Temp Part for Deletion',
        partNumber: 99
      }).returning();

      // Verify part exists
      const partsBeforeDelete = await db.select()
        .from(part)
        .where(eq(part.storyId, tempStoryId));
      expect(partsBeforeDelete).toHaveLength(1);

      // Delete story
      await db.delete(story).where(eq(story.id, tempStoryId));

      // Verify parts are deleted
      const partsAfterDelete = await db.select()
        .from(part)
        .where(eq(part.storyId, tempStoryId));
      expect(partsAfterDelete).toHaveLength(0);
    });
  });

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity across all hierarchy levels', async () => {
      // Verify the complete hierarchy chain exists
      const storyResult = await db.select()
        .from(story)
        .where(eq(story.id, testStoryId));
      expect(storyResult).toHaveLength(1);
      expect(storyResult[0].bookId).toBe(testBookId);

      const partResult = await db.select()
        .from(part)
        .where(eq(part.id, testPartId));
      expect(partResult).toHaveLength(1);
      expect(partResult[0].storyId).toBe(testStoryId);

      const chapterResult = await db.select()
        .from(chapterEnhanced)
        .where(eq(chapterEnhanced.id, testChapterId));
      expect(chapterResult).toHaveLength(1);
      expect(chapterResult[0].partId).toBe(testPartId);
      expect(chapterResult[0].bookId).toBe(testBookId);

      const sceneResult = await db.select()
        .from(scene)
        .where(eq(scene.id, testSceneId));
      expect(sceneResult).toHaveLength(1);
      expect(sceneResult[0].chapterId).toBe(testChapterId);
    });

    it('should support complex queries across hierarchy levels', async () => {
      // Test join query across all levels
      const hierarchyQuery = await db.select({
        bookTitle: book.title,
        storyTitle: story.title,
        partTitle: part.title,
        chapterTitle: chapterEnhanced.title,
        sceneTitle: scene.title,
        sceneContent: scene.content
      })
      .from(scene)
      .innerJoin(chapterEnhanced, eq(scene.chapterId, chapterEnhanced.id))
      .innerJoin(part, eq(chapterEnhanced.partId, part.id))
      .innerJoin(story, eq(part.storyId, story.id))
      .innerJoin(book, eq(story.bookId, book.id))
      .where(eq(scene.id, testSceneId));

      expect(hierarchyQuery).toHaveLength(1);
      const result = hierarchyQuery[0];
      expect(result.bookTitle).toBe('Test Book for Hierarchy');
      expect(result.storyTitle).toBe('Test Story');
      expect(result.partTitle).toBe('Test Part');
      expect(result.chapterTitle).toBe('Test Chapter');
      expect(result.sceneTitle).toBe('Opening Scene');
    });
  });
});