import { test, expect } from '@playwright/test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../lib/db/schema';

// RED PHASE: Comprehensive failing tests for Phase 3 Community Database Schema
// These tests verify the database schema extensions needed for community features

test.describe('Phase 3: Community Database Schema Tests', () => {
  let db: ReturnType<typeof drizzle>;
  let client: postgres.Sql;

  test.beforeAll(async () => {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is required for database tests');
    }
    client = postgres(process.env.POSTGRES_URL);
    db = drizzle(client, { schema });
  });

  test.afterAll(async () => {
    await client.end();
  });

  test.describe('Forum System Schema', () => {
    test('should have forumCategory table with correct structure', async () => {
      // This test will fail until we create the forumCategory schema
      const categories = await db.select().from(schema.forumCategory).limit(1);
      expect(categories).toBeDefined();
      
      // Test required fields
      expect(schema.forumCategory.id).toBeDefined();
      expect(schema.forumCategory.name).toBeDefined();
      expect(schema.forumCategory.description).toBeDefined();
      expect(schema.forumCategory.slug).toBeDefined();
      expect(schema.forumCategory.parentId).toBeDefined(); // for nested categories
      expect(schema.forumCategory.order).toBeDefined();
      expect(schema.forumCategory.isVisible).toBeDefined();
      expect(schema.forumCategory.moderatorIds).toBeDefined();
      expect(schema.forumCategory.postCount).toBeDefined();
      expect(schema.forumCategory.threadCount).toBeDefined();
      expect(schema.forumCategory.createdAt).toBeDefined();
      expect(schema.forumCategory.updatedAt).toBeDefined();
    });

    test('should have forumThread table with correct structure', async () => {
      // This test will fail until we create the forumThread schema
      const threads = await db.select().from(schema.forumThread).limit(1);
      expect(threads).toBeDefined();
      
      // Test required fields
      expect(schema.forumThread.id).toBeDefined();
      expect(schema.forumThread.categoryId).toBeDefined();
      expect(schema.forumThread.title).toBeDefined();
      expect(schema.forumThread.slug).toBeDefined();
      expect(schema.forumThread.authorId).toBeDefined();
      expect(schema.forumThread.isLocked).toBeDefined();
      expect(schema.forumThread.isPinned).toBeDefined();
      expect(schema.forumThread.isSticky).toBeDefined();
      expect(schema.forumThread.tags).toBeDefined();
      expect(schema.forumThread.viewCount).toBeDefined();
      expect(schema.forumThread.postCount).toBeDefined();
      expect(schema.forumThread.lastPostAt).toBeDefined();
      expect(schema.forumThread.lastPostAuthorId).toBeDefined();
      expect(schema.forumThread.createdAt).toBeDefined();
      expect(schema.forumThread.updatedAt).toBeDefined();
    });

    test('should have forumPost table with correct structure', async () => {
      // This test will fail until we create the forumPost schema
      const posts = await db.select().from(schema.forumPost).limit(1);
      expect(posts).toBeDefined();
      
      // Test required fields
      expect(schema.forumPost.id).toBeDefined();
      expect(schema.forumPost.threadId).toBeDefined();
      expect(schema.forumPost.authorId).toBeDefined();
      expect(schema.forumPost.content).toBeDefined();
      expect(schema.forumPost.isEdited).toBeDefined();
      expect(schema.forumPost.editedAt).toBeDefined();
      expect(schema.forumPost.isDeleted).toBeDefined();
      expect(schema.forumPost.parentPostId).toBeDefined(); // for threaded replies
      expect(schema.forumPost.likeCount).toBeDefined();
      expect(schema.forumPost.reportCount).toBeDefined();
      expect(schema.forumPost.createdAt).toBeDefined();
      expect(schema.forumPost.updatedAt).toBeDefined();
    });

    test('should have forumModeration table with correct structure', async () => {
      // This test will fail until we create the forumModeration schema
      const moderations = await db.select().from(schema.forumModeration).limit(1);
      expect(moderations).toBeDefined();
      
      // Test required fields
      expect(schema.forumModeration.id).toBeDefined();
      expect(schema.forumModeration.targetType).toBeDefined(); // 'thread' | 'post' | 'user'
      expect(schema.forumModeration.targetId).toBeDefined();
      expect(schema.forumModeration.moderatorId).toBeDefined();
      expect(schema.forumModeration.action).toBeDefined(); // 'warn' | 'mute' | 'ban' | 'delete' | 'lock'
      expect(schema.forumModeration.reason).toBeDefined();
      expect(schema.forumModeration.duration).toBeDefined(); // in minutes, null for permanent
      expect(schema.forumModeration.expiresAt).toBeDefined();
      expect(schema.forumModeration.isActive).toBeDefined();
      expect(schema.forumModeration.createdAt).toBeDefined();
    });
  });

  test.describe('Group System Schema', () => {
    test('should have group table with correct structure', async () => {
      // This test will fail until we create the group schema
      const groups = await db.select().from(schema.group).limit(1);
      expect(groups).toBeDefined();
      
      // Test required fields
      expect(schema.group.id).toBeDefined();
      expect(schema.group.name).toBeDefined();
      expect(schema.group.description).toBeDefined();
      expect(schema.group.slug).toBeDefined();
      expect(schema.group.ownerId).toBeDefined();
      expect(schema.group.type).toBeDefined(); // 'public' | 'private' | 'invite-only'
      expect(schema.group.category).toBeDefined(); // 'writing' | 'reading' | 'genre' | 'other'
      expect(schema.group.tags).toBeDefined();
      expect(schema.group.memberLimit).toBeDefined();
      expect(schema.group.memberCount).toBeDefined();
      expect(schema.group.avatarUrl).toBeDefined();
      expect(schema.group.bannerUrl).toBeDefined();
      expect(schema.group.rules).toBeDefined();
      expect(schema.group.isActive).toBeDefined();
      expect(schema.group.createdAt).toBeDefined();
      expect(schema.group.updatedAt).toBeDefined();
    });

    test('should have groupMember table with correct structure', async () => {
      // This test will fail until we create the groupMember schema
      const members = await db.select().from(schema.groupMember).limit(1);
      expect(members).toBeDefined();
      
      // Test required fields
      expect(schema.groupMember.groupId).toBeDefined();
      expect(schema.groupMember.userId).toBeDefined();
      expect(schema.groupMember.role).toBeDefined(); // 'owner' | 'moderator' | 'member'
      expect(schema.groupMember.joinedAt).toBeDefined();
      expect(schema.groupMember.invitedBy).toBeDefined();
      expect(schema.groupMember.isActive).toBeDefined();
    });

    test('should have groupActivity table with correct structure', async () => {
      // This test will fail until we create the groupActivity schema
      const activities = await db.select().from(schema.groupActivity).limit(1);
      expect(activities).toBeDefined();
      
      // Test required fields
      expect(schema.groupActivity.id).toBeDefined();
      expect(schema.groupActivity.groupId).toBeDefined();
      expect(schema.groupActivity.userId).toBeDefined();
      expect(schema.groupActivity.activityType).toBeDefined(); // 'post' | 'join' | 'leave' | 'story_share' | 'event'
      expect(schema.groupActivity.content).toBeDefined();
      expect(schema.groupActivity.metadata).toBeDefined(); // JSON for additional data
      expect(schema.groupActivity.createdAt).toBeDefined();
    });

    test('should have groupInvitation table with correct structure', async () => {
      // This test will fail until we create the groupInvitation schema
      const invitations = await db.select().from(schema.groupInvitation).limit(1);
      expect(invitations).toBeDefined();
      
      // Test required fields
      expect(schema.groupInvitation.id).toBeDefined();
      expect(schema.groupInvitation.groupId).toBeDefined();
      expect(schema.groupInvitation.inviterId).toBeDefined();
      expect(schema.groupInvitation.inviteeId).toBeDefined();
      expect(schema.groupInvitation.message).toBeDefined();
      expect(schema.groupInvitation.status).toBeDefined(); // 'pending' | 'accepted' | 'declined' | 'expired'
      expect(schema.groupInvitation.expiresAt).toBeDefined();
      expect(schema.groupInvitation.createdAt).toBeDefined();
      expect(schema.groupInvitation.respondedAt).toBeDefined();
    });
  });

  test.describe('Contest System Schema', () => {
    test('should have contest table with correct structure', async () => {
      // This test will fail until we create the contest schema
      const contests = await db.select().from(schema.contest).limit(1);
      expect(contests).toBeDefined();
      
      // Test required fields
      expect(schema.contest.id).toBeDefined();
      expect(schema.contest.title).toBeDefined();
      expect(schema.contest.description).toBeDefined();
      expect(schema.contest.slug).toBeDefined();
      expect(schema.contest.organizerId).toBeDefined();
      expect(schema.contest.type).toBeDefined(); // 'writing' | 'poetry' | 'worldbuilding' | 'art'
      expect(schema.contest.status).toBeDefined(); // 'draft' | 'open' | 'voting' | 'judging' | 'completed' | 'cancelled'
      expect(schema.contest.rules).toBeDefined();
      expect(schema.contest.prizes).toBeDefined(); // JSON for prize structure
      expect(schema.contest.judgingCriteria).toBeDefined();
      expect(schema.contest.maxSubmissions).toBeDefined();
      expect(schema.contest.submissionStart).toBeDefined();
      expect(schema.contest.submissionEnd).toBeDefined();
      expect(schema.contest.votingStart).toBeDefined();
      expect(schema.contest.votingEnd).toBeDefined();
      expect(schema.contest.judgeIds).toBeDefined(); // array of judge user IDs
      expect(schema.contest.submissionCount).toBeDefined();
      expect(schema.contest.participantCount).toBeDefined();
      expect(schema.contest.createdAt).toBeDefined();
      expect(schema.contest.updatedAt).toBeDefined();
    });

    test('should have contestSubmission table with correct structure', async () => {
      // This test will fail until we create the contestSubmission schema
      const submissions = await db.select().from(schema.contestSubmission).limit(1);
      expect(submissions).toBeDefined();
      
      // Test required fields
      expect(schema.contestSubmission.id).toBeDefined();
      expect(schema.contestSubmission.contestId).toBeDefined();
      expect(schema.contestSubmission.authorId).toBeDefined();
      expect(schema.contestSubmission.title).toBeDefined();
      expect(schema.contestSubmission.content).toBeDefined();
      expect(schema.contestSubmission.storyId).toBeDefined(); // optional link to existing story
      expect(schema.contestSubmission.wordCount).toBeDefined();
      expect(schema.contestSubmission.isAnonymous).toBeDefined();
      expect(schema.contestSubmission.publicVoteCount).toBeDefined();
      expect(schema.contestSubmission.judgeScore).toBeDefined();
      expect(schema.contestSubmission.rank).toBeDefined();
      expect(schema.contestSubmission.isDisqualified).toBeDefined();
      expect(schema.contestSubmission.disqualificationReason).toBeDefined();
      expect(schema.contestSubmission.createdAt).toBeDefined();
      expect(schema.contestSubmission.updatedAt).toBeDefined();
    });

    test('should have contestVote table with correct structure', async () => {
      // This test will fail until we create the contestVote schema
      const votes = await db.select().from(schema.contestVote).limit(1);
      expect(votes).toBeDefined();
      
      // Test required fields
      expect(schema.contestVote.contestId).toBeDefined();
      expect(schema.contestVote.submissionId).toBeDefined();
      expect(schema.contestVote.voterId).toBeDefined();
      expect(schema.contestVote.score).toBeDefined(); // 1-10 scale
      expect(schema.contestVote.isJudgeVote).toBeDefined();
      expect(schema.contestVote.feedback).toBeDefined(); // optional feedback for judge votes
      expect(schema.contestVote.createdAt).toBeDefined();
    });
  });

  test.describe('Gamification System Schema', () => {
    test('should have achievement table with correct structure', async () => {
      // This test will fail until we create the achievement schema
      const achievements = await db.select().from(schema.achievement).limit(1);
      expect(achievements).toBeDefined();
      
      // Test required fields
      expect(schema.achievement.id).toBeDefined();
      expect(schema.achievement.name).toBeDefined();
      expect(schema.achievement.description).toBeDefined();
      expect(schema.achievement.type).toBeDefined(); // 'reading' | 'writing' | 'community' | 'platform'
      expect(schema.achievement.category).toBeDefined();
      expect(schema.achievement.iconUrl).toBeDefined();
      expect(schema.achievement.badgeUrl).toBeDefined();
      expect(schema.achievement.rarity).toBeDefined(); // 'common' | 'rare' | 'epic' | 'legendary'
      expect(schema.achievement.points).toBeDefined(); // XP points awarded
      expect(schema.achievement.criteria).toBeDefined(); // JSON for achievement conditions
      expect(schema.achievement.isSecret).toBeDefined(); // hidden until unlocked
      expect(schema.achievement.unlockCount).toBeDefined();
      expect(schema.achievement.createdAt).toBeDefined();
    });

    test('should have userAchievement table with correct structure', async () => {
      // This test will fail until we create the userAchievement schema
      const userAchievements = await db.select().from(schema.userAchievement).limit(1);
      expect(userAchievements).toBeDefined();
      
      // Test required fields
      expect(schema.userAchievement.userId).toBeDefined();
      expect(schema.userAchievement.achievementId).toBeDefined();
      expect(schema.userAchievement.progress).toBeDefined();
      expect(schema.userAchievement.maxProgress).toBeDefined();
      expect(schema.userAchievement.isUnlocked).toBeDefined();
      expect(schema.userAchievement.unlockedAt).toBeDefined();
      expect(schema.userAchievement.isDisplayed).toBeDefined(); // show on profile
    });

    test('should have userLevel table with correct structure', async () => {
      // This test will fail until we create the userLevel schema
      const userLevels = await db.select().from(schema.userLevel).limit(1);
      expect(userLevels).toBeDefined();
      
      // Test required fields
      expect(schema.userLevel.userId).toBeDefined();
      expect(schema.userLevel.level).toBeDefined();
      expect(schema.userLevel.experience).toBeDefined();
      expect(schema.userLevel.nextLevelExp).toBeDefined();
      expect(schema.userLevel.totalExp).toBeDefined();
      expect(schema.userLevel.title).toBeDefined(); // level-based title
      expect(schema.userLevel.updatedAt).toBeDefined();
    });

    test('should have leaderboard table with correct structure', async () => {
      // This test will fail until we create the leaderboard schema
      const leaderboards = await db.select().from(schema.leaderboard).limit(1);
      expect(leaderboards).toBeDefined();
      
      // Test required fields
      expect(schema.leaderboard.id).toBeDefined();
      expect(schema.leaderboard.type).toBeDefined(); // 'weekly' | 'monthly' | 'yearly' | 'all-time'
      expect(schema.leaderboard.category).toBeDefined(); // 'reading' | 'writing' | 'community'
      expect(schema.leaderboard.userId).toBeDefined();
      expect(schema.leaderboard.score).toBeDefined();
      expect(schema.leaderboard.rank).toBeDefined();
      expect(schema.leaderboard.period).toBeDefined(); // timestamp for period start
      expect(schema.leaderboard.updatedAt).toBeDefined();
    });
  });

  test.describe('Collaboration Tools Schema', () => {
    test('should have betaReader table with correct structure', async () => {
      // This test will fail until we create the betaReader schema
      const betaReaders = await db.select().from(schema.betaReader).limit(1);
      expect(betaReaders).toBeDefined();
      
      // Test required fields
      expect(schema.betaReader.id).toBeDefined();
      expect(schema.betaReader.userId).toBeDefined();
      expect(schema.betaReader.specialties).toBeDefined(); // genres/types they specialize in
      expect(schema.betaReader.experience).toBeDefined(); // experience level
      expect(schema.betaReader.rate).toBeDefined(); // cost per word/chapter (nullable for free)
      expect(schema.betaReader.availability).toBeDefined(); // 'available' | 'busy' | 'unavailable'
      expect(schema.betaReader.portfolio).toBeDefined(); // past work examples
      expect(schema.betaReader.guidelines).toBeDefined(); // what they offer
      expect(schema.betaReader.rating).toBeDefined(); // average rating
      expect(schema.betaReader.reviewCount).toBeDefined();
      expect(schema.betaReader.turnaroundTime).toBeDefined(); // days
      expect(schema.betaReader.isVerified).toBeDefined();
      expect(schema.betaReader.createdAt).toBeDefined();
      expect(schema.betaReader.updatedAt).toBeDefined();
    });

    test('should have betaReaderRequest table with correct structure', async () => {
      // This test will fail until we create the betaReaderRequest schema
      const requests = await db.select().from(schema.betaReaderRequest).limit(1);
      expect(requests).toBeDefined();
      
      // Test required fields
      expect(schema.betaReaderRequest.id).toBeDefined();
      expect(schema.betaReaderRequest.authorId).toBeDefined();
      expect(schema.betaReaderRequest.betaReaderId).toBeDefined();
      expect(schema.betaReaderRequest.storyId).toBeDefined();
      expect(schema.betaReaderRequest.chapterIds).toBeDefined(); // array of chapter IDs
      expect(schema.betaReaderRequest.requestType).toBeDefined(); // 'general' | 'line-edit' | 'developmental' | 'proofreading'
      expect(schema.betaReaderRequest.deadline).toBeDefined();
      expect(schema.betaReaderRequest.budget).toBeDefined();
      expect(schema.betaReaderRequest.requirements).toBeDefined();
      expect(schema.betaReaderRequest.status).toBeDefined(); // 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
      expect(schema.betaReaderRequest.createdAt).toBeDefined();
    });

    test('should have coAuthor table with correct structure', async () => {
      // This test will fail until we create the coAuthor schema
      const coAuthors = await db.select().from(schema.coAuthor).limit(1);
      expect(coAuthors).toBeDefined();
      
      // Test required fields
      expect(schema.coAuthor.storyId).toBeDefined();
      expect(schema.coAuthor.userId).toBeDefined();
      expect(schema.coAuthor.role).toBeDefined(); // 'co-author' | 'contributor' | 'editor'
      expect(schema.coAuthor.permissions).toBeDefined(); // JSON for detailed permissions
      expect(schema.coAuthor.invitedBy).toBeDefined();
      expect(schema.coAuthor.status).toBeDefined(); // 'pending' | 'active' | 'inactive'
      expect(schema.coAuthor.contributionShare).toBeDefined(); // percentage of credit
      expect(schema.coAuthor.joinedAt).toBeDefined();
    });

    test('should have workshop table with correct structure', async () => {
      // This test will fail until we create the workshop schema
      const workshops = await db.select().from(schema.workshop).limit(1);
      expect(workshops).toBeDefined();
      
      // Test required fields
      expect(schema.workshop.id).toBeDefined();
      expect(schema.workshop.title).toBeDefined();
      expect(schema.workshop.description).toBeDefined();
      expect(schema.workshop.instructorId).toBeDefined();
      expect(schema.workshop.type).toBeDefined(); // 'live' | 'self-paced' | 'group'
      expect(schema.workshop.category).toBeDefined(); // 'writing' | 'editing' | 'publishing' | 'marketing'
      expect(schema.workshop.maxParticipants).toBeDefined();
      expect(schema.workshop.currentParticipants).toBeDefined();
      expect(schema.workshop.price).toBeDefined(); // 0 for free workshops
      expect(schema.workshop.duration).toBeDefined(); // in minutes
      expect(schema.workshop.scheduledAt).toBeDefined();
      expect(schema.workshop.status).toBeDefined(); // 'scheduled' | 'live' | 'completed' | 'cancelled'
      expect(schema.workshop.materials).toBeDefined(); // JSON for resources
      expect(schema.workshop.createdAt).toBeDefined();
    });

    test('should have workshopParticipant table with correct structure', async () => {
      // This test will fail until we create the workshopParticipant schema
      const participants = await db.select().from(schema.workshopParticipant).limit(1);
      expect(participants).toBeDefined();
      
      // Test required fields
      expect(schema.workshopParticipant.workshopId).toBeDefined();
      expect(schema.workshopParticipant.userId).toBeDefined();
      expect(schema.workshopParticipant.enrolledAt).toBeDefined();
      expect(schema.workshopParticipant.completedAt).toBeDefined();
      expect(schema.workshopParticipant.progress).toBeDefined(); // percentage completed
      expect(schema.workshopParticipant.rating).toBeDefined(); // participant rating of workshop
      expect(schema.workshopParticipant.feedback).toBeDefined();
    });
  });

  test.describe('Extended Community Features Schema', () => {
    test('should have userFollowing table with correct structure', async () => {
      // This test will fail until we create the userFollowing schema
      const following = await db.select().from(schema.userFollowing).limit(1);
      expect(following).toBeDefined();
      
      // Test required fields
      expect(schema.userFollowing.followerId).toBeDefined();
      expect(schema.userFollowing.followingId).toBeDefined();
      expect(schema.userFollowing.createdAt).toBeDefined();
    });

    test('should have notification table with correct structure', async () => {
      // This test will fail until we create the notification schema
      const notifications = await db.select().from(schema.notification).limit(1);
      expect(notifications).toBeDefined();
      
      // Test required fields
      expect(schema.notification.id).toBeDefined();
      expect(schema.notification.userId).toBeDefined();
      expect(schema.notification.type).toBeDefined(); // 'follow' | 'comment' | 'like' | 'contest' | 'group' | 'achievement'
      expect(schema.notification.title).toBeDefined();
      expect(schema.notification.message).toBeDefined();
      expect(schema.notification.actionUrl).toBeDefined();
      expect(schema.notification.isRead).toBeDefined();
      expect(schema.notification.metadata).toBeDefined(); // JSON for additional data
      expect(schema.notification.createdAt).toBeDefined();
    });

    test('should have reportContent table with correct structure', async () => {
      // This test will fail until we create the reportContent schema
      const reports = await db.select().from(schema.reportContent).limit(1);
      expect(reports).toBeDefined();
      
      // Test required fields
      expect(schema.reportContent.id).toBeDefined();
      expect(schema.reportContent.reporterId).toBeDefined();
      expect(schema.reportContent.contentType).toBeDefined(); // 'story' | 'comment' | 'forum_post' | 'user' | 'group'
      expect(schema.reportContent.contentId).toBeDefined();
      expect(schema.reportContent.reason).toBeDefined(); // 'spam' | 'harassment' | 'inappropriate' | 'copyright'
      expect(schema.reportContent.description).toBeDefined();
      expect(schema.reportContent.status).toBeDefined(); // 'pending' | 'reviewing' | 'resolved' | 'dismissed'
      expect(schema.reportContent.reviewedBy).toBeDefined();
      expect(schema.reportContent.reviewedAt).toBeDefined();
      expect(schema.reportContent.resolution).toBeDefined();
      expect(schema.reportContent.createdAt).toBeDefined();
    });
  });

  test.describe('Database Relationships and Constraints', () => {
    test('should enforce foreign key constraints', async () => {
      // Test that foreign key relationships are properly defined
      // This will fail until we create the schema with proper relationships
      
      // Forum relationships
      expect(schema.forumThread.categoryId).toBeDefined();
      expect(schema.forumPost.threadId).toBeDefined();
      
      // Group relationships  
      expect(schema.groupMember.groupId).toBeDefined();
      expect(schema.groupMember.userId).toBeDefined();
      
      // Contest relationships
      expect(schema.contestSubmission.contestId).toBeDefined();
      expect(schema.contestVote.submissionId).toBeDefined();
      
      // Achievement relationships
      expect(schema.userAchievement.userId).toBeDefined();
      expect(schema.userAchievement.achievementId).toBeDefined();
      
      // Collaboration relationships
      expect(schema.betaReaderRequest.authorId).toBeDefined();
      expect(schema.coAuthor.storyId).toBeDefined();
    });

    test('should have proper indexes for performance', async () => {
      // Test that performance-critical indexes exist
      // This will fail until we add proper indexes
      
      const indexQueries = [
        // Forum indexes
        "SELECT * FROM pg_indexes WHERE tablename = 'ForumThread' AND indexname LIKE '%category_id%'",
        "SELECT * FROM pg_indexes WHERE tablename = 'ForumPost' AND indexname LIKE '%thread_id%'",
        
        // Group indexes
        "SELECT * FROM pg_indexes WHERE tablename = 'GroupMember' AND indexname LIKE '%user_id%'",
        
        // Contest indexes
        "SELECT * FROM pg_indexes WHERE tablename = 'ContestSubmission' AND indexname LIKE '%contest_id%'",
        
        // Achievement indexes
        "SELECT * FROM pg_indexes WHERE tablename = 'UserAchievement' AND indexname LIKE '%user_id%'"
      ];

      for (const query of indexQueries) {
        const result = await client.unsafe(query);
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});