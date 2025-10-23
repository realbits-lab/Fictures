#!/usr/bin/env node

/**
 * Apply Phase 2 Community database schema changes
 *
 * This script directly applies SQL migrations for:
 * - New enums: content_type, moderation_status
 * - Updated communityPosts table with 14 new fields
 * - Updated communityReplies table with 9 new fields
 * - New postImages table
 * - New postLikes table
 * - New postViews table
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.POSTGRES_URL);

async function main() {
  console.log('Starting Phase 2 Community database migration...');

  try {
    // Step 1: Create new enums
    console.log('\n1. Creating new enums...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE content_type AS ENUM ('markdown', 'html', 'plain');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✓ Created content_type enum');

    await sql`
      DO $$ BEGIN
        CREATE TYPE moderation_status AS ENUM ('approved', 'pending', 'flagged', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✓ Created moderation_status enum');

    // Step 2: Add new columns to community_posts table
    console.log('\n2. Updating community_posts table...');

    // Add content type and HTML
    await sql`
      ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'markdown' NOT NULL,
      ADD COLUMN IF NOT EXISTS content_html TEXT,
      ADD COLUMN IF NOT EXISTS content_images JSONB DEFAULT '[]'::jsonb
    `;
    console.log('   ✓ Added content fields');

    // Add edit tracking
    await sql`
      ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP
    `;
    console.log('   ✓ Added edit tracking fields');

    // Add soft delete
    await sql`
      ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
    `;
    console.log('   ✓ Added soft delete fields');

    // Add moderation
    await sql`
      ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS moderation_status moderation_status DEFAULT 'approved',
      ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
      ADD COLUMN IF NOT EXISTS moderated_by TEXT REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP
    `;
    console.log('   ✓ Added moderation fields');

    // Add tags and mentions
    await sql`
      ALTER TABLE community_posts
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb
    `;
    console.log('   ✓ Added tags and mentions fields');

    // Update foreign keys to cascade
    await sql`
      DO $$
      BEGIN
        ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_story_id_stories_id_fk;
        ALTER TABLE community_posts ADD CONSTRAINT community_posts_story_id_stories_id_fk
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;

        ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_author_id_users_id_fk;
        ALTER TABLE community_posts ADD CONSTRAINT community_posts_author_id_users_id_fk
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✓ Updated foreign key constraints');

    // Step 3: Add new columns to community_replies table
    console.log('\n3. Updating community_replies table...');

    await sql`
      ALTER TABLE community_replies
      ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'markdown' NOT NULL,
      ADD COLUMN IF NOT EXISTS content_html TEXT,
      ADD COLUMN IF NOT EXISTS content_images JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb
    `;
    console.log('   ✓ Added all new fields');

    // Update foreign keys to cascade
    await sql`
      DO $$
      BEGIN
        ALTER TABLE community_replies DROP CONSTRAINT IF EXISTS community_replies_post_id_community_posts_id_fk;
        ALTER TABLE community_replies ADD CONSTRAINT community_replies_post_id_community_posts_id_fk
          FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE;

        ALTER TABLE community_replies DROP CONSTRAINT IF EXISTS community_replies_author_id_users_id_fk;
        ALTER TABLE community_replies ADD CONSTRAINT community_replies_author_id_users_id_fk
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

        ALTER TABLE community_replies DROP CONSTRAINT IF EXISTS community_replies_parent_reply_id_community_replies_id_fk;
        ALTER TABLE community_replies ADD CONSTRAINT community_replies_parent_reply_id_community_replies_id_fk
          FOREIGN KEY (parent_reply_id) REFERENCES community_replies(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('   ✓ Updated foreign key constraints');

    // Step 4: Create post_images table
    console.log('\n4. Creating post_images table...');
    await sql`
      CREATE TABLE IF NOT EXISTS post_images (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        caption TEXT,
        order_index INTEGER DEFAULT 0 NOT NULL,
        uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created post_images table');

    // Step 5: Create post_likes table
    console.log('\n5. Creating post_likes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS post_likes (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT post_user_unique UNIQUE (post_id, user_id)
      )
    `;
    console.log('   ✓ Created post_likes table');

    // Step 6: Create post_views table
    console.log('\n6. Creating post_views table...');
    await sql`
      CREATE TABLE IF NOT EXISTS post_views (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        ip_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created post_views table');

    // Step 7: Create indexes for better query performance
    console.log('\n7. Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);
      CREATE INDEX IF NOT EXISTS idx_community_posts_moderation ON community_posts(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_community_posts_deleted ON community_posts(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_community_replies_deleted ON community_replies(is_deleted);
    `;
    console.log('   ✓ Created performance indexes');

    console.log('\n✅ Phase 2 Community database migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
