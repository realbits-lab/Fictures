#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function deleteAllStories() {
  try {
    console.log('🗑️  Deleting all stories via API...\n');

    // First, get all stories
    const response = await fetch('http://localhost:3000/api/stories', {
      headers: {
        'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
      }
    });

    if (!response.ok) {
      console.log('⚠️  Could not fetch stories. Will attempt database query directly.');

      // Use database query endpoint
      const dbResponse = await fetch('http://localhost:3000/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
        },
        body: JSON.stringify({
          query: 'DELETE FROM stories'
        })
      });

      if (dbResponse.ok) {
        const result = await dbResponse.json();
        console.log('✅ Deleted all stories via database query');
      } else {
        console.log('❌ Failed to delete stories');
      }
      return;
    }

    const data = await response.json();
    const stories = data.stories || data || [];
    console.log(`📚 Found ${stories.length} stories to delete\n`);

    if (!Array.isArray(stories) || stories.length === 0) {
      console.log('✅ No stories to delete');
      return;
    }

    // Delete each story
    for (const story of stories) {
      console.log(`🔥 Deleting: ${story.title} (${story.id})`);

      const deleteResponse = await fetch(`http://localhost:3000/api/stories/${story.id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': 'fic_g3Nmd7FfNoDS_g3Nmd7FfNoDSCuEV3e3QhhE6yu9mRML3Gm-bGcwBA2A'
        }
      });

      if (deleteResponse.ok) {
        console.log(`   ✅ Deleted successfully`);
      } else {
        console.log(`   ❌ Failed to delete`);
      }
    }

    console.log('\n✅ Cleanup completed!');
    console.log('\n⚠️  Note: Vercel Blob storage images may still exist. Manual cleanup may be required.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Execute
deleteAllStories().then(() => {
  process.exit(0);
});