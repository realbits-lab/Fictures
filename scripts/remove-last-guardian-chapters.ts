#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories, chapters, scenes } from '../src/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function removeLastGuardianChapters() {
  try {
    // Find "The Last Guardian" story
    console.log('🔍 Finding "The Last Guardian" story...');
    
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
    
    // Get all chapters for this story
    const allChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, story.id))
      .orderBy(chapters.orderIndex);
    
    console.log(`📚 Found ${allChapters.length} chapters total`);
    
    // Identify Chapter 4 to remove specifically
    const chaptersToRemove = allChapters.filter(chapter => 
      chapter.orderIndex === 4
    );
    
    console.log(`🎯 Found ${chaptersToRemove.length} chapters to remove (Chapter 4 only):`);
    for (const chapter of chaptersToRemove) {
      console.log(`   - Chapter ${chapter.orderIndex}: "${chapter.title}" (ID: ${chapter.id})`);
    }
    
    if (chaptersToRemove.length === 0) {
      console.log('✅ No chapters to remove');
      return;
    }
    
    // Get chapter IDs to remove
    const chapterIdsToRemove = chaptersToRemove.map(c => c.id);
    
    // First, delete all scenes for these chapters
    console.log('\n🗑️ Deleting scenes from chapters to be removed...');
    
    const scenesToDelete = await db
      .select()
      .from(scenes)
      .where(inArray(scenes.chapterId, chapterIdsToRemove));
    
    console.log(`   Found ${scenesToDelete.length} scenes to delete`);
    
    if (scenesToDelete.length > 0) {
      await db.delete(scenes)
        .where(inArray(scenes.chapterId, chapterIdsToRemove));
      console.log(`   ✅ Deleted ${scenesToDelete.length} scenes`);
    }
    
    // Delete the chapters
    console.log('\n🗑️ Deleting chapters...');
    
    await db.delete(chapters)
      .where(inArray(chapters.id, chapterIdsToRemove));
    
    console.log(`   ✅ Deleted ${chaptersToRemove.length} chapters`);
    
    // Get remaining chapters and reorder them
    console.log('\n🔄 Checking if reordering is needed...');
    
    const remainingChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, story.id))
      .orderBy(chapters.orderIndex); // Order by current order index
    
    console.log(`   Found ${remainingChapters.length} remaining chapters`);
    
    // Update order indices
    for (let i = 0; i < remainingChapters.length; i++) {
      const newOrderIndex = i + 1; // Start from 1
      const chapter = remainingChapters[i];
      
      if (chapter.orderIndex !== newOrderIndex) {
        await db.update(chapters)
          .set({ orderIndex: newOrderIndex })
          .where(eq(chapters.id, chapter.id));
        
        console.log(`   ✅ Updated "${chapter.title}" from order ${chapter.orderIndex} to ${newOrderIndex}`);
      }
    }
    
    // Final verification
    console.log('\n✅ Cleanup completed! Final chapter list:');
    
    const finalChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.storyId, story.id))
      .orderBy(chapters.orderIndex);
    
    for (const chapter of finalChapters) {
      console.log(`   📖 Chapter ${chapter.orderIndex}: "${chapter.title}"`);
    }
    
    console.log(`\n🎉 Successfully removed Chapter 4 from "The Last Guardian"`);
    console.log(`📊 Story now has ${finalChapters.length} chapters properly ordered`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

removeLastGuardianChapters();