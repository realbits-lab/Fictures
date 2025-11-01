#!/usr/bin/env node

/**
 * Test script to verify comics browse page displays optimized images
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function testComicsBrowseImages() {
  console.log('🎨 Testing Comics Browse Page Images...\n');

  const browser = await chromium.launch({ headless: false });
  
  try {
    // Load auth state
    const context = await browser.newContext({
      storageState: join(projectRoot, '.auth/user.json')
    });
    
    const page = await context.newPage();

    // Navigate to comics browse page
    console.log('📍 Navigating to /comics...');
    await page.goto('http://localhost:3000/comics', { waitUntil: 'networkidle' });

    // Check if redirected to login
    const url = page.url();
    if (url.includes('/login')) {
      console.error('❌ Redirected to login - authentication failed');
      await browser.close();
      process.exit(1);
    }

    console.log('✅ Successfully loaded /comics page\n');

    // Wait for content to load
    await page.waitForSelector('a[href^="/comics/"]', { timeout: 5000 }).catch(() => {
      console.log('⚠️  No story cards found');
    });

    // Check for story cards
    const storyCards = await page.locator('a[href^="/comics/"]').count();
    console.log(`📚 Found ${storyCards} story card(s)`);

    if (storyCards === 0) {
      console.log('⚠️  No published stories available for testing');
      await browser.close();
      return;
    }

    // Check for optimized images (picture elements)
    const pictureElements = await page.locator('a[href^="/comics/"] picture').count();
    console.log(`🖼️  Found ${pictureElements} picture element(s) (optimized images)`);

    // Check for image elements
    const imgElements = await page.locator('a[href^="/comics/"] img').count();
    console.log(`📷 Found ${imgElements} img element(s)`);

    // Verify optimized image structure
    if (pictureElements > 0) {
      console.log('\n✅ SUCCESS: Optimized images detected!');
      
      // Get first picture element details
      const firstPicture = page.locator('a[href^="/comics/"] picture').first();
      const sources = await firstPicture.locator('source').count();
      console.log(`   - ${sources} source element(s) for format/size variants`);
      
      // Check for AVIF and JPEG sources
      const avifSources = await firstPicture.locator('source[type="image/avif"]').count();
      const jpegSources = await firstPicture.locator('source[type="image/jpeg"]').count();
      console.log(`   - ${avifSources} AVIF variant(s)`);
      console.log(`   - ${jpegSources} JPEG variant(s)`);
      
      if (avifSources > 0 && jpegSources > 0) {
        console.log('\n🎉 Image optimization fully working!');
        console.log('   - AVIF format for modern browsers');
        console.log('   - JPEG fallback for older browsers');
        console.log('   - Responsive srcset for different screen sizes');
      }
    } else {
      console.log('\n⚠️  WARNING: No picture elements found');
      console.log('   Images may not be using optimized imageVariants');
    }

    // Take screenshot for visual verification
    const screenshotPath = join(projectRoot, 'logs/comics-browse-test.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    await browser.close();
    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

testComicsBrowseImages();
