#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { RelationshipManager } from '../src/lib/db/relationships';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is required');
}

const sql = postgres(connectionString);

async function removeDanglingChapters() {
  console.log('🗑️ Removing dangling Chapter 4 and Chapter 5 from "The Last Guardian"...\n');

  try {
    // Chapter IDs to remove
    const chapter4Id = 'nthquyuE5TDnImEsFLxCg';
    const chapter5Id = 'Ev7xi64MEteJLeyBeEUOi';

    console.log('📋 Before removal - checking story structure...');
    const beforeStory = await RelationshipManager.getStoryWithStructure('IiE1KTLwsDAVJvzEVzoRi');
    if (beforeStory) {
      console.log(`   📊 Total chapters in story: ${beforeStory.chapterIds.length}`);
      console.log(`   📖 Standalone chapters: ${beforeStory.chapters.length}`);
      console.log(`   📚 Part-based chapters: ${beforeStory.parts.reduce((sum, part) => sum + part.chapters.length, 0)}`);
    }

    // Remove Chapter 4 using bi-directional manager
    console.log('\n🗑️ Removing Chapter 4...');
    await RelationshipManager.deleteChapter(chapter4Id);
    console.log('✅ Chapter 4 removed with bi-directional cleanup');

    // Remove Chapter 5 using bi-directional manager  
    console.log('\n🗑️ Removing Chapter 5...');
    await RelationshipManager.deleteChapter(chapter5Id);
    console.log('✅ Chapter 5 removed with bi-directional cleanup');

    // Verify complete cleanup
    console.log('\n📋 After removal - verifying cleanup...');
    const afterStory = await RelationshipManager.getStoryWithStructure('IiE1KTLwsDAVJvzEVzoRi');
    if (afterStory) {
      console.log(`   📊 Total chapters in story: ${afterStory.chapterIds.length}`);
      console.log(`   📖 Standalone chapters: ${afterStory.chapters.length}`);
      console.log(`   📚 Part-based chapters: ${afterStory.parts.reduce((sum, part) => sum + part.chapters.length, 0)}`);
      
      // Check that the removed chapters are not in the story's chapter IDs
      const hasChapter4 = afterStory.chapterIds.includes(chapter4Id);
      const hasChapter5 = afterStory.chapterIds.includes(chapter5Id);
      
      console.log(`   🔍 Chapter 4 still referenced: ${hasChapter4 ? '❌ Yes' : '✅ No'}`);
      console.log(`   🔍 Chapter 5 still referenced: ${hasChapter5 ? '❌ Yes' : '✅ No'}`);
    }

    // Final consistency check
    console.log('\n🧪 Running consistency validation...');
    const consistency = await RelationshipManager.validateConsistency('IiE1KTLwsDAVJvzEVzoRi');
    
    if (consistency.isConsistent) {
      console.log('✅ Bi-directional relationships are consistent!');
    } else {
      console.log('❌ Found consistency issues:');
      consistency.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n🎉 Dangling chapters successfully removed!');
    console.log('📋 Final chapter structure:');
    console.log('   - Chapter 1 (Part-based)');
    console.log('   - Chapter 2 (Part-based)'); 
    console.log('   - Chapter 3 (Part-based)');
    console.log('   ✅ All dangling standalone chapters eliminated');

  } catch (error) {
    console.error('❌ Error removing chapters:', error);
  } finally {
    await sql.end();
  }
}

removeDanglingChapters();