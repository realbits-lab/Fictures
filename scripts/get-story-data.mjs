#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL, { prepare: false });

async function getStoryData() {
  try {
    const storyId = 'DvivaQJdvv8hekcrK93Pe';
    console.log('🔍 Fetching data for story:', storyId, '\n');

    // Get story details
    const [story] = await client`
      SELECT * FROM stories WHERE id = ${storyId}
    `;

    console.log('📚 Story Details:');
    console.log('================');
    console.log('Title:', story.title);
    console.log('Genre:', story.genre);
    console.log('Status:', story.status);
    console.log('HNS Data:', story.hns_data ? 'Present' : 'Not present');

    if (story.hns_data) {
      // Save HNS data to file for inspection
      fs.writeFileSync('/tmp/story-hns-data.json', JSON.stringify(story.hns_data, null, 2));
      console.log('HNS data saved to /tmp/story-hns-data.json');
    }

    // Get characters
    const characters = await client`
      SELECT * FROM characters WHERE story_id = ${storyId}
    `;

    console.log('\n👥 Characters:');
    console.log('==============');
    characters.forEach(char => {
      console.log(`- ${char.name} (${char.role})`);
      console.log(`  ID: ${char.id}`);
      console.log(`  Has image URL: ${char.image_url ? 'Yes' : 'No'}`);
      if (char.image_url) {
        console.log(`  Image URL: ${char.image_url}`);
      }
    });

    // Get settings
    const settings = await client`
      SELECT * FROM settings WHERE story_id = ${storyId}
    `;

    console.log('\n🏛️ Settings:');
    console.log('============');
    settings.forEach(setting => {
      console.log(`- ${setting.name}`);
      console.log(`  ID: ${setting.id}`);
      console.log(`  Has image URL: ${setting.image_url ? 'Yes' : 'No'}`);
      if (setting.image_url) {
        console.log(`  Image URL: ${setting.image_url}`);
      }
    });

    // Get parts
    const parts = await client`
      SELECT id, title, hns_data FROM parts WHERE story_id = ${storyId}
    `;

    console.log('\n📑 Parts:');
    console.log('=========');
    parts.forEach(part => {
      console.log(`- ${part.title}`);
      console.log(`  ID: ${part.id}`);
      console.log(`  Has HNS data: ${part.hns_data ? 'Yes' : 'No'}`);
    });

    // Save full story data to JSON
    const fullData = {
      story,
      characters,
      settings,
      parts
    };

    fs.writeFileSync('/tmp/full-story-data.json', JSON.stringify(fullData, null, 2));
    console.log('\n✅ Full data saved to /tmp/full-story-data.json');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

getStoryData();