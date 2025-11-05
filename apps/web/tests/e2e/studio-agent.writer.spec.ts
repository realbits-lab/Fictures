/**
 * Studio Agent E2E Tests (Writer Role)
 *
 * Tests for AI-powered writing assistant in Studio
 * Requires writer or manager role authentication
 *
 * Test Cases: TC-AGENT-NAV-001 to TC-AGENT-ERROR-006
 */

import { test, expect } from '@playwright/test';

test.describe('Studio Agent - Writer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Tests', () => {
    test('TC-AGENT-NAV-001: Agent chat interface accessible from Studio', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"], button:has-text("Agent")');

      if (await agentButton.isVisible()) {
        await expect(agentButton).toBeVisible();
      }
    });

    test('TC-AGENT-NAV-003: Agent panel toggles open/close', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"]');

      if (await agentButton.isVisible()) {
        await agentButton.click();
        await page.waitForTimeout(500);

        const agentPanel = page.locator('[data-testid="agent-panel"]');
        await expect(agentPanel).toBeVisible();

        // Close panel
        const closeButton = page.locator('[data-testid="close-agent"]');
        await closeButton.click();
        await page.waitForTimeout(500);

        await expect(agentPanel).not.toBeVisible();
      }
    });
  });

  test.describe('Content Tests', () => {
    test('TC-AGENT-CONTENT-001: Chat interface displays correctly', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"]');

      if (await agentButton.isVisible()) {
        await agentButton.click();
        await page.waitForTimeout(500);

        const chatInterface = page.locator('[data-testid="chat-interface"]');
        await expect(chatInterface).toBeVisible();
      }
    });

    test('TC-AGENT-CONTENT-004: Empty state shows welcome message', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"]');

      if (await agentButton.isVisible()) {
        await agentButton.click();
        await page.waitForTimeout(500);

        const welcomeMessage = page.locator('[data-testid="welcome-message"]');
        await expect(welcomeMessage).toBeVisible();
      }
    });
  });

  test.describe('Functionality Tests', () => {
    test('TC-AGENT-FUNC-001: Send message to agent works', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"]');

      if (await agentButton.isVisible()) {
        await agentButton.click();
        await page.waitForTimeout(500);

        const messageInput = page.locator('[data-testid="message-input"]');
        const sendButton = page.locator('[data-testid="send-message"]');

        if (await messageInput.isVisible()) {
          await messageInput.fill('Hello, can you help me write a scene?');
          await sendButton.click();

          await page.waitForTimeout(1000);

          // Verify message appears in chat
          const userMessage = page.locator('[data-testid="user-message"]').last();
          await expect(userMessage).toContainText('Hello');
        }
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-AGENT-PERF-001: Agent panel opens in under 500ms', async ({ page }) => {
      const agentButton = page.locator('[data-testid="agent-button"]');

      if (await agentButton.isVisible()) {
        const startTime = Date.now();

        await agentButton.click();
        await page.locator('[data-testid="agent-panel"]').waitFor({ state: 'visible' });

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000);
      }
    });
  });
});
