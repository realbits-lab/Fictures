#!/usr/bin/env node

// Cleanup via API endpoint
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const API_KEY = authData.managerCredentials.apiKey;

const API_BASE = 'http://localhost:3000';

async function cleanupDatabase() {
  console.log('🧹 Cleanup Database via API');
  console.log('===========================');

  try {
    console.log('\n📍 Calling cleanup API endpoint...');

    const response = await fetch(`${API_BASE}/api/stories/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Cleanup failed: ${response.status} - ${error.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Cleanup completed:', result.message);

    return true;

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    return false;
  }
}

cleanupDatabase().catch(console.error);