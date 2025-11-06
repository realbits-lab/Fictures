# CLAUDE.md - Web Application

This file provides guidance to Claude Code when working with the Next.js web application.

## Application Information

- **Workspace**: apps/web/
- **Framework**: Next.js 15 with App Router
- **Purpose**: Fictures - AI-powered story writing platform
- **Port**: 3000

## Multi-Environment Architecture

**The platform uses environment-based data isolation for development and production.**

**Environment Detection:**
- Uses `NODE_ENV` environment variable
- `NODE_ENV=development` → "develop" environment (default)
- `NODE_ENV=production` → "main" environment (production)

**Data Isolation:**
1. **Authentication** - Separate user profiles per environment in `.auth/user.json`
2. **Blob Storage** - Environment-prefixed paths (`main/` or `develop/`)

**Quick Reference:**
```typescript
// Load environment-aware profile
import { loadProfile } from '@/lib/utils/auth-loader';
const writer = loadProfile('writer'); // Uses current NODE_ENV

// Construct environment-aware blob path
import { getBlobPath } from '@/lib/utils/blob-path';
const path = getBlobPath('stories/123/image.png');
// Returns: "develop/stories/123/image.png" (in development)
// Returns: "main/stories/123/image.png" (in production)
```

**Complete Documentation:** [../../docs/operation/environment-architecture.md](../../docs/operation/environment-architecture.md)

## Development Commands

- **Development**: `dotenv --file .env.local run pnpm dev` (runs on port 3000)
- **Build**: `pnpm build` - Builds the Next.js application
- **Linting**: `pnpm lint` - Runs Next.js ESLint
- **Type checking**: Use `pnpm build` to verify types

## Development Process Guidelines

**Running Development Server:**
- Always use `dotenv --file .env.local run pnpm dev` as background process
- Check port 3000 availability first - kill existing process if needed
- Redirect output to logs directory: `dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &`

**Process Management Principles:**
- Run long-running processes (pnpm dev, npx commands) as background processes
- Always redirect output streams to logs directory using shell pipes for monitoring
- Kill existing processes on port 3000 before starting development server
- **IMPORTANT**: Always remove Next.js cache (`.next/`) before restarting `pnpm dev`
  - Command: `rm -rf .next && dotenv --file .env.local run pnpm dev`
  - This ensures code changes are picked up and prevents stale cached code from running
- Use proper environment variable loading with `dotenv --file .env.local run` prefix

**File Organization Guidelines:**
- **Test Files**: Decide directory based on test purpose and longevity
  - **`test-tests/`**: Temporary test files for quick testing, debugging, or one-time exploration
  - **`tests/`**: Permanent E2E test files (Playwright tests: `tests/*.spec.ts`)
  - **`__tests__/`**: Permanent unit test files (Jest tests: `__tests__/*.test.ts` or `__tests__/*.test.tsx`)
  - When creating test files, evaluate whether they are temporary experiments or permanent test suites
- **Script Files**: Decide directory based on script purpose and longevity
  - **`test-scripts/`**: Temporary scripts for testing, debugging, or one-time exploration
  - **`scripts/`**: Permanent utility scripts for production use
  - See complete script documentation: [scripts/CLAUDE.md](scripts/CLAUDE.md)
  - Story generation, management, testing, and utility scripts
  - When creating scripts, evaluate whether they are temporary experiments or permanent utilities

## Database Management

**IMPORTANT: Uses Neon PostgreSQL Database**
- Database operations use Drizzle ORM - see `drizzle/schema.ts` (single source of truth)
- Always prefix commands with `dotenv --file .env.local run` for proper database connectivity
- DO NOT use Supabase MCP tools - this project uses Neon PostgreSQL

**Database Schema Usage:**
- **ALWAYS import schema from `drizzle/schema.ts`** - This is the single source of truth for all database tables
- **NEVER define tables inline** in scripts, API routes, or services
- **Example**: `import { users, apiKeys, stories, chapters } from '../drizzle/schema.ts'`
- **Why**: Prevents schema drift, ensures consistency, and maintains type safety across the entire codebase
- **Applies to**: All scripts, API routes, services, utilities, and test files

**Database Naming Convention:**
- **Table and column names use snake_case** (e.g., `created_at`, `updated_at`, `email_verified`)
- **NOT camelCase** (e.g., ~~`createdAt`~~, ~~`updatedAt`~~)
- In raw SQL queries, use snake_case without quotes: `created_at`, `updated_at`
- Drizzle ORM schema definitions use camelCase in TypeScript, but map to snake_case in PostgreSQL
- Example: TypeScript `createdAt` → PostgreSQL `created_at`

**Database Commands:**
- **Generate migrations**: `pnpm db:generate`
- **Run migrations**: `pnpm db:migrate`
- **Database studio**: `pnpm db:studio`
- **Push schema**: `pnpm db:push`

## Testing

**Unit Testing:**
- **Framework**: Jest for unit tests
- **Command**: `dotenv --file .env.local run pnpm test`

**End-to-End Testing:**
- **Framework**: Playwright for e2e tests
- **Command**: `dotenv --file .env.local run npx playwright test`
- **Background Testing**: `dotenv --file .env.local run npx playwright test > logs/playwright.log 2>&1 &`
- **Authentication**: Uses `.auth/user.json` for authentication testing (supports both Google OAuth and email/password)
- **Test Setup**: Run setup project first for authentication state
- **Display Mode**: Uses headed mode by default for better debugging visibility

**Test Page for Development:**
- **Route**: `/test` - Use this page for testing features without authentication during development
- **Purpose**: Quick access to test pages and components without going through authentication flow
- **Security**: In production/main environment, access to `/test` route MUST be blocked in middleware
- **Implementation**: Add middleware check to prevent access when `NODE_ENV=production`

**Authentication Setup for Playwright:**

**Testing Account Priority:**
- **ALWAYS use writer@fictures.xyz** for testing story editor and writing features
- Use manager@fictures.xyz only for admin/management specific tests
- All test scripts should read credentials from `.auth/user.json` profiles

**Email/Password Authentication (Primary Method):**

Playwright tests use **direct email/password authentication** via the `/login` page. This approach does NOT use cookies or storage state files.

1. **Setup Authentication Users**:
   ```bash
   # Create all three users (manager, writer, reader) if not exists
   dotenv --file .env.local run node scripts/setup-auth-users.mjs

   # Verify users were created correctly
   dotenv --file .env.local run node scripts/verify-auth-setup.mjs
   ```

2. **Reusable Login Helper Function**:
   ```javascript
   // Add this function to your Playwright test files
   async function login(page, email, password) {
     await page.goto('http://localhost:3000/login');
     await page.waitForLoadState('networkidle');

     // Fill email field
     await page.fill('input[type="email"], input[name="email"]', email);

     // Fill password field
     await page.fill('input[type="password"], input[name="password"]', password);

     // Click sign in button
     await page.click('button:has-text("Sign in with Email")');
     await page.waitForLoadState('networkidle');

     // Wait for redirect after successful login
     await page.waitForTimeout(2000);
   }
   ```

3. **Using in Playwright Tests**:
   ```javascript
   import { test, expect } from '@playwright/test';
   import fs from 'fs';

   // Load authentication profiles
   const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));

   test('writer can create stories', async ({ page }) => {
     // Get writer credentials from auth file
     const writer = authData.profiles.writer;

     // Login with writer
     await login(page, writer.email, writer.password);

     // Navigate to story creation
     await page.goto('http://localhost:3000/studio/new');

     // Test runs with authenticated session
     // ... your test code ...
   });
   ```

4. **Testing with Different User Roles**:
   ```javascript
   test.describe('User Role Tests', () => {
     test('manager can delete stories', async ({ page }) => {
       const manager = authData.profiles.manager;
       await login(page, manager.email, manager.password);
       // Test manager-only features
     });

     test('writer can edit stories', async ({ page }) => {
       const writer = authData.profiles.writer;
       await login(page, writer.email, writer.password);
       // Test writer features
     });

     test('reader can only view stories', async ({ page }) => {
       const reader = authData.profiles.reader;
       await login(page, reader.email, reader.password);
       // Test read-only access
     });
   });
   ```

**Benefits:**
- ✅ Simple and direct - No need to manage cookies or storage state files
- ✅ Fresh authentication - Each test gets a new session
- ✅ Easy role switching - Just use different credentials
- ✅ Matches real user flow - Tests actual login process
- ✅ No session expiration issues - New session for each test

## Architecture Overview

**Next.js 15 Story Writing Platform** with the following stack:

### Navigation Menu Structure

**Global Navigation (GNB) Menu Items:**
- **Studio** (🎬) - `/studio` - Story creation and management workspace (writers/managers only)
- **Novels** (📖) - `/novels` - Browse and read text-based stories (all users)
- **Comics** (🎨) - `/comics` - Browse and read visual/comic format stories (all users)
- **Community** (💬) - `/community` - Story sharing and discussion (all users)
- **Publish** (📤) - `/publish` - Publish stories to community (writers/managers only)
- **Analysis** (📊) - `/analysis` - Story performance metrics (writers/managers only)
- **Settings** (⚙️) - `/settings` - User preferences (authenticated users)

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google OAuth and email/password
- **AI Integration**:
  - Google Gemini 2.5 Flash & Flash Lite via Vercel AI SDK (text generation)
  - Google Gemini 2.5 Flash (image generation - 7:4 aspect ratio, 1344×768)
  - Vercel AI SDK Gateway for API management
- **Storage**: Vercel Blob for generated images
- **Styling**: Tailwind CSS v4

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication routes
│   ├── studio/            # Story creation & management workspace
│   │   └── api/           # Studio API endpoints (generation, scenes, chapters)
│   ├── novels/            # Novel reading interface
│   ├── comics/            # Comic reading interface
│   ├── community/         # Story sharing & discussion
│   ├── publish/           # Publishing & scheduling
│   ├── analysis/          # Performance metrics
│   ├── settings/          # User preferences
│   └── api/               # Global API endpoints
├── components/            # React UI components
├── lib/
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database schema (Drizzle ORM)
│   ├── novels/           # Novel generation services
│   ├── services/         # Shared services (image, evaluation, formatting)
│   └── hooks/            # Custom React hooks
└── types/                # TypeScript definitions
```

### Database Schema

**Core Story Writing Tables:**
- **users**: User accounts with Google OAuth and email/password
- **stories**: Main story entities with metadata
- **parts**: Optional story sections
- **chapters**: Story chapters with content organization
- **scenes**: Chapter breakdown for detailed writing
- **characters**: Story character management
- **settings**: Story-specific settings and configurations
- **aiInteractions**: AI writing assistance tracking
- **communityPosts**: Basic story sharing features

### Key Features
- **Novel Generation**: Adversity-Triumph Engine for emotionally resonant storytelling
- **Hierarchical Writing**: Stories → Parts → Chapters → Scenes
- **Character Management**: Detailed character profiles with internal flaws and arcs
- **Moral Framework**: Stories built on tested virtues and meaningful consequences
- **AI Writing Assistant**: Gemini 2.5 Flash for complex narrative generation
- **AI Image Generation**: Gemini 2.5 Flash for story illustrations (7:4, 1344x768) with automatic optimization
- **Image Optimization**: 4 variants per image (AVIF, JPEG × 2 sizes) for optimal performance
- **Scene Evaluation**: Automated quality assessment and iterative improvement
- **Community Sharing**: Basic story publication and discovery
- **Progress Tracking**: Word counts and writing statistics

## Environment Setup

**Required Environment Variables:**
```bash
# Authentication
AUTH_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# AI Integration
GOOGLE_GENERATIVE_AI_API_KEY=***   # Google AI for Gemini 2.5 Flash (text & image generation)
AI_GATEWAY_API_KEY=***             # Vercel AI SDK Gateway API key for AI provider management

# Database & Storage
DATABASE_URL=***                   # Neon PostgreSQL (pooled connection for runtime)
DATABASE_URL_UNPOOLED=***          # Neon PostgreSQL (direct connection for migrations)
BLOB_READ_WRITE_TOKEN=***          # Vercel Blob storage for generated images
REDIS_URL=***                      # Session storage
```

**Database Connection Details:**
- **DATABASE_URL**: Pooled connection (with `-pooler` in hostname) - Use for application runtime
- **DATABASE_URL_UNPOOLED**: Direct connection (no `-pooler`) - Required for Drizzle migrations
- Both connections point to the same database, only the connection method differs

## Development Workflow

1. **Setup**: `pnpm install` → Set up `.env.local` → `pnpm db:migrate`
2. **Development**: `dotenv --file .env.local run pnpm dev` (background process)
3. **Testing**: `dotenv --file .env.local run npx playwright test`
4. **Building**: `pnpm build` (includes type checking)

## Novel Generation

**Primary Generation System: Adversity-Triumph Engine**

The platform uses the Adversity-Triumph Engine for novel generation, creating emotionally resonant stories with deep character development and moral frameworks.

**Complete Documentation:**
- **📖 Specification**: [docs/novels/novels-specification.mdx](docs/novels/novels-specification.mdx) - Core concepts and data model
- **🔧 Development Guide**: [docs/novels/novels-development.md](docs/novels/novels-development.md) - API specs and system prompts
- **🧪 Testing Guide**: [docs/novels/novels-testing.mdx](docs/novels/novels-testing.mdx) - Validation and quality metrics
- **⚡ Optimization**: [docs/novels/novels-optimization.mdx](docs/novels/novels-optimization.mdx) - Performance tuning
- **🗑️ Removal**: [docs/novels/novels-removal.mdx](docs/novels/novels-removal.mdx) - Deletion workflows

**Quick Reference:**
- **UI**: `/studio/new` - Novel creation page
- **API**: `/studio/api/generation/*` - Generation endpoints (SSE streaming)
- **Model**: Gemini 2.5 Flash & Flash Lite (via Vercel AI SDK)

**Generation Pipeline:**
9-phase system: Story Summary → Characters → Settings → Parts → Chapters → Scene Summaries → Scene Content → Scene Evaluation → Images

**Output:**
- Complete story structure with moral framework
- Character profiles with AI-generated portraits (1344×768, 7:4)
- Immersive settings with environment images
- Full narrative content with 4 optimized image variants per image
- Automatic quality evaluation and improvement

**Key Routes:**
- Create: `/studio/new`
- Edit: `/studio/edit/story/{storyId}` | `/studio/edit/{chapterId}`
- Read: `/novels/{storyId}` (novel format) | `/comics/{storyId}` (comic format)
- Community: `/community/story/{storyId}` (published stories only)

**Generation Time:** 5-25 minutes depending on story complexity

## Story Removal

**Complete Story Removal Scripts:**
- **Single story**: `scripts/remove-story.mjs`
- **All stories**: `scripts/remove-all-stories.mjs`
- **Authentication**: Uses writer@fictures.xyz from `.auth/user.json`
- **API Endpoint**: `DELETE /api/stories/{id}` (cascading deletion)

**Usage:**
```bash
# Remove single story
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID

# Dry run to preview deletion
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run

# Remove all stories (requires confirmation)
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm

# Dry run for all stories
dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run

# Background execution with logging
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID > logs/story-removal.log 2>&1 &
```

**What Gets Removed:**
- **Database records**: story, parts, chapters, scenes, characters, settings
- **Vercel Blob images**: ALL images found using Vercel Blob list API by prefix `stories/{storyId}/`
  - Story cover images (1792x1024, 16:9)
  - Scene images (1792x1024, 16:9)
  - Character portraits (1024x1024)
  - Setting visuals (1792x1024, 16:9)
  - All optimized variants (AVIF, WebP, JPEG in multiple sizes)
- **Community data**: posts, likes, replies, bookmarks
- **Analysis data**: reading sessions, insights, events

**Safety Features:**
- Confirmation prompts for bulk operations
- Dry-run mode to preview deletions
- Transaction-based for atomicity
- Audit logging of deletions
- Owner verification (only story owner or admin can delete)

## Novel Generation

**IMPORTANT: Documentation-First Development Process**

The novel generation system uses the Adversity-Triumph Engine methodology with a strict documentation-first approach to ensure synchronization across documentation, implementation, and automation tools.

### Novel Generation Change Protocol

When making ANY changes to the novel generation system, ALWAYS follow this order:

**1. FIRST: Update Documentation** (`docs/novels/`)
- **Primary documentation files:**
  - `novels-specification.md` - Core concepts, data model, theoretical foundation
  - `novels-development.md` - API architecture, system prompts, implementation specs
  - `novels-testing.md` - Validation methods, quality metrics, test strategies
  - `novels-optimization.md` - Performance tuning, cost optimization
  - `novels-removal.md` - Deletion workflows, cleanup procedures
- **What to update:** API specifications, system prompts, data models, generation flows, examples
- **Why first:** Documentation serves as the single source of truth and design specification

**2. SECOND: Update Implementation Code**
- **Code locations:**
  - `src/app/api/novels/` - Novel generation API endpoints
  - `src/lib/novels/` - Novel generation services, utilities, and business logic
  - `drizzle/*.sql` - Database schema changes if data model updated
- **What to update:** Implement changes according to updated documentation
- **Validation:** Ensure code matches documented API contracts and specifications

### Why This Order Matters

**Documentation-First Benefits:**
- **Single Source of Truth**: Documentation defines the intended behavior before implementation
- **Design Review**: Changes can be reviewed and validated before coding begins
- **Synchronization**: Ensures both layers (docs, code) stay aligned
- **Knowledge Transfer**: New developers understand the system from authoritative documentation
- **Version Control**: Changes are tracked with clear intent and specifications

**Common Mistakes to Avoid:**
- ❌ Changing code first, then updating docs as an afterthought → Docs become outdated
- ❌ Skipping documentation updates entirely → System becomes unmaintainable

**CRITICAL: Field Synchronization Across All Layers**

When modifying data model fields for stories, parts, chapters, scenes, characters, or settings, you MUST synchronize changes across:

1. **Documentation Layer**:
   - `docs/novels/novels-specification.md` - Data model definitions and field descriptions
   - `docs/novels/novels-development.md` - API specifications and field usage

2. **Database Layer**:
   - `src/lib/db/schema.ts` - Drizzle ORM schema definitions
   - `drizzle/migrations/*.sql` - Database migration files

3. **Code Layer**:
   - TypeScript interfaces and types
   - API route handlers
   - UI components using the fields
   - Query functions and services

**Why This Matters:**
- Prevents schema drift between documentation and implementation
- Ensures API contracts match actual database structure
- Maintains type safety across the entire codebase
- Avoids runtime errors from missing or mismatched fields

**Example**: If you add a new field `emotional_tone` to scenes:
1. Update `docs/novels/novels-specification.md` - Define field purpose and data type
2. Update `docs/novels/novels-development.md` - Document API usage
3. Create database migration in `drizzle/migrations/`
4. Update `src/lib/db/schema.ts` - Add field to scenes table schema
5. Update TypeScript interfaces in components using scenes
6. Update API routes that create/update scenes
7. Update UI components displaying scene data

### Novel Generation System Overview

**Architecture:**
- **Location**: `docs/novels/novels-development.md` - Complete specification
- **Methodology**: Adversity-Triumph Engine (Korean Gam-dong narrative psychology)
- **API Endpoint**: `POST /studio/api/novels/generate` - Unified generation API with SSE streaming
- **Authentication**: Dual auth (API key OR session) - Requires `stories:write` scope
- **Database**: Novel-specific tables in Neon PostgreSQL (see `drizzle/` migrations)
- **AI Model**: Gemini 2.5 Flash & Flash Lite (via Google AI API)
- **Image Generation**: Gemini 2.5 Flash (1344×768, 7:4 aspect ratio)
- **Image Optimization**: 4 variants per image (AVIF/JPEG × mobile 1x/2x)

**Generation Flow:**
1. Story Summary → 2. Characters → 3. Settings → 4. Parts → 5. Chapters → 6. Scene Summaries → 7. Scene Content → 8. Scene Evaluation → 9. Images

**Quick Start (Minimal Story):**
```bash
# Generate smallest complete story (1 part, 1 chapter, 3 scenes, ~5-10 min)
dotenv --file .env.local run node scripts/generate-minimal-story.mjs
```

**Documentation Reference:**
- 📖 **Specification**: `docs/novels/novels-specification.md` - Core concepts and data model
- 🔧 **Development Guide**: `docs/novels/novels-development.md` - API specs and system prompts (now with dual auth)
- 🧪 **Testing Guide**: `docs/novels/novels-testing.md` - Validation and quality metrics
- ⚡ **Optimization**: `docs/novels/novels-optimization.md` - Performance and cost tuning
- 🗑️ **Removal**: `docs/novels/novels-removal.md` - Deletion workflows
- 🛠️ **Script**: `scripts/generate-minimal-story.mjs` - Production script for minimal story generation

**Generation System:**
- The platform uses the Adversity-Triumph Engine methodology for novel generation
- All story generation uses the unified `/studio/api/generation/*` system
- Image generation and optimization infrastructure is shared across all features

## Code Guidelines

**Core Development Practices:**
- **Package Manager**: Use pnpm instead of npm for all operations
- **Environment Variables**: Always prefix commands with `dotenv --file .env.local run`
- **Authentication**: Use NextAuth.js session management throughout
- **Database**: All operations through Drizzle ORM - see `src/lib/db/`
- **API Route Organization**:
  - **Page-specific APIs**: Create API routes under the related page directory (e.g., `/studio/api/`, `/analytics/api/`)
  - **Common APIs**: Use `/api/` directory only for global/shared API endpoints
  - **Example**: Studio-related APIs go in `src/app/studio/api/generation/*` instead of `src/app/api/studio/generation/*`
- **AI Integration**:
  - **AI SDK**: Use Vercel AI SDK with AI Gateway (AI_GATEWAY_API_KEY)
  - **Text Generation**: Gemini 2.5 Flash & Flash Lite via Vercel AI SDK
  - **Scene Evaluation**: Automated quality assessment (part of Novel generation pipeline)
  - **Scene Improvement**: Iterative refinement until quality threshold met
  - **Image Generation**: Gemini 2.5 Flash via Vercel AI SDK (7:4, 1344×768)
  - **Image Optimization**: Automatic generation of 4 variants (AVIF, JPEG × mobile 1x/2x)
- **Image Storage**: Generated images stored in Vercel Blob with public access
- **Error Handling**: Implement proper error boundaries and loading states
- **Error Display**: Always use beautiful, user-friendly error components with proper design
  - Follow the design patterns from `not-found.tsx` and `ContentLoadError.tsx`
  - Include decorative icons, helpful messaging, and clear action buttons
  - Use proper color variables, animations, and responsive design
  - Never display raw error text or plain error messages
- **Performance**: Optimize for story writing workflow and database queries

## Image Generation & Optimization

**Complete Image System Documentation:**
- **📖 Architecture**: [docs/image/image-architecture.mdx](docs/image/image-architecture.mdx) - System overview
- **🎨 Generation**: [docs/image/image-generation.mdx](docs/image/image-generation.mdx) - Image generation guide
- **⚡ Optimization**: [docs/image/image-optimization.mdx](docs/image/image-optimization.mdx) - Optimization pipeline

**Quick Reference:**

### Image Generation
- **Service**: `src/lib/novels/` - Novel generation handles image creation
- **API Endpoint**: POST `/studio/api/generation/images` - Generate story illustrations
- **Model**: Gemini 2.5 Flash via Vercel AI SDK
- **Original Format**: 1344×768 pixels (7:4 aspect ratio), PNG
- **Quality**: Standard quality for all image types
- **Storage**: Vercel Blob (automatic upload)

### Automatic Image Optimization
Every generated image automatically creates **4 optimized variants**:
- **Formats**: AVIF (best compression), JPEG (universal fallback)
- **Sizes**: Mobile 1x (672×384), Mobile 2x (1344×768 - uses original)
- **Total**: 2 formats × 2 sizes = 4 variants per image
- **Performance**: Optimized for mobile devices with responsive image loading

### Database Storage
All images include both `imageUrl` (original) and `imageVariants` (optimized set):
```typescript
{
  imageUrl: string;  // Original 1792×1024 PNG
  imageVariants: {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];  // 18 optimized variants
    generatedAt: string;
  }
}
```

### Usage Example
```typescript
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'A mysterious forest at twilight, cinematic widescreen',
  storyId: 'story_123',
  imageType: 'scene',  // 'story' | 'scene' | 'character' | 'setting'
  style: 'vivid',      // 'vivid' | 'natural'
  quality: 'standard', // 'standard' | 'hd'
});

// result.url: Original image URL (1792×1024)
// result.optimizedSet: 18 optimized variants
// result.optimizedSet.variants: Array of all variants
```

### Documentation
- **Complete Guide**: `docs/image-optimization.md`
- **API Reference**: `docs/story-image-generation.md`

**Test Image Generation:**
```bash
dotenv --file .env.local run node scripts/test-imagen-generation.mjs
```

## Scene Quality Evaluation and Validation

**Complete Scene Quality Documentation:**
- **📖 Specification**: [docs/novels/novels-specification.mdx](docs/novels/novels-specification.mdx) - Scene quality framework
- **🔧 Development**: [docs/novels/novels-development.md](docs/novels/novels-development.md) - Evaluation API & implementation
- **🧪 Testing**: [docs/novels/novels-testing.mdx](docs/novels/novels-testing.mdx) - Quality metrics & validation

**Automated Scene Pipeline:**

Every scene generated is automatically:
1. **Formatted** - Rule-based text formatting for optimal mobile readability
2. **Validated** - Image existence and accessibility checking with auto-regeneration
3. **Evaluated** - Quality assessment using "Architectonics of Engagement" framework
4. **Improved** - Iterative refinement until professional quality standards are met

**Key Features:**

### Formatting
- **Max 3 sentences per paragraph** for mobile readability
- **Blank line separation** between description and dialogue
- Service: `src/lib/services/scene-formatter.ts`
- Testing: `dotenv --file .env.local run pnpm test -- __tests__/scene-formatter.test.ts`

### Image Validation
- Validates image URL existence and accessibility
- Auto-regenerates missing images using Gemini 2.5 Flash
- Creates 4 optimized variants automatically
- Service: `src/lib/services/image-validator.ts`

### Quality Evaluation
- **Framework**: "Architectonics of Engagement"
- **Scoring**: 1-4 scale across 5 categories (Plot, Character, Pacing, Prose, World-Building)
- **Passing Score**: 3.0/4.0 ("Effective" level)
- **Max Iterations**: 2 improvement cycles
- **API**: POST `/studio/api/evaluate/scene`
- Service: `src/lib/services/scene-evaluation-loop.ts`

**Performance:**
- 70-80% of scenes pass on first evaluation
- 1-3 minutes added per story
- Average final score: 3.2-3.5/4.0

---

## Documentation

**Complete Documentation Index:** See `docs/README.md` for full documentation catalog

### Essential Documentation

**For New Developers:**
- **[docs/README.md](docs/README.md)** - Complete documentation index (start here!)
- **[CLAUDE.md](CLAUDE.md)** - This file - Project overview and guidelines

**Core Feature Specifications:**
- **[docs/story-specification.md](docs/story-specification.md)** - Story structure and methodology
- **[docs/novels-specification.md](docs/novels-specification.md)** - Reading UX, mobile nav, comments, likes
- **[docs/community-specification.md](docs/community-specification.md)** - Community features and sharing

**Performance & Optimization:**
- **[docs/caching-strategy.md](docs/caching-strategy.md)** - ⭐ Complete 3-layer caching guide (SWR, localStorage, Redis)
  - Consolidates: 30min cache retention, Redis optimization, cache key strategies
- **[docs/database-optimization-strategy.md](docs/database-optimization-strategy.md)** - PostgreSQL indexes, N+1 fixes, query optimization

**AI & Image Generation:**
- **[docs/image-system-guide.md](docs/image-system-guide.md)** - ⭐ Complete image system overview
  - Links: image-generation-guide.md, story-image-generation.md, image-optimization.md
- **[docs/image-optimization.md](docs/image-optimization.md)** - 18-variant optimization system (AVIF/WebP/JPEG)
- **[docs/scene-evaluation-api.md](docs/scene-evaluation-api.md)** - Automated scene quality evaluation

**Story Generation & Removal:**
- **[docs/story-removal.md](docs/story-removal.md)** - Story removal with database and Blob cleanup (10-25x faster batch deletion)

### Documentation Organization

**By Category:**
- **Setup & Configuration:** Authentication, analytics, AdSense setup
- **Feature Specs:** Story, reading, community, analytics, publish
- **AI & Images:** Generation, optimization, evaluation, prompts
- **Performance:** Caching, database, loading optimizations
- **Bug Fixes:** Navigation, mobile, data loading fixes
- **Testing:** E2E test specifications

**By Status:**
- ✅ **Implemented:** caching-strategy, image-optimization, database-optimization-strategy
- 🚧 **Partial:** community-specification, analytics-specification
- 📋 **Spec Only:** publish-specification, ui-specification

### Quick Navigation

**"I want to..."**
- **Generate images** → Start: `docs/image-system-guide.md`
- **Improve performance** → Start: `docs/caching-strategy.md`
- **Understand story system** → Start: `docs/story-specification.md`
- **Set up project** → Start: `CLAUDE.md` (this file) + `docs/README.md`

### Recent Documentation Consolidation (2025-10-25)

**Consolidated Files:**
- ✅ Created `docs/caching-strategy.md` - Merged 3 cache-related files into complete guide
- ✅ Created `docs/image-system-guide.md` - Overview linking 3 image-related files
- ✅ Created `docs/README.md` - Master documentation index
- ✅ Updated `docs/novels-specification.md` - Added bottom navigation implementation details

**Removed Files (Superseded):**
- ~~30min-cache-retention.md~~ → Merged into caching-strategy.md
- ~~cache-optimization-report.md~~ → Merged into caching-strategy.md
- ~~bottom-nav-always-visible.md~~ → Merged into reading-specification.md
- ~~api-key-generation.md~~ → Removed (generic content)

---

**Code Completion Standards:**
- NEVER use ellipsis ("...") as placeholders in code
- Always write complete, explicit code with all parameters, imports, and statements
- Every line of code should be production-ready and executable
- No shortcuts or omissions in code implementation
- **TypeScript Validation for Next.js Projects:**
  - **Always use `pnpm build`** for TypeScript validation (this is the only authoritative check)
  - Next.js generates type definitions (`.next/types/`) during build, so direct `tsc` will give false errors
  - `pnpm build` runs TypeScript checking with Next.js integration and generated types
  - **Never use `pnpm tsc --noEmit`** for Next.js projects - it lacks Next.js type generation

**Git and Repository Management:**
- Always check current git repository URL before using GitHub MCP tools
- Follow conventional commit message format
- Use feature branches for development work
