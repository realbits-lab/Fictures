# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Information

- **Repository**: https://github.com/realbits-lab/Fictures
- **Project**: Fictures - AI-powered story writing platform

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
- Use proper environment variable loading with `dotenv --file .env.local run` prefix

**File Organization Guidelines:**
- **Test Files**: Always write test files in `tests/` or `__tests__/` directories
  - E2E tests: `tests/*.spec.ts` (Playwright tests)
  - Unit tests: `__tests__/*.test.ts` or `__tests__/*.test.tsx` (Jest tests)
- **Script Files**: Always write script files in `scripts/` directory
  - Example: `scripts/capture-auth-manual.mjs` for authentication capture
  - Example: `scripts/test-auto-login.mjs` for testing automated login

## Database Management

**IMPORTANT: Uses Neon PostgreSQL Database**
- Database operations use Drizzle ORM - see `src/lib/db/schema.ts`
- Always prefix commands with `dotenv --file .env.local run` for proper database connectivity
- DO NOT use Supabase MCP tools - this project uses Neon PostgreSQL

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
- **Command**: `dotenv --file .env.local run npx playwright test --headless`
- **Background Testing**: `dotenv --file .env.local run npx playwright test --headless > logs/playwright.log 2>&1 &`
- **Authentication**: Uses `.auth/user.json` for Google OAuth testing
- **Test Setup**: Run setup project first for authentication state
- **Headless Mode**: Always use `--headless` option for automated testing

**Google OAuth Authentication Setup for Playwright:**
1. **Initial Capture**: Run `dotenv --file .env.local run node scripts/capture-auth-manual.mjs`
   - Opens browser for manual Google login with test.user@example.com
   - Automatically captures authentication state to `.auth/user.json`
   - Includes NextAuth.js session cookies and Google OAuth tokens

2. **Testing Automatic Login**: Run `dotenv --file .env.local run node scripts/test-auto-login.mjs`
   - Verifies stored credentials work for automatic authentication
   - Tests navigation to protected routes like `/stories`

3. **Using in Playwright Tests**:
   ```javascript
   // In your Playwright test files
   const { test, expect } = require('@playwright/test');

   test.use({
     storageState: '.auth/user.json'
   });

   test('authenticated user can access stories', async ({ page }) => {
     await page.goto('http://localhost:3000/stories');
     // Test runs with Google authentication
   });
   ```

4. **Refreshing Authentication**: When credentials expire, re-run capture script:
   ```bash
   dotenv --file .env.local run node scripts/capture-auth-manual.mjs
   ```

## Architecture Overview

**Next.js 15 Story Writing Platform** with the following stack:

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: NextAuth.js v5 with Google OAuth
- **AI Integration**: OpenAI GPT-4o-mini via Vercel AI Gateway
- **Styling**: Tailwind CSS v4

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication routes
│   ├── stories/           # Story management
│   ├── write/             # Writing interface
│   ├── community/         # Story sharing
│   ├── api/               # API endpoints
│   └── settings/          # User settings
├── components/            # React UI components
├── lib/
│   ├── auth/             # NextAuth configuration
│   ├── db/               # Database schema & operations
│   └── hooks/            # Custom React hooks
└── types/                # TypeScript definitions
```

### Database Schema

**Core Story Writing Tables:**
- **users**: User accounts with Google OAuth
- **stories**: Main story entities with metadata
- **parts**: Optional story sections
- **chapters**: Story chapters with content organization
- **scenes**: Chapter breakdown for detailed writing
- **characters**: Story character management
- **aiInteractions**: AI writing assistance tracking
- **communityPosts**: Basic story sharing features

### Key Features
- **Hierarchical Writing**: Stories → Parts → Chapters → Scenes
- **Character Management**: Detailed character profiles and tracking
- **AI Writing Assistant**: OpenAI GPT-4o-mini integration for writing help
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
AI_GATEWAY_API_KEY=***             # Vercel AI Gateway for OpenAI GPT-4o-mini

# Database & Storage
POSTGRES_URL=***                   # Neon PostgreSQL
BLOB_READ_WRITE_TOKEN=***          # Vercel Blob storage
REDIS_URL=***                      # Session storage
```

## Development Workflow

1. **Setup**: `pnpm install` → Set up `.env.local` → `pnpm db:migrate`
2. **Development**: `dotenv --file .env.local run pnpm dev` (background process)
3. **Testing**: `dotenv --file .env.local run npx playwright test --headless`
4. **Building**: `pnpm build` (includes type checking)

## Code Guidelines

**Core Development Practices:**
- **Package Manager**: Use pnpm instead of npm for all operations
- **Environment Variables**: Always prefix commands with `dotenv --file .env.local run` 
- **Authentication**: Use NextAuth.js session management throughout
- **Database**: All operations through Drizzle ORM - see `src/lib/db/`
- **AI Integration**: Use OpenAI GPT-4o-mini via Vercel AI Gateway with AI_GATEWAY_API_KEY
- **Error Handling**: Implement proper error boundaries and loading states
- **Performance**: Optimize for story writing workflow and database queries

**Code Completion Standards:**
- NEVER use ellipsis ("...") as placeholders in code
- Always write complete, explicit code with all parameters, imports, and statements
- Every line of code should be production-ready and executable
- No shortcuts or omissions in code implementation

**Git and Repository Management:**
- Always check current git repository URL before using GitHub MCP tools
- Follow conventional commit message format
- Use feature branches for development work