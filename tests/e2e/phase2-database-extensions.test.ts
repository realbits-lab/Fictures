import { test, expect } from '@playwright/test';
import { StoryPage } from '../pages/story';

/**
 * RED PHASE - TDD Phase 2: Database Schema Extensions
 * 
 * These tests will FAIL because Phase 2 database extensions don't exist yet.
 * This is intentional and follows TDD RED-GREEN-REFACTOR methodology.
 * 
 * Features to test:
 * - User preferences and customization settings storage
 * - Social features data models (comments, ratings, follows)
 * - AI writing sessions and suggestions tracking
 * - Analytics and engagement metrics storage
 */
test.describe('Phase 2: Database Schema Extensions', () => {
  let storyPage: StoryPage;
  const testUserId = 'test-user-phase2-db';
  const testStoryId = 'test-story-phase2-db';

  test.beforeEach(async ({ page }) => {
    storyPage = new StoryPage(page);
    await storyPage.loginAsUser(testUserId);
  });

  test.describe('User Preferences and Customization Storage', () => {
    test('should store and retrieve reading customization preferences', async () => {
      // This test will FAIL - user preferences table doesn't exist yet
      await storyPage.page.goto('/settings/reading-preferences');
      
      const preferencesPage = storyPage.page.getByTestId('reading-preferences-page');
      await expect(preferencesPage).toBeVisible();
      
      // Set various reading preferences
      await preferencesPage.getByTestId('theme-dark').click();
      await preferencesPage.getByTestId('font-family-serif').click();
      await preferencesPage.getByTestId('font-size-large').click();
      await preferencesPage.getByTestId('line-height-wide').click();
      
      // Save preferences
      await preferencesPage.getByTestId('save-preferences-button').click();
      await expect(storyPage.page.getByText('Preferences saved')).toBeVisible();
      
      // Navigate away and back to verify persistence
      await storyPage.page.goto('/stories');
      await storyPage.page.goto('/settings/reading-preferences');
      
      // Preferences should be persisted
      await expect(preferencesPage.getByTestId('theme-dark')).toHaveAttribute('aria-selected', 'true');
      await expect(preferencesPage.getByTestId('font-family-serif')).toHaveAttribute('aria-selected', 'true');
      await expect(preferencesPage.getByTestId('font-size-large')).toHaveAttribute('aria-selected', 'true');
      
      // Test database API endpoint for preferences
      const response = await storyPage.page.request.get(`/api/users/${testUserId}/preferences`);
      expect(response.status()).toBe(200);
      
      const preferences = await response.json();
      expect(preferences.readingTheme).toBe('dark');
      expect(preferences.fontFamily).toBe('serif');
      expect(preferences.fontSize).toBe('large');
      expect(preferences.lineHeight).toBe('wide');
    });

    test('should store accessibility preferences separately', async () => {
      // This test will FAIL - accessibility preferences storage doesn't exist yet
      await storyPage.page.goto('/settings/accessibility');
      
      const accessibilityPage = storyPage.page.getByTestId('accessibility-settings-page');
      await expect(accessibilityPage).toBeVisible();
      
      // Set accessibility preferences
      await accessibilityPage.getByTestId('high-contrast-toggle').click();
      await accessibilityPage.getByTestId('reduce-motion-toggle').click();
      await accessibilityPage.getByTestId('screen-reader-mode').click();
      await accessibilityPage.getByTestId('dyslexia-friendly-font').click();
      
      await accessibilityPage.getByTestId('save-accessibility-preferences').click();
      await expect(storyPage.page.getByText('Accessibility preferences saved')).toBeVisible();
      
      // Verify API storage
      const response = await storyPage.page.request.get(`/api/users/${testUserId}/preferences/accessibility`);
      expect(response.status()).toBe(200);
      
      const accessibilityPrefs = await response.json();
      expect(accessibilityPrefs.highContrast).toBe(true);
      expect(accessibilityPrefs.reduceMotion).toBe(true);
      expect(accessibilityPrefs.screenReaderMode).toBe(true);
      expect(accessibilityPrefs.dyslexiaFriendlyFont).toBe(true);
    });

    test('should store notification preferences with granular controls', async () => {
      // This test will FAIL - notification preferences table doesn't exist yet
      await storyPage.page.goto('/settings/notifications');
      
      const notificationsPage = storyPage.page.getByTestId('notifications-settings-page');
      await expect(notificationsPage).toBeVisible();
      
      // Email notifications
      const emailSection = notificationsPage.getByTestId('email-notifications-section');
      await emailSection.getByTestId('new-chapters-email').click();
      await emailSection.getByTestId('comments-email').click();
      await emailSection.getByTestId('follows-email').click();
      
      // Push notifications
      const pushSection = notificationsPage.getByTestId('push-notifications-section');
      await pushSection.getByTestId('new-chapters-push').click();
      await pushSection.getByTestId('comments-push').click();
      
      // In-app notifications
      const inAppSection = notificationsPage.getByTestId('in-app-notifications-section');
      await inAppSection.getByTestId('all-in-app').click();
      
      // Frequency settings
      const frequencySection = notificationsPage.getByTestId('frequency-settings-section');
      await frequencySection.getByTestId('digest-frequency-weekly').click();
      
      await notificationsPage.getByTestId('save-notification-preferences').click();
      await expect(storyPage.page.getByText('Notification preferences saved')).toBeVisible();
      
      // Verify database storage
      const response = await storyPage.page.request.get(`/api/users/${testUserId}/preferences/notifications`);
      expect(response.status()).toBe(200);
      
      const notificationPrefs = await response.json();
      expect(notificationPrefs.email.newChapters).toBe(true);
      expect(notificationPrefs.email.comments).toBe(true);
      expect(notificationPrefs.push.newChapters).toBe(true);
      expect(notificationPrefs.digestFrequency).toBe('weekly');
    });

    test('should store privacy and content preferences', async () => {
      // This test will FAIL - privacy preferences storage doesn't exist yet
      await storyPage.page.goto('/settings/privacy');
      
      const privacyPage = storyPage.page.getByTestId('privacy-settings-page');
      await expect(privacyPage).toBeVisible();
      
      // Content filtering preferences
      await privacyPage.getByTestId('show-mature-content').click();
      await privacyPage.getByTestId('filter-violence').click();
      await privacyPage.getByTestId('filter-language').click();
      
      // Privacy settings
      await privacyPage.getByTestId('public-reading-history').click();
      await privacyPage.getByTestId('discoverable-profile').click();
      await privacyPage.getByTestId('analytics-tracking').click();
      
      await privacyPage.getByTestId('save-privacy-preferences').click();
      await expect(storyPage.page.getByText('Privacy preferences saved')).toBeVisible();
      
      // Verify API storage
      const response = await storyPage.page.request.get(`/api/users/${testUserId}/preferences/privacy`);
      expect(response.status()).toBe(200);
      
      const privacyPrefs = await response.json();
      expect(privacyPrefs.showMatureContent).toBe(true);
      expect(privacyPrefs.contentFilters.violence).toBe(true);
      expect(privacyPrefs.publicReadingHistory).toBe(true);
      expect(privacyPrefs.analyticsTracking).toBe(true);
    });
  });

  test.describe('Social Features Data Models', () => {
    test('should store and retrieve story comments with threading', async () => {
      // This test will FAIL - comments table with threading doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      await storyPage.waitForStoryLoad();
      
      const commentsSection = storyPage.page.getByTestId('story-comments-section');
      
      // Post a top-level comment
      const commentForm = commentsSection.getByTestId('new-comment-form');
      await commentForm.getByTestId('comment-textarea').fill('This is a great story!');
      await commentForm.getByTestId('submit-comment-button').click();
      
      await expect(storyPage.page.getByText('Comment posted successfully')).toBeVisible();
      
      // Verify comment appears and get its ID for API testing
      const commentsList = commentsSection.getByTestId('comments-list');
      const latestComment = commentsList.getByTestId('comment-item').first();
      await expect(latestComment.getByText('This is a great story!')).toBeVisible();
      
      // Test API endpoint for comments
      const commentsResponse = await storyPage.page.request.get(`/api/stories/${testStoryId}/comments`);
      expect(commentsResponse.status()).toBe(200);
      
      const comments = await commentsResponse.json();
      expect(comments.length).toBeGreaterThan(0);
      
      const firstComment = comments[0];
      expect(firstComment.content).toContain('This is a great story!');
      expect(firstComment.authorId).toBe(testUserId);
      expect(firstComment.storyId).toBe(testStoryId);
      expect(firstComment.parentCommentId).toBeNull(); // Top-level comment
      expect(firstComment.createdAt).toBeDefined();
      expect(firstComment.likesCount).toBeDefined();
      
      // Test threaded replies
      const replyButton = latestComment.getByTestId('reply-button');
      await replyButton.click();
      
      const replyForm = latestComment.getByTestId('reply-form');
      await replyForm.getByTestId('reply-textarea').fill('I totally agree!');
      await replyForm.getByTestId('submit-reply-button').click();
      
      await expect(storyPage.page.getByText('Reply posted successfully')).toBeVisible();
      
      // Verify reply in database
      const repliesResponse = await storyPage.page.request.get(`/api/comments/${firstComment.id}/replies`);
      expect(repliesResponse.status()).toBe(200);
      
      const replies = await repliesResponse.json();
      expect(replies.length).toBeGreaterThan(0);
      expect(replies[0].content).toContain('I totally agree!');
      expect(replies[0].parentCommentId).toBe(firstComment.id);
    });

    test('should store and manage story ratings and reviews', async () => {
      // This test will FAIL - ratings and reviews tables don't exist yet
      await storyPage.navigateToStory(testStoryId);
      await storyPage.waitForStoryLoad();
      
      const ratingSection = storyPage.page.getByTestId('story-rating-section');
      
      // Submit a rating
      const userRatingForm = ratingSection.getByTestId('user-rating-form');
      await userRatingForm.getByTestId('star-button').nth(3).click(); // 4 stars
      
      await expect(storyPage.page.getByText('Rating submitted')).toBeVisible();
      
      // Submit a review
      const reviewSection = storyPage.page.getByTestId('story-review-section');
      await reviewSection.getByTestId('write-review-button').click();
      
      const reviewModal = storyPage.page.getByTestId('write-review-modal');
      await reviewModal.getByTestId('review-star-button').nth(3).click(); // 4 stars
      await reviewModal.getByTestId('review-textarea').fill('Excellent character development and plot pacing!');
      await reviewModal.getByTestId('submit-review-button').click();
      
      await expect(storyPage.page.getByText('Review published')).toBeVisible();
      
      // Verify rating in database
      const ratingResponse = await storyPage.page.request.get(`/api/stories/${testStoryId}/ratings`);
      expect(ratingResponse.status()).toBe(200);
      
      const ratings = await ratingResponse.json();
      const userRating = ratings.find((r: any) => r.userId === testUserId);
      
      expect(userRating).toBeDefined();
      expect(userRating.rating).toBe(4);
      expect(userRating.storyId).toBe(testStoryId);
      expect(userRating.createdAt).toBeDefined();
      
      // Verify review in database
      const reviewsResponse = await storyPage.page.request.get(`/api/stories/${testStoryId}/reviews`);
      expect(reviewsResponse.status()).toBe(200);
      
      const reviews = await reviewsResponse.json();
      const userReview = reviews.find((r: any) => r.userId === testUserId);
      
      expect(userReview).toBeDefined();
      expect(userReview.rating).toBe(4);
      expect(userReview.reviewText).toContain('Excellent character development');
      expect(userReview.isVerifiedReader).toBeDefined();
      expect(userReview.helpfulCount).toBeDefined();
    });

    test('should manage user follow relationships', async () => {
      // This test will FAIL - follows table doesn't exist yet
      const authorToFollowId = 'author-to-follow-123';
      
      await storyPage.page.goto(`/authors/${authorToFollowId}`);
      
      const authorPage = storyPage.page.getByTestId('author-page');
      const followButton = authorPage.getByTestId('follow-author-button');
      
      await followButton.click();
      await expect(storyPage.page.getByText('Now following')).toBeVisible();
      
      // Verify follow relationship in database
      const followsResponse = await storyPage.page.request.get(`/api/users/${testUserId}/following`);
      expect(followsResponse.status()).toBe(200);
      
      const following = await followsResponse.json();
      const followRelationship = following.find((f: any) => f.followedUserId === authorToFollowId);
      
      expect(followRelationship).toBeDefined();
      expect(followRelationship.followerId).toBe(testUserId);
      expect(followRelationship.followedUserId).toBe(authorToFollowId);
      expect(followRelationship.followedAt).toBeDefined();
      expect(followRelationship.notificationsEnabled).toBeDefined();
      
      // Test unfollowing
      await followButton.click();
      const unfollowModal = storyPage.page.getByTestId('unfollow-confirmation-modal');
      await unfollowModal.getByTestId('confirm-unfollow-button').click();
      
      await expect(storyPage.page.getByText('Unfollowed successfully')).toBeVisible();
      
      // Verify unfollow in database
      const unfollowedResponse = await storyPage.page.request.get(`/api/users/${testUserId}/following`);
      const unfollowedList = await unfollowedResponse.json();
      const stillFollowing = unfollowedList.find((f: any) => f.followedUserId === authorToFollowId);
      
      expect(stillFollowing).toBeUndefined();
    });

    test('should store story interactions (likes, bookmarks)', async () => {
      // This test will FAIL - story interactions table doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      await storyPage.waitForStoryLoad();
      
      // Like the story
      const likeButton = storyPage.page.getByTestId('like-story-button');
      await likeButton.click();
      await expect(storyPage.page.getByText('Story liked')).toBeVisible();
      
      // Bookmark the story
      const bookmarkButton = storyPage.page.getByTestId('bookmark-story-button');
      await bookmarkButton.click();
      await expect(storyPage.page.getByText('Story bookmarked')).toBeVisible();
      
      // Verify interactions in database
      const interactionsResponse = await storyPage.page.request.get(
        `/api/users/${testUserId}/story-interactions/${testStoryId}`
      );
      expect(interactionsResponse.status()).toBe(200);
      
      const interactions = await interactionsResponse.json();
      
      const likeInteraction = interactions.find((i: any) => i.interactionType === 'like');
      const bookmarkInteraction = interactions.find((i: any) => i.interactionType === 'bookmark');
      
      expect(likeInteraction).toBeDefined();
      expect(likeInteraction.userId).toBe(testUserId);
      expect(likeInteraction.storyId).toBe(testStoryId);
      expect(likeInteraction.createdAt).toBeDefined();
      
      expect(bookmarkInteraction).toBeDefined();
      expect(bookmarkInteraction.userId).toBe(testUserId);
      expect(bookmarkInteraction.storyId).toBe(testStoryId);
      expect(bookmarkInteraction.createdAt).toBeDefined();
    });
  });

  test.describe('AI Writing Sessions and Suggestions Tracking', () => {
    test('should store AI writing session data', async () => {
      // This test will FAIL - AI writing sessions table doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      await expect(chapterEditor).toBeVisible();
      
      // Enable AI assistant
      const aiAssistantPanel = storyPage.page.getByTestId('ai-assistant-panel');
      await aiAssistantPanel.getByTestId('ai-toggle-button').click();
      
      // Start writing to trigger AI session
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      await textEditor.click();
      await textEditor.fill('The character walked through the forest');
      
      // Wait for AI suggestions
      await expect(storyPage.page.getByTestId('ai-suggestion-overlay')).toBeVisible();
      
      // Accept an AI suggestion
      const suggestions = storyPage.page.getByTestId('ai-suggestion');
      await suggestions.first().getByTestId('accept-suggestion-button').click();
      
      // Verify AI session in database
      const sessionsResponse = await storyPage.page.request.get(
        `/api/users/${testUserId}/ai-writing-sessions`
      );
      expect(sessionsResponse.status()).toBe(200);
      
      const sessions = await sessionsResponse.json();
      expect(sessions.length).toBeGreaterThan(0);
      
      const latestSession = sessions[0];
      expect(latestSession.userId).toBe(testUserId);
      expect(latestSession.storyId).toBe(testStoryId);
      expect(latestSession.sessionType).toBe('writing-assistance');
      expect(latestSession.startTime).toBeDefined();
      expect(latestSession.endTime).toBeDefined();
      expect(latestSession.suggestionsGenerated).toBeGreaterThan(0);
      expect(latestSession.suggestionsAccepted).toBeGreaterThan(0);
      expect(latestSession.wordsWritten).toBeGreaterThan(0);
    });

    test('should track AI suggestion performance and user feedback', async () => {
      // This test will FAIL - AI suggestions tracking doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/write/chapter/1`);
      
      const chapterEditor = storyPage.page.getByTestId('chapter-editor');
      const aiAssistantPanel = storyPage.page.getByTestId('ai-assistant-panel');
      
      // Enable AI assistant and configure suggestion type
      await aiAssistantPanel.getByTestId('ai-suggestion-type-selector').click();
      await storyPage.page.getByTestId('suggestion-type-dialogue').click();
      
      const textEditor = chapterEditor.getByTestId('text-editor-content');
      await textEditor.fill('"Hello," she said');
      
      // Get AI suggestions
      const suggestions = storyPage.page.getByTestId('ai-suggestion');
      const firstSuggestion = suggestions.first();
      
      // Accept suggestion with feedback
      await firstSuggestion.getByTestId('accept-suggestion-button').click();
      
      // Rate the suggestion quality
      const feedbackModal = storyPage.page.getByTestId('suggestion-feedback-modal');
      await expect(feedbackModal).toBeVisible();
      
      await feedbackModal.getByTestId('quality-rating-4').click();
      await feedbackModal.getByTestId('usefulness-rating-5').click();
      await feedbackModal.getByTestId('submit-feedback-button').click();
      
      // Verify AI suggestion tracking in database
      const suggestionsResponse = await storyPage.page.request.get(
        `/api/ai-suggestions/${testUserId}/recent`
      );
      expect(suggestionsResponse.status()).toBe(200);
      
      const suggestionHistory = await suggestionsResponse.json();
      expect(suggestionHistory.length).toBeGreaterThan(0);
      
      const latestSuggestion = suggestionHistory[0];
      expect(latestSuggestion.userId).toBe(testUserId);
      expect(latestSuggestion.storyId).toBe(testStoryId);
      expect(latestSuggestion.suggestionType).toBe('dialogue');
      expect(latestSuggestion.originalText).toBeDefined();
      expect(latestSuggestion.suggestedText).toBeDefined();
      expect(latestSuggestion.wasAccepted).toBe(true);
      expect(latestSuggestion.qualityRating).toBe(4);
      expect(latestSuggestion.usefulnessRating).toBe(5);
      expect(latestSuggestion.responseTime).toBeDefined();
    });

    test('should store character development AI session data', async () => {
      // This test will FAIL - character AI sessions table doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/characters/elena-blackwood`);
      
      const characterProfile = storyPage.page.getByTestId('character-profile-page');
      const aiSuggestionsPanel = characterProfile.getByTestId('ai-character-suggestions');
      
      // Request AI character development suggestions
      const requestSuggestionsButton = aiSuggestionsPanel.getByTestId('request-ai-suggestions-button');
      await requestSuggestionsButton.click();
      
      // AI should generate character development suggestions
      await expect(storyPage.page.getByText('Generating character insights...')).toBeVisible();
      await expect(storyPage.page.getByText('AI suggestions generated')).toBeVisible();
      
      const suggestionCards = aiSuggestionsPanel.getByTestId('suggestion-card');
      expect(await suggestionCards.count()).toBeGreaterThan(0);
      
      // Apply a character development suggestion
      await suggestionCards.first().getByTestId('apply-suggestion-button').click();
      
      const applySuggestionModal = storyPage.page.getByTestId('apply-suggestion-modal');
      await applySuggestionModal.getByTestId('confirm-apply-button').click();
      
      // Verify character AI session in database
      const characterAiResponse = await storyPage.page.request.get(
        `/api/characters/elena-blackwood/ai-sessions`
      );
      expect(characterAiResponse.status()).toBe(200);
      
      const characterAiSessions = await characterAiResponse.json();
      expect(characterAiSessions.length).toBeGreaterThan(0);
      
      const latestSession = characterAiSessions[0];
      expect(latestSession.characterId).toBe('elena-blackwood');
      expect(latestSession.sessionType).toBe('character-development');
      expect(latestSession.suggestionsGenerated).toBeGreaterThan(0);
      expect(latestSession.suggestionsApplied).toBeGreaterThan(0);
      expect(latestSession.focusAreas).toBeDefined();
      expect(latestSession.consistencyScoreBefore).toBeDefined();
      expect(latestSession.consistencyScoreAfter).toBeDefined();
    });

    test('should track plot analysis AI sessions', async () => {
      // This test will FAIL - plot AI sessions table doesn't exist yet
      await storyPage.page.goto(`/stories/${testStoryId}/plot/analysis`);
      
      const plotAnalysisPage = storyPage.page.getByTestId('plot-analysis-page');
      
      // Request AI plot analysis
      const analyzeButton = plotAnalysisPage.getByTestId('ai-analyze-plot-button');
      await analyzeButton.click();
      
      await expect(storyPage.page.getByText('Analyzing plot structure...')).toBeVisible();
      await expect(storyPage.page.getByText('Plot analysis complete')).toBeVisible();
      
      // View plot recommendations
      const recommendationsSection = plotAnalysisPage.getByTestId('ai-plot-recommendations');
      await expect(recommendationsSection).toBeVisible();
      
      const recommendations = recommendationsSection.getByTestId('plot-recommendation');
      expect(await recommendations.count()).toBeGreaterThan(0);
      
      // Apply a plot recommendation
      await recommendations.first().getByTestId('apply-plot-recommendation').click();
      
      const confirmModal = storyPage.page.getByTestId('apply-plot-recommendation-modal');
      await confirmModal.getByTestId('confirm-apply-recommendation').click();
      
      // Verify plot AI session in database
      const plotAiResponse = await storyPage.page.request.get(
        `/api/stories/${testStoryId}/plot-ai-sessions`
      );
      expect(plotAiResponse.status()).toBe(200);
      
      const plotAiSessions = await plotAiResponse.json();
      expect(plotAiSessions.length).toBeGreaterThan(0);
      
      const latestSession = plotAiSessions[0];
      expect(latestSession.storyId).toBe(testStoryId);
      expect(latestSession.sessionType).toBe('plot-analysis');
      expect(latestSession.analysisType).toBeDefined(); // e.g., 'structure', 'pacing', 'consistency'
      expect(latestSession.recommendations).toBeDefined();
      expect(latestSession.recommendationsApplied).toBeDefined();
      expect(latestSession.plotHealthScoreBefore).toBeDefined();
      expect(latestSession.plotHealthScoreAfter).toBeDefined();
    });
  });

  test.describe('Analytics and Engagement Metrics Storage', () => {
    test('should store detailed reader engagement metrics', async () => {
      // This test will FAIL - reader engagement metrics table doesn't exist yet
      await storyPage.navigateToStory(testStoryId);
      await storyPage.waitForStoryLoad();
      
      // Simulate reading behavior that should be tracked
      const chapterContent = storyPage.page.getByTestId('chapter-content');
      
      // Scroll through the chapter to simulate reading
      await chapterContent.click();
      await storyPage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 4));
      await storyPage.page.waitForTimeout(2000); // Simulate reading time
      
      await storyPage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await storyPage.page.waitForTimeout(3000); // More reading time
      
      await storyPage.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await storyPage.page.waitForTimeout(1000); // Finish reading
      
      // Navigate to next chapter to trigger session completion
      await storyPage.navigateToNextChapter();
      
      // Verify engagement metrics in database
      const engagementResponse = await storyPage.page.request.get(
        `/api/stories/${testStoryId}/engagement-metrics`
      );
      expect(engagementResponse.status()).toBe(200);
      
      const engagementData = await engagementResponse.json();
      
      // Should have reading session data
      expect(engagementData.readingSessions).toBeDefined();
      expect(engagementData.readingSessions.length).toBeGreaterThan(0);
      
      const latestSession = engagementData.readingSessions[0];
      expect(latestSession.userId).toBe(testUserId);
      expect(latestSession.storyId).toBe(testStoryId);
      expect(latestSession.chapterNumber).toBe(1);
      expect(latestSession.startTime).toBeDefined();
      expect(latestSession.endTime).toBeDefined();
      expect(latestSession.timeSpent).toBeGreaterThan(5000); // At least 5 seconds
      expect(latestSession.scrollDepthMax).toBeGreaterThan(0.8); // Read to at least 80%
      expect(latestSession.wordsRead).toBeGreaterThan(0);
      expect(latestSession.readingSpeed).toBeGreaterThan(0); // Words per minute
      expect(latestSession.completedChapter).toBe(true);
    });

    test('should store and aggregate story statistics', async () => {
      // This test will FAIL - story statistics aggregation doesn't exist yet
      
      // Simulate multiple readers accessing the story
      const readerIds = ['reader-1', 'reader-2', 'reader-3'];
      
      for (const readerId of readerIds) {
        // Post story interaction via API to simulate different readers
        await storyPage.page.request.post(`/api/stories/${testStoryId}/interactions`, {
          data: {
            userId: readerId,
            interactionType: 'view',
            chapterNumber: 1,
            timestamp: new Date().toISOString(),
            sessionDuration: Math.floor(Math.random() * 600000) + 60000, // 1-10 minutes
            deviceType: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
            referrerSource: ['direct', 'social', 'search'][Math.floor(Math.random() * 3)]
          }
        });
      }
      
      // Verify aggregated statistics
      const statsResponse = await storyPage.page.request.get(
        `/api/stories/${testStoryId}/statistics`
      );
      expect(statsResponse.status()).toBe(200);
      
      const statistics = await statsResponse.json();
      
      expect(statistics.totalViews).toBeGreaterThan(0);
      expect(statistics.uniqueReaders).toBeGreaterThan(0);
      expect(statistics.averageSessionDuration).toBeGreaterThan(0);
      expect(statistics.deviceBreakdown).toBeDefined();
      expect(statistics.deviceBreakdown.mobile).toBeGreaterThanOrEqual(0);
      expect(statistics.deviceBreakdown.desktop).toBeGreaterThanOrEqual(0);
      expect(statistics.deviceBreakdown.tablet).toBeGreaterThanOrEqual(0);
      
      expect(statistics.trafficSources).toBeDefined();
      expect(statistics.trafficSources.direct).toBeGreaterThanOrEqual(0);
      expect(statistics.trafficSources.social).toBeGreaterThanOrEqual(0);
      expect(statistics.trafficSources.search).toBeGreaterThanOrEqual(0);
      
      // Time-based statistics
      expect(statistics.dailyStats).toBeDefined();
      expect(statistics.weeklyStats).toBeDefined();
      expect(statistics.monthlyStats).toBeDefined();
    });

    test('should store user reading behavior patterns', async () => {
      // This test will FAIL - reading behavior patterns table doesn't exist yet
      
      // Simulate multiple reading sessions over different times
      const readingSessions = [
        { hour: 9, duration: 15, chaptersRead: 1, completionRate: 1.0 },
        { hour: 14, duration: 22, chaptersRead: 2, completionRate: 0.8 },
        { hour: 20, duration: 45, chaptersRead: 3, completionRate: 1.0 },
        { hour: 22, duration: 12, chaptersRead: 1, completionRate: 0.6 }
      ];
      
      for (const session of readingSessions) {
        await storyPage.page.request.post(`/api/users/${testUserId}/reading-patterns`, {
          data: {
            storyId: testStoryId,
            sessionDate: new Date().toISOString().split('T')[0],
            sessionHour: session.hour,
            durationMinutes: session.duration,
            chaptersRead: session.chaptersRead,
            averageCompletionRate: session.completionRate,
            deviceType: 'desktop',
            readingEnvironment: 'home'
          }
        });
      }
      
      // Verify reading patterns storage
      const patternsResponse = await storyPage.page.request.get(
        `/api/users/${testUserId}/reading-patterns/analysis`
      );
      expect(patternsResponse.status()).toBe(200);
      
      const patterns = await patternsResponse.json();
      
      expect(patterns.preferredReadingHours).toBeDefined();
      expect(patterns.averageSessionDuration).toBeGreaterThan(0);
      expect(patterns.averageChaptersPerSession).toBeGreaterThan(0);
      expect(patterns.overallCompletionRate).toBeGreaterThan(0);
      expect(patterns.readingStreakData).toBeDefined();
      expect(patterns.genrePreferences).toBeDefined();
      expect(patterns.devicePreferences).toBeDefined();
      
      // Peak reading hours should be identified
      expect(patterns.peakReadingHours).toBeDefined();
      expect(patterns.peakReadingHours.length).toBeGreaterThan(0);
      
      // Reading consistency metrics
      expect(patterns.readingConsistency).toBeDefined();
      expect(patterns.readingConsistency.dailyVariation).toBeDefined();
      expect(patterns.readingConsistency.weeklyPattern).toBeDefined();
    });

    test('should store performance benchmarking data', async () => {
      // This test will FAIL - benchmarking data storage doesn't exist yet
      
      // Simulate story performance data for benchmarking
      const performanceData = {
        storyId: testStoryId,
        genre: 'fantasy',
        publicationDate: '2024-01-15',
        metrics: {
          viewsDay1: 150,
          viewsDay7: 1200,
          viewsDay30: 4500,
          engagementRate: 0.68,
          averageRating: 4.3,
          retentionRate: 0.72,
          sharingRate: 0.15,
          commentRate: 0.08
        },
        demographicBreakdown: {
          age18_24: 0.25,
          age25_34: 0.35,
          age35_44: 0.20,
          age45_plus: 0.20
        },
        geographicBreakdown: {
          northAmerica: 0.45,
          europe: 0.30,
          asia: 0.18,
          other: 0.07
        }
      };
      
      await storyPage.page.request.post('/api/analytics/benchmarking/story-performance', {
        data: performanceData
      });
      
      // Verify benchmarking data storage
      const benchmarkResponse = await storyPage.page.request.get(
        `/api/analytics/benchmarking/story/${testStoryId}`
      );
      expect(benchmarkResponse.status()).toBe(200);
      
      const benchmarkData = await benchmarkResponse.json();
      
      expect(benchmarkData.storyMetrics).toBeDefined();
      expect(benchmarkData.storyMetrics.viewsDay30).toBe(4500);
      expect(benchmarkData.storyMetrics.engagementRate).toBe(0.68);
      
      expect(benchmarkData.genreComparison).toBeDefined();
      expect(benchmarkData.genreComparison.averageEngagementRate).toBeDefined();
      expect(benchmarkData.genreComparison.percentileRank).toBeDefined();
      
      expect(benchmarkData.performanceIndex).toBeDefined();
      expect(benchmarkData.performanceIndex.overall).toBeGreaterThan(0);
      expect(benchmarkData.performanceIndex.engagement).toBeGreaterThan(0);
      expect(benchmarkData.performanceIndex.retention).toBeGreaterThan(0);
      
      // Historical comparison data
      expect(benchmarkData.historicalComparison).toBeDefined();
      expect(benchmarkData.historicalComparison.growthRate).toBeDefined();
      expect(benchmarkData.historicalComparison.trendingDirection).toBeDefined();
    });
  });
});