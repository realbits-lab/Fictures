#!/usr/bin/env node

// Script to remove all stories and related data, then generate a new story
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

async function cleanupAndRegenerate() {
  console.log('🧹 Story Database Cleanup & Regeneration');
  console.log('=======================================');

  try {
    // Step 1: Clean up all story data
    console.log('\n📍 STEP 1: Cleaning up all story data...');
    console.log('──────────────────────────────────────');

    const cleanupResponse = await fetch(`${API_BASE}/api/stories/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    if (!cleanupResponse.ok) {
      // If cleanup endpoint doesn't exist, we'll continue anyway
      console.log('⚠️  No cleanup endpoint available, continuing...');
    } else {
      console.log('✅ Database cleanup completed');
    }

    // Step 2: Wait a moment for cleanup to complete
    console.log('\n📍 STEP 2: Waiting for cleanup to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Generate a fresh new story
    console.log('\n📍 STEP 3: Generating fresh new story...');
    console.log('────────────────────────────────────────');

    const generateResponse = await fetch(`${API_BASE}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: "A thrilling adventure story about discovering hidden secrets in an ancient library",
        language: "English",
        enableQualityImprovement: false // Use default fast generation
      })
    });

    if (!generateResponse.ok) {
      throw new Error(`Story generation failed: ${generateResponse.status}`);
    }

    console.log('✅ New story generation started successfully');
    console.log('\n🎯 PROCESS COMPLETED');
    console.log('===================');
    console.log('✓ Database cleaned (if cleanup endpoint available)');
    console.log('✓ Fresh story generation initiated');
    console.log('');
    console.log('Monitor the server logs to track story generation progress.');
    console.log('The new story should complete generation shortly.');

  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

cleanupAndRegenerate().catch(console.error);