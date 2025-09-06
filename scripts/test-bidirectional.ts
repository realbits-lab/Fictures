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
const db = drizzle(sql);

async function testBidirectionalImplementation() {
  console.log('🧪 Testing Bi-directional Implementation...\n');

  try {
    // Test 1: Validate consistency for "The Last Guardian" story
    console.log('📋 Test 1: Validating consistency for "The Last Guardian"...');
    const consistency = await RelationshipManager.validateConsistency('IiE1KTLwsDAVJvzEVzoRi');
    
    if (consistency.isConsistent) {
      console.log('✅ Bi-directional relationships are consistent!');
    } else {
      console.log('❌ Found consistency issues:');
      consistency.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Test 2: Test optimized structure fetching
    console.log('\n📊 Test 2: Testing optimized getStoryWithStructure...');
    const startTime = performance.now();
    
    const storyStructure = await RelationshipManager.getStoryWithStructure('IiE1KTLwsDAVJvzEVzoRi');
    
    const endTime = performance.now();
    const queryTime = Math.round(endTime - startTime);
    
    if (storyStructure) {
      console.log(`✅ Story loaded in ${queryTime}ms`);
      console.log(`📚 Found ${storyStructure.parts.length} parts`);
      console.log(`📖 Found ${storyStructure.chapters.length} standalone chapters`);
      
      // Count total chapters across parts and standalone
      const totalChapters = storyStructure.parts.reduce((sum, part) => sum + part.chapters.length, 0) 
                          + storyStructure.chapters.length;
      console.log(`🔢 Total chapters: ${totalChapters}`);
      
      // Test bi-directional array consistency
      const storedChapterCount = storyStructure.chapterIds.length;
      console.log(`📊 Stored chapter IDs: ${storedChapterCount}`);
      
      if (totalChapters === storedChapterCount) {
        console.log('✅ Chapter count matches stored IDs');
      } else {
        console.log(`❌ Mismatch: ${totalChapters} chapters vs ${storedChapterCount} stored IDs`);
      }
    } else {
      console.log('❌ Failed to load story structure');
    }

    // Test 3: Test deleting and consistency maintenance
    console.log('\n🗑️ Test 3: Testing chapter deletion with bi-directional cleanup...');
    
    // Create a test chapter first
    console.log('Creating test chapter...');
    const testChapterId = await RelationshipManager.addChapterToStory(
      'IiE1KTLwsDAVJvzEVzoRi',
      {
        title: 'Test Chapter for Deletion',
        authorId: 'test-author',
        orderIndex: 99,
        status: 'draft',
        sceneIds: []
      }
    );
    console.log(`✅ Created test chapter: ${testChapterId}`);
    
    // Verify it appears in story's chapterIds
    const updatedStory = await RelationshipManager.getStoryWithStructure('IiE1KTLwsDAVJvzEVzoRi');
    const hasTestChapter = updatedStory?.chapterIds.includes(testChapterId);
    console.log(`📊 Test chapter in story IDs: ${hasTestChapter ? 'Yes' : 'No'}`);
    
    // Delete the test chapter
    console.log('Deleting test chapter...');
    await RelationshipManager.deleteChapter(testChapterId);
    console.log('✅ Test chapter deleted');
    
    // Verify it's removed from story's chapterIds
    const finalStory = await RelationshipManager.getStoryWithStructure('IiE1KTLwsDAVJvzEVzoRi');
    const stillHasTestChapter = finalStory?.chapterIds.includes(testChapterId);
    console.log(`📊 Test chapter still in story IDs: ${stillHasTestChapter ? 'Yes (❌)' : 'No (✅)'}`);
    
    console.log('\n🎉 Bi-directional implementation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

testBidirectionalImplementation();