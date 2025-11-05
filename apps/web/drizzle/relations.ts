import { relations } from "drizzle-orm/relations";
import { publishingSchedules, scheduledPublications, stories, chapters, scenes, characters, users, communityPosts, communityReplies, studioAgentChats, apiKeys, aiInteractions, analyticsEvents, parts, comments, userPreferences, userStats, readingHistory, readingSessions, settings, storyInsights, postViews, studioAgentMessages, comicPanels, sceneEvaluations, sceneViews, studioAgentToolExecutions, storyLikes, chapterLikes, commentDislikes, commentLikes, postLikes, sceneDislikes, sceneLikes } from "./schema";

export const scheduledPublicationsRelations = relations(scheduledPublications, ({one}) => ({
	publishingSchedule: one(publishingSchedules, {
		fields: [scheduledPublications.scheduleId],
		references: [publishingSchedules.id]
	}),
	story: one(stories, {
		fields: [scheduledPublications.storyId],
		references: [stories.id]
	}),
	chapter: one(chapters, {
		fields: [scheduledPublications.chapterId],
		references: [chapters.id]
	}),
	scene: one(scenes, {
		fields: [scheduledPublications.sceneId],
		references: [scenes.id]
	}),
}));

export const publishingSchedulesRelations = relations(publishingSchedules, ({one, many}) => ({
	scheduledPublications: many(scheduledPublications),
	story: one(stories, {
		fields: [publishingSchedules.storyId],
		references: [stories.id]
	}),
	chapter: one(chapters, {
		fields: [publishingSchedules.chapterId],
		references: [chapters.id]
	}),
	user: one(users, {
		fields: [publishingSchedules.createdBy],
		references: [users.id]
	}),
}));

export const storiesRelations = relations(stories, ({one, many}) => ({
	scheduledPublications: many(scheduledPublications),
	characters: many(characters),
	user: one(users, {
		fields: [stories.authorId],
		references: [users.id]
	}),
	studioAgentChats: many(studioAgentChats),
	analyticsEvents: many(analyticsEvents),
	chapters: many(chapters),
	comments: many(comments),
	communityPosts: many(communityPosts),
	publishingSchedules: many(publishingSchedules),
	parts: many(parts),
	readingHistories: many(readingHistory),
	readingSessions: many(readingSessions),
	settings: many(settings),
	storyInsights: many(storyInsights),
	storyLikes: many(storyLikes),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	scheduledPublications: many(scheduledPublications),
	analyticsEvents: many(analyticsEvents),
	story: one(stories, {
		fields: [chapters.storyId],
		references: [stories.id]
	}),
	part: one(parts, {
		fields: [chapters.partId],
		references: [parts.id]
	}),
	character: one(characters, {
		fields: [chapters.characterId],
		references: [characters.id]
	}),
	comments: many(comments),
	publishingSchedules: many(publishingSchedules),
	scenes: many(scenes),
	chapterLikes: many(chapterLikes),
}));

export const scenesRelations = relations(scenes, ({one, many}) => ({
	scheduledPublications: many(scheduledPublications),
	analyticsEvents: many(analyticsEvents),
	comments: many(comments),
	chapter: one(chapters, {
		fields: [scenes.chapterId],
		references: [chapters.id]
	}),
	user_publishedBy: one(users, {
		fields: [scenes.publishedBy],
		references: [users.id],
		relationName: "scenes_publishedBy_users_id"
	}),
	user_unpublishedBy: one(users, {
		fields: [scenes.unpublishedBy],
		references: [users.id],
		relationName: "scenes_unpublishedBy_users_id"
	}),
	user_comicPublishedBy: one(users, {
		fields: [scenes.comicPublishedBy],
		references: [users.id],
		relationName: "scenes_comicPublishedBy_users_id"
	}),
	user_comicUnpublishedBy: one(users, {
		fields: [scenes.comicUnpublishedBy],
		references: [users.id],
		relationName: "scenes_comicUnpublishedBy_users_id"
	}),
	comicPanels: many(comicPanels),
	sceneEvaluations: many(sceneEvaluations),
	sceneViews: many(sceneViews),
	sceneDislikes: many(sceneDislikes),
	sceneLikes: many(sceneLikes),
}));

export const charactersRelations = relations(characters, ({one, many}) => ({
	story: one(stories, {
		fields: [characters.storyId],
		references: [stories.id]
	}),
	chapters: many(chapters),
}));

export const usersRelations = relations(users, ({many}) => ({
	stories: many(stories),
	communityReplies: many(communityReplies),
	studioAgentChats: many(studioAgentChats),
	apiKeys: many(apiKeys),
	aiInteractions: many(aiInteractions),
	analyticsEvents: many(analyticsEvents),
	comments: many(comments),
	communityPosts_authorId: many(communityPosts, {
		relationName: "communityPosts_authorId_users_id"
	}),
	communityPosts_moderatedBy: many(communityPosts, {
		relationName: "communityPosts_moderatedBy_users_id"
	}),
	publishingSchedules: many(publishingSchedules),
	userPreferences: many(userPreferences),
	userStats: many(userStats),
	readingHistories: many(readingHistory),
	readingSessions: many(readingSessions),
	postViews: many(postViews),
	scenes_publishedBy: many(scenes, {
		relationName: "scenes_publishedBy_users_id"
	}),
	scenes_unpublishedBy: many(scenes, {
		relationName: "scenes_unpublishedBy_users_id"
	}),
	scenes_comicPublishedBy: many(scenes, {
		relationName: "scenes_comicPublishedBy_users_id"
	}),
	scenes_comicUnpublishedBy: many(scenes, {
		relationName: "scenes_comicUnpublishedBy_users_id"
	}),
	sceneViews: many(sceneViews),
	storyLikes: many(storyLikes),
	chapterLikes: many(chapterLikes),
	commentDislikes: many(commentDislikes),
	commentLikes: many(commentLikes),
	postLikes: many(postLikes),
	sceneDislikes: many(sceneDislikes),
	sceneLikes: many(sceneLikes),
}));

export const communityRepliesRelations = relations(communityReplies, ({one, many}) => ({
	communityPost: one(communityPosts, {
		fields: [communityReplies.postId],
		references: [communityPosts.id]
	}),
	user: one(users, {
		fields: [communityReplies.authorId],
		references: [users.id]
	}),
	communityReply: one(communityReplies, {
		fields: [communityReplies.parentReplyId],
		references: [communityReplies.id],
		relationName: "communityReplies_parentReplyId_communityReplies_id"
	}),
	communityReplies: many(communityReplies, {
		relationName: "communityReplies_parentReplyId_communityReplies_id"
	}),
}));

export const communityPostsRelations = relations(communityPosts, ({one, many}) => ({
	communityReplies: many(communityReplies),
	analyticsEvents: many(analyticsEvents),
	story: one(stories, {
		fields: [communityPosts.storyId],
		references: [stories.id]
	}),
	user_authorId: one(users, {
		fields: [communityPosts.authorId],
		references: [users.id],
		relationName: "communityPosts_authorId_users_id"
	}),
	user_moderatedBy: one(users, {
		fields: [communityPosts.moderatedBy],
		references: [users.id],
		relationName: "communityPosts_moderatedBy_users_id"
	}),
	postViews: many(postViews),
	postLikes: many(postLikes),
}));

export const studioAgentChatsRelations = relations(studioAgentChats, ({one, many}) => ({
	user: one(users, {
		fields: [studioAgentChats.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [studioAgentChats.storyId],
		references: [stories.id]
	}),
	studioAgentMessages: many(studioAgentMessages),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({one}) => ({
	user: one(users, {
		fields: [aiInteractions.userId],
		references: [users.id]
	}),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({one}) => ({
	user: one(users, {
		fields: [analyticsEvents.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [analyticsEvents.storyId],
		references: [stories.id]
	}),
	chapter: one(chapters, {
		fields: [analyticsEvents.chapterId],
		references: [chapters.id]
	}),
	scene: one(scenes, {
		fields: [analyticsEvents.sceneId],
		references: [scenes.id]
	}),
	communityPost: one(communityPosts, {
		fields: [analyticsEvents.postId],
		references: [communityPosts.id]
	}),
}));

export const partsRelations = relations(parts, ({one, many}) => ({
	chapters: many(chapters),
	story: one(stories, {
		fields: [parts.storyId],
		references: [stories.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [comments.storyId],
		references: [stories.id]
	}),
	chapter: one(chapters, {
		fields: [comments.chapterId],
		references: [chapters.id]
	}),
	scene: one(scenes, {
		fields: [comments.sceneId],
		references: [scenes.id]
	}),
	comment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
		relationName: "comments_parentCommentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentCommentId_comments_id"
	}),
	commentDislikes: many(commentDislikes),
	commentLikes: many(commentLikes),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const readingHistoryRelations = relations(readingHistory, ({one}) => ({
	user: one(users, {
		fields: [readingHistory.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [readingHistory.storyId],
		references: [stories.id]
	}),
}));

export const readingSessionsRelations = relations(readingSessions, ({one}) => ({
	user: one(users, {
		fields: [readingSessions.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [readingSessions.storyId],
		references: [stories.id]
	}),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	story: one(stories, {
		fields: [settings.storyId],
		references: [stories.id]
	}),
}));

export const storyInsightsRelations = relations(storyInsights, ({one}) => ({
	story: one(stories, {
		fields: [storyInsights.storyId],
		references: [stories.id]
	}),
}));

export const postViewsRelations = relations(postViews, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [postViews.postId],
		references: [communityPosts.id]
	}),
	user: one(users, {
		fields: [postViews.userId],
		references: [users.id]
	}),
}));

export const studioAgentMessagesRelations = relations(studioAgentMessages, ({one, many}) => ({
	studioAgentChat: one(studioAgentChats, {
		fields: [studioAgentMessages.chatId],
		references: [studioAgentChats.id]
	}),
	studioAgentToolExecutions: many(studioAgentToolExecutions),
}));

export const comicPanelsRelations = relations(comicPanels, ({one}) => ({
	scene: one(scenes, {
		fields: [comicPanels.sceneId],
		references: [scenes.id]
	}),
}));

export const sceneEvaluationsRelations = relations(sceneEvaluations, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneEvaluations.sceneId],
		references: [scenes.id]
	}),
}));

export const sceneViewsRelations = relations(sceneViews, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneViews.sceneId],
		references: [scenes.id]
	}),
	user: one(users, {
		fields: [sceneViews.userId],
		references: [users.id]
	}),
}));

export const studioAgentToolExecutionsRelations = relations(studioAgentToolExecutions, ({one}) => ({
	studioAgentMessage: one(studioAgentMessages, {
		fields: [studioAgentToolExecutions.messageId],
		references: [studioAgentMessages.id]
	}),
}));

export const storyLikesRelations = relations(storyLikes, ({one}) => ({
	user: one(users, {
		fields: [storyLikes.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [storyLikes.storyId],
		references: [stories.id]
	}),
}));

export const chapterLikesRelations = relations(chapterLikes, ({one}) => ({
	user: one(users, {
		fields: [chapterLikes.userId],
		references: [users.id]
	}),
	chapter: one(chapters, {
		fields: [chapterLikes.chapterId],
		references: [chapters.id]
	}),
}));

export const commentDislikesRelations = relations(commentDislikes, ({one}) => ({
	comment: one(comments, {
		fields: [commentDislikes.commentId],
		references: [comments.id]
	}),
	user: one(users, {
		fields: [commentDislikes.userId],
		references: [users.id]
	}),
}));

export const commentLikesRelations = relations(commentLikes, ({one}) => ({
	comment: one(comments, {
		fields: [commentLikes.commentId],
		references: [comments.id]
	}),
	user: one(users, {
		fields: [commentLikes.userId],
		references: [users.id]
	}),
}));

export const postLikesRelations = relations(postLikes, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [postLikes.postId],
		references: [communityPosts.id]
	}),
	user: one(users, {
		fields: [postLikes.userId],
		references: [users.id]
	}),
}));

export const sceneDislikesRelations = relations(sceneDislikes, ({one}) => ({
	user: one(users, {
		fields: [sceneDislikes.userId],
		references: [users.id]
	}),
	scene: one(scenes, {
		fields: [sceneDislikes.sceneId],
		references: [scenes.id]
	}),
}));

export const sceneLikesRelations = relations(sceneLikes, ({one}) => ({
	user: one(users, {
		fields: [sceneLikes.userId],
		references: [users.id]
	}),
	scene: one(scenes, {
		fields: [sceneLikes.sceneId],
		references: [scenes.id]
	}),
}));