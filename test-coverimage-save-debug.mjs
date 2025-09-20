import { chromium } from 'playwright';

console.log('🧪 Testing coverImage save persistence with browser session...');

async function testCoverImagePersistence() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  try {
    // Navigate to story
    console.log('📖 Navigating to story...');
    await page.goto('http://localhost:3000/write/_ji5WFr8lQe8b7eTfrck-');
    await page.waitForTimeout(3000);

    // Input test prompt for image generation
    console.log('🎨 Requesting image generation...');
    await page.fill('[data-testid="prompt-input"]', 'Generate test cover image for the story');
    await page.click('[data-testid="apply-changes-button"]');
    
    // Wait for completion
    await page.waitForTimeout(8000);
    
    // Check if Save Image button appears
    const saveImageButton = await page.locator('button:has-text("Save Image")').isVisible();
    console.log('💾 Save Image button visible:', saveImageButton);
    
    if (saveImageButton) {
      // Click Save Image
      await page.click('button:has-text("Save Image")');
      await page.waitForTimeout(2000);
      
      // Click Save Changes
      const saveChangesButton = await page.locator('button:has-text("💾 Save Changes")').isVisible();
      console.log('💾 Save Changes button visible:', saveChangesButton);
      
      if (saveChangesButton) {
        await page.click('button:has-text("💾 Save Changes")');
        await page.waitForTimeout(3000);
        console.log('✅ Save operation completed');
        
        // Navigate away and back to test persistence
        console.log('🔄 Testing persistence by navigating away and back...');
        await page.goto('http://localhost:3000/stories');
        await page.waitForTimeout(2000);
        
        await page.click('button:has-text("📝 Write")');
        await page.waitForTimeout(3000);
        
        // Check properties count
        const propertiesText = await page.textContent('text=Story YAML Data');
        console.log('📊 Properties after reload:', propertiesText);
        
        // Check console for any logs about story data
        const logs = [];
        page.on('console', msg => {
          if (msg.text().includes('story') || msg.text().includes('coverImage')) {
            logs.push(msg.text());
          }
        });
        
        await page.waitForTimeout(2000);
        console.log('📝 Relevant console logs:', logs);
        
      } else {
        console.log('❌ Save Changes button not found');
      }
    } else {
      console.log('❌ Save Image button not found');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testCoverImagePersistence();
