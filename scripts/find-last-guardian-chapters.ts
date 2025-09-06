#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories, chapters, scenes } from '../src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function findLastGuardianChapters() {
  try {
    // Find "The Last Guardian" story
    console.log('🔍 Searching for "The Last Guardian" story...');
    
    const guardianStories = await db
      .select()
      .from(stories)
      .where(eq(stories.title, 'The Last Guardian'));
    
    if (guardianStories.length === 0) {
      console.log('❌ No story found with title "The Last Guardian"');
      process.exit(1);
    }
    
    const story = guardianStories[0];
    console.log(`✅ Found story: "${story.title}" (ID: ${story.id})`);
    console.log(`   Author ID: ${story.authorId}`);
    console.log(`   Status: ${story.status}`);
    console.log(`   Created: ${story.createdAt}`);
    console.log('');
    
    // Find all chapters for this story
    console.log('📚 Finding all chapters for "The Last Guardian"...');
    
    const allChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, story.id))
      .orderBy(chapters.orderIndex);
    
    console.log(`Found ${allChapters.length} chapters total:`);
    console.log('');
    
    // Display all chapters with their details
    for (const chapter of allChapters) {
      console.log(`📖 Chapter ${chapter.orderIndex}: "${chapter.title}"`);
      console.log(`   ID: ${chapter.id}`);
      console.log(`   Status: ${chapter.status}`);
      console.log(`   Word Count: ${chapter.wordCount}`);
      console.log(`   Created: ${chapter.createdAt}`);
      console.log(`   Updated: ${chapter.updatedAt}`);
      
      // Get scenes for this chapter
      const chapterScenes = await db
        .select()
        .from(scenes)
        .where(eq(scenes.chapterId, chapter.id))
        .orderBy(scenes.orderIndex);
      
      console.log(`   Scenes: ${chapterScenes.length}`);
      if (chapterScenes.length > 0) {
        for (const scene of chapterScenes) {
          console.log(`     - Scene ${scene.orderIndex}: "${scene.title}" (${scene.status})`);
        }
      }
      console.log('');
    }
    
    // Identify standalone chapters 2-8 that need to be removed
    console.log('🎯 Identifying standalone chapters 2-8 to remove:');
    console.log('');
    
    const chaptersToRemove = allChapters.filter(chapter => 
      chapter.orderIndex >= 2 && chapter.orderIndex <= 8
    );
    
    if (chaptersToRemove.length === 0) {
      console.log('❌ No chapters found with order index 2-8');
    } else {
      console.log(`Found ${chaptersToRemove.length} chapters to remove:`);
      for (const chapter of chaptersToRemove) {
        console.log(`❌ Chapter ${chapter.orderIndex}: "${chapter.title}" (ID: ${chapter.id})`);
      }
      console.log('');
      console.log('These chapters will be deleted along with their scenes.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

findLastGuardianChapters();