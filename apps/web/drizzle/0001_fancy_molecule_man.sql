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
ALTER TABLE "places" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "research" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "places" CASCADE;--> statement-breakpoint
DROP TABLE "research" CASCADE;--> statement-breakpoint
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_characterId_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "parts" DROP CONSTRAINT "parts_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "backstory" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "parts" ALTER COLUMN "order_index" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scene_views" ALTER COLUMN "id" SET DEFAULT 'gen_random_uuid()';--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "character_id" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "arc_position" "arc_position";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "contributes_to_macro_arc" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "focus_characters" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "adversity_type" "adversity_type";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "virtue_type" "virtue_type";--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "seeds_planted" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "seeds_resolved" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "connects_to_previous_chapter" text;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "creates_next_adversity" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "core_trait" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "internal_flaw" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "external_goal" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "voice_style" json;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "visual_style" text;--> statement-breakpoint
ALTER TABLE "parts" ADD COLUMN "character_arcs" json;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "cycle_phase" "cycle_phase";--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "emotional_beat" "emotional_beat";--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "character_focus" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "sensory_anchors" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "dialogue_vs_description" text;--> statement-breakpoint
ALTER TABLE "scenes" ADD COLUMN "suggested_length" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "adversity_elements" json;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "symbolic_meaning" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "cycle_amplification" json;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "emotional_resonance" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "moral_framework" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "email_notifications" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "push_notifications" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "marketing_emails" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "profile_visibility" varchar(20) DEFAULT 'public';--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "show_email" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "show_stats" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_story_metrics" ADD CONSTRAINT "daily_story_metrics_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_insight_id_story_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."story_insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_chats" ADD CONSTRAINT "studio_agent_chats_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_messages" ADD CONSTRAINT "studio_agent_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."studio_agent_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_agent_tool_executions" ADD CONSTRAINT "studio_agent_tool_executions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."studio_agent_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_metrics_story_date" ON "daily_story_metrics" USING btree ("story_id" text_ops,"date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_recommendation_feedback_insight" ON "recommendation_feedback" USING btree ("insight_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_recommendation_feedback_user" ON "recommendation_feedback" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_agent_type_idx" ON "studio_agent_chats" USING btree ("agent_type" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_story_id_idx" ON "studio_agent_chats" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_chats_user_id_idx" ON "studio_agent_chats" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_messages_chat_id_idx" ON "studio_agent_messages" USING btree ("chat_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_messages_created_at_idx" ON "studio_agent_messages" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_tool_executions_message_id_idx" ON "studio_agent_tool_executions" USING btree ("message_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "studio_agent_tool_executions_tool_name_idx" ON "studio_agent_tool_executions" USING btree ("tool_name" text_ops);--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_characterId_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_parts_order_index" ON "parts" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_parts_story_id" ON "parts" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_user" ON "reading_sessions" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_story" ON "reading_sessions" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_start_time" ON "reading_sessions" USING btree ("start_time" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_reading_sessions_duration" ON "reading_sessions" USING btree ("duration_seconds" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_chapter_id" ON "scenes" USING btree ("chapter_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_character_focus" ON "scenes" USING gin ("character_focus" jsonb_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_order_index" ON "scenes" USING btree ("order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_suggested_length" ON "scenes" USING btree ("suggested_length" text_ops);--> statement-breakpoint
CREATE INDEX "idx_scenes_visibility" ON "scenes" USING btree ("visibility" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_settings_story_id" ON "settings" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_author_id" ON "stories" USING btree ("author_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_status" ON "stories" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_stories_status_updated" ON "stories" USING btree ("status" timestamp_ops,"updated_at" enum_ops) WHERE (status = 'published'::status);--> statement-breakpoint
CREATE INDEX "idx_stories_view_count_published" ON "stories" USING btree ("view_count" int4_ops) WHERE (status = 'published'::status);--> statement-breakpoint
CREATE INDEX "idx_story_insights_story" ON "story_insights" USING btree ("story_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_type" ON "story_insights" USING btree ("insight_type" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_created" ON "story_insights" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_story_insights_unread" ON "story_insights" USING btree ("story_id" text_ops,"is_read" bool_ops);--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "word_count";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "target_word_count";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "purpose";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "hook";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "character_focus";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "pacing_goal";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "action_dialogue_ratio";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "chapter_hook";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "hns_data";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "characterId";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "arcPosition";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "contributesToMacroArc";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "focusCharacters";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "adversityType";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "virtueType";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "seedsPlanted";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "seedsResolved";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "connectsToPreviousChapter";--> statement-breakpoint
ALTER TABLE "chapters" DROP COLUMN "createsNextAdversity";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "archetype";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "storyline";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "motivations";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "voice";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "visual_reference_id";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "hns_data";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "coreTrait";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "internalFlaw";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "externalGoal";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "voiceStyle";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "visualStyle";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "target_word_count";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "current_word_count";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "structural_role";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "key_beats";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "hns_data";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "actNumber";--> statement-breakpoint
ALTER TABLE "parts" DROP COLUMN "characterArcs";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "word_count";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "goal";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "conflict";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "outcome";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "pov_character_id";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "narrative_voice";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "entry_hook";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "emotional_shift";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "hns_data";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "character_ids";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "place_ids";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "cyclePhase";--> statement-breakpoint
ALTER TABLE "scenes" DROP COLUMN "emotionalBeat";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "adversityElements";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "symbolicMeaning";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "cycleAmplification";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "emotionalResonance";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "target_word_count";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "current_word_count";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "premise";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "dramatic_question";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "hns_data";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "moralFramework";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "emailNotifications";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "pushNotifications";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "marketingEmails";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "profileVisibility";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "showEmail";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "showStats";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "emailVerified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updatedAt";