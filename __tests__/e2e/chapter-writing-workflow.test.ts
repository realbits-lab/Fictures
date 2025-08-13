import { test, expect } from '@playwright/test';

test.describe('Chapter Writing Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chapter writing page
    await page.goto('/stories/test-story-id/chapters/1/write');
    
    // Wait for page to load
    await expect(page).toHaveTitle(/Chapter 1 - Write/);
  });

  test.describe('Initial page load', () => {
    test('should display chapter writing interface', async ({ page }) => {
      // Check that both panels are visible
      await expect(page.locator('[data-testid="chapter-chat-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="chapter-viewer-panel"]')).toBeVisible();
      
      // Check that the chapter number is displayed
      await expect(page.locator('h1')).toContainText('Chapter 1');
      
      // Check that prompt input is focused
      await expect(page.locator('[data-testid="prompt-textarea"]')).toBeFocused();
    });

    test('should load story context', async ({ page }) => {
      // Wait for context to load
      await expect(page.locator('[data-testid="story-context"]')).toBeVisible();
      
      // Should show story title
      await expect(page.locator('[data-testid="story-title"]')).toContainText('Test Story');
      
      // Should indicate this is the first chapter
      await expect(page.locator('[data-testid="chapter-status"]')).toContainText('First chapter');
    });

    test('should show appropriate prompt suggestions for chapter 1', async ({ page }) => {
      // Should display opening chapter suggestions
      await expect(page.locator('[data-testid="prompt-suggestions"]')).toBeVisible();
      await expect(page.locator('[data-testid="prompt-suggestions"]')).toContainText('opening');
      await expect(page.locator('[data-testid="prompt-suggestions"]')).toContainText('introduce');
    });
  });

  test.describe('Chapter generation workflow', () => {
    test('should generate chapter content from prompt', async ({ page }) => {
      // Enter a prompt
      const prompt = 'Write an exciting opening chapter that introduces the main character in a fantasy setting.';
      await page.fill('[data-testid="prompt-textarea"]', prompt);
      
      // Submit the prompt
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Should show generating state
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="submit-prompt-button"]')).toBeDisabled();
      
      // Wait for generation to complete
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 30000 });
      
      // Should display generated content
      await expect(page.locator('[data-testid="chapter-content"]')).not.toBeEmpty();
      
      // Should show word count
      const wordCount = page.locator('[data-testid="word-count"]');
      await expect(wordCount).toBeVisible();
      await expect(wordCount).toContainText(/\d+ words/);
      
      // Prompt input should be cleared
      await expect(page.locator('[data-testid="prompt-textarea"]')).toHaveValue('');
    });

    test('should show generation progress with streaming', async ({ page }) => {
      await page.fill('[data-testid="prompt-textarea"]', 'Write a short opening paragraph.');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Should show streaming indicator
      await expect(page.locator('[data-testid="streaming-dots"]')).toBeVisible();
      
      // Content should appear progressively
      const contentArea = page.locator('[data-testid="chapter-content"]');
      
      // Wait for first content to appear
      await expect(contentArea).not.toBeEmpty({ timeout: 5000 });
      
      // Check that content is being streamed (length increasing)
      const initialLength = (await contentArea.textContent())?.length || 0;
      
      // Wait a bit and check if more content has appeared
      await page.waitForTimeout(2000);
      const finalLength = (await contentArea.textContent())?.length || 0;
      
      expect(finalLength).toBeGreaterThanOrEqual(initialLength);
    });

    test('should handle generation cancellation', async ({ page }) => {
      await page.fill('[data-testid="prompt-textarea"]', 'Write a very long detailed chapter.');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Wait for generation to start
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
      
      // Cancel generation using Escape key
      await page.keyboard.press('Escape');
      
      // Should show cancelled state
      await expect(page.locator('[data-testid="generation-cancelled"]')).toBeVisible();
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden();
      
      // Should be able to start new generation
      await expect(page.locator('[data-testid="submit-prompt-button"]')).toBeEnabled();
    });

    test('should handle generation errors gracefully', async ({ page }) => {
      // Mock API to return an error
      await page.route('/api/chapters/generate', async route => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'AI service unavailable' })
        });
      });
      
      await page.fill('[data-testid="prompt-textarea"]', 'Test prompt');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="generation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="generation-error"]')).toContainText('AI service unavailable');
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-generation-button"]')).toBeVisible();
    });
  });

  test.describe('Content editing workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Generate some initial content
      await page.fill('[data-testid="prompt-textarea"]', 'Write a brief opening.');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
    });

    test('should switch to edit mode', async ({ page }) => {
      // Click edit button
      await page.click('[data-testid="edit-chapter-button"]');
      
      // Should show editor interface
      await expect(page.locator('[data-testid="content-editor"]')).toBeVisible();
      await expect(page.locator('[data-testid="formatting-toolbar"]')).toBeVisible();
      
      // Content should be editable
      const editor = page.locator('[data-testid="content-editor"]');
      await expect(editor).toBeEditable();
      
      // Should show edit mode indicator
      await expect(page.locator('[data-testid="edit-mode-indicator"]')).toBeVisible();
    });

    test('should edit content and show unsaved changes', async ({ page }) => {
      await page.click('[data-testid="edit-chapter-button"]');
      
      const editor = page.locator('[data-testid="content-editor"]');
      
      // Modify content
      await editor.fill('<p>This is the edited chapter content with new text.</p>');
      
      // Should show unsaved changes indicator
      await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-chapter-button"]')).toBeEnabled();
      
      // Word count should update
      await expect(page.locator('[data-testid="word-count"]')).toContainText('10 words');
    });

    test('should apply text formatting', async ({ page }) => {
      await page.click('[data-testid="edit-chapter-button"]');
      
      const editor = page.locator('[data-testid="content-editor"]');
      await editor.fill('This is sample text for formatting.');
      
      // Select some text
      await page.keyboard.press('Control+a'); // Select all
      
      // Apply bold formatting
      await page.click('[data-testid="bold-button"]');
      
      // Text should be bold
      const content = await editor.innerHTML();
      expect(content).toContain('<strong>');
    });

    test('should save edited content', async ({ page }) => {
      await page.click('[data-testid="edit-chapter-button"]');
      
      const editor = page.locator('[data-testid="content-editor"]');
      const newContent = '<p>This is the saved chapter content.</p>';
      await editor.fill(newContent);
      
      // Save using button
      await page.click('[data-testid="save-chapter-button"]');
      
      // Should show saving indicator
      await expect(page.locator('[data-testid="saving-indicator"]')).toBeVisible();
      
      // Wait for save to complete
      await expect(page.locator('[data-testid="saving-indicator"]')).toBeHidden();
      
      // Should show saved status
      await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
      
      // Should no longer show unsaved changes
      await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeHidden();
      
      // Content should persist when switching modes
      await page.click('[data-testid="preview-mode-button"]');
      await expect(page.locator('[data-testid="chapter-content"]')).toContainText('This is the saved chapter content.');
    });

    test('should auto-save content', async ({ page }) => {
      // Enable auto-save
      await page.click('[data-testid="auto-save-toggle"]');
      
      await page.click('[data-testid="edit-chapter-button"]');
      
      const editor = page.locator('[data-testid="content-editor"]');
      await editor.fill('<p>Auto-saved content.</p>');
      
      // Wait for auto-save delay
      await page.waitForTimeout(2000);
      
      // Should show auto-saved indicator
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('Auto-saved');
    });
  });

  test.describe('Keyboard shortcuts', () => {
    test('should save with Ctrl+S', async ({ page }) => {
      await page.fill('[data-testid="prompt-textarea"]', 'Test content');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      
      // Use keyboard shortcut to save
      await page.keyboard.press('Control+s');
      
      // Should trigger save
      await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
    });

    test('should focus prompt input with Ctrl+G', async ({ page }) => {
      // Click elsewhere to lose focus
      await page.click('[data-testid="chapter-viewer-panel"]');
      
      // Use keyboard shortcut
      await page.keyboard.press('Control+g');
      
      // Prompt input should be focused
      await expect(page.locator('[data-testid="prompt-textarea"]')).toBeFocused();
    });

    test('should submit prompt with Ctrl+Enter', async ({ page }) => {
      await page.fill('[data-testid="prompt-textarea"]', 'Keyboard shortcut test');
      
      // Submit with keyboard shortcut
      await page.keyboard.press('Control+Enter');
      
      // Should start generation
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
    });
  });

  test.describe('Generation history', () => {
    test('should track generation history', async ({ page }) => {
      // First generation
      await page.fill('[data-testid="prompt-textarea"]', 'First prompt');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      
      // Second generation
      await page.fill('[data-testid="prompt-textarea"]', 'Second prompt');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      
      // Open history dropdown
      await page.click('[data-testid="history-dropdown-trigger"]');
      
      // Should show both prompts
      await expect(page.locator('[data-testid="history-item"]:has-text("Second prompt")')).toBeVisible();
      await expect(page.locator('[data-testid="history-item"]:has-text("First prompt")')).toBeVisible();
    });

    test('should reuse prompts from history', async ({ page }) => {
      // Initial generation
      await page.fill('[data-testid="prompt-textarea"]', 'Reusable prompt');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      
      // Open history and select previous prompt
      await page.click('[data-testid="history-dropdown-trigger"]');
      await page.click('[data-testid="history-item"]:has-text("Reusable prompt")');
      
      // Prompt should be populated
      await expect(page.locator('[data-testid="prompt-textarea"]')).toHaveValue('Reusable prompt');
    });
  });

  test.describe('Panel layout and resizing', () => {
    test('should allow resizing panels', async ({ page }) => {
      const resizeHandle = page.locator('[data-testid="panel-resize-handle"]');
      
      // Get initial panel widths
      const chatPanel = page.locator('[data-testid="chapter-chat-panel"]');
      const viewerPanel = page.locator('[data-testid="chapter-viewer-panel"]');
      
      const initialChatWidth = await chatPanel.boundingBox();
      const initialViewerWidth = await viewerPanel.boundingBox();
      
      // Drag resize handle
      await resizeHandle.dragTo(resizeHandle, {
        targetPosition: { x: 100, y: 0 }
      });
      
      // Panel widths should change
      const newChatWidth = await chatPanel.boundingBox();
      const newViewerWidth = await viewerPanel.boundingBox();
      
      expect(newChatWidth?.width).not.toBe(initialChatWidth?.width);
      expect(newViewerWidth?.width).not.toBe(initialViewerWidth?.width);
    });

    test('should persist panel sizes', async ({ page }) => {
      // Resize panels
      const resizeHandle = page.locator('[data-testid="panel-resize-handle"]');
      await resizeHandle.dragTo(resizeHandle, {
        targetPosition: { x: -100, y: 0 }
      });
      
      const panelWidth = await page.locator('[data-testid="chapter-chat-panel"]').boundingBox();
      
      // Reload page
      await page.reload();
      
      // Panel should maintain size
      const newPanelWidth = await page.locator('[data-testid="chapter-chat-panel"]').boundingBox();
      expect(newPanelWidth?.width).toBe(panelWidth?.width);
    });
  });

  test.describe('Export functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Generate content to export
      await page.fill('[data-testid="prompt-textarea"]', 'Content for export testing');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
    });

    test('should export as markdown', async ({ page }) => {
      // Open export menu
      await page.click('[data-testid="export-dropdown-trigger"]');
      
      // Mock download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-markdown-option"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.md$/);
    });

    test('should export as HTML', async ({ page }) => {
      await page.click('[data-testid="export-dropdown-trigger"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-html-option"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.html$/);
    });

    test('should export as Word document', async ({ page }) => {
      await page.click('[data-testid="export-dropdown-trigger"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-docx-option"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.docx$/);
    });
  });

  test.describe('Error handling and recovery', () => {
    test('should handle network errors during generation', async ({ page }) => {
      // Simulate network failure
      await page.route('/api/chapters/generate', async route => {
        await route.abort('failed');
      });
      
      await page.fill('[data-testid="prompt-textarea"]', 'Network error test');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Should show network error
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Should allow retry
      await expect(page.locator('[data-testid="retry-generation-button"]')).toBeVisible();
    });

    test('should recover from network failure', async ({ page }) => {
      // First request fails
      let requestCount = 0;
      await page.route('/api/chapters/generate', async route => {
        requestCount++;
        if (requestCount === 1) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });
      
      await page.fill('[data-testid="prompt-textarea"]', 'Recovery test');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Should show error
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Retry should work
      await page.click('[data-testid="retry-generation-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeVisible();
    });

    test('should handle save errors gracefully', async ({ page }) => {
      // Generate content
      await page.fill('[data-testid="prompt-textarea"]', 'Save error test');
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      
      // Mock save API to fail
      await page.route('/api/chapters/save', async route => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Save failed' })
        });
      });
      
      // Try to save
      await page.keyboard.press('Control+s');
      
      // Should show save error
      await expect(page.locator('[data-testid="save-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-error"]')).toContainText('Save failed');
      
      // Should maintain unsaved state
      await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interface
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="prompt-textarea"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="submit-prompt-button"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="history-dropdown-trigger"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check main regions
      await expect(page.locator('[aria-label*="Chapter writing prompt"]')).toBeVisible();
      await expect(page.locator('[aria-label*="Chapter content viewer"]')).toBeVisible();
      
      // Check important buttons
      await expect(page.locator('[data-testid="submit-prompt-button"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="save-chapter-button"]')).toHaveAttribute('aria-label');
    });

    test('should announce status changes to screen readers', async ({ page }) => {
      // Check for status region
      await expect(page.locator('[role="status"]')).toBeVisible();
      
      // Start generation
      await page.fill('[data-testid="prompt-textarea"]', 'Status test');
      await page.click('[data-testid="submit-prompt-button"]');
      
      // Status should update
      const statusRegion = page.locator('[role="status"]');
      await expect(statusRegion).toContainText(/generating/i);
      
      // Wait for completion
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden({ timeout: 15000 });
      await expect(statusRegion).toContainText(/completed/i);
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/stories/test-story-id/chapters/1/write');
      await expect(page.locator('[data-testid="chapter-chat-panel"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });

    test('should handle large content efficiently', async ({ page }) => {
      // Mock API to return large content
      await page.route('/api/chapters/generate', async route => {
        const largeContent = 'Large content. '.repeat(1000);
        const response = `{"type":"content","content":"${largeContent}"}
{"type":"status","status":"completed"}`;
        
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: response
        });
      });
      
      await page.fill('[data-testid="prompt-textarea"]', 'Large content test');
      
      const startTime = Date.now();
      await page.click('[data-testid="submit-prompt-button"]');
      await expect(page.locator('[data-testid="generating-indicator"]')).toBeHidden();
      
      const processTime = Date.now() - startTime;
      expect(processTime).toBeLessThan(5000); // Should handle large content within 5 seconds
    });
  });
});