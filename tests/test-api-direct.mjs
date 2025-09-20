#!/usr/bin/env node

/**
 * Test API directly to see what's stored in database
 */

import fetch from 'node-fetch';

async function testApiDirect() {
  console.log('🔍 Testing API directly to check stored data...\n');

  try {
    // Call the GET API to see what's currently stored
    const response = await fetch('http://localhost:3000/api/stories/vKuq7d7oVKDi3pCW5Wllf/write', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log('❌ API call failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();

    console.log('📊 API Response Analysis:');
    console.log('  • Story ID:', data.story?.id);
    console.log('  • Story Title:', data.story?.title);
    console.log('  • Last Updated:', data.story?.updatedAt);

    if (data.story?.storyData) {
      const storyData = data.story.storyData;

      console.log('\n📋 Story Data Analysis:');

      // Check chars
      if (storyData.chars && typeof storyData.chars === 'object') {
        const charCount = Object.keys(storyData.chars).length;
        console.log(`  • Characters: ${charCount} properties`);
        if (charCount > 0) {
          console.log('    Keys:', Object.keys(storyData.chars).slice(0, 5).join(', '));
        }
      } else {
        console.log('  • Characters: Empty or undefined');
      }

      // Check parts
      if (storyData.parts && Array.isArray(storyData.parts)) {
        console.log(`  • Parts: ${storyData.parts.length} items`);
        if (storyData.parts.length > 0) {
          console.log('    Sample part:', storyData.parts[0]?.title || 'No title');
        }
      } else {
        console.log('  • Parts: Empty or undefined');
      }

      // Check serial
      if (storyData.serial && typeof storyData.serial === 'object') {
        const serialKeys = Object.keys(storyData.serial).length;
        console.log(`  • Serial: ${serialKeys} properties`);
        if (serialKeys > 0) {
          console.log('    Keys:', Object.keys(storyData.serial).slice(0, 5).join(', '));
        }
      } else {
        console.log('  • Serial: Empty or undefined');
      }

      // Check hooks
      if (storyData.hooks && typeof storyData.hooks === 'object') {
        const hooksKeys = Object.keys(storyData.hooks).length;
        console.log(`  • Hooks: ${hooksKeys} properties`);
        if (hooksKeys > 0) {
          console.log('    Keys:', Object.keys(storyData.hooks).slice(0, 5).join(', '));
        }
      } else {
        console.log('  • Hooks: Empty or undefined');
      }

      // Show raw data sample
      console.log('\n📄 Raw Story Data (first 300 chars):');
      console.log(JSON.stringify(storyData, null, 2).substring(0, 300) + '...');

    } else {
      console.log('\n❌ No storyData found in API response');
    }

    // Also check characters and places arrays
    console.log('\n📊 Characters & Places:');
    console.log(`  • Characters: ${data.characters?.length || 0} found`);
    console.log(`  • Places: ${data.places?.length || 0} found`);

    if (data.characters?.length > 0) {
      console.log('    Character names:', data.characters.map(c => c.name).slice(0, 3).join(', '));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApiDirect();