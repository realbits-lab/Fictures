/**
 * RED PHASE - Integration Tests for Migration-related API Routes
 * These tests ensure all hierarchy API routes work correctly after migration
 * All tests should FAIL initially as migration implementation doesn't exist yet
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { testApiHandler } from 'next-test-api-route-handler';
import { HierarchyMigration } from '../../lib/migration/hierarchy-migration';
import { db } from '../../lib/db';
import { book, chapter, story, part, chapterEnhanced, scene } from '../../lib/db/schema';

// Import API route handlers
import * as hierarchyRouteHandler from '../../app/api/books/[bookId]/hierarchy/route';
import * as storiesRouteHandler from '../../app/api/books/[bookId]/stories/route';
import * as partsRouteHandler from '../../app/api/books/[bookId]/stories/[storyId]/parts/route';
import * as chaptersRouteHandler from '../../app/api/books/[bookId]/parts/[partId]/chapters/route';
import * as scenesRouteHandler from '../../app/api/books/[bookId]/scenes/[sceneId]/route';
import * as searchRouteHandler from '../../app/api/books/[bookId]/search/route';
import * as breadcrumbRouteHandler from '../../app/api/books/[bookId]/breadcrumb/route';
import * as aiContextRouteHandler from '../../app/api/books/[bookId]/ai-context/route';

describe('Migration API Routes Integration', () => {
  let testBookId: string;
  let testStoryId: string;
  let testPartId: string;
  let testChapterId: string;
  let testSceneId: string;
  let migration: HierarchyMigration;

  beforeEach(async () => {
    migration = new HierarchyMigration(db);
    
    // Create test data and migrate it
    await setupTestDataAndMigrate();
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

  describe('Book Hierarchy API Routes', () => {
    describe('GET /api/books/[bookId]/hierarchy', () => {
      it('should return complete book hierarchy after migration', async () => {
        await testApiHandler({
          handler: hierarchyRouteHandler,
          url: `/api/books/${testBookId}/hierarchy`,
          test: async ({ fetch }) => {
            const response = await fetch({
              method: 'GET',
            });

            expect(response.status).toBe(200);
            
            const hierarchy = await response.json();
            expect(hierarchy).toBeDefined();
            expect(hierarchy.book).toBeDefined();
            expect(hierarchy.book.id).toBe(testBookId);
            expect(hierarchy.stories).toHaveLength(1);
            
            const story = hierarchy.stories[0];
            expect(story.id).toBe(testStoryId);
            expect(story.parts).toHaveLength(1);
            
            const part = story.parts[0];
            expect(part.id).toBe(testPartId);
            expect(part.chapters).toHaveLength(1);
            
            const chapter = part.chapters[0];
            expect(chapter.id).toBe(testChapterId);
            expect(chapter.scenes).toHaveLength(1);
            
            const scene = chapter.scenes[0];
            expect(scene.id).toBe(testSceneId);
          },
        });
      });

      it('should return hierarchy with correct word counts', async () => {
        await testApiHandler({
          handler: hierarchyRouteHandler,
          url: `/api/books/${testBookId}/hierarchy`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const hierarchy = await response.json();

            expect(hierarchy.book.wordCount).toBeGreaterThan(0);
            expect(hierarchy.stories[0].wordCount).toBeGreaterThan(0);
            expect(hierarchy.stories[0].parts[0].wordCount).toBeGreaterThan(0);
            expect(hierarchy.stories[0].parts[0].chapters[0].wordCount).toBeGreaterThan(0);
            
            // Word counts should be consistent across hierarchy
            const sceneWordCount = hierarchy.stories[0].parts[0].chapters[0].scenes[0].wordCount;
            const chapterWordCount = hierarchy.stories[0].parts[0].chapters[0].wordCount;
            expect(chapterWordCount).toBe(sceneWordCount);
          },
        });
      });

      it('should handle non-existent book gracefully', async () => {
        await testApiHandler({
          handler: hierarchyRouteHandler,
          url: '/api/books/nonexistent-book-id/hierarchy',
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            expect(response.status).toBe(404);
            
            const error = await response.json();
            expect(error.error).toBe('Book not found');
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/stories', () => {
      it('should return all stories for a book after migration', async () => {
        await testApiHandler({
          handler: storiesRouteHandler,
          url: `/api/books/${testBookId}/stories`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const stories = await response.json();
            expect(Array.isArray(stories)).toBe(true);
            expect(stories).toHaveLength(1);
            
            const story = stories[0];
            expect(story.id).toBe(testStoryId);
            expect(story.bookId).toBe(testBookId);
            expect(story.title).toBe('Main Story');
            expect(story.partCount).toBe(1);
            expect(story.wordCount).toBeGreaterThan(0);
          },
        });
      });

      it('should return stories in correct order', async () => {
        // Create additional story for ordering test
        const additionalStoryId = await createAdditionalStory();

        await testApiHandler({
          handler: storiesRouteHandler,
          url: `/api/books/${testBookId}/stories`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const stories = await response.json();

            expect(stories).toHaveLength(2);
            expect(stories[0].order).toBeLessThan(stories[1].order);
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/stories/[storyId]/parts', () => {
      it('should return all parts for a story after migration', async () => {
        await testApiHandler({
          handler: partsRouteHandler,
          url: `/api/books/${testBookId}/stories/${testStoryId}/parts`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const parts = await response.json();
            expect(Array.isArray(parts)).toBe(true);
            expect(parts).toHaveLength(1);
            
            const part = parts[0];
            expect(part.id).toBe(testPartId);
            expect(part.storyId).toBe(testStoryId);
            expect(part.title).toBe('Part One');
            expect(part.partNumber).toBe(1);
            expect(part.chapterCount).toBe(1);
            expect(part.wordCount).toBeGreaterThan(0);
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/parts/[partId]/chapters', () => {
      it('should return all chapters for a part after migration', async () => {
        await testApiHandler({
          handler: chaptersRouteHandler,
          url: `/api/books/${testBookId}/parts/${testPartId}/chapters`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const chapters = await response.json();
            expect(Array.isArray(chapters)).toBe(true);
            expect(chapters).toHaveLength(1);
            
            const chapter = chapters[0];
            expect(chapter.id).toBe(testChapterId);
            expect(chapter.partId).toBe(testPartId);
            expect(chapter.bookId).toBe(testBookId);
            expect(chapter.chapterNumber).toBe(1);
            expect(chapter.globalChapterNumber).toBe(1);
            expect(chapter.sceneCount).toBe(1);
            expect(chapter.wordCount).toBeGreaterThan(0);
          },
        });
      });

      it('should return chapters with migrated content and metadata', async () => {
        await testApiHandler({
          handler: chaptersRouteHandler,
          url: `/api/books/${testBookId}/parts/${testPartId}/chapters`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const chapters = await response.json();

            const chapter = chapters[0];
            expect(chapter.title).toBe('Test Chapter 1');
            expect(chapter.content).toBeDefined();
            expect(chapter.summary).toBeDefined();
            expect(chapter.generationPrompt).toBeDefined();
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/scenes/[sceneId]', () => {
      it('should return scene data after migration', async () => {
        await testApiHandler({
          handler: scenesRouteHandler,
          url: `/api/books/${testBookId}/scenes/${testSceneId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const scene = await response.json();
            expect(scene.id).toBe(testSceneId);
            expect(scene.chapterId).toBe(testChapterId);
            expect(scene.sceneNumber).toBe(1);
            expect(scene.content).toBeDefined();
            expect(scene.wordCount).toBeGreaterThan(0);
            expect(scene.sceneType).toBe('action');
            expect(scene.mood).toBe('neutral');
          },
        });
      });

      it('should return scene with migrated content from original chapter', async () => {
        await testApiHandler({
          handler: scenesRouteHandler,
          url: `/api/books/${testBookId}/scenes/${testSceneId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const scene = await response.json();

            expect(scene.content).toContain('Test chapter content');
            expect(scene.isComplete).toBe(true);
          },
        });
      });
    });
  });

  describe('Search and Navigation API Routes', () => {
    describe('GET /api/books/[bookId]/search', () => {
      it('should search across all hierarchy levels after migration', async () => {
        await testApiHandler({
          handler: searchRouteHandler,
          url: `/api/books/${testBookId}/search?q=Test`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const searchResults = await response.json();
            expect(searchResults.results).toBeDefined();
            expect(searchResults.results.length).toBeGreaterThan(0);
            
            const result = searchResults.results[0];
            expect(result.type).toBeDefined();
            expect(result.title).toBeDefined();
            expect(result.content).toBeDefined();
            expect(result.path).toBeDefined();
          },
        });
      });

      it('should return results from scenes, chapters, parts, and stories', async () => {
        await testApiHandler({
          handler: searchRouteHandler,
          url: `/api/books/${testBookId}/search?q=Story`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const searchResults = await response.json();

            const resultTypes = searchResults.results.map((r: any) => r.type);
            expect(resultTypes).toContain('story');
          },
        });
      });

      it('should support advanced search filters', async () => {
        await testApiHandler({
          handler: searchRouteHandler,
          url: `/api/books/${testBookId}/search?q=Test&type=scene&limit=10`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const searchResults = await response.json();

            expect(searchResults.results.every((r: any) => r.type === 'scene')).toBe(true);
            expect(searchResults.results.length).toBeLessThanOrEqual(10);
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/breadcrumb', () => {
      it('should return correct breadcrumb navigation after migration', async () => {
        await testApiHandler({
          handler: breadcrumbRouteHandler,
          url: `/api/books/${testBookId}/breadcrumb?sceneId=${testSceneId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const breadcrumb = await response.json();
            expect(breadcrumb.path).toBeDefined();
            expect(breadcrumb.items).toHaveLength(5); // book > story > part > chapter > scene
            
            const items = breadcrumb.items;
            expect(items[0].type).toBe('book');
            expect(items[1].type).toBe('story');
            expect(items[2].type).toBe('part');
            expect(items[3].type).toBe('chapter');
            expect(items[4].type).toBe('scene');
            
            expect(items[4].id).toBe(testSceneId);
          },
        });
      });

      it('should handle breadcrumb for different hierarchy levels', async () => {
        await testApiHandler({
          handler: breadcrumbRouteHandler,
          url: `/api/books/${testBookId}/breadcrumb?chapterId=${testChapterId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const breadcrumb = await response.json();

            expect(breadcrumb.items).toHaveLength(4); // book > story > part > chapter
            expect(breadcrumb.items[3].id).toBe(testChapterId);
          },
        });
      });
    });

    describe('GET /api/books/[bookId]/ai-context', () => {
      it('should generate AI context from migrated hierarchy', async () => {
        await testApiHandler({
          handler: aiContextRouteHandler,
          url: `/api/books/${testBookId}/ai-context?sceneId=${testSceneId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });

            expect(response.status).toBe(200);
            
            const context = await response.json();
            expect(context.bookContext).toBeDefined();
            expect(context.storyContext).toBeDefined();
            expect(context.partContext).toBeDefined();
            expect(context.chapterContext).toBeDefined();
            expect(context.sceneContext).toBeDefined();
            
            expect(context.previousScenes).toBeDefined();
            expect(context.nextScenes).toBeDefined();
            expect(context.characterArcs).toBeDefined();
            expect(context.plotPoints).toBeDefined();
          },
        });
      });

      it('should include migrated content in AI context', async () => {
        await testApiHandler({
          handler: aiContextRouteHandler,
          url: `/api/books/${testBookId}/ai-context?chapterId=${testChapterId}`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            const context = await response.json();

            expect(context.chapterContext.summary).toBeDefined();
            expect(context.chapterContext.generationPrompt).toBeDefined();
            expect(context.chapterContext.previousChapterSummary).toBeDefined();
          },
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid hierarchy references gracefully', async () => {
      await testApiHandler({
        handler: hierarchyRouteHandler,
        url: '/api/books/invalid-book-id/hierarchy',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          expect(response.status).toBe(404);
        },
      });
    });

    it('should handle malformed query parameters', async () => {
      await testApiHandler({
        handler: searchRouteHandler,
        url: `/api/books/${testBookId}/search?q=&type=invalid&limit=abc`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          expect(response.status).toBe(400);
          
          const error = await response.json();
          expect(error.error).toContain('Invalid search parameters');
        },
      });
    });

    it('should handle database connection errors', async () => {
      // Simulate database error by disconnecting
      await simulateDatabaseError();

      await testApiHandler({
        handler: hierarchyRouteHandler,
        url: `/api/books/${testBookId}/hierarchy`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          expect(response.status).toBe(500);
          
          const error = await response.json();
          expect(error.error).toContain('Database connection error');
        },
      });
    });

    it('should handle corrupted migration data', async () => {
      // Corrupt the hierarchy data
      await corruptMigrationData();

      await testApiHandler({
        handler: hierarchyRouteHandler,
        url: `/api/books/${testBookId}/hierarchy`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          expect(response.status).toBe(500);
          
          const error = await response.json();
          expect(error.error).toContain('Data integrity error');
        },
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond quickly for large hierarchies', async () => {
      await createLargeHierarchy();

      const startTime = Date.now();
      
      await testApiHandler({
        handler: hierarchyRouteHandler,
        url: `/api/books/${testBookId}/hierarchy`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const endTime = Date.now();

          expect(response.status).toBe(200);
          expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
        },
      });
    });

    it('should handle concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() =>
        testApiHandler({
          handler: hierarchyRouteHandler,
          url: `/api/books/${testBookId}/hierarchy`,
          test: async ({ fetch }) => {
            const response = await fetch({ method: 'GET' });
            return response.status;
          },
        })
      );

      const results = await Promise.all(requests);
      expect(results.every(status => status === 200)).toBe(true);
    });
  });

  // Helper functions
  async function setupTestDataAndMigrate() {
    // Create test book
    const bookResult = await db.insert(book).values({
      id: 'test-book-1',
      title: 'Test Book for Migration',
      authorId: 'test-author',
      status: 'draft',
      description: 'Test book description'
    }).returning();
    testBookId = bookResult[0].id;

    // Create test chapter
    const chapterResult = await db.insert(chapter).values({
      id: 'test-chapter-1',
      bookId: testBookId,
      chapterNumber: 1,
      title: 'Test Chapter 1',
      content: { 
        type: 'doc', 
        content: [{ 
          type: 'paragraph', 
          content: [{ 
            type: 'text', 
            text: 'Test chapter content for migration testing' 
          }] 
        }] 
      },
      wordCount: 150
    }).returning();

    // Perform migration
    await migration.migrateToHierarchy({ batchSize: 10 });

    // Get migrated IDs
    const stories = await db.select().from(story).where({ bookId: testBookId });
    testStoryId = stories[0].id;

    const parts = await db.select().from(part).where({ storyId: testStoryId });
    testPartId = parts[0].id;

    const chapters = await db.select().from(chapterEnhanced).where({ partId: testPartId });
    testChapterId = chapters[0].id;

    const scenes = await db.select().from(scene).where({ chapterId: testChapterId });
    testSceneId = scenes[0].id;
  }

  async function createAdditionalStory() {
    const storyResult = await db.insert(story).values({
      bookId: testBookId,
      title: 'Second Story',
      order: 1
    }).returning();
    return storyResult[0].id;
  }

  async function createLargeHierarchy() {
    // Create additional parts, chapters, and scenes for performance testing
    for (let i = 2; i <= 5; i++) {
      const partResult = await db.insert(part).values({
        storyId: testStoryId,
        title: `Part ${i}`,
        partNumber: i,
        order: i - 1
      }).returning();

      for (let j = 1; j <= 10; j++) {
        const chapterResult = await db.insert(chapterEnhanced).values({
          partId: partResult[0].id,
          bookId: testBookId,
          chapterNumber: j,
          globalChapterNumber: ((i - 1) * 10) + j,
          title: `Part ${i} Chapter ${j}`,
          content: {},
          wordCount: 200
        }).returning();

        for (let k = 1; k <= 3; k++) {
          await db.insert(scene).values({
            chapterId: chapterResult[0].id,
            sceneNumber: k,
            title: `Scene ${k}`,
            content: `Content for part ${i} chapter ${j} scene ${k}`,
            wordCount: 70
          });
        }
      }
    }
  }

  async function simulateDatabaseError() {
    // Mock database connection error
    jest.spyOn(db, 'select').mockRejectedValue(new Error('Database connection error'));
  }

  async function corruptMigrationData() {
    // Corrupt the hierarchy by deleting a part but keeping its chapters
    await db.delete(part).where({ id: testPartId });
  }
});