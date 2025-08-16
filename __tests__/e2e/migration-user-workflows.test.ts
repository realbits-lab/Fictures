/**
 * RED PHASE - E2E Tests for Post-Migration User Workflows
 * These tests ensure the complete user experience works after hierarchy migration
 * All tests should FAIL initially as migration implementation doesn't exist yet
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { test as base } from '@playwright/test';
import { HierarchyMigration } from '../../lib/migration/hierarchy-migration';
import { db } from '../../lib/db';
import { book, chapter } from '../../lib/db/schema';

// Extend Playwright test to include migration setup
const test = base.extend<{
  migrationSetup: {
    testBookId: string;
    testStoryId: string;
    testPartId: string;
    testChapterId: string;
    testSceneId: string;
  };
}>({
  migrationSetup: async ({}, use) => {
    const migration = new HierarchyMigration(db);
    
    // Setup test data and perform migration
    const testBookId = await setupTestBookAndChapters();
    await migration.migrateToHierarchy({ batchSize: 10 });
    
    // Get migrated IDs for tests
    const ids = await getMigratedIds(testBookId);
    
    await use(ids);
    
    // Cleanup after test
    await cleanupTestData();
  },
});

describe('Post-Migration User Workflows', () => {
  describe('Book Navigation and Hierarchy Viewing', () => {
    test('user can navigate through migrated book hierarchy', async ({ page, migrationSetup }) => {
      const { testBookId, testStoryId, testPartId, testChapterId, testSceneId } = migrationSetup;

      // Navigate to book page
      await page.goto(`/books/${testBookId}`);
      
      // Should see book overview with new hierarchy
      await expect(page.locator('[data-testid="book-hierarchy"]')).toBeVisible();
      await expect(page.locator('[data-testid="story-list"]')).toBeVisible();
      
      // Should see the migrated story
      const storyCard = page.locator(`[data-testid="story-${testStoryId}"]`);
      await expect(storyCard).toBeVisible();
      await expect(storyCard.locator('[data-testid="story-title"]')).toContainText('Main Story');
      
      // Click on story to expand parts
      await storyCard.click();
      await expect(page.locator(`[data-testid="part-${testPartId}"]`)).toBeVisible();
      
      // Click on part to expand chapters
      const partCard = page.locator(`[data-testid="part-${testPartId}"]`);
      await partCard.click();
      await expect(page.locator(`[data-testid="chapter-${testChapterId}"]`)).toBeVisible();
      
      // Click on chapter to view scenes
      const chapterCard = page.locator(`[data-testid="chapter-${testChapterId}"]`);
      await chapterCard.click();
      await expect(page.locator(`[data-testid="scene-${testSceneId}"]`)).toBeVisible();
    });

    test('user can use hierarchy breadcrumb navigation', async ({ page, migrationSetup }) => {
      const { testBookId, testSceneId } = migrationSetup;

      // Navigate directly to a scene
      await page.goto(`/books/${testBookId}/stories/*/parts/*/chapters/*/scenes/${testSceneId}/write`);
      
      // Should see breadcrumb navigation
      const breadcrumb = page.locator('[data-testid="hierarchy-breadcrumb"]');
      await expect(breadcrumb).toBeVisible();
      
      // Breadcrumb should show full hierarchy path
      await expect(breadcrumb.locator('[data-testid="breadcrumb-book"]')).toBeVisible();
      await expect(breadcrumb.locator('[data-testid="breadcrumb-story"]')).toBeVisible();
      await expect(breadcrumb.locator('[data-testid="breadcrumb-part"]')).toBeVisible();
      await expect(breadcrumb.locator('[data-testid="breadcrumb-chapter"]')).toBeVisible();
      await expect(breadcrumb.locator('[data-testid="breadcrumb-scene"]')).toBeVisible();
      
      // Click on part breadcrumb to navigate up
      await breadcrumb.locator('[data-testid="breadcrumb-part"]').click();
      await expect(page).toHaveURL(new RegExp(`/books/${testBookId}/stories/.*/parts/.*`));
      
      // Click on book breadcrumb to go to top level
      await breadcrumb.locator('[data-testid="breadcrumb-book"]').click();
      await expect(page).toHaveURL(`/books/${testBookId}`);
    });

    test('user can use hierarchy tree navigation', async ({ page, migrationSetup }) => {
      const { testBookId, testStoryId, testPartId, testChapterId, testSceneId } = migrationSetup;

      await page.goto(`/books/${testBookId}`);
      
      // Should see content tree in sidebar
      const contentTree = page.locator('[data-testid="content-tree"]');
      await expect(contentTree).toBeVisible();
      
      // Expand story in tree
      const storyNode = contentTree.locator(`[data-testid="tree-story-${testStoryId}"]`);
      await expect(storyNode).toBeVisible();
      await storyNode.locator('[data-testid="tree-expand"]').click();
      
      // Should see part in tree
      const partNode = contentTree.locator(`[data-testid="tree-part-${testPartId}"]`);
      await expect(partNode).toBeVisible();
      await partNode.locator('[data-testid="tree-expand"]').click();
      
      // Should see chapter in tree
      const chapterNode = contentTree.locator(`[data-testid="tree-chapter-${testChapterId}"]`);
      await expect(chapterNode).toBeVisible();
      await chapterNode.locator('[data-testid="tree-expand"]').click();
      
      // Should see scene in tree and click to navigate
      const sceneNode = contentTree.locator(`[data-testid="tree-scene-${testSceneId}"]`);
      await expect(sceneNode).toBeVisible();
      await sceneNode.click();
      
      // Should navigate to scene write page
      await expect(page).toHaveURL(new RegExp(`scenes/${testSceneId}/write`));
    });
  });

  describe('Writing Interface with Migrated Content', () => {
    test('user can edit scenes with migrated chapter content', async ({ page, migrationSetup }) => {
      const { testBookId, testSceneId } = migrationSetup;

      // Navigate to scene write page
      await page.goto(`/books/${testBookId}/stories/*/parts/*/chapters/*/scenes/${testSceneId}/write`);
      
      // Should see scene editor with migrated content
      const sceneEditor = page.locator('[data-testid="scene-editor"]');
      await expect(sceneEditor).toBeVisible();
      
      // Should contain the original chapter content
      await expect(sceneEditor).toContainText('Test chapter content for migration');
      
      // Edit the content
      await sceneEditor.click();
      await page.keyboard.type(' - Additional content added after migration');
      
      // Save the changes
      const saveButton = page.locator('[data-testid="save-scene"]');
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      
      // Should see save confirmation
      await expect(page.locator('[data-testid="save-notification"]')).toBeVisible();
      
      // Refresh page and verify content persisted
      await page.reload();
      await expect(sceneEditor).toContainText('Additional content added after migration');
    });

    test('user can use AI features with hierarchy context', async ({ page, migrationSetup }) => {
      const { testBookId, testSceneId } = migrationSetup;

      await page.goto(`/books/${testBookId}/stories/*/parts/*/chapters/*/scenes/${testSceneId}/write`);
      
      // Should see AI context panel
      const aiPanel = page.locator('[data-testid="ai-context-panel"]');
      await expect(aiPanel).toBeVisible();
      
      // Should show hierarchy context
      await expect(aiPanel.locator('[data-testid="book-context"]')).toBeVisible();
      await expect(aiPanel.locator('[data-testid="story-context"]')).toBeVisible();
      await expect(aiPanel.locator('[data-testid="part-context"]')).toBeVisible();
      await expect(aiPanel.locator('[data-testid="chapter-context"]')).toBeVisible();
      
      // Use AI to generate content
      const generateButton = page.locator('[data-testid="ai-generate"]');
      await generateButton.click();
      
      // Should see AI generation in progress
      await expect(page.locator('[data-testid="ai-generating"]')).toBeVisible();
      
      // Should complete generation with hierarchy-aware content
      await expect(page.locator('[data-testid="ai-generation-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Generated content should reference hierarchy context
      const generatedContent = page.locator('[data-testid="generated-content"]');
      await expect(generatedContent).toBeVisible();
    });

    test('user can navigate between scenes while writing', async ({ page, migrationSetup }) => {
      const { testBookId, testChapterId } = migrationSetup;

      await page.goto(`/books/${testBookId}/stories/*/parts/*/chapters/${testChapterId}`);
      
      // Should see scene navigation
      const sceneNav = page.locator('[data-testid="scene-navigation"]');
      await expect(sceneNav).toBeVisible();
      
      // Should show current scene
      await expect(sceneNav.locator('[data-testid="current-scene"]')).toBeVisible();
      
      // Should have navigation controls
      const prevButton = sceneNav.locator('[data-testid="prev-scene"]');
      const nextButton = sceneNav.locator('[data-testid="next-scene"]');
      
      // For first scene, prev should be disabled
      await expect(prevButton).toBeDisabled();
      
      // Create additional scene for navigation testing
      const addSceneButton = page.locator('[data-testid="add-scene"]');
      await addSceneButton.click();
      
      // Should create new scene and navigate to it
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      
      // Should navigate to next scene
      await expect(page.locator('[data-testid="scene-number"]')).toContainText('2');
    });
  });

  describe('Search and Discovery Features', () => {
    test('user can search across migrated hierarchy', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      await page.goto(`/books/${testBookId}`);
      
      // Should see search interface
      const searchBox = page.locator('[data-testid="hierarchy-search"]');
      await expect(searchBox).toBeVisible();
      
      // Search for content
      await searchBox.fill('migration');
      await page.keyboard.press('Enter');
      
      // Should see search results
      const searchResults = page.locator('[data-testid="search-results"]');
      await expect(searchResults).toBeVisible();
      
      // Should have results from different hierarchy levels
      await expect(searchResults.locator('[data-testid="result-scene"]')).toBeVisible();
      await expect(searchResults.locator('[data-testid="result-chapter"]')).toBeVisible();
      
      // Click on a result to navigate
      await searchResults.locator('[data-testid="result-scene"]').first().click();
      
      // Should navigate to the scene
      await expect(page).toHaveURL(new RegExp('/scenes/.*/write'));
    });

    test('user can filter search by hierarchy level', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      await page.goto(`/books/${testBookId}`);
      
      const searchBox = page.locator('[data-testid="hierarchy-search"]');
      await searchBox.fill('test');
      
      // Use filter dropdown
      const filterDropdown = page.locator('[data-testid="search-filter"]');
      await filterDropdown.selectOption('scenes');
      
      await page.keyboard.press('Enter');
      
      // Should only show scene results
      const searchResults = page.locator('[data-testid="search-results"]');
      const resultItems = searchResults.locator('[data-testid^="result-"]');
      
      await expect(resultItems).toHaveCount(1);
      await expect(resultItems.first()).toContainText('Scene');
    });

    test('user can use quick jump navigation', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      await page.goto(`/books/${testBookId}`);
      
      // Open quick jump with keyboard shortcut
      await page.keyboard.press('Control+k');
      
      // Should see quick jump modal
      const quickJump = page.locator('[data-testid="quick-jump-modal"]');
      await expect(quickJump).toBeVisible();
      
      // Type to filter
      await page.keyboard.type('Chapter 1');
      
      // Should see filtered results
      const results = quickJump.locator('[data-testid="quick-jump-results"]');
      await expect(results).toBeVisible();
      
      // Select first result
      await page.keyboard.press('Enter');
      
      // Should navigate to chapter
      await expect(page).toHaveURL(new RegExp('/chapters/.*/'));
      await expect(quickJump).not.toBeVisible();
    });
  });

  describe('Reading Experience with Migrated Content', () => {
    test('user can read book with new hierarchy structure', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      // Navigate to reading interface
      await page.goto(`/read/${testBookId}`);
      
      // Should see reading interface with hierarchy navigation
      const readingInterface = page.locator('[data-testid="reading-interface"]');
      await expect(readingInterface).toBeVisible();
      
      // Should show current chapter content (migrated from scenes)
      const chapterContent = page.locator('[data-testid="chapter-content"]');
      await expect(chapterContent).toBeVisible();
      await expect(chapterContent).toContainText('Test chapter content for migration');
      
      // Should have chapter navigation
      const chapterNav = page.locator('[data-testid="chapter-navigation"]');
      await expect(chapterNav).toBeVisible();
      
      // Should show hierarchy context in reading view
      const hierarchyContext = page.locator('[data-testid="reading-hierarchy-context"]');
      await expect(hierarchyContext).toBeVisible();
      await expect(hierarchyContext).toContainText('Main Story');
      await expect(hierarchyContext).toContainText('Part One');
    });

    test('user reading progress is maintained through migration', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      // Navigate to reading interface
      await page.goto(`/read/${testBookId}`);
      
      // Should see reading progress indicator
      const progressIndicator = page.locator('[data-testid="reading-progress"]');
      await expect(progressIndicator).toBeVisible();
      
      // Progress should be preserved from pre-migration data
      await expect(progressIndicator).toContainText('0%'); // New book, no progress yet
      
      // Simulate reading progress
      await page.locator('[data-testid="mark-as-read"]').click();
      
      // Progress should update
      await expect(progressIndicator).toContainText('100%');
      
      // Navigate away and back
      await page.goto(`/books/${testBookId}`);
      await page.goto(`/read/${testBookId}`);
      
      // Progress should be maintained
      await expect(progressIndicator).toContainText('100%');
    });
  });

  describe('Performance and Responsiveness', () => {
    test('hierarchy navigation is responsive for large books', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      // Create large hierarchy for testing
      await createLargeTestHierarchy(testBookId);

      await page.goto(`/books/${testBookId}`);
      
      // Measure time to load hierarchy
      const startTime = Date.now();
      
      await expect(page.locator('[data-testid="book-hierarchy"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
      
      // Test tree expansion performance
      const storyNode = page.locator('[data-testid="tree-story"]').first();
      
      const expandStartTime = Date.now();
      await storyNode.locator('[data-testid="tree-expand"]').click();
      await expect(page.locator('[data-testid="tree-part"]').first()).toBeVisible();
      
      const expandTime = Date.now() - expandStartTime;
      expect(expandTime).toBeLessThan(1000); // Should expand within 1 second
    });

    test('search performs well with large content', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      await createLargeTestHierarchy(testBookId);
      await page.goto(`/books/${testBookId}`);
      
      const searchBox = page.locator('[data-testid="hierarchy-search"]');
      
      // Measure search performance
      const searchStartTime = Date.now();
      
      await searchBox.fill('content');
      await page.keyboard.press('Enter');
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      const searchTime = Date.now() - searchStartTime;
      expect(searchTime).toBeLessThan(2000); // Should search within 2 seconds
      
      // Should have multiple results
      const results = page.locator('[data-testid="search-results"] [data-testid^="result-"]');
      await expect(results).toHaveCountGreaterThan(5);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('user sees helpful error when accessing corrupted hierarchy', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      // Simulate corrupted hierarchy data
      await corruptHierarchyData(testBookId);

      await page.goto(`/books/${testBookId}`);
      
      // Should see error message with recovery options
      const errorMessage = page.locator('[data-testid="hierarchy-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('hierarchy data');
      
      // Should have recovery action
      const recoveryButton = page.locator('[data-testid="recover-hierarchy"]');
      await expect(recoveryButton).toBeVisible();
      
      // Click recovery to attempt data repair
      await recoveryButton.click();
      
      // Should see recovery in progress
      await expect(page.locator('[data-testid="recovery-progress"]')).toBeVisible();
    });

    test('user can continue working during partial migration failures', async ({ page, migrationSetup }) => {
      const { testBookId } = migrationSetup;

      // Simulate partial migration failure
      await simulatePartialMigrationFailure(testBookId);

      await page.goto(`/books/${testBookId}`);
      
      // Should see warning about partial migration
      const warningMessage = page.locator('[data-testid="migration-warning"]');
      await expect(warningMessage).toBeVisible();
      
      // Should still be able to access available content
      await expect(page.locator('[data-testid="available-content"]')).toBeVisible();
      
      // Should have option to retry migration
      const retryButton = page.locator('[data-testid="retry-migration"]');
      await expect(retryButton).toBeVisible();
    });
  });
});

// Helper functions
async function setupTestBookAndChapters(): Promise<string> {
  // Insert test book
  const bookResult = await db.insert(book).values({
    title: 'Migration Test Book',
    authorId: 'test-author',
    status: 'draft',
    description: 'Book for testing migration workflows'
  }).returning();

  const bookId = bookResult[0].id;

  // Insert test chapters
  await db.insert(chapter).values([
    {
      bookId: bookId,
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
    },
    {
      bookId: bookId,
      chapterNumber: 2,
      title: 'Test Chapter 2',
      content: { 
        type: 'doc', 
        content: [{ 
          type: 'paragraph', 
          content: [{ 
            type: 'text', 
            text: 'Second chapter content for migration' 
          }] 
        }] 
      },
      wordCount: 120
    }
  ]);

  return bookId;
}

async function getMigratedIds(bookId: string) {
  // These functions will be implemented after migration is complete
  // For now, return mock IDs that the tests expect
  return {
    testBookId: bookId,
    testStoryId: 'migrated-story-id',
    testPartId: 'migrated-part-id', 
    testChapterId: 'migrated-chapter-id',
    testSceneId: 'migrated-scene-id'
  };
}

async function createLargeTestHierarchy(bookId: string) {
  // Create additional stories, parts, chapters, and scenes for performance testing
  // Implementation will be added during GREEN phase
}

async function corruptHierarchyData(bookId: string) {
  // Simulate data corruption for error handling tests
  // Implementation will be added during GREEN phase
}

async function simulatePartialMigrationFailure(bookId: string) {
  // Simulate partial migration failure scenario
  // Implementation will be added during GREEN phase
}

async function cleanupTestData() {
  // Clean up all test data
  // Implementation will be added during GREEN phase
}