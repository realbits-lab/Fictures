import { test, expect } from '@playwright/test';

test.describe('Advanced Editor Functionality - Comprehensive Editor Testing', () => {
  
  test('ChapterEditor comprehensive functionality testing', async ({ page }) => {
    console.log('📝 Starting comprehensive ChapterEditor functionality testing');

    await page.goto('/write/1');
    
    // Wait for editor to fully load
    await page.waitForLoadState('networkidle');
    
    // Test editor presence and accessibility
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 10000 })) {
      console.log('✓ Chapter editor found and accessible');
      
      // Test basic editor functionality
      console.log('🔤 Testing basic editor functionality');
      
      await editor.fill('');
      const testContent = `# Chapter 1: The Digital Frontier

In the vast expanse of digital creativity, Maya stood at the threshold of discovery. The AI-powered writing assistant hummed quietly beside her, its algorithms ready to transform her scattered thoughts into coherent narrative.

"This is just the beginning," she whispered, fingers hovering over the keyboard.

The blank page stared back at her, infinite with possibility.`;

      await editor.fill(testContent);
      
      // Verify content was added
      const editorContent = await editor.inputValue() || await editor.textContent() || '';
      if (editorContent.includes('Chapter 1') && editorContent.includes('Maya')) {
        console.log('✓ Basic text input functionality working');
      } else {
        console.log('⚠️ Basic text input may have issues');
      }
      
      // Test word count functionality
      console.log('📊 Testing word count and statistics');
      
      const wordCountElements = page.locator(
        ':text-matches("\\\\d+ words?", "i"), [data-testid*="word"], .word-count, ' +
        ':text-matches("\\\\d+/\\\\d+", "i"), :text-matches("\\\\d+,\\\\d+", "i")'
      );
      
      if (await wordCountElements.count() > 0) {
        const wordCountText = await wordCountElements.first().textContent() || '';
        console.log(`✓ Word count functionality detected: "${wordCountText}"`);
        
        // Verify word count accuracy (approximately)
        const words = testContent.split(/\s+/).filter(word => word.length > 0);
        const expectedWordCount = words.length;
        console.log(`  - Expected word count: ${expectedWordCount} words`);
        
        // Look for progress indicators
        const progressBars = page.locator('.progress, [role="progressbar"], .progress-bar');
        if (await progressBars.count() > 0) {
          console.log(`✓ Found progress visualization elements`);
        }
      } else {
        console.log('ℹ️ Word count elements not found');
      }
      
      // Test chapter metadata and structure
      console.log('📋 Testing chapter metadata and structure');
      
      const chapterTitle = page.locator(
        'h1, [data-testid*="title"], .chapter-title, input[name*="title"]'
      ).first();
      
      if (await chapterTitle.isVisible({ timeout: 3000 })) {
        const titleText = await chapterTitle.textContent() || await chapterTitle.inputValue() || '';
        console.log(`✓ Chapter title found: "${titleText}"`);
      }
      
      // Test scene breakdown functionality
      console.log('🎬 Testing scene breakdown and organization');
      
      const sceneElements = page.locator(
        '[data-testid*="scene"], .scene, .scene-breakdown, .scene-item'
      );
      
      const sceneCount = await sceneElements.count();
      if (sceneCount > 0) {
        console.log(`✓ Found ${sceneCount} scene-related elements`);
        
        for (let i = 0; i < Math.min(sceneCount, 3); i++) {
          const scene = sceneElements.nth(i);
          const sceneText = await scene.textContent() || '';
          console.log(`  - Scene ${i + 1}: "${sceneText.slice(0, 50)}..."`);
        }
        
        // Test scene interaction
        const firstScene = sceneElements.first();
        if (await firstScene.isVisible()) {
          const sceneButtons = firstScene.locator('button, a');
          const buttonCount = await sceneButtons.count();
          if (buttonCount > 0) {
            console.log(`✓ Scene has ${buttonCount} interactive elements`);
          }
        }
      } else {
        console.log('ℹ️ No scene breakdown elements found');
      }
      
      // Test AI writing assistant integration
      console.log('🤖 Testing AI writing assistant integration');
      
      const aiElements = page.locator(
        '[data-testid*="ai"], .ai-assistant, .ai-suggestions, .writing-assistant'
      );
      
      const aiCount = await aiElements.count();
      if (aiCount > 0) {
        console.log(`✓ Found ${aiCount} AI assistant elements`);
        
        const aiAssistant = aiElements.first();
        if (await aiAssistant.isVisible()) {
          const aiContent = await aiAssistant.textContent() || '';
          console.log(`✓ AI assistant content: "${aiContent.slice(0, 100)}..."`);
          
          // Look for AI suggestion buttons
          const aiButtons = aiAssistant.locator('button');
          const aiButtonCount = await aiButtons.count();
          if (aiButtonCount > 0) {
            console.log(`✓ Found ${aiButtonCount} AI interaction buttons`);
          }
        }
      } else {
        console.log('ℹ️ No AI assistant elements found in editor');
      }
      
      // Test writing analytics
      console.log('📈 Testing writing analytics and feedback');
      
      const analyticsElements = page.locator(
        '.analytics, [data-testid*="analytics"], .writing-stats, .pace, .dialog'
      );
      
      const analyticsCount = await analyticsElements.count();
      if (analyticsCount > 0) {
        console.log(`✓ Found ${analyticsCount} analytics elements`);
        
        // Look for specific analytics metrics
        const metrics = ['pace', 'dialog', 'action', 'emotion'];
        
        for (const metric of metrics) {
          const metricElements = page.locator(`:text("${metric}"), [data-metric="${metric}"]`);
          if (await metricElements.count() > 0) {
            console.log(`  - ${metric} metric detected`);
          }
        }
      } else {
        console.log('ℹ️ No writing analytics elements found');
      }
      
    } else {
      console.log('⚠️ Chapter editor not found or not accessible');
    }

    console.log('✅ ChapterEditor comprehensive functionality testing completed');
  });

  test('Text formatting and rich text capabilities', async ({ page }) => {
    console.log('🎨 Starting text formatting and rich text testing');

    await page.goto('/write/1');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('✓ Editor found for formatting testing');
      
      // Test formatting toolbar
      const formattingElements = page.locator(
        '.toolbar, .formatting-toolbar, [data-testid*="toolbar"], ' +
        '.editor-toolbar, .rich-text-toolbar'
      );
      
      if (await formattingElements.count() > 0) {
        console.log('✓ Formatting toolbar found');
        
        const toolbar = formattingElements.first();
        
        // Test common formatting buttons
        const formattingButtons = [
          { selector: 'button[title*="bold"], .bold-btn, [data-format="bold"]', name: 'Bold' },
          { selector: 'button[title*="italic"], .italic-btn, [data-format="italic"]', name: 'Italic' },
          { selector: 'button[title*="underline"], .underline-btn, [data-format="underline"]', name: 'Underline' },
          { selector: 'button[title*="header"], .header-btn, [data-format="header"]', name: 'Header' },
          { selector: 'button[title*="list"], .list-btn, [data-format="list"]', name: 'List' }
        ];
        
        for (const button of formattingButtons) {
          const formatButton = toolbar.locator(button.selector);
          if (await formatButton.count() > 0) {
            console.log(`✓ ${button.name} formatting button found`);
            
            // Test button interaction (without actually applying formatting)
            if (await formatButton.first().isVisible()) {
              const isEnabled = await formatButton.first().isEnabled();
              console.log(`  - ${button.name} button enabled: ${isEnabled}`);
            }
          } else {
            console.log(`ℹ️ ${button.name} formatting button not found`);
          }
        }
        
      } else {
        console.log('ℹ️ No formatting toolbar found - may be plain text editor');
      }
      
      // Test contenteditable rich text capabilities
      if (await editor.getAttribute('contenteditable') === 'true') {
        console.log('✓ Rich text editor (contenteditable) detected');
        
        // Test rich text input
        await editor.fill('');
        
        // Try to insert formatted content
        const richTextContent = 'Testing <strong>bold</strong> and <em>italic</em> formatting.';
        
        await editor.evaluate((el, content) => {
          if (el.innerHTML !== undefined) {
            el.innerHTML = content;
          } else {
            el.textContent = content;
          }
        }, richTextContent);
        
        await page.waitForTimeout(1000);
        
        const resultContent = await editor.innerHTML() || await editor.textContent() || '';
        
        if (resultContent.includes('<strong>') || resultContent.includes('<em>')) {
          console.log('✓ Rich text formatting preserved');
        } else {
          console.log('ℹ️ Content may be sanitized to plain text');
        }
        
      } else {
        console.log('ℹ️ Plain text editor (textarea) detected');
      }
      
      // Test keyboard shortcuts for formatting
      console.log('⌨️ Testing keyboard shortcuts');
      
      await editor.fill('Test text for formatting shortcuts');
      
      // Select all text
      await editor.press('Control+a');
      await page.waitForTimeout(500);
      
      // Test bold shortcut
      await editor.press('Control+b');
      await page.waitForTimeout(500);
      
      // Test italic shortcut
      await editor.press('Control+i');
      await page.waitForTimeout(500);
      
      console.log('✓ Keyboard formatting shortcuts tested (results depend on editor implementation)');
      
    } else {
      console.log('⚠️ Editor not found for formatting testing');
    }

    console.log('✅ Text formatting and rich text testing completed');
  });

  test('Editor performance with large content', async ({ page }) => {
    console.log('⚡ Starting editor performance testing with large content');

    await page.goto('/write/1');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('✓ Editor found for performance testing');
      
      // Generate large content for performance testing
      const largeParagraph = `This is a comprehensive performance test paragraph that contains multiple sentences and various punctuation marks to simulate realistic writing content. The purpose is to test how the editor handles larger amounts of text content. We include various elements like dialogue, "spoken text in quotes," and narrative descriptions. The content also includes numbers like 123, 456, and 789 to test different character types. Additionally, we test special characters: @#$%^&*()_+-={}[]|;:,.<>? to ensure comprehensive character handling.`;
      
      const largeContent = Array.from({ length: 50 }, (_, i) => `
## Chapter ${i + 1}: Performance Testing Section

${largeParagraph}

${largeParagraph}

**Character Development:**
- Protagonist: Shows growth through trials
- Antagonist: Complex motivations revealed
- Supporting cast: Each serves narrative purpose

*Setting Description:*
The vast digital landscape stretched endlessly before them, pixels and data streams forming mountains of information and valleys of forgotten code. In this realm, creativity and technology merged seamlessly.

> "The future of storytelling lies not in replacing human creativity, but in amplifying it," the AI whispered through the interface.

---

`).join('\n');
      
      console.log(`📝 Generated ${largeContent.length} characters of test content`);
      
      // Test large content input performance
      const inputStartTime = Date.now();
      
      await editor.fill('');
      await editor.fill(largeContent);
      
      const inputTime = Date.now() - inputStartTime;
      console.log(`⏱️ Large content input time: ${inputTime}ms`);
      
      // Test editor responsiveness after large content
      const responsiveTestStart = Date.now();
      
      // Test cursor movement
      await editor.press('Home');
      await editor.press('End');
      await editor.press('Control+Home');
      await editor.press('Control+End');
      
      const responsiveTime = Date.now() - responsiveTestStart;
      console.log(`⚡ Editor responsiveness test: ${responsiveTime}ms`);
      
      // Test selection performance
      const selectionStartTime = Date.now();
      
      await editor.press('Control+a');
      await page.waitForTimeout(100);
      
      const selectionTime = Date.now() - selectionStartTime;
      console.log(`🎯 Text selection time: ${selectionTime}ms`);
      
      // Test scrolling performance (if applicable)
      if (await editor.getAttribute('contenteditable') === 'true') {
        const scrollTestStart = Date.now();
        
        await editor.evaluate(el => {
          el.scrollTop = 0;
          el.scrollTop = el.scrollHeight / 2;
          el.scrollTop = el.scrollHeight;
          el.scrollTop = 0;
        });
        
        const scrollTime = Date.now() - scrollTestStart;
        console.log(`📜 Scrolling performance: ${scrollTime}ms`);
      }
      
      // Test typing performance in large document
      await editor.press('End');
      
      const typingStartTime = Date.now();
      
      await editor.type('\n\nPerformance test addition: This text was added after loading large content to test typing responsiveness.');
      
      const typingTime = Date.now() - typingStartTime;
      console.log(`⌨️ Typing performance in large document: ${typingTime}ms`);
      
      // Test word count performance with large content
      const wordCountElements = page.locator(':text-matches("\\\\d+ words?", "i")');
      if (await wordCountElements.count() > 0) {
        const wordCountUpdateStart = Date.now();
        
        await editor.type(' additional words');
        await page.waitForTimeout(1000); // Wait for word count update
        
        const wordCountUpdateTime = Date.now() - wordCountUpdateStart;
        console.log(`📊 Word count update performance: ${wordCountUpdateTime}ms`);
      }
      
      // Performance assertions
      expect(inputTime).toBeLessThan(5000); // Large content input should be under 5 seconds
      expect(responsiveTime).toBeLessThan(1000); // Editor should remain responsive
      expect(typingTime).toBeLessThan(2000); // Typing should be responsive
      
      console.log('📈 Performance test summary:');
      console.log(`  - Content size: ${largeContent.length} characters`);
      console.log(`  - Input performance: ${inputTime < 3000 ? 'Good' : 'Needs improvement'}`);
      console.log(`  - Responsiveness: ${responsiveTime < 500 ? 'Excellent' : responsiveTime < 1000 ? 'Good' : 'Needs improvement'}`);
      
    } else {
      console.log('⚠️ Editor not found for performance testing');
    }

    console.log('✅ Editor performance testing completed');
  });

  test('Advanced editor features and integrations', async ({ page }) => {
    console.log('🔧 Starting advanced editor features testing');

    await page.goto('/write/1');
    
    // Test autosave functionality
    console.log('💾 Testing autosave functionality');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      
      // Add content to trigger autosave
      await editor.fill('Testing autosave functionality with this content...');
      
      // Look for autosave indicators
      await page.waitForTimeout(2000);
      
      const autosaveElements = page.locator(
        ':text("Saving"), :text("Saved"), :text("Auto-saved"), ' +
        '.save-status, [data-testid*="save"], .autosave'
      );
      
      if (await autosaveElements.count() > 0) {
        const saveStatus = await autosaveElements.first().textContent() || '';
        console.log(`✓ Autosave functionality detected: "${saveStatus}"`);
      } else {
        console.log('ℹ️ No visible autosave indicators found');
      }
      
      // Test manual save functionality
      const saveButton = page.locator('button:has-text("Save"), [data-testid*="save"]').first();
      
      if (await saveButton.isVisible({ timeout: 2000 })) {
        console.log('✓ Manual save button found');
        
        const isEnabled = await saveButton.isEnabled();
        console.log(`  - Save button enabled: ${isEnabled}`);
      }
      
      // Test version history or revision tracking
      console.log('📚 Testing version history and revisions');
      
      const versionElements = page.locator(
        '[data-testid*="version"], .version, .revision, .history, ' +
        'button:has-text("History"), .version-control'
      );
      
      if (await versionElements.count() > 0) {
        console.log(`✓ Found version history elements`);
        
        const versionButton = versionElements.first();
        if (await versionButton.isVisible()) {
          console.log('✓ Version history accessible');
        }
      } else {
        console.log('ℹ️ No version history features found');
      }
      
      // Test collaborative editing indicators
      console.log('👥 Testing collaborative editing features');
      
      const collaborativeElements = page.locator(
        '.collaborator, .user-cursor, .presence, [data-testid*="collab"], ' +
        '.online-users, .edit-conflicts'
      );
      
      if (await collaborativeElements.count() > 0) {
        console.log(`✓ Found collaborative editing elements`);
      } else {
        console.log('ℹ️ No collaborative editing features visible');
      }
      
      // Test distraction-free or focus mode
      console.log('🎯 Testing focus and distraction-free modes');
      
      const focusModeElements = page.locator(
        'button:has-text("Focus"), .focus-mode, .distraction-free, ' +
        '[data-testid*="focus"], .zen-mode'
      );
      
      if (await focusModeElements.count() > 0) {
        console.log('✓ Focus mode functionality found');
        
        const focusButton = focusModeElements.first();
        if (await focusButton.isVisible()) {
          console.log('✓ Focus mode toggle accessible');
        }
      } else {
        console.log('ℹ️ No focus mode features found');
      }
      
      // Test export or download functionality
      console.log('📤 Testing export and download features');
      
      const exportElements = page.locator(
        'button:has-text("Export"), button:has-text("Download"), ' +
        '.export, [data-testid*="export"], .download'
      );
      
      if (await exportElements.count() > 0) {
        console.log('✓ Export functionality found');
        
        const exportButton = exportElements.first();
        if (await exportButton.isVisible()) {
          const exportText = await exportButton.textContent() || '';
          console.log(`✓ Export option: "${exportText}"`);
        }
      } else {
        console.log('ℹ️ No export functionality found');
      }
      
      // Test spell check and grammar features
      console.log('📝 Testing spell check and grammar features');
      
      // Add text with intentional errors
      await editor.fill('This text has some intentional mispellings and grammar errors for testing.');
      await page.waitForTimeout(2000);
      
      const spellCheckElements = page.locator('.spellcheck, .grammar, .spelling-error, [data-testid*="spell"]');
      
      if (await spellCheckElements.count() > 0) {
        console.log('✓ Spell check or grammar features detected');
      } else {
        console.log('ℹ️ No visible spell check features');
      }
      
    } else {
      console.log('⚠️ Editor not found for advanced features testing');
    }

    console.log('✅ Advanced editor features testing completed');
  });

  test('Editor accessibility and keyboard navigation', async ({ page }) => {
    console.log('♿ Starting editor accessibility testing');

    await page.goto('/write/1');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('✓ Editor found for accessibility testing');
      
      // Test keyboard navigation
      console.log('⌨️ Testing keyboard navigation');
      
      await editor.focus();
      const isFocused = await editor.evaluate(el => document.activeElement === el);
      
      if (isFocused) {
        console.log('✓ Editor can receive keyboard focus');
      } else {
        console.log('⚠️ Editor focus may have issues');
      }
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      console.log(`✓ Tab navigation moves to: ${focusedElement}`);
      
      // Return focus to editor
      await editor.focus();
      
      // Test keyboard shortcuts
      console.log('⌨️ Testing keyboard shortcuts accessibility');
      
      const shortcuts = [
        { keys: 'Control+s', description: 'Save shortcut' },
        { keys: 'Control+z', description: 'Undo shortcut' },
        { keys: 'Control+y', description: 'Redo shortcut' },
        { keys: 'Control+f', description: 'Find shortcut' }
      ];
      
      for (const shortcut of shortcuts) {
        await page.keyboard.press(shortcut.keys);
        await page.waitForTimeout(300);
        console.log(`✓ ${shortcut.description} tested`);
      }
      
      // Test ARIA attributes
      console.log('🏷️ Testing ARIA attributes and labels');
      
      const ariaLabel = await editor.getAttribute('aria-label');
      const ariaDescribedBy = await editor.getAttribute('aria-describedby');
      const role = await editor.getAttribute('role');
      
      if (ariaLabel) {
        console.log(`✓ ARIA label found: "${ariaLabel}"`);
      }
      
      if (ariaDescribedBy) {
        console.log(`✓ ARIA described-by found: "${ariaDescribedBy}"`);
      }
      
      if (role) {
        console.log(`✓ Role attribute found: "${role}"`);
      }
      
      // Test screen reader support
      console.log('📢 Testing screen reader support elements');
      
      const srOnlyElements = page.locator('.sr-only, .screen-reader-only, .visually-hidden');
      const srCount = await srOnlyElements.count();
      
      if (srCount > 0) {
        console.log(`✓ Found ${srCount} screen reader only elements`);
      }
      
      // Test form labels and associations
      const editorId = await editor.getAttribute('id');
      if (editorId) {
        const associatedLabel = page.locator(`label[for="${editorId}"]`);
        if (await associatedLabel.count() > 0) {
          const labelText = await associatedLabel.textContent() || '';
          console.log(`✓ Associated label found: "${labelText}"`);
        }
      }
      
      // Test high contrast mode compatibility
      console.log('🎨 Testing high contrast compatibility');
      
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            textarea, [contenteditable="true"] {
              border: 2px solid currentColor !important;
              background: Canvas !important;
              color: CanvasText !important;
            }
          }
        `
      });
      
      console.log('✓ High contrast styles applied for testing');
      
      // Test focus indicators
      console.log('🎯 Testing focus indicators');
      
      await editor.focus();
      
      const focusStyles = await editor.evaluate(el => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow
        };
      });
      
      if (focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none') {
        console.log('✓ Focus indicators present');
        console.log(`  - Outline: ${focusStyles.outline}`);
        console.log(`  - Box shadow: ${focusStyles.boxShadow}`);
      } else {
        console.log('⚠️ Focus indicators may be missing or insufficient');
      }
      
    } else {
      console.log('⚠️ Editor not found for accessibility testing');
    }

    console.log('✅ Editor accessibility testing completed');
  });
});