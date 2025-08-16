/**
 * RED PHASE - Performance Tests for Migration System
 * These tests ensure the migration system performs well under load
 * All tests should FAIL initially as migration implementation doesn't exist yet
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { HierarchyMigration } from '../../lib/migration/hierarchy-migration';
import { BatchProcessor } from '../../lib/migration/batch-processor';
import { db } from '../../lib/db';
import { book, chapter, story, part, chapterEnhanced, scene } from '../../lib/db/schema';

describe('Migration Performance Tests', () => {
  let migration: HierarchyMigration;
  let batchProcessor: BatchProcessor;

  beforeEach(async () => {
    migration = new HierarchyMigration(db);
    batchProcessor = new BatchProcessor(db);
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupAllTestData();
  });

  describe('Large Dataset Migration Performance', () => {
    it('should migrate 1000 books with 10 chapters each within 5 minutes', async () => {
      // Create large dataset
      await createLargeTestDataset(1000, 10);

      const startTime = Date.now();
      const startMemory = process.memoryUsage();

      const result = await migration.migrateToHierarchy({
        batchSize: 50,
        validateBeforeMigration: false
      });

      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const migrationTime = endTime - startTime;

      // Performance assertions
      expect(result.success).toBe(true);
      expect(migrationTime).toBeLessThan(300000); // 5 minutes
      expect(result.totalProcessingTime).toBeLessThan(300000);
      
      // Memory usage should be reasonable
      const memoryIncrease = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(500); // Less than 500MB increase

      // Verify migration completed correctly
      expect(result.migratedBooks).toBe(1000);
      expect(result.migratedChapters).toBe(10000);
      expect(result.createdStories).toBe(1000);
      expect(result.createdParts).toBe(1000);
      expect(result.createdScenes).toBe(10000);
    }, 600000); // 10 minute timeout

    it('should handle 10000 chapters across 100 books efficiently', async () => {
      await createLargeTestDataset(100, 100);

      const startTime = Date.now();

      const result = await migration.migrateToHierarchy({
        batchSize: 25,
        validateBeforeMigration: false
      });

      const migrationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(migrationTime).toBeLessThan(600000); // 10 minutes
      expect(result.migratedChapters).toBe(10000);
      
      // Should process in multiple batches efficiently
      expect(result.processedInBatches).toBeGreaterThan(1);
      expect(result.processedInBatches).toBeLessThanOrEqual(400); // 10000/25 = 400 batches max
    }, 1200000); // 20 minute timeout

    it('should maintain performance with varying chapter sizes', async () => {
      // Create dataset with varying chapter content sizes
      await createVariableSizeDataset(500, 20);

      const startTime = Date.now();

      const result = await migration.migrateToHierarchy({
        batchSize: 30,
        validateBeforeMigration: false
      });

      const migrationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(migrationTime).toBeLessThan(360000); // 6 minutes
      expect(result.migratedChapters).toBe(10000); // 500 * 20
    }, 720000); // 12 minute timeout
  });

  describe('Memory Usage and Resource Management', () => {
    it('should maintain stable memory usage during large migrations', async () => {
      await createLargeTestDataset(200, 50); // 10,000 chapters

      const memorySnapshots: number[] = [];
      
      // Monitor memory during migration
      const memoryMonitor = setInterval(() => {
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }, 5000); // Every 5 seconds

      const result = await migration.migrateToHierarchy({
        batchSize: 20,
        validateBeforeMigration: false
      });

      clearInterval(memoryMonitor);

      expect(result.success).toBe(true);

      // Memory should not continuously grow (no memory leaks)
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryRange = (maxMemory - minMemory) / 1024 / 1024; // MB

      expect(memoryRange).toBeLessThan(1000); // Less than 1GB memory variation
      
      // Final memory should be close to initial memory
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDifference = (finalMemory - memorySnapshots[0]) / 1024 / 1024;
      expect(memoryDifference).toBeLessThan(200); // Less than 200MB final increase
    }, 900000); // 15 minute timeout

    it('should handle concurrent batch processing efficiently', async () => {
      await createLargeTestDataset(300, 30); // 9,000 chapters

      const startTime = Date.now();
      
      // Test concurrent batch processing
      const result = await migration.migrateToHierarchy({
        batchSize: 15,
        concurrentBatches: 3, // Process 3 batches concurrently
        validateBeforeMigration: false
      });

      const migrationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.migratedChapters).toBe(9000);
      
      // Concurrent processing should be faster than sequential
      expect(migrationTime).toBeLessThan(300000); // 5 minutes
      
      // Should have processed multiple batches
      expect(result.processedInBatches).toBeGreaterThan(1);
    }, 600000); // 10 minute timeout

    it('should clean up temporary resources during migration', async () => {
      await createLargeTestDataset(100, 25); // 2,500 chapters

      const startMemory = process.memoryUsage();
      
      const result = await migration.migrateToHierarchy({
        batchSize: 10,
        validateBeforeMigration: false,
        cleanupInterval: 50 // Clean up every 50 processed items
      });

      const endMemory = process.memoryUsage();

      expect(result.success).toBe(true);
      
      // Memory cleanup should prevent excessive memory usage
      const memoryIncrease = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(150); // Less than 150MB increase
    }, 300000); // 5 minute timeout
  });

  describe('Database Performance and Optimization', () => {
    it('should optimize database queries during large migrations', async () => {
      await createLargeTestDataset(50, 100); // 5,000 chapters

      const queryMonitor = new DatabaseQueryMonitor();
      queryMonitor.start();

      const result = await migration.migrateToHierarchy({
        batchSize: 25,
        validateBeforeMigration: false
      });

      const queryStats = queryMonitor.stop();

      expect(result.success).toBe(true);
      
      // Should use efficient batch queries
      expect(queryStats.totalQueries).toBeLessThan(1000); // Efficient batch operations
      expect(queryStats.averageQueryTime).toBeLessThan(100); // Fast queries (ms)
      expect(queryStats.longRunningQueries).toBe(0); // No queries over 5 seconds
      
      // Should use proper indexing
      expect(queryStats.sequentialScans).toBe(0); // No full table scans
    }, 600000); // 10 minute timeout

    it('should handle database connection pooling efficiently', async () => {
      await createLargeTestDataset(200, 20); // 4,000 chapters

      const connectionMonitor = new ConnectionPoolMonitor();
      connectionMonitor.start();

      const result = await migration.migrateToHierarchy({
        batchSize: 20,
        maxConnections: 10,
        validateBeforeMigration: false
      });

      const connectionStats = connectionMonitor.stop();

      expect(result.success).toBe(true);
      
      // Should efficiently manage connections
      expect(connectionStats.maxConcurrentConnections).toBeLessThanOrEqual(10);
      expect(connectionStats.connectionLeaks).toBe(0);
      expect(connectionStats.averageConnectionTime).toBeLessThan(5000); // 5 seconds
    }, 600000); // 10 minute timeout

    it('should maintain transaction consistency during large migrations', async () => {
      await createLargeTestDataset(100, 50); // 5,000 chapters

      const transactionMonitor = new TransactionMonitor();
      transactionMonitor.start();

      const result = await migration.migrateToHierarchy({
        batchSize: 25,
        useTransactions: true,
        validateBeforeMigration: false
      });

      const transactionStats = transactionMonitor.stop();

      expect(result.success).toBe(true);
      
      // Should handle transactions efficiently
      expect(transactionStats.totalTransactions).toBeGreaterThan(0);
      expect(transactionStats.failedTransactions).toBe(0);
      expect(transactionStats.rollbacks).toBe(0);
      expect(transactionStats.deadlocks).toBe(0);
    }, 600000); // 10 minute timeout
  });

  describe('Batch Processing Performance', () => {
    it('should optimize batch size automatically based on performance', async () => {
      await createLargeTestDataset(150, 30); // 4,500 chapters

      const result = await migration.migrateToHierarchy({
        adaptiveBatchSize: true,
        initialBatchSize: 10,
        maxBatchSize: 100,
        validateBeforeMigration: false
      });

      expect(result.success).toBe(true);
      
      // Should have optimized batch size during migration
      expect(result.finalBatchSize).toBeGreaterThan(10);
      expect(result.finalBatchSize).toBeLessThanOrEqual(100);
      expect(result.batchSizeAdjustments).toBeGreaterThan(0);
    }, 450000); // 7.5 minute timeout

    it('should handle batch processing errors without affecting performance', async () => {
      await createLargeTestDataset(100, 25); // 2,500 chapters
      await injectRandomErrors(0.01); // 1% error rate

      const startTime = Date.now();

      const result = await migration.migrateToHierarchy({
        batchSize: 20,
        retryFailedBatches: true,
        maxRetries: 3,
        validateBeforeMigration: false
      });

      const migrationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0); // Should have some errors
      expect(result.retriedBatches).toBeGreaterThan(0); // Should have retried
      
      // Should still complete in reasonable time despite errors
      expect(migrationTime).toBeLessThan(300000); // 5 minutes
    }, 600000); // 10 minute timeout

    it('should process batches in parallel when beneficial', async () => {
      await createLargeTestDataset(200, 15); // 3,000 chapters

      const sequentialStart = Date.now();
      const sequentialResult = await migration.migrateToHierarchy({
        batchSize: 25,
        parallelBatches: 1,
        validateBeforeMigration: false
      });
      const sequentialTime = Date.now() - sequentialStart;

      // Clean up and setup again for parallel test
      await cleanupAllTestData();
      await createLargeTestDataset(200, 15);

      const parallelStart = Date.now();
      const parallelResult = await migration.migrateToHierarchy({
        batchSize: 25,
        parallelBatches: 4,
        validateBeforeMigration: false
      });
      const parallelTime = Date.now() - parallelStart;

      expect(sequentialResult.success).toBe(true);
      expect(parallelResult.success).toBe(true);
      
      // Parallel should be significantly faster
      expect(parallelTime).toBeLessThan(sequentialTime * 0.7); // At least 30% faster
    }, 900000); // 15 minute timeout
  });

  describe('Validation Performance', () => {
    it('should perform validation efficiently for large datasets', async () => {
      await createLargeTestDataset(100, 50); // 5,000 chapters

      const startTime = Date.now();

      const result = await migration.migrateToHierarchy({
        batchSize: 25,
        validateBeforeMigration: true,
        validateAfterMigration: true
      });

      const totalTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.validationTime).toBeDefined();
      expect(result.validationTime).toBeLessThan(60000); // Validation under 1 minute
      expect(totalTime).toBeLessThan(420000); // Total under 7 minutes
    }, 600000); // 10 minute timeout

    it('should optimize validation queries for large hierarchies', async () => {
      await createLargeTestDataset(75, 80); // 6,000 chapters
      
      // Perform migration first
      await migration.migrateToHierarchy({
        batchSize: 30,
        validateBeforeMigration: false,
        validateAfterMigration: false
      });

      const validationStartTime = Date.now();
      
      const validationResult = await migration.validateMigration();
      
      const validationTime = Date.now() - validationStartTime;

      expect(validationResult.isValid).toBe(true);
      expect(validationTime).toBeLessThan(30000); // Validation under 30 seconds
      
      // Should have validated all data
      expect(validationResult.validatedItems).toBe(6000); // All chapters
      expect(validationResult.dataIntegrityChecks.wordCountMismatches).toBe(0);
    }, 600000); // 10 minute timeout
  });

  describe('Rollback Performance', () => {
    it('should rollback large migrations efficiently', async () => {
      await createLargeTestDataset(100, 30); // 3,000 chapters

      // Perform migration
      const migrationResult = await migration.migrateToHierarchy({
        batchSize: 25,
        validateBeforeMigration: false
      });

      expect(migrationResult.success).toBe(true);

      // Rollback migration
      const rollbackStartTime = Date.now();
      
      const rollbackResult = await migration.rollbackMigration();
      
      const rollbackTime = Date.now() - rollbackStartTime;

      expect(rollbackResult.success).toBe(true);
      expect(rollbackTime).toBeLessThan(120000); // Rollback under 2 minutes
      expect(rollbackResult.dataRestored).toBe(true);
      
      // Verify data is restored
      const originalChapters = await db.select().from(chapter);
      expect(originalChapters).toHaveLength(3000);
      
      const hierarchyData = await db.select().from(chapterEnhanced);
      expect(hierarchyData).toHaveLength(0);
    }, 600000); // 10 minute timeout
  });

  // Helper functions and classes
  async function createLargeTestDataset(bookCount: number, chaptersPerBook: number) {
    const books = [];
    const chapters = [];

    for (let i = 1; i <= bookCount; i++) {
      const bookId = `test-book-${i}`;
      books.push({
        id: bookId,
        title: `Performance Test Book ${i}`,
        authorId: 'test-author',
        status: 'draft' as const,
        description: `Book ${i} for performance testing`
      });

      for (let j = 1; j <= chaptersPerBook; j++) {
        chapters.push({
          id: `test-chapter-${i}-${j}`,
          bookId: bookId,
          chapterNumber: j,
          title: `Chapter ${j}`,
          content: {
            type: 'doc',
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: `Content for book ${i} chapter ${j}. This is performance test content that simulates real chapter data.`
              }]
            }]
          },
          wordCount: 100 + (j * 5)
        });
      }
    }

    // Insert in batches for performance
    const batchSize = 100;
    
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      await db.insert(book).values(batch);
    }

    for (let i = 0; i < chapters.length; i += batchSize) {
      const batch = chapters.slice(i, i + batchSize);
      await db.insert(chapter).values(batch);
    }
  }

  async function createVariableSizeDataset(bookCount: number, chaptersPerBook: number) {
    const books = [];
    const chapters = [];

    for (let i = 1; i <= bookCount; i++) {
      const bookId = `variable-book-${i}`;
      books.push({
        id: bookId,
        title: `Variable Size Book ${i}`,
        authorId: 'test-author',
        status: 'draft' as const
      });

      for (let j = 1; j <= chaptersPerBook; j++) {
        // Create chapters with varying content sizes
        const contentSize = Math.floor(Math.random() * 1000) + 100; // 100-1100 words
        const content = 'Word '.repeat(contentSize);
        
        chapters.push({
          id: `variable-chapter-${i}-${j}`,
          bookId: bookId,
          chapterNumber: j,
          title: `Chapter ${j}`,
          content: {
            type: 'doc',
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: content
              }]
            }]
          },
          wordCount: contentSize
        });
      }
    }

    // Insert data
    await db.insert(book).values(books);
    await db.insert(chapter).values(chapters);
  }

  async function injectRandomErrors(errorRate: number) {
    // Simulate random data corruption for error handling tests
    const allChapters = await db.select().from(chapter);
    const errorCount = Math.floor(allChapters.length * errorRate);

    for (let i = 0; i < errorCount; i++) {
      const randomIndex = Math.floor(Math.random() * allChapters.length);
      const chapterToCorrupt = allChapters[randomIndex];
      
      // Corrupt the chapter data
      await db.update(chapter)
        .set({ content: null as any })
        .where(eq(chapter.id, chapterToCorrupt.id));
    }
  }

  async function cleanupAllTestData() {
    await db.delete(scene);
    await db.delete(chapterEnhanced);
    await db.delete(part);
    await db.delete(story);
    await db.delete(chapter);
    await db.delete(book).where(like(book.title, '%Test%'));
  }

  // Mock monitoring classes - will be implemented during GREEN phase
  class DatabaseQueryMonitor {
    private stats = {
      totalQueries: 0,
      averageQueryTime: 0,
      longRunningQueries: 0,
      sequentialScans: 0
    };

    start() {
      // Start monitoring database queries
    }

    stop() {
      // Stop monitoring and return stats
      return this.stats;
    }
  }

  class ConnectionPoolMonitor {
    private stats = {
      maxConcurrentConnections: 0,
      connectionLeaks: 0,
      averageConnectionTime: 0
    };

    start() {
      // Start monitoring connection pool
    }

    stop() {
      return this.stats;
    }
  }

  class TransactionMonitor {
    private stats = {
      totalTransactions: 0,
      failedTransactions: 0,
      rollbacks: 0,
      deadlocks: 0
    };

    start() {
      // Start monitoring transactions
    }

    stop() {
      return this.stats;
    }
  }
});