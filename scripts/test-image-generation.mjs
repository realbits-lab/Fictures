#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

const client = postgres(process.env.POSTGRES_URL, { prepare: false });

async function generateImagesForStory() {
  try {
    const storyId = 'DvivaQJdvv8hekcrK93Pe';
    console.log('🎨 Testing image generation for story:', storyId, '\n');

    // Get characters
    const characters = await client`
      SELECT * FROM characters WHERE story_id = ${storyId}
    `;

    console.log('👥 Generating images for characters:');
    console.log('=====================================');

    for (const char of characters) {
      console.log(`\n📸 Generating image for: ${char.name}`);

      // Create image prompt
      const prompt = `Portrait of ${char.name}, ${char.summary || char.role || 'character'}.
        ${char.description || ''}. Professional photography style, detailed, fantasy book character.`;

      console.log('Prompt:', prompt);

      // Call the image generation API with API key
      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
          },
          body: JSON.stringify({
            prompt: prompt,
            type: 'character',
            storyId: storyId,
            internal: false
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Image generated successfully!');
          console.log('   URL:', result.imageUrl);
          console.log('   Method:', result.method);

          // Update character with image URL
          await client`
            UPDATE characters
            SET image_url = ${result.imageUrl}, updated_at = NOW()
            WHERE id = ${char.id}
          `;
          console.log('   Database updated!');
        } else {
          console.log('❌ Failed to generate image:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling API:', error.message);
      }
    }

    // Get settings
    const settings = await client`
      SELECT * FROM settings WHERE story_id = ${storyId}
    `;

    console.log('\n\n🏛️ Generating images for settings:');
    console.log('=====================================');

    for (const setting of settings) {
      console.log(`\n📸 Generating image for: ${setting.name}`);

      // Create image prompt
      const prompt = `Landscape view of ${setting.name}, ${setting.description || 'magical location'}.
        ${setting.mood || ''}. Fantasy setting, atmospheric, detailed environment art.`;

      console.log('Prompt:', prompt);

      // Call the image generation API
      try {
        const response = await fetch('http://localhost:3000/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
          },
          body: JSON.stringify({
            prompt: prompt,
            type: 'place',
            storyId: storyId,
            internal: false
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Image generated successfully!');
          console.log('   URL:', result.imageUrl);
          console.log('   Method:', result.method);

          // Update setting with image URL
          await client`
            UPDATE settings
            SET image_url = ${result.imageUrl}, updated_at = NOW()
            WHERE id = ${setting.id}
          `;
          console.log('   Database updated!');
        } else {
          console.log('❌ Failed to generate image:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling API:', error.message);
      }
    }

    console.log('\n\n✅ Image generation test completed!');

    // Verify updates
    const updatedChars = await client`
      SELECT name, image_url FROM characters WHERE story_id = ${storyId}
    `;

    const updatedSettings = await client`
      SELECT name, image_url FROM settings WHERE story_id = ${storyId}
    `;

    console.log('\n📊 Final Status:');
    console.log('================');
    console.log('Characters with images:', updatedChars.filter(c => c.image_url).length, '/', updatedChars.length);
    console.log('Settings with images:', updatedSettings.filter(s => s.image_url).length, '/', updatedSettings.length);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

generateImagesForStory();