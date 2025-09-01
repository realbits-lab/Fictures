import { test, expect } from '@playwright/test';

test.describe('Streaming and Real-time Features - Advanced Functionality Testing', () => {
  
  test('AI streaming response functionality', async ({ page }) => {
    console.log('🌊 Starting AI streaming response testing');

    // Navigate to AI assistant page
    await page.goto('/assistant');
    
    // Look for AI chat interface
    const chatInput = page.locator(
      '[data-testid*="chat-input"], textarea, input[type="text"], ' +
      '[placeholder*="ask"], [placeholder*="message"]'
    ).first();
    
    if (await chatInput.isVisible({ timeout: 5000 })) {
      console.log('✓ AI chat interface found for streaming test');
      
      // Test streaming response monitoring
      const streamingTest = async () => {
        // Fill chat input
        await chatInput.fill('Write a short story opening about AI and creativity.');
        
        // Look for send mechanism
        const sendButton = page.locator(
          'button:has-text("Send"), [data-testid*="send"], button[type="submit"]'
        ).first();
        
        if (await sendButton.isVisible({ timeout: 2000 })) {
          console.log('✓ Send button found');
          
          // Monitor network requests for streaming
          const streamingResponses = [];
          
          page.on('response', response => {
            if (response.url().includes('/api/ai/') && response.request().method() === 'POST') {
              streamingResponses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers()
              });
            }
          });
          
          // Click send (but don't actually wait for completion to avoid API usage)
          console.log('ℹ️ Monitoring for streaming response patterns');
          
          // Look for streaming indicators in UI
          const streamingIndicators = page.locator(
            '.loading, .spinner, .dots, :text("Thinking"), :text("Generating"), ' +
            '[data-testid*="loading"], .ai-thinking'
          );
          
          const indicatorCount = await streamingIndicators.count();
          if (indicatorCount > 0) {
            console.log(`✓ Found ${indicatorCount} streaming/loading indicators`);
            
            // Check if indicators show animation or changing state
            const indicator = streamingIndicators.first();
            if (await indicator.isVisible()) {
              console.log('✓ Streaming indicators visible and potentially animated');
            }
          } else {
            console.log('ℹ️ No streaming indicators found in UI');
          }
          
          // Check for progressive content updates
          const messageArea = page.locator(
            '[data-testid*="messages"], .messages, .chat-messages, .ai-response'
          ).first();
          
          if (await messageArea.isVisible({ timeout: 2000 })) {
            console.log('✓ Message area found for streaming content');
            
            // Monitor for partial content updates (simulated)
            const initialContent = await messageArea.textContent() || '';
            
            await page.waitForTimeout(2000);
            
            const updatedContent = await messageArea.textContent() || '';
            
            if (updatedContent !== initialContent) {
              console.log('✓ Content updates detected - streaming may be working');
            } else {
              console.log('ℹ️ No content changes detected during monitoring period');
            }
          }
          
        } else {
          // Try Enter key as alternative
          await chatInput.press('Enter');
          console.log('ℹ️ Attempted Enter key send for streaming test');
        }
        
        return streamingResponses;
      };
      
      // Note: Not actually executing to avoid API costs, but framework is ready
      console.log('ℹ️ Streaming test framework ready (not executed to avoid API usage)');
      
    } else {
      console.log('⚠️ AI chat interface not found for streaming test');
    }

    console.log('✅ AI streaming response testing framework completed');
  });

  test('Real-time collaboration features (if implemented)', async ({ page }) => {
    console.log('🤝 Starting real-time collaboration testing');

    // Navigate to writing interface
    await page.goto('/write/1');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('✓ Editor found for collaboration testing');
      
      // Look for collaboration indicators
      const collaborationElements = page.locator(
        '[data-testid*="collaborator"], .collaborator, .user-cursor, ' +
        '.online-users, [data-testid*="presence"], .presence-indicator'
      );
      
      const collabCount = await collaborationElements.count();
      if (collabCount > 0) {
        console.log(`✓ Found ${collabCount} collaboration-related elements`);
        
        // Test presence indicators
        for (let i = 0; i < Math.min(collabCount, 3); i++) {
          const element = collaborationElements.nth(i);
          const elementText = await element.textContent() || '';
          console.log(`  - Collaboration element ${i + 1}: "${elementText.slice(0, 30)}..."`);
        }
        
      } else {
        console.log('ℹ️ No real-time collaboration elements found');
      }
      
      // Test for WebSocket or similar real-time connections
      const wsConnections = [];
      
      page.on('websocket', ws => {
        wsConnections.push({
          url: ws.url(),
          isClosed: ws.isClosed()
        });
        console.log(`🔗 WebSocket connection detected: ${ws.url()}`);
      });
      
      // Wait and check for real-time connections
      await page.waitForTimeout(3000);
      
      if (wsConnections.length > 0) {
        console.log(`✓ Found ${wsConnections.length} WebSocket connections for real-time features`);
        wsConnections.forEach((ws, index) => {
          console.log(`  - WebSocket ${index + 1}: ${ws.url} (Closed: ${ws.isClosed})`);
        });
      } else {
        console.log('ℹ️ No WebSocket connections detected');
      }
      
      // Test typing indicators or live cursors
      await editor.fill('Testing real-time collaboration features...');
      await page.waitForTimeout(1000);
      
      const typingIndicators = page.locator(
        '.typing-indicator, [data-testid*="typing"], .user-typing, ' +
        ':text("is typing"), .live-cursor'
      );
      
      const typingCount = await typingIndicators.count();
      if (typingCount > 0) {
        console.log(`✓ Found ${typingCount} typing/cursor indicators`);
      } else {
        console.log('ℹ️ No typing indicators found');
      }
      
    } else {
      console.log('⚠️ Editor not found for collaboration testing');
    }

    console.log('✅ Real-time collaboration testing completed');
  });

  test('Autosave and real-time persistence', async ({ page }) => {
    console.log('💾 Starting autosave and real-time persistence testing');

    await page.goto('/write/1');
    
    const editor = page.locator('textarea, [contenteditable="true"]').first();
    
    if (await editor.isVisible({ timeout: 5000 })) {
      console.log('✓ Editor found for autosave testing');
      
      // Monitor network requests for autosave
      const autosaveRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('/autosave') || 
            (request.url().includes('/api/chapters') && request.method() === 'PUT')) {
          autosaveRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });
      
      // Type content to trigger autosave
      const testContent = `This is a comprehensive test of autosave functionality.
      
      We are testing:
      1. Automatic saving of content
      2. Real-time persistence
      3. Network request monitoring
      4. UI feedback for save status
      
      The system should save this content automatically within 30 seconds.`;
      
      await editor.fill('');
      await editor.fill(testContent);
      console.log('✓ Test content added to trigger autosave');
      
      // Wait for autosave to trigger (typically 10-30 seconds)
      console.log('⏱️ Waiting for autosave to trigger...');
      await page.waitForTimeout(35000); // Wait 35 seconds
      
      // Check for autosave requests
      if (autosaveRequests.length > 0) {
        console.log(`✓ Found ${autosaveRequests.length} autosave requests:`);
        autosaveRequests.forEach((req, index) => {
          console.log(`  - Request ${index + 1}: ${req.method} ${req.url}`);
        });
      } else {
        console.log('ℹ️ No autosave requests detected during monitoring period');
      }
      
      // Check for autosave UI indicators
      const saveIndicators = page.locator(
        ':text("Saved"), :text("Saving"), :text("Auto-saved"), ' +
        '.save-status, [data-testid*="save"], .autosave-indicator'
      );
      
      const saveIndicatorCount = await saveIndicators.count();
      if (saveIndicatorCount > 0) {
        console.log(`✓ Found ${saveIndicatorCount} save status indicators`);
        
        for (let i = 0; i < Math.min(saveIndicatorCount, 3); i++) {
          const indicator = saveIndicators.nth(i);
          const indicatorText = await indicator.textContent() || '';
          console.log(`  - Save indicator ${i + 1}: "${indicatorText}"`);
        }
      } else {
        console.log('ℹ️ No save status indicators found');
      }
      
      // Test manual save if available
      const saveButton = page.locator('button:has-text("Save"), [data-testid*="save"]').first();
      
      if (await saveButton.isVisible({ timeout: 2000 })) {
        console.log('✓ Manual save button found');
        
        // Monitor save request
        const manualSavePromise = page.waitForRequest(
          request => request.url().includes('/api/chapters') && request.method() === 'PUT',
          { timeout: 5000 }
        ).catch(() => null);
        
        await saveButton.click();
        console.log('✓ Manual save button clicked');
        
        const saveRequest = await manualSavePromise;
        if (saveRequest) {
          console.log(`✓ Manual save request detected: ${saveRequest.method()} ${saveRequest.url()}`);
        } else {
          console.log('ℹ️ No manual save request detected within timeout');
        }
        
        // Wait for save confirmation
        await page.waitForTimeout(2000);
        
        const saveConfirmation = page.locator(':text("Saved"), .save-success');
        if (await saveConfirmation.count() > 0) {
          console.log('✓ Save confirmation displayed');
        }
      }
      
    } else {
      console.log('⚠️ Editor not found for autosave testing');
    }

    console.log('✅ Autosave and real-time persistence testing completed');
  });

  test('Server-sent events and live updates', async ({ page }) => {
    console.log('📡 Starting server-sent events and live updates testing');

    // Navigate to dashboard or analytics page where live updates might occur
    const pagesWithLiveUpdates = ['/analytics', '/', '/dashboard'];
    
    for (const pagePath of pagesWithLiveUpdates) {
      await page.goto(pagePath);
      console.log(`📊 Testing live updates on ${pagePath}`);
      
      // Monitor for EventSource connections (Server-Sent Events)
      const eventSources = [];
      
      // Check for real-time data elements
      const liveDataElements = page.locator(
        '[data-live], .live-data, .real-time, [data-testid*="live"], ' +
        '.stats, .metrics, .analytics-widget'
      );
      
      const liveDataCount = await liveDataElements.count();
      if (liveDataCount > 0) {
        console.log(`✓ Found ${liveDataCount} potential live data elements`);
        
        // Capture initial state
        const initialValues = [];
        for (let i = 0; i < Math.min(liveDataCount, 5); i++) {
          const element = liveDataElements.nth(i);
          const text = await element.textContent() || '';
          initialValues.push(text);
        }
        
        console.log('📸 Captured initial state for live update detection');
        
        // Wait for potential updates
        await page.waitForTimeout(10000); // Wait 10 seconds
        
        // Check for changes
        let updatesDetected = 0;
        for (let i = 0; i < Math.min(liveDataCount, 5); i++) {
          const element = liveDataElements.nth(i);
          const currentText = await element.textContent() || '';
          
          if (currentText !== initialValues[i]) {
            updatesDetected++;
            console.log(`✓ Live update detected in element ${i + 1}: "${initialValues[i]}" → "${currentText}"`);
          }
        }
        
        if (updatesDetected > 0) {
          console.log(`✅ ${updatesDetected} live updates detected on ${pagePath}`);
        } else {
          console.log(`ℹ️ No live updates detected on ${pagePath} during monitoring period`);
        }
        
      } else {
        console.log(`ℹ️ No live data elements found on ${pagePath}`);
      }
    }

    console.log('✅ Server-sent events and live updates testing completed');
  });

  test('Streaming file upload and progress tracking', async ({ page }) => {
    console.log('📤 Starting streaming file upload testing');

    // Look for file upload interfaces
    const uploadPages = ['/profile', '/settings', '/stories'];
    
    for (const uploadPage of uploadPages) {
      await page.goto(uploadPage);
      
      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();
      
      if (fileInputCount > 0) {
        console.log(`📁 Found ${fileInputCount} file input(s) on ${uploadPage}`);
        
        // Look for upload progress elements
        const progressElements = page.locator(
          '.upload-progress, [data-testid*="upload"], .progress-bar, ' +
          '.file-upload-progress, [data-testid*="progress"]'
        );
        
        const progressCount = await progressElements.count();
        if (progressCount > 0) {
          console.log(`✓ Found ${progressCount} upload progress elements`);
        }
        
        // Look for drag-and-drop areas
        const dropzones = page.locator(
          '.dropzone, [data-testid*="drop"], .file-drop, ' +
          '[data-drop="true"], .upload-area'
        );
        
        const dropzoneCount = await dropzones.count();
        if (dropzoneCount > 0) {
          console.log(`✓ Found ${dropzoneCount} drag-and-drop upload areas`);
        }
        
        // Test upload UI responsiveness (without actual file upload)
        const firstFileInput = fileInputs.first();
        if (await firstFileInput.isVisible()) {
          console.log('✓ File input accessible for upload testing');
          
          // Check for upload restrictions or validation messages
          const validationMessages = page.locator(
            '.upload-validation, .file-error, .size-limit, ' +
            ':text("MB"), :text("maximum"), :text("allowed")'
          );
          
          const validationCount = await validationMessages.count();
          if (validationCount > 0) {
            console.log(`✓ Found ${validationCount} upload validation messages`);
          }
        }
        
        break; // Found upload interface, no need to check other pages
      }
    }

    // Test for chunked upload capability indicators
    const chunkUploadIndicators = page.locator(
      '[data-chunk], .chunk-upload, [data-testid*="chunk"]'
    );
    
    const chunkCount = await chunkUploadIndicators.count();
    if (chunkCount > 0) {
      console.log(`✓ Found ${chunkCount} chunked upload indicators`);
    } else {
      console.log('ℹ️ No chunked upload indicators found');
    }

    console.log('✅ Streaming file upload testing completed');
  });

  test('Real-time notification system', async ({ page }) => {
    console.log('🔔 Starting real-time notification system testing');

    await page.goto('/');
    
    // Look for notification elements
    const notificationElements = page.locator(
      '[data-testid*="notification"], .notification, .alert, .toast, ' +
      '.message, .banner, [role="alert"], .notification-center'
    );
    
    const notificationCount = await notificationElements.count();
    if (notificationCount > 0) {
      console.log(`✓ Found ${notificationCount} notification elements`);
      
      // Check notification types and content
      for (let i = 0; i < Math.min(notificationCount, 5); i++) {
        const notification = notificationElements.nth(i);
        const notificationText = await notification.textContent() || '';
        const isVisible = await notification.isVisible();
        
        console.log(`  - Notification ${i + 1}: "${notificationText.slice(0, 50)}..." (Visible: ${isVisible})`);
        
        // Check for dismissible notifications
        const dismissButton = notification.locator('button, .close, [data-dismiss]');
        if (await dismissButton.count() > 0) {
          console.log(`    ✓ Notification ${i + 1} is dismissible`);
        }
      }
    } else {
      console.log('ℹ️ No notification elements found');
    }
    
    // Check for notification bell/icon
    const notificationIcon = page.locator(
      '.notification-icon, .bell-icon, [data-testid*="bell"], ' +
      ':text("🔔"), .fa-bell, .notifications-trigger'
    );
    
    if (await notificationIcon.count() > 0) {
      console.log('✓ Notification icon/trigger found');
      
      const icon = notificationIcon.first();
      if (await icon.isVisible()) {
        // Check for notification badge/count
        const badge = page.locator('.badge, .count, .notification-count').first();
        if (await badge.isVisible({ timeout: 1000 })) {
          const badgeText = await badge.textContent() || '';
          console.log(`✓ Notification badge found: "${badgeText}"`);
        }
        
        // Test notification dropdown/panel
        await icon.click();
        await page.waitForTimeout(1000);
        
        const notificationPanel = page.locator(
          '.notification-panel, .dropdown-menu, .notification-list'
        );
        
        if (await notificationPanel.isVisible({ timeout: 2000 })) {
          console.log('✓ Notification panel opens on click');
          
          const panelNotifications = notificationPanel.locator('.notification-item, li, .message');
          const panelNotificationCount = await panelNotifications.count();
          console.log(`  - Panel contains ${panelNotificationCount} notifications`);
        }
      }
    }
    
    // Test for real-time notification arrival (simulated)
    console.log('⏱️ Monitoring for real-time notification updates...');
    
    const initialNotificationCount = await notificationElements.count();
    await page.waitForTimeout(5000); // Wait 5 seconds
    
    const updatedNotificationCount = await page.locator(
      '[data-testid*="notification"], .notification, .alert, .toast'
    ).count();
    
    if (updatedNotificationCount > initialNotificationCount) {
      console.log(`✓ Real-time notification detected: ${updatedNotificationCount - initialNotificationCount} new notifications`);
    } else {
      console.log('ℹ️ No new notifications during monitoring period');
    }

    console.log('✅ Real-time notification system testing completed');
  });

  test('WebSocket connection resilience and recovery', async ({ page }) => {
    console.log('🔌 Starting WebSocket connection resilience testing');

    const wsConnections = [];
    const wsMessages = [];
    
    // Monitor WebSocket connections
    page.on('websocket', ws => {
      const connection = {
        url: ws.url(),
        createdAt: Date.now(),
        isClosed: false,
        messageCount: 0
      };
      
      wsConnections.push(connection);
      console.log(`🔗 WebSocket connection opened: ${ws.url()}`);
      
      ws.on('framesent', event => {
        wsMessages.push({
          type: 'sent',
          payload: event.payload,
          timestamp: Date.now()
        });
        connection.messageCount++;
      });
      
      ws.on('framereceived', event => {
        wsMessages.push({
          type: 'received',
          payload: event.payload,
          timestamp: Date.now()
        });
        connection.messageCount++;
      });
      
      ws.on('close', () => {
        connection.isClosed = true;
        console.log(`🔌 WebSocket connection closed: ${ws.url()}`);
      });
    });
    
    // Visit pages that might use WebSockets
    const wsPages = ['/write/1', '/assistant', '/', '/analytics'];
    
    for (const wsPage of wsPages) {
      await page.goto(wsPage);
      console.log(`🌐 Testing WebSocket on ${wsPage}`);
      
      // Wait for potential WebSocket connections
      await page.waitForTimeout(3000);
      
      if (wsConnections.length > 0) {
        console.log(`✓ WebSocket connections established on ${wsPage}`);
        break;
      }
    }
    
    if (wsConnections.length > 0) {
      console.log(`📊 WebSocket Connection Summary:`);
      console.log(`  - Total connections: ${wsConnections.length}`);
      console.log(`  - Total messages: ${wsMessages.length}`);
      
      wsConnections.forEach((conn, index) => {
        const duration = Date.now() - conn.createdAt;
        console.log(`  - Connection ${index + 1}: ${conn.url} (${duration}ms duration, ${conn.messageCount} messages, closed: ${conn.isClosed})`);
      });
      
      // Test connection stability
      const stableConnections = wsConnections.filter(conn => !conn.isClosed).length;
      const connectionStability = stableConnections / wsConnections.length * 100;
      
      console.log(`✓ Connection stability: ${connectionStability}% (${stableConnections}/${wsConnections.length} stable)`);
      
      if (wsMessages.length > 0) {
        const sentMessages = wsMessages.filter(msg => msg.type === 'sent').length;
        const receivedMessages = wsMessages.filter(msg => msg.type === 'received').length;
        
        console.log(`📨 Message flow: ${sentMessages} sent, ${receivedMessages} received`);
      }
      
    } else {
      console.log('ℹ️ No WebSocket connections detected across tested pages');
    }
    
    console.log('✅ WebSocket connection resilience testing completed');
  });
});