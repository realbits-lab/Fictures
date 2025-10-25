#!/usr/bin/env node

import { readFileSync } from 'fs';
import { appendFileSync } from 'fs';

const LOG_FILE = 'logs/test-story-generation.log';
const ERROR_LOG_FILE = 'logs/story-generation-errors.log';

let lastSize = 0;
let errorCount = 0;

console.log('📊 Monitoring story generation...\n');

const interval = setInterval(() => {
  try {
    const stats = readFileSync(LOG_FILE, 'utf-8');
    const currentSize = stats.length;

    if (currentSize > lastSize) {
      const newContent = stats.slice(lastSize);
      process.stdout.write(newContent);

      // Check for errors
      if (newContent.includes('❌') || newContent.includes('Error') || newContent.includes('Failed')) {
        errorCount++;
        const timestamp = new Date().toISOString();
        appendFileSync(ERROR_LOG_FILE, `\n[${timestamp}] ERROR DETECTED:\n${newContent}\n---\n`);
      }

      // Check for completion
      if (newContent.includes('✅ Story published successfully') ||
          newContent.includes('Story generation completed')) {
        console.log('\n\n✅ Story generation completed!');
        console.log(`📊 Total errors detected: ${errorCount}`);
        clearInterval(interval);
        process.exit(0);
      }

      lastSize = currentSize;
    }
  } catch (error) {
    // File might not exist yet
  }
}, 1000);

// Stop after 30 minutes
setTimeout(() => {
  console.log('\n⏱️  Monitoring timeout (30 minutes)');
  clearInterval(interval);
  process.exit(0);
}, 30 * 60 * 1000);
