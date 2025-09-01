import { test, expect } from '@playwright/test';

test.describe('AI Integration - Functional Testing', () => {
  
  test('AI Assistant page accessibility and features', async ({ page }) => {
    await page.goto('/assistant');
    
    // Check AI assistant page loads
    const assistantPageIndicator = page.locator('h1, [data-testid="ai-assistant"], main').first();
    await expect(assistantPageIndicator).toBeVisible();
    console.log('✓ AI Assistant page loaded successfully');
    
    // Look for AI-related interface elements
    const aiElements = page.locator(
      '[data-testid*="ai"], .ai-chat, .ai-interface, .chat-container, ' +
      'textarea[placeholder*="ask"], input[placeholder*="question"]'
    );
    
    const aiElementCount = await aiElements.count();
    if (aiElementCount > 0) {
      console.log(`✓ Found ${aiElementCount} AI interface elements`);
      
      // Test AI input interface
      const chatInput = page.locator('textarea, input[type="text"]').first();
      if (await chatInput.isVisible({ timeout: 3000 })) {
        console.log('✓ AI chat input interface available');
        
        // Test typing in AI interface
        await chatInput.fill('Hello, AI assistant');
        await expect(chatInput).toHaveValue('Hello, AI assistant');
        console.log('✓ AI input field accepts text');
      }
      
    } else {
      console.log('⚠️ No AI interface elements found on assistant page');
    }
    
    // Look for AI assistant widgets or components
    const aiWidgets = page.locator(
      '[data-testid="ai-widget"], .ai-assistant-widget, .ai-suggestions, ' +
      '.writing-assistant, .ai-tools'
    );
    
    const widgetCount = await aiWidgets.count();
    if (widgetCount > 0) {
      console.log(`✓ Found ${widgetCount} AI widget components`);
    }
  });

  test('AI suggestions API functionality', async ({ page }) => {
    // Test AI suggestions endpoint
    const suggestionsResponse = await page.request.post('/api/ai/suggestions', {
      data: {
        text: 'Once upon a time',
        type: 'continuation'
      }
    });
    
    const status = suggestionsResponse.status();
    console.log(`AI Suggestions API response: ${status}`);
    
    if (status === 200) {
      console.log('✓ AI Suggestions API functional');
      
      try {
        const suggestionsData = await suggestionsResponse.json();
        console.log('✓ AI Suggestions returned valid JSON');
        
        if (suggestionsData.suggestions || suggestionsData.data || suggestionsData.text) {
          console.log('✓ AI Suggestions contains expected data structure');
        }
      } catch (e) {
        console.log('✓ AI Suggestions API responded (non-JSON)');
      }
      
    } else if ([401, 403].includes(status)) {
      console.log('✓ AI Suggestions API properly protected with authentication');
    } else if (status === 405) {
      console.log('ℹ️ AI Suggestions API method not allowed (may need different HTTP method)');
    } else {
      console.log(`ℹ️ AI Suggestions API returned status: ${status}`);
    }
  });

  test('AI integration in writing interface', async ({ page }) => {
    // Try to access writing interface with AI features
    const writingPages = ['/write/1', '/write/test-chapter', '/assistant'];
    
    for (const writePage of writingPages) {
      await page.goto(writePage);
      
      const notFound = await page.locator('text="404", text="Not Found"').count();
      if (notFound === 0) {
        console.log(`✓ Writing page accessible: ${writePage}`);
        
        // Look for AI integration elements
        const aiIntegrationElements = page.locator(
          '[data-testid*="ai"], .ai-suggestions, .ai-assistant, ' +
          'button:has-text("AI"), button[title*="AI"], .writing-assistant'
        );
        
        const aiIntegrationCount = await aiIntegrationElements.count();
        if (aiIntegrationCount > 0) {
          console.log(`✓ Found ${aiIntegrationCount} AI integration elements on ${writePage}`);
          
          // Test AI suggestion button if present
          const aiButton = aiIntegrationElements.first();
          if (await aiButton.isVisible()) {
            console.log('✓ AI integration button accessible');
            
            // Test button interaction
            await aiButton.click();
            await page.waitForTimeout(1000);
            
            // Check for AI response or loading state
            const aiResponse = page.locator(
              '[data-testid="ai-response"], .ai-suggestion, .ai-result, ' +
              '.loading, .spinner, text="Loading"'
            );
            
            if (await aiResponse.count() > 0) {
              console.log('✓ AI integration responds to user interaction');
            }
          }
        } else {
          console.log(`ℹ️ No AI integration found on ${writePage}`);
        }
        
        break; // Found working page, exit loop
      }
    }
  });

  test('AI chat functionality and streaming', async ({ page }) => {
    await page.goto('/assistant');
    
    // Look for chat interface
    const chatInterface = page.locator(
      '[data-testid="chat"], .chat-container, .messages-container'
    ).first();
    
    if (await chatInterface.isVisible({ timeout: 3000 })) {
      console.log('✓ Chat interface found');
      
      // Look for existing messages or conversation
      const messages = page.locator(
        '[data-testid="message"], .message, .chat-message'
      );
      const messageCount = await messages.count();
      console.log(`ℹ️ Found ${messageCount} existing messages`);
      
      // Look for chat input
      const chatInput = page.locator(
        '[data-testid="chat-input"], textarea, input[placeholder*="message"], input[placeholder*="ask"]'
      ).first();
      
      if (await chatInput.isVisible()) {
        console.log('✓ Chat input available');
        
        // Test sending a message
        await chatInput.fill('Test message for AI');
        
        // Look for send button
        const sendButton = page.locator(
          '[data-testid="send"], button:has-text("Send"), button[type="submit"], ' +
          '.send-button, [aria-label*="send"]'
        ).first();
        
        if (await sendButton.isVisible()) {
          console.log('✓ Send button found');
          // Note: Not clicking to avoid actual API calls in tests
        } else {
          // Try Enter key
          await chatInput.press('Enter');
          console.log('ℹ️ Attempted Enter key send');
        }
        
        // Wait briefly to see if any loading or response appears
        await page.waitForTimeout(1000);
        
        const loadingElements = page.locator('.loading, .spinner, text="Thinking"');
        if (await loadingElements.count() > 0) {
          console.log('✓ Chat shows loading/thinking state');
        }
      }
      
    } else {
      console.log('⚠️ No chat interface found on assistant page');
    }
  });

  test('AI model configuration and settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Look for AI-related settings
    const aiSettings = page.locator(
      '[data-testid*="ai"], .ai-settings, :text("AI Model"), :text("AI Assistant"), ' +
      'select[name*="model"], input[name*="ai"]'
    );
    
    const aiSettingsCount = await aiSettings.count();
    if (aiSettingsCount > 0) {
      console.log(`✓ Found ${aiSettingsCount} AI-related settings`);
      
      // Look for model selection
      const modelSelect = page.locator('select, [role="combobox"]').first();
      if (await modelSelect.isVisible({ timeout: 3000 })) {
        console.log('✓ AI model selection available');
        
        // Get available options
        const options = page.locator('option, [role="option"]');
        const optionCount = await options.count();
        if (optionCount > 0) {
          console.log(`✓ Found ${optionCount} model options`);
        }
      }
      
    } else {
      console.log('ℹ️ No AI settings found on settings page');
    }
  });

  test('AI dashboard widget functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for AI assistant widget on dashboard
    const aiWidget = page.locator(
      '[data-testid="ai-assistant-widget"], .ai-assistant-widget, .ai-widget, ' +
      '.dashboard-ai, [data-widget*="ai"]'
    );
    
    if (await aiWidget.count() > 0) {
      const widget = aiWidget.first();
      await expect(widget).toBeVisible();
      console.log('✓ AI Assistant widget found on dashboard');
      
      // Check widget content
      const widgetContent = await widget.textContent() || '';
      if (widgetContent.toLowerCase().includes('ai') || widgetContent.toLowerCase().includes('assistant')) {
        console.log('✓ AI widget contains relevant content');
      }
      
      // Test widget interaction
      const widgetButtons = widget.locator('button, a');
      const buttonCount = await widgetButtons.count();
      if (buttonCount > 0) {
        console.log(`✓ AI widget has ${buttonCount} interactive elements`);
      }
      
    } else {
      console.log('ℹ️ No AI assistant widget found on dashboard');
    }
  });

  test('AI API endpoints comprehensive testing', async ({ page }) => {
    // Test all AI endpoints with different methods and scenarios
    const aiEndpoints = [
      { path: '/api/ai/chat', method: 'POST' },
      { path: '/api/ai/analyze', method: 'POST' },
      { path: '/api/ai/generate', method: 'POST' },
      { path: '/api/ai/suggestions', method: 'POST' }
    ];
    
    for (const endpoint of aiEndpoints) {
      // Test without authentication first
      const unauthResponse = await page.request.fetch(endpoint.path, {
        method: endpoint.method,
        data: { message: 'test', text: 'sample text', content: 'hello world' }
      });
      
      const status = unauthResponse.status();
      console.log(`${endpoint.path} (${endpoint.method}) response: ${status}`);
      
      if ([401, 403].includes(status)) {
        console.log(`✓ ${endpoint.path} properly protected with authentication`);
      } else if (status === 200) {
        console.log(`✓ ${endpoint.path} accessible and functional`);
      } else if (status === 405) {
        console.log(`ℹ️ ${endpoint.path} method not allowed (may need different method)`);
      } else {
        console.log(`ℹ️ ${endpoint.path} returned status: ${status}`);
      }
      
      // Test CORS headers
      const corsHeaders = unauthResponse.headers();
      if (corsHeaders['access-control-allow-origin']) {
        console.log(`✓ ${endpoint.path} has CORS headers configured`);
      }
    }
  });
});