---
title: Publishing UI Specification
description: User interface design for weekly scene-by-scene publishing system
status: 📋 Specification
---

# Publishing UI Specification

Complete UI/UX design specification for the publishing center, featuring story card list, timeline visualization, and intuitive scheduling management.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Page Layout](#page-layout)
3. [Story Card List View](#story-card-list-view)
4. [Timeline Visualization](#timeline-visualization)
5. [Schedule Builder](#schedule-builder)
6. [Manual Controls](#manual-controls)
7. [User Behavior Flows](#user-behavior-flows)
8. [Responsive Design](#responsive-design)
9. [Interaction Patterns](#interaction-patterns)
10. [Component Specifications](#component-specifications)

---

## Design Philosophy

### Core Principles

**1. Progressive Disclosure**
- Start simple: Show story cards first
- Reveal complexity: Timeline appears only when needed
- Layer details: Basic info → Schedule view → Scene details

**2. Visual Clarity**
- Status-first design: Use color coding for instant recognition
- Minimal cognitive load: One primary action per context
- Scannable information: Key metrics visible at a glance

**3. Mobile-First**
- Touch-optimized controls (44px minimum)
- Vertical scrolling over horizontal panning
- Bottom-anchored action sheets on mobile

**4. Consistency with Studio**
- Use identical story card design from `/studio`
- Match typography, spacing, and color system
- Maintain navigation patterns

### Inspiration from Industry Leaders

**Buffer-style Simplicity:**
- Clean, minimalist calendar interface
- Focus on "what's publishing when"
- Quick actions without nested menus

**Hootsuite-style Power:**
- Advanced filtering and bulk operations
- Multiple view modes (calendar, list, gantt)
- Detailed analytics integration

**Google Calendar Familiarity:**
- Month grid layout for desktop
- Drag-and-drop rescheduling
- Color-coded events by status

---

## Page Layout

### Main Route: `/publish`

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  📤 Publish Center                                   [User] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔍 Search Stories]  [Filter ▼] [Sort ▼]  [+ New Schedule]│
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Story Cards Grid (matching /studio design)         │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│   │
│  │  │ Story Card 1 │  │ Story Card 2 │  │ Story Card ││   │
│  │  │ [View Timeline]│  │ [View Timeline]│  │ [Create] ││   │
│  │  └──────────────┘  └──────────────┘  └────────────┘│   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│   │
│  │  │ Story Card 3 │  │ Story Card 4 │  │ Story Card ││   │
│  │  └──────────────┘  └──────────────┘  └────────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### View Modes

**Default View: Story Grid**
- Shows all user's stories as cards
- Primary action: "View Timeline" or "Create Schedule"
- No timeline visible until story selected

**Timeline View: Modal Overlay (Recommended)**
- Click story → Timeline modal slides up from bottom (mobile) or center (desktop)
- Story list dimmed in background (40% opacity)
- Close button (X) or click backdrop to dismiss
- Easy to switch between stories without navigation

**Alternative: Split Panel**
- Desktop only: Stories left (40%), Timeline right (60%)
- Timeline panel empty until story selected
- Mobile: Full-screen navigation

---

## Story Card List View

### Story Card Design (Identical to `/studio`)

**Card Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image - 16:9 aspect ratio]                   │
│                                                      │
├─────────────────────────────────────────────────────┤
│ 📖 Story Title                          [⋮ Menu]    │
│ 👤 Author Name                                       │
│                                                      │
│ 📊 Publishing Status                                │
│ ┌──────────────────────────────────────────────┐   │
│ │ ✅ 12 Published  📅 8 Scheduled  ⏳ 5 Pending │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ 📈 Active Schedule: Monday 9:00 AM                  │
│ 🎯 Next Publish: Mon, Nov 11 at 9:00 AM             │
│                                                      │
│ [View Timeline]              [Manage Schedule ▼]    │
└─────────────────────────────────────────────────────┘
```

**Card Elements:**

1. **Cover Image**
   - 16:9 aspect ratio (matching studio cards)
   - Lazy loaded with blur placeholder
   - Hover: Slight scale (1.02) and shadow

2. **Story Metadata**
   - Title (truncated at 2 lines with ellipsis)
   - Author name (muted color)
   - Genre/category tags (optional)

3. **Publishing Status Bar**
   - Total scenes count
   - Published count (✅ green)
   - Scheduled count (📅 blue)
   - Pending count (⏳ yellow)
   - Failed count (❌ red, if any)

4. **Schedule Information**
   - "Active Schedule" badge (green) if schedule exists
   - "No Schedule" badge (gray) if no automation
   - Next publish date/time (prominent)
   - Schedule pattern: "Weekly Monday 9:00 AM"

5. **Primary Actions**
   - **View Timeline**: Opens timeline modal/panel
   - **Create Schedule**: Opens schedule builder (if no schedule)
   - **Manage Schedule**: Dropdown menu (if schedule exists)
     - Edit Schedule
     - Pause Schedule
     - Delete Schedule
     - View Statistics

6. **Context Menu (⋮)**
   - Quick Publish All
   - Unpublish All
   - Export Schedule
   - Duplicate Schedule

### Card States

**1. No Schedule Created:**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image]                                        │
├─────────────────────────────────────────────────────┤
│ 📖 The Last Garden                                   │
│                                                      │
│ 📊 No Publishing Schedule                           │
│ ┌──────────────────────────────────────────────┐   │
│ │ 25 total scenes • 0 published                 │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Create Schedule]              [Manual Publish ▼]   │
└─────────────────────────────────────────────────────┘
```

**2. Active Schedule:**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image]                      [🟢 ACTIVE]      │
├─────────────────────────────────────────────────────┤
│ 📖 The Last Garden                                   │
│                                                      │
│ ✅ 12 Published  📅 8 Scheduled  ⏳ 5 Pending       │
│                                                      │
│ 📅 Weekly Monday 9:00 AM                            │
│ 🎯 Next: Mon, Nov 11 at 9:00 AM                     │
│                                                      │
│ [View Timeline]              [Manage Schedule ▼]    │
└─────────────────────────────────────────────────────┘
```

**3. Paused Schedule:**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image]                      [⏸️ PAUSED]      │
├─────────────────────────────────────────────────────┤
│ 📖 The Last Garden                                   │
│                                                      │
│ ⏸️ Schedule Paused                                  │
│ Last published: 3 days ago                          │
│                                                      │
│ [Resume Schedule]            [Manage Schedule ▼]    │
└─────────────────────────────────────────────────────┘
```

**4. Completed Schedule:**
```
┌─────────────────────────────────────────────────────┐
│ [Cover Image]                   [✅ COMPLETED]      │
├─────────────────────────────────────────────────────┤
│ 📖 The Last Garden                                   │
│                                                      │
│ ✅ All 25 scenes published                          │
│ Completed on Nov 25, 2025                           │
│                                                      │
│ [View Timeline]              [Archive]              │
└─────────────────────────────────────────────────────┘
```

### Filters & Sorting

**Filter Options:**
- All Stories
- Active Schedules
- Paused Schedules
- No Schedule
- Completed

**Sort Options:**
- Next Publish Date (ascending)
- Last Updated
- Title (A-Z)
- Total Published (descending)
- Completion Progress (%)

**Search:**
- Fuzzy search by story title
- Real-time filtering as user types
- Clear button (X) when active

---

## Timeline Visualization

### Timeline Modal/Panel Design

**Desktop Modal Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  📖 The Last Garden - Publishing Timeline          [✕ Close]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Calendar View] [List View] [Gantt View]    [Filter ▼]    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        November 2025                                 │   │
│  │  ← [Oct]                                    [Dec] → │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Sun   Mon   Tue   Wed   Thu   Fri   Sat          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  27    28    29    30    31     1     2            │   │
│  │   3     4     5     6     7     8     9            │   │
│  │                   🟢             🔵                 │   │
│  │  10   [11]   12    13    14    15    16            │   │
│  │       🔵🔵                                          │   │
│  │  17    18    19    20    21    22    23            │   │
│  │       🔵                  🔵                        │   │
│  │  24    25    26    27    28    29    30            │   │
│  │       🔵                  🔵                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📅 Upcoming Publications (Next 5)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mon, Nov 11 • 9:00 AM                    [⋮]        │   │
│  │ 📘 Scene 1: "The Ruins" (Ch 1)           🔵 Scheduled│   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Mon, Nov 11 • 9:00 AM                    [⋮]        │   │
│  │ 📘 Scene 2: "The Discovery" (Ch 1)       🔵 Scheduled│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### View Modes

**1. Calendar View (Default - Desktop)**

**Month Grid Design:**
- 7 columns (Sun-Sat)
- 5-6 rows for weeks
- Current date highlighted with border
- Color-coded dots for scenes:
  - 🟢 Green: Published
  - 🔵 Blue: Scheduled (pending)
  - 🟡 Yellow: In Progress (cron processing)
  - 🔴 Red: Failed (needs attention)

**Dot Layout:**
- Maximum 4 dots per day
- If >4 scenes, show "+N more" indicator
- Dots stacked vertically
- Hover to show tooltip with scene titles

**Interactions:**
- Click date → Show all scenes for that day (side panel)
- Drag scene dot → Reschedule to new date
- Right-click scene dot → Context menu
- Double-click date → Create new publication

**Date Cell Design:**
```
┌─────────────┐
│  11         │  ← Date number
│  🔵🔵       │  ← Scene dots (max 4)
│  +2 more    │  ← Overflow indicator
└─────────────┘
```

**2. List View (Mobile - Vertical Timeline)**

**List Design:**
```
┌─────────────────────────────────────────────────────┐
│  🔍 Search scenes...                    [Filter ▼] │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📅 Monday, November 11, 2025                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ 9:00 AM                           🔵 Scheduled│  │
│  │ 📘 Scene 1: "The Ruins" (Ch 1)               │  │
│  │ [Publish Now]  [Reschedule]  [⋮]             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 9:00 AM                           🔵 Scheduled│  │
│  │ 📘 Scene 2: "The Discovery" (Ch 1)           │  │
│  │ [Publish Now]  [Reschedule]  [⋮]             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  📅 Monday, November 18, 2025                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ 9:00 AM                           🔵 Scheduled│  │
│  │ 📘 Scene 3: "The Warning" (Ch 1)             │  │
│  │ [Publish Now]  [Reschedule]  [⋮]             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [Load More ▼]                                      │
└─────────────────────────────────────────────────────┘
```

**List Features:**
- Grouped by date with date headers
- Each scene as card with quick actions
- Pull-to-refresh at top
- Infinite scroll loading
- Sticky date headers while scrolling
- Swipe left for quick actions (mobile)

**Scene Card in List:**
```
┌────────────────────────────────────────────────────┐
│ 9:00 AM                            🔵 Scheduled    │
│ 📘 Scene 1: "The Ruins"                           │
│ Chapter 1: The Beginning • 1,250 words            │
│                                                    │
│ [Publish Now]  [Reschedule]  [Cancel]  [⋮]        │
└────────────────────────────────────────────────────┘
```

**3. Gantt Chart View (Advanced - Desktop)**

**Gantt Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Chapter 1: The Beginning                                    │
│  ├─────────────────────────────────────────────────────────┤
│  │ ▓▓▓▓ Scene 1  ░░░░ Scene 2  ░░░░ Scene 3             │
│  │ Nov 11        Nov 18        Nov 25                     │
│  └─────────────────────────────────────────────────────────┘
│                                                              │
│  Chapter 2: The Journey                                      │
│  ├─────────────────────────────────────────────────────────┤
│  │           ░░░░ Scene 4  ░░░░ Scene 5                   │
│  │           Dec 2         Dec 9                           │
│  └─────────────────────────────────────────────────────────┘
│                                                              │
│  ▓▓▓▓ Published    ░░░░ Scheduled    ░░░░ Pending         │
└─────────────────────────────────────────────────────────────┘
```

**Gantt Features:**
- Rows for chapters
- Bars for scenes (color-coded by status)
- Timeline spans entire schedule
- Zoom in/out controls
- Drag bars to reschedule
- Good for visualizing overall progress

### Status Indicators

**Color System:**

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Published | 🟢 Green (#22c55e) | ✅ | Successfully published |
| Scheduled | 🔵 Blue (#3b82f6) | 📅 | Queued for future publication |
| In Progress | 🟡 Yellow (#eab308) | ⏳ | Cron job is processing |
| Failed | 🔴 Red (#ef4444) | ❌ | Publication failed |
| Cancelled | ⚫ Gray (#6b7280) | 🚫 | User cancelled publication |

**Status Badges:**
```html
<!-- Published -->
<span class="badge badge-success">✅ Published</span>

<!-- Scheduled -->
<span class="badge badge-info">📅 Scheduled</span>

<!-- Failed -->
<span class="badge badge-error">❌ Failed</span>
```

### Scene Detail Panel

**Triggered by:**
- Click scene in calendar/list
- Context menu → "View Details"

**Panel Layout (Slide-in from right on desktop):**
```
┌─────────────────────────────────────────┐
│  Scene Details                 [✕ Close]│
├─────────────────────────────────────────┤
│                                          │
│  📘 Scene 1: "The Ruins"                │
│  Chapter 1: The Beginning                │
│  🔵 Scheduled for Nov 11 at 9:00 AM     │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  [Scene Cover Image]              │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 Metadata                            │
│  • 1,250 words                          │
│  • Added 3 days ago                     │
│  • Last edited 1 day ago                │
│                                          │
│  📄 Content Preview                     │
│  ┌──────────────────────────────────┐  │
│  │ "The ruins stretched before      │  │
│  │  them, ancient stones..."        │  │
│  │                                   │  │
│  │  [Read Full Scene →]             │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📅 Publishing Status                   │
│  • Scheduled: Nov 11, 2025 at 9:00 AM  │
│  • Created: Nov 4, 2025 at 10:30 AM    │
│  • Auto-publish: Enabled               │
│                                          │
│  🎯 Quick Actions                       │
│  [Publish Now]  [Reschedule]  [Cancel] │
│                                          │
│  🔗 More Options                        │
│  [Edit Scene]  [Change Visibility]     │
│  [Unpublish]   [Delete]                │
│                                          │
└─────────────────────────────────────────┘
```

---

## Schedule Builder

### Schedule Builder Modal

**Triggered by:**
- "Create Schedule" button on story card
- "New Schedule" button in publish center header

**Modal Layout:**
```
┌───────────────────────────────────────────────────────┐
│  Create Publishing Schedule              [✕ Close]   │
├───────────────────────────────────────────────────────┤
│                                                        │
│  📖 Story: The Last Garden                            │
│  📊 25 unpublished scenes available                   │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Schedule Name *                                │  │
│  │  [Weekly Monday Morning Release         ]       │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Description (optional)                         │  │
│  │  [Publish 1 scene every Monday at 9 AM  ]       │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  📅 Publishing Frequency                              │
│  ┌────────────────────────────────────────────────┐  │
│  │  Day of Week *                                  │  │
│  │  [Monday ▼]                                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Publish Time *                                 │  │
│  │  [09:00 ▼]                                      │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Scenes Per Week *                              │  │
│  │  [1 ▼]   (1-3 recommended)                      │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  📆 Start Date                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  [Nov 11, 2025 ▼]  (Next Monday)                │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                        │
│  📊 Schedule Preview                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Total Duration: 25 weeks (6 months)            │  │
│  │  First Publish: Mon, Nov 11 at 9:00 AM          │  │
│  │  Last Publish:  Mon, Apr 28 at 9:00 AM          │  │
│  │                                                  │  │
│  │  Next 5 Publications:                            │  │
│  │  📅 Nov 11 - Scene 1: "The Ruins"               │  │
│  │  📅 Nov 18 - Scene 2: "The Discovery"           │  │
│  │  📅 Nov 25 - Scene 3: "The Warning"             │  │
│  │  📅 Dec 2  - Scene 4: "The Journey Begins"      │  │
│  │  📅 Dec 9  - Scene 5: "The First Test"          │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  [Cancel]                       [Create Schedule]    │
└───────────────────────────────────────────────────────┘
```

### Form Fields

**1. Schedule Name**
- Required field
- Auto-generated suggestion: "Weekly [Day] [Time] Release"
- Max length: 100 characters
- Example: "Weekly Monday Morning Release"

**2. Description**
- Optional field
- Supports markdown
- Max length: 500 characters
- Example: "Publish 1 scene every Monday at 9 AM to build consistent audience engagement"

**3. Day of Week**
- Required dropdown
- Options: Sunday-Saturday
- Default: Monday (recommended)
- Visual indicator for recommended days (Monday/Friday)

**4. Publish Time**
- Required time picker
- 12-hour or 24-hour format (user preference)
- Default: 09:00 AM
- Timezone displayed: User's local timezone
- Note: "All times shown in your local timezone (PST)"

**5. Scenes Per Week**
- Required number input
- Min: 1, Max: 10
- Default: 1
- Recommended: 1-3 (shown as help text)
- Validation: Can't exceed available scenes

**6. Start Date**
- Required date picker
- Min: Tomorrow
- Default: Next occurrence of selected day of week
- Calendar popup with disabled past dates

### Schedule Preview

**Real-time Calculations:**
- Updates as user changes form fields
- Shows total duration (weeks/months)
- First and last publication dates
- Next 5 publications with scene titles
- Estimated completion date

**Preview Format:**
```
📊 Schedule Summary
━━━━━━━━━━━━━━━━━━━
⏱️  Duration: 25 weeks (6 months)
📅 First: Mon, Nov 11 at 9:00 AM
🏁 Last:  Mon, Apr 28 at 9:00 AM

📋 Upcoming Publications (5/25):
• Nov 11 - Scene 1: "The Ruins"
• Nov 18 - Scene 2: "The Discovery"
• Nov 25 - Scene 3: "The Warning"
• Dec 2  - Scene 4: "The Journey Begins"
• Dec 9  - Scene 5: "The First Test"
```

### Validation & Error States

**Validation Rules:**
1. Schedule name required (1-100 chars)
2. Day of week required
3. Publish time required
4. Scenes per week: 1-10
5. Start date: Must be future date
6. Must have unpublished scenes

**Error Messages:**
```html
<!-- No unpublished scenes -->
<div class="alert alert-error">
  ❌ No unpublished scenes available.
  Generate scenes before creating a schedule.
</div>

<!-- Invalid start date -->
<div class="alert alert-error">
  ❌ Start date must be in the future.
</div>

<!-- Too many scenes per week -->
<div class="alert alert-error">
  ❌ Cannot publish more than 10 scenes per week.
</div>
```

**Success Confirmation:**
```html
<div class="alert alert-success">
  ✅ Publishing schedule created!
  25 scenes scheduled for publication.
  First publish: Mon, Nov 11 at 9:00 AM
</div>
```

---

## Manual Controls

### Quick Actions Menu

**Scene-level Actions:**
```
┌─────────────────────────────┐
│  Publish Now                │  ← Immediately publish
│  Reschedule                 │  ← Change date/time
│  Change Visibility          │  ← private/unlisted/public
│  Cancel Publication         │  ← Remove from queue
│  ────────────────────       │
│  Edit Scene                 │  ← Navigate to scene editor
│  Unpublish                  │  ← Revert to draft (if published)
│  Delete Scene               │  ← Destructive action
└─────────────────────────────┘
```

**Chapter-level Actions:**
```
┌─────────────────────────────┐
│  Publish All Scenes         │  ← Bulk publish chapter
│  Unpublish Chapter          │  ← Bulk unpublish
│  Create Schedule            │  ← Chapter-specific schedule
│  Export Chapter             │  ← Download content
└─────────────────────────────┘
```

**Story-level Actions:**
```
┌─────────────────────────────┐
│  Publish Entire Story       │  ← Bulk publish all
│  Unpublish Story            │  ← Bulk unpublish all
│  Edit Schedule              │  ← Modify automation
│  Pause Schedule             │  ← Temporarily stop
│  Delete Schedule            │  ← Remove automation
│  ────────────────────       │
│  View Analytics             │  ← Performance metrics
│  Export Story               │  ← Download all content
└─────────────────────────────┘
```

### Publish Now Dialog

**Triggered by: "Publish Now" action**

```
┌──────────────────────────────────────┐
│  Publish Scene Now?         [✕ Close]│
├──────────────────────────────────────┤
│                                       │
│  📘 Scene 1: "The Ruins"             │
│  Chapter 1: The Beginning             │
│                                       │
│  This will immediately publish the    │
│  scene and make it visible to         │
│  readers on the platform.             │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  Visibility                      │ │
│  │  ○ Public (recommended)          │ │
│  │  ○ Unlisted (link-only)          │ │
│  │  ○ Private (author-only)         │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ✓ Remove from publish queue         │
│  ✓ Notify followers (23)             │
│                                       │
│  [Cancel]          [Publish Now]     │
└──────────────────────────────────────┘
```

### Unpublish Dialog

**Triggered by: "Unpublish" action**

```
┌──────────────────────────────────────┐
│  Unpublish Scene?           [✕ Close]│
├──────────────────────────────────────┤
│                                       │
│  ⚠️  Warning: This action will        │
│  remove the scene from public view.   │
│                                       │
│  📘 Scene 1: "The Ruins"             │
│  Currently published: 3 days ago      │
│  Views: 1,234 • Likes: 89            │
│                                       │
│  What happens:                        │
│  • Scene hidden from readers          │
│  • Removed from community feed        │
│  • Existing links will show "private" │
│  • Analytics data preserved           │
│                                       │
│  ✓ Keep scheduled publications        │
│                                       │
│  [Cancel]            [Unpublish]     │
└──────────────────────────────────────┘
```

### Reschedule Dialog

**Triggered by: "Reschedule" action**

```
┌──────────────────────────────────────┐
│  Reschedule Publication     [✕ Close]│
├──────────────────────────────────────┤
│                                       │
│  📘 Scene 1: "The Ruins"             │
│                                       │
│  Current Schedule:                    │
│  📅 Mon, Nov 11, 2025 at 9:00 AM     │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  New Date *                      │ │
│  │  [Nov 18, 2025 ▼]                │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  New Time *                      │ │
│  │  [09:00 AM ▼]                    │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ✓ Update all future publications    │
│    in this schedule (+7 days)        │
│                                       │
│  [Cancel]         [Reschedule]       │
└──────────────────────────────────────┘
```

### Bulk Operations

**Selection Mode:**
```
┌─────────────────────────────────────────────────┐
│  ☑️  Bulk Select Mode                           │
│  3 scenes selected        [Cancel] [Select All] │
├─────────────────────────────────────────────────┤
│                                                  │
│  ☑️ Scene 1: "The Ruins"               🔵       │
│  ☑️ Scene 2: "The Discovery"           🔵       │
│  ☐ Scene 3: "The Warning"              🔵       │
│  ☑️ Scene 4: "The Journey Begins"      🔵       │
│                                                  │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  [Publish 3]  [Unpublish 3]  [Reschedule]  [❌] │
└─────────────────────────────────────────────────┘
```

**Bulk Action Confirmation:**
```
┌──────────────────────────────────────┐
│  Publish 3 Scenes?          [✕ Close]│
├──────────────────────────────────────┤
│                                       │
│  You are about to publish 3 scenes:   │
│                                       │
│  • Scene 1: "The Ruins"              │
│  • Scene 2: "The Discovery"          │
│  • Scene 4: "The Journey Begins"     │
│                                       │
│  All scenes will be published with    │
│  visibility: Public                   │
│                                       │
│  ✓ Notify followers (23)             │
│                                       │
│  [Cancel]       [Publish All (3)]    │
└──────────────────────────────────────┘
```

---

## User Behavior Flows

### Flow 1: Create Publishing Schedule

**Steps:**
1. User navigates to `/publish`
2. Views story cards
3. Clicks "Create Schedule" on story card
4. Modal opens with schedule builder form
5. User fills form:
   - Name: "Weekly Monday Release"
   - Day: Monday
   - Time: 9:00 AM
   - Scenes per week: 1
   - Start date: Nov 11, 2025
6. Preview updates in real-time
7. User reviews preview (25 scenes, 25 weeks)
8. Clicks "Create Schedule"
9. Loading spinner appears
10. Success toast: "Schedule created! 25 scenes scheduled."
11. Modal closes
12. Story card updates to show "Active Schedule"
13. User clicks "View Timeline" to see schedule

**Decision Points:**
- If no unpublished scenes → Show error "Generate scenes first"
- If form invalid → Show inline validation errors
- If API fails → Show error toast "Failed to create schedule"

### Flow 2: View Publishing Timeline

**Steps:**
1. User clicks "View Timeline" on story card
2. Timeline modal opens (or panel slides in)
3. Calendar view loads with:
   - Current month shown
   - Published scenes (green dots)
   - Scheduled scenes (blue dots)
   - Failed scenes (red dots)
4. User hovers over scene dot
5. Tooltip shows: "Scene 1: The Ruins • 9:00 AM"
6. User clicks scene dot
7. Scene detail panel slides in from right
8. User sees scene metadata, preview, status
9. User clicks "Publish Now"
10. Confirmation dialog appears
11. User confirms
12. Scene publishes, status updates to green
13. Toast: "Scene published successfully!"
14. Timeline refreshes to show updated status

**Alternative Paths:**
- **Drag to reschedule**: User drags blue dot to new date → Reschedule confirmation → Update
- **Switch views**: User clicks "List View" → Timeline switches to vertical list
- **Filter**: User clicks "Filter" → Shows only scheduled scenes

### Flow 3: Manual Scene Publishing

**Steps:**
1. User on timeline list view (mobile)
2. Scrolls to find scene
3. Taps scene card
4. Scene detail panel slides up from bottom
5. User reviews scene content preview
6. Taps "Publish Now" button
7. Confirmation sheet slides up:
   - Visibility options (Public/Unlisted/Private)
   - "Notify followers" checkbox
8. User selects "Public", enables notifications
9. Taps "Publish Now"
10. Loading indicator appears
11. Success animation plays (checkmark)
12. Toast: "Scene published! 23 followers notified."
13. Scene status badge updates to "Published"
14. Panel remains open for next action

**Error Handling:**
- Network error → "Publishing failed. Check connection."
- Server error → "Publishing failed. Try again."
- Scene already published → "Scene already published."

### Flow 4: Manage Failed Publications

**Steps:**
1. User sees red dot on timeline calendar
2. Clicks red dot
3. Scene detail panel opens
4. Status badge shows: "❌ Failed"
5. Error message displays: "Publication failed: Network timeout"
6. Actions available:
   - "Retry Now" (primary)
   - "Reschedule" (secondary)
   - "Cancel Publication" (tertiary)
7. User clicks "Retry Now"
8. Loading spinner on button
9. API retries publication
10. Success: Status changes to "✅ Published"
11. Toast: "Scene published successfully!"
12. Timeline updates (red → green)

**If retry fails:**
- Error count increments
- New error message shown
- User can reschedule or cancel

### Flow 5: Bulk Scene Operations

**Steps:**
1. User on timeline list view
2. Taps "Bulk Select" icon (☑️) in header
3. Checkboxes appear on all scene cards
4. User taps 3 scene checkboxes
5. Bottom action bar slides up:
   - "Publish 3" button
   - "Reschedule" button
   - "Cancel" button
6. User taps "Publish 3"
7. Confirmation dialog appears:
   - Lists all 3 scenes
   - Visibility option
   - Notification toggle
8. User confirms
9. Progress modal appears:
   - "Publishing 3 scenes..."
   - Progress bar: 0/3
10. Scenes publish sequentially:
    - Scene 1: ✅ Published
    - Scene 2: ✅ Published
    - Scene 3: ❌ Failed
11. Results summary:
    - "2 published, 1 failed"
    - "Retry failed scenes?"
12. User taps "Close"
13. Timeline updates with new statuses
14. Bulk select mode exits

### Flow 6: Edit Existing Schedule

**Steps:**
1. User clicks "Manage Schedule" dropdown on story card
2. Dropdown menu opens:
   - Edit Schedule
   - Pause Schedule
   - Delete Schedule
   - View Statistics
3. User clicks "Edit Schedule"
4. Schedule editor modal opens
5. Form pre-filled with current values:
   - Day: Monday
   - Time: 9:00 AM
   - Scenes per week: 1
6. User changes time to 10:00 AM
7. Preview updates to show new schedule
8. Warning appears: "This will reschedule 15 pending publications"
9. User clicks "Update Schedule"
10. Confirmation dialog: "Update 15 publications?"
11. User confirms
12. Loading spinner appears
13. Schedule updates
14. Toast: "Schedule updated! 15 publications rescheduled."
15. Modal closes
16. Story card shows updated time

**Destructive Actions (Pause/Delete):**
- Pause: Confirmation dialog → "Pause schedule? Pending publications won't auto-publish."
- Delete: Warning dialog → "Delete schedule? This cannot be undone. Pending publications will be cancelled."

---

## Responsive Design

### Desktop (≥1024px)

**Layout:**
- Story grid: 3 columns
- Timeline modal: 800px width, centered
- Calendar: Full month grid visible
- Scene detail: Right sidebar (400px)

**Interactions:**
- Hover states on all interactive elements
- Right-click context menus
- Drag-and-drop rescheduling
- Keyboard shortcuts:
  - `Esc`: Close modal
  - `N`: New schedule
  - `T`: Toggle timeline
  - `Arrow keys`: Navigate calendar

### Tablet (768px - 1023px)

**Layout:**
- Story grid: 2 columns
- Timeline modal: Full width with padding
- Calendar: Compact month grid
- Scene detail: Bottom sheet overlay

**Interactions:**
- Touch-optimized tap targets (44px min)
- Long-press for context menus
- Swipe to dismiss modals

### Mobile (≤767px)

**Layout:**
- Story list: Single column, vertical scroll
- Timeline: Full-screen modal
- Calendar: Replaced by list view
- Scene detail: Bottom sheet

**Interactions:**
- Touch-first design
- Swipe gestures:
  - Left: Quick actions menu
  - Right: Close panel
  - Down: Dismiss modal
- Pull-to-refresh
- Bottom-anchored action buttons

**Mobile-Specific Optimizations:**
1. **List View Default**: Calendar too cramped on mobile
2. **Bottom Sheets**: All modals slide from bottom
3. **Large Touch Targets**: 44px minimum
4. **Sticky Headers**: Date headers stick while scrolling
5. **Reduced Motion**: Disable animations if preferred

---

## Interaction Patterns

### Drag-and-Drop Rescheduling

**Desktop Only:**
1. User clicks and holds scene dot in calendar
2. Dot lifts with shadow effect
3. Cursor changes to "grab"
4. User drags to new date cell
5. Target cell highlights on hover
6. User releases mouse
7. Confirmation popover appears:
   ```
   ┌─────────────────────────────┐
   │  Reschedule to Nov 18?      │
   │  [Cancel] [Reschedule]      │
   └─────────────────────────────┘
   ```
8. User confirms
9. Scene dot moves to new cell
10. Timeline updates

**Visual Feedback:**
- Dragging: Scene dot with shadow, 50% opacity
- Valid drop target: Cell highlighted green
- Invalid drop target: Cell highlighted red, cursor "not-allowed"

### Context Menus

**Triggered by: Right-click (desktop) or long-press (mobile)**

**Desktop Context Menu:**
```
┌─────────────────────────────┐
│  📘 Scene 1: "The Ruins"    │
├─────────────────────────────┤
│  Publish Now                │
│  Reschedule                 │
│  View Details               │
│  ────────────────────       │
│  Edit Scene                 │
│  Unpublish                  │
│  Delete                     │
└─────────────────────────────┘
```

**Mobile Long-Press Action Sheet:**
```
┌─────────────────────────────────────┐
│  Scene 1: "The Ruins"               │
│                                      │
│  [Publish Now]                      │
│  [Reschedule]                       │
│  [View Details]                     │
│  [Edit Scene]                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━        │
│  [Unpublish]                        │
│  [Delete] (Destructive)             │
│                                      │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

### Swipe Gestures (Mobile)

**Scene Card Swipe:**
- **Swipe Left**: Reveal quick actions
  ```
  ┌────────────────────────────────────┐
  │ Scene 1: "The Ruins"  │[📅][✅][❌]│
  └────────────────────────────────────┘
                          ↑ Actions
  ```
  - 📅 Reschedule
  - ✅ Publish Now
  - ❌ Cancel

- **Swipe Right**: Mark as read (future feature)

**Modal Dismiss:**
- **Swipe Down**: Dismiss bottom sheet modal

### Loading States

**Skeleton Screens:**
```
┌─────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░                │  ← Shimmer
│ ░░░░░░░░░░░░                       │  ← Shimmer
│                                     │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░         │  ← Shimmer
│ ░░░░░░░░░░░░                       │  ← Shimmer
└─────────────────────────────────────┘
```

**Inline Spinners:**
```html
<button disabled>
  <svg class="spinner" />
  Publishing...
</button>
```

**Progress Bars:**
```
Publishing 3 scenes...
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  50% (2/3)
```

### Toast Notifications

**Success Toast:**
```
┌──────────────────────────────────┐
│ ✅ Scene published successfully! │
│    23 followers notified.         │
└──────────────────────────────────┘
```

**Error Toast:**
```
┌──────────────────────────────────┐
│ ❌ Publishing failed              │
│    Network error. Try again.      │
│    [Retry]                        │
└──────────────────────────────────┘
```

**Info Toast:**
```
┌──────────────────────────────────┐
│ ℹ️  Schedule updated              │
│    15 publications rescheduled.   │
└──────────────────────────────────┘
```

**Position:**
- Desktop: Top-right corner
- Mobile: Top-center (full width)

**Duration:**
- Success: 3 seconds
- Error: Until dismissed or 10 seconds
- Info: 5 seconds

---

## Component Specifications

### StoryCardList Component

**File**: `src/components/publish/StoryCardList.tsx`

```typescript
interface StoryCardListProps {
  stories: Story[];
  loading?: boolean;
  onStoryClick?: (storyId: string) => void;
  onCreateSchedule?: (storyId: string) => void;
}

<StoryCardList
  stories={userStories}
  loading={isLoading}
  onStoryClick={(id) => openTimeline(id)}
  onCreateSchedule={(id) => openScheduleBuilder(id)}
/>
```

**Features:**
- Grid layout (responsive: 1/2/3 columns)
- Empty state when no stories
- Loading state with skeleton cards
- Search and filter controls
- Sort dropdown

### TimelineCalendar Component

**File**: `src/components/publish/TimelineCalendar.tsx`

```typescript
interface TimelineCalendarProps {
  storyId: string;
  month?: Date;
  onSceneClick?: (sceneId: string) => void;
  onReschedule?: (sceneId: string, newDate: Date) => void;
}

<TimelineCalendar
  storyId={story.id}
  month={currentMonth}
  onSceneClick={(id) => openSceneDetail(id)}
  onReschedule={(id, date) => rescheduleScene(id, date)}
/>
```

**Features:**
- Month grid layout
- Color-coded scene dots
- Drag-and-drop rescheduling
- Hover tooltips
- Month navigation

### TimelineList Component

**File**: `src/components/publish/TimelineList.tsx`

```typescript
interface TimelineListProps {
  storyId: string;
  filterStatus?: PublicationStatus[];
  onSceneAction?: (sceneId: string, action: string) => void;
}

<TimelineList
  storyId={story.id}
  filterStatus={['scheduled', 'pending']}
  onSceneAction={(id, action) => handleAction(id, action)}
/>
```

**Features:**
- Vertical list with date headers
- Scene cards with quick actions
- Infinite scroll
- Pull-to-refresh
- Swipe gestures (mobile)

### ScheduleBuilder Component

**File**: `src/components/publish/ScheduleBuilder.tsx`

```typescript
interface ScheduleBuilderProps {
  storyId: string;
  chapterId?: string;
  totalScenes: number;
  onComplete?: (scheduleId: string) => void;
  onCancel?: () => void;
}

<ScheduleBuilder
  storyId={story.id}
  totalScenes={25}
  onComplete={(id) => {
    toast.success('Schedule created!');
    router.push(`/publish?view=${id}`);
  }}
  onCancel={() => closeModal()}
/>
```

**Features:**
- Form with real-time validation
- Schedule preview
- Error handling
- Success callback

### SceneDetailPanel Component

**File**: `src/components/publish/SceneDetailPanel.tsx`

```typescript
interface SceneDetailPanelProps {
  sceneId: string;
  onClose?: () => void;
  onActionComplete?: () => void;
}

<SceneDetailPanel
  sceneId={selectedScene}
  onClose={() => setSelectedScene(null)}
  onActionComplete={() => refreshTimeline()}
/>
```

**Features:**
- Scene metadata display
- Content preview
- Quick action buttons
- Sliding panel animation

### PublishDialog Component

**File**: `src/components/publish/PublishDialog.tsx`

```typescript
interface PublishDialogProps {
  sceneId: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

<PublishDialog
  sceneId={scene.id}
  onConfirm={async () => {
    await publishScene(scene.id);
    toast.success('Published!');
  }}
  onCancel={() => setShowDialog(false)}
/>
```

**Features:**
- Visibility options (radio group)
- Notification toggle
- Confirmation/cancel actions
- Loading state

---

## Related Documents

- **📋 Specification**: `publish-specification.md` - What, why, and how
- **🔧 Development Guide**: `publish-development.md` - API specs and implementation
- **📖 Novels Spec**: `../novels/novels-specification.md` - Scene-based structure
- **🎨 UI System**: `../ui/ui-specification.md` - Component design system

---

**Status**: 📋 Specification
**Last Updated**: 2025-11-04
**Next Steps**: Begin Phase 3 UI implementation (see `publish-development.md`)
