#!/usr/bin/env node

/**
 * Create indexes for Phase 2 Community tables
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.POSTGRES_URL);

async function main() {
  console.log('Creating indexes for Community tables...\n');

  try {
    // Community posts indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id)`;
    console.log('✓ Created idx_community_posts_story_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id)`;
    console.log('✓ Created idx_community_posts_author_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_moderation ON community_posts(moderation_status)`;
    console.log('✓ Created idx_community_posts_moderation');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_deleted ON community_posts(is_deleted)`;
    console.log('✓ Created idx_community_posts_deleted');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_posts_activity ON community_posts(last_activity_at)`;
    console.log('✓ Created idx_community_posts_activity');

    // Community replies indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_community_replies_post_id ON community_replies(post_id)`;
    console.log('✓ Created idx_community_replies_post_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_replies_author_id ON community_replies(author_id)`;
    console.log('✓ Created idx_community_replies_author_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_replies_parent ON community_replies(parent_reply_id)`;
    console.log('✓ Created idx_community_replies_parent');

    await sql`CREATE INDEX IF NOT EXISTS idx_community_replies_deleted ON community_replies(is_deleted)`;
    console.log('✓ Created idx_community_replies_deleted');

    // Post images indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id)`;
    console.log('✓ Created idx_post_images_post_id');

    // Post likes indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`;
    console.log('✓ Created idx_post_likes_post_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)`;
    console.log('✓ Created idx_post_likes_user_id');

    // Post views indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id)`;
    console.log('✓ Created idx_post_views_post_id');

    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id)`;
    console.log('✓ Created idx_post_views_user_id');

    console.log('\n✅ All indexes created successfully!');

  } catch (error) {
    console.error('\n❌ Index creation failed:', error);
    process.exit(1);
  }
}

main();
