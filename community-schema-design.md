# Fictures Community Implementation: Database Schema Design

## 🎯 Overview
Comprehensive community system for Fictures that builds on existing tables and adds social features, forums, collaboration tools, and engagement systems.

## 📊 Existing Foundation
- `users` - User profiles with roles and basic stats
- `stories` - Stories with viewCount, rating, ratingCount
- `userStats` - Gamification (level, experience, streak)

## 🏗️ New Community Tables

### 1. Social Interactions & Engagement

```sql
-- Story reactions (likes, bookmarks, favorites)
CREATE TABLE story_reactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL, -- 'like', 'bookmark', 'favorite', 'recommend'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, story_id, reaction_type)
);

-- Chapter reactions (likes, bookmarks on specific chapters)
CREATE TABLE chapter_reactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL, -- 'like', 'bookmark', 'highlight'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  metadata JSON, -- For highlights: position, text, note
  UNIQUE(user_id, chapter_id, reaction_type)
);

-- Comments on stories and chapters
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
  target_type VARCHAR(20) NOT NULL, -- 'story', 'chapter', 'scene'
  target_id TEXT NOT NULL, -- story_id, chapter_id, or scene_id
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  spoiler_warning TEXT,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Comment likes/reactions
CREATE TABLE comment_reactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'like', -- 'like', 'helpful', 'insightful'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, comment_id, reaction_type)
);

-- User following system
CREATE TABLE user_follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Story follows/subscriptions
CREATE TABLE story_follows (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  last_read_chapter_id TEXT REFERENCES chapters(id),
  reading_progress JSON, -- chapter progress, bookmarks, notes
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, story_id)
);
```

### 2. Community Forums & Discussions

```sql
-- Forum categories
CREATE TABLE forum_categories (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code
  icon VARCHAR(50), -- Icon class/emoji
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  moderator_ids JSON DEFAULT '[]', -- Array of user IDs
  post_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Forum threads/topics
CREATE TABLE forum_threads (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_solved BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 1,
  last_post_id TEXT,
  last_post_at TIMESTAMP DEFAULT NOW() NOT NULL,
  tags JSON DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Forum posts within threads
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_number INTEGER NOT NULL, -- Sequential within thread
  like_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT FALSE, -- Mark as accepted solution
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 3. Writing Groups & Communities

```sql
-- Writing groups/circles
CREATE TABLE writing_groups (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'general', -- 'general', 'genre', 'critique', 'challenge'
  privacy VARCHAR(20) DEFAULT 'public', -- 'public', 'private', 'invite_only'
  max_members INTEGER DEFAULT 100,
  member_count INTEGER DEFAULT 1,
  owner_id TEXT NOT NULL REFERENCES users(id),
  cover_image TEXT,
  rules TEXT,
  tags JSON DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Group memberships with roles
CREATE TABLE group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES writing_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'owner', 'moderator', 'member'
  join_request_status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  notification_enabled BOOLEAN DEFAULT TRUE,
  contribution_score INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Posts within writing groups
CREATE TABLE group_posts (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES writing_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'discussion', -- 'discussion', 'feedback_request', 'challenge', 'announcement'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id), -- If related to a story
  chapter_id TEXT REFERENCES chapters(id), -- If related to specific chapter
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 4. Beta Reading & Collaboration

```sql
-- Beta reading requests
CREATE TABLE beta_reading_requests (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  genre VARCHAR(100),
  word_count INTEGER,
  deadline TIMESTAMP,
  feedback_type VARCHAR(50), -- 'developmental', 'copy_editing', 'proofreading', 'general'
  experience_level VARCHAR(20), -- 'beginner', 'intermediate', 'experienced', 'any'
  compensation VARCHAR(100), -- 'exchange', 'paid', 'volunteer'
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  max_beta_readers INTEGER DEFAULT 3,
  current_beta_readers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Beta reader applications/assignments
CREATE TABLE beta_reading_assignments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES beta_reading_requests(id) ON DELETE CASCADE,
  beta_reader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
  message TEXT,
  feedback TEXT,
  rating INTEGER, -- 1-5 rating from author
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(request_id, beta_reader_id)
);
```

### 5. Writing Contests & Challenges

```sql
-- Writing contests
CREATE TABLE writing_contests (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  theme VARCHAR(255),
  rules TEXT,
  host_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(20) DEFAULT 'general', -- 'general', 'prompt', 'flash_fiction', 'poetry'
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'active', 'judging', 'completed', 'cancelled'
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  word_limit INTEGER,
  entry_fee INTEGER DEFAULT 0, -- In points/tokens if applicable
  prize_description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  voting_end_date TIMESTAMP,
  winner_announced_date TIMESTAMP,
  cover_image TEXT,
  tags JSON DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contest submissions
CREATE TABLE contest_submissions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES writing_contests(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id), -- If submitting existing story
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  vote_count INTEGER DEFAULT 0,
  score REAL DEFAULT 0.0,
  is_winner BOOLEAN DEFAULT FALSE,
  placement INTEGER, -- 1st, 2nd, 3rd place
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(contest_id, participant_id)
);

-- Contest voting
CREATE TABLE contest_votes (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES writing_contests(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES contest_submissions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(contest_id, submission_id, voter_id)
);
```

### 6. Notifications & Activity Feed

```sql
-- Comprehensive notification system
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'comment', 'like', 'follow', 'mention', 'chapter_published', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- URL to navigate when clicked
  actor_id TEXT REFERENCES users(id), -- User who triggered the notification
  target_type VARCHAR(20), -- 'story', 'chapter', 'comment', 'user'
  target_id TEXT, -- ID of the target entity
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  metadata JSON, -- Additional contextual data
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Activity feed for community updates
CREATE TABLE activity_feed (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'story_published', 'chapter_published', 'joined_group', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_type VARCHAR(20),
  target_id TEXT,
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'followers', 'private'
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 7. Content Moderation & Reporting

```sql
-- Content reports
CREATE TABLE content_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL, -- 'story', 'chapter', 'comment', 'user', 'forum_post'
  target_id TEXT NOT NULL,
  reason VARCHAR(50) NOT NULL, -- 'spam', 'inappropriate', 'plagiarism', 'harassment', 'other'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  moderator_id TEXT REFERENCES users(id),
  moderator_notes TEXT,
  action_taken VARCHAR(100), -- Description of action taken
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Content moderation actions
CREATE TABLE moderation_actions (
  id TEXT PRIMARY KEY,
  moderator_id TEXT NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL,
  target_id TEXT NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'warn', 'hide', 'delete', 'ban', 'mute'
  reason TEXT NOT NULL,
  duration INTEGER, -- Duration in hours for temporary actions
  is_permanent BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 🎯 Social Action Buttons Integration

### Reading Page Enhancements

```typescript
// Social action component for chapters
interface ChapterSocialActions {
  chapterId: string;
  userReactions: {
    hasLiked: boolean;
    hasBookmarked: boolean;
    hasHighlighted: boolean;
  };
  counts: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  readingProgress: {
    currentPosition: number;
    totalWords: number;
    timeSpent: number;
  };
}

// Social buttons to add to reading interface:
// 1. ❤️ Like Chapter (quick appreciation)
// 2. 💬 Comment (discuss specific parts)  
// 3. 🔖 Bookmark (save for later/reference)
// 4. 📤 Share (social sharing)
// 5. ⭐ Rate Chapter (1-5 stars)
// 6. 🎯 Highlight Text (with notes)
// 7. 👥 Recommend to Friends
```

### Enhanced Story Cards

```typescript
// Additional stats to show on story cards
interface EnhancedStoryStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  followerCount: number; // People following the story
  readerRetention: number; // % who continue reading
  averageRating: number;
  totalRatings: number;
  lastUpdated: Date;
  updateFrequency: string; // "Weekly", "Daily", etc.
  communityActivity: {
    recentComments: number;
    activeDiscussions: number;
    fanArt: number;
  };
}
```

## 📊 Community Hub Dashboard

### Main Community Page Features

```typescript
interface CommunityHubData {
  trendingStories: {
    daily: Story[];
    weekly: Story[];
    monthly: Story[];
  };
  
  activeDiscussions: {
    forumThreads: ForumThread[];
    storyComments: Comment[];
    groupPosts: GroupPost[];
  };
  
  communityStats: {
    totalMembers: number;
    activeWriters: number;
    storiesPublished: number;
    wordsWritten: number;
    commentsPosted: number;
  };
  
  featuredContent: {
    writerSpotlight: User;
    storyOfTheWeek: Story;
    contestHighlights: Contest[];
    communityProjects: Project[];
  };
  
  userActivity: {
    recentFollows: UserFollow[];
    friendUpdates: Activity[];
    personalizedRecommendations: Story[];
    readingList: Story[];
  };
  
  leaderboards: {
    topWriters: WriterStats[];
    mostActiveReaders: ReaderStats[];
    helpfulCommunityMembers: CommunityStats[];
    risingStars: User[];
  };
  
  upcomingEvents: {
    contests: Contest[];
    communityMeetups: Event[];
    authorReadings: Event[];
    workshopSessions: Event[];
  };
}
```

### Community Analytics Dashboard

```sql
-- Views for community statistics
CREATE VIEW community_engagement_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as likes,
  COUNT(CASE WHEN reaction_type = 'comment' THEN 1 END) as comments,
  COUNT(CASE WHEN reaction_type = 'bookmark' THEN 1 END) as bookmarks
FROM (
  SELECT user_id, 'like' as reaction_type, created_at FROM story_reactions WHERE reaction_type = 'like'
  UNION ALL
  SELECT user_id, 'comment' as reaction_type, created_at FROM comments
  UNION ALL
  SELECT user_id, 'bookmark' as reaction_type, created_at FROM story_reactions WHERE reaction_type = 'bookmark'
) combined_activity
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Most engaged stories view
CREATE VIEW trending_stories AS
SELECT 
  s.id,
  s.title,
  s.author_id,
  u.name as author_name,
  s.view_count,
  COUNT(DISTINCT sr.id) as reaction_count,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT sf.id) as follower_count,
  (s.view_count * 0.1 + COUNT(DISTINCT sr.id) * 2 + COUNT(DISTINCT c.id) * 3) as engagement_score
FROM stories s
LEFT JOIN users u ON s.author_id = u.id
LEFT JOIN story_reactions sr ON s.id = sr.story_id
LEFT JOIN comments c ON s.id = c.target_id AND c.target_type = 'story'
LEFT JOIN story_follows sf ON s.id = sf.story_id
WHERE s.is_public = true AND s.status = 'active'
GROUP BY s.id, s.title, s.author_id, u.name, s.view_count
ORDER BY engagement_score DESC;
```

## 🚀 Implementation Phases

### Phase 1: Core Social Features (Week 1-2)
- Story/chapter reactions (likes, bookmarks)
- Basic commenting system
- User following
- Reading progress tracking

### Phase 2: Community Discussions (Week 3-4)  
- Forum categories and threads
- Writing groups
- Enhanced notifications

### Phase 3: Collaboration Tools (Week 5-6)
- Beta reading system
- Writing contests
- Content moderation

### Phase 4: Advanced Features (Week 7-8)
- Activity feeds
- Advanced analytics
- Gamification enhancements
- Mobile social features

## 🎨 UI/UX Integration Points

### Reading Interface
- Floating action buttons for social interactions
- Comment threads attached to specific paragraphs
- Progress sharing and milestone celebrations
- Reader discussion panels

### Community Hub
- Activity timeline with rich media
- Trending content carousels  
- Interactive leaderboards
- Event calendar integration

### Writer Dashboard
- Community engagement metrics
- Reader feedback aggregation
- Collaboration request management
- Social growth tracking

This comprehensive system transforms Fictures from a writing tool into a thriving literary community platform! 🎭📚✨