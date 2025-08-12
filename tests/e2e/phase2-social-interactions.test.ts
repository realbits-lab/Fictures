import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

/**
 * RED PHASE - TDD Phase 2: Social Features Implementation
 * 
 * These tests will FAIL because Phase 2 social features don't exist yet.
 * This is intentional and follows TDD RED-GREEN-REFACTOR methodology.
 * 
 * Features to test:
 * - Comment system with threading
 * - Rating and review system
 * - Follow system for authors
 * - Social engagement metrics
 */
test.describe('Phase 2: Social Features Implementation', () => {
  let storyPage: StoryPage;
  const testStoryId = 'test-story-phase2-social';
  const testAuthorId = 'test-author-phase2';

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.navigateToStory(testStoryId);
    await storyPage.waitForStoryLoad();
  });

  test.describe('Comment System with Threading', () => {
    test('should display story-level comments with threading', async () => {
      // This test will FAIL - comment system doesn't exist yet
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      await expect(commentsSection).toBeVisible();
      
      // Should show comment count
      const commentCount = commentsSection.getByTestId('comment-count');
      await expect(commentCount).toBeVisible();
      expect(await commentCount.textContent()).toMatch(/\d+ comments?/);
      
      // Should show existing comments
      const commentsList = commentsSection.getByTestId('comments-list');
      await expect(commentsList).toBeVisible();
      
      const commentItems = commentsList.getByTestId('comment-item');
      expect(await commentItems.count()).toBeGreaterThan(0);
      
      // Each comment should have required elements
      const firstComment = commentItems.first();
      await expect(firstComment.getByTestId('comment-author')).toBeVisible();
      await expect(firstComment.getByTestId('comment-timestamp')).toBeVisible();
      await expect(firstComment.getByTestId('comment-content')).toBeVisible();
      await expect(firstComment.getByTestId('comment-likes')).toBeVisible();
      await expect(firstComment.getByTestId('reply-button')).toBeVisible();
    });

    test('should allow posting new comments', async () => {
      // This test will FAIL - comment posting doesn't exist yet
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      
      const newCommentForm = commentsSection.getByTestId('new-comment-form');
      await expect(newCommentForm).toBeVisible();
      
      const commentTextarea = newCommentForm.getByTestId('comment-textarea');
      const submitButton = newCommentForm.getByTestId('submit-comment-button');
      
      await expect(commentTextarea).toBeVisible();
      await expect(submitButton).toBeVisible();
      
      // Should show character counter
      await expect(newCommentForm.getByTestId('character-counter')).toBeVisible();
      
      // Submit a new comment
      const testComment = "This is an excellent story! Love the character development.";
      await commentTextarea.fill(testComment);
      
      const characterCount = await newCommentForm.getByTestId('character-counter').textContent();
      expect(characterCount).toContain(`${testComment.length}/1000`);
      
      await submitButton.click();
      
      // Should show success message
      await expect(storyPage.page.getByText('Comment posted successfully')).toBeVisible();
      
      // New comment should appear in the list
      const commentsList = commentsSection.getByTestId('comments-list');
      const latestComment = commentsList.getByTestId('comment-item').first();
      
      const commentContent = await latestComment.getByTestId('comment-content').textContent();
      expect(commentContent).toContain(testComment);
    });

    test('should support threaded replies to comments', async () => {
      // This test will FAIL - threaded replies don't exist yet
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      const commentsList = commentsSection.getByTestId('comments-list');
      
      const firstComment = commentsList.getByTestId('comment-item').first();
      const replyButton = firstComment.getByTestId('reply-button');
      
      await replyButton.click();
      
      // Reply form should appear
      const replyForm = firstComment.getByTestId('reply-form');
      await expect(replyForm).toBeVisible();
      
      const replyTextarea = replyForm.getByTestId('reply-textarea');
      const submitReplyButton = replyForm.getByTestId('submit-reply-button');
      const cancelReplyButton = replyForm.getByTestId('cancel-reply-button');
      
      await expect(replyTextarea).toBeVisible();
      await expect(submitReplyButton).toBeVisible();
      await expect(cancelReplyButton).toBeVisible();
      
      // Submit reply
      const replyText = "I completely agree! The plot twist in chapter 5 was amazing.";
      await replyTextarea.fill(replyText);
      await submitReplyButton.click();
      
      // Reply should appear as a nested comment
      const repliesList = firstComment.getByTestId('replies-list');
      await expect(repliesList).toBeVisible();
      
      const replyItem = repliesList.getByTestId('reply-item').first();
      const replyContent = await replyItem.getByTestId('reply-content').textContent();
      expect(replyContent).toContain(replyText);
      
      // Reply should be visually indented
      const replyIndent = await replyItem.evaluate(el => 
        parseInt(window.getComputedStyle(el).marginLeft)
      );
      expect(replyIndent).toBeGreaterThan(20);
    });

    test('should support chapter-specific comments', async () => {
      // This test will FAIL - chapter comments don't exist yet
      await storyPage.navigateToChapter(testStoryId, 2);
      await storyPage.waitForChapterLoad();
      
      const chapterCommentsSection = storyPage.page.getByTestId('chapter-comments-section');
      await expect(chapterCommentsSection).toBeVisible();
      
      // Should show chapter-specific comment count
      const chapterCommentCount = chapterCommentsSection.getByTestId('chapter-comment-count');
      await expect(chapterCommentCount).toBeVisible();
      
      // Should have toggle between story and chapter comments
      const commentToggle = storyPage.page.getByTestId('comment-type-toggle');
      await expect(commentToggle).toBeVisible();
      
      await expect(commentToggle.getByTestId('story-comments-tab')).toBeVisible();
      await expect(commentToggle.getByTestId('chapter-comments-tab')).toBeVisible();
      
      // Switch to chapter comments
      await commentToggle.getByTestId('chapter-comments-tab').click();
      
      const chapterCommentsList = chapterCommentsSection.getByTestId('chapter-comments-list');
      await expect(chapterCommentsList).toBeVisible();
      
      // Should allow posting chapter-specific comments
      const newChapterCommentForm = chapterCommentsSection.getByTestId('new-chapter-comment-form');
      await expect(newChapterCommentForm).toBeVisible();
      
      const chapterCommentText = "This chapter really picked up the pace!";
      await newChapterCommentForm.getByTestId('comment-textarea').fill(chapterCommentText);
      await newChapterCommentForm.getByTestId('submit-comment-button').click();
      
      await expect(storyPage.page.getByText('Chapter comment posted')).toBeVisible();
    });

    test('should allow liking/unliking comments and display counts', async () => {
      // This test will FAIL - comment liking doesn't exist yet
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      const commentsList = commentsSection.getByTestId('comments-list');
      
      const firstComment = commentsList.getByTestId('comment-item').first();
      const likeButton = firstComment.getByTestId('like-comment-button');
      const likeCount = firstComment.getByTestId('comment-likes-count');
      
      await expect(likeButton).toBeVisible();
      await expect(likeCount).toBeVisible();
      
      const initialLikes = parseInt(await likeCount.textContent() || '0');
      
      // Like the comment
      await likeButton.click();
      
      // Like count should increase
      await expect(likeCount).toContainText((initialLikes + 1).toString());
      
      // Button should show as liked
      await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
      
      // Unlike the comment
      await likeButton.click();
      
      // Like count should decrease
      await expect(likeCount).toContainText(initialLikes.toString());
      
      // Button should show as not liked
      await expect(likeButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('should provide comment moderation features for story authors', async () => {
      // This test will FAIL - comment moderation doesn't exist yet
      // Navigate as the story author
      await storyPage.loginAsUser(testAuthorId);
      await storyPage.navigateToStory(testStoryId);
      
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      const commentsList = commentsSection.getByTestId('comments-list');
      
      const firstComment = commentsList.getByTestId('comment-item').first();
      
      // Author should see moderation options
      const moderationMenu = firstComment.getByTestId('comment-moderation-menu');
      await expect(moderationMenu).toBeVisible();
      
      await moderationMenu.click();
      
      const moderationOptions = storyPage.page.getByTestId('moderation-options');
      await expect(moderationOptions.getByTestId('pin-comment')).toBeVisible();
      await expect(moderationOptions.getByTestId('delete-comment')).toBeVisible();
      await expect(moderationOptions.getByTestId('report-comment')).toBeVisible();
      await expect(moderationOptions.getByTestId('block-user')).toBeVisible();
      
      // Test pinning a comment
      await moderationOptions.getByTestId('pin-comment').click();
      
      await expect(storyPage.page.getByText('Comment pinned')).toBeVisible();
      
      // Pinned comment should have indicator
      const pinnedIndicator = firstComment.getByTestId('pinned-comment-indicator');
      await expect(pinnedIndicator).toBeVisible();
      
      // Pinned comments should appear at the top
      const allComments = commentsList.getByTestId('comment-item');
      const topComment = allComments.first();
      await expect(topComment.getByTestId('pinned-comment-indicator')).toBeVisible();
    });
  });

  test.describe('Rating and Review System', () => {
    test('should display story ratings and allow users to rate', async () => {
      // This test will FAIL - rating system doesn't exist yet
      const ratingSection = storyPage.page.getByTestId('story-rating-section');
      await expect(ratingSection).toBeVisible();
      
      // Should show average rating
      const averageRating = ratingSection.getByTestId('average-rating');
      await expect(averageRating).toBeVisible();
      
      const avgRatingValue = await averageRating.getByTestId('rating-value').textContent();
      expect(avgRatingValue).toMatch(/^\d\.\d$/); // Format: "4.2"
      
      // Should show rating distribution
      const ratingDistribution = ratingSection.getByTestId('rating-distribution');
      await expect(ratingDistribution).toBeVisible();
      
      for (let star = 5; star >= 1; star--) {
        await expect(ratingDistribution.getByTestId(`${star}-star-bar`)).toBeVisible();
        await expect(ratingDistribution.getByTestId(`${star}-star-count`)).toBeVisible();
      }
      
      // User rating form
      const userRatingForm = ratingSection.getByTestId('user-rating-form');
      await expect(userRatingForm).toBeVisible();
      
      const starButtons = userRatingForm.getByTestId('star-button');
      expect(await starButtons.count()).toBe(5);
      
      // Rate the story
      await starButtons.nth(3).click(); // 4 stars
      
      // Should show confirmation
      await expect(storyPage.page.getByText('Rating submitted')).toBeVisible();
      
      // User's rating should be highlighted
      const userRating = userRatingForm.getByTestId('user-current-rating');
      await expect(userRating).toContainText('4');
    });

    test('should support detailed reviews with text', async () => {
      // This test will FAIL - review system doesn't exist yet
      const reviewSection = storyPage.page.getByTestId('story-review-section');
      await expect(reviewSection).toBeVisible();
      
      // Reviews list
      const reviewsList = reviewSection.getByTestId('reviews-list');
      await expect(reviewsList).toBeVisible();
      
      const reviewItems = reviewsList.getByTestId('review-item');
      expect(await reviewItems.count()).toBeGreaterThan(0);
      
      // Each review should have required elements
      const firstReview = reviewItems.first();
      await expect(firstReview.getByTestId('reviewer-name')).toBeVisible();
      await expect(firstReview.getByTestId('review-rating')).toBeVisible();
      await expect(firstReview.getByTestId('review-date')).toBeVisible();
      await expect(firstReview.getByTestId('review-text')).toBeVisible();
      await expect(firstReview.getByTestId('review-helpful-count')).toBeVisible();
      
      // Write new review form
      const writeReviewButton = reviewSection.getByTestId('write-review-button');
      await writeReviewButton.click();
      
      const reviewModal = storyPage.page.getByTestId('write-review-modal');
      await expect(reviewModal).toBeVisible();
      
      // Rating selection
      const reviewRatingStars = reviewModal.getByTestId('review-star-button');
      await reviewRatingStars.nth(4).click(); // 5 stars
      
      // Review text
      const reviewTextarea = reviewModal.getByTestId('review-textarea');
      const reviewText = "Absolutely fantastic story! The world-building is incredible and the characters feel so real. Can't wait for the next chapter!";
      await reviewTextarea.fill(reviewText);
      
      // Submit review
      await reviewModal.getByTestId('submit-review-button').click();
      
      await expect(storyPage.page.getByText('Review published')).toBeVisible();
      
      // New review should appear in the list
      const latestReview = reviewsList.getByTestId('review-item').first();
      const latestReviewText = await latestReview.getByTestId('review-text').textContent();
      expect(latestReviewText).toContain(reviewText);
    });

    test('should allow marking reviews as helpful', async () => {
      // This test will FAIL - review helpfulness doesn't exist yet
      const reviewSection = storyPage.page.getByTestId('story-review-section');
      const reviewsList = reviewSection.getByTestId('reviews-list');
      
      const firstReview = reviewsList.getByTestId('review-item').first();
      const helpfulButton = firstReview.getByTestId('mark-helpful-button');
      const helpfulCount = firstReview.getByTestId('review-helpful-count');
      
      await expect(helpfulButton).toBeVisible();
      await expect(helpfulCount).toBeVisible();
      
      const initialHelpfulCount = parseInt(await helpfulCount.textContent() || '0');
      
      // Mark as helpful
      await helpfulButton.click();
      
      // Count should increase
      await expect(helpfulCount).toContainText((initialHelpfulCount + 1).toString());
      
      // Button should show as marked
      await expect(helpfulButton).toHaveAttribute('aria-pressed', 'true');
      
      // Should show confirmation message
      await expect(storyPage.page.getByText('Marked as helpful')).toBeVisible();
    });

    test('should filter and sort reviews', async () => {
      // This test will FAIL - review filtering doesn't exist yet
      const reviewSection = storyPage.page.getByTestId('story-review-section');
      
      // Review filters
      const reviewFilters = reviewSection.getByTestId('review-filters');
      await expect(reviewFilters).toBeVisible();
      
      // Filter by rating
      const ratingFilter = reviewFilters.getByTestId('rating-filter');
      await expect(ratingFilter).toBeVisible();
      
      await ratingFilter.click();
      await storyPage.page.getByTestId('filter-5-stars').click();
      
      // Only 5-star reviews should be shown
      const filteredReviews = reviewSection.getByTestId('review-item');
      for (let i = 0; i < Math.min(3, await filteredReviews.count()); i++) {
        const review = filteredReviews.nth(i);
        const rating = await review.getByTestId('review-rating').getAttribute('data-rating');
        expect(rating).toBe('5');
      }
      
      // Sort options
      const sortDropdown = reviewFilters.getByTestId('review-sort');
      await sortDropdown.click();
      
      await expect(storyPage.page.getByTestId('sort-newest')).toBeVisible();
      await expect(storyPage.page.getByTestId('sort-oldest')).toBeVisible();
      await expect(storyPage.page.getByTestId('sort-highest-rated')).toBeVisible();
      await expect(storyPage.page.getByTestId('sort-most-helpful')).toBeVisible();
      
      await storyPage.page.getByTestId('sort-most-helpful').click();
      
      // Reviews should be sorted by helpfulness
      const sortedReviews = reviewSection.getByTestId('review-item');
      const firstReviewHelpful = parseInt(
        await sortedReviews.first().getByTestId('review-helpful-count').textContent() || '0'
      );
      const secondReviewHelpful = parseInt(
        await sortedReviews.nth(1).getByTestId('review-helpful-count').textContent() || '0'
      );
      
      expect(firstReviewHelpful).toBeGreaterThanOrEqual(secondReviewHelpful);
    });
  });

  test.describe('Follow System for Authors', () => {
    test('should display author profile with follow button', async () => {
      // This test will FAIL - follow system doesn't exist yet
      const authorSection = storyPage.page.getByTestId('story-author-section');
      await expect(authorSection).toBeVisible();
      
      const authorProfile = authorSection.getByTestId('author-profile');
      await expect(authorProfile).toBeVisible();
      
      // Author information
      await expect(authorProfile.getByTestId('author-name')).toBeVisible();
      await expect(authorProfile.getByTestId('author-avatar')).toBeVisible();
      await expect(authorProfile.getByTestId('author-bio')).toBeVisible();
      
      // Author statistics
      await expect(authorProfile.getByTestId('author-followers-count')).toBeVisible();
      await expect(authorProfile.getByTestId('author-stories-count')).toBeVisible();
      await expect(authorProfile.getByTestId('author-total-reads')).toBeVisible();
      
      // Follow button
      const followButton = authorProfile.getByTestId('follow-author-button');
      await expect(followButton).toBeVisible();
      await expect(followButton).toContainText('Follow');
    });

    test('should allow following and unfollowing authors', async () => {
      // This test will FAIL - follow functionality doesn't exist yet
      const authorSection = storyPage.page.getByTestId('story-author-section');
      const authorProfile = authorSection.getByTestId('author-profile');
      
      const followButton = authorProfile.getByTestId('follow-author-button');
      const followersCount = authorProfile.getByTestId('author-followers-count');
      
      const initialFollowersCount = parseInt(
        (await followersCount.textContent() || '0').replace(/[^\d]/g, '')
      );
      
      // Follow the author
      await followButton.click();
      
      // Button should change to "Following"
      await expect(followButton).toContainText('Following');
      await expect(followButton).toHaveAttribute('aria-pressed', 'true');
      
      // Followers count should increase
      await expect(followersCount).toContainText((initialFollowersCount + 1).toString());
      
      // Should show confirmation
      await expect(storyPage.page.getByText('Now following')).toBeVisible();
      
      // Unfollow
      await followButton.click();
      
      // Should show unfollow confirmation
      const unfollowModal = storyPage.page.getByTestId('unfollow-confirmation-modal');
      await expect(unfollowModal).toBeVisible();
      
      await unfollowModal.getByTestId('confirm-unfollow-button').click();
      
      // Button should change back to "Follow"
      await expect(followButton).toContainText('Follow');
      await expect(followButton).toHaveAttribute('aria-pressed', 'false');
      
      // Followers count should decrease
      await expect(followersCount).toContainText(initialFollowersCount.toString());
    });

    test('should show followed authors in user dashboard', async () => {
      // This test will FAIL - following dashboard doesn't exist yet
      await storyPage.page.goto('/dashboard/following');
      
      const followingPage = storyPage.page.getByTestId('following-dashboard');
      await expect(followingPage).toBeVisible();
      
      // Following statistics
      const followingStats = followingPage.getByTestId('following-stats');
      await expect(followingStats.getByTestId('total-following')).toBeVisible();
      await expect(followingStats.getByTestId('new-updates-count')).toBeVisible();
      
      // Followed authors list
      const followedAuthorsList = followingPage.getByTestId('followed-authors-list');
      await expect(followedAuthorsList).toBeVisible();
      
      const authorItems = followedAuthorsList.getByTestId('followed-author-item');
      expect(await authorItems.count()).toBeGreaterThan(0);
      
      // Each followed author should show recent activity
      const firstAuthor = authorItems.first();
      await expect(firstAuthor.getByTestId('author-name')).toBeVisible();
      await expect(firstAuthor.getByTestId('latest-story-update')).toBeVisible();
      await expect(firstAuthor.getByTestId('last-activity-date')).toBeVisible();
      await expect(firstAuthor.getByTestId('unfollow-button')).toBeVisible();
    });

    test('should provide notifications for followed author updates', async () => {
      // This test will FAIL - notifications don't exist yet
      await storyPage.page.goto('/notifications');
      
      const notificationsPage = storyPage.page.getByTestId('notifications-page');
      await expect(notificationsPage).toBeVisible();
      
      // Notification categories
      const notificationTabs = notificationsPage.getByTestId('notification-tabs');
      await expect(notificationTabs.getByTestId('all-notifications')).toBeVisible();
      await expect(notificationTabs.getByTestId('author-updates')).toBeVisible();
      await expect(notificationTabs.getByTestId('story-comments')).toBeVisible();
      await expect(notificationTabs.getByTestId('story-reviews')).toBeVisible();
      
      // Filter to author updates
      await notificationTabs.getByTestId('author-updates').click();
      
      const authorUpdatesList = notificationsPage.getByTestId('author-updates-list');
      await expect(authorUpdatesList).toBeVisible();
      
      const updateItems = authorUpdatesList.getByTestId('author-update-item');
      expect(await updateItems.count()).toBeGreaterThan(0);
      
      // Each update should have required information
      const firstUpdate = updateItems.first();
      await expect(firstUpdate.getByTestId('author-name')).toBeVisible();
      await expect(firstUpdate.getByTestId('update-type')).toBeVisible(); // "New Chapter", "New Story", etc.
      await expect(firstUpdate.getByTestId('story-title')).toBeVisible();
      await expect(firstUpdate.getByTestId('update-timestamp')).toBeVisible();
      
      // Should be able to navigate to the update
      await firstUpdate.click();
      
      // Should navigate to the new chapter/story
      expect(storyPage.page.url()).toContain('/stories/');
    });

    test('should show author activity feed', async () => {
      // This test will FAIL - activity feed doesn't exist yet
      await storyPage.page.goto(`/authors/${testAuthorId}`);
      
      const authorPage = storyPage.page.getByTestId('author-page');
      await expect(authorPage).toBeVisible();
      
      // Author tabs
      const authorTabs = authorPage.getByTestId('author-tabs');
      await expect(authorTabs.getByTestId('stories-tab')).toBeVisible();
      await expect(authorTabs.getByTestId('activity-tab')).toBeVisible();
      await expect(authorTabs.getByTestId('about-tab')).toBeVisible();
      
      // Switch to activity tab
      await authorTabs.getByTestId('activity-tab').click();
      
      const activityFeed = authorPage.getByTestId('author-activity-feed');
      await expect(activityFeed).toBeVisible();
      
      const activityItems = activityFeed.getByTestId('activity-item');
      expect(await activityItems.count()).toBeGreaterThan(0);
      
      // Each activity should have timestamp and description
      const firstActivity = activityItems.first();
      await expect(firstActivity.getByTestId('activity-timestamp')).toBeVisible();
      await expect(firstActivity.getByTestId('activity-description')).toBeVisible();
      await expect(firstActivity.getByTestId('activity-type')).toBeVisible();
      
      // Activity types should be relevant
      const activityType = await firstActivity.getByTestId('activity-type').textContent();
      expect(['chapter-published', 'story-created', 'story-completed', 'milestone-reached'])
        .toContain(activityType);
    });
  });

  test.describe('Social Engagement Metrics', () => {
    test('should display comprehensive story engagement statistics', async () => {
      // This test will FAIL - engagement metrics don't exist yet
      // Navigate as story author to see detailed metrics
      await storyPage.loginAsUser(testAuthorId);
      await storyPage.page.goto(`/stories/${testStoryId}/analytics`);
      
      const analyticsPage = storyPage.page.getByTestId('story-analytics-page');
      await expect(analyticsPage).toBeVisible();
      
      // Engagement overview
      const engagementOverview = analyticsPage.getByTestId('engagement-overview');
      await expect(engagementOverview).toBeVisible();
      
      await expect(engagementOverview.getByTestId('total-reads')).toBeVisible();
      await expect(engagementOverview.getByTestId('unique-readers')).toBeVisible();
      await expect(engagementOverview.getByTestId('total-likes')).toBeVisible();
      await expect(engagementOverview.getByTestId('total-comments')).toBeVisible();
      await expect(engagementOverview.getByTestId('total-bookmarks')).toBeVisible();
      await expect(engagementOverview.getByTestId('average-rating')).toBeVisible();
      
      // Engagement trends
      const trendsChart = analyticsPage.getByTestId('engagement-trends-chart');
      await expect(trendsChart).toBeVisible();
      
      // Reader demographics
      const demographics = analyticsPage.getByTestId('reader-demographics');
      await expect(demographics).toBeVisible();
      
      await expect(demographics.getByTestId('age-distribution')).toBeVisible();
      await expect(demographics.getByTestId('geographic-distribution')).toBeVisible();
      await expect(demographics.getByTestId('reading-device-breakdown')).toBeVisible();
    });

    test('should show chapter-level engagement analytics', async () => {
      // This test will FAIL - chapter analytics don't exist yet
      await storyPage.loginAsUser(testAuthorId);
      await storyPage.page.goto(`/stories/${testStoryId}/analytics/chapters`);
      
      const chapterAnalyticsPage = storyPage.page.getByTestId('chapter-analytics-page');
      await expect(chapterAnalyticsPage).toBeVisible();
      
      // Chapter engagement table
      const chapterTable = chapterAnalyticsPage.getByTestId('chapter-engagement-table');
      await expect(chapterTable).toBeVisible();
      
      const headerRow = chapterTable.getByTestId('table-header');
      await expect(headerRow.getByText('Chapter')).toBeVisible();
      await expect(headerRow.getByText('Reads')).toBeVisible();
      await expect(headerRow.getByText('Completion Rate')).toBeVisible();
      await expect(headerRow.getByText('Comments')).toBeVisible();
      await expect(headerRow.getByText('Likes')).toBeVisible();
      await expect(headerRow.getByText('Drop-off Rate')).toBeVisible();
      
      const chapterRows = chapterTable.getByTestId('chapter-row');
      expect(await chapterRows.count()).toBeGreaterThan(0);
      
      // Each chapter row should have metrics
      const firstChapterRow = chapterRows.first();
      await expect(firstChapterRow.getByTestId('chapter-number')).toBeVisible();
      await expect(firstChapterRow.getByTestId('read-count')).toBeVisible();
      await expect(firstChapterRow.getByTestId('completion-rate')).toBeVisible();
      
      // Completion rate should be a percentage
      const completionRate = await firstChapterRow.getByTestId('completion-rate').textContent();
      expect(completionRate).toMatch(/\d+%/);
    });

    test('should provide social sharing analytics', async () => {
      // This test will FAIL - sharing analytics don't exist yet
      await storyPage.loginAsUser(testAuthorId);
      await storyPage.page.goto(`/stories/${testStoryId}/analytics/social`);
      
      const socialAnalyticsPage = storyPage.page.getByTestId('social-analytics-page');
      await expect(socialAnalyticsPage).toBeVisible();
      
      // Social sharing metrics
      const sharingMetrics = socialAnalyticsPage.getByTestId('sharing-metrics');
      await expect(sharingMetrics).toBeVisible();
      
      await expect(sharingMetrics.getByTestId('total-shares')).toBeVisible();
      await expect(sharingMetrics.getByTestId('platform-breakdown')).toBeVisible();
      await expect(sharingMetrics.getByTestId('viral-coefficient')).toBeVisible();
      
      // Platform-specific sharing data
      const platformBreakdown = sharingMetrics.getByTestId('platform-breakdown');
      await expect(platformBreakdown.getByTestId('twitter-shares')).toBeVisible();
      await expect(platformBreakdown.getByTestId('facebook-shares')).toBeVisible();
      await expect(platformBreakdown.getByTestId('reddit-shares')).toBeVisible();
      await expect(platformBreakdown.getByTestId('direct-links')).toBeVisible();
      
      // Referral traffic
      const referralTraffic = socialAnalyticsPage.getByTestId('referral-traffic');
      await expect(referralTraffic).toBeVisible();
      
      const trafficSources = referralTraffic.getByTestId('traffic-source');
      expect(await trafficSources.count()).toBeGreaterThan(0);
    });

    test('should show community engagement insights', async () => {
      // This test will FAIL - community insights don't exist yet
      await storyPage.loginAsUser(testAuthorId);
      await storyPage.page.goto(`/stories/${testStoryId}/analytics/community`);
      
      const communityAnalyticsPage = storyPage.page.getByTestId('community-analytics-page');
      await expect(communityAnalyticsPage).toBeVisible();
      
      // Reader loyalty metrics
      const loyaltyMetrics = communityAnalyticsPage.getByTestId('reader-loyalty-metrics');
      await expect(loyaltyMetrics).toBeVisible();
      
      await expect(loyaltyMetrics.getByTestId('returning-readers')).toBeVisible();
      await expect(loyaltyMetrics.getByTestId('reader-retention-rate')).toBeVisible();
      await expect(loyaltyMetrics.getByTestId('average-session-time')).toBeVisible();
      
      // Comment engagement analysis
      const commentAnalysis = communityAnalyticsPage.getByTestId('comment-engagement-analysis');
      await expect(commentAnalysis).toBeVisible();
      
      await expect(commentAnalysis.getByTestId('most-active-commenters')).toBeVisible();
      await expect(commentAnalysis.getByTestId('comment-sentiment-analysis')).toBeVisible();
      await expect(commentAnalysis.getByTestId('popular-discussion-topics')).toBeVisible();
      
      // Top contributors
      const topContributors = commentAnalysis.getByTestId('most-active-commenters');
      const contributorItems = topContributors.getByTestId('contributor-item');
      expect(await contributorItems.count()).toBeGreaterThan(0);
      
      const firstContributor = contributorItems.first();
      await expect(firstContributor.getByTestId('contributor-name')).toBeVisible();
      await expect(firstContributor.getByTestId('comment-count')).toBeVisible();
      await expect(firstContributor.getByTestId('engagement-score')).toBeVisible();
    });
  });
});