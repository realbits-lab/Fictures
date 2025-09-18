import { pgTable, foreignKey, text, varchar, boolean, timestamp, unique, integer, json, index, jsonb, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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
			foreignColumns: [user.id],
			name: "user_preferences_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	username: varchar({ length: 50 }),
	password: varchar({ length: 255 }),
	bio: text(),
	role: varchar({ length: 20 }).default('reader').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_key").on(table.email),
	unique("user_username_key").on(table.username),
]);

export const session = pgTable("session", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
]);

export const places = pgTable("places", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	storyId: text("story_id").notNull(),
	isMain: boolean("is_main").default(false),
	content: text().default('),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "places_story_id_fkey"
		}),
]);

export const scenes = pgTable("scenes", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().default('),
	chapterId: text("chapter_id").notNull(),
	orderIndex: integer("order_index").notNull(),
	wordCount: integer("word_count").default(0),
	status: varchar({ length: 50 }).default('planned'),
	goal: text(),
	conflict: text(),
	outcome: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	characterIds: json("character_ids").default([]).notNull(),
	placeIds: json("place_ids").default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "scenes_chapter_id_chapters_id_fk"
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
	status: varchar({ length: 50 }).default('draft'),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	authorId: text("author_id").notNull(),
	purpose: text(),
	hook: text(),
	characterFocus: text("character_focus"),
	sceneIds: jsonb("scene_ids").default([]).notNull(),
}, (table) => [
	index("idx_chapters_scene_ids").using("gin", table.sceneIds.asc().nullsLast().op("jsonb_ops")),
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
			columns: [table.sessionId],
			foreignColumns: [writingSessions.id],
			name: "ai_interactions_session_id_writing_sessions_id_fk"
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
			columns: [table.chapterId],
			foreignColumns: [chapters.id],
			name: "writing_sessions_chapter_id_chapters_id_fk"
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
]);

export const follows = pgTable("follows", {
	id: text().primaryKey().notNull(),
	followerId: text("follower_id").notNull(),
	followingId: text("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

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
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "ratings_story_id_stories_id_fk"
		}),
]);

export const reactions = pgTable("reactions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	targetId: text("target_id").notNull(),
	targetType: varchar("target_type", { length: 50 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const storySubscriptions = pgTable("story_subscriptions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	storyId: text("story_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "story_subscriptions_story_id_stories_id_fk"
		}),
]);

export const userAchievements = pgTable("user_achievements", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	achievementId: text("achievement_id").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
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
});

export const stories = pgTable("stories", {
	id: text().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	genre: varchar({ length: 100 }),
	status: varchar({ length: 50 }).default('draft'),
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
	partIds: jsonb("part_ids").default([]).notNull(),
	chapterIds: jsonb("chapter_ids").default([]).notNull(),
	content: text().default('),
}, (table) => [
	index("idx_stories_chapter_ids").using("gin", table.chapterIds.asc().nullsLast().op("jsonb_ops")),
	index("idx_stories_part_ids").using("gin", table.partIds.asc().nullsLast().op("jsonb_ops")),
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
	status: varchar({ length: 50 }).default('planned'),
	chapterIds: jsonb("chapter_ids").default([]).notNull(),
	content: text().default('),
}, (table) => [
	index("idx_parts_chapter_ids").using("gin", table.chapterIds.asc().nullsLast().op("jsonb_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "parts_story_id_stories_id_fk"
		}),
]);

export const characters = pgTable("characters", {
	id: text().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	storyId: text("story_id").notNull(),
	isMain: boolean("is_main").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	content: text().default('),
}, (table) => [
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "characters_story_id_stories_id_fk"
		}),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_pkey"}),
]);

export const account = pgTable("account", {
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
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_pkey"}),
]);
