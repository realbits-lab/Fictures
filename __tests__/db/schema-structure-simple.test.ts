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
 * Simple Schema Structure Tests for Book Hierarchy
 * 
 * Tests that schema definitions exist and are importable
 * Following TDD methodology - GREEN phase verification
 * 
 * These tests verify that:
 * - All hierarchy tables are properly defined
 * - All required columns exist in each table
 * - Tables can be imported without errors
 */

describe('Book Hierarchy Schema Definitions', () => {
  describe('Schema Table Imports', () => {
    it('should import story table successfully', () => {
      expect(story).toBeDefined();
      expect(typeof story).toBe('object');
    });

    it('should import part table successfully', () => {
      expect(part).toBeDefined();
      expect(typeof part).toBe('object');
    });

    it('should import chapterEnhanced table successfully', () => {
      expect(chapterEnhanced).toBeDefined();
      expect(typeof chapterEnhanced).toBe('object');
    });

    it('should import scene table successfully', () => {
      expect(scene).toBeDefined();
      expect(typeof scene).toBe('object');
    });

    it('should import bookHierarchyPath table successfully', () => {
      expect(bookHierarchyPath).toBeDefined();
      expect(typeof bookHierarchyPath).toBe('object');
    });

    it('should import contentSearchIndex table successfully', () => {
      expect(contentSearchIndex).toBeDefined();
      expect(typeof contentSearchIndex).toBe('object');
    });
  });

  describe('Story Table Columns', () => {
    it('should have all required story columns', () => {
      expect(story.id).toBeDefined();
      expect(story.bookId).toBeDefined();
      expect(story.title).toBeDefined();
      expect(story.synopsis).toBeDefined();
      expect(story.themes).toBeDefined();
      expect(story.worldSettings).toBeDefined();
      expect(story.characterArcs).toBeDefined();
      expect(story.plotStructure).toBeDefined();
      expect(story.order).toBeDefined();
      expect(story.wordCount).toBeDefined();
      expect(story.partCount).toBeDefined();
      expect(story.isActive).toBeDefined();
      expect(story.metadata).toBeDefined();
      expect(story.createdAt).toBeDefined();
      expect(story.updatedAt).toBeDefined();
    });
  });

  describe('Part Table Columns', () => {
    it('should have all required part columns', () => {
      expect(part.id).toBeDefined();
      expect(part.storyId).toBeDefined();
      expect(part.title).toBeDefined();
      expect(part.description).toBeDefined();
      expect(part.partNumber).toBeDefined();
      expect(part.thematicFocus).toBeDefined();
      expect(part.timeframe).toBeDefined();
      expect(part.location).toBeDefined();
      expect(part.wordCount).toBeDefined();
      expect(part.chapterCount).toBeDefined();
      expect(part.order).toBeDefined();
      expect(part.isComplete).toBeDefined();
      expect(part.notes).toBeDefined();
      expect(part.metadata).toBeDefined();
      expect(part.createdAt).toBeDefined();
      expect(part.updatedAt).toBeDefined();
    });
  });

  describe('ChapterEnhanced Table Columns', () => {
    it('should have all required chapterEnhanced columns', () => {
      expect(chapterEnhanced.id).toBeDefined();
      expect(chapterEnhanced.partId).toBeDefined();
      expect(chapterEnhanced.bookId).toBeDefined();
      expect(chapterEnhanced.chapterNumber).toBeDefined();
      expect(chapterEnhanced.globalChapterNumber).toBeDefined();
      expect(chapterEnhanced.title).toBeDefined();
      expect(chapterEnhanced.summary).toBeDefined();
      expect(chapterEnhanced.content).toBeDefined();
      expect(chapterEnhanced.wordCount).toBeDefined();
      expect(chapterEnhanced.sceneCount).toBeDefined();
      expect(chapterEnhanced.order).toBeDefined();
      expect(chapterEnhanced.pov).toBeDefined();
      expect(chapterEnhanced.timeline).toBeDefined();
      expect(chapterEnhanced.setting).toBeDefined();
      expect(chapterEnhanced.charactersPresent).toBeDefined();
      expect(chapterEnhanced.isPublished).toBeDefined();
      expect(chapterEnhanced.publishedAt).toBeDefined();
      expect(chapterEnhanced.chatId).toBeDefined();
      expect(chapterEnhanced.generationPrompt).toBeDefined();
      expect(chapterEnhanced.previousChapterSummary).toBeDefined();
      expect(chapterEnhanced.nextChapterHints).toBeDefined();
      expect(chapterEnhanced.authorNote).toBeDefined();
      expect(chapterEnhanced.metadata).toBeDefined();
      expect(chapterEnhanced.createdAt).toBeDefined();
      expect(chapterEnhanced.updatedAt).toBeDefined();
    });
  });

  describe('Scene Table Columns', () => {
    it('should have all required scene columns', () => {
      expect(scene.id).toBeDefined();
      expect(scene.chapterId).toBeDefined();
      expect(scene.sceneNumber).toBeDefined();
      expect(scene.title).toBeDefined();
      expect(scene.content).toBeDefined();
      expect(scene.wordCount).toBeDefined();
      expect(scene.order).toBeDefined();
      expect(scene.sceneType).toBeDefined();
      expect(scene.pov).toBeDefined();
      expect(scene.location).toBeDefined();
      expect(scene.timeOfDay).toBeDefined();
      expect(scene.charactersPresent).toBeDefined();
      expect(scene.mood).toBeDefined();
      expect(scene.purpose).toBeDefined();
      expect(scene.conflict).toBeDefined();
      expect(scene.resolution).toBeDefined();
      expect(scene.hooks).toBeDefined();
      expect(scene.beats).toBeDefined();
      expect(scene.isComplete).toBeDefined();
      expect(scene.generationPrompt).toBeDefined();
      expect(scene.aiContext).toBeDefined();
      expect(scene.notes).toBeDefined();
      expect(scene.metadata).toBeDefined();
      expect(scene.createdAt).toBeDefined();
      expect(scene.updatedAt).toBeDefined();
    });
  });

  describe('BookHierarchyPath Table Columns', () => {
    it('should have all required bookHierarchyPath columns', () => {
      expect(bookHierarchyPath.id).toBeDefined();
      expect(bookHierarchyPath.bookId).toBeDefined();
      expect(bookHierarchyPath.storyId).toBeDefined();
      expect(bookHierarchyPath.partId).toBeDefined();
      expect(bookHierarchyPath.chapterId).toBeDefined();
      expect(bookHierarchyPath.sceneId).toBeDefined();
      expect(bookHierarchyPath.level).toBeDefined();
      expect(bookHierarchyPath.path).toBeDefined();
      expect(bookHierarchyPath.breadcrumb).toBeDefined();
      expect(bookHierarchyPath.createdAt).toBeDefined();
    });
  });

  describe('ContentSearchIndex Table Columns', () => {
    it('should have all required contentSearchIndex columns', () => {
      expect(contentSearchIndex.id).toBeDefined();
      expect(contentSearchIndex.bookId).toBeDefined();
      expect(contentSearchIndex.entityType).toBeDefined();
      expect(contentSearchIndex.entityId).toBeDefined();
      expect(contentSearchIndex.searchableText).toBeDefined();
      expect(contentSearchIndex.title).toBeDefined();
      expect(contentSearchIndex.path).toBeDefined();
      expect(contentSearchIndex.metadata).toBeDefined();
      expect(contentSearchIndex.tsvector).toBeDefined();
      expect(contentSearchIndex.updatedAt).toBeDefined();
    });
  });

  describe('Schema Completeness', () => {
    it('should have all hierarchy tables defined', () => {
      const hierarchyTables = [
        story,
        part,
        chapterEnhanced,
        scene,
        bookHierarchyPath,
        contentSearchIndex
      ];

      hierarchyTables.forEach((table, index) => {
        expect(table).toBeDefined();
        expect(typeof table).toBe('object');
      });
    });

    it('should have proper hierarchy relationship chain', () => {
      // Verify that the hierarchy chain exists: Book -> Story -> Part -> Chapter -> Scene
      // We can't test foreign key relationships directly here, but we can verify
      // that the expected reference columns exist
      
      // Story references Book
      expect(story.bookId).toBeDefined();
      
      // Part references Story
      expect(part.storyId).toBeDefined();
      
      // Chapter references Part and Book
      expect(chapterEnhanced.partId).toBeDefined();
      expect(chapterEnhanced.bookId).toBeDefined();
      
      // Scene references Chapter
      expect(scene.chapterId).toBeDefined();
      
      // Navigation helper references all levels
      expect(bookHierarchyPath.bookId).toBeDefined();
      expect(bookHierarchyPath.storyId).toBeDefined();
      expect(bookHierarchyPath.partId).toBeDefined();
      expect(bookHierarchyPath.chapterId).toBeDefined();
      expect(bookHierarchyPath.sceneId).toBeDefined();
      
      // Search index references Book
      expect(contentSearchIndex.bookId).toBeDefined();
    });
  });
});