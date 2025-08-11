import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

/**
 * RED PHASE - TDD Phase 2: Reading Experience Enhancement
 * 
 * These tests will FAIL because Phase 2 reading customization features don't exist yet.
 * This is intentional and follows TDD RED-GREEN-REFACTOR methodology.
 * 
 * Features to test:
 * - Advanced reading interface customization (themes, fonts, layouts)
 * - Personal library with collections and reading lists  
 * - Offline reading capabilities (PWA features)
 * - Reading statistics and achievements
 */
test.describe('Phase 2: Reading Experience Enhancement', () => {
  let storyPage: StoryPage;
  const testStoryId = 'test-story-phase2-reading';

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.navigateToStory(testStoryId);
    await storyPage.waitForStoryLoad();
  });

  test.describe('Advanced Reading Interface Customization', () => {
    test('should provide comprehensive theme options', async () => {
      // This test will FAIL - advanced themes don't exist yet
      const settingsButton = storyPage.page.getByTestId('reading-customization-button');
      await settingsButton.click();
      
      const customizationPanel = storyPage.page.getByTestId('reading-customization-panel');
      await expect(customizationPanel).toBeVisible();
      
      // Theme selection options
      await expect(customizationPanel.getByTestId('theme-light')).toBeVisible();
      await expect(customizationPanel.getByTestId('theme-dark')).toBeVisible();
      await expect(customizationPanel.getByTestId('theme-sepia')).toBeVisible();
      await expect(customizationPanel.getByTestId('theme-high-contrast')).toBeVisible();
      await expect(customizationPanel.getByTestId('theme-night-mode')).toBeVisible();
      
      // Test theme switching
      await customizationPanel.getByTestId('theme-sepia').click();
      
      const chapterContent = storyPage.page.getByTestId('chapter-content');
      const backgroundColor = await chapterContent.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Sepia theme should have warm background color
      expect(backgroundColor).toContain('251, 241, 199'); // RGB for sepia
    });

    test('should offer extensive font customization options', async () => {
      // This test will FAIL - advanced font controls don't exist yet
      const settingsButton = storyPage.page.getByTestId('reading-customization-button');
      await settingsButton.click();
      
      const customizationPanel = storyPage.page.getByTestId('reading-customization-panel');
      
      // Font family options
      await expect(customizationPanel.getByTestId('font-family-serif')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-family-sans-serif')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-family-monospace')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-family-dyslexic')).toBeVisible(); // Accessibility
      
      // Font size controls
      await expect(customizationPanel.getByTestId('font-size-slider')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-size-preset-small')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-size-preset-medium')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-size-preset-large')).toBeVisible();
      await expect(customizationPanel.getByTestId('font-size-preset-xl')).toBeVisible();
      
      // Line height and spacing
      await expect(customizationPanel.getByTestId('line-height-slider')).toBeVisible();
      await expect(customizationPanel.getByTestId('letter-spacing-slider')).toBeVisible();
      await expect(customizationPanel.getByTestId('word-spacing-slider')).toBeVisible();
      
      // Test font changes
      await customizationPanel.getByTestId('font-family-serif').click();
      await customizationPanel.getByTestId('font-size-preset-large').click();
      
      const chapterContent = storyPage.page.getByTestId('chapter-content');
      const fontFamily = await chapterContent.evaluate(el => 
        window.getComputedStyle(el).fontFamily
      );
      const fontSize = await chapterContent.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      expect(fontFamily).toContain('serif');
      expect(parseFloat(fontSize)).toBeGreaterThan(18); // Large font size
    });

    test('should provide layout and spacing customization', async () => {
      // This test will FAIL - layout options don't exist yet
      const settingsButton = storyPage.page.getByTestId('reading-customization-button');
      await settingsButton.click();
      
      const customizationPanel = storyPage.page.getByTestId('reading-customization-panel');
      
      // Layout options
      await expect(customizationPanel.getByTestId('layout-single-column')).toBeVisible();
      await expect(customizationPanel.getByTestId('layout-two-column')).toBeVisible();
      await expect(customizationPanel.getByTestId('layout-book-style')).toBeVisible();
      
      // Width and margin controls
      await expect(customizationPanel.getByTestId('content-width-slider')).toBeVisible();
      await expect(customizationPanel.getByTestId('margin-size-slider')).toBeVisible();
      
      // Paragraph spacing
      await expect(customizationPanel.getByTestId('paragraph-spacing-slider')).toBeVisible();
      
      // Test layout change
      await customizationPanel.getByTestId('layout-two-column').click();
      
      const chapterContent = storyPage.page.getByTestId('chapter-content');
      const columnCount = await chapterContent.evaluate(el => 
        window.getComputedStyle(el).columnCount
      );
      
      expect(columnCount).toBe('2');
    });

    test('should save and persist reading preferences across sessions', async () => {
      // This test will FAIL - preferences persistence doesn't exist yet
      const settingsButton = storyPage.page.getByTestId('reading-customization-button');
      await settingsButton.click();
      
      const customizationPanel = storyPage.page.getByTestId('reading-customization-panel');
      
      // Set custom preferences
      await customizationPanel.getByTestId('theme-dark').click();
      await customizationPanel.getByTestId('font-family-serif').click();
      await customizationPanel.getByTestId('font-size-preset-large').click();
      
      // Close panel and reload page
      await customizationPanel.getByTestId('close-customization').click();
      await storyPage.page.reload();
      await storyPage.waitForStoryLoad();
      
      // Check if preferences persisted
      await settingsButton.click();
      
      const themeIndicator = customizationPanel.getByTestId('current-theme-indicator');
      await expect(themeIndicator).toContainText('Dark');
      
      await expect(customizationPanel.getByTestId('font-family-serif')).toHaveAttribute('aria-selected', 'true');
      await expect(customizationPanel.getByTestId('font-size-preset-large')).toHaveAttribute('aria-selected', 'true');
    });

    test('should provide accessibility-focused customization options', async () => {
      // This test will FAIL - accessibility options don't exist yet
      const settingsButton = storyPage.page.getByTestId('reading-customization-button');
      await settingsButton.click();
      
      const customizationPanel = storyPage.page.getByTestId('reading-customization-panel');
      
      // Accessibility tab
      await customizationPanel.getByTestId('accessibility-tab').click();
      
      // High contrast options
      await expect(customizationPanel.getByTestId('high-contrast-toggle')).toBeVisible();
      await expect(customizationPanel.getByTestId('color-contrast-slider')).toBeVisible();
      
      // Dyslexia-friendly options
      await expect(customizationPanel.getByTestId('dyslexia-friendly-font')).toBeVisible();
      await expect(customizationPanel.getByTestId('highlight-syllables')).toBeVisible();
      await expect(customizationPanel.getByTestId('reading-ruler')).toBeVisible();
      
      // Motion sensitivity
      await expect(customizationPanel.getByTestId('reduce-motion-toggle')).toBeVisible();
      
      // Screen reader compatibility
      await expect(customizationPanel.getByTestId('screen-reader-mode')).toBeVisible();
      
      // Test high contrast mode
      await customizationPanel.getByTestId('high-contrast-toggle').click();
      
      const chapterContent = storyPage.page.getByTestId('chapter-content');
      const color = await chapterContent.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Should have high contrast text color
      expect(color).toMatch(/rgb\((0|255),\s*(0|255),\s*(0|255)\)/);
    });
  });

  test.describe('Personal Library and Collections', () => {
    test('should allow creating and managing reading collections', async () => {
      // This test will FAIL - collections don't exist yet
      await storyPage.page.goto('/library');
      
      const libraryPage = storyPage.page.getByTestId('personal-library');
      await expect(libraryPage).toBeVisible();
      
      // Create new collection
      const createCollectionButton = storyPage.page.getByTestId('create-collection-button');
      await createCollectionButton.click();
      
      const collectionModal = storyPage.page.getByTestId('create-collection-modal');
      await expect(collectionModal).toBeVisible();
      
      await collectionModal.getByTestId('collection-name-input').fill('Favorite Fantasy');
      await collectionModal.getByTestId('collection-description-input').fill('My favorite fantasy novels');
      await collectionModal.getByTestId('collection-privacy-public').click();
      await collectionModal.getByTestId('create-collection-submit').click();
      
      // Collection should appear in library
      const collectionList = storyPage.page.getByTestId('collections-list');
      await expect(collectionList.getByText('Favorite Fantasy')).toBeVisible();
      
      // Should be able to add stories to collection
      await collectionList.getByText('Favorite Fantasy').click();
      const addStoryButton = storyPage.page.getByTestId('add-story-to-collection-button');
      await expect(addStoryButton).toBeVisible();
    });

    test('should provide reading lists with custom ordering', async () => {
      // This test will FAIL - reading lists don't exist yet
      await storyPage.page.goto('/library/reading-lists');
      
      const readingListsPage = storyPage.page.getByTestId('reading-lists-page');
      await expect(readingListsPage).toBeVisible();
      
      // Create new reading list
      const createListButton = storyPage.page.getByTestId('create-reading-list-button');
      await createListButton.click();
      
      const listModal = storyPage.page.getByTestId('create-reading-list-modal');
      await listModal.getByTestId('list-name-input').fill('Summer Reading 2024');
      await listModal.getByTestId('create-list-submit').click();
      
      // Should allow adding stories with custom order
      const readingList = storyPage.page.getByTestId('reading-list-summer-reading-2024');
      await expect(readingList).toBeVisible();
      
      await readingList.getByTestId('add-story-button').click();
      const storySearchModal = storyPage.page.getByTestId('story-search-modal');
      await expect(storySearchModal).toBeVisible();
      
      // Should allow reordering stories in list
      const storyItems = readingList.getByTestId('story-list-item');
      const firstStory = storyItems.first();
      const secondStory = storyItems.nth(1);
      
      await firstStory.getByTestId('drag-handle').dragTo(secondStory);
      
      // Order should be updated
      const updatedFirstStory = readingList.getByTestId('story-list-item').first();
      const originalSecondStoryTitle = await secondStory.getByTestId('story-title').textContent();
      const newFirstStoryTitle = await updatedFirstStory.getByTestId('story-title').textContent();
      
      expect(newFirstStoryTitle).toBe(originalSecondStoryTitle);
    });

    test('should track and display reading statistics', async () => {
      // This test will FAIL - reading statistics don't exist yet
      await storyPage.page.goto('/library/statistics');
      
      const statsPage = storyPage.page.getByTestId('reading-statistics-page');
      await expect(statsPage).toBeVisible();
      
      // Reading time statistics
      await expect(statsPage.getByTestId('total-reading-time')).toBeVisible();
      await expect(statsPage.getByTestId('daily-reading-time')).toBeVisible();
      await expect(statsPage.getByTestId('weekly-reading-time')).toBeVisible();
      await expect(statsPage.getByTestId('reading-streak')).toBeVisible();
      
      // Story completion statistics  
      await expect(statsPage.getByTestId('stories-completed')).toBeVisible();
      await expect(statsPage.getByTestId('chapters-read')).toBeVisible();
      await expect(statsPage.getByTestId('words-read')).toBeVisible();
      
      // Genre preferences
      await expect(statsPage.getByTestId('favorite-genres-chart')).toBeVisible();
      
      // Reading pace
      await expect(statsPage.getByTestId('reading-pace-chart')).toBeVisible();
      await expect(statsPage.getByTestId('words-per-minute')).toBeVisible();
      
      // Goals and achievements
      await expect(statsPage.getByTestId('reading-goals-section')).toBeVisible();
      await expect(statsPage.getByTestId('achievements-section')).toBeVisible();
      
      // Should display meaningful data
      const totalTime = await statsPage.getByTestId('total-reading-time').textContent();
      expect(totalTime).toMatch(/\d+h \d+m/); // Format: "15h 23m"
      
      const storiesCompleted = await statsPage.getByTestId('stories-completed').textContent();
      expect(storiesCompleted).toMatch(/\d+/);
    });

    test('should provide reading achievements and badges system', async () => {
      // This test will FAIL - achievements system doesn't exist yet
      await storyPage.page.goto('/library/achievements');
      
      const achievementsPage = storyPage.page.getByTestId('achievements-page');
      await expect(achievementsPage).toBeVisible();
      
      // Achievement categories
      await expect(achievementsPage.getByTestId('reading-milestones')).toBeVisible();
      await expect(achievementsPage.getByTestId('genre-explorer')).toBeVisible();
      await expect(achievementsPage.getByTestId('consistency-badges')).toBeVisible();
      await expect(achievementsPage.getByTestId('special-achievements')).toBeVisible();
      
      // Individual achievements
      const milestonesSection = achievementsPage.getByTestId('reading-milestones');
      await expect(milestonesSection.getByTestId('first-story-badge')).toBeVisible();
      await expect(milestonesSection.getByTestId('ten-stories-badge')).toBeVisible();
      await expect(milestonesSection.getByTestId('hundred-stories-badge')).toBeVisible();
      await expect(milestonesSection.getByTestId('speed-reader-badge')).toBeVisible();
      
      // Progress indicators
      const tenStoriesBadge = milestonesSection.getByTestId('ten-stories-badge');
      await expect(tenStoriesBadge.getByTestId('progress-bar')).toBeVisible();
      await expect(tenStoriesBadge.getByTestId('progress-text')).toBeVisible();
      
      // Should show progress towards goals
      const progressText = await tenStoriesBadge.getByTestId('progress-text').textContent();
      expect(progressText).toMatch(/\d+\/10/); // Format: "7/10"
    });
  });

  test.describe('Offline Reading Capabilities (PWA)', () => {
    test('should allow downloading stories for offline reading', async () => {
      // This test will FAIL - offline functionality doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      
      const downloadButton = storyPage.page.getByTestId('download-for-offline-button');
      await expect(downloadButton).toBeVisible();
      
      await downloadButton.click();
      
      // Download modal should appear
      const downloadModal = storyPage.page.getByTestId('offline-download-modal');
      await expect(downloadModal).toBeVisible();
      
      // Should allow selecting chapters to download
      await expect(downloadModal.getByTestId('select-all-chapters')).toBeVisible();
      await expect(downloadModal.getByTestId('chapter-selection-list')).toBeVisible();
      
      const chapterCheckboxes = downloadModal.getByTestId('chapter-checkbox');
      expect(await chapterCheckboxes.count()).toBeGreaterThan(0);
      
      // Start download
      await downloadModal.getByTestId('start-download-button').click();
      
      // Download progress should be shown
      const progressIndicator = storyPage.page.getByTestId('download-progress');
      await expect(progressIndicator).toBeVisible();
      
      // Wait for download completion
      await expect(storyPage.page.getByText('Download completed')).toBeVisible();
      
      // Story should be marked as available offline
      const offlineIndicator = storyPage.page.getByTestId('offline-available-indicator');
      await expect(offlineIndicator).toBeVisible();
    });

    test('should work offline when network is unavailable', async () => {
      // This test will FAIL - offline functionality doesn't exist yet
      // First download a story for offline use
      await storyPage.navigateToStory(testStoryId);
      const downloadButton = storyPage.page.getByTestId('download-for-offline-button');
      await downloadButton.click();
      
      const downloadModal = storyPage.page.getByTestId('offline-download-modal');
      await downloadModal.getByTestId('select-all-chapters').click();
      await downloadModal.getByTestId('start-download-button').click();
      
      await expect(storyPage.page.getByText('Download completed')).toBeVisible();
      
      // Simulate offline mode
      await storyPage.page.context().setOffline(true);
      
      // Navigate to offline library
      await storyPage.page.goto('/library/offline');
      
      const offlineLibrary = storyPage.page.getByTestId('offline-library');
      await expect(offlineLibrary).toBeVisible();
      
      // Should show downloaded stories
      const offlineStories = offlineLibrary.getByTestId('offline-story-card');
      expect(await offlineStories.count()).toBeGreaterThan(0);
      
      // Should be able to read offline
      await offlineStories.first().click();
      
      await expect(storyPage.page.getByTestId('chapter-content')).toBeVisible();
      await expect(storyPage.page.getByTestId('offline-mode-indicator')).toBeVisible();
      
      // Navigation should work offline
      await storyPage.navigateToNextChapter();
      await expect(storyPage.page.getByTestId('chapter-content')).toBeVisible();
    });

    test('should sync reading progress when back online', async () => {
      // This test will FAIL - progress syncing doesn't exist yet
      // Start offline
      await storyPage.page.context().setOffline(true);
      await storyPage.page.goto('/library/offline');
      
      const offlineLibrary = storyPage.page.getByTestId('offline-library');
      const firstStory = offlineLibrary.getByTestId('offline-story-card').first();
      await firstStory.click();
      
      // Read some chapters offline
      await storyPage.navigateToNextChapter();
      await storyPage.navigateToNextChapter();
      
      const currentChapter = await storyPage.getCurrentChapterNumber();
      expect(currentChapter).toBe(3);
      
      // Go back online
      await storyPage.page.context().setOffline(false);
      
      // Should show sync notification
      const syncNotification = storyPage.page.getByTestId('progress-sync-notification');
      await expect(syncNotification).toBeVisible();
      await expect(syncNotification).toContainText('Syncing reading progress');
      
      // Wait for sync completion
      await expect(storyPage.page.getByText('Progress synced successfully')).toBeVisible();
      
      // Verify progress was synced
      await storyPage.page.reload();
      await storyPage.waitForStoryLoad();
      
      const syncedChapter = await storyPage.getCurrentChapterNumber();
      expect(syncedChapter).toBe(3);
    });

    test('should manage offline storage efficiently', async () => {
      // This test will FAIL - storage management doesn't exist yet
      await storyPage.page.goto('/settings/storage');
      
      const storageSettingsPage = storyPage.page.getByTestId('storage-settings-page');
      await expect(storageSettingsPage).toBeVisible();
      
      // Storage usage display
      await expect(storageSettingsPage.getByTestId('storage-usage-chart')).toBeVisible();
      await expect(storageSettingsPage.getByTestId('total-storage-used')).toBeVisible();
      await expect(storageSettingsPage.getByTestId('available-storage')).toBeVisible();
      
      // Downloaded content management
      await expect(storageSettingsPage.getByTestId('downloaded-stories-list')).toBeVisible();
      
      const downloadedStories = storageSettingsPage.getByTestId('downloaded-story-item');
      expect(await downloadedStories.count()).toBeGreaterThan(0);
      
      // Should show storage size for each story
      const firstStory = downloadedStories.first();
      await expect(firstStory.getByTestId('storage-size')).toBeVisible();
      await expect(firstStory.getByTestId('download-date')).toBeVisible();
      await expect(firstStory.getByTestId('last-read')).toBeVisible();
      
      // Should allow removing downloaded content
      await expect(firstStory.getByTestId('remove-download-button')).toBeVisible();
      
      // Storage cleanup options
      await expect(storageSettingsPage.getByTestId('auto-cleanup-toggle')).toBeVisible();
      await expect(storageSettingsPage.getByTestId('cleanup-after-days')).toBeVisible();
      await expect(storageSettingsPage.getByTestId('clear-all-downloads-button')).toBeVisible();
    });
  });

  test.describe('Advanced Reading Features', () => {
    test('should provide immersive reading mode', async () => {
      // This test will FAIL - immersive mode doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      
      const immersiveModeButton = storyPage.page.getByTestId('immersive-mode-button');
      await expect(immersiveModeButton).toBeVisible();
      
      await immersiveModeButton.click();
      
      // Should hide navigation and UI elements
      await expect(storyPage.page.getByTestId('sidebar')).not.toBeVisible();
      await expect(storyPage.page.getByTestId('header')).not.toBeVisible();
      
      // Content should be centered and optimized
      const immersiveContainer = storyPage.page.getByTestId('immersive-reading-container');
      await expect(immersiveContainer).toBeVisible();
      
      const chapterContent = immersiveContainer.getByTestId('chapter-content');
      const containerWidth = await immersiveContainer.evaluate(el => el.offsetWidth);
      const contentWidth = await chapterContent.evaluate(el => el.offsetWidth);
      
      // Content should be optimally sized for reading
      expect(contentWidth).toBeLessThan(containerWidth * 0.8);
      expect(contentWidth).toBeGreaterThan(400); // Minimum readable width
      
      // Exit immersive mode
      await storyPage.page.keyboard.press('Escape');
      await expect(storyPage.page.getByTestId('sidebar')).toBeVisible();
    });

    test('should provide reading time estimation and pacing', async () => {
      // This test will FAIL - reading time features don't exist yet
      await storyPage.navigateToStory(testStoryId);
      
      const chapterInfo = storyPage.page.getByTestId('chapter-info');
      await expect(chapterInfo.getByTestId('estimated-reading-time')).toBeVisible();
      await expect(chapterInfo.getByTestId('words-in-chapter')).toBeVisible();
      
      // Should show reading progress within chapter
      const progressBar = storyPage.page.getByTestId('chapter-progress-bar');
      await expect(progressBar).toBeVisible();
      
      // Should update as user scrolls
      const initialProgress = await progressBar.getAttribute('aria-valuenow');
      
      // Scroll down
      await storyPage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      
      const midProgress = await progressBar.getAttribute('aria-valuenow');
      expect(parseInt(midProgress!)).toBeGreaterThan(parseInt(initialProgress!));
      
      // Reading speed estimation
      const readingSpeedIndicator = storyPage.page.getByTestId('reading-speed-indicator');
      await expect(readingSpeedIndicator).toBeVisible();
      
      const speedText = await readingSpeedIndicator.textContent();
      expect(speedText).toMatch(/\d+ words per minute/);
    });

    test('should support text-to-speech functionality', async () => {
      // This test will FAIL - TTS doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      
      const ttsButton = storyPage.page.getByTestId('text-to-speech-button');
      await expect(ttsButton).toBeVisible();
      
      await ttsButton.click();
      
      const ttsControls = storyPage.page.getByTestId('tts-controls');
      await expect(ttsControls).toBeVisible();
      
      // TTS control buttons
      await expect(ttsControls.getByTestId('play-button')).toBeVisible();
      await expect(ttsControls.getByTestId('pause-button')).toBeVisible();
      await expect(ttsControls.getByTestId('stop-button')).toBeVisible();
      await expect(ttsControls.getByTestId('speed-control')).toBeVisible();
      await expect(ttsControls.getByTestId('voice-selection')).toBeVisible();
      
      // Should highlight currently spoken text
      await ttsControls.getByTestId('play-button').click();
      
      const highlightedText = storyPage.page.getByTestId('tts-highlighted-text');
      await expect(highlightedText).toBeVisible();
      
      // Speed control should work
      const speedSlider = ttsControls.getByTestId('speed-control');
      await speedSlider.fill('1.5');
      
      // Voice selection should have options
      const voiceSelect = ttsControls.getByTestId('voice-selection');
      await voiceSelect.click();
      
      const voiceOptions = storyPage.page.getByTestId('voice-option');
      expect(await voiceOptions.count()).toBeGreaterThan(1);
    });

    test('should provide chapter-based auto-bookmarking', async () => {
      // This test will FAIL - auto-bookmarking doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      
      // Read to a specific position
      await storyPage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));
      
      // Navigate to different chapter
      await storyPage.navigateToNextChapter();
      await storyPage.waitForChapterLoad();
      
      // Go back to previous chapter
      await storyPage.navigateToPreviousChapter();
      await storyPage.waitForChapterLoad();
      
      // Should automatically scroll to last reading position
      const scrollPosition = await storyPage.page.evaluate(() => window.pageYOffset);
      expect(scrollPosition).toBeGreaterThan(100); // Should not be at top
      
      // Should show bookmark indicator
      const bookmarkIndicator = storyPage.page.getByTestId('auto-bookmark-indicator');
      await expect(bookmarkIndicator).toBeVisible();
      
      // Manual bookmarking should also be available
      const manualBookmarkButton = storyPage.page.getByTestId('manual-bookmark-button');
      await expect(manualBookmarkButton).toBeVisible();
      
      await manualBookmarkButton.click();
      await expect(storyPage.page.getByText('Bookmark saved')).toBeVisible();
      
      // Should be able to navigate to bookmarks
      await storyPage.page.goto('/library/bookmarks');
      
      const bookmarksList = storyPage.page.getByTestId('bookmarks-list');
      await expect(bookmarksList).toBeVisible();
      
      const bookmarkItems = bookmarksList.getByTestId('bookmark-item');
      expect(await bookmarkItems.count()).toBeGreaterThan(0);
    });
  });
});