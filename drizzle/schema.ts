import { pgTable, index, foreignKey, unique, text, varchar, json, timestamp, boolean, jsonb, integer, check, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const comicStatus = pgEnum("comic_status", ['none', 'draft', 'published'])
export const contentType = pgEnum("content_type", ['markdown', 'html', 'plain'])
export const cyclePhase = pgEnum("cycle_phase", ['setup', 'confrontation', 'virtue', 'consequence', 'transition'])
export const emotionalBeat = pgEnum("emotional_beat", ['fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy'])
export const eventType = pgEnum("event_type", ['page_view', 'story_view', 'chapter_read_start', 'chapter_read_complete', 'scene_read', 'comment_created', 'comment_liked', 'story_liked', 'chapter_liked', 'post_created', 'post_viewed', 'share', 'bookmark'])
export const insightType = pgEnum("insight_type", ['quality_improvement', 'engagement_drop', 'reader_feedback', 'pacing_issue', 'character_development', 'plot_consistency', 'trending_up', 'publishing_opportunity', 'audience_mismatch'])
export const moderationStatus = pgEnum("moderation_status", ['approved', 'pending', 'flagged', 'rejected'])
export const publicationStatus = pgEnum("publication_status", ['pending', 'published', 'failed', 'cancelled'])
export const scheduleType = pgEnum("schedule_type", ['daily', 'weekly', 'custom', 'one-time'])
export const sessionType = pgEnum("session_type", ['continuous', 'interrupted', 'partial'])
export const sfxEmphasis = pgEnum("sfx_emphasis", ['normal', 'large', 'dramatic'])
export const shotType = pgEnum("shot_type", ['establishing_shot', 'wide_shot', 'medium_shot', 'close_up', 'extreme_close_up', 'over_shoulder', 'dutch_angle'])
export const status = pgEnum("status", ['writing', 'published'])
export const visibility = pgEnum("visibility", ['private', 'unlisted', 'public'])


export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: varchar({ length: 255 }).default('API Key').notNull(),
	keyHash: varchar("key_hash", { length: 64 }).notNull(),
	keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
	scopes: json().default([]).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_api_keys_hash").using("btree", table.keyHash.asc().nullsLast().op("text_ops")),
	index("idx_api_keys_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("api_keys_key_hash_unique").on(table.keyHash),
]);

export const analyticsEvents = pgTable("analytics_events", {
	id: text().primaryKey().notNull(),
	eventType: eventType("event_type").notNull(),
	userId: text("user_id"),
	sessionId: text("session_id").notNull(),
	storyId: text("story_id"),
	chapterId: text("chapter_id"),
	sceneId: text("scene_id"),
	postId: text("post_id"),
	metadata: json().default({}),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_analytics_events_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_analytics_events_story").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("idx_analytics_events_timestamp").using("btree", table.timestamp.asc().nullsLast().op("timestamp_ops")),
	index("idx_analytics_events_type").using("btree", table.eventType.asc().nullsLast().op("enum_ops")),
	index("idx_analytics_events_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_analytics_events_user_timestamp").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.timestamp.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "analytics_events_user_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "analytics_events_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "analytics_events_chapter_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "analytics_events_scene_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "analytics_events_post_id_fkey"
		}).onDelete("cascade"),
]);

export const settings = pgTable("settings", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	storyId: text("story_id").notNull(),
	description: text(),
	mood: text(),
	sensory: jsonb(),
	visualStyle: text("visual_style"),
	visualReferences: jsonb("visual_references"),
	colorPalette: jsonb("color_palette"),
	architecturalStyle: text("architectural_style"),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	imageVariants: json("image_variants"),
}, (table) => [
	index("idx_settings_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "settings_story_id_fkey"
		}),
]);

export const sceneEvaluations = pgTable("scene_evaluations", {
	id: text().primaryKey().notNull(),
	sceneId: text("scene_id").notNull(),
	evaluation: json().notNull(),
	overallScore: varchar("overall_score", { length: 10 }).notNull(),
	plotScore: varchar("plot_score", { length: 10 }).notNull(),
	characterScore: varchar("character_score", { length: 10 }).notNull(),
	pacingScore: varchar("pacing_score", { length: 10 }).notNull(),
	proseScore: varchar("prose_score", { length: 10 }).notNull(),
	worldBuildingScore: varchar("world_building_score", { length: 10 }).notNull(),
	modelVersion: varchar("model_version", { length: 50 }).default('gpt-4o-mini'),
	tokenUsage: integer("token_usage"),
	evaluationTimeMs: integer("evaluation_time_ms"),
	evaluatedAt: timestamp("evaluated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("scene_evaluations_evaluated_at_idx").using("btree", table.evaluatedAt.asc().nullsLast().op("timestamp_ops")),
	index("scene_evaluations_scene_id_idx").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "scene_evaluations_scene_id_fkey"
		}).onDelete("cascade"),
]);

export const readingSessions = pgTable("reading_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	sessionId: text("session_id").notNull(),
	storyId: text("story_id"),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	durationSeconds: integer("duration_seconds"),
	chaptersRead: integer("chapters_read").default(0),
	scenesRead: integer("scenes_read").default(0),
	charactersRead: integer("characters_read").default(0),
	sessionType: sessionType("session_type").default('continuous'),
	deviceType: varchar("device_type", { length: 20 }),
	completedStory: boolean("completed_story").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_reading_sessions_duration").using("btree", table.durationSeconds.asc().nullsLast().op("int4_ops")),
	index("idx_reading_sessions_start_time").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
	index("idx_reading_sessions_story").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("idx_reading_sessions_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reading_sessions_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "reading_sessions_story_id_fkey"
		}).onDelete("cascade"),
]);

export const recommendationFeedback = pgTable("recommendation_feedback", {
	id: text().primaryKey().notNull(),
	insightId: text("insight_id").notNull(),
	userId: text("user_id").notNull(),
	actionTaken: varchar("action_taken", { length: 50 }).notNull(),
	feedbackText: text("feedback_text"),
	wasHelpful: boolean("was_helpful"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_recommendation_feedback_insight").using("btree", table.insightId.asc().nullsLast().op("text_ops")),
	index("idx_recommendation_feedback_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.insightId],
			foreignColumns: [storyInsights.id],
			name: "recommendation_feedback_insight_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "recommendation_feedback_user_id_fkey"
		}).onDelete("cascade"),
]);

export const storyInsights = pgTable("story_insights", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	insightType: insightType("insight_type").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	severity: varchar({ length: 20 }).default('info'),
	actionItems: json("action_items").default([]),
	metrics: json().default({}),
	aiModel: varchar("ai_model", { length: 50 }),
	confidenceScore: varchar("confidence_score", { length: 10 }),
	isRead: boolean("is_read").default(false),
	isDismissed: boolean("is_dismissed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	index("idx_story_insights_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_story_insights_story").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("idx_story_insights_type").using("btree", table.insightType.asc().nullsLast().op("enum_ops")),
	index("idx_story_insights_unread").using("btree", table.storyId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_insights_story_id_fkey"
		}).onDelete("cascade"),
]);

export const storyLikes = pgTable("story_likes", {
	storyId: text("story_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.storyId, table.userId] }),
	index("story_likes_story_id_idx").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("story_likes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_likes_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "story_likes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const chapterLikes = pgTable("chapter_likes", {
	chapterId: text("chapter_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.chapterId, table.userId] }),
	index("chapter_likes_chapter_id_idx").using("btree", table.chapterId.asc().nullsLast().op("text_ops")),
	index("chapter_likes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "chapter_likes_chapter_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chapter_likes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const sceneLikes = pgTable("scene_likes", {
	sceneId: text("scene_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.sceneId, table.userId] }),
	index("scene_likes_scene_id_idx").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	index("scene_likes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "scene_likes_scene_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "scene_likes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const commentLikes = pgTable("comment_likes", {
	commentId: text("comment_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.commentId, table.userId] }),
	index("comment_likes_comment_id_idx").using("btree", table.commentId.asc().nullsLast().op("text_ops")),
	index("comment_likes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_likes_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comment_likes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const publishingSchedules = pgTable("publishing_schedules", {
	id: text().primaryKey().notNull(),
	storyId: text("story_id").notNull(),
	chapterId: text("chapter_id"),
	createdBy: text("created_by").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	scheduleType: scheduleType("schedule_type").notNull(),
	startDate: text("start_date").notNull(),
	endDate: text("end_date"),
	publishTime: text("publish_time").default('09:00:00').notNull(),
	intervalDays: integer("interval_days"),
	daysOfWeek: json("days_of_week"),
	scenesPerPublish: integer("scenes_per_publish").default(1),
	isActive: boolean("is_active").default(true),
	isCompleted: boolean("is_completed").default(false),
	lastPublishedAt: timestamp("last_published_at", { mode: 'string' }),
	nextPublishAt: timestamp("next_publish_at", { mode: 'string' }),
	totalPublished: integer("total_published").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_publishing_schedules_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_publishing_schedules_next_publish").using("btree", table.nextPublishAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_publishing_schedules_story").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "publishing_schedules_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "publishing_schedules_chapter_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "publishing_schedules_created_by_fkey"
		}),
]);

export const ratings = pgTable("ratings", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	storyId: text("story_id").notNull(),
	rating: integer().notNull(),
	review: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ratings_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "ratings_story_id_stories_id_fk"
		}),
]);

export const storySubscriptions = pgTable("story_subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	storyId: text("story_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "story_subscriptions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_subscriptions_story_id_stories_id_fk"
		}),
]);

export const writingSessions = pgTable("writing_sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	chapterId: text("chapter_id"),
	startTime: timestamp("start_time", { mode: 'string' }).defaultNow().notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	wordsWritten: integer("words_written").default(0),
	aiSuggestionsUsed: integer("ai_suggestions_used").default(0),
	status: varchar({ length: 50 }).default('active'),
	sessionData: json("session_data").default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "writing_sessions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "writing_sessions_chapter_id_chapters_id_fk"
		}),
]);

export const follows = pgTable("follows", {
	id: text().primaryKey().notNull(),
	followerId: text("follower_id").notNull(),
	followingId: text("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "follows_follower_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "follows_following_id_users_id_fk"
		}),
]);

export const reactions = pgTable("reactions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	targetId: text("target_id").notNull(),
	targetType: varchar("target_type", { length: 50 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reactions_user_id_users_id_fk"
		}),
]);

export const userAchievements = pgTable("user_achievements", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	achievementId: text("achievement_id").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_achievements_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.achievementId],
			foreignColumns: [achievements.id],
			name: "user_achievements_achievement_id_achievements_id_fk"
		}),
]);

export const achievements = pgTable("achievements", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	requirement: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	totalWordsWritten: integer("total_words_written").default(0),
	storiesPublished: integer("stories_published").default(0),
	chaptersPublished: integer("chapters_published").default(0),
	commentsReceived: integer("comments_received").default(0),
	totalViews: integer("total_views").default(0),
	averageRating: integer("average_rating").default(0),
	writingStreak: integer("writing_streak").default(0),
	bestStreak: integer("best_streak").default(0),
	level: integer().default(1),
	experience: integer().default(0),
	lastWritingDate: timestamp("last_writing_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_stats_user_id_users_id_fk"
		}),
]);

export const aiInteractions = pgTable("ai_interactions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	sessionId: text("session_id"),
	type: varchar({ length: 100 }).notNull(),
	prompt: text().notNull(),
	response: text().notNull(),
	applied: boolean().default(false),
	rating: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ai_interactions_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_ai_interactions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_interactions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [writingSessions.id],
			name: "ai_interactions_session_id_writing_sessions_id_fk"
		}),
]);

export const communityPosts = pgTable("community_posts", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	contentType: contentType("content_type").default('markdown').notNull(),
	contentHtml: text("content_html"),
	contentImages: jsonb("content_images").default([]),
	storyId: text("story_id").notNull(),
	authorId: text("author_id").notNull(),
	type: varchar({ length: 50 }).default('discussion'),
	isPinned: boolean("is_pinned").default(false),
	isLocked: boolean("is_locked").default(false),
	isEdited: boolean("is_edited").default(false),
	editCount: integer("edit_count").default(0),
	lastEditedAt: timestamp("last_edited_at", { mode: 'string' }),
	isDeleted: boolean("is_deleted").default(false),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	likes: integer().default(0),
	replies: integer().default(0),
	views: integer().default(0),
	moderationStatus: moderationStatus("moderation_status").default('approved'),
	moderationReason: text("moderation_reason"),
	moderatedBy: text("moderated_by"),
	moderatedAt: timestamp("moderated_at", { mode: 'string' }),
	tags: jsonb().default([]),
	mentions: jsonb().default([]),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_community_posts_activity").using("btree", table.lastActivityAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_community_posts_author_id").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("idx_community_posts_deleted").using("btree", table.isDeleted.asc().nullsLast().op("bool_ops")),
	index("idx_community_posts_moderation").using("btree", table.moderationStatus.asc().nullsLast().op("enum_ops")),
	index("idx_community_posts_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "community_posts_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "community_posts_author_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.moderatedBy],
			foreignColumns: [users.id],
			name: "community_posts_moderated_by_fkey"
		}),
]);

export const communityReplies = pgTable("community_replies", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	contentType: contentType("content_type").default('markdown').notNull(),
	contentHtml: text("content_html"),
	contentImages: jsonb("content_images").default([]),
	postId: text("post_id").notNull(),
	authorId: text("author_id").notNull(),
	parentReplyId: text("parent_reply_id"),
	depth: integer().default(0).notNull(),
	isEdited: boolean("is_edited").default(false),
	editCount: integer("edit_count").default(0),
	lastEditedAt: timestamp("last_edited_at", { mode: 'string' }),
	isDeleted: boolean("is_deleted").default(false),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	likes: integer().default(0),
	mentions: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_community_replies_author_id").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("idx_community_replies_deleted").using("btree", table.isDeleted.asc().nullsLast().op("bool_ops")),
	index("idx_community_replies_parent").using("btree", table.parentReplyId.asc().nullsLast().op("text_ops")),
	index("idx_community_replies_post_id").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "community_replies_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "community_replies_author_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentReplyId],
			foreignColumns: [table.id],
			name: "community_replies_parent_reply_id_fkey"
		}).onDelete("cascade"),
]);

export const postImages = pgTable("post_images", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	url: text().notNull(),
	filename: varchar({ length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	size: integer().notNull(),
	width: integer(),
	height: integer(),
	caption: text(),
	orderIndex: integer("order_index").default(0).notNull(),
	uploadedBy: text("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_post_images_post_id").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "post_images_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "post_images_uploaded_by_fkey"
		}).onDelete("cascade"),
]);

export const characters = pgTable("characters", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	personality: text(),
	background: text(),
	appearance: text(),
	role: varchar({ length: 100 }),
	storyId: text("story_id").notNull(),
	imageUrl: text("image_url"),
	isMain: boolean("is_main").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	content: text().default('),
	archetype: varchar({ length: 100 }),
	summary: text(),
	storyline: text(),
	backstory: jsonb(),
	motivations: jsonb(),
	voice: jsonb(),
	physicalDescription: jsonb("physical_description"),
	visualReferenceId: text("visual_reference_id"),
	hnsData: jsonb("hns_data"),
	imageVariants: json("image_variants"),
}, (table) => [
	index("idx_characters_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	index("idx_characters_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "characters_story_id_stories_id_fk"
		}),
]);

export const chapters = pgTable("chapters", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().default('),
	summary: text(),
	storyId: text("story_id").notNull(),
	partId: text("part_id"),
	orderIndex: integer("order_index").notNull(),
	wordCount: integer("word_count").default(0),
	targetWordCount: integer("target_word_count").default(4000),
	status: status().default('writing'),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	authorId: text("author_id").notNull(),
	purpose: text(),
	hook: text(),
	characterFocus: text("character_focus"),
	sceneIds: json("scene_ids").default([]),
	pacingGoal: varchar("pacing_goal", { length: 20 }),
	actionDialogueRatio: varchar("action_dialogue_ratio", { length: 10 }),
	chapterHook: jsonb("chapter_hook"),
	hnsData: jsonb("hns_data"),
	// Adversity-Triumph Engine fields
	characterId: text("characterId"),
	arcPosition: text("arcPosition"),
	contributesToMacroArc: text("contributesToMacroArc"),
	focusCharacters: jsonb("focusCharacters").default([]),
	adversityType: text("adversityType"),
	virtueType: text("virtueType"),
	seedsPlanted: jsonb("seedsPlanted").default([]),
	seedsResolved: jsonb("seedsResolved").default([]),
	connectsToPreviousChapter: text("connectsToPreviousChapter"),
	createsNextAdversity: text("createsNextAdversity"),
}, (table) => [
	index("idx_chapters_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	index("idx_chapters_part_id").using("btree", table.partId.asc().nullsLast().op("text_ops")),
	index("idx_chapters_status_order").using("btree", table.status.asc().nullsLast().op("int4_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	index("idx_chapters_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("idx_chapters_story_order").using("btree", table.storyId.asc().nullsLast().op("text_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "chapters_story_id_stories_id_fk"
		}),
	foreignKey({
			columns: [table.partId],
			foreignColumns: [parts.id],
			name: "chapters_part_id_parts_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "chapters_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.characterId],
			foreignColumns: [characters.id],
			name: "chapters_character_id_fkey"
		}).onDelete("set null"),
]);

export const parts = pgTable("parts", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	storyId: text("story_id").notNull(),
	orderIndex: integer("order_index").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	authorId: text("author_id").notNull(),
	targetWordCount: integer("target_word_count").default(0),
	currentWordCount: integer("current_word_count").default(0),
	partData: json("part_data"),
	content: text().default('),
	chapterIds: json("chapter_ids").default([]).notNull(),
	structuralRole: varchar("structural_role", { length: 50 }),
	summary: text(),
	keyBeats: jsonb("key_beats"),
	hnsData: jsonb("hns_data"),
}, (table) => [
	index("idx_parts_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	index("idx_parts_story_id").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("idx_parts_story_order").using("btree", table.storyId.asc().nullsLast().op("text_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "parts_story_id_stories_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "parts_author_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	image: text(),
	bio: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	username: varchar({ length: 50 }),
	password: varchar({ length: 255 }),
	role: varchar({ length: 20 }).default('reader').notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const postLikes = pgTable("post_likes", {
	postId: text("post_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.postId, table.userId] }),
	index("idx_post_likes_post_id").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("idx_post_likes_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "post_likes_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_likes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	theme: varchar({ length: 20 }).default('system'),
	language: varchar({ length: 10 }).default('en'),
	timezone: varchar({ length: 50 }).default('UTC'),
	emailNotifications: boolean().default(true),
	pushNotifications: boolean().default(false),
	marketingEmails: boolean().default(false),
	profileVisibility: varchar({ length: 20 }).default('public'),
	showEmail: boolean().default(false),
	showStats: boolean().default(true),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const postViews = pgTable("post_views", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	userId: text("user_id"),
	sessionId: varchar("session_id", { length: 255 }),
	ipHash: varchar("ip_hash", { length: 64 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_post_views_post_id").using("btree", table.postId.asc().nullsLast().op("text_ops")),
	index("idx_post_views_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [communityPosts.id],
			name: "post_views_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_views_user_id_fkey"
		}).onDelete("cascade"),
]);

export const scheduledPublications = pgTable("scheduled_publications", {
	id: text().primaryKey().notNull(),
	scheduleId: text("schedule_id"),
	storyId: text("story_id").notNull(),
	chapterId: text("chapter_id"),
	sceneId: text("scene_id"),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	status: publicationStatus().default('pending').notNull(),
	errorMessage: text("error_message"),
	retryCount: integer("retry_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_scheduled_publications_pending").using("btree", table.status.asc().nullsLast().op("enum_ops"), table.scheduledFor.asc().nullsLast().op("timestamp_ops")).where(sql`(status = 'pending'::publication_status)`),
	index("idx_scheduled_publications_schedule").using("btree", table.scheduleId.asc().nullsLast().op("text_ops")),
	index("idx_scheduled_publications_scheduled_for").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
	index("idx_scheduled_publications_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [publishingSchedules.id],
			name: "scheduled_publications_schedule_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "scheduled_publications_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "scheduled_publications_chapter_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "scheduled_publications_scene_id_fkey"
		}).onDelete("cascade"),
	check("scheduled_publications_check", sql`((chapter_id IS NOT NULL) AND (scene_id IS NULL)) OR ((chapter_id IS NULL) AND (scene_id IS NOT NULL))`),
]);

export const commentDislikes = pgTable("comment_dislikes", {
	commentId: text("comment_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.commentId, table.userId] }),
	index("idx_comment_dislikes_comment_id").using("btree", table.commentId.asc().nullsLast().op("text_ops")),
	index("idx_comment_dislikes_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_dislikes_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comment_dislikes_user_id_fkey"
		}).onDelete("cascade"),
]);

export const stories = pgTable("stories", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	genre: varchar({ length: 100 }),
	status: status().default('writing'),
	coverImage: text("cover_image"),
	tags: json().default([]),
	isPublic: boolean("is_public").default(false),
	authorId: text("author_id").notNull(),
	targetWordCount: integer("target_word_count").default(50000),
	currentWordCount: integer("current_word_count").default(0),
	viewCount: integer("view_count").default(0),
	rating: integer().default(0),
	ratingCount: integer("rating_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	storyData: json("story_data"),
	content: text().default('),
	partIds: json("part_ids").default([]),
	chapterIds: json("chapter_ids").default([]),
	premise: text(),
	dramaticQuestion: text("dramatic_question"),
	theme: text(),
	hnsData: jsonb("hns_data"),
	imageUrl: text("image_url"),
	imageVariants: json("image_variants"),
}, (table) => [
	index("idx_stories_author_id").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("idx_stories_author_status").using("btree", table.authorId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("idx_stories_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	index("idx_stories_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_stories_status_created").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("enum_ops")),
	index("idx_stories_view_count").using("btree", table.viewCount.desc().nullsFirst().op("int4_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "stories_author_id_users_id_fk"
		}),
]);

export const sceneDislikes = pgTable("scene_dislikes", {
	userId: text("user_id").notNull(),
	sceneId: text("scene_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.sceneId] }),
	index("idx_scene_dislikes_scene_id").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	index("idx_scene_dislikes_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "scene_dislikes_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "scene_dislikes_scene_id_fkey"
		}).onDelete("cascade"),
]);

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	userId: text("user_id").notNull(),
	storyId: text("story_id").notNull(),
	chapterId: text("chapter_id"),
	sceneId: text("scene_id"),
	parentCommentId: text("parent_comment_id"),
	depth: integer().default(0).notNull(),
	likeCount: integer("like_count").default(0).notNull(),
	replyCount: integer("reply_count").default(0).notNull(),
	isEdited: boolean("is_edited").default(false).notNull(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	dislikeCount: integer("dislike_count").default(0).notNull(),
}, (table) => [
	index("comments_chapter_id_idx").using("btree", table.chapterId.asc().nullsLast().op("text_ops")),
	index("comments_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("comments_parent_comment_id_idx").using("btree", table.parentCommentId.asc().nullsLast().op("text_ops")),
	index("comments_scene_id_idx").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	index("comments_story_id_idx").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("comments_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "comments_story_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "comments_chapter_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "comments_scene_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "comments_parent_comment_id_fkey"
		}).onDelete("cascade"),
]);

export const places = pgTable("places", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	storyId: text("story_id").notNull(),
	isMain: boolean("is_main").default(false),
	content: text().default('),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	imageVariants: json("image_variants"),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "places_story_id_fkey"
		}),
]);

export const comicPanels = pgTable("comic_panels", {
	id: text().primaryKey().notNull(),
	sceneId: text("scene_id").notNull(),
	panelNumber: integer("panel_number").notNull(),
	shotType: shotType("shot_type").notNull(),
	imageUrl: text("image_url"),
	imageVariants: json("image_variants"),
	dialogue: json(),
	sfx: json(),
	gutterAfter: integer("gutter_after"),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "comic_panels_scene_id_fkey"
		}).onDelete("cascade"),
]);

export const scenes = pgTable("scenes", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().default('),
	chapterId: text("chapter_id").notNull(),
	orderIndex: integer("order_index").notNull(),
	wordCount: integer("word_count").default(0),
	goal: text(),
	conflict: text(),
	outcome: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	characterIds: json("character_ids").default([]),
	placeIds: json("place_ids").default([]),
	povCharacterId: text("pov_character_id"),
	settingId: text("setting_id"),
	narrativeVoice: varchar("narrative_voice", { length: 50 }),
	summary: text(),
	entryHook: text("entry_hook"),
	emotionalShift: jsonb("emotional_shift"),
	hnsData: jsonb("hns_data"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	visibility: visibility().default('private').notNull(),
	autoPublish: boolean("auto_publish").default(false),
	publishedBy: text("published_by"),
	unpublishedAt: timestamp("unpublished_at", { mode: 'string' }),
	unpublishedBy: text("unpublished_by"),
	imageUrl: text("image_url"),
	imageVariants: json("image_variants"),
	comicStatus: comicStatus("comic_status").default('none').notNull(),
	comicPublishedAt: timestamp("comic_published_at", { mode: 'string' }),
	comicPublishedBy: text("comic_published_by"),
	comicUnpublishedAt: timestamp("comic_unpublished_at", { mode: 'string' }),
	comicUnpublishedBy: text("comic_unpublished_by"),
	comicGeneratedAt: timestamp("comic_generated_at", { mode: 'string' }),
	comicPanelCount: integer("comic_panel_count").default(0),
	comicVersion: integer("comic_version").default(1),
	// Adversity-Triumph Engine fields
	cyclePhase: cyclePhase("cyclePhase"),
	emotionalBeat: emotionalBeat("emotionalBeat"),
	characterFocus: jsonb("characterFocus").default([]),
	sensoryAnchors: jsonb("sensoryAnchors").default([]),
	dialogueVsDescription: text("dialogueVsDescription"),
	suggestedLength: text("suggestedLength"),
}, (table) => [
	index("idx_scenes_chapter_id").using("btree", table.chapterId.asc().nullsLast().op("text_ops")),
	index("idx_scenes_chapter_order").using("btree", table.chapterId.asc().nullsLast().op("int4_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	index("idx_scenes_chapter_visibility_order").using("btree", table.chapterId.asc().nullsLast().op("int4_ops"), table.visibility.asc().nullsLast().op("text_ops"), table.orderIndex.asc().nullsLast().op("int4_ops")),
	index("idx_scenes_comic_published_at").using("btree", table.comicPublishedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_scenes_comic_status").using("btree", table.comicStatus.asc().nullsLast().op("enum_ops")),
	index("idx_scenes_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	index("idx_scenes_published_at").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_scenes_scheduled_for").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
	index("idx_scenes_status_visibility").using("btree", table.visibility.asc().nullsLast().op("enum_ops")),
	index("idx_scenes_visibility").using("btree", table.visibility.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "scenes_chapter_id_chapters_id_fk"
		}),
	foreignKey({
			columns: [table.publishedBy],
			foreignColumns: [users.id],
			name: "scenes_published_by_fkey"
		}),
	foreignKey({
			columns: [table.unpublishedBy],
			foreignColumns: [users.id],
			name: "scenes_unpublished_by_fkey"
		}),
	foreignKey({
			columns: [table.comicPublishedBy],
			foreignColumns: [users.id],
			name: "scenes_comic_published_by_fkey"
		}),
	foreignKey({
			columns: [table.comicUnpublishedBy],
			foreignColumns: [users.id],
			name: "scenes_comic_unpublished_by_fkey"
		}),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pk"}),
]);
