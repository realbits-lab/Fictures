# Analysis & Insights Specification

This document outlines the **what and why** of the Fictures analysis system - the concepts, data model, and theoretical foundation for tracking story performance and providing actionable insights to writers.

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Data Model](#data-model)
4. [Analytics Events](#analytics-events)
5. [Reading Sessions](#reading-sessions)
6. [Story Insights](#story-insights)
7. [Metrics & KPIs](#metrics--kpis)
8. [Success Criteria](#success-criteria)

---

## Overview

### Purpose

The Analysis system empowers writers with comprehensive, actionable insights about their story performance, reader engagement, and content quality. It transforms raw interaction data into meaningful intelligence that drives writing improvements and audience growth.

### Philosophy

**Data-Driven Writing**:
- Writers deserve to understand how readers interact with their work
- Insights should be actionable, not just informational
- AI-powered recommendations help writers improve quality
- Privacy-respecting analytics (anonymous reader tracking)

**Key Principles**:
1. **Clarity**: Present complex data in simple, visual formats
2. **Actionability**: Every insight comes with recommended actions
3. **Timeliness**: Real-time tracking with daily aggregations
4. **Privacy**: Respect reader anonymity while gathering useful metrics

---

## Core Concepts

### Story Performance Metrics

**What to Measure**:
- **Reach**: How many readers discover the story
- **Engagement**: How readers interact with content
- **Retention**: How many readers return
- **Quality**: AI-evaluated writing quality scores
- **Completion**: How many readers finish the story

**Why It Matters**:
- Identify which stories resonate with readers
- Understand what content drives engagement
- Spot declining trends before they become critical
- Validate writing improvements through data

### Daily Data Aggregation

**Concept**: All raw events aggregate into daily summaries for trend analysis.

**Benefits**:
- Historical trend visualization
- Pattern recognition (peak reading times, engagement drops)
- Week-over-week / month-over-month comparisons
- Predictive analytics (trending up/down)

---

## Data Model

### Database Schema Overview

The analysis system uses four core tables:

1. **analytics_events** - Raw event tracking (every user action)
2. **reading_sessions** - Continuous reading session tracking
3. **story_insights** - AI-generated insights and recommendations
4. **recommendation_feedback** - User feedback on AI suggestions

### 1. Analytics Events Table

**Purpose**: Track every user interaction for comprehensive analytics.

```sql
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  metadata JSON DEFAULT '{}'::json,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_story ON analytics_events(story_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp);
```

**Key Fields**:
- `event_type`: Type of user action (see Event Types below)
- `user_id`: User who performed action (NULL for anonymous)
- `session_id`: Browser session identifier
- `metadata`: Additional context (device type, location, etc.)
- `timestamp`: When event occurred (for daily aggregation)

---

## Analytics Events

### Event Types

#### Page Views
- `page_view` - Any page visit
- `story_view` - Story landing page view

#### Reading Engagement
- `chapter_read_start` - User starts reading chapter
- `chapter_read_complete` - User finishes chapter
- `scene_read` - User reads a scene

#### Social Engagement
- `comment_created` - User posts comment
- `comment_liked` - User likes comment
- `story_liked` - User likes story
- `chapter_liked` - User likes chapter
- `post_created` - Community post created
- `post_viewed` - Community post viewed
- `share` - Content shared
- `bookmark` - Content bookmarked

### Event Metadata Examples

```json
{
  "device_type": "mobile",
  "screen_width": 390,
  "read_duration_seconds": 245,
  "scroll_depth_percent": 85,
  "referrer": "community"
}
```

---

## Reading Sessions

### Purpose

Track continuous reading sessions to understand reader behavior patterns, engagement depth, and completion rates.

### Schema

```sql
CREATE TABLE reading_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  chapters_read INTEGER DEFAULT 0,
  scenes_read INTEGER DEFAULT 0,
  characters_read INTEGER DEFAULT 0,
  session_type VARCHAR(20) DEFAULT 'continuous',
  device_type VARCHAR(20),
  completed_story BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Session Types
- `continuous` - Uninterrupted reading session
- `interrupted` - Reader took breaks but returned
- `partial` - Incomplete session (reader left mid-chapter)

### Key Metrics Derived
- **Average session duration**: How long readers stay engaged
- **Chapters per session**: Reading depth
- **Completion rate**: % of readers who finish stories
- **Return rate**: % of readers who come back within 7 days

---

## Story Insights

### Purpose

AI-generated insights analyze story performance data and provide actionable recommendations for writers to improve quality and engagement.

### Schema

```sql
CREATE TABLE story_insights (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info',
  action_items JSON DEFAULT '[]'::json,
  metrics JSON DEFAULT '{}'::json,
  ai_model VARCHAR(50),
  confidence_score DECIMAL(3,2),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);
```

### Insight Types

#### Quality Insights
- `quality_improvement` - Writing quality suggestions based on scene evaluations
- `pacing_issue` - Pacing problems detected (too fast/slow)
- `character_development` - Character arc suggestions
- `plot_consistency` - Plot hole detection

#### Engagement Insights
- `engagement_drop` - Reader engagement declining
- `trending_up` - Story gaining traction
- `reader_feedback` - Patterns in reader comments
- `audience_mismatch` - Genre/audience alignment issues

#### Publishing Insights
- `publishing_opportunity` - Optimal publish time based on reader patterns
- `content_gap` - Readers waiting for new content

### Severity Levels
- `info` - Informational insight (green)
- `warning` - Issue requiring attention (yellow)
- `critical` - Urgent problem (red)
- `success` - Positive trend or achievement (blue)

### Example Insight

```json
{
  "insight_type": "quality_improvement",
  "title": "Improve Character Development",
  "description": "Your character development scores average 68/100. Scenes in chapters 3-5 show limited character growth.",
  "severity": "warning",
  "action_items": [
    "Add internal monologue showing character's emotional state",
    "Create conflict that forces character to make difficult choices",
    "Show character reactions to major plot events"
  ],
  "metrics": {
    "category": "character",
    "avgScore": 68,
    "affectedScenes": 8,
    "topScore": 85,
    "bottomScore": 52
  },
  "ai_model": "gpt-4o-mini",
  "confidence_score": 0.85
}
```

---

## Metrics & KPIs

### Story-Level Metrics

**Reach Metrics**:
- Total unique readers (last 7/30/90 days)
- Reader growth % (vs. previous period)
- New vs. returning readers
- Geographic distribution (if available)

**Engagement Metrics**:
- Total views (story, chapter, scene level)
- Average rating (1-5 stars)
- Total comments
- Total likes/reactions
- Engagement rate: (comments + likes) / views × 100

**Retention Metrics**:
- Return rate: % readers who come back within 7 days
- Completion rate: % readers who finish story
- Average session duration
- Chapters read per session

**Quality Metrics**:
- Average scene evaluation score (from scene_evaluations)
- Score breakdown by category (plot, character, pacing, prose, world-building)
- Scenes passing quality threshold (≥ 3.0/4.0)

### Trend Metrics

**Daily Aggregates** (for time-series charts):
- Views per day
- Engagement per day
- New readers per day
- Average session duration per day
- Comments per day

**Week-over-Week Comparison**:
- % change in views
- % change in engagement
- % change in new readers

---

## Success Criteria

### Data Quality
- **Event Accuracy**: 99.9% of events tracked correctly
- **Data Latency**: < 5 minutes from event to dashboard
- **Query Performance**: < 500ms for analytics queries

### User Engagement
- **Dashboard Usage**: ≥ 60% of writers visit analytics weekly
- **Insight Action Rate**: ≥ 30% of insights acted upon
- **Recommendation Acceptance**: ≥ 40% of AI suggestions implemented
- **Session Duration**: ≥ 3 minutes average time in analytics

### Technical Performance
- **Page Load Time**: < 3s on mobile, < 2s on desktop
- **Chart Render Time**: < 500ms
- **API Response Time**: < 1s (p95)
- **Error Rate**: < 0.1%

---

## Future Enhancements

### Advanced Analytics
- **Predictive Analytics**: ML models for trend prediction
- **A/B Testing**: Chapter/title variant testing
- **Cohort Analysis**: Reader retention by signup date
- **Funnel Analysis**: Reader journey mapping (discovery → reading → engagement)
- **Sentiment Analysis**: Deep comment sentiment tracking with NLP

### Quality Improvements
- **Writing Coach**: AI-powered writing improvement suggestions
- **Style Analysis**: Consistency and voice analysis
- **Pacing Heatmaps**: Visual pacing analysis per chapter
- **Character Arc Tracking**: Character development insights over time
- **Plot Hole Detection**: AI-powered plot consistency checking

### Integration Features
- **Export Capabilities**: CSV/PDF report generation
- **Email Reports**: Automated weekly/monthly summaries
- **Webhooks**: Real-time analytics webhooks
- **Third-Party Analytics**: Google Analytics integration
- **Social Media Tracking**: Share tracking across platforms

---

## References

### Analytics Best Practices
- [Google Analytics 4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [Mixpanel Analytics Guide](https://mixpanel.com/blog/product-analytics-best-practices/)
- [Amplitude Data Taxonomy](https://www.docs.developers.amplitude.com/analytics/what-is-amplitude/)

### Content Analytics
- [Medium Writer Stats](https://help.medium.com/hc/en-us/articles/215108608-Stats)
- [Wattpad Analytics](https://www.wattpad.com/writers/analytics)
- [Substack Analytics](https://support.substack.com/hc/en-us/articles/360037466012-Analytics)

### AI & Recommendations
- [Content Recommendation Systems](https://developers.google.com/machine-learning/recommendation)
- [Sentiment Analysis Best Practices](https://monkeylearn.com/sentiment-analysis/)
- [Writing Quality Metrics](https://www.grammarly.com/blog/studio-analytics/)

---

**Last Updated**: 2025-11-04
**Status**: 📋 Specification - Implementation in progress
