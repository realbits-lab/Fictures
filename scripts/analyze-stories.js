const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { stories, parts, chapters, scenes, users } = require('../src/lib/db/schema');
const { eq } = require('drizzle-orm');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function analyzeStories() {
  // Initialize database connection
  const client = postgres(process.env.POSTGRES_URL);
  const db = drizzle(client);

  try {
    console.log('📊 Analyzing current database state...\n');

    // Get all stories
    const allStories = await db.select().from(stories);
    console.log(`Found ${allStories.length} stories:`);
    
    for (const story of allStories) {
      console.log(`\n📖 Story: "${story.title}" (ID: ${story.id})`);
      console.log(`   Status: ${story.status}, Public: ${story.isPublic}`);
      console.log(`   Word Count: ${story.currentWordCount}/${story.targetWordCount}`);
      
      // Get parts for this story
      const storyParts = await db.select().from(parts).where(eq(parts.storyId, story.id));
      console.log(`   📚 Parts: ${storyParts.length}`);
      
      for (const part of storyParts) {
        console.log(`      Part: "${part.title}" (Status: ${part.status})`);
        
        // Get chapters in this part
        const partChapters = await db.select().from(chapters).where(eq(chapters.partId, part.id));
        console.log(`         📄 Chapters in part: ${partChapters.length}`);
        
        for (const chapter of partChapters) {
          console.log(`            Chapter: "${chapter.title}" (Status: ${chapter.status}, Words: ${chapter.wordCount})`);
          
          // Get scenes in this chapter
          const chapterScenes = await db.select().from(scenes).where(eq(scenes.chapterId, chapter.id));
          console.log(`               🎬 Scenes: ${chapterScenes.length}`);
          
          for (const scene of chapterScenes) {
            const contentLength = scene.content ? scene.content.length : 0;
            console.log(`                  Scene: "${scene.title}" (Status: ${scene.status}, Content: ${contentLength} chars, Words: ${scene.wordCount})`);
          }
        }
      }
      
      // Get standalone chapters (not in parts)
      const standaloneChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id)).where(eq(chapters.partId, null));
      console.log(`   📄 Standalone Chapters: ${standaloneChapters.length}`);
      
      for (const chapter of standaloneChapters) {
        console.log(`      Chapter: "${chapter.title}" (Status: ${chapter.status}, Words: ${chapter.wordCount})`);
        
        // Get scenes in this chapter
        const chapterScenes = await db.select().from(scenes).where(eq(scenes.chapterId, chapter.id));
        console.log(`         🎬 Scenes: ${chapterScenes.length}`);
        
        for (const scene of chapterScenes) {
          const contentLength = scene.content ? scene.content.length : 0;
          console.log(`            Scene: "${scene.title}" (Status: ${scene.status}, Content: ${contentLength} chars, Words: ${scene.wordCount})`);
        }
      }
    }

    // Summary statistics
    console.log('\n📊 Summary Statistics:');
    const allParts = await db.select().from(parts);
    const allChapters = await db.select().from(chapters);
    const allScenes = await db.select().from(scenes);
    
    console.log(`Total Stories: ${allStories.length}`);
    console.log(`Total Parts: ${allParts.length}`);
    console.log(`Total Chapters: ${allChapters.length}`);
    console.log(`Total Scenes: ${allScenes.length}`);
    
    // Count by status
    const sceneStatuses = {};
    const chapterStatuses = {};
    const partStatuses = {};
    
    allScenes.forEach(scene => {
      sceneStatuses[scene.status] = (sceneStatuses[scene.status] || 0) + 1;
    });
    
    allChapters.forEach(chapter => {
      chapterStatuses[chapter.status] = (chapterStatuses[chapter.status] || 0) + 1;
    });
    
    allParts.forEach(part => {
      partStatuses[part.status] = (partStatuses[part.status] || 0) + 1;
    });
    
    console.log('\nScene Status Distribution:', sceneStatuses);
    console.log('Chapter Status Distribution:', chapterStatuses);
    console.log('Part Status Distribution:', partStatuses);
    
  } catch (error) {
    console.error('Error analyzing stories:', error);
  } finally {
    await client.end();
  }
}

analyzeStories();