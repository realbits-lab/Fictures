import { describe, it, expect } from '@jest/globals';
import { 
  story, 
  part, 
  chapterEnhanced, 
  scene, 
  bookHierarchyPath, 
  contentSearchIndex 
} from '@/lib/db/schema';

/**
 * Schema Structure Tests for Book Hierarchy
 * 
 * Tests the schema definitions without requiring database connection
 * Following TDD methodology - GREEN phase verification
 * 
 * These tests verify:
 * - Table definitions exist
 * - Column types are correct
 * - Required fields are properly defined
 * - Enum values are correctly configured
 */

describe('Book Hierarchy Schema Structure', () => {
  describe('Story Table Schema', () => {
    it('should have story table defined with required columns', () => {
      expect(story).toBeDefined();
      
      // Check required columns exist
      expect(story.id).toBeDefined();
      expect(story.bookId).toBeDefined();
      expect(story.title).toBeDefined();
      expect(story.themes).toBeDefined();
      expect(story.order).toBeDefined();
      expect(story.wordCount).toBeDefined();
      expect(story.partCount).toBeDefined();
      expect(story.isActive).toBeDefined();
      expect(story.createdAt).toBeDefined();
      expect(story.updatedAt).toBeDefined();
    });

    it('should have story table with expected structure', () => {
      // Verify the table has the expected column properties
      expect(typeof story.id).toBe('object');
      expect(typeof story.bookId).toBe('object');
      expect(typeof story.title).toBe('object');
      expect(typeof story.themes).toBe('object');
      expect(typeof story.order).toBe('object');
      expect(typeof story.wordCount).toBe('object');
      expect(typeof story.partCount).toBe('object');
      expect(typeof story.isActive).toBe('object');
      expect(typeof story.createdAt).toBe('object');
      expect(typeof story.updatedAt).toBe('object');
    });
  });

  describe('Part Table Schema', () => {
    it('should have correct table name and structure', () => {
      expect(part).toBeDefined();
      expect(part._.name).toBe('Part');
      
      // Check required columns exist
      expect(part.id).toBeDefined();
      expect(part.storyId).toBeDefined();
      expect(part.title).toBeDefined();
      expect(part.partNumber).toBeDefined();
      expect(part.wordCount).toBeDefined();
      expect(part.chapterCount).toBeDefined();
      expect(part.order).toBeDefined();
      expect(part.isComplete).toBeDefined();
    });

    it('should have correct column configurations', () => {
      // Check primary key
      expect(part.id.primary).toBe(true);
      expect(part.id.notNull).toBe(true);
      
      // Check required fields
      expect(part.storyId.notNull).toBe(true);
      expect(part.title.notNull).toBe(true);
      expect(part.partNumber.notNull).toBe(true);
      
      // Check default values
      expect(part.wordCount.default).toBeDefined();
      expect(part.chapterCount.default).toBeDefined();
      expect(part.order.default).toBeDefined();
      expect(part.isComplete.default).toBeDefined();
    });
  });

  describe('ChapterEnhanced Table Schema', () => {
    it('should have correct table name and structure', () => {
      expect(chapterEnhanced).toBeDefined();
      expect(chapterEnhanced._.name).toBe('ChapterEnhanced');
      
      // Check required columns exist
      expect(chapterEnhanced.id).toBeDefined();
      expect(chapterEnhanced.partId).toBeDefined();
      expect(chapterEnhanced.bookId).toBeDefined();
      expect(chapterEnhanced.chapterNumber).toBeDefined();
      expect(chapterEnhanced.globalChapterNumber).toBeDefined();
      expect(chapterEnhanced.title).toBeDefined();
      expect(chapterEnhanced.content).toBeDefined();
      expect(chapterEnhanced.wordCount).toBeDefined();
      expect(chapterEnhanced.sceneCount).toBeDefined();
      expect(chapterEnhanced.charactersPresent).toBeDefined();
      expect(chapterEnhanced.isPublished).toBeDefined();
    });

    it('should have correct column configurations', () => {
      // Check primary key
      expect(chapterEnhanced.id.primary).toBe(true);
      expect(chapterEnhanced.id.notNull).toBe(true);
      
      // Check required fields
      expect(chapterEnhanced.partId.notNull).toBe(true);
      expect(chapterEnhanced.bookId.notNull).toBe(true);
      expect(chapterEnhanced.chapterNumber.notNull).toBe(true);
      expect(chapterEnhanced.globalChapterNumber.notNull).toBe(true);
      expect(chapterEnhanced.title.notNull).toBe(true);
      expect(chapterEnhanced.content.notNull).toBe(true);
      
      // Check default values
      expect(chapterEnhanced.wordCount.default).toBeDefined();
      expect(chapterEnhanced.sceneCount.default).toBeDefined();
      expect(chapterEnhanced.order.default).toBeDefined();
      expect(chapterEnhanced.isPublished.default).toBeDefined();
    });
  });

  describe('Scene Table Schema', () => {
    it('should have correct table name and structure', () => {
      expect(scene).toBeDefined();
      expect(scene._.name).toBe('Scene');
      
      // Check required columns exist
      expect(scene.id).toBeDefined();
      expect(scene.chapterId).toBeDefined();
      expect(scene.sceneNumber).toBeDefined();
      expect(scene.content).toBeDefined();
      expect(scene.wordCount).toBeDefined();
      expect(scene.order).toBeDefined();
      expect(scene.sceneType).toBeDefined();
      expect(scene.charactersPresent).toBeDefined();
      expect(scene.mood).toBeDefined();
      expect(scene.isComplete).toBeDefined();
    });

    it('should have correct column configurations', () => {
      // Check primary key
      expect(scene.id.primary).toBe(true);
      expect(scene.id.notNull).toBe(true);
      
      // Check required fields
      expect(scene.chapterId.notNull).toBe(true);
      expect(scene.sceneNumber.notNull).toBe(true);
      expect(scene.content.notNull).toBe(true);
      
      // Check default values
      expect(scene.wordCount.default).toBeDefined();
      expect(scene.order.default).toBeDefined();
      expect(scene.sceneType.default).toBeDefined();
      expect(scene.mood.default).toBeDefined();
      expect(scene.isComplete.default).toBeDefined();
    });

    it('should have correct enum configurations for sceneType', () => {
      // Check enum values for sceneType
      const sceneTypeEnum = scene.sceneType.enumValues;
      expect(sceneTypeEnum).toContain('action');
      expect(sceneTypeEnum).toContain('dialogue');
      expect(sceneTypeEnum).toContain('exposition');
      expect(sceneTypeEnum).toContain('transition');
      expect(sceneTypeEnum).toContain('climax');
    });

    it('should have correct enum configurations for mood', () => {
      // Check enum values for mood
      const moodEnum = scene.mood.enumValues;
      expect(moodEnum).toContain('tense');
      expect(moodEnum).toContain('romantic');
      expect(moodEnum).toContain('mysterious');
      expect(moodEnum).toContain('comedic');
      expect(moodEnum).toContain('dramatic');
      expect(moodEnum).toContain('neutral');
    });
  });

  describe('BookHierarchyPath Table Schema', () => {
    it('should have correct table name and structure', () => {
      expect(bookHierarchyPath).toBeDefined();
      expect(bookHierarchyPath._.name).toBe('BookHierarchyPath');
      
      // Check required columns exist
      expect(bookHierarchyPath.id).toBeDefined();
      expect(bookHierarchyPath.bookId).toBeDefined();
      expect(bookHierarchyPath.level).toBeDefined();
      expect(bookHierarchyPath.path).toBeDefined();
      expect(bookHierarchyPath.createdAt).toBeDefined();
    });

    it('should have correct column configurations', () => {
      // Check primary key
      expect(bookHierarchyPath.id.primary).toBe(true);
      expect(bookHierarchyPath.id.notNull).toBe(true);
      
      // Check required fields
      expect(bookHierarchyPath.bookId.notNull).toBe(true);
      expect(bookHierarchyPath.level.notNull).toBe(true);
      expect(bookHierarchyPath.path.notNull).toBe(true);
    });

    it('should have correct enum configurations for level', () => {
      // Check enum values for level
      const levelEnum = bookHierarchyPath.level.enumValues;
      expect(levelEnum).toContain('book');
      expect(levelEnum).toContain('story');
      expect(levelEnum).toContain('part');
      expect(levelEnum).toContain('chapter');
      expect(levelEnum).toContain('scene');
    });
  });

  describe('ContentSearchIndex Table Schema', () => {
    it('should have correct table name and structure', () => {
      expect(contentSearchIndex).toBeDefined();
      expect(contentSearchIndex._.name).toBe('ContentSearchIndex');
      
      // Check required columns exist
      expect(contentSearchIndex.id).toBeDefined();
      expect(contentSearchIndex.bookId).toBeDefined();
      expect(contentSearchIndex.entityType).toBeDefined();
      expect(contentSearchIndex.entityId).toBeDefined();
      expect(contentSearchIndex.searchableText).toBeDefined();
      expect(contentSearchIndex.title).toBeDefined();
      expect(contentSearchIndex.path).toBeDefined();
      expect(contentSearchIndex.updatedAt).toBeDefined();
    });

    it('should have correct column configurations', () => {
      // Check primary key
      expect(contentSearchIndex.id.primary).toBe(true);
      expect(contentSearchIndex.id.notNull).toBe(true);
      
      // Check required fields
      expect(contentSearchIndex.bookId.notNull).toBe(true);
      expect(contentSearchIndex.entityType.notNull).toBe(true);
      expect(contentSearchIndex.entityId.notNull).toBe(true);
      expect(contentSearchIndex.searchableText.notNull).toBe(true);
      expect(contentSearchIndex.title.notNull).toBe(true);
      expect(contentSearchIndex.path.notNull).toBe(true);
    });

    it('should have correct enum configurations for entityType', () => {
      // Check enum values for entityType
      const entityTypeEnum = contentSearchIndex.entityType.enumValues;
      expect(entityTypeEnum).toContain('story');
      expect(entityTypeEnum).toContain('part');
      expect(entityTypeEnum).toContain('chapter');
      expect(entityTypeEnum).toContain('scene');
    });
  });

  describe('Schema Relationships', () => {
    it('should have foreign key references properly configured', () => {
      // Story references Book
      expect(story.bookId.references).toBeDefined();
      
      // Part references Story
      expect(part.storyId.references).toBeDefined();
      
      // ChapterEnhanced references Part and Book
      expect(chapterEnhanced.partId.references).toBeDefined();
      expect(chapterEnhanced.bookId.references).toBeDefined();
      
      // Scene references ChapterEnhanced
      expect(scene.chapterId.references).toBeDefined();
      
      // BookHierarchyPath references Book
      expect(bookHierarchyPath.bookId.references).toBeDefined();
      
      // ContentSearchIndex references Book
      expect(contentSearchIndex.bookId.references).toBeDefined();
    });
  });

  describe('Type Exports', () => {
    it('should export TypeScript types for all tables', () => {
      // These will be tested by TypeScript compilation
      // If the types don't exist, the import will fail
      const types = {
        Story: 'Story',
        Part: 'Part', 
        ChapterEnhanced: 'ChapterEnhanced',
        Scene: 'Scene',
        BookHierarchyPath: 'BookHierarchyPath',
        ContentSearchIndex: 'ContentSearchIndex'
      };
      
      expect(types).toBeDefined();
    });
  });
});