import { pgTable, index, foreignKey, unique, text, varchar, json, timestamp, boolean, jsonb, integer, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const status = pgEnum("status", ['writing', 'published'])


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

export const places = pgTable("places", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	storyId: text("story_id").notNull(),
	isMain: boolean("is_main").default(false),
	content: text().default('),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "places_story_id_fkey"
		}),
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
}, (table) => [
	index("idx_characters_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "characters_story_id_stories_id_fk"
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

export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	content: text().notNull(),
	chapterId: text("chapter_id").notNull(),
	userId: text("user_id").notNull(),
	parentId: text("parent_id"),
	likes: integer().default(0),
	isHighlighted: boolean("is_highlighted").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "comments_chapter_id_chapters_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
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
}, (table) => [
	index("idx_scenes_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "scenes_chapter_id_chapters_id_fk"
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

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
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
}, (table) => [
	index("idx_stories_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "stories_author_id_users_id_fk"
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
}, (table) => [
	index("idx_chapters_hns_data").using("gin", table.hnsData.asc().nullsLast().op("jsonb_ops")),
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

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_providerAccountId_pk"}),
]);
