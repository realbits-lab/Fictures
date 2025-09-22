#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';
import { list } from '@vercel/blob';

// Load environment variables
config({ path: '.env.local' });

const sql = postgres(process.env.POSTGRES_URL);

const STORY_ID = 'Y_nJbYLWIuPI7piuRDn_s';

async function verifyHNSStory(storyId) {
  try {
    console.log(`🔍 Verifying HNS story: ${storyId}\n`);

    // 1. Verify story structure (3 parts, 1 chapter per part, 1 scene per chapter)
    console.log('📊 STEP 1: Verifying story structure...');
    console.log('==========================================');

    // Get story details
    const story = await sql`
      SELECT id, title, status, author_id, created_at
      FROM stories
      WHERE id = ${storyId}
    `;

    if (story.length === 0) {
      throw new Error(`Story with ID ${storyId} not found`);
    }

    console.log(`✅ Story found: "${story[0].title}" (Status: ${story[0].status})`);

    // Get parts
    const parts = await sql`
      SELECT id, title, order_index
      FROM parts
      WHERE story_id = ${storyId}
      ORDER BY order_index
    `;

    console.log(`📖 Parts: ${parts.length} found`);
    if (parts.length !== 3) {
      console.log(`❌ Expected 3 parts, but found ${parts.length}`);
      return false;
    }

    let totalChapters = 0;
    let totalScenes = 0;
    let structureValid = true;

    for (const part of parts) {
      console.log(`   Part ${part.order_index + 1}: "${part.title}"`);

      // Get chapters for this part
      const chapters = await sql`
        SELECT id, title, order_index
        FROM chapters
        WHERE part_id = ${part.id}
        ORDER BY order_index
      `;

      console.log(`      Chapters: ${chapters.length}`);
      if (chapters.length !== 1) {
        console.log(`      ❌ Expected 1 chapter per part, but found ${chapters.length}`);
        structureValid = false;
      }

      totalChapters += chapters.length;

      for (const chapter of chapters) {
        console.log(`         Chapter ${chapter.order_index + 1}: "${chapter.title}"`);

        // Get scenes for this chapter
        const scenes = await sql`
          SELECT id, title, content, order_index
          FROM scenes
          WHERE chapter_id = ${chapter.id}
          ORDER BY order_index
        `;

        console.log(`            Scenes: ${scenes.length}`);
        if (scenes.length !== 1) {
          console.log(`            ❌ Expected 1 scene per chapter, but found ${scenes.length}`);
          structureValid = false;
        }

        totalScenes += scenes.length;

        // Check scene content (requirement 4)
        for (const scene of scenes) {
          console.log(`               Scene ${scene.order_index + 1}: "${scene.title}"`);

          if (!scene.content || scene.content.trim().length === 0) {
            console.log(`               ❌ Scene has no content`);
            structureValid = false;
          } else if (scene.content.toLowerCase().includes('placeholder') ||
                     scene.content.toLowerCase().includes('todo') ||
                     scene.content.length < 100) {
            console.log(`               ❌ Scene appears to have placeholder content`);
            console.log(`               Content preview: ${scene.content.substring(0, 200)}...`);
            structureValid = false;
          } else {
            console.log(`               ✅ Scene has real content (${scene.content.length} chars)`);
            console.log(`               Preview: ${scene.content.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Parts: ${parts.length} (Expected: 3)`);
    console.log(`   Chapters: ${totalChapters} (Expected: 3)`);
    console.log(`   Scenes: ${totalScenes} (Expected: 3)`);

    if (!structureValid) {
      console.log(`❌ Story structure validation failed`);
      return false;
    }

    console.log(`✅ Story structure validation passed\n`);

    // 2. Verify characters and their images
    console.log('👥 STEP 2: Verifying characters and images...');
    console.log('===============================================');

    const characters = await sql`
      SELECT id, name, description, image_url
      FROM characters
      WHERE story_id = ${storyId}
      ORDER BY created_at
    `;

    console.log(`Characters found: ${characters.length}`);

    let charactersValid = true;
    const characterImageUrls = [];

    for (const character of characters) {
      console.log(`   Character: "${character.name}"`);
      console.log(`      Description: ${character.description?.substring(0, 100)}...`);

      if (character.image_url) {
        console.log(`      Image URL: ${character.image_url}`);
        characterImageUrls.push(character.image_url);
      } else {
        console.log(`      ❌ No image URL found`);
        charactersValid = false;
      }
    }

    // 3. Verify settings and their images
    console.log('\n🏞️  STEP 3: Verifying settings and images...');
    console.log('==============================================');

    const settings = await sql`
      SELECT id, name, description, image_url
      FROM settings
      WHERE story_id = ${storyId}
      ORDER BY created_at
    `;

    console.log(`Settings found: ${settings.length}`);

    let settingsValid = true;
    const settingImageUrls = [];

    for (const setting of settings) {
      console.log(`   Setting: "${setting.name}"`);
      console.log(`      Description: ${setting.description?.substring(0, 100)}...`);

      if (setting.image_url) {
        console.log(`      Image URL: ${setting.image_url}`);
        settingImageUrls.push(setting.image_url);
      } else {
        console.log(`      ❌ No image URL found`);
        settingsValid = false;
      }
    }

    // 4. Verify Vercel Blob storage
    console.log('\n☁️  STEP 4: Verifying Vercel Blob storage...');
    console.log('=============================================');

    try {
      const response = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log(`Total blobs in storage: ${response.blobs.length}`);

      // Filter for story-related blobs
      const storyBlobs = response.blobs.filter(blob =>
        blob.pathname.includes(storyId) ||
        blob.pathname.includes('story') ||
        blob.pathname.includes('character') ||
        blob.pathname.includes('setting')
      );

      console.log(`Story-related blobs: ${storyBlobs.length}`);

      if (storyBlobs.length > 0) {
        console.log('\n📁 Found blobs:');
        storyBlobs.forEach(blob => {
          console.log(`   - ${blob.pathname}`);
          console.log(`     URL: ${blob.url}`);
          console.log(`     Size: ${(blob.size / 1024).toFixed(2)} KB`);
          console.log(`     Uploaded: ${new Date(blob.uploadedAt).toLocaleString()}`);
        });
      }

      // 5. Check matching between DB and Vercel blob links
      console.log('\n🔗 STEP 5: Checking DB and Vercel blob link matching...');
      console.log('========================================================');

      let linkMatchingValid = true;
      const allImageUrls = [...characterImageUrls, ...settingImageUrls];

      console.log(`Image URLs to verify: ${allImageUrls.length}`);

      for (const imageUrl of allImageUrls) {
        if (imageUrl) {
          // Check if the URL exists in blob storage
          const matchingBlob = response.blobs.find(blob => blob.url === imageUrl);

          if (matchingBlob) {
            console.log(`   ✅ ${imageUrl} - Found in blob storage`);
          } else {
            console.log(`   ❌ ${imageUrl} - NOT found in blob storage`);
            linkMatchingValid = false;
          }
        }
      }

      // Final validation summary
      console.log('\n🎯 FINAL VALIDATION SUMMARY');
      console.log('============================');
      console.log(`✅ Story structure (3 parts, 1 chapter each, 1 scene each): ${structureValid}`);
      console.log(`✅ Scene content validation: ${structureValid}`);
      console.log(`✅ Characters with images: ${charactersValid}`);
      console.log(`✅ Settings with images: ${settingsValid}`);
      console.log(`✅ DB-Blob link matching: ${linkMatchingValid}`);

      const overallValid = structureValid && charactersValid && settingsValid && linkMatchingValid;

      if (overallValid) {
        console.log('\n🎉 ALL VALIDATIONS PASSED! Story is complete and properly structured.');
        return true;
      } else {
        console.log('\n❌ SOME VALIDATIONS FAILED. Story needs fixes.');
        return false;
      }

    } catch (blobError) {
      console.error('❌ Error checking Vercel Blob storage:', blobError);
      return false;
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  } finally {
    await sql.end();
  }
}

// Execute verification
verifyHNSStory(STORY_ID)
  .then((isValid) => {
    if (isValid) {
      console.log('\n✨ Story verification completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💭 Story verification revealed issues. Fixes needed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal verification error:', error);
    process.exit(1);
  });