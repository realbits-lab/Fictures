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
  - Main script: `scripts/generate-complete-story.mjs` for full story generation
- **Claude Code Skills**: Project-specific skills in `.claude/skills/{skill-name}/` directories
  - Each skill has `SKILL.md` with YAML frontmatter
  - `story-generator/SKILL.md`: Complete story generation with HNS methodology
  - `story-remover/SKILL.md`: Complete story removal with database and Blob cleanup
  - Skills are model-invoked (Claude activates automatically based on request)

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
   - Opens browser for manual Google login with manager@fictures.xyz account
   - Automatically captures authentication state to `.auth/user.json`
   - Includes NextAuth.js session cookies and Google OAuth tokens
   - **Testing Account**: Always use manager@fictures.xyz from `.auth/user.json` for web API and UI testing

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
- **AI Integration**:
  - OpenAI GPT-4o-mini via Vercel AI Gateway (text generation)
  - OpenAI DALL-E 3 (image generation - 16:9, 1792x1024)
- **Storage**: Vercel Blob for generated images
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
- **AI Image Generation**: DALL-E 3 for story illustrations (16:9, 1792x1024) with automatic optimization
- **Image Optimization**: 18 variants per image (AVIF, WebP, JPEG × 6 sizes) for optimal performance
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
OPENAI_API_KEY=***                 # OpenAI API key for DALL-E 3 image generation

# Database & Storage
POSTGRES_URL=***                   # Neon PostgreSQL
BLOB_READ_WRITE_TOKEN=***          # Vercel Blob storage for generated images
REDIS_URL=***                      # Session storage
```

## Development Workflow

1. **Setup**: `pnpm install` → Set up `.env.local` → `pnpm db:migrate`
2. **Development**: `dotenv --file .env.local run pnpm dev` (background process)
3. **Testing**: `dotenv --file .env.local run npx playwright test --headless`
4. **Building**: `pnpm build` (includes type checking)

## Story Generation

**Complete Story Generation Script:**
- **Location**: `scripts/generate-complete-story.mjs`
- **Authentication**: Uses writer@fictures.xyz from `.auth/user.json`
- **API Endpoints**:
  - `POST /api/stories/generate-hns` (story generation with SSE streaming)
  - `PUT /api/stories/{id}/visibility` (publishing)

**Usage:**
```bash
# Default prompt (draft)
dotenv --file .env.local run node scripts/generate-complete-story.mjs

# Custom prompt (draft)
dotenv --file .env.local run node scripts/generate-complete-story.mjs "Your story idea here"

# Custom prompt with auto-publish
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "Your story idea here"

# Background execution with logging
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "Story prompt" > logs/story-generation.log 2>&1 &
```

**What It Generates:**
- Story metadata (title, genre, premise, dramatic question, theme)
- Parts (3-act structure)
- Chapters (detailed chapter specifications)
- Scenes (full scene content)
- Characters (with AI-generated portrait images)
- Settings (with AI-generated environment images)

**Routes:**
- All stories: `/writing`
- Edit story: `/writing/{storyId}`
- Read story: `/reading/{storyId}`
- Community view: `/community/story/{storyId}` (published stories only)

**Generation Time:** 3-15 minutes depending on story size

**Claude Code Skill:**
- Use the `story-generator` skill in `.claude/skills/story-generator.md`
- Skill handles complete workflow: prompt gathering, execution, monitoring, and reporting
- Automatically uses writer@fictures.xyz credentials
- Supports both draft and published story generation
- User says "create" → auto-publish
- User says "generate" or "write" → draft only
- Provides real-time progress updates and final summary with links

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
- **Vercel Blob images**: All images at 1792x1024 (16:9 ratio) - character portraits, setting visuals, scene images
- **Community data**: posts, likes, replies, bookmarks
- **Analytics data**: reading sessions, insights, events

**Safety Features:**
- Confirmation prompts for bulk operations
- Dry-run mode to preview deletions
- Transaction-based for atomicity
- Audit logging of deletions
- Owner verification (only story owner or admin can delete)

**Claude Code Skill:**
- Use the `story-remover` skill in `.claude/skills/story-remover.md`
- Skill handles complete workflow: identification, confirmation, execution, and cleanup reporting
- Automatically uses writer@fictures.xyz credentials
- Supports single and bulk story removal
- Always confirms before permanent deletion
- Reports detailed cleanup summary with counts

## Code Guidelines

**Core Development Practices:**
- **Package Manager**: Use pnpm instead of npm for all operations
- **Environment Variables**: Always prefix commands with `dotenv --file .env.local run`
- **Authentication**: Use NextAuth.js session management throughout
- **Database**: All operations through Drizzle ORM - see `src/lib/db/`
- **AI Integration**:
  - Text Generation: Use OpenAI GPT-4o-mini via Vercel AI Gateway with AI_GATEWAY_API_KEY
  - Image Generation: Use OpenAI DALL-E 3 with OPENAI_API_KEY (16:9, 1792x1024)
  - Image Optimization: Automatic generation of 18 variants (AVIF, WebP, JPEG in 6 sizes)
- **Image Storage**: Generated images stored in Vercel Blob with public access
- **Error Handling**: Implement proper error boundaries and loading states
- **Performance**: Optimize for story writing workflow and database queries

## Image Generation & Optimization

**AI-Powered Story Illustrations with Automatic Optimization:**

### Image Generation
- **Service**: `src/lib/services/image-generation.ts` - Primary image generation service
- **Optimization Service**: `src/lib/services/image-optimization.ts` - Creates 18 optimized variants
- **API Endpoint**: POST `/api/images/generate` - Generate story illustrations
- **Model**: OpenAI DALL-E 3
- **Original Format**: 1792x1024 pixels (16:9 widescreen), PNG
- **Quality**: Standard quality for all image types
- **Storage**: Vercel Blob (automatic upload)

### Automatic Image Optimization
Every generated image automatically creates **18 optimized variants**:
- **Formats**: AVIF (best compression), WebP (fallback), JPEG (universal fallback)
- **Sizes**: Mobile (640×360, 1280×720), Tablet (1024×576, 2048×1152), Desktop (1440×810, 2880×1620)
- **Total**: 3 formats × 6 sizes = 18 variants per image
- **Performance**: 87% faster loading on mobile, 50% smaller file sizes with AVIF

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

**Code Completion Standards:**
- NEVER use ellipsis ("...") as placeholders in code
- Always write complete, explicit code with all parameters, imports, and statements
- Every line of code should be production-ready and executable
- No shortcuts or omissions in code implementation

**Git and Repository Management:**
- Always check current git repository URL before using GitHub MCP tools
- Follow conventional commit message format
- Use feature branches for development work