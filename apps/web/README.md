<a href="https://github.com/realbits-lab/Fictures">
  <img alt="Fictures - AI-powered story writing and reading platform" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Fictures</h1>
</a>

<p align="center">
  An AI-powered story writing and reading platform that helps authors create structured, compelling narratives with intelligent assistance.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a> ·
  <a href="#api-documentation"><strong>API</strong></a> ·
  <a href="#testing"><strong>Testing</strong></a> ·
  <a href="#roadmap"><strong>Roadmap</strong></a>
</p>

<br/>

## Overview

Fictures is a full-stack web application built with Next.js 15 that provides a comprehensive platform for story writing and reading. It combines advanced AI assistance with a hierarchical story structure (Stories → Parts → Chapters → Scenes) to help authors craft better narratives.

**Current Status**: Production-ready for writing, reading, and community discussion features. See [Roadmap](#roadmap) for planned features.

## Features

### 📝 Story Writing & Creation

- **Hierarchical Story Structure**: Organize your story into Parts → Chapters → Scenes
- **AI-Powered Writing Assistant**:
  - Story generation with Adversity-Triumph Engine methodology
  - Scene content generation (dialogue, description, action)
  - Character development suggestions
  - Story analysis and improvement recommendations
  - Dialogue formatting and enhancement
  - AI-generated scene images
- **Rich Text Editor**: ProseMirror/TipTap-based editor with advanced formatting
- **Character & Setting Management**: Visual character grid with AI-generated images
- **Auto-save & Version Control**: Never lose your work
- **Writing Analysis**: Word count tracking, scene evaluation scores
- **Story Export**: Download your complete story

### 📚 Reading & Discovery

- **Genre-Based Discovery**: Browse stories across 7 genres (Fantasy, Science Fiction, Romance, Mystery, Thriller, Horror, Adventure)
- **Advanced Reading Interface**:
  - Scene-by-scene navigation with sidebar
  - Independent scroll areas for content and navigation
  - Reading progress tracking
  - Cross-device history synchronization
  - **Immersive Reading Mode**: Auto-hide UI on scroll, tap-to-toggle visibility, sticky bottom navigation
- **Trending & Featured Stories**: Discover popular content
- **Story Statistics**: View counts, ratings, word counts
- **Engagement**: Comment, rate, and like stories/chapters/scenes

### 💬 Community Discussions

- **Story-Specific Forums**: Discussion boards for each story
- **Post Types**: Discussion, Theory, Review, Question
- **Threaded Replies**: Nested comment system
- **Content Moderation**: Approved, pending, flagged, rejected status
- **Post Management**: Pin, lock, and moderate posts
- **Engagement Metrics**: Likes, views, and activity tracking

### 🚀 Publishing & Automation

- **Automated Publishing**: Schedule releases for stories, chapters, and scenes
- **Schedule Types**: Daily, weekly, custom intervals, one-time
- **Smart Scheduling**: Set specific publish times and days
- **Timeline View**: Visual publication schedule
- **Status Tracking**: Monitor pending, published, failed publications

### 📊 Analysis & Insights

- **Story Performance**: Views, engagement metrics, reader analysis
- **AI-Generated Insights**: Automated recommendations for story improvement
- **Session Tracking**: Detailed reading session analysis
- **Event Tracking**: 11 event types including page views, likes, comments

## Tech Stack

### Core Framework
- **[Next.js 15](https://nextjs.org)** - React framework with App Router and Server Components
- **[React 19](https://react.dev)** - Latest React with Server Components
- **[TypeScript](https://www.typescriptlang.org)** - Type-safe development

### AI Integration
- **[Vercel AI SDK](https://sdk.vercel.ai)** - Unified AI interface
- **Support for**: OpenAI, Anthropic, Google, Fireworks, and more
- **[Vercel AI Gateway](https://vercel.com/docs/ai-gateway)** - Centralized AI request management

### Database & Storage
- **[PostgreSQL](https://postgresql.org)** - Primary database (via Neon)
- **[Drizzle ORM](https://orm.drizzle.team)** - Type-safe database access
- **[Vercel Blob](https://vercel.com/storage/blob)** - File storage for images
- **[Redis](https://redis.io)** (Upstash) - Session storage and caching

### Authentication
- **[NextAuth.js v5](https://authjs.dev)** - Authentication framework
- **Google OAuth** - Primary authentication method
- **Credentials Provider** - Email/password authentication
- **API Key Authentication** - Scope-based authorization

### UI & Styling
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com)** - Component library
- **[Radix UI](https://radix-ui.com)** - Accessible primitives
- **[TipTap](https://tiptap.dev)** - Rich text editor

### Analytics & Monitoring
- **[Vercel Analytics](https://vercel.com/analytics)** - Performance monitoring
- **Google Analytics 4** - User analytics
- **Custom Event Tracking** - In-app analytics system

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (we recommend [Neon](https://neon.tech))
- Redis instance (we recommend [Upstash](https://upstash.com))
- Google OAuth credentials
- AI provider API key (xAI, OpenAI, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/realbits-lab/Fictures.git
   cd Fictures
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and configure:

   ```bash
   # Authentication
   AUTH_SECRET=your-auth-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # AI Integration (use AI Gateway key instead of provider key)
   AI_GATEWAY_API_KEY=your-ai-gateway-key

   # Database
   DATABASE_URL=your-neon-postgres-url-pooled
   DATABASE_URL_UNPOOLED=your-neon-postgres-url-direct

   # Storage
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
   REDIS_URL=your-upstash-redis-url
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate  # Generate migrations
   pnpm db:migrate   # Run migrations
   ```

5. **Run the development server**
   ```bash
   dotenv --file .env.local run pnpm dev
   ```

   Your application will be running at [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
pnpm db:generate  # Generate new migrations from schema changes
pnpm db:migrate   # Apply migrations to database
pnpm db:push      # Push schema directly to database (dev only)
pnpm db:studio    # Open Drizzle Studio to browse data
```

## Usage

### For Writers

1. **Create a Story**: Navigate to `/studio` and click "New Story"
2. **Define Structure**: Add Parts, Chapters, and Scenes to organize your narrative
3. **Use AI Assistance**: Click the AI button to generate content, get suggestions, or improve your writing
4. **Manage Characters**: Use the Character Grid to track your cast
5. **Schedule Publishing**: Set up automated publishing schedules
6. **Monitor Performance**: Check analytics to see how readers engage with your work

### For Readers

1. **Browse Stories**: Visit `/novels` to discover stories by genre
2. **Read Stories**: Click any story to start reading scene-by-scene
3. **Immersive Reading**: Scroll down to hide UI, scroll up or tap to show it again
4. **Engage**: Leave comments, rate scenes, and like your favorite stories
5. **Track Progress**: Your reading history syncs across all your devices

### For Community Members

1. **Join Discussions**: Visit `/community` to see community posts
2. **Create Posts**: Share theories, reviews, or ask questions about stories
3. **Reply to Others**: Engage in threaded discussions
4. **Like & Share**: Support your favorite posts and authors

## Architecture

### Story Hierarchy

```
Story (top-level container)
├── Part (optional story section)
│   ├── Chapter (story chapter)
│   │   ├── Scene (smallest content unit)
│   │   ├── Scene
│   │   └── Scene
│   └── Chapter
│       └── Scene
└── Chapter (standalone chapter, no part)
    └── Scene
```

### Database Schema

The application uses 40+ database tables organized into:

- **Core Content**: stories, parts, chapters, scenes, characters, places
- **Authentication**: users, accounts, sessions, apiKeys
- **Community**: communityPosts, communityReplies, comments
- **Engagement**: likes, views, ratings (for stories, chapters, scenes, posts)
- **Publishing**: publishingSchedules, scheduledPublications
- **Analytics**: analyticsEvents, readingSessions, readingHistory
- **AI**: aiInteractions, sceneEvaluations, storyInsights

Full schema: [`src/lib/db/schema.ts`](src/lib/db/schema.ts)

## API Documentation

### REST API Endpoints

The application provides comprehensive REST APIs:

**Stories** (`/api/stories`)
- `GET /api/stories` - List stories
- `POST /api/stories` - Create story
- `GET /api/stories/[id]` - Get story details
- `PUT /api/stories/[id]` - Update story
- `DELETE /api/stories/[id]` - Delete story
- `GET /api/stories/[id]/structure` - Get story hierarchy
- `POST /api/stories/[id]/like` - Like/unlike story
- `GET /api/stories/[id]/characters` - Get story characters
- `POST /api/stories/generate` - AI story generation

**Chapters** (`/api/chapters`)
- Standard CRUD operations
- `POST /api/chapters/[id]/publish` - Publish chapter
- `POST /api/chapters/[id]/unpublish` - Unpublish chapter
- `POST /api/chapters/generate` - AI chapter generation

**Scenes** (`/api/scenes`)
- Standard CRUD operations
- `POST /api/scenes/[id]/like` - Like scene
- `POST /api/scenes/[id]/dislike` - Dislike scene
- `POST /api/scenes/generate` - AI scene generation

**AI** (`/api/ai`)
- `POST /api/ai/generate` - Content generation
- `POST /api/ai/chat` - Conversational assistance
- `POST /api/ai/analyze` - Content analysis
- `POST /api/ai/suggestions` - Writing suggestions

**Community** (`/api/community`)
- `GET /api/community/posts` - List posts
- `POST /api/community/posts` - Create post
- `POST /api/community/posts/[postId]/like` - Like post
- `POST /api/community/posts/[postId]/replies` - Reply to post

**Publishing** (`/publish/api`)
- `GET /publish/api/timeline` - Publication timeline
- `POST /publish/api/schedules` - Create schedule
- `GET /publish/api/status` - Schedule status

**Analytics** (`/analytics/api`)
- `GET /analytics/api/insights` - Story insights
- `POST /analytics/api/insights/generate` - Generate insights
- `GET /analytics/api/stories` - Story performance

Full API documentation: See [`src/app/api`](src/app/api) directory

### Authentication

The API supports three authentication methods:

1. **Session-based** (NextAuth.js): Automatic with cookies
2. **API Keys**: Include `X-API-Key` header
3. **Credentials**: Email/password via NextAuth

## Testing

### End-to-End Testing with Playwright

The project uses [Playwright](https://playwright.dev) for comprehensive E2E testing across all major features.

#### Test Coverage

The current test suite includes:

**Global Navigation Bar (GNB) Tests** - 5 test suites covering:
- **Home Page** (`gnb-home.e2e.spec.ts`) - Landing page navigation and redirects
- **Reading** (`gnb-reading.e2e.spec.ts`) - Story browsing, genre filtering, story cards
- **Writing** (`gnb-writing.e2e.spec.ts`) - Story creation, editing interface
- **Community** (`gnb-community.e2e.spec.ts`) - Discussion posts, threaded replies
- **Publishing/Analytics/Settings** (`gnb-publish-analytics-settings.e2e.spec.ts`) - Schedule management, insights, preferences

Each test suite covers:
- ✅ Access control (authenticated vs anonymous)
- ✅ Navigation functionality
- ✅ Page loading and content visibility
- ✅ Menu item highlighting
- ✅ Core feature interactions

#### Quick Start

**Prerequisites**: Development server must be running
```bash
# Start dev server (required for tests)
dotenv --file .env.local run pnpm dev
```

**Run All Tests**:
```bash
# Run all E2E tests
pnpm test

# Run with browser visible
npx playwright test --headed

# Run in interactive UI mode
npx playwright test --ui
```

**Run Specific Tests**:
```bash
# Test specific page
npx playwright test tests/gnb-reading.e2e.spec.ts

# Test specific test case
npx playwright test tests/gnb-reading.e2e.spec.ts:16

# Run tests matching pattern
npx playwright test --grep "anonymous"
```

#### Test Projects

The Playwright configuration defines multiple test projects:

- **`e2e`** (Desktop Chrome) - Current GNB test suites
- **`authenticated`** (Desktop Chrome with auth) - Tests requiring login (`.auth/user.json`)
- **`api`** (Desktop Chrome) - API endpoint tests (not yet implemented)
- **`mobile`** (iPhone 12) - Mobile-specific tests (not yet implemented)
- **`setup`** - Authentication setup project

#### Debugging Tests

```bash
# Debug mode with inspector
npx playwright test --debug

# Debug specific test
npx playwright test tests/gnb-writing.e2e.spec.ts --debug

# Show browser during execution
npx playwright test --headed

# Generate trace for analysis
npx playwright test --trace on
npx playwright show-report
```

#### Authentication Setup (For Authenticated Tests)

For tests requiring authentication (`.authenticated.spec.ts` files):

**Step 1: Capture Authentication**
```bash
dotenv --file .env.local run node scripts/capture-auth-manual.mjs
```
This opens a browser for manual Google login and saves credentials to `.auth/user.json`

**Step 2: Verify Setup**
```bash
dotenv --file .env.local run node scripts/test-auto-login.mjs
```

**Step 3: Run Authenticated Tests**
```bash
npx playwright test --project=authenticated
```

#### Test Configuration

Key settings in `playwright.config.ts`:

- **Timeout**: 240s per test (4 minutes)
- **Retries**: 2 retries in CI, 0 locally
- **Base URL**: http://localhost:3000
- **Screenshots**: Captured on failure
- **Video**: Retained on failure
- **Reporter**: HTML report (view with `npx playwright show-report`)

#### Writing New Tests

Create test files following the naming convention:

- `*.e2e.spec.ts` - End-to-end tests (no auth required)
- `*.authenticated.spec.ts` - Tests requiring authentication
- `*.api.spec.ts` - API endpoint tests
- `*.mobile.spec.ts` - Mobile-specific tests
- `*.setup.ts` - Setup/configuration tests

Example test structure:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');
  });

  test('TC-FEATURE-001: Test description', async ({ page }) => {
    console.log('📖 Testing...');

    // Your test code here

    console.log('✅ Test passed');
  });
});
```

#### CI/CD Integration

Tests are configured for CI environments:
- Runs in headless mode
- 2 automatic retries on failure
- Single worker for stability
- Generates HTML report artifact

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frealbits-lab%2FFictures&env=AUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,AI_GATEWAY_API_KEY&project-name=fictures&repository-name=fictures)

### Environment Variables

Configure these in your Vercel project or `.env.local`:

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH_SECRET` | NextAuth secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Yes |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key | Yes |
| `DATABASE_URL` | PostgreSQL pooled connection | Yes |
| `DATABASE_URL_UNPOOLED` | PostgreSQL direct connection (migrations) | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Yes |
| `REDIS_URL` | Redis connection string | Yes |

### Required Vercel Integrations

When deploying, add these integrations:
- **Neon** (PostgreSQL database)
- **Upstash** (Redis for sessions)
- **Vercel Blob** (File storage)
- **AI Gateway** (AI request management)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── writing/           # Story writing interface
│   ├── reading/           # Story reading interface
│   ├── community/         # Community features
│   ├── publish/           # Publishing automation
│   ├── analytics/         # Analytics dashboard
│   └── settings/          # User settings
├── components/            # React components
│   ├── writing/           # Writing interface components
│   ├── reading/           # Reading interface components
│   ├── community/         # Community components
│   ├── publish/           # Publishing components
│   └── ui/               # Shared UI components
├── lib/                   # Shared utilities
│   ├── db/               # Database schema and client
│   ├── auth/             # Authentication config
│   └── ai/               # AI integration
└── types/                # TypeScript type definitions
```

## Roadmap

### Planned Features (Not Yet Implemented)

We're actively working on these features:

#### Community & Social
- [ ] **Contest System**: Writing contests with submission, voting, and judging
- [ ] **Group Management**: Create and join writing groups
- [ ] **Following System**: Follow authors and get updates
- [ ] **User Profiles**: Public author profiles with bio and story portfolio

#### Gamification
- [ ] **Achievement System**: Unlock achievements for writing milestones
- [ ] **Experience & Levels**: XP system with level progression
- [ ] **Leaderboards**: Daily, weekly, monthly rankings
- [ ] **Badges**: Visual recognition for accomplishments

#### Collaboration Tools
- [ ] **Beta Reader Marketplace**: Connect with beta readers
- [ ] **Co-Authoring**: Collaborative writing with shared editing
- [ ] **Writing Workshops**: Scheduled events with facilitators
- [ ] **Peer Review System**: Structured feedback exchange

#### Writing Enhancements
- [ ] **Version Control**: Visual diff and rollback for chapters
- [ ] **Writing Goals**: Daily/weekly word count goals
- [ ] **Outline Mode**: Dedicated outline editor
- [ ] **Research Notes**: Integrated note-taking system

See our [GitHub Issues](https://github.com/realbits-lab/Fictures/issues) for detailed feature requests and discussions.

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `pnpm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (TypeScript, React Server Components)
- Write tests for new features
- Update documentation as needed
- Keep commits focused and atomic
- Use conventional commit messages

### Code Style

- Use TypeScript for type safety
- Prefer Server Components over Client Components
- Use Server Actions for mutations
- Follow Next.js 15 App Router patterns
- Use Tailwind CSS for styling
- Component names use PascalCase
- Use pnpm for package management

## Support

- **Issues**: [GitHub Issues](https://github.com/realbits-lab/Fictures/issues)
- **Discussions**: [GitHub Discussions](https://github.com/realbits-lab/Fictures/discussions)
- **Documentation**: [Project Wiki](https://github.com/realbits-lab/Fictures/wiki)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org) by Vercel
- [Vercel AI SDK](https://sdk.vercel.ai) for AI integration
- [Drizzle ORM](https://orm.drizzle.team) for database access
- [NextAuth.js](https://authjs.dev) for authentication
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [TipTap](https://tiptap.dev) for rich text editing

## Authors

- **Realbits Lab** - [GitHub](https://github.com/realbits-lab)

---

Made with ❤️ for writers and readers everywhere
