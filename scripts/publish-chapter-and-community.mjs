#!/usr/bin/env node

/**
 * Publish Chapter and Create Community Post
 * 
 * This script:
 * 1. Publishes a chapter (updates status to 'published')
 * 2. Creates a community post announcing the story
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load authentication
async function loadAuth() {
  const authPath = path.join(__dirname, '../.auth/user.json');
  try {
    const authData = await fs.readFile(authPath, 'utf-8');
    const auth = JSON.parse(authData);

    const profileName = 'writer';  // Use writer profile
    const profile = auth.profiles?.[profileName];

    if (!profile) {
      throw new Error(`Profile "${profileName}" not found in .auth/user.json`);
    }

    const sessionCookie = profile.cookies?.find(c =>
      c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
    );

    if (!sessionCookie) {
      throw new Error('No session cookie found in .auth/user.json');
    }

    return { sessionToken: sessionCookie.value, userId: profile.userId };
  } catch (error) {
    console.error('❌ Failed to load authentication:', error.message);
    throw error;
  }
}

// Publish chapter via database
async function publishChapterDB(chapterId, sql) {
  console.log(`📤 Publishing chapter: ${chapterId}...`);

  const result = await sql`
    UPDATE chapters 
    SET status = 'published', updated_at = NOW()
    WHERE id = ${chapterId}
    RETURNING id, title, status, story_id
  `;

  if (result.length === 0) {
    throw new Error('Chapter not found');
  }

  return result[0];
}

// Create community post
async function createCommunityPost(storyId, sessionToken) {
  const url = `http://localhost:3000/api/community/posts`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'New Story Published!',
      content: 'Check out my latest story. Hope you enjoy it!',
      contentHtml: '<p>Check out my latest story. Hope you enjoy it!</p>',
      storyId,
      type: 'announcement',
      tags: ['new-story'],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create community post: ${error}`);
  }

  return await response.json();
}

// Main execution
async function main() {
  const chapterId = process.argv[2];

  if (!chapterId) {
    console.error('❌ Usage: node publish-chapter-and-community.mjs CHAPTER_ID');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

  try {
    console.log('🔐 Loading authentication...');
    const { sessionToken } = await loadAuth();

    // 1. Publish chapter
    const chapter = await publishChapterDB(chapterId, sql);
    console.log('\n✅ Chapter published successfully!\n');
    console.log(`📖 Title: ${chapter.title}`);
    console.log(`🆔 Chapter ID: ${chapter.id}`);
    console.log(`📚 Story ID: ${chapter.story_id}`);
    console.log(`📊 Status: ${chapter.status}`);

    // 2. Create community post
    console.log('\n📝 Creating community post...');
    const post = await createCommunityPost(chapter.story_id, sessionToken);
    console.log('\n✅ Community post created successfully!\n');
    console.log(`📝 Post ID: ${post.post.id}`);
    console.log(`📌 Title: ${post.post.title}`);

    // Display links
    console.log('\n🔗 Links:');
    console.log(`📖 Read Story: http://localhost:3000/reading/${chapter.story_id}`);
    console.log(`💬 Community: http://localhost:3000/community/story/${chapter.story_id}`);
    console.log(`✍️  Edit Story: http://localhost:3000/writing/${chapter.story_id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
