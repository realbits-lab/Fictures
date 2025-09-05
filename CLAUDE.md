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