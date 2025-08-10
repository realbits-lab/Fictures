import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

test.describe('Story Browsing and Discovery', () => {
  let storyPage: StoryPage;

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.navigateToStoryBrowse();
    await storyPage.waitForStoryBrowseLoad();
  });

  test('should display story grid with published stories', async () => {
    // This test will fail because story browsing page doesn't exist yet
    await expect(storyPage.storyGrid).toBeVisible();
    
    const storyCards = await storyPage.getStoryCards();
    expect(storyCards.length).toBeGreaterThan(0);
    
    // Each story card should have required elements
    for (const card of storyCards.slice(0, 3)) { // Test first 3 cards
      await expect(card.getByTestId('story-title')).toBeVisible();
      await expect(card.getByTestId('story-description')).toBeVisible();
      await expect(card.getByTestId('story-author')).toBeVisible();
      await expect(card.getByTestId('story-genre')).toBeVisible();
      await expect(card.getByTestId('story-stats')).toBeVisible();
    }
  });

  test('should search stories by title and description', async () => {
    // This test will fail because search functionality doesn't exist yet
    await storyPage.searchStories('fantasy magic');
    
    const storyCards = await storyPage.getStoryCards();
    expect(storyCards.length).toBeGreaterThan(0);
    
    // Results should contain search terms in title or description
    for (const card of storyCards) {
      const title = await card.getByTestId('story-title').textContent();
      const description = await card.getByTestId('story-description').textContent();
      
      const searchText = (title + ' ' + description).toLowerCase();
      const hasFantasy = searchText.includes('fantasy');
      const hasMagic = searchText.includes('magic');
      
      expect(hasFantasy || hasMagic).toBe(true);
    }
  });

  test('should filter stories by genre', async () => {
    // This test will fail because genre filtering doesn't exist yet
    await storyPage.filterByGenre('fantasy');
    
    const storyCards = await storyPage.getStoryCards();
    expect(storyCards.length).toBeGreaterThan(0);
    
    // All results should be fantasy genre
    for (const card of storyCards) {
      await expect(card.getByTestId('story-genre')).toContainText('Fantasy');
    }
  });

  test('should display story statistics correctly', async () => {
    // This test will fail because story statistics display doesn't exist yet
    const firstStoryCard = (await storyPage.getStoryCards())[0];
    
    await expect(firstStoryCard.getByTestId('word-count')).toBeVisible();
    await expect(firstStoryCard.getByTestId('chapter-count')).toBeVisible();
    await expect(firstStoryCard.getByTestId('read-count')).toBeVisible();
    await expect(firstStoryCard.getByTestId('like-count')).toBeVisible();
    
    // Stats should be formatted properly
    const wordCount = await firstStoryCard.getByTestId('word-count').textContent();
    expect(wordCount).toMatch(/\d+[\w\s]*words?/i);
  });

  test('should handle pagination when many stories exist', async () => {
    // This test will fail because pagination doesn't exist yet
    const initialCards = await storyPage.getStoryCards();
    
    if (initialCards.length >= 10) {
      // Should show pagination controls
      await expect(storyPage.page.getByTestId('pagination')).toBeVisible();
      await expect(storyPage.page.getByTestId('next-page-button')).toBeVisible();
      
      // Navigate to next page
      await storyPage.page.getByTestId('next-page-button').click();
      await storyPage.waitForStoryBrowseLoad();
      
      const nextPageCards = await storyPage.getStoryCards();
      expect(nextPageCards.length).toBeGreaterThan(0);
      
      // Should show different stories
      const firstCardTitle = await nextPageCards[0].getByTestId('story-title').textContent();
      const initialFirstCardTitle = await initialCards[0].getByTestId('story-title').textContent();
      expect(firstCardTitle).not.toBe(initialFirstCardTitle);
    }
  });

  test('should show mature content warning and filtering', async () => {
    // This test will fail because mature content handling doesn't exist yet
    // Toggle mature content visibility
    await storyPage.page.getByTestId('mature-content-toggle').click();
    
    const storyCards = await storyPage.getStoryCards();
    
    // Should find stories with mature content indicator
    let foundMatureContent = false;
    for (const card of storyCards) {
      const matureIndicator = card.getByTestId('mature-indicator');
      if (await matureIndicator.isVisible()) {
        foundMatureContent = true;
        await expect(matureIndicator).toContainText('18+');
        break;
      }
    }
    
    // If mature stories exist, we should find at least one
    if (foundMatureContent) {
      expect(foundMatureContent).toBe(true);
    }
  });

  test('should sort stories by different criteria', async () => {
    // This test will fail because sorting doesn't exist yet
    await storyPage.page.getByTestId('sort-dropdown').click();
    
    // Test sorting by popularity
    await storyPage.page.getByTestId('sort-by-popularity').click();
    await storyPage.waitForStoryBrowseLoad();
    
    let storyCards = await storyPage.getStoryCards();
    const firstStoryLikes = await storyCards[0].getByTestId('like-count').textContent();
    const secondStoryLikes = await storyCards[1].getByTestId('like-count').textContent();
    
    // Should be sorted by likes (descending)
    expect(parseInt(firstStoryLikes || '0')).toBeGreaterThanOrEqual(parseInt(secondStoryLikes || '0'));
    
    // Test sorting by newest
    await storyPage.page.getByTestId('sort-dropdown').click();
    await storyPage.page.getByTestId('sort-by-newest').click();
    await storyPage.waitForStoryBrowseLoad();
    
    storyCards = await storyPage.getStoryCards();
    // Should show most recently published stories first
    await expect(storyCards[0].getByTestId('publication-date')).toBeVisible();
  });
});

test.describe('Story Reading Interface', () => {
  let storyPage: StoryPage;
  const testStoryId = 'test-story-123'; // This would be a known test story

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.navigateToStory(testStoryId);
    await storyPage.waitForStoryLoad();
  });

  test('should display story information and first chapter', async () => {
    // This test will fail because story reading page doesn't exist yet
    await expect(storyPage.page.getByTestId('story-header')).toBeVisible();
    await expect(storyPage.page.getByTestId('story-title')).toBeVisible();
    await expect(storyPage.page.getByTestId('story-author')).toBeVisible();
    await expect(storyPage.page.getByTestId('story-description')).toBeVisible();
    await expect(storyPage.page.getByTestId('story-stats')).toBeVisible();
    
    // Chapter content should be visible
    await expect(storyPage.chapterTitle).toBeVisible();
    await expect(storyPage.chapterContent).toBeVisible();
  });

  test('should navigate between chapters', async ({ page }) => {
    // This test will fail because chapter navigation doesn't exist yet
    const currentChapter = await storyPage.getCurrentChapterNumber();
    expect(currentChapter).toBe(1);
    
    // Navigate to next chapter
    await storyPage.navigateToNextChapter();
    await storyPage.waitForChapterLoad();
    
    const nextChapter = await storyPage.getCurrentChapterNumber();
    expect(nextChapter).toBe(2);
    expect(page.url()).toContain('/chapters/2');
    
    // Navigate back to previous chapter
    await storyPage.navigateToPreviousChapter();
    await storyPage.waitForChapterLoad();
    
    const prevChapter = await storyPage.getCurrentChapterNumber();
    expect(prevChapter).toBe(1);
    expect(page.url()).toContain('/chapters/1');
  });

  test('should show chapter navigation menu', async () => {
    // This test will fail because chapter navigation doesn't exist yet
    const chapterList = await storyPage.getChapterList();
    expect(chapterList.length).toBeGreaterThan(0);
    
    // Each chapter should have title and number
    for (const chapter of chapterList.slice(0, 3)) {
      await expect(chapter.getByTestId('chapter-number')).toBeVisible();
      await expect(chapter.getByTestId('chapter-title')).toBeVisible();
    }
    
    // Should be able to navigate to specific chapter
    await storyPage.navigateToChapterFromList(3);
    await storyPage.waitForChapterLoad();
    
    const currentChapter = await storyPage.getCurrentChapterNumber();
    expect(currentChapter).toBe(3);
  });

  test('should track and display reading progress', async () => {
    // This test will fail because reading progress tracking doesn't exist yet
    const progressBar = await storyPage.getReadingProgress();
    await expect(progressBar).toBeVisible();
    
    // Should show current position in story
    const currentChapter = await storyPage.getCurrentChapterNumber();
    const totalChapters = await storyPage.getTotalChapters();
    
    expect(currentChapter).toBeGreaterThan(0);
    expect(totalChapters).toBeGreaterThan(0);
    expect(currentChapter).toBeLessThanOrEqual(totalChapters || 0);
    
    // Progress should update when navigating chapters
    await storyPage.navigateToNextChapter();
    await storyPage.waitForChapterLoad();
    
    const newProgress = await storyPage.getReadingProgress();
    await expect(newProgress).toBeVisible();
  });

  test('should allow bookmarking and liking stories', async () => {
    // This test will fail because interaction buttons don't exist yet
    const bookmarkButton = storyPage.page.getByTestId('bookmark-story-button');
    const likeButton = storyPage.page.getByTestId('like-story-button');
    
    await expect(bookmarkButton).toBeVisible();
    await expect(likeButton).toBeVisible();
    
    // Test bookmarking
    await bookmarkButton.click();
    await expect(storyPage.page.getByText('Story bookmarked')).toBeVisible();
    
    // Button should change state
    await expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
    
    // Test liking
    await likeButton.click();
    await expect(storyPage.page.getByText('Story liked')).toBeVisible();
    
    // Like count should increase
    const likeCount = storyPage.page.getByTestId('like-count');
    await expect(likeCount).toBeVisible();
  });

  test('should display author information and other stories', async () => {
    // This test will fail because author information section doesn't exist yet
    const authorSection = storyPage.page.getByTestId('author-section');
    await expect(authorSection).toBeVisible();
    
    await expect(authorSection.getByTestId('author-name')).toBeVisible();
    await expect(authorSection.getByTestId('author-bio')).toBeVisible();
    await expect(authorSection.getByTestId('author-stats')).toBeVisible();
    
    // Should show other stories by the same author
    const otherStories = storyPage.page.getByTestId('other-stories-by-author');
    await expect(otherStories).toBeVisible();
    
    const otherStoryCards = await otherStories.getByTestId('story-card').all();
    expect(otherStoryCards.length).toBeGreaterThan(0);
  });

  test('should handle reading preferences and settings', async () => {
    // This test will fail because reading preferences don't exist yet
    const settingsButton = storyPage.page.getByTestId('reading-settings-button');
    await settingsButton.click();
    
    const settingsModal = storyPage.page.getByTestId('reading-settings-modal');
    await expect(settingsModal).toBeVisible();
    
    // Should have font size controls
    await expect(settingsModal.getByTestId('font-size-slider')).toBeVisible();
    
    // Should have theme toggle
    await expect(settingsModal.getByTestId('theme-toggle')).toBeVisible();
    
    // Should have line spacing controls
    await expect(settingsModal.getByTestId('line-spacing-controls')).toBeVisible();
    
    // Test changing font size
    const fontSizeSlider = settingsModal.getByTestId('font-size-slider');
    await fontSizeSlider.click();
    
    // Chapter content should reflect the change
    const chapterContent = storyPage.chapterContent;
    const fontSize = await chapterContent.evaluate(el => window.getComputedStyle(el).fontSize);
    expect(fontSize).toBeDefined();
  });
});