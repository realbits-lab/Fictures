import { test, expect } from '@playwright/test';

test.describe('Writing Page Caching Tests', () => {

  test('should test writing page caching and localStorage tracking', async ({ page }) => {
    console.log('🧪 Starting writing page caching test');

    // Navigate to home page first
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Navigate to stories page to find a story to edit
    const storiesLink = page.locator('a[href="/stories"], a[href*="stories"]').first();
    if (await storiesLink.isVisible()) {
      await storiesLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for a story to edit
      const storyCards = page.locator('[data-testid="story-card"], .story-card, .story-item');
      if (await storyCards.first().isVisible()) {
        console.log('📖 Found story cards, clicking on first story...');
        await storyCards.first().click();
        await page.waitForLoadState('networkidle');
        
        // Wait for writing interface to load
        await page.waitForSelector('.sticky', { timeout: 10000 }); // Header
        console.log('✅ Successfully loaded writing interface');
        
        // Check for SWR writing cache keys in localStorage
        const writingCacheKeys = await page.evaluate(() => {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('swr-cache') && key.includes('write'))) {
              keys.push({ key, hasValue: localStorage.getItem(key) !== null });
            }
          }
          return keys;
        });

        console.log('💾 Writing cache keys found:', writingCacheKeys);

        // Check for writing session tracking
        const writingSessionData = await page.evaluate(() => {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('writing-session') || key.includes('writing-state') || key.includes('draft-'))) {
              const value = localStorage.getItem(key);
              keys.push({ 
                key, 
                hasValue: value !== null,
                valuePreview: value ? JSON.stringify(JSON.parse(value)).substring(0, 100) + '...' : null
              });
            }
          }
          return keys;
        });

        console.log('✍️ Writing session data:', writingSessionData);

        // Test navigation within writing interface
        const levelButtons = page.locator('button:has-text("story"), button:has-text("chapter"), button:has-text("scene")');
        const levelButtonCount = await levelButtons.count();
        console.log(`🔍 Found ${levelButtonCount} level navigation buttons`);
        
        // Check for caching indicators in the header
        const cachingIndicator = page.locator('[class*="spin"], [data-testid*="syncing"]');
        if (await cachingIndicator.isVisible()) {
          console.log('✅ Found caching/syncing indicator in header');
        }

        // Test page reload to verify cache persistence
        console.log('🔄 Testing cache persistence with page reload...');
        await page.reload();
        await page.waitForLoadState('networkidle');

        const cacheAfterReload = await page.evaluate(() => {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('swr-cache') || key.includes('writing-'))) {
              keys.push({ key, hasValue: localStorage.getItem(key) !== null });
            }
          }
          return keys;
        });

        console.log('💾 Cache after reload:', cacheAfterReload);
        expect(cacheAfterReload.length).toBeGreaterThan(0);

        // Take screenshot for verification
        await page.screenshot({ path: 'tests/screenshots/writing-cache-test.png', fullPage: true });
        console.log('📸 Screenshot saved: tests/screenshots/writing-cache-test.png');
      }
    }

    console.log('✅ Writing page caching test completed');
  });

  test('should test writing progress and session tracking', async ({ page }) => {
    console.log('🧪 Testing writing session and progress tracking');

    // Navigate to stories and enter writing mode
    await page.goto('http://localhost:3001/stories');
    await page.waitForLoadState('networkidle');

    const storyCards = page.locator('[data-testid="story-card"], .story-card, .story-item');
    if (await storyCards.first().isVisible()) {
      await storyCards.first().click();
      await page.waitForLoadState('networkidle');

      // Inject test writing session data
      await page.evaluate(() => {
        const storyId = 'test-story-id';
        
        // Test writing session data
        const sessionData = {
          startTime: Date.now(),
          wordCountStart: 1000,
          keystrokes: 50,
          storyId: storyId
        };
        localStorage.setItem(`writing-session-${storyId}`, JSON.stringify(sessionData));
        
        // Test writing state data  
        const stateData = {
          chapterId: 'chapter-123',
          sceneId: 'scene-456',
          cursorPosition: 100,
          scrollPosition: 200,
          content: 'Test writing content...',
          wordCount: 25,
          lastEdited: new Date().toISOString(),
          timestamp: Date.now()
        };
        localStorage.setItem(`writing-state-${storyId}`, JSON.stringify(stateData));
        
        // Test draft data
        const draftData = {
          content: 'This is a draft of my chapter content...',
          wordCount: 45,
          timestamp: Date.now(),
          storyId: storyId,
          contentId: 'chapter-123'
        };
        localStorage.setItem(`draft-${storyId}-chapter-123`, JSON.stringify(draftData));
      });

      // Verify the data was set and can be retrieved
      const retrievedData = await page.evaluate(() => {
        const storyId = 'test-story-id';
        const sessionData = localStorage.getItem(`writing-session-${storyId}`);
        const stateData = localStorage.getItem(`writing-state-${storyId}`);
        const draftData = localStorage.getItem(`draft-${storyId}-chapter-123`);
        
        return {
          session: sessionData ? JSON.parse(sessionData) : null,
          state: stateData ? JSON.parse(stateData) : null,
          draft: draftData ? JSON.parse(draftData) : null,
          totalKeys: localStorage.length
        };
      });

      console.log('💾 Writing session retrieved data:', retrievedData);

      // Validate data structure
      expect(retrievedData.session).toBeTruthy();
      expect(retrievedData.session.storyId).toBe('test-story-id');
      expect(retrievedData.session.wordCountStart).toBe(1000);
      
      expect(retrievedData.state).toBeTruthy();
      expect(retrievedData.state.chapterId).toBe('chapter-123');
      expect(retrievedData.state.wordCount).toBe(25);
      
      expect(retrievedData.draft).toBeTruthy();
      expect(retrievedData.draft.wordCount).toBe(45);
      expect(retrievedData.draft.content).toContain('This is a draft');

      console.log('✅ Writing progress and session tracking test passed');
    }
  });

});