---
title: "Community Metrics Help Icons"
---

# Community Metrics Help Icons

## Overview

The Community page (`/community`) displays 6 key metrics with help icons that provide detailed explanations when clicked.

## Implementation

### Components Created

1. **`src/components/ui/popover.tsx`**
   - Reusable popover component for tooltips and help text
   - Handles click-outside to close
   - Supports positioning (top, bottom, left, right)
   - Supports alignment (start, center, end)

2. **`src/components/community/metric-card.tsx`**
   - Specialized metric display component
   - Integrates help icon with popover
   - Shows value, label, description, and detail points

### Metrics with Explanations

#### 1. Active Today (Blue)
- **Description**: Stories with recent community activity in the past 24 hours
- **Details**:
  - Includes stories with new posts or comments
  - Shows real-time engagement
  - Updated throughout the day

#### 2. Comments Today (Green)
- **Description**: Total number of comments posted across all stories today
- **Details**:
  - Counts all discussion replies
  - Refreshes every 30 minutes
  - Helps track daily engagement

#### 3. Avg Rating (Purple)
- **Description**: Average community rating across all published stories
- **Details**:
  - Based on reader feedback
  - Calculated from all published stories
  - Scale: 1.0 to 5.0 stars

#### 4. Stories (Orange)
- **Description**: Total number of published stories available in the community
- **Details**:
  - Only published stories are shown
  - Draft stories are not included
  - Browse and read any story

#### 5. Discussions (Red)
- **Description**: Total discussion threads across all community stories
- **Details**:
  - Includes all posts and topics
  - Each story has its own discussions
  - Join conversations anytime

#### 6. Members (Indigo)
- **Description**: Total unique users who have participated in community discussions
- **Details**:
  - Active contributors and readers
  - Sign in to join the community
  - No membership fees

## User Experience

- **Visual**: Small help icon (?) appears next to each metric label
- **Interaction**: Click the help icon to see detailed explanation
- **Popover**: Appears below the metric with:
  - Bold metric name
  - Description text
  - Bulleted detail points
- **Dismiss**: Click anywhere outside the popover to close

## Testing

Run the test script to verify functionality:

```bash
dotenv --file .env.local run node scripts/test-metric-help-simple.mjs
```

This will:
- Navigate to `/community`
- Click on help icons
- Capture screenshots showing popover
- Save to `logs/` directory

## Files Modified

- `src/app/community/page.tsx` - Updated to use MetricCard component
- `src/components/ui/index.ts` - Added Popover exports
- Created:
  - `src/components/ui/popover.tsx`
  - `src/components/community/metric-card.tsx`
  - `scripts/test-metric-help-simple.mjs`
  - `docs/community-metrics-help.md`

## Future Enhancements

- Add keyboard support (ESC to close, Tab navigation)
- Add animations for popover appearance
- Support hover-to-show on desktop (in addition to click)
- Add metric trend indicators (↑↓)
