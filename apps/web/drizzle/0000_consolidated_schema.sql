-- Consolidated schema migration
-- Generated from drizzle/schema.ts

-- Create ENUMs
CREATE TYPE "public"."adversity_type" AS ENUM('internal', 'external', 'both');
CREATE TYPE "public"."arc_position" AS ENUM('beginning', 'middle', 'climax', 'resolution');
CREATE TYPE "public"."comic_status" AS ENUM('none', 'draft', 'published');
CREATE TYPE "public"."content_type" AS ENUM('markdown', 'html', 'plain');
CREATE TYPE "public"."cycle_phase" AS ENUM('setup', 'confrontation', 'virtue', 'consequence', 'transition');
CREATE TYPE "public"."emotional_beat" AS ENUM('fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy');
CREATE TYPE "public"."event_type" AS ENUM('page_view', 'story_view', 'chapter_read_start', 'chapter_read_complete', 'scene_read', 'comment_created', 'comment_liked', 'story_liked', 'chapter_liked', 'post_created', 'post_viewed', 'share', 'bookmark');
CREATE TYPE "public"."insight_type" AS ENUM('quality_improvement', 'engagement_drop', 'reader_feedback', 'pacing_issue', 'character_development', 'plot_consistency', 'trending_up', 'publishing_opportunity', 'audience_mismatch');
CREATE TYPE "public"."moderation_status" AS ENUM('approved', 'pending', 'flagged', 'rejected');
CREATE TYPE "public"."publication_status" AS ENUM('pending', 'published', 'failed', 'cancelled');
CREATE TYPE "public"."reading_format" AS ENUM('novel', 'comic');
CREATE TYPE "public"."schedule_type" AS ENUM('daily', 'weekly', 'custom', 'one-time');
CREATE TYPE "public"."session_type" AS ENUM('continuous', 'interrupted', 'partial');
CREATE TYPE "public"."sfx_emphasis" AS ENUM('normal', 'large', 'dramatic');
CREATE TYPE "public"."shot_type" AS ENUM('establishing_shot', 'wide_shot', 'medium_shot', 'close_up', 'extreme_close_up', 'over_shoulder', 'dutch_angle');
CREATE TYPE "public"."status" AS ENUM('writing', 'published');
CREATE TYPE "public"."tone" AS ENUM('hopeful', 'dark', 'bittersweet', 'satirical');
CREATE TYPE "public"."user_role" AS ENUM('reader', 'writer', 'manager');
CREATE TYPE "public"."virtue_type" AS ENUM('courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom');
CREATE TYPE "public"."visibility" AS ENUM('private', 'unlisted', 'public');

-- Create base tables (no foreign key dependencies)
CREATE TABLE "public"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"username" varchar(50),
	"password" varchar(255),
	"bio" text,
	"role" "user_role" DEFAULT 'reader' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE "public"."stories" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"genre" varchar(100),
	"status" "status" DEFAULT 'writing' NOT NULL,
	"author_id" text NOT NULL,
	"view_count" integer DEFAULT 0,
	"rating" integer DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"image_url" text,
	"image_variants" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"summary" text,
	"tone" "tone",
	"moral_framework" text
);

CREATE TABLE "public"."research" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"author_id" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create dependent tables
CREATE TABLE "public"."api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) DEFAULT 'API Key' NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"scopes" json DEFAULT '[]'::json NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);

CREATE TABLE "public"."ai_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"applied" boolean DEFAULT false,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"theme" varchar(20) DEFAULT 'system',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'UTC',
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT false,
	"marketing_emails" boolean DEFAULT false,
	"profile_visibility" varchar(20) DEFAULT 'public',
	"show_email" boolean DEFAULT false,
	"show_stats" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."user_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_words_written" integer DEFAULT 0,
	"stories_published" integer DEFAULT 0,
	"chapters_published" integer DEFAULT 0,
	"comments_received" integer DEFAULT 0,
	"total_views" integer DEFAULT 0,
	"average_rating" integer DEFAULT 0,
	"writing_streak" integer DEFAULT 0,
	"best_streak" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"experience" integer DEFAULT 0,
	"last_writing_date" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."studio_agent_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text,
	"agent_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"context" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."characters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"story_id" text NOT NULL,
	"is_main" boolean DEFAULT false,
	"content" text DEFAULT '',
	"image_url" text,
	"image_variants" json,
	"role" varchar(50),
	"archetype" varchar(100),
	"summary" text,
	"storyline" text,
	"personality" json,
	"backstory" json,
	"motivations" json,
	"voice" json,
	"physical_description" json,
	"visual_reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"core_trait" text,
	"internal_flaw" text,
	"external_goal" text,
	"relationships" json,
	"voice_style" json,
	"visual_style" text
);

CREATE TABLE "public"."settings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"story_id" text NOT NULL,
	"description" text,
	"mood" text,
	"sensory" json,
	"visual_style" text,
	"visual_references" json,
	"color_palette" json,
	"architectural_style" text,
	"image_url" text,
	"image_variants" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"adversity_elements" json,
	"symbolic_meaning" text,
	"cycle_amplification" json,
	"emotional_resonance" text
);

CREATE TABLE "public"."parts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"story_id" text NOT NULL,
	"author_id" text NOT NULL,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer,
	"character_arcs" json
);

CREATE TABLE "public"."chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"story_id" text NOT NULL,
	"part_id" text,
	"author_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"status" "status" DEFAULT 'writing' NOT NULL,
	"purpose" text,
	"hook" text,
	"character_focus" text,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"character_id" text,
	"arc_position" "arc_position",
	"contributes_to_macro_arc" text,
	"focus_characters" json DEFAULT '[]'::json,
	"adversity_type" "adversity_type",
	"virtue_type" "virtue_type",
	"seeds_planted" json DEFAULT '[]'::json,
	"seeds_resolved" json DEFAULT '[]'::json,
	"connects_to_previous_chapter" text,
	"creates_next_adversity" text
);

CREATE TABLE "public"."scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text DEFAULT '',
	"chapter_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"image_url" text,
	"image_variants" json,
	"summary" text,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"auto_publish" boolean DEFAULT false,
	"published_by" text,
	"unpublished_at" timestamp,
	"unpublished_by" text,
	"comic_status" "comic_status" DEFAULT 'none' NOT NULL,
	"comic_published_at" timestamp,
	"comic_published_by" text,
	"comic_unpublished_at" timestamp,
	"comic_unpublished_by" text,
	"comic_generated_at" timestamp,
	"comic_panel_count" integer DEFAULT 0,
	"comic_version" integer DEFAULT 1,
	"view_count" integer DEFAULT 0 NOT NULL,
	"unique_view_count" integer DEFAULT 0 NOT NULL,
	"novel_view_count" integer DEFAULT 0 NOT NULL,
	"novel_unique_view_count" integer DEFAULT 0 NOT NULL,
	"comic_view_count" integer DEFAULT 0 NOT NULL,
	"comic_unique_view_count" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cycle_phase" "cycle_phase",
	"emotional_beat" "emotional_beat",
	"character_focus" jsonb DEFAULT '[]'::jsonb,
	"sensory_anchors" jsonb DEFAULT '[]'::jsonb,
	"dialogue_vs_description" text,
	"suggested_length" text
);

CREATE TABLE "public"."reading_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"reading_format" "reading_format" DEFAULT 'novel' NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL,
	"read_count" integer DEFAULT 1 NOT NULL,
	"last_scene_id" text,
	"last_panel_id" text,
	"last_page_number" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_story_format_unique" UNIQUE("user_id","story_id","reading_format")
);

CREATE TABLE "public"."reading_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"story_id" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_seconds" integer,
	"chapters_read" integer DEFAULT 0,
	"scenes_read" integer DEFAULT 0,
	"characters_read" integer DEFAULT 0,
	"session_type" "session_type" DEFAULT 'continuous',
	"device_type" varchar(20),
	"completed_story" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."community_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"content_type" "content_type" DEFAULT 'markdown' NOT NULL,
	"content_html" text,
	"content_images" json DEFAULT '[]'::json,
	"story_id" text NOT NULL,
	"author_id" text NOT NULL,
	"type" varchar(50) DEFAULT 'discussion',
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"is_edited" boolean DEFAULT false,
	"edit_count" integer DEFAULT 0,
	"last_edited_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"likes" integer DEFAULT 0,
	"replies" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"moderation_status" "moderation_status" DEFAULT 'approved',
	"moderation_reason" text,
	"moderated_by" text,
	"moderated_at" timestamp,
	"tags" json DEFAULT '[]'::json,
	"mentions" json DEFAULT '[]'::json,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."community_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_type" "content_type" DEFAULT 'markdown' NOT NULL,
	"content_html" text,
	"content_images" json DEFAULT '[]'::json,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_reply_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"is_edited" boolean DEFAULT false,
	"edit_count" integer DEFAULT 0,
	"last_edited_at" timestamp,
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp,
	"likes" integer DEFAULT 0,
	"mentions" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."post_views" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text,
	"session_id" varchar(255),
	"ip_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"chapter_id" text,
	"scene_id" text,
	"parent_comment_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"dislike_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."publishing_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"chapter_id" text,
	"created_by" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"schedule_type" "schedule_type" NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"publish_time" text DEFAULT '09:00:00' NOT NULL,
	"interval_days" integer,
	"days_of_week" json,
	"scenes_per_publish" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"is_completed" boolean DEFAULT false,
	"last_published_at" timestamp,
	"next_publish_at" timestamp,
	"total_published" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."scheduled_publications" (
	"id" text PRIMARY KEY NOT NULL,
	"schedule_id" text,
	"story_id" text NOT NULL,
	"chapter_id" text,
	"scene_id" text,
	"scheduled_for" timestamp NOT NULL,
	"published_at" timestamp,
	"status" "publication_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" "event_type" NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"story_id" text,
	"chapter_id" text,
	"scene_id" text,
	"post_id" text,
	"metadata" json DEFAULT '{}'::json,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."story_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"insight_type" "insight_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'info',
	"action_items" json DEFAULT '[]'::json,
	"metrics" json DEFAULT '{}'::json,
	"ai_model" varchar(50),
	"confidence_score" varchar(10),
	"is_read" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);

CREATE TABLE "public"."studio_agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"parts" json,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."studio_agent_tool_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"tool_name" varchar(100) NOT NULL,
	"tool_input" json NOT NULL,
	"tool_output" json,
	"status" varchar(20) NOT NULL,
	"error" text,
	"execution_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

CREATE TABLE "public"."comic_panels" (
	"id" text PRIMARY KEY NOT NULL,
	"scene_id" text NOT NULL,
	"panel_number" integer NOT NULL,
	"shot_type" "shot_type" NOT NULL,
	"image_url" text NOT NULL,
	"image_variants" json,
	"narrative" text,
	"dialogue" json,
	"sfx" json,
	"description" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."scene_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"scene_id" text NOT NULL,
	"evaluation" json NOT NULL,
	"overall_score" varchar(10) NOT NULL,
	"plot_score" varchar(10) NOT NULL,
	"character_score" varchar(10) NOT NULL,
	"pacing_score" varchar(10) NOT NULL,
	"prose_score" varchar(10) NOT NULL,
	"world_building_score" varchar(10) NOT NULL,
	"model_version" varchar(50) DEFAULT 'gpt-4o-mini',
	"token_usage" integer,
	"evaluation_time_ms" integer,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "public"."scene_views" (
	"id" text PRIMARY KEY DEFAULT 'gen_random_uuid()' NOT NULL,
	"scene_id" text NOT NULL,
	"user_id" text,
	"session_id" text,
	"reading_format" "reading_format" DEFAULT 'novel' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Like/Dislike tables
CREATE TABLE "public"."story_likes" (
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_likes_user_id_story_id_pk" PRIMARY KEY("user_id","story_id")
);

CREATE TABLE "public"."chapter_likes" (
	"user_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_likes_user_id_chapter_id_pk" PRIMARY KEY("user_id","chapter_id")
);

CREATE TABLE "public"."scene_likes" (
	"user_id" text NOT NULL,
	"scene_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_likes_user_id_scene_id_pk" PRIMARY KEY("user_id","scene_id")
);

CREATE TABLE "public"."scene_dislikes" (
	"user_id" text NOT NULL,
	"scene_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_dislikes_user_id_scene_id_pk" PRIMARY KEY("user_id","scene_id")
);

CREATE TABLE "public"."comment_likes" (
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);

CREATE TABLE "public"."comment_dislikes" (
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_dislikes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);

CREATE TABLE "public"."post_likes" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);

-- Add foreign key constraints
ALTER TABLE "public"."stories" ADD CONSTRAINT "stories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."research" ADD CONSTRAINT "research_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_userId_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."characters" ADD CONSTRAINT "characters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."settings" ADD CONSTRAINT "settings_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."parts" ADD CONSTRAINT "parts_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."parts" ADD CONSTRAINT "parts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."chapters" ADD CONSTRAINT "chapters_characterId_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "public"."scenes" ADD CONSTRAINT "scenes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."scenes" ADD CONSTRAINT "scenes_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."scenes" ADD CONSTRAINT "scenes_unpublished_by_users_id_fk" FOREIGN KEY ("unpublished_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."scenes" ADD CONSTRAINT "scenes_comic_published_by_users_id_fk" FOREIGN KEY ("comic_published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."scenes" ADD CONSTRAINT "scenes_comic_unpublished_by_users_id_fk" FOREIGN KEY ("comic_unpublished_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."reading_history" ADD CONSTRAINT "reading_history_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."reading_sessions" ADD CONSTRAINT "reading_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."reading_sessions" ADD CONSTRAINT "reading_sessions_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."community_posts" ADD CONSTRAINT "community_posts_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."community_posts" ADD CONSTRAINT "community_posts_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."community_replies" ADD CONSTRAINT "community_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."community_replies" ADD CONSTRAINT "community_replies_parent_reply_id_community_replies_id_fk" FOREIGN KEY ("parent_reply_id") REFERENCES "public"."community_replies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."post_views" ADD CONSTRAINT "post_views_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."post_views" ADD CONSTRAINT "post_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."publishing_schedules" ADD CONSTRAINT "publishing_schedules_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."publishing_schedules" ADD CONSTRAINT "publishing_schedules_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."publishing_schedules" ADD CONSTRAINT "publishing_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "public"."scheduled_publications" ADD CONSTRAINT "scheduled_publications_schedule_id_publishing_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."publishing_schedules"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scheduled_publications" ADD CONSTRAINT "scheduled_publications_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scheduled_publications" ADD CONSTRAINT "scheduled_publications_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scheduled_publications" ADD CONSTRAINT "scheduled_publications_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."analytics_events" ADD CONSTRAINT "analytics_events_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."story_insights" ADD CONSTRAINT "story_insights_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."studio_agent_messages" ADD CONSTRAINT "studio_agent_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."studio_agent_chats"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."studio_agent_tool_executions" ADD CONSTRAINT "studio_agent_tool_executions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."studio_agent_messages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comic_panels" ADD CONSTRAINT "comic_panels_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_evaluations" ADD CONSTRAINT "scene_evaluations_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_views" ADD CONSTRAINT "scene_views_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_views" ADD CONSTRAINT "scene_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "public"."story_likes" ADD CONSTRAINT "story_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."story_likes" ADD CONSTRAINT "story_likes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."chapter_likes" ADD CONSTRAINT "chapter_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."chapter_likes" ADD CONSTRAINT "chapter_likes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_likes" ADD CONSTRAINT "scene_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_likes" ADD CONSTRAINT "scene_likes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_dislikes" ADD CONSTRAINT "scene_dislikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."scene_dislikes" ADD CONSTRAINT "scene_dislikes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comment_dislikes" ADD CONSTRAINT "comment_dislikes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."comment_dislikes" ADD CONSTRAINT "comment_dislikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."post_likes" ADD CONSTRAINT "post_likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "public"."post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes
CREATE INDEX "idx_stories_author_id" ON "public"."stories" USING btree ("author_id");
CREATE INDEX "idx_stories_status" ON "public"."stories" USING btree ("status");
CREATE INDEX "idx_stories_status_updated" ON "public"."stories" USING btree ("status","updated_at") WHERE (status = 'published');
CREATE INDEX "idx_stories_view_count_published" ON "public"."stories" USING btree ("view_count" DESC) WHERE (status = 'published');
CREATE INDEX "idx_characters_story_id" ON "public"."characters" USING btree ("story_id");
CREATE INDEX "idx_characters_story_main" ON "public"."characters" USING btree ("story_id","is_main" DESC);
CREATE INDEX "idx_settings_story_id" ON "public"."settings" USING btree ("story_id");
CREATE INDEX "idx_parts_story_id" ON "public"."parts" USING btree ("story_id");
CREATE INDEX "idx_parts_order_index" ON "public"."parts" USING btree ("order_index");
CREATE INDEX "idx_chapters_story_id" ON "public"."chapters" USING btree ("story_id");
CREATE INDEX "idx_chapters_part_id" ON "public"."chapters" USING btree ("part_id");
CREATE INDEX "idx_chapters_status" ON "public"."chapters" USING btree ("status");
CREATE INDEX "idx_chapters_order_index" ON "public"."chapters" USING btree ("order_index");
CREATE INDEX "idx_scenes_chapter_id" ON "public"."scenes" USING btree ("chapter_id");
CREATE INDEX "idx_scenes_order_index" ON "public"."scenes" USING btree ("order_index");
CREATE INDEX "idx_scenes_visibility" ON "public"."scenes" USING btree ("visibility");
CREATE INDEX "idx_scenes_character_focus" ON "public"."scenes" USING gin ("character_focus");
CREATE INDEX "idx_scenes_suggested_length" ON "public"."scenes" USING btree ("suggested_length");
CREATE INDEX "idx_community_posts_story_id" ON "public"."community_posts" USING btree ("story_id");
CREATE INDEX "idx_community_posts_author_id" ON "public"."community_posts" USING btree ("author_id");
CREATE INDEX "idx_community_posts_created_at" ON "public"."community_posts" USING btree ("created_at" DESC);
CREATE INDEX "idx_community_posts_story_created" ON "public"."community_posts" USING btree ("story_id","created_at" DESC);
CREATE INDEX "idx_community_posts_title_search" ON "public"."community_posts" USING gin (to_tsvector('english', title::text));
CREATE INDEX "idx_community_posts_content_search" ON "public"."community_posts" USING gin (to_tsvector('english', content));
CREATE INDEX "studio_agent_chats_user_id_idx" ON "public"."studio_agent_chats" USING btree ("user_id");
CREATE INDEX "studio_agent_chats_story_id_idx" ON "public"."studio_agent_chats" USING btree ("story_id");
CREATE INDEX "studio_agent_chats_agent_type_idx" ON "public"."studio_agent_chats" USING btree ("agent_type");
CREATE INDEX "studio_agent_messages_chat_id_idx" ON "public"."studio_agent_messages" USING btree ("chat_id");
CREATE INDEX "studio_agent_messages_created_at_idx" ON "public"."studio_agent_messages" USING btree ("created_at");
CREATE INDEX "studio_agent_tool_executions_message_id_idx" ON "public"."studio_agent_tool_executions" USING btree ("message_id");
CREATE INDEX "studio_agent_tool_executions_tool_name_idx" ON "public"."studio_agent_tool_executions" USING btree ("tool_name");
