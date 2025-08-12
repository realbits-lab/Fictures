import { test, expect } from '@playwright/test';

// RED PHASE: Comprehensive failing tests for Phase 3 Community API Routes
// These tests verify that all community API endpoints work correctly

test.describe('Phase 3: Community API Routes Tests', () => {
  let authHeaders: Record<string, string>;

  test.beforeAll(async ({ request }) => {
    // This will fail until we have proper authentication setup
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword',
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
    
    const authToken = await loginResponse.json();
    authHeaders = {
      'Authorization': `Bearer ${authToken.token}`,
      'Content-Type': 'application/json',
    };
  });

  test.describe('Forum API Routes', () => {
    test('GET /api/forums/categories - should list forum categories', async ({ request }) => {
      const response = await request.get('/api/forums/categories', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const categories = await response.json();
      expect(Array.isArray(categories)).toBeTruthy();
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('threadCount');
      expect(categories[0]).toHaveProperty('postCount');
    });

    test('POST /api/forums/categories - should create new forum category', async ({ request }) => {
      const categoryData = {
        name: 'Test Category',
        description: 'A test category for testing',
        slug: 'test-category',
        parentId: null,
        isVisible: true,
        moderatorIds: [],
      };

      const response = await request.post('/api/forums/categories', {
        headers: authHeaders,
        data: categoryData,
      });
      
      expect(response.status()).toBe(201);
      const category = await response.json();
      expect(category).toHaveProperty('id');
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
    });

    test('GET /api/forums/categories/[id]/threads - should list threads in category', async ({ request }) => {
      const response = await request.get('/api/forums/categories/test-category-id/threads?page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('threads');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.threads)).toBeTruthy();
    });

    test('POST /api/forums/threads - should create new thread', async ({ request }) => {
      const threadData = {
        categoryId: 'test-category-id',
        title: 'Test Thread',
        content: 'This is a test thread content',
        tags: ['test', 'example'],
      };

      const response = await request.post('/api/forums/threads', {
        headers: authHeaders,
        data: threadData,
      });
      
      expect(response.status()).toBe(201);
      const thread = await response.json();
      expect(thread).toHaveProperty('id');
      expect(thread.title).toBe(threadData.title);
      expect(thread.slug).toBeDefined();
    });

    test('GET /api/forums/threads/[id] - should get thread with posts', async ({ request }) => {
      const response = await request.get('/api/forums/threads/test-thread-id?page=1&limit=10', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('thread');
      expect(result).toHaveProperty('posts');
      expect(result.thread).toHaveProperty('viewCount');
    });

    test('POST /api/forums/threads/[id]/posts - should create new post', async ({ request }) => {
      const postData = {
        content: 'This is a test post content',
        parentPostId: null,
      };

      const response = await request.post('/api/forums/threads/test-thread-id/posts', {
        headers: authHeaders,
        data: postData,
      });
      
      expect(response.status()).toBe(201);
      const post = await response.json();
      expect(post).toHaveProperty('id');
      expect(post.content).toBe(postData.content);
      expect(post).toHaveProperty('authorId');
    });

    test('PUT /api/forums/posts/[id] - should update post', async ({ request }) => {
      const updateData = {
        content: 'Updated post content',
      };

      const response = await request.put('/api/forums/posts/test-post-id', {
        headers: authHeaders,
        data: updateData,
      });
      
      expect(response.status()).toBe(200);
      const post = await response.json();
      expect(post.content).toBe(updateData.content);
      expect(post.isEdited).toBe(true);
    });

    test('POST /api/forums/posts/[id]/like - should like/unlike post', async ({ request }) => {
      const response = await request.post('/api/forums/posts/test-post-id/like', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('liked');
      expect(result).toHaveProperty('likeCount');
    });

    test('POST /api/forums/moderation - should create moderation action', async ({ request }) => {
      const moderationData = {
        targetType: 'post',
        targetId: 'test-post-id',
        action: 'warn',
        reason: 'Inappropriate content',
        duration: null,
      };

      const response = await request.post('/api/forums/moderation', {
        headers: authHeaders,
        data: moderationData,
      });
      
      expect(response.status()).toBe(201);
      const moderation = await response.json();
      expect(moderation).toHaveProperty('id');
      expect(moderation.action).toBe(moderationData.action);
    });
  });

  test.describe('Groups API Routes', () => {
    test('GET /api/groups - should list groups with filters', async ({ request }) => {
      const response = await request.get('/api/groups?type=public&category=writing&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('groups');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.groups)).toBeTruthy();
    });

    test('POST /api/groups - should create new group', async ({ request }) => {
      const groupData = {
        name: 'Test Writing Group',
        description: 'A group for testing writing features',
        type: 'public',
        category: 'writing',
        tags: ['writing', 'test'],
        memberLimit: 100,
        rules: 'Be respectful and supportive',
      };

      const response = await request.post('/api/groups', {
        headers: authHeaders,
        data: groupData,
      });
      
      expect(response.status()).toBe(201);
      const group = await response.json();
      expect(group).toHaveProperty('id');
      expect(group.name).toBe(groupData.name);
      expect(group.slug).toBeDefined();
    });

    test('GET /api/groups/[id] - should get group details', async ({ request }) => {
      const response = await request.get('/api/groups/test-group-id', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const group = await response.json();
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('memberCount');
      expect(group).toHaveProperty('recentActivity');
    });

    test('POST /api/groups/[id]/join - should join group', async ({ request }) => {
      const response = await request.post('/api/groups/test-group-id/join', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('joined');
      expect(result.joined).toBe(true);
    });

    test('POST /api/groups/[id]/leave - should leave group', async ({ request }) => {
      const response = await request.post('/api/groups/test-group-id/leave', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('left');
      expect(result.left).toBe(true);
    });

    test('GET /api/groups/[id]/members - should list group members', async ({ request }) => {
      const response = await request.get('/api/groups/test-group-id/members?page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.members)).toBeTruthy();
    });

    test('POST /api/groups/[id]/invite - should invite user to group', async ({ request }) => {
      const inviteData = {
        userId: 'test-user-id',
        message: 'Join our writing group!',
      };

      const response = await request.post('/api/groups/test-group-id/invite', {
        headers: authHeaders,
        data: inviteData,
      });
      
      expect(response.status()).toBe(201);
      const invitation = await response.json();
      expect(invitation).toHaveProperty('id');
      expect(invitation.status).toBe('pending');
    });

    test('GET /api/groups/[id]/activities - should get group activities', async ({ request }) => {
      const response = await request.get('/api/groups/test-group-id/activities?page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('activities');
      expect(Array.isArray(result.activities)).toBeTruthy();
    });

    test('POST /api/groups/[id]/activities - should create group activity', async ({ request }) => {
      const activityData = {
        activityType: 'post',
        content: 'Shared a new story with the group!',
        metadata: { storyId: 'test-story-id' },
      };

      const response = await request.post('/api/groups/test-group-id/activities', {
        headers: authHeaders,
        data: activityData,
      });
      
      expect(response.status()).toBe(201);
      const activity = await response.json();
      expect(activity).toHaveProperty('id');
      expect(activity.activityType).toBe(activityData.activityType);
    });
  });

  test.describe('Contests API Routes', () => {
    test('GET /api/contests - should list contests with filters', async ({ request }) => {
      const response = await request.get('/api/contests?status=open&type=writing&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('contests');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.contests)).toBeTruthy();
    });

    test('POST /api/contests - should create new contest', async ({ request }) => {
      const contestData = {
        title: 'Test Writing Contest',
        description: 'A contest for testing purposes',
        type: 'writing',
        rules: 'Write a short story under 1000 words',
        maxSubmissions: 100,
        submissionStart: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        submissionEnd: new Date(Date.now() + 7 * 86400000).toISOString(), // next week
        votingStart: new Date(Date.now() + 8 * 86400000).toISOString(),
        votingEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
        prizes: [
          { place: 1, description: 'First place prize', value: 100 },
          { place: 2, description: 'Second place prize', value: 50 },
        ],
        judgingCriteria: ['originality', 'writing quality', 'adherence to theme'],
      };

      const response = await request.post('/api/contests', {
        headers: authHeaders,
        data: contestData,
      });
      
      expect(response.status()).toBe(201);
      const contest = await response.json();
      expect(contest).toHaveProperty('id');
      expect(contest.title).toBe(contestData.title);
      expect(contest.slug).toBeDefined();
    });

    test('GET /api/contests/[id] - should get contest details', async ({ request }) => {
      const response = await request.get('/api/contests/test-contest-id', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const contest = await response.json();
      expect(contest).toHaveProperty('id');
      expect(contest).toHaveProperty('submissionCount');
      expect(contest).toHaveProperty('participantCount');
    });

    test('POST /api/contests/[id]/submit - should submit to contest', async ({ request }) => {
      const submissionData = {
        title: 'Test Submission',
        content: 'This is a test submission content',
        isAnonymous: false,
        storyId: null,
      };

      const response = await request.post('/api/contests/test-contest-id/submit', {
        headers: authHeaders,
        data: submissionData,
      });
      
      expect(response.status()).toBe(201);
      const submission = await response.json();
      expect(submission).toHaveProperty('id');
      expect(submission.title).toBe(submissionData.title);
      expect(submission).toHaveProperty('wordCount');
    });

    test('GET /api/contests/[id]/submissions - should list contest submissions', async ({ request }) => {
      const response = await request.get('/api/contests/test-contest-id/submissions?page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('submissions');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.submissions)).toBeTruthy();
    });

    test('POST /api/contests/[id]/submissions/[submissionId]/vote - should vote on submission', async ({ request }) => {
      const voteData = {
        score: 8,
        feedback: 'Great story with excellent character development',
      };

      const response = await request.post('/api/contests/test-contest-id/submissions/test-submission-id/vote', {
        headers: authHeaders,
        data: voteData,
      });
      
      expect(response.status()).toBe(201);
      const vote = await response.json();
      expect(vote).toHaveProperty('score');
      expect(vote.score).toBe(voteData.score);
    });

    test('GET /api/contests/[id]/leaderboard - should get contest leaderboard', async ({ request }) => {
      const response = await request.get('/api/contests/test-contest-id/leaderboard', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();
      expect(Array.isArray(leaderboard)).toBeTruthy();
      if (leaderboard.length > 0) {
        expect(leaderboard[0]).toHaveProperty('rank');
        expect(leaderboard[0]).toHaveProperty('score');
      }
    });
  });

  test.describe('Gamification API Routes', () => {
    test('GET /api/achievements - should list all achievements', async ({ request }) => {
      const response = await request.get('/api/achievements?category=reading&rarity=all', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const achievements = await response.json();
      expect(Array.isArray(achievements)).toBeTruthy();
      if (achievements.length > 0) {
        expect(achievements[0]).toHaveProperty('id');
        expect(achievements[0]).toHaveProperty('name');
        expect(achievements[0]).toHaveProperty('rarity');
      }
    });

    test('GET /api/users/[id]/achievements - should get user achievements', async ({ request }) => {
      const response = await request.get('/api/users/test-user-id/achievements', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const userAchievements = await response.json();
      expect(userAchievements).toHaveProperty('unlocked');
      expect(userAchievements).toHaveProperty('inProgress');
      expect(Array.isArray(userAchievements.unlocked)).toBeTruthy();
    });

    test('GET /api/users/[id]/level - should get user level and experience', async ({ request }) => {
      const response = await request.get('/api/users/test-user-id/level', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const userLevel = await response.json();
      expect(userLevel).toHaveProperty('level');
      expect(userLevel).toHaveProperty('experience');
      expect(userLevel).toHaveProperty('nextLevelExp');
      expect(userLevel).toHaveProperty('title');
    });

    test('GET /api/leaderboards - should get leaderboards', async ({ request }) => {
      const response = await request.get('/api/leaderboards?type=weekly&category=reading&limit=10', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const leaderboard = await response.json();
      expect(Array.isArray(leaderboard)).toBeTruthy();
      if (leaderboard.length > 0) {
        expect(leaderboard[0]).toHaveProperty('rank');
        expect(leaderboard[0]).toHaveProperty('userId');
        expect(leaderboard[0]).toHaveProperty('score');
      }
    });

    test('POST /api/achievements/check - should check and unlock achievements', async ({ request }) => {
      const checkData = {
        userId: 'test-user-id',
        action: 'story_completed',
        metadata: { storyId: 'test-story-id' },
      };

      const response = await request.post('/api/achievements/check', {
        headers: authHeaders,
        data: checkData,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('newAchievements');
      expect(result).toHaveProperty('experienceGained');
      expect(Array.isArray(result.newAchievements)).toBeTruthy();
    });
  });

  test.describe('Collaboration API Routes', () => {
    test('GET /api/beta-readers - should list beta readers', async ({ request }) => {
      const response = await request.get('/api/beta-readers?specialty=fantasy&availability=available&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('betaReaders');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.betaReaders)).toBeTruthy();
    });

    test('POST /api/beta-readers/profile - should create/update beta reader profile', async ({ request }) => {
      const profileData = {
        specialties: ['fantasy', 'science fiction'],
        experience: 'intermediate',
        rate: 0.05, // 5 cents per word
        availability: 'available',
        guidelines: 'I focus on plot consistency and character development',
        turnaroundTime: 7,
        portfolio: ['Previous work example 1', 'Previous work example 2'],
      };

      const response = await request.post('/api/beta-readers/profile', {
        headers: authHeaders,
        data: profileData,
      });
      
      expect(response.status()).toBe(201);
      const profile = await response.json();
      expect(profile).toHaveProperty('id');
      expect(profile.specialties).toEqual(profileData.specialties);
    });

    test('POST /api/beta-readers/request - should create beta reader request', async ({ request }) => {
      const requestData = {
        betaReaderId: 'test-beta-reader-id',
        storyId: 'test-story-id',
        chapterIds: ['chapter-1', 'chapter-2'],
        requestType: 'developmental',
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        budget: 100,
        requirements: 'Please focus on character development and pacing',
      };

      const response = await request.post('/api/beta-readers/request', {
        headers: authHeaders,
        data: requestData,
      });
      
      expect(response.status()).toBe(201);
      const request_result = await response.json();
      expect(request_result).toHaveProperty('id');
      expect(request_result.status).toBe('pending');
    });

    test('GET /api/beta-readers/requests - should list user beta reader requests', async ({ request }) => {
      const response = await request.get('/api/beta-readers/requests?status=pending&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('requests');
      expect(Array.isArray(result.requests)).toBeTruthy();
    });

    test('POST /api/stories/[id]/co-authors - should add co-author to story', async ({ request }) => {
      const coAuthorData = {
        userId: 'test-user-id',
        role: 'co-author',
        permissions: {
          canEdit: true,
          canPublish: false,
          canManageChapters: true,
        },
        contributionShare: 30, // 30% credit
      };

      const response = await request.post('/api/stories/test-story-id/co-authors', {
        headers: authHeaders,
        data: coAuthorData,
      });
      
      expect(response.status()).toBe(201);
      const coAuthor = await response.json();
      expect(coAuthor).toHaveProperty('storyId');
      expect(coAuthor.role).toBe(coAuthorData.role);
      expect(coAuthor.status).toBe('pending');
    });

    test('GET /api/workshops - should list workshops', async ({ request }) => {
      const response = await request.get('/api/workshops?type=live&category=writing&status=scheduled&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('workshops');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.workshops)).toBeTruthy();
    });

    test('POST /api/workshops - should create new workshop', async ({ request }) => {
      const workshopData = {
        title: 'Character Development Masterclass',
        description: 'Learn advanced character development techniques',
        type: 'live',
        category: 'writing',
        maxParticipants: 20,
        price: 29.99,
        duration: 120, // 2 hours
        scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        materials: {
          slides: 'presentation.pdf',
          exercises: ['exercise1.pdf', 'exercise2.pdf'],
        },
      };

      const response = await request.post('/api/workshops', {
        headers: authHeaders,
        data: workshopData,
      });
      
      expect(response.status()).toBe(201);
      const workshop = await response.json();
      expect(workshop).toHaveProperty('id');
      expect(workshop.title).toBe(workshopData.title);
    });

    test('POST /api/workshops/[id]/enroll - should enroll in workshop', async ({ request }) => {
      const response = await request.post('/api/workshops/test-workshop-id/enroll', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(201);
      const enrollment = await response.json();
      expect(enrollment).toHaveProperty('workshopId');
      expect(enrollment).toHaveProperty('enrolledAt');
    });
  });

  test.describe('Extended Community API Routes', () => {
    test('POST /api/users/[id]/follow - should follow/unfollow user', async ({ request }) => {
      const response = await request.post('/api/users/test-user-id/follow', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('following');
      expect(typeof result.following).toBe('boolean');
    });

    test('GET /api/notifications - should get user notifications', async ({ request }) => {
      const response = await request.get('/api/notifications?page=1&limit=20&unread=true', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('unreadCount');
      expect(Array.isArray(result.notifications)).toBeTruthy();
    });

    test('PUT /api/notifications/[id]/read - should mark notification as read', async ({ request }) => {
      const response = await request.put('/api/notifications/test-notification-id/read', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const notification = await response.json();
      expect(notification.isRead).toBe(true);
    });

    test('POST /api/reports - should report content', async ({ request }) => {
      const reportData = {
        contentType: 'story',
        contentId: 'test-story-id',
        reason: 'inappropriate',
        description: 'This content violates community guidelines',
      };

      const response = await request.post('/api/reports', {
        headers: authHeaders,
        data: reportData,
      });
      
      expect(response.status()).toBe(201);
      const report = await response.json();
      expect(report).toHaveProperty('id');
      expect(report.status).toBe('pending');
    });

    test('GET /api/admin/reports - should list reports for moderators', async ({ request }) => {
      const response = await request.get('/api/admin/reports?status=pending&page=1&limit=20', {
        headers: authHeaders,
      });
      
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('reports');
      expect(Array.isArray(result.reports)).toBeTruthy();
    });
  });

  test.describe('API Error Handling', () => {
    test('should return 401 for unauthorized requests', async ({ request }) => {
      const response = await request.get('/api/forums/categories');
      expect(response.status()).toBe(401);
    });

    test('should return 403 for forbidden actions', async ({ request }) => {
      const response = await request.post('/api/forums/moderation', {
        headers: authHeaders,
        data: {
          targetType: 'post',
          targetId: 'test-post-id',
          action: 'ban',
          reason: 'Test',
        },
      });
      // Should fail if user is not a moderator
      expect(response.status()).toBe(403);
    });

    test('should return 404 for non-existent resources', async ({ request }) => {
      const response = await request.get('/api/groups/non-existent-id', {
        headers: authHeaders,
      });
      expect(response.status()).toBe(404);
    });

    test('should return 400 for invalid data', async ({ request }) => {
      const response = await request.post('/api/groups', {
        headers: authHeaders,
        data: {
          name: '', // Invalid: empty name
          type: 'invalid-type', // Invalid: not in enum
        },
      });
      expect(response.status()).toBe(400);
    });

    test('should return 429 for rate limiting', async ({ request }) => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array.from({ length: 10 }, () =>
        request.post('/api/forums/posts/test-post-id/like', {
          headers: authHeaders,
        })
      );
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.some(response => response.status() === 429);
      expect(rateLimited).toBeTruthy();
    });
  });
});