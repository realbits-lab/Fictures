---
title: "Reading Feature Specification"
---

# Reading Feature Specification

This document outlines the specifications for enhancing the reading experience on Fictures with reply features, responsive mobile design, and engagement features (like/dislike buttons).

## Table of Contents
1. [Reply Feature](#reply-feature)
2. [Responsive Mobile Design](#responsive-mobile-design)
3. [Like and Dislike Feature](#like-and-dislike-feature)

---

## Reply Feature

### Overview
Allow readers to leave comments and engage in threaded discussions on chapters and scenes.

### Database Schema Changes

#### New Table: `comments`
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE, -- For threaded replies
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete for preserving thread structure
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_comments_chapter ON comments(chapter_id);
CREATE INDEX idx_comments_scene ON comments(scene_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_user ON comments(user_id);
```

#### New Table: `comment_likes`
```sql
CREATE TABLE comment_likes (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);
```

### UI Components

#### CommentSection Component
Location: `src/components/reading/CommentSection.tsx`

**Features:**
- Display comments for current chapter/scene
- Threaded reply support (max 3 levels deep)
- Inline reply form
- Sort options: "Newest", "Oldest", "Most Liked"
- Pagination (20 comments per page)
- Real-time update indicators

**Props:**
```typescript
interface CommentSectionProps {
  storyId: string;
  chapterId?: string;
  sceneId?: string;
  isAuthenticated: boolean;
}
```

#### CommentItem Component
Location: `src/components/reading/CommentItem.tsx`

**Features:**
- User avatar and name
- Comment content with markdown support
- Timestamp (relative: "2 hours ago")
- Like button with count
- Reply button
- Edit/Delete buttons (for comment author)
- "Load more replies" for threaded comments
- Edit indicator if edited
- "[deleted]" placeholder for deleted comments with preserved thread structure

**Props:**
```typescript
interface CommentItemProps {
  comment: Comment;
  depth: number; // 0-3, for indentation control
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, newContent: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}
```

#### CommentForm Component
Location: `src/components/reading/CommentForm.tsx`

**Features:**
- Textarea with auto-resize
- Character limit: 5000 characters
- Markdown preview toggle
- Submit/Cancel buttons
- Loading state during submission
- Error handling with user feedback

**Props:**
```typescript
interface CommentFormProps {
  parentCommentId?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
}
```

### API Endpoints

#### GET `/api/stories/[storyId]/comments`
**Query Parameters:**
- `chapterId` (optional): Filter by chapter
- `sceneId` (optional): Filter by scene
- `parentId` (optional): Get replies to specific comment
- `sort`: "newest" | "oldest" | "liked" (default: "newest")
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)

**Response:**
```typescript
{
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

#### POST `/api/stories/[storyId]/comments`
**Body:**
```typescript
{
  content: string;
  chapterId?: string;
  sceneId?: string;
  parentCommentId?: string;
}
```

**Response:**
```typescript
{
  comment: Comment;
}
```

#### PATCH `/api/comments/[commentId]`
**Body:**
```typescript
{
  content: string;
}
```

**Response:**
```typescript
{
  comment: Comment;
}
```

#### DELETE `/api/comments/[commentId]`
**Response:**
```typescript
{
  success: boolean;
}
```

#### POST `/api/comments/[commentId]/like`
**Response:**
```typescript
{
  isLiked: boolean;
  likeCount: number;
}
```

### Integration Points

Update `ChapterReader` component (src/components/reading/ChapterReader.tsx):
- Add `<CommentSection>` below chapter content
- Position after navigation buttons
- Add "Comments" section header with count
- Implement scroll-to-comments functionality

---

## Responsive Mobile Design

### Overview
Optimize the reading experience for mobile devices with touch-friendly UI, adaptive layouts, and performance optimizations.

### Breakpoints
```css
/* Tailwind CSS default breakpoints */
sm: 640px   /* Mobile landscape / Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large desktop */
```

### Layout Adaptations

#### Mobile Layout (< 768px)
**Current Implementation Issues:**
- Left sidebar (chapter list) takes 320px, too wide for mobile
- Top navigation bar has too many elements
- Font sizes are not optimized for mobile reading
- Touch targets are too small (< 44px)

**Proposed Changes:**

##### 1. Collapsible Chapter Sidebar
```typescript
// Add mobile drawer for chapter navigation
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

// Mobile: Show as slide-in drawer
// Desktop: Show as fixed sidebar
```

**Mobile Sidebar Behavior:**
- Default: Hidden, overlay drawer
- Toggle: Hamburger button in top bar
- Animation: Slide in from left with backdrop
- Width: 90% of screen width (max 320px)
- Close: Tap backdrop or select chapter
- Scroll: Independent from main content

##### 2. Simplified Top Navigation Bar

**Desktop (≥ 768px):**
```
[← Browse / Story Title / Chapter #] | [← Prev] [1 of 10] [Next →] [Stats] [Share]
```

**Mobile (< 768px):**
```
[☰] [Story Title] [⋮]
```

**Mobile Menu Dropdown:**
- Chapter navigation (← Prev | Next →)
- Chapter counter (1 of 10)
- Share button
- Settings (font size, theme)
- Statistics (word count)

##### 3. Reading Area Optimizations

**Font Size Scaling:**
```css
/* Mobile */
.prose {
  @apply text-base leading-relaxed;
}

/* Tablet */
@media (min-width: 768px) {
  .prose {
    @apply text-lg leading-loose;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .prose {
    @apply text-xl leading-loose;
  }
}
```

**Padding & Margins:**
```css
/* Mobile: Reduced padding for more content */
.chapter-content {
  @apply px-4 py-6;
}

/* Desktop: Wider margins for readability */
@media (min-width: 768px) {
  .chapter-content {
    @apply px-8 py-8 max-w-4xl mx-auto;
  }
}
```

##### 4. Touch Targets

**Minimum Size:** 44x44px for all interactive elements
```css
/* Chapter navigation buttons */
.chapter-nav-button {
  @apply min-w-[44px] min-h-[44px] p-3;
}

/* Comment buttons */
.comment-action-button {
  @apply min-w-[44px] min-h-[44px];
}
```

### Mobile-Specific Features

#### 1. Reading Progress Indicator
- Sticky progress bar at top
- Shows: [Chapter X of Y] [Page scroll %]
- Minimal, non-intrusive design

#### 2. Bottom Navigation Bar
**Status:** ✅ IMPLEMENTED

**Implementation:** Bottom navigation bar is always visible on ALL screen sizes (not just mobile).

**Design Decision:**
- Originally spec'd as "Mobile Only"
- Implemented as "Always Visible" for consistent UX across devices
- Provides persistent access to navigation controls

**Current Behavior:**
```
[← Prev Scene] [Scene 1 / 5] [Next Scene →]
```

**Key Features:**
- **Position:** Fixed at bottom, translucent background with backdrop blur
- **Visibility:** Always visible, does not hide on scroll (unlike top GNB)
- **Desktop:** Always visible (changed from original immersive mode behavior)
- **Mobile:** Always visible (unchanged)
- **Touch targets:** Optimized for mobile (44x44px minimum)

**Rationale for Always-Visible:**
1. **Consistent experience** across all devices
2. **Always accessible** - no scroll/tap needed
3. **Bottom position** doesn't obstruct content
4. **Essential navigation** controls always available

**Immersive Mode:**
- Top GNB (story/scene title bar): Hides on scroll down, shows on scroll up
- Bottom Navigation: Always visible regardless of scroll
- This provides reading focus while maintaining navigation access

**Implementation Details:**
- File: `src/components/reading/ChapterReaderClient.tsx:917`
- Removed conditional `isUIVisible` logic for bottom nav
- Simplified to static fixed positioning
- z-index layering ensures proper stacking with sidebar

**Test Coverage:**
- Automated test: `scripts/test-bottom-nav-always-visible.mjs`
- Verified: Visible on desktop/mobile, before/after scroll
- No flickering or visual glitches

#### 3. Gesture Support
- Swipe left/right: Navigate between chapters
- Tap margins: Quick navigation (left = prev, right = next)
- Double-tap: Toggle chapter list
- Pinch: Adjust font size

#### 4. Reading Settings Panel
Slide-up panel from bottom with:
- Font size slider (12px - 24px)
- Line height adjustment
- Theme toggle (light/dark/sepia)
- Font family selector (serif, sans-serif, mono)

### Performance Optimizations

#### 1. Lazy Loading
```typescript
// Load chapter content on demand
const { data: chapterContent } = useSWR(
  selectedChapterId ? `/api/chapters/${selectedChapterId}` : null,
  { revalidateOnFocus: false }
);
```

#### 2. Image Optimization
```typescript
// Use Next.js Image component with responsive sizes
<Image
  src={imageSrc}
  alt={alt}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy"
/>
```

#### 3. Virtual Scrolling for Comments
```typescript
// Use react-window for long comment threads
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={comments.length}
  itemSize={120}
  width="100%"
>
  {CommentRow}
</FixedSizeList>
```

### Responsive Component Updates

#### Update ChapterReader.tsx

**Add Mobile State:**
```typescript
const [isMobile, setIsMobile] = useState(false);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

**Conditional Rendering:**
```typescript
{isMobile ? (
  <MobileReadingLayout
    story={story}
    selectedChapter={selectedChapter}
    onChapterChange={setSelectedChapterId}
    isSidebarOpen={isSidebarOpen}
    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
  />
) : (
  <DesktopReadingLayout
    story={story}
    selectedChapter={selectedChapter}
    onChapterChange={setSelectedChapterId}
  />
)}
```

---

## Like and Dislike Feature

### Overview
Enable readers to express feedback on stories, chapters, and scenes through like/dislike actions.

### Scope Decision: Like Only (Recommended)

**Reasoning:**
1. **Positive Focus**: Encourages constructive feedback
2. **Simpler UX**: Reduces decision fatigue
3. **Industry Standard**: Used by Medium, Wattpad, AO3
4. **Author Mental Health**: Reduces negative impact on writers
5. **Data Quality**: Like-only provides clearer engagement signal

**Alternative**: Implement both like/dislike with ratio hidden from authors until threshold (e.g., 100+ votes)

### Database Schema Changes

#### Update `stories` table
```sql
ALTER TABLE stories
ADD COLUMN like_count INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX idx_stories_like_count ON stories(like_count DESC);
```

#### Update `chapters` table
```sql
ALTER TABLE chapters
ADD COLUMN like_count INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX idx_chapters_like_count ON chapters(like_count DESC);
```

#### Update `scenes` table
```sql
ALTER TABLE scenes
ADD COLUMN like_count INTEGER DEFAULT 0 NOT NULL;
```

#### New Table: `story_likes`
```sql
CREATE TABLE story_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, story_id)
);

CREATE INDEX idx_story_likes_user ON story_likes(user_id);
CREATE INDEX idx_story_likes_story ON story_likes(story_id);
```

#### New Table: `chapter_likes`
```sql
CREATE TABLE chapter_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX idx_chapter_likes_user ON chapter_likes(user_id);
CREATE INDEX idx_chapter_likes_chapter ON chapter_likes(chapter_id);
```

#### New Table: `scene_likes`
```sql
CREATE TABLE scene_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, scene_id)
);

CREATE INDEX idx_scene_likes_user ON scene_likes(user_id);
CREATE INDEX idx_scene_likes_scene ON scene_likes(scene_id);
```

### UI Components

#### LikeButton Component
Location: `src/components/reading/LikeButton.tsx`

**Features:**
- Heart icon (outlined when not liked, filled when liked)
- Like count display
- Animated on click (scale + color change)
- Loading state during API call
- Optimistic UI update
- Requires authentication (show login prompt if not authenticated)
- Tooltip: "Like this [story/chapter/scene]"

**Props:**
```typescript
interface LikeButtonProps {
  targetType: 'story' | 'chapter' | 'scene';
  targetId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}
```

**Component Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { cn } from '@/lib/utils/cn';

export function LikeButton({
  targetType,
  targetId,
  initialLikeCount,
  initialIsLiked,
  onLikeChange,
  size = 'md',
  showCount = true,
  className
}: LikeButtonProps) {
  const { data: session } = useSession();
  const { openAuthModal } = useAuthModal();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = async () => {
    if (!session) {
      openAuthModal();
      return;
    }

    setIsLoading(true);
    setIsAnimating(true);

    // Optimistic update
    const newIsLiked = !isLiked;
    const newCount = isLiked ? likeCount - 1 : likeCount + 1;
    setIsLiked(newIsLiked);
    setLikeCount(newCount);

    try {
      const response = await fetch(`/api/${targetType}s/${targetId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
      onLikeChange?.(data.isLiked, data.likeCount);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!newIsLiked);
      setLikeCount(isLiked ? likeCount : likeCount - 1);
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isAnimating && 'scale-110',
        className
      )}
      title={isLiked ? `Unlike this ${targetType}` : `Like this ${targetType}`}
    >
      <svg
        className={cn(
          sizeClasses[size],
          'transition-all',
          isLiked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-500 dark:text-gray-400'
        )}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showCount && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {likeCount}
        </span>
      )}
    </button>
  );
}
```

### Integration Points

#### 1. Story Card (Browse Page)
Location: `src/components/browse/StoryGrid.tsx`

Add like button to story card:
```typescript
<LikeButton
  targetType="story"
  targetId={story.id}
  initialLikeCount={story.likeCount}
  initialIsLiked={story.isLikedByUser}
  size="sm"
  showCount={true}
/>
```

#### 2. Chapter Header (Reading Page)
Location: `src/components/reading/ChapterReader.tsx`

Add like button in chapter header:
```typescript
<div className="flex items-center gap-4 mt-4">
  <LikeButton
    targetType="chapter"
    targetId={selectedChapter.id}
    initialLikeCount={selectedChapter.likeCount}
    initialIsLiked={selectedChapter.isLikedByUser}
    size="md"
    showCount={true}
  />
  <span className="text-sm text-gray-500">
    {selectedChapter.wordCount} words
  </span>
</div>
```

#### 3. Scene Content (Optional)
Location: `src/components/reading/ChapterReader.tsx`

Add inline like buttons for scenes:
```typescript
<div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
  <LikeButton
    targetType="scene"
    targetId={scene.id}
    initialLikeCount={scene.likeCount}
    initialIsLiked={scene.isLikedByUser}
    size="sm"
    showCount={true}
  />
</div>
```

### API Endpoints

#### POST `/api/stories/[storyId]/like`
**Response:**
```typescript
{
  isLiked: boolean;
  likeCount: number;
}
```

#### POST `/api/chapters/[chapterId]/like`
**Response:**
```typescript
{
  isLiked: boolean;
  likeCount: number;
}
```

#### POST `/api/scenes/[sceneId]/like`
**Response:**
```typescript
{
  isLiked: boolean;
  likeCount: number;
}
```

#### GET `/api/users/[userId]/likes`
Get user's liked content for profile page.

**Query Parameters:**
- `type`: 'story' | 'chapter' | 'scene' (optional, default: all)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
```typescript
{
  likes: {
    story?: Story;
    chapter?: Chapter;
    scene?: Scene;
    createdAt: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Analytics & Insights

#### Author Dashboard Metrics
Location: `src/app/analytics/page.tsx`

**Story Performance:**
- Total likes across all stories
- Like trend over time (chart)
- Most liked chapters
- Like-to-view ratio

**Chapter Performance:**
- Likes per chapter (table)
- Engagement rate (likes / views)
- Drop-off points (chapters with low engagement)

**Example Query:**
```typescript
// Get chapter performance
const chapterStats = await db
  .select({
    chapterId: chapters.id,
    title: chapters.title,
    likeCount: chapters.likeCount,
    viewCount: chapters.viewCount,
    engagementRate: sql<number>`(${chapters.likeCount}::float / NULLIF(${chapters.viewCount}, 0) * 100)`
  })
  .from(chapters)
  .where(eq(chapters.storyId, storyId))
  .orderBy(desc(sql`engagement_rate`));
```

---

## Implementation Plan

### Phase 1: Like Feature (Week 1)
1. Database migrations for like tables
2. Implement LikeButton component
3. Create API endpoints for like actions
4. Integrate like buttons in reading interface
5. Add like count to story cards

### Phase 2: Mobile Responsive Design (Week 2)
1. Implement mobile drawer for chapter navigation
2. Create simplified mobile top bar
3. Add bottom action bar for mobile
4. Implement reading settings panel
5. Add gesture support
6. Performance optimizations (lazy loading, virtual scrolling)

### Phase 3: Reply Feature (Week 3)
1. Database migrations for comments
2. Implement CommentSection, CommentItem, CommentForm components
3. Create API endpoints for comments
4. Add markdown support and preview
5. Implement threaded replies
6. Add comment notifications

### Phase 4: Testing & Polish (Week 4)
1. Unit tests for all new components
2. E2E tests for critical user flows
3. Mobile device testing (iOS/Android)
4. Performance testing and optimization
5. Accessibility audit (WCAG 2.1 AA compliance)
6. User acceptance testing

---

## Success Metrics

### Engagement Metrics
- Comment rate: % of readers who leave comments
- Reply rate: % of comments that receive replies
- Like rate: % of readers who like content
- Session duration: Average reading time per visit
- Return rate: % of readers who return within 7 days

### Performance Metrics
- Mobile page load time: < 3s on 3G
- Time to interactive: < 5s on mobile
- Lighthouse mobile score: > 90
- Core Web Vitals: All metrics in "Good" range

### Quality Metrics
- Comment spam rate: < 1%
- Comment moderation rate: < 5%
- User satisfaction: > 4.0/5.0 rating
- Mobile bounce rate: < 40%

---

## Future Enhancements

### Advanced Reply Features
- @mentions for users
- Comment reactions (beyond like)
- Comment sorting: controversial, best
- Comment search and filtering
- Author highlighting
- Pin important comments

### Enhanced Mobile Experience
- Offline reading mode
- Text-to-speech integration
- Reading statistics dashboard
- Customizable gestures
- Reading goals and streaks

### Social Features
- Share comments on social media
- Quote and highlight sharing
- Reader badges and achievements
- Follow favorite authors
- Collaborative reading rooms

---

## References

### Design Inspiration
- **Wattpad**: Mobile reading experience, comment system
- **Medium**: Clean reading UI, engagement features
- **Archive of Our Own (AO3)**: Threaded comments, kudos system
- **Webnovel**: Chapter-based navigation, like system

### Technical Resources
- [React Window Documentation](https://react-window.vercel.app/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
