import { test, expect } from '@playwright/test';

test.describe('Scene Scroll Position Restoration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reading page
    await page.goto('http://localhost:3000/read/Q185oK6qjmlmhDKNGpjGS');

    // Wait for the page to load and scenes to be available
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow time for scene loading
  });

  test('should save and restore scroll position when switching scenes', async ({ page }) => {
    console.log('🧪 Testing scroll position restoration...');

    // Wait for scenes to load in sidebar
    await page.waitForSelector('text=Scene', { timeout: 10000 });

    // Find all scene buttons in the sidebar
    const sceneButtons = await page.locator('button:has-text("Scene")').all();
    console.log(`📝 Found ${sceneButtons.length} scene buttons`);

    if (sceneButtons.length < 2) {
      console.log('⚠️ Not enough scenes to test scroll restoration');
      return;
    }

    // Click on the first scene
    console.log('🎬 Clicking first scene...');
    await sceneButtons[0].click();
    await page.waitForTimeout(1000);

    // Get the main content area
    const mainContent = page.locator('[ref="mainContentRef"]').first();
    if (await mainContent.count() === 0) {
      // Try alternative selector
      const altMainContent = page.locator('.flex-1.h-full.overflow-y-auto').first();
      console.log('📖 Using alternative main content selector');
      await expect(altMainContent).toBeVisible();
    }

    // Scroll down in the first scene
    const scrollDistance = 500;
    console.log(`📜 Scrolling down ${scrollDistance}px in first scene...`);
    await page.evaluate((distance) => {
      const mainContentEl = document.querySelector('.flex-1.h-full.overflow-y-auto');
      if (mainContentEl) {
        mainContentEl.scrollTop = distance;
        console.log(`Scrolled to position: ${mainContentEl.scrollTop}`);
      }
    }, scrollDistance);

    // Wait for scroll to settle
    await page.waitForTimeout(500);

    // Get the current scroll position
    const firstSceneScrollPosition = await page.evaluate(() => {
      const mainContentEl = document.querySelector('.flex-1.h-full.overflow-y-auto');
      return mainContentEl ? mainContentEl.scrollTop : 0;
    });

    console.log(`📍 First scene scroll position: ${firstSceneScrollPosition}`);

    // Click on the second scene
    console.log('🎬 Clicking second scene...');
    await sceneButtons[1].click();
    await page.waitForTimeout(1000);

    // Verify we're on a different scene (scroll should be at top)
    const secondSceneScrollPosition = await page.evaluate(() => {
      const mainContentEl = document.querySelector('.flex-1.h-full.overflow-y-auto');
      return mainContentEl ? mainContentEl.scrollTop : 0;
    });

    console.log(`📍 Second scene scroll position: ${secondSceneScrollPosition}`);

    // Scroll down in the second scene too
    console.log(`📜 Scrolling down ${scrollDistance * 2}px in second scene...`);
    await page.evaluate((distance) => {
      const mainContentEl = document.querySelector('.flex-1.h-full.overflow-y-auto');
      if (mainContentEl) {
        mainContentEl.scrollTop = distance;
      }
    }, scrollDistance * 2);

    await page.waitForTimeout(500);

    // Go back to the first scene
    console.log('🔙 Going back to first scene...');
    await sceneButtons[0].click();
    await page.waitForTimeout(1000);

    // Check if scroll position was restored
    const restoredScrollPosition = await page.evaluate(() => {
      const mainContentEl = document.querySelector('.flex-1.h-full.overflow-y-auto');
      return mainContentEl ? mainContentEl.scrollTop : 0;
    });

    console.log(`📍 Restored scroll position: ${restoredScrollPosition}`);
    console.log(`📍 Expected scroll position: ${firstSceneScrollPosition}`);

    // Check localStorage for saved position
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(key => key.includes('fictures_scene_scroll'));
      const data: any = {};
      keys.forEach(key => {
        data[key] = localStorage.getItem(key);
      });
      return data;
    });

    console.log('💾 localStorage scroll data:', localStorageData);

    // Verify the scroll position was restored (allowing for small differences)
    const positionDifference = Math.abs(restoredScrollPosition - firstSceneScrollPosition);
    console.log(`📏 Position difference: ${positionDifference}px`);

    if (positionDifference <= 5) {
      console.log('✅ Scroll position restoration working correctly!');
    } else {
      console.log('❌ Scroll position restoration failed!');
      console.log(`Expected: ~${firstSceneScrollPosition}px, Got: ${restoredScrollPosition}px`);
    }

    // The test should pass if position difference is small
    expect(positionDifference).toBeLessThanOrEqual(5);
  });

  test('should handle localStorage errors gracefully', async ({ page }) => {
    console.log('🧪 Testing localStorage error handling...');

    // Disable localStorage to test error handling
    await page.addInitScript(() => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem;
      const originalGetItem = localStorage.getItem;

      localStorage.setItem = () => {
        throw new Error('localStorage disabled');
      };

      localStorage.getItem = () => {
        throw new Error('localStorage disabled');
      };
    });

    // Navigate to the page
    await page.goto('http://localhost:3000/read/Q185oK6qjmlmhDKNGpjGS');
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });

    // Check that the page still functions without localStorage
    const sceneButtons = await page.locator('button:has-text("Scene")').all();
    if (sceneButtons.length > 0) {
      await sceneButtons[0].click();
      await page.waitForTimeout(1000);
      console.log('✅ Page functions correctly without localStorage');
    }
  });
});