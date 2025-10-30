import { relations } from "drizzle-orm/relations";
import { users, apiKeys, analyticsEvents, stories, chapters, scenes, communityPosts, settings, sceneEvaluations, readingSessions, storyInsights, recommendationFeedback, storyLikes, chapterLikes, sceneLikes, comments, commentLikes, publishingSchedules, ratings, storySubscriptions, writingSessions, follows, reactions, userAchievements, achievements, userStats, aiInteractions, communityReplies, postImages, characters, parts, postLikes, userPreferences, postViews, scheduledPublications, commentDislikes, sceneDislikes, places, comicPanels } from "./schema";

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	apiKeys: many(apiKeys),
	analyticsEvents: many(analyticsEvents),
	readingSessions: many(readingSessions),
	recommendationFeedbacks: many(recommendationFeedback),
	storyLikes: many(storyLikes),
	chapterLikes: many(chapterLikes),
	sceneLikes: many(sceneLikes),
	commentLikes: many(commentLikes),
	publishingSchedules: many(publishingSchedules),
	ratings: many(ratings),
	storySubscriptions: many(storySubscriptions),
	writingSessions: many(writingSessions),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	reactions: many(reactions),
	userAchievements: many(userAchievements),
	userStats: many(userStats),
	aiInteractions: many(aiInteractions),
	communityPosts_authorId: many(communityPosts, {
		relationName: "communityPosts_authorId_users_id"
	}),
	communityPosts_moderatedBy: many(communityPosts, {
		relationName: "communityPosts_moderatedBy_users_id"
	}),
	communityReplies: many(communityReplies),
	postImages: many(postImages),
	chapters: many(chapters),
	parts: many(parts),
	postLikes: many(postLikes),
	userPreferences: many(userPreferences),
	postViews: many(postViews),
	commentDislikes: many(commentDislikes),
	stories: many(stories),
	sceneDislikes: many(sceneDislikes),
	comments: many(comments),
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

export const storiesRelations = relations(stories, ({one, many}) => ({
	analyticsEvents: many(analyticsEvents),
	settings: many(settings),
	readingSessions: many(readingSessions),
	storyInsights: many(storyInsights),
	storyLikes: many(storyLikes),
	publishingSchedules: many(publishingSchedules),
	ratings: many(ratings),
	storySubscriptions: many(storySubscriptions),
	communityPosts: many(communityPosts),
	characters: many(characters),
	chapters: many(chapters),
	parts: many(parts),
	scheduledPublications: many(scheduledPublications),
	user: one(users, {
		fields: [stories.authorId],
		references: [users.id]
	}),
	comments: many(comments),
	places: many(places),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	analyticsEvents: many(analyticsEvents),
	chapterLikes: many(chapterLikes),
	publishingSchedules: many(publishingSchedules),
	writingSessions: many(writingSessions),
	story: one(stories, {
		fields: [chapters.storyId],
		references: [stories.id]
	}),
	part: one(parts, {
		fields: [chapters.partId],
		references: [parts.id]
	}),
	user: one(users, {
		fields: [chapters.authorId],
		references: [users.id]
	}),
	scheduledPublications: many(scheduledPublications),
	comments: many(comments),
	scenes: many(scenes),
}));

export const scenesRelations = relations(scenes, ({one, many}) => ({
	analyticsEvents: many(analyticsEvents),
	sceneEvaluations: many(sceneEvaluations),
	sceneLikes: many(sceneLikes),
	scheduledPublications: many(scheduledPublications),
	sceneDislikes: many(sceneDislikes),
	comments: many(comments),
	comicPanels: many(comicPanels),
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
}));

export const communityPostsRelations = relations(communityPosts, ({one, many}) => ({
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
	communityReplies: many(communityReplies),
	postImages: many(postImages),
	postLikes: many(postLikes),
	postViews: many(postViews),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	story: one(stories, {
		fields: [settings.storyId],
		references: [stories.id]
	}),
}));

export const sceneEvaluationsRelations = relations(sceneEvaluations, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneEvaluations.sceneId],
		references: [scenes.id]
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

export const recommendationFeedbackRelations = relations(recommendationFeedback, ({one}) => ({
	storyInsight: one(storyInsights, {
		fields: [recommendationFeedback.insightId],
		references: [storyInsights.id]
	}),
	user: one(users, {
		fields: [recommendationFeedback.userId],
		references: [users.id]
	}),
}));

export const storyInsightsRelations = relations(storyInsights, ({one, many}) => ({
	recommendationFeedbacks: many(recommendationFeedback),
	story: one(stories, {
		fields: [storyInsights.storyId],
		references: [stories.id]
	}),
}));

export const storyLikesRelations = relations(storyLikes, ({one}) => ({
	story: one(stories, {
		fields: [storyLikes.storyId],
		references: [stories.id]
	}),
	user: one(users, {
		fields: [storyLikes.userId],
		references: [users.id]
	}),
}));

export const chapterLikesRelations = relations(chapterLikes, ({one}) => ({
	chapter: one(chapters, {
		fields: [chapterLikes.chapterId],
		references: [chapters.id]
	}),
	user: one(users, {
		fields: [chapterLikes.userId],
		references: [users.id]
	}),
}));

export const sceneLikesRelations = relations(sceneLikes, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneLikes.sceneId],
		references: [scenes.id]
	}),
	user: one(users, {
		fields: [sceneLikes.userId],
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

export const commentsRelations = relations(comments, ({one, many}) => ({
	commentLikes: many(commentLikes),
	commentDislikes: many(commentDislikes),
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
}));

export const publishingSchedulesRelations = relations(publishingSchedules, ({one, many}) => ({
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
	scheduledPublications: many(scheduledPublications),
}));

export const ratingsRelations = relations(ratings, ({one}) => ({
	user: one(users, {
		fields: [ratings.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [ratings.storyId],
		references: [stories.id]
	}),
}));

export const storySubscriptionsRelations = relations(storySubscriptions, ({one}) => ({
	user: one(users, {
		fields: [storySubscriptions.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [storySubscriptions.storyId],
		references: [stories.id]
	}),
}));

export const writingSessionsRelations = relations(writingSessions, ({one, many}) => ({
	user: one(users, {
		fields: [writingSessions.userId],
		references: [users.id]
	}),
	chapter: one(chapters, {
		fields: [writingSessions.chapterId],
		references: [chapters.id]
	}),
	aiInteractions: many(aiInteractions),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const reactionsRelations = relations(reactions, ({one}) => ({
	user: one(users, {
		fields: [reactions.userId],
		references: [users.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({one}) => ({
	user: one(users, {
		fields: [aiInteractions.userId],
		references: [users.id]
	}),
	writingSession: one(writingSessions, {
		fields: [aiInteractions.sessionId],
		references: [writingSessions.id]
	}),
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

export const postImagesRelations = relations(postImages, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [postImages.postId],
		references: [communityPosts.id]
	}),
	user: one(users, {
		fields: [postImages.uploadedBy],
		references: [users.id]
	}),
}));

export const charactersRelations = relations(characters, ({one}) => ({
	story: one(stories, {
		fields: [characters.storyId],
		references: [stories.id]
	}),
}));

export const partsRelations = relations(parts, ({one, many}) => ({
	chapters: many(chapters),
	story: one(stories, {
		fields: [parts.storyId],
		references: [stories.id]
	}),
	user: one(users, {
		fields: [parts.authorId],
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

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
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

export const placesRelations = relations(places, ({one}) => ({
	story: one(stories, {
		fields: [places.storyId],
		references: [stories.id]
	}),
}));

export const comicPanelsRelations = relations(comicPanels, ({one}) => ({
	scene: one(scenes, {
		fields: [comicPanels.sceneId],
		references: [scenes.id]
	}),
}));