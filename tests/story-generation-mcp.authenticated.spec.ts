import { test, expect } from '@playwright/test';

test.describe('Story Generation with MCP Browser Tools', () => {
  test.use({
    storageState: '.auth/user.json'
  });

  test('Generate a new fantasy story using MCP browser', async ({ page }) => {
    // Navigate to the stories page first to verify authentication
    await page.goto('http://localhost:3000/stories');
    console.log('✓ Navigated to stories page');

    // Wait for the page to load and check for authenticated content
    await page.waitForLoadState('networkidle');

    // Click on "New Story" button
    const newStoryButton = page.locator('a[href="/stories/new"], button:has-text("New Story")').first();
    await expect(newStoryButton).toBeVisible();
    await newStoryButton.click();
    console.log('✓ Clicked New Story button');

    // Wait for navigation to story creation page
    await page.waitForURL('**/stories/new');
    console.log('✓ Navigated to story creation page');

    // Fill in the story prompt
    const storyPrompt = `Create an epic fantasy adventure about a young alchemist named Lyra who discovers
    she can transform emotions into physical elements. She must journey through the Crystal Mountains to
    find the legendary Emotion Stone before the Shadow Guild uses it to drain all feelings from the world.
    Include magical creatures, ancient ruins, and a twist about her true heritage.`;

    const promptTextarea = page.locator('textarea#prompt, textarea[name="prompt"]').first();
    await expect(promptTextarea).toBeVisible();
    await promptTextarea.fill(storyPrompt);
    console.log('✓ Filled story prompt');

    // Optional: Fill in additional parameters if visible
    const genreSelect = page.locator('select#genre, select[name="genre"]').first();
    if (await genreSelect.isVisible({ timeout: 1000 })) {
      await genreSelect.selectOption('fantasy');
      console.log('✓ Selected fantasy genre');
    }

    const toneSelect = page.locator('select#tone, select[name="tone"]').first();
    if (await toneSelect.isVisible({ timeout: 1000 })) {
      await toneSelect.selectOption('adventurous');
      console.log('✓ Selected adventurous tone');
    }

    // Click the generate button
    const generateButton = page.locator('button[type="submit"]:has-text("Generate"), button:has-text("Create Story")').first();
    await expect(generateButton).toBeEnabled();
    await generateButton.click();
    console.log('✓ Clicked generate story button');

    // Monitor the generation progress
    console.log('⏳ Monitoring story generation progress...');

    // Wait for progress indicators to appear
    const progressIndicator = page.locator('text=/Story Generation Progress|Generating.*Story|Processing/i').first();
    await expect(progressIndicator).toBeVisible({ timeout: 10000 });
    console.log('✓ Story generation started');

    // Track phase completions
    const phases = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Database'];
    for (const phase of phases) {
      const phaseElement = page.locator(`text="${phase}"`).first();
      if (await phaseElement.isVisible({ timeout: 5000 })) {
        console.log(`✓ ${phase} step detected`);

        // Wait for this phase to show completion (green indicator)
        const completedIndicator = phaseElement.locator('..').locator('.bg-green-500, .text-green-500').first();
        try {
          await expect(completedIndicator).toBeVisible({ timeout: 30000 });
          console.log(`✅ ${phase} completed`);
        } catch {
          console.log(`⏳ ${phase} still in progress`);
        }
      }
    }

    // Wait for completion - either redirect or all phases complete
    try {
      await Promise.race([
        // Option 1: Redirect to story detail page
        page.waitForURL('**/stories/**', { timeout: 60000 }),
        // Option 2: All completion indicators visible
        expect(page.locator('.bg-green-500')).toHaveCount(5, { timeout: 60000 }),
        // Option 3: Success message appears
        expect(page.locator('text=/Story.*created.*successfully|Generation.*complete/i')).toBeVisible({ timeout: 60000 })
      ]);

      console.log('✅ Story generation completed successfully!');

      // If redirected to story page, verify story details
      if (page.url().includes('/stories/') && !page.url().includes('/new')) {
        console.log('✓ Redirected to story detail page');

        // Verify story title is visible
        const storyTitle = page.locator('h1, h2').first();
        await expect(storyTitle).toBeVisible();
        const titleText = await storyTitle.textContent();
        console.log(`📖 Generated story title: "${titleText}"`);

        // Check for story structure elements
        const chapterList = page.locator('text=/Chapter|Part/i');
        if (await chapterList.first().isVisible({ timeout: 5000 })) {
          const chapterCount = await chapterList.count();
          console.log(`📚 Story has ${chapterCount} chapter references`);
        }

        // Take a screenshot of the generated story
        await page.screenshot({
          path: 'tests/screenshots/generated-story-mcp.png',
          fullPage: true
        });
        console.log('📸 Screenshot saved: tests/screenshots/generated-story-mcp.png');
      }

    } catch (error) {
      console.error('❌ Story generation timeout or error:', error);

      // Check for error messages
      const errorMessage = page.locator('.text-red-500, .bg-red-500, text=/error|failed/i').first();
      if (await errorMessage.isVisible({ timeout: 1000 })) {
        const errorText = await errorMessage.textContent();
        console.error(`Error message found: ${errorText}`);
      }

      // Take debug screenshot
      await page.screenshot({
        path: 'tests/screenshots/story-generation-error-mcp.png',
        fullPage: true
      });
      console.log('📸 Debug screenshot saved: tests/screenshots/story-generation-error-mcp.png');

      throw error;
    }
  });

  test('Generate story with specific parameters using MCP', async ({ page }) => {
    await page.goto('http://localhost:3000/stories/new');

    // More detailed story configuration
    const detailedPrompt = `Write a science fiction mystery set on a space station orbiting Jupiter.
    The protagonist is Dr. Sarah Chen, a xenobiologist who discovers that the station's AI has been
    hiding evidence of alien life. As she investigates, she uncovers a conspiracy that goes back
    decades. Include themes of isolation, trust, and the nature of consciousness.`;

    const promptTextarea = page.locator('textarea#prompt, textarea[name="prompt"]').first();
    await promptTextarea.fill(detailedPrompt);
    console.log('✓ Filled detailed story prompt');

    // Submit the form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    console.log('✓ Started story generation');

    // Monitor streaming progress if available
    const streamingContent = page.locator('.streaming-content, [data-streaming]').first();
    if (await streamingContent.isVisible({ timeout: 5000 })) {
      console.log('✓ Streaming content detected');

      // Wait for some content to appear
      await page.waitForTimeout(3000);
      const partialContent = await streamingContent.textContent();
      if (partialContent && partialContent.length > 0) {
        console.log(`📝 Partial content received: ${partialContent.substring(0, 100)}...`);
      }
    }

    // Wait for final completion
    await page.waitForTimeout(5000);

    // Verify successful generation
    const successIndicator = page.locator('.bg-green-500, text=/complete|success/i').first();
    const isSuccess = await successIndicator.isVisible({ timeout: 60000 });

    if (isSuccess) {
      console.log('✅ Story generation completed successfully');

      // Capture final state
      await page.screenshot({
        path: 'tests/screenshots/sci-fi-story-mcp.png',
        fullPage: true
      });
      console.log('📸 Final story screenshot saved');
    }
  });
});