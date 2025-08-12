import { test, expect } from '@playwright/test';

// RED PHASE: Comprehensive failing tests for Phase 3 Community UI Interactions
// These tests verify that all community user interface features work correctly

test.describe('Phase 3: Community UI Interactions Tests', () => {
  test.beforeEach(async ({ page }) => {
    // This will fail until we have proper authentication and community pages
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
  });

  test.describe('Forum System UI', () => {
    test('should display forum categories page', async ({ page }) => {
      await page.goto('/community/forums');
      
      await expect(page).toHaveTitle(/Forums/);
      await expect(page.locator('[data-testid="forum-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-category-button"]')).toBeVisible();
      
      // Check category list
      const categories = page.locator('[data-testid="category-card"]');
      await expect(categories.first()).toBeVisible();
      await expect(categories.first().locator('[data-testid="category-name"]')).toBeVisible();
      await expect(categories.first().locator('[data-testid="thread-count"]')).toBeVisible();
      await expect(categories.first().locator('[data-testid="post-count"]')).toBeVisible();
    });

    test('should create new forum category', async ({ page }) => {
      await page.goto('/community/forums');
      await page.click('[data-testid="create-category-button"]');
      
      await expect(page.locator('[data-testid="create-category-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="category-name"]', 'Test Category');
      await page.fill('[data-testid="category-description"]', 'A test category for testing');
      await page.selectOption('[data-testid="category-parent"]', { label: 'None' });
      await page.check('[data-testid="category-visible"]');
      
      await page.click('[data-testid="create-category-submit"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-card"]').filter({ hasText: 'Test Category' })).toBeVisible();
    });

    test('should display forum threads in category', async ({ page }) => {
      await page.goto('/community/forums/general');
      
      await expect(page).toHaveTitle(/General Discussion/);
      await expect(page.locator('[data-testid="category-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-thread-button"]')).toBeVisible();
      
      // Check thread list
      const threads = page.locator('[data-testid="thread-item"]');
      await expect(threads.first()).toBeVisible();
      await expect(threads.first().locator('[data-testid="thread-title"]')).toBeVisible();
      await expect(threads.first().locator('[data-testid="thread-author"]')).toBeVisible();
      await expect(threads.first().locator('[data-testid="thread-post-count"]')).toBeVisible();
      await expect(threads.first().locator('[data-testid="thread-last-post"]')).toBeVisible();
    });

    test('should create new forum thread', async ({ page }) => {
      await page.goto('/community/forums/general');
      await page.click('[data-testid="create-thread-button"]');
      
      await expect(page.locator('[data-testid="create-thread-form"]')).toBeVisible();
      
      await page.fill('[data-testid="thread-title"]', 'Test Thread Title');
      await page.fill('[data-testid="thread-content"]', 'This is the content of my test thread.');
      await page.fill('[data-testid="thread-tags"]', 'test, example');
      
      await page.click('[data-testid="create-thread-submit"]');
      
      await expect(page).toHaveURL(/\/community\/forums\/general\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="thread-title"]')).toHaveText('Test Thread Title');
    });

    test('should display thread with posts and allow posting', async ({ page }) => {
      await page.goto('/community/forums/general/test-thread-slug');
      
      await expect(page.locator('[data-testid="thread-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="thread-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="thread-author"]')).toBeVisible();
      
      // Check posts
      const posts = page.locator('[data-testid="forum-post"]');
      await expect(posts.first()).toBeVisible();
      await expect(posts.first().locator('[data-testid="post-author"]')).toBeVisible();
      await expect(posts.first().locator('[data-testid="post-content"]')).toBeVisible();
      await expect(posts.first().locator('[data-testid="post-timestamp"]')).toBeVisible();
      
      // Test posting
      await page.fill('[data-testid="post-content-editor"]', 'This is my reply to the thread.');
      await page.click('[data-testid="submit-post-button"]');
      
      await expect(page.locator('[data-testid="forum-post"]').last()).toContainText('This is my reply to the thread.');
    });

    test('should allow liking and editing posts', async ({ page }) => {
      await page.goto('/community/forums/general/test-thread-slug');
      
      const firstPost = page.locator('[data-testid="forum-post"]').first();
      
      // Test liking
      const likeButton = firstPost.locator('[data-testid="like-post-button"]');
      await likeButton.click();
      await expect(firstPost.locator('[data-testid="like-count"]')).toContainText('1');
      
      // Test editing (if own post)
      const editButton = firstPost.locator('[data-testid="edit-post-button"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        await expect(firstPost.locator('[data-testid="edit-post-form"]')).toBeVisible();
        
        await firstPost.locator('[data-testid="edit-post-content"]').fill('Edited post content');
        await firstPost.locator('[data-testid="save-edit-button"]').click();
        
        await expect(firstPost.locator('[data-testid="post-content"]')).toContainText('Edited post content');
        await expect(firstPost.locator('[data-testid="edited-indicator"]')).toBeVisible();
      }
    });

    test('should display forum moderation tools for moderators', async ({ page }) => {
      // Assume user has moderator privileges
      await page.goto('/community/forums/general/test-thread-slug');
      
      const firstPost = page.locator('[data-testid="forum-post"]').first();
      
      await expect(firstPost.locator('[data-testid="moderate-post-button"]')).toBeVisible();
      await firstPost.locator('[data-testid="moderate-post-button"]').click();
      
      await expect(page.locator('[data-testid="moderation-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="moderation-action-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="moderation-reason"]')).toBeVisible();
    });
  });

  test.describe('Groups System UI', () => {
    test('should display groups discovery page', async ({ page }) => {
      await page.goto('/community/groups');
      
      await expect(page).toHaveTitle(/Groups/);
      await expect(page.locator('[data-testid="groups-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-group-button"]')).toBeVisible();
      
      // Check group cards
      const groups = page.locator('[data-testid="group-card"]');
      await expect(groups.first()).toBeVisible();
      await expect(groups.first().locator('[data-testid="group-name"]')).toBeVisible();
      await expect(groups.first().locator('[data-testid="group-member-count"]')).toBeVisible();
      await expect(groups.first().locator('[data-testid="group-category"]')).toBeVisible();
    });

    test('should filter groups by category and type', async ({ page }) => {
      await page.goto('/community/groups');
      
      // Test category filter
      await page.selectOption('[data-testid="category-filter"]', 'writing');
      await expect(page.locator('[data-testid="group-card"]').first().locator('[data-testid="group-category"]')).toContainText('Writing');
      
      // Test type filter
      await page.selectOption('[data-testid="type-filter"]', 'public');
      await expect(page.locator('[data-testid="group-card"]').first().locator('[data-testid="group-type"]')).toContainText('Public');
    });

    test('should create new group', async ({ page }) => {
      await page.goto('/community/groups');
      await page.click('[data-testid="create-group-button"]');
      
      await expect(page.locator('[data-testid="create-group-modal"]')).toBeVisible();
      
      await page.fill('[data-testid="group-name"]', 'Test Writing Group');
      await page.fill('[data-testid="group-description"]', 'A group for testing writing features');
      await page.selectOption('[data-testid="group-type"]', 'public');
      await page.selectOption('[data-testid="group-category"]', 'writing');
      await page.fill('[data-testid="group-tags"]', 'writing, test, community');
      await page.fill('[data-testid="group-member-limit"]', '100');
      
      await page.click('[data-testid="create-group-submit"]');
      
      await expect(page).toHaveURL(/\/community\/groups\/[a-zA-Z0-9-]+/);
      await expect(page.locator('[data-testid="group-name"]')).toHaveText('Test Writing Group');
    });

    test('should display group details and allow joining', async ({ page }) => {
      await page.goto('/community/groups/test-writing-group');
      
      await expect(page.locator('[data-testid="group-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="group-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="group-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="group-member-count"]')).toBeVisible();
      
      // Test joining group
      const joinButton = page.locator('[data-testid="join-group-button"]');
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await expect(page.locator('[data-testid="leave-group-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText('joined');
      }
    });

    test('should display group activities and members', async ({ page }) => {
      await page.goto('/community/groups/test-writing-group');
      
      // Test activities tab
      await page.click('[data-testid="activities-tab"]');
      await expect(page.locator('[data-testid="group-activities"]')).toBeVisible();
      
      const activities = page.locator('[data-testid="activity-item"]');
      await expect(activities.first()).toBeVisible();
      await expect(activities.first().locator('[data-testid="activity-author"]')).toBeVisible();
      await expect(activities.first().locator('[data-testid="activity-content"]')).toBeVisible();
      
      // Test members tab
      await page.click('[data-testid="members-tab"]');
      await expect(page.locator('[data-testid="group-members"]')).toBeVisible();
      
      const members = page.locator('[data-testid="member-item"]');
      await expect(members.first()).toBeVisible();
      await expect(members.first().locator('[data-testid="member-name"]')).toBeVisible();
      await expect(members.first().locator('[data-testid="member-role"]')).toBeVisible();
    });

    test('should allow group owner to manage group', async ({ page }) => {
      // Assume user is group owner
      await page.goto('/community/groups/test-writing-group');
      
      await expect(page.locator('[data-testid="manage-group-button"]')).toBeVisible();
      await page.click('[data-testid="manage-group-button"]');
      
      await expect(page.locator('[data-testid="group-settings-modal"]')).toBeVisible();
      
      // Test inviting members
      await page.click('[data-testid="invite-members-tab"]');
      await page.fill('[data-testid="invite-user-email"]', 'newmember@example.com');
      await page.fill('[data-testid="invite-message"]', 'Join our writing group!');
      await page.click('[data-testid="send-invite-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('invitation sent');
    });
  });

  test.describe('Contests System UI', () => {
    test('should display contests page', async ({ page }) => {
      await page.goto('/community/contests');
      
      await expect(page).toHaveTitle(/Contests/);
      await expect(page.locator('[data-testid="contests-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-contest-button"]')).toBeVisible();
      
      const contests = page.locator('[data-testid="contest-card"]');
      await expect(contests.first()).toBeVisible();
      await expect(contests.first().locator('[data-testid="contest-title"]')).toBeVisible();
      await expect(contests.first().locator('[data-testid="contest-status"]')).toBeVisible();
      await expect(contests.first().locator('[data-testid="contest-deadline"]')).toBeVisible();
    });

    test('should create new contest', async ({ page }) => {
      await page.goto('/community/contests');
      await page.click('[data-testid="create-contest-button"]');
      
      await expect(page.locator('[data-testid="create-contest-form"]')).toBeVisible();
      
      await page.fill('[data-testid="contest-title"]', 'Test Writing Contest');
      await page.fill('[data-testid="contest-description"]', 'A contest for testing purposes');
      await page.selectOption('[data-testid="contest-type"]', 'writing');
      await page.fill('[data-testid="contest-rules"]', 'Write a short story under 1000 words');
      
      // Set dates
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      
      await page.fill('[data-testid="submission-start"]', tomorrow);
      await page.fill('[data-testid="submission-end"]', nextWeek);
      
      await page.click('[data-testid="create-contest-submit"]');
      
      await expect(page).toHaveURL(/\/community\/contests\/[a-zA-Z0-9-]+/);
    });

    test('should display contest details and allow submission', async ({ page }) => {
      await page.goto('/community/contests/test-writing-contest');
      
      await expect(page.locator('[data-testid="contest-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="contest-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="contest-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="contest-rules"]')).toBeVisible();
      await expect(page.locator('[data-testid="contest-prizes"]')).toBeVisible();
      
      // Test submission (if contest is open)
      const submitButton = page.locator('[data-testid="submit-to-contest-button"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        await expect(page.locator('[data-testid="submission-form"]')).toBeVisible();
        
        await page.fill('[data-testid="submission-title"]', 'My Contest Entry');
        await page.fill('[data-testid="submission-content"]', 'This is my contest submission content...');
        await page.check('[data-testid="submission-anonymous"]');
        
        await page.click('[data-testid="submit-entry-button"]');
        
        await expect(page.locator('[data-testid="success-message"]')).toContainText('submitted');
      }
    });

    test('should display contest submissions and voting', async ({ page }) => {
      await page.goto('/community/contests/test-writing-contest/submissions');
      
      await expect(page.locator('[data-testid="submissions-list"]')).toBeVisible();
      
      const submissions = page.locator('[data-testid="submission-card"]');
      await expect(submissions.first()).toBeVisible();
      await expect(submissions.first().locator('[data-testid="submission-title"]')).toBeVisible();
      await expect(submissions.first().locator('[data-testid="submission-word-count"]')).toBeVisible();
      
      // Test voting (if voting is open)
      const voteButton = submissions.first().locator('[data-testid="vote-button"]');
      if (await voteButton.isVisible()) {
        await voteButton.click();
        
        await expect(page.locator('[data-testid="voting-modal"]')).toBeVisible();
        
        await page.selectOption('[data-testid="vote-score"]', '8');
        await page.fill('[data-testid="vote-feedback"]', 'Great story with excellent pacing!');
        
        await page.click('[data-testid="submit-vote-button"]');
        
        await expect(page.locator('[data-testid="success-message"]')).toContainText('vote submitted');
      }
    });

    test('should display contest leaderboard', async ({ page }) => {
      await page.goto('/community/contests/test-writing-contest/leaderboard');
      
      await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
      
      const entries = page.locator('[data-testid="leaderboard-entry"]');
      await expect(entries.first()).toBeVisible();
      await expect(entries.first().locator('[data-testid="entry-rank"]')).toBeVisible();
      await expect(entries.first().locator('[data-testid="entry-title"]')).toBeVisible();
      await expect(entries.first().locator('[data-testid="entry-score"]')).toBeVisible();
    });
  });

  test.describe('Gamification System UI', () => {
    test('should display achievements page', async ({ page }) => {
      await page.goto('/library/achievements');
      
      await expect(page).toHaveTitle(/Achievements/);
      await expect(page.locator('[data-testid="achievements-overview"]')).toBeVisible();
      
      // Check unlocked achievements
      await page.click('[data-testid="unlocked-tab"]');
      const unlockedAchievements = page.locator('[data-testid="achievement-unlocked"]');
      await expect(unlockedAchievements.first()).toBeVisible();
      
      // Check in-progress achievements
      await page.click('[data-testid="in-progress-tab"]');
      const progressAchievements = page.locator('[data-testid="achievement-progress"]');
      await expect(progressAchievements.first()).toBeVisible();
      await expect(progressAchievements.first().locator('[data-testid="progress-bar"]')).toBeVisible();
    });

    test('should display user level and experience', async ({ page }) => {
      await page.goto('/profile/level');
      
      await expect(page.locator('[data-testid="user-level"]')).toBeVisible();
      await expect(page.locator('[data-testid="level-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="level-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="experience-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="experience-points"]')).toBeVisible();
      await expect(page.locator('[data-testid="next-level-points"]')).toBeVisible();
    });

    test('should display leaderboards', async ({ page }) => {
      await page.goto('/community/leaderboards');
      
      await expect(page).toHaveTitle(/Leaderboards/);
      
      // Test different leaderboard types
      await page.click('[data-testid="weekly-tab"]');
      await expect(page.locator('[data-testid="leaderboard-weekly"]')).toBeVisible();
      
      await page.click('[data-testid="monthly-tab"]');
      await expect(page.locator('[data-testid="leaderboard-monthly"]')).toBeVisible();
      
      // Check leaderboard entries
      const entries = page.locator('[data-testid="leaderboard-entry"]');
      await expect(entries.first()).toBeVisible();
      await expect(entries.first().locator('[data-testid="user-rank"]')).toBeVisible();
      await expect(entries.first().locator('[data-testid="user-name"]')).toBeVisible();
      await expect(entries.first().locator('[data-testid="user-score"]')).toBeVisible();
    });

    test('should show achievement unlock notification', async ({ page }) => {
      // Trigger an action that unlocks an achievement
      await page.goto('/stories/test-story/chapters/1');
      await page.click('[data-testid="finish-reading-button"]');
      
      // Check for achievement notification
      await expect(page.locator('[data-testid="achievement-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-points"]')).toBeVisible();
    });
  });

  test.describe('Collaboration Tools UI', () => {
    test('should display beta reader marketplace', async ({ page }) => {
      await page.goto('/community/beta-readers');
      
      await expect(page).toHaveTitle(/Beta Readers/);
      await expect(page.locator('[data-testid="beta-reader-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="become-beta-reader-button"]')).toBeVisible();
      
      const betaReaders = page.locator('[data-testid="beta-reader-card"]');
      await expect(betaReaders.first()).toBeVisible();
      await expect(betaReaders.first().locator('[data-testid="beta-reader-name"]')).toBeVisible();
      await expect(betaReaders.first().locator('[data-testid="beta-reader-specialties"]')).toBeVisible();
      await expect(betaReaders.first().locator('[data-testid="beta-reader-rating"]')).toBeVisible();
    });

    test('should create beta reader profile', async ({ page }) => {
      await page.goto('/community/beta-readers');
      await page.click('[data-testid="become-beta-reader-button"]');
      
      await expect(page.locator('[data-testid="beta-reader-profile-form"]')).toBeVisible();
      
      await page.selectOption('[data-testid="specialties"]', ['fantasy', 'science-fiction']);
      await page.selectOption('[data-testid="experience"]', 'intermediate');
      await page.fill('[data-testid="rate-per-word"]', '0.05');
      await page.fill('[data-testid="guidelines"]', 'I focus on plot consistency and character development');
      await page.fill('[data-testid="turnaround-time"]', '7');
      
      await page.click('[data-testid="create-profile-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('profile created');
    });

    test('should request beta reader services', async ({ page }) => {
      await page.goto('/community/beta-readers/test-beta-reader-id');
      
      await expect(page.locator('[data-testid="beta-reader-profile"]')).toBeVisible();
      
      await page.click('[data-testid="request-services-button"]');
      
      await expect(page.locator('[data-testid="beta-reader-request-form"]')).toBeVisible();
      
      await page.selectOption('[data-testid="story-select"]', 'test-story-id');
      await page.selectOption('[data-testid="request-type"]', 'developmental');
      await page.fill('[data-testid="deadline"]', '2024-12-31');
      await page.fill('[data-testid="budget"]', '100');
      await page.fill('[data-testid="requirements"]', 'Please focus on character development');
      
      await page.click('[data-testid="submit-request-button"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('request sent');
    });

    test('should display workshops page', async ({ page }) => {
      await page.goto('/community/workshops');
      
      await expect(page).toHaveTitle(/Workshops/);
      await expect(page.locator('[data-testid="workshops-filters"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-workshop-button"]')).toBeVisible();
      
      const workshops = page.locator('[data-testid="workshop-card"]');
      await expect(workshops.first()).toBeVisible();
      await expect(workshops.first().locator('[data-testid="workshop-title"]')).toBeVisible();
      await expect(workshops.first().locator('[data-testid="workshop-instructor"]')).toBeVisible();
      await expect(workshops.first().locator('[data-testid="workshop-date"]')).toBeVisible();
    });

    test('should enroll in workshop', async ({ page }) => {
      await page.goto('/community/workshops/test-workshop-id');
      
      await expect(page.locator('[data-testid="workshop-details"]')).toBeVisible();
      
      const enrollButton = page.locator('[data-testid="enroll-button"]');
      if (await enrollButton.isVisible()) {
        await enrollButton.click();
        
        await expect(page.locator('[data-testid="enrollment-confirmation"]')).toBeVisible();
        await page.click('[data-testid="confirm-enrollment"]');
        
        await expect(page.locator('[data-testid="success-message"]')).toContainText('enrolled');
        await expect(page.locator('[data-testid="enrolled-indicator"]')).toBeVisible();
      }
    });
  });

  test.describe('Extended Community Features UI', () => {
    test('should display user profile with community activity', async ({ page }) => {
      await page.goto('/profile/test-user-id');
      
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
      
      // Check community activity tabs
      await page.click('[data-testid="achievements-tab"]');
      await expect(page.locator('[data-testid="user-achievements"]')).toBeVisible();
      
      await page.click('[data-testid="groups-tab"]');
      await expect(page.locator('[data-testid="user-groups"]')).toBeVisible();
      
      await page.click('[data-testid="contests-tab"]');
      await expect(page.locator('[data-testid="user-contests"]')).toBeVisible();
    });

    test('should display notifications', async ({ page }) => {
      await page.goto('/notifications');
      
      await expect(page).toHaveTitle(/Notifications/);
      await expect(page.locator('[data-testid="notifications-list"]')).toBeVisible();
      
      const notifications = page.locator('[data-testid="notification-item"]');
      await expect(notifications.first()).toBeVisible();
      await expect(notifications.first().locator('[data-testid="notification-title"]')).toBeVisible();
      await expect(notifications.first().locator('[data-testid="notification-message"]')).toBeVisible();
      
      // Test marking as read
      await notifications.first().click();
      await expect(notifications.first()).toHaveClass(/read/);
    });

    test('should allow following/unfollowing users', async ({ page }) => {
      await page.goto('/profile/test-user-id');
      
      const followButton = page.locator('[data-testid="follow-user-button"]');
      if (await followButton.isVisible()) {
        await followButton.click();
        await expect(page.locator('[data-testid="unfollow-user-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="follower-count"]')).toBeVisible();
      }
    });

    test('should report inappropriate content', async ({ page }) => {
      await page.goto('/stories/test-story-id');
      
      await page.click('[data-testid="story-menu"]');
      await page.click('[data-testid="report-content"]');
      
      await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();
      
      await page.selectOption('[data-testid="report-reason"]', 'inappropriate');
      await page.fill('[data-testid="report-description"]', 'This content violates community guidelines');
      
      await page.click('[data-testid="submit-report"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('report submitted');
    });
  });

  test.describe('Mobile Responsive Community Features', () => {
    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test forum mobile view
      await page.goto('/community/forums');
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      
      // Test groups mobile view
      await page.goto('/community/groups');
      await expect(page.locator('[data-testid="mobile-filters-button"]')).toBeVisible();
      
      // Test contests mobile view
      await page.goto('/community/contests');
      await expect(page.locator('[data-testid="mobile-contest-list"]')).toBeVisible();
    });
  });

  test.describe('Community Search and Discovery', () => {
    test('should search across community content', async ({ page }) => {
      await page.goto('/community/search');
      
      await page.fill('[data-testid="search-input"]', 'writing tips');
      await page.click('[data-testid="search-button"]');
      
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Test filtering search results
      await page.click('[data-testid="filter-forums"]');
      await expect(page.locator('[data-testid="forum-results"]')).toBeVisible();
      
      await page.click('[data-testid="filter-groups"]');
      await expect(page.locator('[data-testid="group-results"]')).toBeVisible();
    });
  });
});