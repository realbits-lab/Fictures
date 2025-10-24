#!/usr/bin/env node

/**
 * Create all Phase 2 Community tables from scratch
 *
 * This script creates:
 * - community_posts table with all Phase 2 fields
 * - community_replies table with all Phase 2 fields
 * - post_images table
 * - post_likes table
 * - post_views table
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.POSTGRES_URL);

async function main() {
  console.log('Creating Phase 2 Community database tables...');

  try {
    // Step 1: Create new enums
    console.log('\n1. Creating enums...');
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

    // Step 2: Create community_posts table with ALL Phase 2 fields
    console.log('\n2. Creating community_posts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS community_posts (
        id TEXT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        content_type content_type DEFAULT 'markdown' NOT NULL,
        content_html TEXT,
        content_images JSONB DEFAULT '[]'::jsonb,
        story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'discussion',
        is_pinned BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        is_edited BOOLEAN DEFAULT false,
        edit_count INTEGER DEFAULT 0,
        last_edited_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        likes INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        moderation_status moderation_status DEFAULT 'approved',
        moderation_reason TEXT,
        moderated_by TEXT REFERENCES users(id),
        moderated_at TIMESTAMP,
        tags JSONB DEFAULT '[]'::jsonb,
        mentions JSONB DEFAULT '[]'::jsonb,
        last_activity_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created community_posts table');

    // Step 3: Create community_replies table with ALL Phase 2 fields
    console.log('\n3. Creating community_replies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS community_replies (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        content_type content_type DEFAULT 'markdown' NOT NULL,
        content_html TEXT,
        content_images JSONB DEFAULT '[]'::jsonb,
        post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_reply_id TEXT REFERENCES community_replies(id) ON DELETE CASCADE,
        depth INTEGER DEFAULT 0 NOT NULL,
        is_edited BOOLEAN DEFAULT false,
        edit_count INTEGER DEFAULT 0,
        last_edited_at TIMESTAMP,
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        likes INTEGER DEFAULT 0,
        mentions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created community_replies table');

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
      CREATE INDEX IF NOT EXISTS idx_community_posts_story_id ON community_posts(story_id);
      CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_community_posts_moderation ON community_posts(moderation_status);
      CREATE INDEX IF NOT EXISTS idx_community_posts_deleted ON community_posts(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_community_posts_activity ON community_posts(last_activity_at);

      CREATE INDEX IF NOT EXISTS idx_community_replies_post_id ON community_replies(post_id);
      CREATE INDEX IF NOT EXISTS idx_community_replies_author_id ON community_replies(author_id);
      CREATE INDEX IF NOT EXISTS idx_community_replies_parent ON community_replies(parent_reply_id);
      CREATE INDEX IF NOT EXISTS idx_community_replies_deleted ON community_replies(is_deleted);

      CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id);
    `;
    console.log('   ✓ Created performance indexes');

    console.log('\n✅ Phase 2 Community database tables created successfully!');

  } catch (error) {
    console.error('\n❌ Table creation failed:', error);
    process.exit(1);
  }
}

main();
