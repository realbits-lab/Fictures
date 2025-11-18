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
- **ALWAYS use port 3000** - The development server MUST run on port 3000
- **ALWAYS kill any process using port 3000 first** before starting the server
- Always run as background process with output redirected to logs directory
- Standard command sequence:
  ```bash
  # Kill any process on port 3000
  lsof -ti :3000 | xargs -r kill -9

  # Remove Next.js cache and start dev server on port 3000
  rm -rf .next && dotenv --file .env.local run pnpm dev > logs/dev-server.log 2>&1 &

  # Wait and verify server is running on port 3000
  sleep 15 && tail -10 logs/dev-server.log
  ```

**Process Management Principles:**
- Run long-running processes (pnpm dev, npx commands) as background processes
- Always redirect output streams to logs directory using shell pipes for monitoring
- **CRITICAL**: ALWAYS kill existing processes on port 3000 before starting development server
  - Use: `pkill -f "next dev"` to stop the Next.js dev server
  - Alternative: `pkill -f "uvicorn"` to stop the AI server
  - **ALWAYS use `pkill -f [process_name]`** instead of port-based killing to avoid killing unrelated processes (like VS Code SSH remote sessions)
  - Never let Next.js automatically choose a different port (3001, 3002, etc.)
  - The application MUST run on port 3000 for proper API endpoint configuration
- **IMPORTANT**: Always remove Next.js cache (`.next/`) before restarting `pnpm dev`
  - Command: `rm -rf .next && dotenv --file .env.local run pnpm dev`
  - This ensures code changes are picked up and prevents stale cached code from running
- Use proper environment variable loading with `dotenv --file .env.local run` prefix

**Runtime Module Loading - TypeScript File Limitation:**

⚠️ **CRITICAL**: Next.js cannot `require()` TypeScript files at runtime in production builds

**Problem:**
- Using `require()` to dynamically load `.ts` files will fail with `MODULE_NOT_FOUND` error
- This occurs even if the file exists and has correct exports
- Next.js dev server caches module resolution and may not pick up new files without restart

**Solution:**
1. **Use `.js` files for runtime-loaded modules** (preferred for dynamic loading)
2. **Restart dev server after adding new dynamically-loaded files**
3. **Clear Next.js cache** (`.next/`) to ensure fresh module resolution

**Example - Prompt Version System:**
```typescript
// ❌ WRONG: Cannot require TypeScript files at runtime
const { partPromptV1_1 } = require("../../../tests/iteration-testing/novels/prompts/v1.1/part-prompt.ts");

// ✅ CORRECT: Use .js files for runtime require()
const { partPromptV1_1 } = require("../../../tests/iteration-testing/novels/prompts/v1.1/part-prompt.js");
```

**When This Applies:**
- Dynamic `require()` calls in production code
- Runtime module loading (not import statements)
- Files loaded conditionally based on parameters/config
- Plugin systems or version-based prompt loading

**Steps to Fix MODULE_NOT_FOUND for .ts files:**
1. Rename `.ts` file to `.js` (keep TypeScript syntax if compatible)
2. Update `require()` statement to use `.js` extension
3. Restart dev server: `fuser -k 3000/tcp && rm -rf .next && pnpm dotenv -e .env.local -- pnpm dev`
4. Clear logs and re-run tests

**Alternative Approaches:**
- Use ES6 dynamic `import()` instead of `require()` (async)
- Pre-compile TypeScript files to JavaScript during build
- Use build-time code generation instead of runtime loading

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

## Code Quality and Formatting

**CRITICAL: Always run Biome lint and format after changing or updating files**

Whenever you finish making changes to files, you MUST run Biome to ensure code consistency and catch common issues:

```bash
# Format and lint specific changed files
pnpm biome check --write path/to/changed/file1.ts path/to/changed/file2.tsx

# Format and lint all files in a directory
pnpm biome check --write src/lib/services/

# Format and lint all TypeScript files in the project
pnpm biome check --write
```

**When to run Biome:**
- After modifying existing files
- After creating new files
- Before committing changes to git
- After refactoring code

**What Biome does:**
- Auto-fixes formatting issues (indentation, quotes, semicolons, etc.)
- Converts to Node.js protocol imports (`crypto` → `node:crypto`)
- Removes unused imports
- Applies template literals where appropriate
- Reports code quality warnings (unused variables, `any` types, etc.)

**Best Practice:**
Always include the `--write` flag to automatically apply safe fixes. Review the output to ensure all changes are intentional.

**CRITICAL: Always run type-check after Biome formatting**

After finishing file changes and running Biome format/lint, you MUST verify TypeScript types:

```bash
# 1. Format and lint specific files with Biome
pnpm biome check --write path/to/file1.ts path/to/file2.tsx

# 2. Run TypeScript type checking on ENTIRE project (tsgo limitation with path aliases)
pnpm type-check 2>&1 | grep -E "(file1|file2)"
```

**Important - TypeScript Native (tsgo) Path Alias Limitation:**
- ✅ **DO**: Run `pnpm type-check` on entire project (path aliases work correctly)
- ❌ **DON'T**: Run `pnpm type-check path/to/file.ts` (path aliases like `@/` fail)
- **Why**: `tsgo` cannot resolve `@/` imports when checking individual files
- **Solution**: Check entire project, then grep for your changed files to see relevant errors
- **Alternative**: Use `pnpm build` for comprehensive type checking with Next.js integration

**Why this matters:**
- Biome handles formatting and linting, but does NOT perform TypeScript type checking
- Type errors can break the build even if Biome passes
- `pnpm type-check` uses TypeScript Native (`tsgo`) for fast type validation
- Catches type issues before they cause runtime errors or build failures

**When to run type-check:**
- After modifying TypeScript files
- After Biome formatting
- Before committing changes
- Before creating pull requests

## Database Management

**IMPORTANT: Uses Neon PostgreSQL Database**
- Database operations use Drizzle ORM - see `src/lib/schemas/database/index.ts` (single source of truth)
- Always prefix commands with `dotenv --file .env.local run` for proper database connectivity
- DO NOT use Supabase MCP tools - this project uses Neon PostgreSQL

**Database Schema Architecture:**
- **Source of Truth**: `src/lib/schemas/database/index.ts` - All actual schema definitions live here
- **Generated Output**: `drizzle/schema.ts` and `drizzle/relations.ts` - Auto-generated by Drizzle Kit
- **Config**: `drizzle.config.ts` declares `src/lib/schemas/database/index.ts` as input schema

**Database Schema Usage:**
- **ALWAYS import schema from `src/lib/schemas/database/index.ts` or `@/lib/schemas/database`** - This is the single source of truth
- **NEVER import from `drizzle/schema.ts`** - This is generated output only
- **NEVER define tables inline** in scripts, API routes, or services
- **Import Examples**:
  - From source files: `import { users, apiKeys, stories, chapters } from '@/lib/schemas/database'`
  - From scripts: `import { users, apiKeys } from '../src/lib/db/schema'`
- **Why**: Prevents schema drift, ensures consistency, and maintains type safety across the entire codebase
- **Applies to**: All scripts, API routes, services, utilities, and test files

**Database Naming Convention:**
- **Table and column names use snake_case** (e.g., `created_at`, `updated_at`, `email_verified`)
- **NOT camelCase** (e.g., ~~`createdAt`~~, ~~`updatedAt`~~)
- In raw SQL queries, use snake_case without quotes: `created_at`, `updated_at`
- Drizzle ORM schema definitions use camelCase in TypeScript, but map to snake_case in PostgreSQL
- Example: TypeScript `createdAt` → PostgreSQL `created_at`

**Date Field Handling:**
- **ALWAYS use `.toISOString()` when storing Date objects to database**
- This ensures consistent ISO 8601 format across all date fields
- Example: `createdAt: new Date().toISOString()`
- Applies to all timestamp fields: `created_at`, `updated_at`, `published_at`, etc.
- **Why**: PostgreSQL stores timestamps in a specific format, and `.toISOString()` ensures compatibility and prevents timezone issues

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
  - **ai-server**: Python FastAPI service for AI text and image generation (port 8000)
  - **Separate servers**: Supports dedicated servers for image and text generation
  - Google Gemini 2.5 Flash & Flash Lite via Vercel AI SDK (text generation)
  - Google Gemini 2.5 Flash (image generation - 7:4 aspect ratio, 1344×768)
  - Direct provider API integration (no AI SDK Gateway)
- **Storage**: Vercel Blob for generated images
- **Styling**: Tailwind CSS v4

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication routes
│   ├── login/             # Login page
│   ├── studio/            # Story creation & management workspace
│   │   ├── new/           # New story creation
│   │   ├── edit/          # Story editing interface
│   │   ├── agent/         # AI agent features
│   │   ├── [id]/          # Story detail page
│   │   └── api/           # Studio API endpoints (generation, scenes, chapters)
│   ├── novels/            # Novel reading interface
│   │   ├── [id]/          # Novel reader by story ID
│   │   └── api/           # Novel-specific APIs
│   ├── comics/            # Comic reading interface
│   │   ├── [id]/          # Comic reader by story ID
│   │   └── api/           # Comic-specific APIs
│   ├── community/         # Story sharing & discussion
│   │   ├── story/         # Community story pages
│   │   └── api/           # Community APIs
│   ├── publish/           # Publishing & scheduling
│   │   └── api/           # Publishing APIs
│   ├── analysis/          # Performance metrics
│   │   ├── [storyId]/     # Story-specific analytics
│   │   └── api/           # Analytics APIs
│   ├── settings/          # User preferences
│   │   ├── appearance/    # Appearance settings
│   │   ├── privacy/       # Privacy settings
│   │   ├── writing/       # Writing preferences
│   │   ├── analysis/      # Analytics settings
│   │   ├── api-keys/      # API key management
│   │   └── api/           # Settings APIs
│   ├── test/              # Test pages for development
│   │   ├── shadcn-components/ # UI component testing
│   │   └── cache-performance/ # Cache performance testing
│   └── api/               # Global API endpoints
│       ├── auth/          # Auth APIs
│       ├── users/         # User management APIs
│       ├── images/        # Image processing APIs
│       ├── validation/    # Validation APIs
│       ├── upload/        # File upload APIs
│       ├── admin/         # Admin APIs
│       ├── placeholder/   # Placeholder APIs
│       └── cron/          # Cron job endpoints
├── components/            # React UI components
│   ├── ui/               # shadcn/ui components
│   ├── ads/              # Ad components
│   └── settings/         # Settings components
├── contexts/             # React context providers
├── lib/
│   ├── ai/               # AI integration layer
│   │   ├── providers/    # AI provider adapters
│   │   └── types/        # AI type definitions
│   ├── auth/             # NextAuth configuration & utilities
│   ├── cache/            # Cache management (Redis, in-memory)
│   ├── redis/            # Redis client and utilities
│   ├── db/               # Database schema (Drizzle ORM)
│   ├── studio/           # Studio-specific services
│   ├── novels/           # Novel generation services
│   ├── evaluation/       # Content evaluation services
│   ├── services/         # Shared services (image, formatting, validation)
│   ├── storage/          # Blob storage utilities
│   ├── monitoring/       # Application monitoring
│   ├── constants/        # Application constants
│   ├── utils/            # Utility functions
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
- **Progress Tracking**: Writing statistics

## Environment Setup

**Setup Instructions:**
1. Copy `.env.example` to `.env.local`
2. Fill in your actual values
3. **NEVER commit `.env.local` to version control**

**Required Environment Variables:**
```bash
# =============================================================================
# AI Server Configuration
# =============================================================================

# Image Generation AI Server
AI_SERVER_IMAGE_URL="http://localhost:8000"
AI_SERVER_IMAGE_TIMEOUT="120000"

# Text Generation AI Server
AI_SERVER_TEXT_URL="http://localhost:8000"
AI_SERVER_TEXT_TIMEOUT="120000"

# ComfyUI Configuration for AI Server (optional - used by ai-server for image generation)
AI_SERVER_COMFYUI_URL="http://127.0.0.1:8188"

# AI Server Generation Mode (optional - used by ai-server to control generation behavior)
# Options: "image" | "text" | "both"
AI_SERVER_GENERATION_MODE="image"

# =============================================================================
# Authentication
# =============================================================================
# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET="your-auth-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Generative AI API Key (for Gemini models)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# =============================================================================
# Database Configuration
# =============================================================================
# Neon PostgreSQL Database (pooled connection for runtime)
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech:5432/database?sslmode=require"

# Neon PostgreSQL Database (direct connection for migrations)
DATABASE_URL_UNPOOLED="postgresql://user:password@host.region.aws.neon.tech:5432/database?sslmode=require"

# =============================================================================
# Storage
# =============================================================================
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token-here"

# =============================================================================
# Gemini Model Configuration
# =============================================================================
GEMINI_MODEL_NAME="gemini-2.5-flash-mini"
GEMINI_MAX_TOKENS="8192"
GEMINI_TEMPERATURE="0.7"

# =============================================================================
# Text Generation Provider
# =============================================================================
# Options: "ai-server" | "gemini"
TEXT_GENERATION_PROVIDER="ai-server"

# =============================================================================
# Analytics & Monitoring
# =============================================================================
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Google AdSense
NEXT_PUBLIC_GOOGLE_ADSENSE_ID="ca-pub-XXXXXXXXXXXXXXXX"

# =============================================================================
# Session Storage
# =============================================================================
# Redis URL for session management
REDIS_URL="redis://default:password@host:port"

# =============================================================================
# Vercel Deployment (Auto-generated by Vercel CLI)
# =============================================================================
# This token is automatically generated when deploying to Vercel
# You don't need to manually set this for local development
VERCEL_OIDC_TOKEN="auto-generated-by-vercel-cli"
```

**Database Connection Details:**
- **DATABASE_URL**: Pooled connection (with `-pooler` in hostname) - Use for application runtime
- **DATABASE_URL_UNPOOLED**: Direct connection (no `-pooler`) - Required for Drizzle migrations
- Both connections point to the same database, only the connection method differs

**AI Server Configuration Details:**

The platform supports flexible AI server configuration with separate servers for image and text generation:

**Required Environment Variables:**
- `AI_SERVER_IMAGE_URL` - Dedicated server for image generation (required)
- `AI_SERVER_IMAGE_TIMEOUT` - Image generation timeout in ms (default: 120000)
- `AI_SERVER_TEXT_URL` - Dedicated server for text generation (required)
- `AI_SERVER_TEXT_TIMEOUT` - Text generation timeout in ms (default: 120000)
- `AI_SERVER_COMFYUI_URL` - ComfyUI server URL (used by ai-server, optional)
- `AI_SERVER_GENERATION_MODE` - Generation mode: "image" | "text" | "both" (used by ai-server, optional)

**Configuration Approach:**

The platform uses **explicit configuration** with separate URLs for image and text generation. This provides:
- Clear separation of concerns
- Independent scaling of image and text servers
- No ambiguity about which server handles which task

**Example Configurations:**

```bash
# Configuration 1: Separate servers for image and text (recommended for production)
AI_SERVER_IMAGE_URL="http://image-server.example.com:8000"
AI_SERVER_IMAGE_TIMEOUT="120000"
AI_SERVER_TEXT_URL="http://text-server.example.com:8001"
AI_SERVER_TEXT_TIMEOUT="120000"

# Configuration 2: Same server for both (simpler for development)
AI_SERVER_IMAGE_URL="http://localhost:8000"
AI_SERVER_IMAGE_TIMEOUT="120000"
AI_SERVER_TEXT_URL="http://localhost:8000"
AI_SERVER_TEXT_TIMEOUT="120000"

# Configuration 3: With ComfyUI integration
AI_SERVER_IMAGE_URL="http://localhost:8000"
AI_SERVER_TEXT_URL="http://localhost:8000"
AI_SERVER_COMFYUI_URL="http://127.0.0.1:8188"
AI_SERVER_GENERATION_MODE="both"
```

## Authentication System

**Cross-System Compatible Authentication**

The web app uses a unified authentication system compatible with the AI server, supporting both API keys and session-based authentication.

**Complete Documentation**: [../../docs/operation/cross-system-authentication.md](../../docs/operation/cross-system-authentication.md)

### Quick Reference

**API Key Format**: `fic_<base64url>` (~47 characters total)
- **Generation**: 32 random bytes, base64url encoded
- **Hashing**: bcrypt (compatible with ai-server)
- **Prefix Length**: 16 characters (for fast lookup)

**Setup Authentication**:
```bash
# Create users and API keys
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts

# Verify setup
dotenv --file .env.local run pnpm exec tsx scripts/verify-auth-setup.ts

# Validate credentials
node scripts/validate-auth-credentials.mjs --verbose
```

**Permission Scopes** (aligned with ai-server):
- **Manager**: All scopes including `admin:all`
- **Writer**: `stories:write`, `images:write`, `ai:use`, etc.
- **Reader**: Read-only scopes (`stories:read`, `images:read`, etc.)

**Dual Authentication**:
- **API Keys**: For scripts, external services, cross-system calls
- **Sessions**: For web app users (NextAuth.js with Google OAuth + email/password)

**Troubleshooting API Key Authentication:**

⚠️ **CRITICAL**: Web app and AI server must share the same API keys in the database

**Common Issue - 401 Unauthorized Error:**

**Symptom:**
```
AI Server error: 401 - {"detail":"Invalid or expired API key"}
```

**Root Cause:**
- API keys in `.auth/user.json` don't exist in the shared database
- Stale API keys from previous setup
- Web app and AI server using different databases
- AI server hasn't reloaded database connections

**Diagnosis Steps:**
```bash
# 1. Verify API keys in database
pnpm dotenv -e .env.local -- pnpm exec tsx scripts/verify-auth-setup.ts

# 2. Check .auth/user.json structure
cat .auth/user.json | jq '.profiles.writer.apiKey'

# 3. Check AI server is using same DATABASE_URL
grep "DATABASE_URL" ../../.env.local
```

**Resolution:**
```bash
# 1. Regenerate and sync API keys to database
pnpm dotenv -e .env.local -- pnpm exec tsx scripts/setup-auth-users.ts

# 2. Restart AI server to reload database connections
cd ../ai-server
fuser -k 8000/tcp
sleep 3
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > ../../logs/ai-server.log 2>&1 &

# 3. Verify new API keys work
cd ../web
pnpm dotenv -e .env.local -- pnpm exec tsx scripts/verify-auth-setup.ts
```

**Verification:**
- ✅ `verify-auth-setup.ts` shows 3 users with active API keys
- ✅ `.auth/user.json` profiles match database key prefixes
- ✅ Both `main` and `develop` environments have same keys
- ✅ AI server responds without 401 errors

**Prevention:**
- Always run `verify-auth-setup.ts` before testing
- Keep AI server and web app in sync
- Restart AI server after database changes

See [cross-system-authentication.md](../../docs/operation/cross-system-authentication.md) for complete details.

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
- **🧪 Testing Guide**: [docs/novels/novels-evaluation.md](docs/novels/novels-evaluation.md) - Validation and quality metrics
- **⚡ Optimization**: [docs/novels/novels-optimization.mdx](docs/novels/novels-optimization.mdx) - Performance tuning

**Quick Reference:**
- **UI**: `/studio/new` - Novel creation page
- **API**: `/studio/api/novels/*` - Generation endpoints (SSE streaming)
- **Model**: Gemini 2.5 Flash & Flash Lite (via Vercel AI SDK)

**Generation Pipeline:**
9-phase system: Story Summary → Characters → Settings → Parts → Chapters → Scene Summaries → Scene Content → Scene Evaluation → Images

**Output:**
- Complete story structure with moral framework
- Character profiles with AI-generated portraits
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

**⚠️ DESTRUCTIVE OPERATION - Story Data Deletion**

**Available Scripts:**
- **Remove single story**: `scripts/remove-story.ts`
  - **Authentication**: Uses writer or manager API key from `.auth/user.json`
  - **API Endpoint**: `POST /studio/api/remove-story` (writer/admin endpoint)
  - **Scope**: Deletes one story and all related data
- **Reset all stories**: `scripts/reset-all-stories.ts`
  - **Authentication**: Uses manager API key from `.auth/user.json`
  - **API Endpoint**: `POST /studio/api/reset-all` (admin-only)
  - **Scope**: Deletes ALL stories and related data

**Usage:**
```bash
# Remove single story - Preview mode
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID

# Remove single story - Execute removal
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm

# Reset all stories - Preview mode
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts

# Reset all stories - Execute reset
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm

# Background execution with logging
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm > logs/remove-story.log 2>&1 &
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm > logs/reset-all.log 2>&1 &
```

**What Gets Removed:**

**Single Story (`remove-story.ts`):**
- **Database records**: One story and all related parts, chapters, scenes, characters, settings
- **Vercel Blob images**: All files under `stories/{storyId}/` prefix
  - Story cover image and variants
  - Scene images and all variants
  - Character portraits and variants
  - Setting visuals and variants

**All Stories (`reset-all-stories.ts`):**
- **Database records**: ALL stories, parts, chapters, scenes, characters, settings
- **Vercel Blob images**: ALL images under `stories/` prefix (all story data)

**Common Details:**
- **Image specs**: Story/scene (1344×768, 7:4), character (1024×1024), setting (1344×768, 7:4)
- **Optimized variants**: AVIF + JPEG × mobile 1x/2x per image
- **Deletion method**: Batch deletion (100 files per batch)

**Safety Features:**
- ✅ Preview mode by default (no deletion without `--confirm`)
- ✅ 5-second countdown before execution (Ctrl+C to cancel)
- ✅ Detailed deletion report with exact counts
- ✅ Audit log saved to `logs/` directory
- ✅ `remove-story.ts`: Requires `stories:write` or `admin:all` scope (writer/manager)
- ✅ `reset-all-stories.ts`: Requires `admin:all` scope (manager only)

## Novel Generation

**IMPORTANT: Documentation-First Development Process**

The novel generation system uses the Adversity-Triumph Engine methodology with a strict documentation-first approach to ensure synchronization across documentation, implementation, and automation tools.

### Novel Generation Change Protocol

When making ANY changes to the novel generation system, ALWAYS follow this order:

**1. FIRST: Update Documentation** (`docs/novels/`)
- **Primary documentation files:**
  - `novels-specification.md` - Core concepts, data model, theoretical foundation
  - `novels-development.md` - API architecture, system prompts, implementation specs
  - `novels-evaluation.md` - Validation methods, quality metrics, test strategies
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
   - `src/lib/schemas/database/index.ts` - Drizzle ORM schema definitions (source of truth)
   - `drizzle/migrations/*.sql` - Database migration files
   - `drizzle/schema.ts` - Auto-generated schema (do not edit manually)

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
4. Update `src/lib/schemas/database/index.ts` - Add field to scenes table schema
5. Update TypeScript interfaces in components using scenes
6. Update API routes that create/update scenes
7. Update UI components displaying scene data

### Novel Generation System Overview

**Architecture:**
- **Location**: `docs/novels/novels-development.md` - Complete specification
- **Methodology**: Adversity-Triumph Engine (Korean Gam-dong narrative psychology)
- **API Endpoint**: `POST /studio/api/novels` - Unified generation API with SSE streaming
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
- 🧪 **Testing Guide**: `docs/novels/novels-evaluation.md` - Validation and quality metrics
- ⚡ **Optimization**: `docs/novels/novels-optimization.md` - Performance and cost tuning
- 🛠️ **Script**: `scripts/generate-minimal-story.mjs` - Production script for minimal story generation

**Generation System:**
- The platform uses the Adversity-Triumph Engine methodology for novel generation
- All story generation uses the unified `/studio/api/novels/*` system
- Image generation and optimization infrastructure is shared across all features

## Code Guidelines

**Core Development Practices:**
- **Package Manager**: Use pnpm instead of npm for all operations
- **Environment Variables**: Always prefix commands with `dotenv --file .env.local run`
- **Authentication**: Use NextAuth.js session management throughout
- **Database**: All operations through Drizzle ORM - see `src/lib/db/`
- **Code Organization by Purpose**:
  - **`studio`**: Creation/generation functionality (write operations)
    - Story generation, editing, and management
    - AI-powered content creation
    - Location: `src/lib/studio/`, `src/app/studio/`
  - **`novels`**: Novel reading/viewing functionality (read operations)
    - Story display and reading experience
    - Location: `src/lib/novels/` (minimal), `src/app/novels/`
  - **`comics`**: Comic reading/viewing functionality (read operations)
    - Comic panel display and reader interface
    - Location: `src/app/comics/`
  - **Principle**: If you write generation-related code, relate it to `studio`. If you write reading-related code, relate it to `novels` or `comics`.
- **API Route Organization**:
  - **Page-specific APIs**: Create API routes under the related page directory (e.g., `/studio/api/`, `/analytics/api/`)
  - **Common APIs**: Use `/api/` directory only for global/shared API endpoints
  - **Example**: Studio-related APIs go in `src/app/studio/api/novels/*` instead of `src/app/api/studio/generation/*`
- **AI Integration**:
  - **AI SDK**: Use Vercel AI SDK
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
- **TypeScript Coding Standards**:
  - Use `const` over `let` for immutable variables
  - Set explicit type annotations for variables and function signatures
  - Use typed variables for API request bodies (don't inline objects in fetch calls)

## File Naming Conventions

**Use kebab-case for all file names** (lowercase with dashes):

| File Type | Convention | Example |
|-----------|------------|---------|
| React Hooks | `use-<feature-name>.ts` | `use-story-reader.ts` |
| Components | `<component-name>.tsx` | `chapter-reader-client.tsx` |
| Utilities | `<utility-name>.ts` | `cache-invalidation.ts` |
| API Routes | `route.ts` (Next.js convention) | `route.ts` |

**Hooks Directory Structure:**
All custom React hooks are located in `src/hooks/`:

```
src/hooks/
├── use-story-reader.ts      # Novel story reading
├── use-story-writer.ts      # Story editing
├── use-chapter-scenes.ts    # Scene loading
├── use-persisted-swr.ts     # SWR with localStorage
├── use-comments.ts          # Comment system
├── use-page-cache.ts        # Page-level caching
└── ...
```

**Why kebab-case:**
- Modern convention used by Next.js, shadcn/ui, Vercel
- Avoids case-sensitivity issues across different file systems
- More readable than camelCase for file names
- Consistent with component file naming in the project

**Avoid:**
- ❌ `useStoryReader.ts` (camelCase)
- ❌ `use_story_reader.ts` (snake_case)
- ❌ `UseStoryReader.ts` (PascalCase for non-component files)

## Image Generation & Optimization

**Complete Image System Documentation:**
- **📖 Architecture**: [docs/image/image-architecture.mdx](docs/image/image-architecture.mdx) - System overview
- **🎨 Generation**: [docs/image/image-generation.mdx](docs/image/image-generation.mdx) - Image generation guide
- **⚡ Optimization**: [docs/image/image-optimization.mdx](docs/image/image-optimization.mdx) - Optimization pipeline

**Quick Reference:**

### Image Generation
- **Service**: `src/lib/novels/` - Novel generation handles image creation
- **API Endpoint**: POST `/studio/api/novels/images` - Generate story illustrations
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
- **🧪 Testing**: [docs/novels/novels-evaluation.md](docs/novels/novels-evaluation.md) - Quality metrics & validation

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

**Complete Feature Documentation:** See **[docs/CLAUDE.md](docs/CLAUDE.md)** for the complete documentation index.

**IMPORTANT: When you change code, update the related documentation IMMEDIATELY.**

**Quick Reference:**
- **All feature docs** → `docs/CLAUDE.md` - Complete documentation index
- **Generate novels** → `docs/novels/novels-specification.md`
- **Optimize images** → `docs/image/image-optimization.md`
- **Add UI components** → `docs/ui/ui-specification.md`
- **Improve performance** → `docs/performance/optimization-novels.md`
- **Set up testing** → `docs/test/test-specification.md`

---

**Code Completion Standards:**
- NEVER use ellipsis ("...") as placeholders in code
- Always write complete, explicit code with all parameters, imports, and statements
- Every line of code should be production-ready and executable
- No shortcuts or omissions in code implementation
- **TypeScript Validation:**
  - **TypeScript Native**: This project uses Microsoft's TypeScript Native (`@typescript/native-preview`) for 10x faster type checking
  - **Command**: `pnpm type-check` or `pnpm type-check:watch` (uses `tsgo` instead of `tsc`)
  - **Performance**: TypeScript Native provides significant performance improvements (8-10x faster) while maintaining full compatibility
  - **Build validation**: `pnpm build` for authoritative type checking with Next.js integration
  - **Configuration**: `tsconfig.json` configured for TypeScript Native (no `baseUrl`, uses relative paths)

**Git and Repository Management:**
- Always check current git repository URL before using GitHub MCP tools
- Follow conventional commit message format
- Use feature branches for development work
