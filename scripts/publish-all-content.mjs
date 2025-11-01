#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);

async function publishAllContent() {
  console.log('\n📢 Publishing All Stories and Chapters');
  console.log('='.repeat(80));

  try {
    // Get current counts before update
    const storiesBeforeCount = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM stories
      GROUP BY status
    `;

    const chaptersBeforeCount = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM chapters
      GROUP BY status
    `;

    console.log('\n📊 Current Status Counts:');
    console.log('\n  Stories:');
    storiesBeforeCount.forEach(row => {
      console.log(`    ${row.status}: ${row.count}`);
    });

    console.log('\n  Chapters:');
    chaptersBeforeCount.forEach(row => {
      console.log(`    ${row.status}: ${row.count}`);
    });

    // Update stories to published
    const updatedStories = await sql`
      UPDATE stories
      SET status = 'published'
      WHERE status != 'published'
      RETURNING id, title, status
    `;

    console.log(`\n✅ Updated ${updatedStories.length} stories to published status`);
    if (updatedStories.length > 0) {
      updatedStories.forEach((story, i) => {
        console.log(`  ${i + 1}. ${story.title} (${story.id})`);
      });
    }

    // Update chapters to published
    const updatedChapters = await sql`
      UPDATE chapters
      SET status = 'published'
      WHERE status != 'published'
      RETURNING id, title, status
    `;

    console.log(`\n✅ Updated ${updatedChapters.length} chapters to published status`);
    if (updatedChapters.length > 0 && updatedChapters.length <= 20) {
      updatedChapters.forEach((chapter, i) => {
        console.log(`  ${i + 1}. ${chapter.title} (${chapter.id})`);
      });
    } else if (updatedChapters.length > 20) {
      console.log(`  (Showing first 20 of ${updatedChapters.length})`);
      updatedChapters.slice(0, 20).forEach((chapter, i) => {
        console.log(`  ${i + 1}. ${chapter.title} (${chapter.id})`);
      });
    }

    // Get final counts
    const storiesAfterCount = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM stories
      GROUP BY status
    `;

    const chaptersAfterCount = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM chapters
      GROUP BY status
    `;

    console.log('\n📊 Final Status Counts:');
    console.log('\n  Stories:');
    storiesAfterCount.forEach(row => {
      console.log(`    ${row.status}: ${row.count}`);
    });

    console.log('\n  Chapters:');
    chaptersAfterCount.forEach(row => {
      console.log(`    ${row.status}: ${row.count}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Publication Complete!');
    console.log(`   Stories published: ${updatedStories.length}`);
    console.log(`   Chapters published: ${updatedChapters.length}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

publishAllContent().catch(console.error);
