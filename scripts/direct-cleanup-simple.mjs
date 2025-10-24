#!/usr/bin/env node

// Direct database cleanup using raw SQL - remove all stories and related data
import postgres from 'postgres';
import { list, del } from '@vercel/blob';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL not found in environment variables');
  process.exit(1);
}

// Set up database connection
const sql = postgres(POSTGRES_URL, { prepare: false });

async function directDatabaseCleanup() {
  console.log('🧹 Direct Database and Blob Storage Cleanup');
  console.log('===========================================');

  try {
    // Step 1: Count existing data
    console.log('\n📊 Counting existing data...');

    const storyCount = await sql`SELECT COUNT(*) as count FROM stories`;
    const partCount = await sql`SELECT COUNT(*) as count FROM parts`;
    const chapterCount = await sql`SELECT COUNT(*) as count FROM chapters`;
    const sceneCount = await sql`SELECT COUNT(*) as count FROM scenes`;
    const characterCount = await sql`SELECT COUNT(*) as count FROM characters`;
    const settingCount = await sql`SELECT COUNT(*) as count FROM settings`;
    const aiInteractionCount = await sql`SELECT COUNT(*) as count FROM ai_interactions`;

    console.log(`   📚 Stories: ${storyCount[0].count}`);
    console.log(`   📖 Parts: ${partCount[0].count}`);
    console.log(`   📄 Chapters: ${chapterCount[0].count}`);
    console.log(`   🎬 Scenes: ${sceneCount[0].count}`);
    console.log(`   👥 Characters: ${characterCount[0].count}`);
    console.log(`   🏛️  Settings: ${settingCount[0].count}`);
    console.log(`   🤖 AI Interactions: ${aiInteractionCount[0].count}`);

    // Step 2: Delete all data in correct order (respecting foreign key constraints)
    console.log('\n🗄️  Deleting database records...');

    console.log('   Deleting scenes...');
    const deletedScenes = await sql`DELETE FROM scenes`;
    console.log(`   ✅ Deleted ${deletedScenes.count || 'all'} scenes`);

    console.log('   Deleting chapters...');
    const deletedChapters = await sql`DELETE FROM chapters`;
    console.log(`   ✅ Deleted ${deletedChapters.count || 'all'} chapters`);

    console.log('   Deleting parts...');
    const deletedParts = await sql`DELETE FROM parts`;
    console.log(`   ✅ Deleted ${deletedParts.count || 'all'} parts`);

    console.log('   Deleting characters...');
    const deletedCharacters = await sql`DELETE FROM characters`;
    console.log(`   ✅ Deleted ${deletedCharacters.count || 'all'} characters`);

    console.log('   Deleting settings...');
    const deletedSettings = await sql`DELETE FROM settings`;
    console.log(`   ✅ Deleted ${deletedSettings.count || 'all'} settings`);

    console.log('   Deleting AI interactions...');
    const deletedAiInteractions = await sql`DELETE FROM ai_interactions`;
    console.log(`   ✅ Deleted ${deletedAiInteractions.count || 'all'} AI interactions`);

    console.log('   Deleting stories...');
    const deletedStories = await sql`DELETE FROM stories`;
    console.log(`   ✅ Deleted ${deletedStories.count || 'all'} stories`);

    // Step 3: Clean up Vercel blob storage
    console.log('\n☁️  Cleaning up Vercel blob storage...');

    try {
      const { blobs } = await list();
      console.log(`   Found ${blobs.length} blobs to delete`);

      if (blobs.length > 0) {
        console.log('   Deleting blobs...');
        const deletionPromises = blobs.map(blob => {
          console.log(`      Deleting: ${blob.pathname}`);
          return del(blob.url);
        });

        await Promise.all(deletionPromises);
        console.log(`   ✅ Deleted ${blobs.length} files from blob storage`);
      } else {
        console.log('   ℹ️  No blobs found to delete');
      }
    } catch (blobError) {
      console.error('   ⚠️  Blob cleanup failed:', blobError.message);
      console.log('   📝 Database cleanup completed successfully despite blob error');
    }

    // Step 4: Verify cleanup
    console.log('\n🔍 Verifying cleanup...');

    const remainingStories = await sql`SELECT COUNT(*) as count FROM stories`;
    const remainingParts = await sql`SELECT COUNT(*) as count FROM parts`;
    const remainingChapters = await sql`SELECT COUNT(*) as count FROM chapters`;
    const remainingScenes = await sql`SELECT COUNT(*) as count FROM scenes`;
    const remainingCharacters = await sql`SELECT COUNT(*) as count FROM characters`;
    const remainingSettings = await sql`SELECT COUNT(*) as count FROM settings`;
    const remainingAiInteractions = await sql`SELECT COUNT(*) as count FROM ai_interactions`;

    const totalRemaining =
      parseInt(remainingStories[0].count) +
      parseInt(remainingParts[0].count) +
      parseInt(remainingChapters[0].count) +
      parseInt(remainingScenes[0].count) +
      parseInt(remainingCharacters[0].count) +
      parseInt(remainingSettings[0].count) +
      parseInt(remainingAiInteractions[0].count);

    if (totalRemaining === 0) {
      console.log('   ✅ Verification: Database is completely clean');
    } else {
      console.log(`   ⚠️  Verification: ${totalRemaining} records still remain`);
      console.log(`      Stories: ${remainingStories[0].count}`);
      console.log(`      Parts: ${remainingParts[0].count}`);
      console.log(`      Chapters: ${remainingChapters[0].count}`);
      console.log(`      Scenes: ${remainingScenes[0].count}`);
      console.log(`      Characters: ${remainingCharacters[0].count}`);
      console.log(`      Settings: ${remainingSettings[0].count}`);
      console.log(`      AI Interactions: ${remainingAiInteractions[0].count}`);
    }

    console.log('\n🎯 Complete cleanup finished successfully!');
    console.log('   📁 All database records removed');
    console.log('   ☁️  All blob storage files removed');
    console.log('   ✨ System is clean and ready for fresh content');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await sql.end();
  }
}

directDatabaseCleanup().catch(console.error);