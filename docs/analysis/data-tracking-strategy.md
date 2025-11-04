# Data Tracking & Visualization Strategy

This document provides an in-depth analysis of how Fictures tracks daily data, aggregates analytics, and presents insights to writers through intuitive visualizations.

## Table of Contents
1. [Data Tracking Philosophy](#data-tracking-philosophy)
2. [What Data to Track](#what-data-to-track)
3. [How to Track Data](#how-to-track-data)
4. [Daily Aggregation Strategy](#daily-aggregation-strategy)
5. [Visualization Strategy](#visualization-strategy)
6. [UI/UX Design Principles](#uiux-design-principles)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Data Tracking Philosophy

### Core Principles

**1. Writer-Centric Analytics**
- **Purpose**: Help writers understand their audience and improve their craft
- **Not**: Surveillance or invasive tracking
- **Focus**: Actionable insights, not vanity metrics

**2. Privacy-Respecting**
- **Anonymous Readers**: Track behavior without identifying individuals
- **Session-Based**: Use temporary session IDs, not persistent tracking
- **Opt-Out**: Readers can disable tracking (respects Do Not Track headers)

**3. Real-Time with Historical Context**
- **Immediate Feedback**: Writers see results of recent changes quickly
- **Long-Term Trends**: Historical data shows patterns over weeks/months
- **Comparative Analysis**: Week-over-week, month-over-month comparisons

**4. Actionable, Not Overwhelming**
- **Signal vs. Noise**: Focus on metrics that drive decisions
- **AI-Powered Insights**: Surface the most important findings
- **Clear Next Steps**: Every metric comes with recommended actions

---

## What Data to Track

### 1. Reader Discovery (Reach Metrics)

**Story Views**
- **What**: Each time a reader lands on a story page
- **Why**: Measures story visibility and marketing effectiveness
- **Track**: `story_view` event with `storyId`
- **Metadata**: Referrer source (community, search, direct link)

**Chapter Views**
- **What**: Each time a reader opens a chapter
- **Why**: Shows which chapters attract/retain readers
- **Track**: `chapter_read_start` event with `chapterId`
- **Metadata**: Previous chapter (to track progression)

**Scene Views**
- **What**: Each time a reader scrolls to a scene
- **Why**: Micro-level engagement tracking
- **Track**: `scene_read` event with `sceneId`
- **Metadata**: Scroll depth, time spent on scene

**Unique Readers**
- **What**: Count distinct users (by session ID)
- **Why**: True audience size vs. repeated views
- **Track**: Deduplicate by `userId` or `sessionId`

### 2. Reader Engagement (Interaction Metrics)

**Comments**
- **What**: Reader leaves a comment on a scene/chapter
- **Why**: Shows content that sparks conversation
- **Track**: `comment_created` event with `sceneId`
- **Metadata**: Comment length, sentiment (if analyzed)

**Likes/Reactions**
- **What**: Reader likes a story, chapter, or comment
- **Why**: Quick feedback on content quality
- **Track**: `story_liked`, `chapter_liked`, `comment_liked` events
- **Metadata**: Reaction type (if multiple reactions supported)

**Shares**
- **What**: Reader shares story on social media or copies link
- **Why**: Measures viral potential and word-of-mouth
- **Track**: `share` event with `storyId`, `platform` (Twitter, Facebook, etc.)

**Bookmarks**
- **What**: Reader saves story to "Read Later" list
- **Why**: Intent to return (high-quality signal)
- **Track**: `bookmark` event with `storyId`

**Engagement Rate**
- **What**: (Comments + Likes + Shares) / Views × 100
- **Why**: Normalized engagement across different audience sizes
- **Calculate**: Derived metric from above events

### 3. Reader Retention (Loyalty Metrics)

**Reading Sessions**
- **What**: Continuous reading period (start to end)
- **Why**: Measures content "stickiness" and binge-reading
- **Track**: Create `reading_session` record on first chapter read, update on each chapter progression, close on tab close/timeout
- **Metadata**: Duration, chapters read, completion status

**Return Rate**
- **What**: % of readers who come back within 7 days
- **Why**: Shows story memorability and addictiveness
- **Calculate**: Readers with 2+ sessions in 7-day window / Total readers

**Completion Rate**
- **What**: % of readers who reach the last chapter
- **Why**: Indicates story quality and pacing effectiveness
- **Track**: `reading_session` with `completedStory = true`
- **Calculate**: Sessions with completion / Total sessions

**Average Session Duration**
- **What**: How long readers stay engaged per visit
- **Why**: Longer sessions = more engaging content
- **Track**: `end_time - start_time` in `reading_sessions`

**Chapters per Session**
- **What**: How many chapters readers consume in one sitting
- **Why**: Measures binge-worthiness and chapter length appropriateness
- **Track**: Count chapters read during each session

### 4. Content Quality (Writing Metrics)

**Scene Evaluation Scores**
- **What**: AI-evaluated quality scores (1-4 scale, 5 categories)
- **Why**: Objective quality assessment for improvement
- **Track**: Already exists in `scene_evaluations` table
- **Categories**: Plot, Character, Pacing, Prose, World-Building

**Average Quality Score**
- **What**: Mean score across all scenes in a story
- **Why**: Overall story quality benchmark
- **Calculate**: AVG(plotScore + characterScore + pacingScore + proseScore + worldBuildingScore) / 5

**Quality Distribution**
- **What**: How many scenes fall into each quality tier
- **Why**: Identify weak spots vs. strong areas
- **Tiers**: Excellent (≥ 3.5), Good (3.0-3.4), Fair (2.5-2.9), Needs Work (< 2.5)

**Improvement Over Time**
- **What**: Quality score trend across chapters (chronological)
- **Why**: Shows writing improvement (or decline)
- **Calculate**: Compare early chapters vs. later chapters

### 5. Reader Behavior Patterns

**Peak Reading Times**
- **What**: What hours/days readers are most active
- **Why**: Optimize publishing schedule for maximum engagement
- **Track**: Aggregate event timestamps by hour/day of week
- **Visualize**: Heatmap showing activity by day/hour

**Device Distribution**
- **What**: Mobile vs. Desktop vs. Tablet usage
- **Why**: Optimize formatting and layout for primary devices
- **Track**: `metadata.deviceType` from user agent

**Reading Speed**
- **What**: Average words per minute
- **Why**: Guides optimal scene length and pacing
- **Calculate**: Word count / (session duration / 60)

**Drop-Off Points**
- **What**: Chapters/scenes where readers stop reading
- **Why**: Identifies pacing issues or confusing content
- **Track**: Last chapter/scene read in incomplete sessions
- **Visualize**: Funnel chart showing reader progression

---

## How to Track Data

### Event-Based Architecture

**Client-Side Tracking** (Browser)
```typescript
// Example: Track story view
useEffect(() => {
  trackEvent({
    eventType: 'story_view',
    storyId: story.id,
    metadata: {
      referrer: document.referrer,
      deviceType: isMobile ? 'mobile' : 'desktop',
      screenWidth: window.innerWidth,
    }
  });
}, [story.id]);
```

**Server-Side Tracking** (API)
```typescript
// Example: Track comment creation
await trackEvent({
  eventType: 'comment_created',
  userId: session.user.id,
  storyId: comment.storyId,
  sceneId: comment.sceneId,
  metadata: {
    commentLength: comment.content.length,
  }
});
```

### Session Management

**Session ID Generation**
```typescript
// Generate unique session ID per browser session
let sessionId = sessionStorage.getItem('analytics_session_id');
if (!sessionId) {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('analytics_session_id', sessionId);
}
```

**Session Lifecycle**
- **Start**: On first page load or first chapter read
- **Update**: On each significant action (chapter progression, comment, etc.)
- **End**: On tab close (via `beforeunload` event) or 30-minute inactivity timeout

### Reading Session Tracking

**Start Session**
```typescript
// On first chapter read
const session = await db.insert(readingSessions).values({
  id: nanoid(),
  userId: user?.id,
  sessionId: analyticsSessionId,
  storyId: story.id,
  startTime: new Date(),
  deviceType: isMobile ? 'mobile' : 'desktop',
});
```

**Update Session**
```typescript
// On each chapter read or scene progression
await db.update(readingSessions)
  .set({
    endTime: new Date(),
    chaptersRead: currentChapter,
    scenesRead: currentScene,
    charactersRead: totalCharacters,
  })
  .where(eq(readingSessions.id, sessionId));
```

**Complete Session**
```typescript
// On last chapter completion
await db.update(readingSessions)
  .set({
    endTime: new Date(),
    completedStory: true,
    durationSeconds: Math.floor((endTime - startTime) / 1000),
  })
  .where(eq(readingSessions.id, sessionId));
```

---

## Daily Aggregation Strategy

### Why Daily Aggregation?

**Performance**:
- Querying millions of raw events is slow
- Pre-aggregated daily summaries are fast to query
- Enables real-time dashboard without lag

**Storage**:
- Raw events grow indefinitely
- Daily summaries are compact (1 row per story per day)
- Can archive old raw events after aggregation

**Analysis**:
- Daily granularity perfect for trends (not too granular, not too coarse)
- Supports week-over-week, month-over-month comparisons
- Easy to visualize in time-series charts

### Aggregation Schedule

**Run Daily at 1 AM UTC**
- Vercel cron job triggers `/api/cron/analytics-daily`
- Processes previous day's events (midnight to midnight UTC)
- Stores results in `daily_story_metrics` table

### Metrics to Aggregate

```sql
CREATE TABLE daily_story_metrics (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Reach
  total_views INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  new_readers INTEGER DEFAULT 0,

  -- Engagement
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,

  -- Retention
  avg_session_duration INTEGER DEFAULT 0, -- seconds
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,

  -- Behavior
  avg_chapters_per_session DECIMAL(5,2) DEFAULT 0,
  mobile_users INTEGER DEFAULT 0,
  desktop_users INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW() NOT NULL,

  UNIQUE(story_id, date)
);

CREATE INDEX idx_daily_metrics_story_date ON daily_story_metrics(story_id, date);
```

### Aggregation Query

```sql
-- Example daily aggregation query
INSERT INTO daily_story_metrics (
  id, story_id, date, total_views, unique_readers, comments, likes, shares,
  avg_session_duration, total_sessions, completed_sessions
)
SELECT
  gen_random_uuid() as id,
  story_id,
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'story_view' THEN id END) as total_views,
  COUNT(DISTINCT user_id) as unique_readers,
  COUNT(CASE WHEN event_type = 'comment_created' THEN 1 END) as comments,
  COUNT(CASE WHEN event_type = 'story_liked' THEN 1 END) as likes,
  COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares,
  0 as avg_session_duration, -- Calculated separately from reading_sessions
  0 as total_sessions,
  0 as completed_sessions
FROM analytics_events
WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY story_id, DATE(timestamp);
```

---

## Visualization Strategy

### Dashboard Hierarchy

**Level 1: Landing Page** (`/analysis`)
- **Purpose**: Overview of all stories with quick comparison
- **Layout**: Story cards in grid (like `/studio`)
- **Key Metrics per Card**:
  - Total views (last 30 days)
  - Unique readers (last 30 days)
  - Engagement actions (comments + likes + shares)
  - Trend indicator (up/down/stable with %)
- **Interaction**: Click card → Go to story detail page

**Level 2: Story Detail Page** (`/analysis/[storyId]`)
- **Purpose**: Deep dive into one story's performance
- **Layout**: Multi-section dashboard with tabs
- **Sections**:
  1. Key Metrics Cards (4 cards across top)
  2. Trends Over Time (line chart)
  3. Chapter Performance (table)
  4. Reader Behavior (bar charts, heatmaps)
  5. Quality Insights (cards with recommendations)

### Visualization Types

#### 1. Metric Cards (KPIs)

**Use Case**: Display single key metric with context

**Design**:
```
┌─────────────────────────────┐
│ 👥 Total Readers            │
│                             │
│     1,234                   │
│     ↗ +15.3%                │
│                             │
│ vs. last 30 days            │
└─────────────────────────────┘
```

**Best For**:
- Total views, readers, engagement count
- Average ratings, quality scores
- Percentages (completion rate, return rate)

**Why This Works**:
- Quick at-a-glance understanding
- Trend indicator shows direction
- Comparison period provides context

#### 2. Line Charts (Time Series)

**Use Case**: Show metrics over time to identify trends

**Design**:
```
Views Over Time (Last 30 Days)
1000 ┤        ╭─╮
 800 ┤      ╭─╯ ╰╮
 600 ┤    ╭─╯    ╰╮
 400 ┤  ╭─╯       ╰─╮
 200 ┤╭─╯           ╰─╮
   0 ┼──────────────────────
     1              15     30
```

**Data Sources**:
- `daily_story_metrics` table (pre-aggregated)
- Query last 7/30/90 days
- Multiple lines for comparison (views, readers, engagement)

**Best For**:
- Views per day
- Readers per day
- Engagement rate trend
- Session duration trend

**Why This Works**:
- Easy to spot patterns (spikes, drops, seasonality)
- Multiple metrics on same timeline for correlation
- Intuitive for non-technical users

#### 3. Bar Charts (Comparisons)

**Use Case**: Compare values across categories

**Design**:
```
Peak Reading Hours
12am ▓▓░░░░░░░░░░░░░░░░░░  50
 6am ▓▓▓▓░░░░░░░░░░░░░░░░  120
12pm ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  450
 6pm ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  820
```

**Data Sources**:
- Group `analytics_events` by `EXTRACT(HOUR FROM timestamp)`
- Aggregate by day of week, chapter number, etc.

**Best For**:
- Peak reading hours (hourly distribution)
- Day of week distribution
- Chapter performance comparison
- Device type distribution (Mobile vs Desktop)

**Why This Works**:
- Easy to identify winners/losers
- Compare multiple items side-by-side
- Good for categorical data

#### 4. Tables with Sorting (Detailed Data)

**Use Case**: Show detailed performance for multiple items

**Design**:
```
Chapter Performance (Last 30 Days)
┌─────────────────────────────────────────────────────┐
│ Chapter    │ Views │ Readers │ Avg Time │ Drop-Off │
├─────────────────────────────────────────────────────┤
│ Ch 1: ...  │ 1,234 │   892   │  4m 32s  │   12%    │
│ Ch 2: ...  │ 1,102 │   823   │  5m 18s  │   15%    │
│ Ch 3: ...  │   934 │   701   │  6m 02s  │   18%    │
│ Ch 4: ...  │   766 │   598   │  5m 44s  │   22%    │
└─────────────────────────────────────────────────────┘
```

**Data Sources**:
- Aggregate `analytics_events` by `chapterId`
- Join with `chapters` table for titles
- Calculate drop-off rate (readers who don't continue)

**Best For**:
- Chapter-by-chapter breakdown
- Scene performance within a chapter
- Ranked lists (top chapters, worst performers)

**Why This Works**:
- Comprehensive detail for deep analysis
- Sortable columns for custom exploration
- Supports filtering and search

#### 5. Heatmaps (Patterns)

**Use Case**: Show activity patterns across two dimensions

**Design**:
```
Reading Activity Heatmap (Day × Hour)
       12am  6am  12pm  6pm
Mon    ██░░  ░░░░  ████  ████
Tue    ██░░  ░░░░  ████  ████
Wed    ██░░  ░░░░  ████  ████
Thu    ██░░  ░░░░  ████  ████
Fri    ████  ░░░░  ████  ████
Sat    ████  ████  ████  ████
Sun    ████  ████  ████  ████
```

**Data Sources**:
- Group `analytics_events` by day of week AND hour
- Color intensity = activity level

**Best For**:
- Day × Hour reading patterns
- Chapter × Scene quality matrix

**Why This Works**:
- Instantly reveals patterns (weekend reading, evening spikes)
- Compact representation of 2D data
- Beautiful and intuitive

#### 6. Funnel Chart (Reader Journey)

**Use Case**: Show progression through story with drop-off points

**Design**:
```
Reader Progression Funnel
Story View      ████████████████████  1,000  (100%)
Read Ch 1       ████████████████░░░░    850   (85%)
Read Ch 2       ██████████████░░░░░░    720   (72%)
Read Ch 3       ████████████░░░░░░░░    650   (65%)
...
Complete Story  ██████░░░░░░░░░░░░░░    320   (32%)
```

**Data Sources**:
- Count `story_view` events
- Count readers who progressed to each chapter
- Calculate completion rate from `reading_sessions`

**Best For**:
- Identifying where readers drop off
- Measuring story completion funnel
- A/B testing chapter changes

**Why This Works**:
- Shows exactly where to focus improvement efforts
- Visual representation of retention problem
- Industry-standard conversion visualization

#### 7. Insight Cards (AI Recommendations)

**Use Case**: Surface AI-generated recommendations with supporting data

**Design**:
```
┌─────────────────────────────────────────────┐
│ ⚠️  Engagement Declining                   │
│                                             │
│ Reader engagement has dropped by 24%       │
│ over the last 14 days. Readers are         │
│ spending less time per chapter.            │
│                                             │
│ Recommended Actions:                        │
│ • Publish a new chapter to re-engage       │
│ • Post a community update or Q&A           │
│ • Review recent chapters for pacing        │
│                                             │
│ 85% confidence • AI Model: GPT-4o Mini     │
│                                             │
│ [ Was this helpful?  👍 Yes   👎 No ]      │
└─────────────────────────────────────────────┘
```

**Data Sources**:
- `story_insights` table (AI-generated)
- Supporting metrics from analytics

**Best For**:
- Quality improvement suggestions
- Engagement drop alerts
- Publishing opportunity recommendations
- Reader feedback analysis

**Why This Works**:
- Actionable (not just informational)
- Prioritized by severity
- Builds trust with confidence score
- Feedback loop improves AI over time

---

## UI/UX Design Principles

### 1. Progressive Disclosure

**Start Simple, Go Deep**:
- **Landing Page**: High-level overview (3-4 metrics per story)
- **Detail Page**: Comprehensive analytics (10+ charts/tables)
- **Drill-Down**: Click any chart to see underlying data

**Why**: Prevents overwhelming writers with data, while supporting power users.

### 2. Responsive Design

**Mobile First**:
- Analytics cards stack vertically on mobile
- Charts are horizontally scrollable if needed
- Touch-friendly buttons (min 44px tap target)
- Bottom navigation for easy access

**Desktop Enhancement**:
- Multi-column layouts
- Side-by-side chart comparisons
- Hover tooltips for additional context

### 3. Color Strategy

**Semantic Colors**:
- **Green**: Positive trends, growth, success
- **Red**: Negative trends, alerts, critical issues
- **Blue**: Neutral information, primary actions
- **Yellow**: Warnings, attention needed

**Accessibility**:
- WCAG AA contrast ratios (4.5:1 for text)
- Color-blind friendly palettes
- Icons + color (not color alone)

### 4. Loading States

**Skeleton Screens**:
- Show layout immediately
- Replace with real data as it loads
- No spinner (feels faster)

**Progressive Enhancement**:
- Critical metrics load first (above fold)
- Charts load next (async)
- Optional insights load last

### 5. Empty States

**No Data Yet**:
- Friendly message: "No views yet! Share your story to get started."
- Suggestions: "Publish to community" or "Share on social media"
- Example visuals showing what charts will look like

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Database migrations (analytics_events, reading_sessions, etc.)
- [ ] Event tracking service (client + server)
- [ ] Basic API endpoints (GET stories, GET daily metrics)
- [ ] Landing page with story cards
- [ ] Metric card component

### Phase 2: Visualization (Week 3-4)
- [ ] Line chart component (Recharts)
- [ ] Bar chart component
- [ ] Story detail page with tabs
- [ ] Chapter performance table
- [ ] Responsive mobile layout

### Phase 3: Advanced Features (Week 5-6)
- [ ] Heatmap component (day/hour patterns)
- [ ] Funnel chart (reader progression)
- [ ] AI insights generation service
- [ ] Insight card component with feedback
- [ ] Daily aggregation cron job

### Phase 4: Polish & Optimization (Week 7-8)
- [ ] Performance optimization (query caching, indexes)
- [ ] Error handling and loading states
- [ ] Empty states and onboarding
- [ ] Export functionality (CSV, PDF reports)
- [ ] Unit tests and E2E tests

---

## Summary

**The Fictures analytics system is designed to**:

1. **Track** every meaningful reader interaction (views, engagement, sessions)
2. **Aggregate** daily summaries for fast queries and long-term trends
3. **Visualize** data through intuitive charts and tables
4. **Surface** AI-powered insights with actionable recommendations
5. **Empower** writers to improve their craft and grow their audience

**Key Differentiators**:
- **Writer-centric**: Designed for creators, not advertisers
- **Privacy-respecting**: Anonymous tracking, session-based
- **Actionable**: Every metric comes with "what to do next"
- **Beautiful**: Professional charts and dashboards
- **Fast**: Pre-aggregated daily data for instant loading

**Next Steps**: Follow the implementation roadmap to build the system incrementally, testing each phase with real writers to gather feedback and iterate.

---

**Last Updated**: 2025-11-04
**Author**: Analysis System Architecture
**Status**: 📋 Strategy Document - Ready for Implementation
