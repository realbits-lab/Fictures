---
title: "UI Specification - Fictures Platform"
---

# UI Specification - Fictures Platform

## 1. Overview

Fictures is an AI-powered story writing platform built with Next.js 15 and App Router, supporting a 4-level hierarchical narrative system (Story > Part > Chapter > Scene) through the HNS (Hierarchical Narrative Schema) framework. The platform integrates Google Gemini 2.5 Flash for AI assistance, PostgreSQL (Neon) with Drizzle ORM for data management, and NextAuth.js v5 for authentication, providing comprehensive writing tools, community engagement features, and real-time AI-powered assistance across desktop and mobile browsers.

## 2. Key Design Features

### Global Navigation Bar (GNB)

**Implemented Navigation Structure with Role-Based Access:**

**Core Navigation Items:**

- **📖 Fictures Logo**: Home navigation
- **📚 Writing** (`/stories`): Story dashboard and management - Writer/Manager only
- **📚 Reading** (`/browse`): Public story browsing - All users
- **💬 Community** (`/community`): Story discussions and engagement - All users
- **📤 Publish** (`/publish`): Publication management - Writer/Manager only
- **📊 Analytics** (`/analytics`): Writing and reader metrics - Writer/Manager only
- **⚙️ Settings** (`/settings`): User preferences - Authenticated users only

**User Menu (Avatar Dropdown):**
- **🔔 Notifications**: Activity updates and alerts
- **👤 Profile**: User profile management
- **Sign Out**: Session termination

**Navigation Patterns**

**Desktop Navigation Flow:**

```
Dashboard → Story Overview → Part Development → Chapter Writing
     ↓           ↓              ↓              ↓
Community Hub ← Analytics ← Publication ← AI Assistant ← Scene Editor
```

**Mobile Navigation:**

- GNB collapses to hamburger menu on mobile
- Edge-swipe drawer for primary navigation (Write, Community, Publish, Profile)
- Swipe gestures for moving between chapters/scenes
- Long-press context menus for quick actions

### Responsive Design Breakpoints

**Mobile (320px - 768px):**

- Single column layout
- Collapsible sections
- Touch-optimized buttons (44px minimum)
- Simplified navigation with bottom tabs

**Tablet (768px - 1024px):**

- Two-column layout where appropriate
- Expanded side panels for tools
- Touch and cursor hybrid interface

**Desktop (1024px+):**

- Full multi-column layouts
- Persistent tool panels
- Keyboard shortcuts
- Hover states and detailed tooltips

### AI Integration (Google Gemini 2.5 Flash via Vercel AI Gateway)

**Implemented AI Features:**

- **AI Assistant** (`/assistant`): Dedicated AI writing assistant interface
- **Context-Aware Suggestions**: Real-time writing assistance based on HNS structure
- **Content Generation**: Story elements, scenes, characters, and dialogue
- **Text Analysis**: Structure, pacing, and style analysis
- **HNS Integration**: AI-powered story development using Hierarchical Narrative Schema

**AI API Endpoints:**

- `/api/ai/chat`: Interactive AI conversation
- `/api/ai/generate`: Content generation
- `/api/ai/analyze`: Text and structure analysis
- `/api/ai/suggestions`: Context-aware writing suggestions
- `/api/stories/generate-hns`: HNS-based story generation

### Community Integration

**Implemented Community Features:**

- **Community Hub** (`/community`): Central story discussion platform
- **Story Discussions**: Story-specific discussion threads
- **Threaded Comments**: Reply system with nested conversations
- **Public Reading**: No authentication required for story reading
- **Community Stats**: Real-time engagement metrics dashboard

**API Support:**

- `/api/community/stories`: Community story browsing
- `/api/community/discussions`: Discussion thread management
- Community posts and replies through database entities

### Performance & Technical Architecture

**Technology Stack:**

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth.js v5 (beta) with Google OAuth
- **AI Integration**: Google Gemini 2.5 Flash via Vercel AI Gateway
- **State Management**: SWR for data fetching, localStorage for caching

**Data Management:**

- **Autosave**: Chapter content autosaving (`/api/chapters/[id]/autosave`)
- **Skeleton Loading**: Comprehensive loading states across all interfaces
- **Role-Based Access**: Server and client-side authorization
- **Background Processing**: Development server and test runner management

## 3. Core Design Principles

1. **HNS Architecture**: Hierarchical Narrative Schema (Story > Part > Chapter > Scene) drives UI organization
2. **Role-Based Access**: Writer/Manager/Reader roles with appropriate feature visibility
3. **AI-First Writing**: Google Gemini integration for comprehensive writing assistance
4. **Component Architecture**: Reusable UI components with skeleton loading states
5. **Type Safety**: Full TypeScript implementation with strict typing
6. **Authentication Security**: NextAuth.js v5 with Google OAuth and credentials
7. **Mobile-Responsive Design**: Adaptive layouts with mobile navigation support

## 4. Reader Interfaces

Reader interfaces focus on content consumption, community engagement, and discovery of new stories.

### 4.1. Story Reading Interface

**Purpose**: Immersive reading experience with simplified two-level navigation (story → chapter) and community engagement tools.

**Key Components**:

- **Chapter Display Area**: Clean, readable text with customizable typography and themes
- **Progress Indicator**: Reading progress within chapter and overall story completion
- **Navigation Controls**: Previous/next chapter, chapter list, bookmark management
- **Story Navigation**: Direct story-to-chapter navigation without part intermediaries
- **Community Tools**: Chapter-end reply system, theory posting, reaction buttons
- **Reading Preferences**: Font size, background color, reading mode (day/night)
- **Discussion Panel**: Collapsible community discussion area with threaded replies

**User Flow**: Readers select stories and navigate directly to chapters in sequential order, engage with community through replies and theories at chapter breaks, and customize their reading experience without complex hierarchical navigation.

**Functional Requirements**:

- Provide simplified story → chapter navigation structure for readers
- Support direct chapter access through story table of contents
- Enable seamless chapter-to-chapter progression without part boundaries
- Support chapter-end community engagement to maintain reading flow
- Enable bookmarking and reading progress tracking across devices
- Implement reply-based discussion system with threading
- Support accessibility features for diverse reading needs

### 4.2. Community Discovery Interface

**Purpose**: Story discovery platform with community recommendations and trending content.

**Key Components**:

- **Trending Stories Panel**: Popular and highly-rated stories with genre filtering
- **Community Recommendations**: Reader-curated story lists and reviews
- **Genre Explorer**: Browse stories by category, tags, and content warnings
- **Reading History**: Personal library with reading progress and favorites
- **Social Discovery**: Follow favorite authors and readers, see their recommendations
- **Search & Filter Tools**: Advanced search with multiple criteria and sorting options

**User Flow**: Readers discover new content through community recommendations, trending lists, and personalized suggestions based on reading history.

**Functional Requirements**:

- Display personalized story recommendations based on reading preferences
- Enable community-driven content curation and rating systems
- Provide comprehensive search and filtering capabilities
- Support social following and recommendation sharing
- Implement content warning and filtering systems

## 5. Writer Interfaces

Writer interfaces provide comprehensive tools for content creation, story planning, and writing workflow management.

### 5.1. Main Dashboard (`/stories`)

**Purpose**: Central writing dashboard for story management, accessible to writers and managers only.

**Implemented Components**:

- **DashboardClient**: Main dashboard wrapper with loading states
- **CreateStoryCard**: Quick story creation with "+ New Story" interface
- **StoryCard**: Individual story cards showing:
  - Title, genre, and description
  - Progress indicators (parts, chapters, word count)
  - Last updated timestamp
  - Quick actions (View, Edit, Delete)
- **AIAssistantWidget**: AI writing assistant integration
- **PublishingSchedule**: Publication timeline management
- **RecentActivity**: Activity feed for story updates
- **CommunityHighlights**: Featured community discussions

**User Flow**: Entry point showing project overview with quick access to continue writing or view analytics. Story cards navigate to detailed story management.

**Functional Requirements**:

- Display story progress indicators and completion statistics
- Show real-time reader engagement metrics
- Provide quick access to current writing position
- Display scheduled publication timeline
- Integrate AI assistance for story development planning

### 5.2. Story Management (`/stories/[id]`)

**Purpose**: Individual story management with HNS structure visualization and editing.

**Implemented Features**:

- **Story Details**: Title, genre, description, visibility settings
- **HNS Structure Management**:
  - Central theme and questions
  - Character hierarchy with detailed profiles
  - Part organization (Act 1, 2, 3)
  - Chapter and scene breakdown
- **Database Entities**:
  - `stories` table with HNS JSON fields
  - `parts`, `chapters`, `scenes` for hierarchy
  - `characters` with personality and backstory
  - `places` for setting management
- **Quick Actions**:
  - New Chapter creation (`/stories/[id]/new-chapter`)
  - Edit story structure
  - Generate HNS with AI

**User Flow**: Strategic story management interface for planning and tracking overall narrative development. Users can manage story structure, continue writing, or dive into detailed part development.

**Functional Requirements**:

- Display hierarchical progress from story level down to chapters
- Enable editing of core story elements (themes, central questions, character roles)
- Provide visual part structure management with quick navigation
- Integrate AI assistance for story-level development planning
- Support world building and thematic element organization
- Show real-time reader engagement and story performance metrics

### 5.3. Part Development Interface

**Purpose**: Focused part-level management providing detailed chapter organization, character arc tracking, and plot thread management.

**Key Components**:

- **Part Overview Panel**: Central question, progress metrics, word targets, and completion status
- **Chapter Progress Grid**: Individual chapter cards showing word counts, publication status, and reader engagement
- **Character Development Tracker**: Visual arc progression for major characters within the part
- **Plot Thread Manager**: Active storyline tracking with progress indicators and resolution planning
- **AI Part Assistant**: Context-aware suggestions for part-level narrative development
- **Cliffhanger Planning Tools**: Strategic hook planning and reader engagement optimization

**User Flow**: Detailed part management interface for organizing chapters and tracking character development. Users can continue writing individual chapters or plan detailed chapter/scene structure.

**Functional Requirements**:

- Display chapter-level progress with publication scheduling
- Track character arc development within part boundaries
- Manage active plot threads and their resolution progress
- Provide AI assistance for part-level narrative planning
- Enable quick navigation to chapter writing and scene planning
- Support deadline management and reader anticipation tracking

### 5.4. Unified Writing Interface (`/write/[chapterId]`)

**Purpose**: Comprehensive writing environment with scene management and AI assistance.

**Implemented Components**:

- **UnifiedWritingEditor**: Main writing interface with:
  - Rich text editor for chapter content
  - Scene-based writing structure
  - Character and place management panels
  - Real-time word count tracking
- **API Integration**:
  - `/api/chapters/[id]/autosave`: Automatic content saving
  - `/api/chapters/[id]/scenes`: Scene management
  - `/api/ai/suggestions`: Context-aware AI assistance
- **HNS Support**:
  - Scene structure with purpose and goals
  - Character involvement tracking
  - Place/setting integration
- **Publishing Controls**:
  - Save draft functionality
  - Publish chapter option
  - Preview mode

**User Flow**: Immersive writing interface prioritizing content creation while providing contextual assistance and progress tracking. Users focus on writing with AI and analytics support always available.

**Functional Requirements**:

- Provide distraction-free writing environment with formatting support
- Implement scene-based writing structure with Goal-Conflict-Outcome framework
- Deliver real-time AI suggestions for narrative enhancement
- Track writing analytics including pace, dialogue balance, and emotional flow
- Enable quick access to character information and story research
- Support automatic saving and version management

### 5.5. Mobile Writing Interface

**Purpose**: Touch-optimized writing interface maximizing screen real estate while maintaining essential functionality.

**Key Components**:

- **Collapsible Header**: Chapter title and essential controls (save, publish) with hamburger menu
- **Progress Indicator**: Word count and scene progress prominently displayed
- **Expanded Writing Area**: Maximum screen space dedicated to text input
- **Contextual AI Panel**: Collapsible AI assistance with quick apply/dismiss options
- **Floating Action Button (FAB)**: Context-sensitive primary action button that adapts to current writing state

**Mobile-Specific Features**:

- Touch-friendly buttons (44px minimum)
- Swipe gestures for chapter/scene navigation
- Long-press context menus for quick actions
- Collapsible tool panels to maximize writing space
- Optimized virtual keyboard interaction

**User Flow**: Mobile-first writing experience prioritizing content creation with contextual tools available on demand.

**Functional Requirements**:

- Maximize writing area while maintaining essential functionality
- Implement touch-friendly interaction patterns
- Provide contextual AI assistance without cluttering interface
- Support gesture-based navigation between scenes and chapters
- Ensure comfortable typing experience with proper keyboard optimization

## 6. Manager Interfaces

Manager interfaces provide comprehensive tools for publication management, community moderation, and business analytics.

### 6.1. Publication Center (`/publish`)

**Purpose**: Publication management interface for writers and managers.

**Implemented Features**:

- **Publishing Dashboard**: Overview of publication status
- **Chapter Publishing**:
  - `/api/chapters/[id]/publish`: Publication API
  - Draft to published state transition
  - Visibility controls (public/private)
- **Story Visibility**:
  - `/api/stories/[id]/visibility`: Visibility management
  - Public sharing for community access
- **Database Support**:
  - `isPublished` flags on chapters
  - `visibility` field on stories
  - Publication timestamps
- **Publishing Schedule Component**: Timeline visualization

**User Flow**: Strategic publication management interface enabling authors to schedule releases, monitor performance, and optimize reader engagement.

**Functional Requirements**:

- Provide calendar-based publication scheduling with status tracking
- Enable immediate or scheduled publishing with preview capabilities
- Display comprehensive analytics for published content performance
- Suggest optimal publication timing based on reader activity patterns
- Support community engagement features (comments, theories, polls)
- Include subscriber management and notification controls

### 6.2. Community Hub Management Interface

**Purpose**: Comprehensive reader engagement platform facilitating author-reader interaction, feedback management, and community building.

**Key Components**:

- **Trending Discussions Panel**: Popular theories, predictions, and analysis posts with engagement metrics
- **Community Statistics Dashboard**: Reader activity, comment volume, and engagement trends
- **Recent Comments Feed**: Latest reader feedback on published chapters with moderation tools
- **Fan Content Gallery**: Reader-created art, music, theories, and derivative works
- **Author Update Stream**: Communication channel for author-reader interaction
- **Community Management Tools**: Moderation controls, settings, and notification management

**User Flow**: Central hub for community engagement allowing authors to monitor reader response, participate in discussions, and manage fan interactions.

**Functional Requirements**:

- Display trending discussions with reply and reaction tracking
- Provide comprehensive community engagement analytics
- Enable author response to comments with highlighting and pinning options
- Support fan content discovery and promotion
- Facilitate author-reader communication through update posts
- Include community moderation and management tools

### 6.3. Analytics Dashboard (`/analytics`)

**Purpose**: Writing and reader analytics for writers and managers.

**Implemented Features**:

- **User Statistics**:
  - Total words written
  - Stories published
  - Writing streaks
  - Progress tracking
- **Story Analytics**:
  - View counts
  - Reader engagement
  - Chapter performance
- **API Endpoints**:
  - `/api/analytics/readers`: Reader analytics
  - `/api/analytics/stories`: Story performance
- **Database Support**:
  - `userStats` table for tracking
  - View and engagement counting
- **Visual Components**:
  - Progress indicators
  - Stats cards
  - Activity graphs

**User Flow**: Data-driven decision making interface for optimizing story performance, reader engagement, and business outcomes.

**Functional Requirements**:

- Display comprehensive performance metrics with historical trends
- Provide actionable insights for story and community optimization
- Support data export and custom reporting capabilities
- Enable A/B testing for publication strategies and community features
- Integrate predictive analytics for strategic planning
- Offer benchmarking against genre and platform averages

## 7. Implementation Specifications

**Component Architecture**:

- **UI Components**: Custom Button, Card, Input, Textarea, Badge, Progress components
- **Layout Components**: MainLayout, GlobalNavigation, SettingsSidebar
- **Loading States**: SkeletonLoader system across all data-fetching interfaces
- **Theme System**: CSS variables for light/dark theme support

**Authentication & Authorization**:

- **NextAuth.js v5** with Google OAuth and Credentials providers
- **Role-Based Access**: reader, writer, manager roles
- **Protected Routes**: Middleware-based route protection
- **Session Management**: JWT-based sessions with automatic refresh

**Database Architecture (PostgreSQL with Drizzle ORM)**:

- **HNS Tables**: stories, parts, chapters, scenes, characters, places
- **User Tables**: users, userPreferences, userStats, accounts, sessions
- **Community Tables**: communityPosts, communityReplies
- **AI Tables**: aiInteractions for usage tracking

**Testing Infrastructure**:

- **Playwright E2E Tests**: Google OAuth authentication flow
- **Jest Unit Tests**: Component and utility testing
- **Test Data**: `.auth/user.json` for automated authentication

## 8. Settings System

**Comprehensive Settings Pages** (`/settings/*`):

- **General Settings** (`/settings`): Account basics and preferences
- **Appearance** (`/settings/appearance`): Theme selection (light/dark/system)
- **Writing** (`/settings/writing`): Writing goals and preferences
- **AI Assistant** (`/settings/ai-assistant`): AI model and behavior settings
- **Notifications** (`/settings/notifications`): Email and push preferences
- **Privacy** (`/settings/privacy`): Profile visibility and data sharing
- **Analytics** (`/settings/analytics`): Analytics collection preferences

**Settings Implementation**:

- **SettingsSidebar**: Navigation component for settings pages
- **Database**: `userPreferences` table for persistent storage
- **API**: `/api/settings/*` endpoints for preference management

## 9. Development & Deployment

**Development Commands**:
```bash
# Development with environment variables
dotenv --file .env.local run pnpm dev

# Database management
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open database studio

# Testing
dotenv --file .env.local run npx playwright test --headless
dotenv --file .env.local run pnpm test
```

**Environment Configuration**:
- NextAuth authentication with Google OAuth
- Neon PostgreSQL database connection
- Vercel AI Gateway for Gemini integration
- Vercel Blob storage for assets

This specification reflects the actual implementation of the Fictures platform, providing a comprehensive reference for the current UI architecture, components, and features across all device types and user roles.
