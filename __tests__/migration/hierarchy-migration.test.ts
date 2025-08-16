/**
 * RED PHASE - TDD Implementation for Hierarchy Migration
 * These tests define the expected behavior for the migration system
 * All tests should FAIL initially as the implementation doesn't exist yet
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { HierarchyMigration } from '../../lib/migration/hierarchy-migration';
import { MigrationValidator } from '../../lib/migration/migration-validator';
import { BatchProcessor } from '../../lib/migration/batch-processor';
import { MigrationProgress } from '../../lib/migration/migration-progress';
import { db } from '../../lib/db';
import { book, chapter, chapterEnhanced, story, part, scene } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

// Test data interfaces
interface TestBook {
  id: string;
  title: string;
  authorId: string;
  status: 'draft' | 'ongoing' | 'completed' | 'hiatus';
}

interface TestChapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: any;
  wordCount: number;
}

interface MigrationOptions {
  batchSize?: number;
  dryRun?: boolean;
  validateBeforeMigration?: boolean;
  rollbackOnError?: boolean;
}

interface MigrationResult {
  success: boolean;
  migratedBooks: number;
  migratedChapters: number;
  createdStories: number;
  createdParts: number;
  createdScenes: number;
  errors: string[];
  processedInBatches: number;
  totalProcessingTime: number;
}

interface ValidationResult {
  isValid: boolean;
  dataIntegrityChecks: {
    missingReferences: number;
    duplicateEntries: number;
    wordCountMismatches: number;
  };
  migrationIntegrityChecks: {
    unmappedChapters: number;
    orphanedScenes: number;
    incorrectHierarchy: number;
  };
  warnings: string[];
  errors: string[];
}

interface RollbackResult {
  success: boolean;
  rollbackSteps: string[];
  dataRestored: boolean;
  errors: string[];
}

describe('HierarchyMigration', () => {
  let migration: HierarchyMigration;
  let validator: MigrationValidator;
  let batchProcessor: BatchProcessor;
  let progressTracker: MigrationProgress;

  // Test data
  let testBooks: TestBook[];
  let testChapters: TestChapter[];

  beforeEach(async () => {
    // Create test instances (these will fail initially as classes don't exist)
    migration = new HierarchyMigration(db);
    validator = new MigrationValidator(db);
    batchProcessor = new BatchProcessor(db);
    progressTracker = new MigrationProgress();

    // Setup test data
    testBooks = [
      {
        id: 'book-1',
        title: 'Test Book 1',
        authorId: 'author-1',
        status: 'draft'
      },
      {
        id: 'book-2', 
        title: 'Test Book 2',
        authorId: 'author-1',
        status: 'ongoing'
      }
    ];

    testChapters = [
      {
        id: 'chapter-1',
        bookId: 'book-1',
        chapterNumber: 1,
        title: 'Chapter 1: Beginning',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content for chapter 1' }] }] },
        wordCount: 150
      },
      {
        id: 'chapter-2',
        bookId: 'book-1', 
        chapterNumber: 2,
        title: 'Chapter 2: Middle',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content for chapter 2' }] }] },
        wordCount: 200
      },
      {
        id: 'chapter-3',
        bookId: 'book-2',
        chapterNumber: 1,
        title: 'Chapter 1: Start',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content for book 2 chapter 1' }] }] },
        wordCount: 175
      }
    ];
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(scene);
    await db.delete(chapterEnhanced);
    await db.delete(part);
    await db.delete(story);
    await db.delete(chapter);
    await db.delete(book);
  });

  describe('Migration Infrastructure', () => {
    it('should create HierarchyMigration instance with required methods', () => {
      expect(migration).toBeDefined();
      expect(typeof migration.migrateToHierarchy).toBe('function');
      expect(typeof migration.validateMigration).toBe('function');
      expect(typeof migration.rollbackMigration).toBe('function');
      expect(typeof migration.getMigrationProgress).toBe('function');
    });

    it('should create MigrationValidator with validation methods', () => {
      expect(validator).toBeDefined();
      expect(typeof validator.validateBeforeMigration).toBe('function');
      expect(typeof validator.validateAfterMigration).toBe('function');
      expect(typeof validator.checkDataIntegrity).toBe('function');
    });

    it('should create BatchProcessor with batch processing capabilities', () => {
      expect(batchProcessor).toBeDefined();
      expect(typeof batchProcessor.processBooksInBatches).toBe('function');
      expect(typeof batchProcessor.processChaptersInBatches).toBe('function');
      expect(typeof batchProcessor.getBatchProgress).toBe('function');
    });

    it('should create MigrationProgress tracker', () => {
      expect(progressTracker).toBeDefined();
      expect(typeof progressTracker.startTracking).toBe('function');
      expect(typeof progressTracker.updateProgress).toBe('function');
      expect(typeof progressTracker.getProgress).toBe('function');
      expect(typeof progressTracker.complete).toBe('function');
    });
  });

  describe('Pre-Migration Validation', () => {
    it('should validate existing data before migration', async () => {
      // Insert test data
      await insertTestData();

      const validationResult = await validator.validateBeforeMigration();

      expect(validationResult).toBeDefined();
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.warnings).toBeDefined();
    });

    it('should detect data integrity issues before migration', async () => {
      // Insert corrupted test data (missing foreign keys, etc.)
      await insertCorruptedTestData();

      const validationResult = await validator.validateBeforeMigration();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.dataIntegrityChecks.missingReferences).toBeGreaterThan(0);
    });

    it('should check for existing hierarchy data conflicts', async () => {
      // Insert data that would conflict with new hierarchy
      await insertConflictingHierarchyData();

      const validationResult = await validator.validateBeforeMigration();

      expect(validationResult.warnings).toContain('Existing hierarchy data detected');
    });
  });

  describe('Migration Process', () => {
    it('should migrate books and chapters to new hierarchy structure', async () => {
      await insertTestData();

      const options: MigrationOptions = {
        batchSize: 10,
        dryRun: false,
        validateBeforeMigration: true,
        rollbackOnError: true
      };

      const result = await migration.migrateToHierarchy(options);

      expect(result.success).toBe(true);
      expect(result.migratedBooks).toBe(2);
      expect(result.migratedChapters).toBe(3);
      expect(result.createdStories).toBe(2); // One default story per book
      expect(result.createdParts).toBe(2); // One default part per story
      expect(result.createdScenes).toBe(3); // One scene per chapter content
      expect(result.errors).toHaveLength(0);
    });

    it('should create default story and part for each book', async () => {
      await insertTestData();

      await migration.migrateToHierarchy({ batchSize: 10 });

      // Check that default story was created
      const stories = await db.select().from(story).where(eq(story.bookId, 'book-1'));
      expect(stories).toHaveLength(1);
      expect(stories[0].title).toBe('Main Story');
      expect(stories[0].order).toBe(0);

      // Check that default part was created
      const parts = await db.select().from(part).where(eq(part.storyId, stories[0].id));
      expect(parts).toHaveLength(1);
      expect(parts[0].title).toBe('Part One');
      expect(parts[0].partNumber).toBe(1);
    });

    it('should migrate chapter content to ChapterEnhanced and create scenes', async () => {
      await insertTestData();

      await migration.migrateToHierarchy({ batchSize: 10 });

      // Check ChapterEnhanced creation
      const enhancedChapters = await db.select().from(chapterEnhanced);
      expect(enhancedChapters).toHaveLength(3);

      // Verify chapter data migration
      const chapter1 = enhancedChapters.find(c => c.title === 'Chapter 1: Beginning');
      expect(chapter1).toBeDefined();
      expect(chapter1!.wordCount).toBe(150);
      expect(chapter1!.globalChapterNumber).toBe(1);

      // Check scene creation
      const scenes = await db.select().from(scene);
      expect(scenes).toHaveLength(3); // One scene per chapter
      
      const scene1 = scenes.find(s => s.chapterId === chapter1!.id);
      expect(scene1).toBeDefined();
      expect(scene1!.content).toContain('Test content for chapter 1');
      expect(scene1!.wordCount).toBe(150);
    });

    it('should update word counts throughout hierarchy', async () => {
      await insertTestData();

      await migration.migrateToHierarchy({ batchSize: 10 });

      // Check story word counts
      const stories = await db.select().from(story);
      const book1Story = stories.find(s => s.bookId === 'book-1');
      expect(book1Story!.wordCount).toBe(350); // 150 + 200

      // Check part word counts
      const parts = await db.select().from(part);
      const book1Part = parts.find(p => p.storyId === book1Story!.id);
      expect(book1Part!.wordCount).toBe(350);

      // Check chapter word counts
      const chapters = await db.select().from(chapterEnhanced);
      expect(chapters.every(c => c.wordCount > 0)).toBe(true);
    });

    it('should process migration in batches for large datasets', async () => {
      await insertLargeTestDataset(100); // 100 books with 10 chapters each

      const options: MigrationOptions = {
        batchSize: 5,
        validateBeforeMigration: false
      };

      const result = await migration.migrateToHierarchy(options);

      expect(result.success).toBe(true);
      expect(result.processedInBatches).toBeGreaterThan(1);
      expect(result.migratedBooks).toBe(100);
      expect(result.migratedChapters).toBe(1000);
    });

    it('should track progress during migration', async () => {
      await insertTestData();

      migration.onProgressUpdate((progress) => {
        expect(progress.stage).toBeDefined();
        expect(progress.completedItems).toBeGreaterThanOrEqual(0);
        expect(progress.totalItems).toBeGreaterThan(0);
        expect(progress.percentage).toBeGreaterThanOrEqual(0);
        expect(progress.percentage).toBeLessThanOrEqual(100);
      });

      await migration.migrateToHierarchy({ batchSize: 1 });
    });

    it('should handle migration errors gracefully', async () => {
      await insertInvalidTestData();

      const result = await migration.migrateToHierarchy({ 
        rollbackOnError: true,
        validateBeforeMigration: false 
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Should rollback on error
      const enhancedChapters = await db.select().from(chapterEnhanced);
      expect(enhancedChapters).toHaveLength(0);
    });
  });

  describe('Post-Migration Validation', () => {
    it('should validate data integrity after migration', async () => {
      await insertTestData();
      await migration.migrateToHierarchy({ batchSize: 10 });

      const validationResult = await validator.validateAfterMigration();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.migrationIntegrityChecks.unmappedChapters).toBe(0);
      expect(validationResult.migrationIntegrityChecks.orphanedScenes).toBe(0);
      expect(validationResult.migrationIntegrityChecks.incorrectHierarchy).toBe(0);
    });

    it('should detect hierarchy inconsistencies', async () => {
      await insertTestData();
      await migration.migrateToHierarchy({ batchSize: 10 });
      
      // Manually corrupt the hierarchy for testing
      await corruptHierarchyData();

      const validationResult = await validator.validateAfterMigration();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.migrationIntegrityChecks.incorrectHierarchy).toBeGreaterThan(0);
    });

    it('should verify word count accuracy across all levels', async () => {
      await insertTestData();
      await migration.migrateToHierarchy({ batchSize: 10 });

      const validationResult = await validator.checkDataIntegrity();

      expect(validationResult.dataIntegrityChecks.wordCountMismatches).toBe(0);
    });
  });

  describe('Migration Rollback', () => {
    it('should rollback migration when requested', async () => {
      await insertTestData();
      await migration.migrateToHierarchy({ batchSize: 10 });

      // Verify migration happened
      const enhancedChapters = await db.select().from(chapterEnhanced);
      expect(enhancedChapters.length).toBeGreaterThan(0);

      // Rollback migration
      const rollbackResult = await migration.rollbackMigration();

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.dataRestored).toBe(true);
      expect(rollbackResult.errors).toHaveLength(0);

      // Verify rollback
      const enhancedChaptersAfter = await db.select().from(chapterEnhanced);
      expect(enhancedChaptersAfter).toHaveLength(0);

      const originalChapters = await db.select().from(chapter);
      expect(originalChapters).toHaveLength(3);
    });

    it('should create rollback snapshots before migration', async () => {
      await insertTestData();

      const hasSnapshot = await migration.hasRollbackSnapshot();
      expect(hasSnapshot).toBe(false);

      await migration.migrateToHierarchy({ batchSize: 10 });

      const hasSnapshotAfter = await migration.hasRollbackSnapshot();
      expect(hasSnapshotAfter).toBe(true);
    });

    it('should handle partial rollback scenarios', async () => {
      await insertTestData();
      await migration.migrateToHierarchy({ batchSize: 10 });

      // Simulate partial corruption
      await corruptPartialHierarchyData();

      const rollbackResult = await migration.rollbackMigration();

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rollbackSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scale', () => {
    it('should handle large book collections efficiently', async () => {
      await insertLargeTestDataset(50); // 50 books with 20 chapters each

      const startTime = Date.now();
      const result = await migration.migrateToHierarchy({ 
        batchSize: 10,
        validateBeforeMigration: false 
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.totalProcessingTime).toBeLessThan(60000); // Should complete within 1 minute
      expect(endTime - startTime).toBeLessThan(60000);
    });

    it('should optimize memory usage during large migrations', async () => {
      await insertLargeTestDataset(100);

      const memoryBefore = process.memoryUsage();
      
      await migration.migrateToHierarchy({ 
        batchSize: 5,
        validateBeforeMigration: false 
      });

      const memoryAfter = process.memoryUsage();
      
      // Memory increase should be reasonable (less than 200MB)
      const memoryIncrease = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(200);
    });
  });

  // Helper functions for test data setup
  async function insertTestData() {
    for (const bookData of testBooks) {
      await db.insert(book).values({
        id: bookData.id,
        title: bookData.title,
        authorId: bookData.authorId,
        status: bookData.status,
        description: 'Test book description',
        wordCount: 0,
        chapterCount: 0
      });
    }

    for (const chapterData of testChapters) {
      await db.insert(chapter).values({
        id: chapterData.id,
        bookId: chapterData.bookId,
        chapterNumber: chapterData.chapterNumber,
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.wordCount
      });
    }
  }

  async function insertCorruptedTestData() {
    // Insert books without required fields
    await db.insert(book).values({
      id: 'corrupt-book',
      title: '',  // Invalid empty title
      authorId: 'nonexistent-author', // Invalid author ID
      status: 'draft'
    });

    // Insert chapters with invalid foreign keys
    await db.insert(chapter).values({
      id: 'corrupt-chapter',
      bookId: 'nonexistent-book', // Invalid book ID
      chapterNumber: -1, // Invalid chapter number
      title: 'Corrupt Chapter',
      content: {},
      wordCount: -50 // Invalid word count
    });
  }

  async function insertConflictingHierarchyData() {
    await insertTestData();
    
    // Insert hierarchy data that already exists
    await db.insert(story).values({
      bookId: 'book-1',
      title: 'Existing Story',
      order: 0
    });
  }

  async function insertLargeTestDataset(bookCount: number) {
    const chapterPerBook = 10;
    
    for (let i = 1; i <= bookCount; i++) {
      const bookId = `large-book-${i}`;
      await db.insert(book).values({
        id: bookId,
        title: `Large Test Book ${i}`,
        authorId: 'test-author',
        status: 'draft'
      });

      for (let j = 1; j <= chapterPerBook; j++) {
        await db.insert(chapter).values({
          id: `large-chapter-${i}-${j}`,
          bookId: bookId,
          chapterNumber: j,
          title: `Chapter ${j}`,
          content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `Content for book ${i} chapter ${j}` }] }] },
          wordCount: 100 + j * 10
        });
      }
    }
  }

  async function insertInvalidTestData() {
    // Data that will cause migration errors
    await db.insert(book).values({
      id: 'invalid-book',
      title: 'Invalid Book',
      authorId: 'test-author',
      status: 'draft'
    });

    await db.insert(chapter).values({
      id: 'invalid-chapter',
      bookId: 'invalid-book',
      chapterNumber: 1,
      title: 'Invalid Chapter',
      content: null as any, // Invalid JSON content
      wordCount: 100
    });
  }

  async function corruptHierarchyData() {
    // Manually corrupt some hierarchy relationships for testing
    const scenes = await db.select().from(scene);
    if (scenes.length > 0) {
      await db.update(scene)
        .set({ chapterId: 'nonexistent-chapter-id' })
        .where(eq(scene.id, scenes[0].id));
    }
  }

  async function corruptPartialHierarchyData() {
    // Corrupt some but not all hierarchy data
    const stories = await db.select().from(story);
    if (stories.length > 0) {
      await db.delete(part).where(eq(part.storyId, stories[0].id));
    }
  }
});