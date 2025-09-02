import { db } from '@/lib/db';
import { stories, parts, chapters, scenes } from '@/lib/db/schema';

async function clearAllStoryData() {
  try {
    console.log('🗑️ Clearing all story data...');

    // Delete in correct order due to foreign key constraints
    console.log('Deleting scenes...');
    await db.delete(scenes);
    
    console.log('Deleting chapters...');
    await db.delete(chapters);
    
    console.log('Deleting parts...');
    await db.delete(parts);
    
    console.log('Deleting stories...');
    await db.delete(stories);

    console.log('✅ All story data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing story data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  clearAllStoryData()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { clearAllStoryData };