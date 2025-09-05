# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Information

- **Repository**: https://github.com/realbits-lab/Fictures
- **Owner**: realbits-lab
- **Project**: Fictures - AI-powered content creation platform

## Development Commands

- **Development**: `pnpm dev` - Starts Next.js development server with Turbo
- **Build**: `pnpm build` - Runs database migrations then builds the application
- **Linting**: `pnpm lint` - Runs Next.js ESLint and Biome linter with auto-fix
- **Formatting**: `pnpm format` - Formats code using Biome
- **Type checking**: No explicit typecheck command - use `pnpm build` to verify types

## Development Process Guidelines

When running the development server:
- Execute `dotenv --file .env.local run pnpm dev` as a background process for continuous development to ensure proper environment variable loading
- Redirect output to a log file for monitoring and debugging purposes  
- Check port 3000 availability before starting - if already in use, kill the existing process and restart

### Story Development Workflow

When working with story writing and scene management:
- **Scene Completion**: After you finish writing content for a scene, always set the status of that scene to "completed" via API or UI interaction
- This ensures proper tracking of writing progress and maintains accurate scene status throughout the development workflow

## Database Management Guidelines

**IMPORTANT: Use Neon Database, NOT Supabase**
- This application uses **Neon PostgreSQL database** as configured in `.env.local` 
- The Supabase MCP tool connects to a different database instance and should NOT be used for this project
- Always use the application's built-in database connection (Drizzle ORM) for data operations
- When debugging database issues, use database queries within the application code rather than external tools
- Environment variables must be loaded with `dotenv --file .env.local run` to ensure proper database connectivity

## Database Commands

- **Generate migrations**: `pnpm db:generate` - Generates Drizzle migrations
- **Run migrations**: `pnpm db:migrate` - Applies pending migrations
- **Database studio**: `pnpm db:studio` - Opens Drizzle Studio
- **Push schema**: `pnpm db:push` - Push schema changes directly to database
- **Pull schema**: `pnpm db:pull` - Pull schema from database

## Testing

- **Run tests**: `pnpm test` - Runs Playwright tests with PLAYWRIGHT=True environment variable
- Test configuration in `playwright.config.ts` with projects for `e2e`, `routes`, `authenticated`, and `manual-setup`
- Tests located in `tests/` directory
- Playwright runs on port 3000 with a 240-second timeout

### Authentication Testing
- **Setup**: `npx playwright test --project=manual-setup --headed` - Creates Google OAuth authentication state
- **Authenticated tests**: `npx playwright test --project=authenticated --headed` - Uses saved authentication from `@playwright/.auth/user.json`
- **Debug mode**: `npx playwright test --debug` - Interactive debugging
- **UI mode**: `npx playwright test --ui` - Interactive test runner

Requires `.env.test` file with `GOOGLE_TEST_EMAIL` and `GOOGLE_TEST_PASSWORD` for automated Google OAuth setup.

## Architecture Overview

This is a **Next.js 15 AI-powered web novel platform** with comprehensive community features built with the following stack:

### Core Technologies
- **Framework**: Next.js 15 (App Router with PPR experimental feature)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google OAuth authentication
- **AI Integration**: Powered by Vercel AI SDK with xAI (Grok) as default provider
- **Styling**: Tailwind CSS with shadcn/ui components
- **File Storage**: Vercel Blob for file uploads
- **Caching**: Redis for session storage

### Project Structure

- **`app/`**: Next.js App Router structure with route groups
  - `(auth)/`: Authentication routes with NextAuth.js configuration (`auth.ts`, `auth.config.ts`)
  - `(chat)/`: Main chat application with streaming API routes and bimodal interface
  - `community/`: Community features including forums, groups, contests, and collaboration tools
  - `api/`: API routes for chat, community features, and utility endpoints
- **`lib/`**: Core business logic and configurations
  - `ai/`: AI model abstraction, tool definitions (`tools/`), prompts, and providers
  - `db/`: Drizzle ORM schema, migrations, queries, and database utilities
  - `editor/`: ProseMirror-based rich text editor with diff visualization
  - `artifacts/`: Server-side artifact processing
- **`components/`**: React UI components
  - Core chat components: `chat.tsx`, `message.tsx`, `messages.tsx`
  - Bimodal interface: `artifact.tsx` for canvas view alongside chat
  - Document types: `text-editor.tsx`, `code-editor.tsx`, `sheet-editor.tsx`, `image-editor.tsx`
  - Authentication: `auth-form.tsx`, `sign-out-form.tsx`

### Database Schema

Key tables managed by Drizzle ORM:

#### Core Platform
- **Users**: Authenticated users with Google OAuth
- **Chats**: Chat sessions with visibility settings
- **Messages**: Versioned message system (v2 schema with parts and attachments)
- **Documents**: Text, code, image, and sheet artifacts created during chats  
- **Votes**: User feedback on messages
- **Suggestions**: Document editing suggestions
- **Streams**: Chat streaming sessions

#### Community Features (Phase 3)
- **Forum System**: `forumCategory`, `forumThread`, `forumPost`, `forumModeration`
- **Group System**: `group`, `groupMember`, `groupActivity`, `groupInvitation`
- **Contest System**: `contest`, `contestSubmission`, `contestVote`
- **Gamification**: `achievement`, `userAchievement`, `userLevel`, `leaderboard`
- **Collaboration**: `betaReader`, `betaReaderRequest`, `coAuthor`, `workshop`, `workshopParticipant`
- **Engagement**: `userFollowing`, `notification`, `reportContent`

### Authentication

Authentication system:
- **Authenticated users**: Google OAuth authentication with permitted email validation

### AI Integration

- **Default model**: xAI Grok-2-1212 via `@ai-sdk/xai` provider
- **AI Gateway**: Supports `@ai-sdk/gateway` for provider abstraction
- **Tools**: Document creation/updates, weather, suggestions (see `lib/ai/tools/`)
- **Streaming architecture**: Message parts system with real-time updates
- **Bimodal interface**: Chat conversations alongside interactive artifact canvas
- **Use Vercel AI Element component** for implementing AI UI components

### Key UX Patterns
- **Bimodal chat/canvas**: Primary chat with secondary artifact workspace using Framer Motion animations
- **Version control**: Document versioning with visual diff modes via `diffview.tsx`
- **Real-time collaboration**: Live streaming with visual feedback indicators
- **Community navigation**: Structured community section with forums, groups, contests
- **Gamification**: Achievement system, leaderboards, and user progression
- **Mobile responsive**: Adaptive layout handling with touch-friendly interactions

### Community Features (Phase 3)
- **Forum System**: Categories, threads, posts with AI-powered moderation
- **Group Management**: Public/private groups with role-based permissions
- **Contest Framework**: Multi-phase contests with automated management
- **Gamification Engine**: Achievements, XP/levels, leaderboards, badges
- **Collaboration Tools**: Beta reader marketplace, co-authoring, workshops
- **Engagement Systems**: Following, notifications, content reporting

### Key Configuration Files

- **`drizzle.config.ts`**: Database configuration pointing to `lib/db/schema.ts`
- **`biome.jsonc`**: Biome linting and formatting rules
- **`tailwind.config.ts`**: Custom color system and typography plugin
- **`next.config.ts`**: PPR experimental features and remote image patterns

## Environment Setup

Required environment variables (see `.env.example`):
- `AUTH_SECRET`: Authentication secret key for NextAuth.js
- `XAI_API_KEY`: xAI API key for Grok models (or use `AI_GATEWAY_API_KEY` with Vercel AI Gateway)
- `POSTGRES_URL`: PostgreSQL database connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token for file uploads
- `REDIS_URL`: Redis connection for session caching

Testing environment (`.env.test`):
- `GOOGLE_TEST_EMAIL`: Google account for automated OAuth testing
- `GOOGLE_TEST_PASSWORD`: Password for test account

### Development Setup
1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`
3. Run database migrations: `pnpm db:migrate`  
4. Start development server: `pnpm dev` (runs on port 3000)
5. Use "dev.log" file in root directory for process output when running as background process

### Deployment
- Platform: Optimized for Vercel deployment
- Database: Requires PostgreSQL (Neon recommended)
- Storage: Uses Vercel Blob for file uploads
- Caching: Redis instance required for session management

## Data Fetching and Loading States Guidelines

This project uses **SWR (Stale-While-Revalidate)** for client-side data fetching with **React Loading Skeleton** for loading states. Follow these guidelines for consistent UX across the application.

### SWR Usage Discipline

**When to Use SWR:**
- ✅ Client-side data that needs caching and background updates
- ✅ Data that changes frequently (user stories, progress, community content)  
- ✅ API endpoints that benefit from optimistic updates
- ✅ Dashboard-style interfaces with real-time data needs

**When NOT to Use SWR:**
- ❌ Static content that rarely changes
- ❌ One-time fetches without caching needs
- ❌ Server-side rendered content that doesn't need client updates
- ❌ Authentication flows or critical user actions

**SWR Implementation Pattern:**

```typescript
// 1. Create custom hooks for data management
export function useStories() {
  const { data: session } = useSession();
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    session?.user?.id ? '/api/stories' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 5000,
      errorRetryCount: 3,
    }
  );

  return {
    stories: data?.stories || [],
    isLoading,
    isValidating,
    error,
    refreshStories: () => mutate(),
    // Optimistic update helpers
    addOptimistically: (item) => mutate(current => [...current, item], false),
    updateOptimistically: (id, updates) => mutate(current => 
      current.map(item => item.id === id ? {...item, ...updates} : item), false
    )
  };
}

// 2. Use in components with proper error handling
function MyComponent() {
  const { stories, isLoading, error, refreshStories } = useStories();
  
  if (isLoading) return <SkeletonLoader>...</SkeletonLoader>;
  if (error) return <ErrorState onRetry={refreshStories} />;
  
  return <DataView data={stories} />;
}
```

### Skeleton Loading Discipline

**Skeleton Component Usage:**

```typescript
// Use pre-built skeleton components from src/components/ui/SkeletonLoader.tsx
import { SkeletonLoader, StoryCardSkeleton, DashboardWidgetSkeleton } from "@/components/ui";

// Wrap skeleton content in SkeletonLoader for theme consistency
<SkeletonLoader theme="light">
  <StoryCardSkeleton />
  <DashboardWidgetSkeleton />
</SkeletonLoader>
```

**Loading State Hierarchy:**

1. **Initial Load**: Show full skeleton layout matching the expected content structure
2. **Background Updates**: Small loading indicator (spinner) while revalidating
3. **Error States**: Clear error message with retry functionality
4. **Empty States**: Helpful messaging when no data exists

**Progress Indicator Differentiation:**

There are two distinct types of data fetching that require different visual treatments:

**1. Foreground Fetching Data (Primary Loading)**
- **When**: Initial page load, user-initiated actions, empty state loading
- **Visual Treatment**: 
  - Full skeleton screens with solid, non-transparent colors
  - Prominent loading spinners with thick borders
  - Higher opacity indicators (opacity: 1.0)
  - Larger size indicators (24px+ spinners)
  - Example: `border-4 border-blue-600 border-t-transparent` (thick, solid)

**2. Background Fetching Data (Secondary Loading)**
- **When**: Cache revalidation, background updates, polling, optimistic update confirmations
- **Visual Treatment**:
  - Small, subtle indicators that don't interrupt user flow
  - Transparent or semi-transparent colors
  - Lower opacity indicators (opacity: 0.6-0.8)  
  - Smaller size indicators (12-16px spinners)
  - Example: `border-2 border-blue-300 border-t-blue-600 opacity-60` (thin, subtle)

```typescript
// Foreground Loading (Initial/Primary)
{isLoading && (
  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
)}

// Background Loading (Revalidation/Secondary)  
{isValidating && (
  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin opacity-60" />
)}
```

**Implementation Guidelines:**
- **Never show both types simultaneously** - Background loading should be hidden during foreground loading
- **Position background indicators subtly** - Corner of sections, next to titles, or in headers
- **Use animation timing differences** - Foreground: normal speed, Background: slightly slower
- **Color hierarchy** - Foreground: Primary colors (blue-600), Background: Muted colors (blue-300)

**Skeleton Best Practices:**

- ✅ **Match Content Structure**: Skeleton should mirror the actual layout and dimensions
- ✅ **Use Consistent Theming**: Light/dark mode support via SkeletonLoader wrapper
- ✅ **Progressive Loading**: Show skeleton → data → background updates
- ✅ **Responsive Design**: Skeleton adapts to different screen sizes
- ✅ **Performance**: Minimize skeleton rendering time

**File Organization:**

```
src/
├── hooks/
│   └── useStories.ts          # SWR custom hooks
├── components/ui/
│   └── SkeletonLoader.tsx     # Reusable skeleton components
├── app/
│   └── stories/
│       ├── page.tsx           # Client component using SWR
│       └── loading.tsx        # Next.js loading UI (fallback)
└── api/
    └── stories/
        └── route.ts           # API endpoint optimized for SWR
```

**Example Implementation:**

```typescript
// Custom Hook (src/hooks/useStories.ts)
export function useStories() { /* SWR logic */ }

// Component (src/app/stories/page.tsx)  
export default function StoriesPage() {
  return <DashboardClient />; // Uses SWR hook
}

// Loading Fallback (src/app/stories/loading.tsx)
export default function StoriesLoading() {
  return <SkeletonLoader><StoryCardSkeleton /></SkeletonLoader>;
}

// API Endpoint (src/api/stories/route.ts)
export async function GET() {
  // Return data optimized for client-side caching
  return NextResponse.json({ stories: transformedData });
}
```

### Performance Benefits

**SWR Caching Strategy:**
- **Instant Navigation**: Cached data shows immediately on return visits
- **Background Refresh**: Data stays fresh without blocking UI
- **Request Deduplication**: Multiple components share same cache
- **Optimistic Updates**: UI responds before server confirmation

**User Experience:**
- **First Visit**: Foreground skeleton → API data (2-3 seconds max)
- **Return Visits**: Instant cached data → subtle background refresh indicator
- **Network Issues**: Graceful degradation with retry options
- **Real-time Feel**: Background updates with subtle, non-intrusive loading indicators

**Visual Loading Hierarchy:**
```
Foreground Loading (Blocking):     [████████████] Skeleton + Thick Spinner
Background Loading (Non-blocking): [░░░░] Small Subtle Indicator
```

This dual-loading approach creates an "ultrasync" experience where users see content immediately while ensuring data freshness behind the scenes through differentiated visual feedback.