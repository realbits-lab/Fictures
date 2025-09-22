#!/usr/bin/env node

import { config } from 'dotenv';
import pkg from '../node_modules/@neondatabase/serverless/index.mjs';
const { neon } = pkg;

// Load environment variables
config({ path: '.env.local' });

const STORY_ID = 'DvivaQJdvv8hekcrK93Pe'; // The Midnight Library of Whispers

async function generateImagesForStory() {
  try {
    console.log('📚 Generating images for "The Midnight Library of Whispers"');
    console.log('=====================================\n');

    // Get story data from database
    const client = neon(process.env.POSTGRES_URL);

    const story = await client`
      SELECT * FROM stories WHERE id = ${STORY_ID}
    `.then(res => res[0]);

    if (!story) {
      console.error('❌ Story not found');
      return;
    }

    console.log(`📖 Story: ${story.title}`);
    console.log(`📝 Description: ${story.synopsis}\n`);

    // Get characters and settings
    const characters = await client`
      SELECT id, name, description FROM characters
      WHERE story_id = ${STORY_ID}
    `;

    const settings = await client`
      SELECT id, name, description FROM settings
      WHERE story_id = ${STORY_ID}
    `;

    console.log(`👥 Found ${characters.length} characters`);
    console.log(`📍 Found ${settings.length} settings\n`);

    const API_KEY = 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A';

    // Generate images for characters
    for (const character of characters) {
      console.log(`\n🎭 Generating image for character: ${character.name}`);
      console.log(`   Description: ${character.description?.substring(0, 100)}...`);

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            prompt: character.description || character.name,
            type: 'character',
            storyId: STORY_ID,
            internal: false
          })
        });

        const result = await response.json();
        const elapsed = Date.now() - startTime;

        if (result.success) {
          console.log(`   ✅ Success! (${elapsed}ms)`);
          console.log(`   📍 Method: ${result.method}`);
          console.log(`   🔗 Image URL: ${result.imageUrl}`);

          // Update character with image URL
          if (result.imageUrl && !result.imageUrl.includes('picsum')) {
            await client`
              UPDATE characters
              SET image_url = ${result.imageUrl}
              WHERE id = ${character.id}
            `;
            console.log(`   💾 Saved to database`);
          }
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
      }
    }

    // Generate images for settings
    for (const setting of settings) {
      console.log(`\n🏛️ Generating image for setting: ${setting.name}`);
      console.log(`   Description: ${setting.description?.substring(0, 100)}...`);

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            prompt: setting.description || setting.name,
            type: 'place',
            storyId: STORY_ID,
            internal: false
          })
        });

        const result = await response.json();
        const elapsed = Date.now() - startTime;

        if (result.success) {
          console.log(`   ✅ Success! (${elapsed}ms)`);
          console.log(`   📍 Method: ${result.method}`);
          console.log(`   🔗 Image URL: ${result.imageUrl}`);

          // Update setting with image URL
          if (result.imageUrl && !result.imageUrl.includes('picsum')) {
            await client`
              UPDATE settings
              SET image_url = ${result.imageUrl}
              WHERE id = ${setting.id}
            `;
            console.log(`   💾 Saved to database`);
          }
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
      }
    }

    // Check Vercel Blob storage
    console.log('\n\n📦 Checking Vercel Blob Storage');
    console.log('=====================================');

    const updatedCharacters = await client`
      SELECT name, image_url FROM characters
      WHERE story_id = ${STORY_ID} AND image_url IS NOT NULL
    `;

    const updatedSettings = await client`
      SELECT name, image_url FROM settings
      WHERE story_id = ${STORY_ID} AND image_url IS NOT NULL
    `;

    const blobImages = [...updatedCharacters, ...updatedSettings].filter(
      item => item.image_url && item.image_url.includes('blob.vercel-storage.com')
    );

    console.log(`✅ ${blobImages.length} images stored in Vercel Blob`);

    if (blobImages.length > 0) {
      console.log('\n📸 Generated Blob URLs:');
      blobImages.forEach(item => {
        console.log(`   ${item.name}: ${item.image_url}`);
      });
    }

    console.log('\n✅ Image generation completed for "The Midnight Library of Whispers"!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

generateImagesForStory();