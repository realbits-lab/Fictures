import postgres from 'postgres';
import { del, list } from '@vercel/blob';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const sql = postgres(process.env.POSTGRES_URL);

async function deleteChronoFracture() {
  try {
    console.log('🔍 Finding Chrono-Fracture story...');

    // Find the story
    const stories = await sql`
      SELECT id, title FROM stories
      WHERE title ILIKE '%Chrono-Fracture%'
    `;

    if (stories.length === 0) {
      console.log('⚠️  Story "Chrono-Fracture" not found');
      await sql.end();
      return;
    }

    const story = stories[0];
    console.log(`✅ Found story: ${story.title} (ID: ${story.id})`);

    // Find all related images
    console.log('\n🔍 Finding related images...');

    const characterImages = await sql`
      SELECT id, image_url, visual_reference_id
      FROM characters
      WHERE story_id = ${story.id}
      AND (image_url IS NOT NULL OR visual_reference_id IS NOT NULL)
    `;

    const placeImages = await sql`
      SELECT id, image_url
      FROM places
      WHERE story_id = ${story.id}
      AND image_url IS NOT NULL
    `;

    console.log(`📸 Found ${characterImages.length} character images`);
    console.log(`📸 Found ${placeImages.length} place images`);

    const allImageUrls = [
      ...characterImages.flatMap(c => [c.image_url, c.visual_reference_id]),
      ...placeImages.map(p => p.image_url)
    ].filter(Boolean);

    console.log(`📸 Total images to delete: ${allImageUrls.length}`);

    // Delete images from Vercel Blob
    if (allImageUrls.length > 0) {
      console.log('\n🗑️  Deleting images from Vercel Blob...');
      for (const imageUrl of allImageUrls) {
        try {
          await del(imageUrl);
          console.log(`   ✓ Deleted: ${imageUrl}`);
        } catch (error) {
          console.error(`   ✗ Failed to delete ${imageUrl}:`, error.message);
        }
      }
    }

    // Delete all related records from database
    console.log('\n🗑️  Deleting database records...');

    // Delete characters
    const characters = await sql`
      DELETE FROM characters
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${characters.length} characters`);

    // Delete places
    const places = await sql`
      DELETE FROM places
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${places.length} places`);

    // Delete scenes (via chapter_id)
    const scenes = await sql`
      DELETE FROM scenes
      WHERE chapter_id IN (
        SELECT id FROM chapters WHERE story_id = ${story.id}
      )
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${scenes.length} scenes`);

    // Delete chapters
    const chapters = await sql`
      DELETE FROM chapters
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${chapters.length} chapters`);

    // Delete parts
    const parts = await sql`
      DELETE FROM parts
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${parts.length} parts`);

    // Delete community posts
    const communityPosts = await sql`
      DELETE FROM community_posts
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${communityPosts.length} community posts`);

    // Delete comments
    const comments = await sql`
      DELETE FROM comments
      WHERE story_id = ${story.id}
      RETURNING id
    `;
    console.log(`   ✓ Deleted ${comments.length} comments`);

    // Delete the story itself
    await sql`
      DELETE FROM stories
      WHERE id = ${story.id}
    `;
    console.log(`   ✓ Deleted story: ${story.title}`);

    console.log('\n✅ Successfully deleted Chrono-Fracture story and all related data!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

deleteChronoFracture();
