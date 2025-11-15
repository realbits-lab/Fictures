CREATE TYPE "public"."adversity_type" AS ENUM('internal', 'external', 'both');--> statement-breakpoint
CREATE TYPE "public"."arc_position" AS ENUM('beginning', 'middle', 'climax', 'resolution');--> statement-breakpoint
CREATE TYPE "public"."comic_status" AS ENUM('none', 'draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('markdown', 'html', 'plain');--> statement-breakpoint
CREATE TYPE "public"."cycle_phase" AS ENUM('setup', 'adversity', 'virtue', 'consequence', 'transition');--> statement-breakpoint
CREATE TYPE "public"."emotional_beat" AS ENUM('fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('page_view', 'story_view', 'chapter_read_start', 'chapter_read_complete', 'scene_read', 'comment_created', 'comment_liked', 'story_liked', 'chapter_liked', 'post_created', 'post_viewed', 'share', 'bookmark');--> statement-breakpoint
CREATE TYPE "public"."insight_type" AS ENUM('quality_improvement', 'engagement_drop', 'reader_feedback', 'pacing_issue', 'character_development', 'plot_consistency', 'trending_up', 'publishing_opportunity', 'audience_mismatch');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('approved', 'pending', 'flagged', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('pending', 'published', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reading_format" AS ENUM('novel', 'comic');--> statement-breakpoint
CREATE TYPE "public"."schedule_type" AS ENUM('daily', 'weekly', 'custom', 'one-time');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('continuous', 'interrupted', 'partial');--> statement-breakpoint
CREATE TYPE "public"."sfx_emphasis" AS ENUM('normal', 'large', 'dramatic');--> statement-breakpoint
CREATE TYPE "public"."shot_type" AS ENUM('establishing_shot', 'wide_shot', 'medium_shot', 'close_up', 'extreme_close_up', 'over_shoulder', 'dutch_angle');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('writing', 'published');--> statement-breakpoint
CREATE TYPE "public"."tone" AS ENUM('hopeful', 'dark', 'bittersweet', 'satirical');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('reader', 'writer', 'manager');--> statement-breakpoint
CREATE TYPE "public"."virtue_type" AS ENUM('courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"response" text NOT NULL,
	"applied" boolean DEFAULT false,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
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
--> statement-breakpoint
CREATE TABLE "api_keys" (
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
--> statement-breakpoint
CREATE TABLE "chapter_likes" (
	"user_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_likes_user_id_chapter_id_pk" PRIMARY KEY("user_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"part_id" text,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"character_id" text,
	"arc_position" "arc_position",
	"contributes_to_macro_arc" text,
	"focus_characters" json DEFAULT '[]'::json,
	"adversity_type" "adversity_type",
	"virtue_type" "virtue_type",
	"seeds_planted" json DEFAULT '[]'::json,
	"seeds_resolved" json DEFAULT '[]'::json,
	"connects_to_previous_chapter" text,
	"creates_next_adversity" text,
	"status" "status" DEFAULT 'writing' NOT NULL,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_main" boolean DEFAULT false,
	"summary" text,
	"core_trait" text,
	"internal_flaw" text,
	"external_goal" text,
	"personality" json,
	"backstory" text,
	"relationships" json,
	"physical_description" json,
	"voice_style" json,
	"image_url" text,
	"image_variants" json,
	"visual_style" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comic_panels" (
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
--> statement-breakpoint
CREATE TABLE "comment_dislikes" (
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_dislikes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
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
--> statement-breakpoint
CREATE TABLE "community_posts" (
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
--> statement-breakpoint
CREATE TABLE "community_replies" (
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
--> statement-breakpoint
CREATE TABLE "daily_story_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_views" integer DEFAULT 0,
	"unique_readers" integer DEFAULT 0,
	"new_readers" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"bookmarks" integer DEFAULT 0,
	"engagement_rate" varchar(10) DEFAULT '0',
	"avg_session_duration" integer DEFAULT 0,
	"total_sessions" integer DEFAULT 0,
	"completed_sessions" integer DEFAULT 0,
	"completion_rate" varchar(10) DEFAULT '0',
	"avg_chapters_per_session" varchar(10) DEFAULT '0',
	"mobile_users" integer DEFAULT 0,
	"desktop_users" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_metrics_story_date_unique" UNIQUE("story_id","date")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"character_arcs" json,
	"order_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_views" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text,
	"session_id" varchar(255),
	"ip_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishing_schedules" (
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
--> statement-breakpoint
CREATE TABLE "reading_history" (
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
--> statement-breakpoint
CREATE TABLE "reading_sessions" (
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
--> statement-breakpoint
CREATE TABLE "recommendation_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"insight_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action_taken" varchar(50) NOT NULL,
	"feedback_text" text,
	"was_helpful" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scene_dislikes" (
	"user_id" text NOT NULL,
	"scene_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_dislikes_user_id_scene_id_pk" PRIMARY KEY("user_id","scene_id")
);
--> statement-breakpoint
CREATE TABLE "scene_evaluations" (
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
--> statement-breakpoint
CREATE TABLE "scene_likes" (
	"user_id" text NOT NULL,
	"scene_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scene_likes_user_id_scene_id_pk" PRIMARY KEY("user_id","scene_id")
);
--> statement-breakpoint
CREATE TABLE "scene_views" (
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
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"cycle_phase" "cycle_phase",
	"emotional_beat" "emotional_beat",
	"character_focus" jsonb DEFAULT '[]'::jsonb,
	"setting_id" text,
	"sensory_anchors" jsonb DEFAULT '[]'::jsonb,
	"dialogue_vs_description" text,
	"suggested_length" text,
	"content" text DEFAULT '',
	"image_url" text,
	"image_variants" json,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"published_at" timestamp,
	"published_by" text,
	"unpublished_at" timestamp,
	"unpublished_by" text,
	"scheduled_for" timestamp,
	"auto_publish" boolean DEFAULT false,
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
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_publications" (
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
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"summary" text,
	"adversity_elements" json,
	"symbolic_meaning" text,
	"cycle_amplification" json,
	"mood" text,
	"emotional_resonance" text,
	"sensory" json,
	"architectural_style" text,
	"image_url" text,
	"image_variants" json,
	"visual_style" text,
	"visual_references" json,
	"color_palette" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"genre" varchar(100),
	"tone" "tone",
	"moral_framework" text,
	"status" "status" DEFAULT 'writing' NOT NULL,
	"view_count" integer DEFAULT 0,
	"rating" integer DEFAULT 0,
	"rating_count" integer DEFAULT 0,
	"image_url" text,
	"image_variants" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_insights" (
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
--> statement-breakpoint
CREATE TABLE "story_likes" (
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_likes_user_id_story_id_pk" PRIMARY KEY("user_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "studio_agent_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text,
	"agent_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"context" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_agent_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"parts" json,
	"reasoning" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_agent_tool_executions" (
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
--> statement-breakpoint
CREATE TABLE "user_preferences" (
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
--> statement-breakpoint
CREATE TABLE "user_stats" (
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
--> statement-breakpoint
CREATE TABLE "users" (
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
--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_likes" ADD CONSTRAINT "chapter_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_likes" ADD CONSTRAINT "chapter_likes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_characterId_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comic_panels" ADD CONSTRAINT "comic_panels_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_dislikes" ADD CONSTRAINT "comment_dislikes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_dislikes" ADD CONSTRAINT "comment_dislikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_replies" ADD CONSTRAINT "community_replies_parent_reply_id_community_replies_id_fk" FOREIGN KEY ("parent_reply_id") REFERENCES "public"."community_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_story_metrics" ADD CONSTRAINT "daily_story_metrics_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_schedules" ADD CONSTRAINT "publishing_schedules_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_schedules" ADD CONSTRAINT "publishing_schedules_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_schedules" ADD CONSTRAINT "publishing_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_insight_id_story_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."story_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_dislikes" ADD CONSTRAINT "scene_dislikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_dislikes" ADD CONSTRAINT "scene_dislikes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_evaluations" ADD CONSTRAINT "scene_evaluations_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_likes" ADD CONSTRAINT "scene_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_likes" ADD CONSTRAINT "scene_likes_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_views" ADD CONSTRAINT "scene_views_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_views" ADD CONSTRAINT "scene_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_unpublished_by_users_id_fk" FOREIGN KEY ("unpublished_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_comic_published_by_users_id_fk" FOREIGN KEY ("comic_published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_comic_unpublished_by_users_id_fk" FOREIGN KEY ("comic_unpublished_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_publications" ADD CONSTRAINT "scheduled_publications_schedule_id_publishing_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."publishing_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_publications" ADD CONSTRAINT "scheduled_publications_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_publications" ADD CONSTRAINT "scheduled_publications_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_publications" ADD CONSTRAINT "scheduled_publications_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_insights" ADD CONSTRAINT "story_insights_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_messages" ADD CONSTRAINT "studio_agent_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."studio_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_tool_executions" ADD CONSTRAINT "studio_agent_tool_executions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."studio_agent_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_events_user" ON "analytics_events" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_session" ON "analytics_events" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_story" ON "analytics_events" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_type" ON "analytics_events" USING btree ("event_type" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_timestamp" ON "analytics_events" USING btree ("timestamp" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_user_timestamp" ON "analytics_events" USING btree ("user_id" text_ops,"timestamp" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_chapters_order_index" ON "chapters" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_chapters_part_id" ON "chapters" USING btree ("part_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_chapters_status" ON "chapters" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_chapters_story_id" ON "chapters" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_characters_story_id" ON "characters" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_characters_story_main" ON "characters" USING btree ("story_id" text_ops,"is_main" text_ops);--> statement-breakpoint
CREATE INDEX "idx_community_posts_author_id" ON "community_posts" USING btree ("author_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_community_posts_content_search" ON "community_posts" USING gin (to_tsvector('english'::regconfig, content));--> statement-breakpoint
CREATE INDEX "idx_community_posts_created_at" ON "community_posts" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_community_posts_story_created" ON "community_posts" USING btree ("story_id" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_community_posts_story_id" ON "community_posts" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_community_posts_title_search" ON "community_posts" USING gin (to_tsvector('english'::regconfig, (title)::text));--> statement-breakpoint
CREATE INDEX "idx_daily_metrics_story_date" ON "daily_story_metrics" USING btree ("story_id" text_ops,"date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_parts_order_index" ON "parts" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_parts_story_id" ON "parts" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_user" ON "reading_sessions" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_story" ON "reading_sessions" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_start_time" ON "reading_sessions" USING btree ("start_time" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_duration" ON "reading_sessions" USING btree ("duration_seconds" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_recommendation_feedback_insight" ON "recommendation_feedback" USING btree ("insight_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_recommendation_feedback_user" ON "recommendation_feedback" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_chapter_id" ON "scenes" USING btree ("chapter_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_character_focus" ON "scenes" USING gin ("character_focus" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_order_index" ON "scenes" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_suggested_length" ON "scenes" USING btree ("suggested_length" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_visibility" ON "scenes" USING btree ("visibility" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_settings_story_id" ON "settings" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_author_id" ON "stories" USING btree ("author_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_status" ON "stories" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_status_updated" ON "stories" USING btree ("status" enum_ops,"updated_at" timestamp_ops) WHERE (status = 'published'::status);--> statement-breakpoint
CREATE INDEX "idx_stories_view_count_published" ON "stories" USING btree ("view_count" int4_ops) WHERE (status = 'published'::status);--> statement-breakpoint
CREATE INDEX "idx_story_insights_story" ON "story_insights" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_type" ON "story_insights" USING btree ("insight_type" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_created" ON "story_insights" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_unread" ON "story_insights" USING btree ("story_id" text_ops,"is_read" bool_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_agent_type_idx" ON "studio_agent_chats" USING btree ("agent_type" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_story_id_idx" ON "studio_agent_chats" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_user_id_idx" ON "studio_agent_chats" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_messages_chat_id_idx" ON "studio_agent_messages" USING btree ("chat_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_messages_created_at_idx" ON "studio_agent_messages" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_tool_executions_message_id_idx" ON "studio_agent_tool_executions" USING btree ("message_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_tool_executions_tool_name_idx" ON "studio_agent_tool_executions" USING btree ("tool_name" text_ops);