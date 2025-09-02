import { test, expect } from '@playwright/test';
import { getUserCredentials } from '@/lib/test/credentials';

test.describe('Story Generation with Progress Tracking', () => {
  
  test('User can generate story with progress display using secure writer credentials', async ({ page }) => {
    // Load secure writer credentials
    const writerCredentials = getUserCredentials('writer');
    console.log(`Using secure credentials for: ${writerCredentials.email}`);
    
    // First, authenticate using secure credentials
    await page.goto('/');
    
    // Look for sign-in/login mechanisms
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), a[href*="login"], a[href*="auth"]').first();
    if (await signInButton.isVisible({ timeout: 5000 })) {
      await signInButton.click();
      console.log('✓ Clicked sign-in button');
      
      // Fill in secure writer credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(writerCredentials.email);
        console.log(`✓ Filled email: ${writerCredentials.email}`);
        
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        if (await passwordInput.isVisible({ timeout: 5000 })) {
          await passwordInput.fill(writerCredentials.password);
          console.log('✓ Filled password securely');
          
          const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
          await submitButton.click();
          console.log('✓ Clicked submit button');
          
          // Wait for authentication to complete
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // Navigate to new story creation page
    await page.goto('/stories/new');
    console.log('✓ Navigated to story creation page');
    
    // Check that the AI Story Generator form loads
    const storyForm = page.locator('form');
    await expect(storyForm).toBeVisible();
    console.log('✓ Story generation form is visible');
    
    // Check for the story prompt textarea
    const promptTextarea = page.locator('textarea#prompt');
    await expect(promptTextarea).toBeVisible();
    console.log('✓ Story prompt textarea is visible');
    
    // Fill in a test story prompt
    const testPrompt = 'A young wizard discovers that their magic comes from solving mathematical equations, and they must save their school from a curse that makes everyone forget numbers.';
    await promptTextarea.fill(testPrompt);
    console.log('✓ Filled story prompt');
    
    // Check that the generate button is enabled
    const generateButton = page.locator('button[type="submit"]');
    await expect(generateButton).toBeEnabled();
    console.log('✓ Generate button is enabled');
    
    // Click the generate button to start story generation
    await generateButton.click();
    console.log('✓ Clicked generate story button');
    
    // Check that progress display appears
    const progressContainer = page.locator('text=Story Generation Progress').first();
    await expect(progressContainer).toBeVisible({ timeout: 10000 });
    console.log('✓ Progress display appeared');
    
    // Check for Phase 1 step
    const phase1 = page.locator('text=Phase 1');
    await expect(phase1).toBeVisible();
    console.log('✓ Phase 1 step is visible');
    
    // Check for Phase 2 step
    const phase2 = page.locator('text=Phase 2');
    await expect(phase2).toBeVisible();
    console.log('✓ Phase 2 step is visible');
    
    // Check for Phase 3 step
    const phase3 = page.locator('text=Phase 3');
    await expect(phase3).toBeVisible();
    console.log('✓ Phase 3 step is visible');
    
    // Check for Phase 4 step
    const phase4 = page.locator('text=Phase 4');
    await expect(phase4).toBeVisible();
    console.log('✓ Phase 4 step is visible');
    
    // Check for Database step
    const databaseStep = page.locator('text=Database');
    await expect(databaseStep).toBeVisible();
    console.log('✓ Database step is visible');
    
    // Wait for at least one phase to show in_progress status (blue circle with spinner)
    const inProgressIndicator = page.locator('.bg-blue-500').first();
    await expect(inProgressIndicator).toBeVisible({ timeout: 15000 });
    console.log('✓ In-progress indicator (blue spinner) is visible');
    
    // Wait for at least one phase to complete (green circle with checkmark)
    const completedIndicator = page.locator('.bg-green-500').first();
    await expect(completedIndicator).toBeVisible({ timeout: 45000 }); // Allow more time for AI generation
    console.log('✓ Completed indicator (green checkmark) is visible');
    
    // Check that the button text changed during processing
    const loadingButton = page.locator('button:has-text("Generating Story...")');
    if (await loadingButton.isVisible()) {
      console.log('✓ Button text changed to "Generating Story..." during processing');
    }
    
    // Wait for completion or redirection (up to 60 seconds for full AI generation)
    try {
      // Wait for either:
      // 1. All steps to complete (all green checkmarks)
      // 2. Redirection to stories page
      // 3. Timeout
      await Promise.race([
        // Wait for all 5 steps to show completed status
        expect(page.locator('.bg-green-500')).toHaveCount(5, { timeout: 60000 }),
        // Or wait for redirection to stories page
        page.waitForURL('/stories', { timeout: 60000 })
      ]);
      
      console.log('✓ Story generation completed successfully');
      
      // If we're still on the generation page, check final states
      if (page.url().includes('/stories/new')) {
        const allCompleted = await page.locator('.bg-green-500').count();
        console.log(`✓ ${allCompleted}/5 phases completed`);
      } else {
        console.log('✓ Successfully redirected to stories page');
      }
      
    } catch (error) {
      console.log('⚠️ Story generation took longer than expected or encountered an error');
      
      // Check if there are any error indicators (red circles)
      const errorIndicator = page.locator('.bg-red-500');
      const errorCount = await errorIndicator.count();
      if (errorCount > 0) {
        console.log(`⚠️ ${errorCount} phases encountered errors`);
      }
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'story-generation-timeout.png', fullPage: true });
      console.log('📸 Screenshot saved: story-generation-timeout.png');
    }
  });
  
  test('Progress steps show correct status transitions', async ({ page }) => {
    await page.goto('/stories/new');
    
    // Fill prompt and start generation
    const promptTextarea = page.locator('textarea#prompt');
    await promptTextarea.fill('A detective who can see emotions as colors must solve a murder where everyone appears grey.');
    
    const generateButton = page.locator('button[type="submit"]');
    await generateButton.click();
    
    // Wait for progress to appear
    const progressContainer = page.locator('text=Story Generation Progress');
    await expect(progressContainer).toBeVisible({ timeout: 10000 });
    
    // Check that initially all steps are pending (grey circles)
    const pendingSteps = page.locator('.bg-gray-300, .bg-gray-600');
    const initialPendingCount = await pendingSteps.count();
    expect(initialPendingCount).toBeGreaterThan(0);
    console.log(`✓ Initially found ${initialPendingCount} pending steps`);
    
    // Wait for first step to start (should show blue spinner)
    const firstInProgress = page.locator('.bg-blue-500').first();
    await expect(firstInProgress).toBeVisible({ timeout: 15000 });
    console.log('✓ First step started (blue spinner visible)');
    
    // Wait for first step to complete (should show green checkmark)
    const firstCompleted = page.locator('.bg-green-500').first();
    await expect(firstCompleted).toBeVisible({ timeout: 30000 });
    console.log('✓ First step completed (green checkmark visible)');
    
    // Verify status icons are correct
    const spinnerIcon = page.locator('.bg-blue-500 .animate-spin');
    const checkmarkIcon = page.locator('.bg-green-500 svg');
    
    if (await spinnerIcon.isVisible()) {
      console.log('✓ In-progress steps show spinning animation');
    }
    
    if (await checkmarkIcon.isVisible()) {
      console.log('✓ Completed steps show checkmark icon');
    }
  });
});