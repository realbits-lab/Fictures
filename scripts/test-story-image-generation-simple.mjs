#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const STORY_ID = 'DvivaQJdvv8hekcrK93Pe'; // The Midnight Library of Whispers
const API_KEY = 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A';

async function generateImagesForStory() {
  try {
    console.log('📚 Generating images for "The Midnight Library of Whispers"');
    console.log('=====================================\n');

    // Test characters based on the story data
    const characters = [
      {
        name: 'Keeper Elara Nightingale',
        description: 'An enigmatic guardian with silver hair that flows like moonlight, dressed in robes woven from shadows and stardust. Her eyes hold the wisdom of countless whispered secrets.'
      },
      {
        name: 'Silas Ravencroft',
        description: 'A mysterious scholar with piercing blue eyes and raven-black hair. He wears a long dark coat with hidden pockets containing fragments of forgotten tales.'
      }
    ];

    // Test settings
    const settings = [
      {
        name: 'The Midnight Library',
        description: 'A vast ethereal library existing between dreams and reality, with towering shelves made of crystallized moonbeams and books that whisper their contents to visitors'
      },
      {
        name: 'The Archive of Lost Voices',
        description: 'A hidden chamber deep within the library where echoes of forgotten conversations are preserved in glass orbs that glow with soft, pulsing light'
      }
    ];

    const results = {
      characters: [],
      settings: []
    };

    // Generate images for characters
    console.log('👥 Generating character images...\n');
    for (const character of characters) {
      console.log(`🎭 Generating image for: ${character.name}`);
      console.log(`   Prompt: ${character.description.substring(0, 80)}...`);

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            prompt: character.description,
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

          results.characters.push({
            name: character.name,
            url: result.imageUrl,
            method: result.method
          });
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
      }
      console.log();
    }

    // Generate images for settings
    console.log('📍 Generating setting images...\n');
    for (const setting of settings) {
      console.log(`🏛️ Generating image for: ${setting.name}`);
      console.log(`   Prompt: ${setting.description.substring(0, 80)}...`);

      const startTime = Date.now();

      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify({
            prompt: setting.description,
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

          results.settings.push({
            name: setting.name,
            url: result.imageUrl,
            method: result.method
          });
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`   ❌ Error:`, error.message);
      }
      console.log();
    }

    // Summary
    console.log('📊 Summary');
    console.log('=====================================');

    const blobImages = [
      ...results.characters,
      ...results.settings
    ].filter(item => item.url && item.url.includes('blob.vercel-storage.com'));

    const placeholderImages = [
      ...results.characters,
      ...results.settings
    ].filter(item => item.url && item.url.includes('picsum'));

    console.log(`✅ Total images generated: ${results.characters.length + results.settings.length}`);
    console.log(`   📦 Vercel Blob images: ${blobImages.length}`);
    console.log(`   🖼️ Placeholder images: ${placeholderImages.length}`);

    if (blobImages.length > 0) {
      console.log('\n📸 Successfully uploaded to Vercel Blob:');
      blobImages.forEach(item => {
        console.log(`   ${item.name}`);
        console.log(`   └─ ${item.url}`);
      });
    }

    console.log('\n✅ Image generation test completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

generateImagesForStory();