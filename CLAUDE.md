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

### Navigation Menu Structure

**Global Navigation (GNB) Menu Items:**
- **Studio** (🎬) - `/studio` - Story creation and management workspace (writers/managers only)
- **Novels** (📖) - `/novels` - Browse and read text-based stories (all users)
- **Comics** (🎨) - `/comics` - Browse and read visual/comic format stories (all users)
- **Community** (💬) - `/community` - Story sharing and discussion (all users)
- **Publish** (📤) - `/publish` - Publish stories to community (writers/managers only)
- **Analytics** (📊) - `/analytics` - Story performance metrics (writers/managers only)
- **Settings** (⚙️) - `/settings` - User preferences (authenticated users)

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
- Scenes (full scene content with automatic quality evaluation)
  - Each scene evaluated on 5 categories (plot, character, pacing, prose, world-building)
  - Iterative improvement until 3.0+/4.0 quality threshold (max 2 iterations)
  - AI-powered evaluation using "Architectonics of Engagement" framework
- Characters (with AI-generated portrait images in 16:9, 1792x1024)
- Settings (with AI-generated environment images in 16:9, 1792x1024)

**Routes:**
- Studio (story management): `/studio`
- Edit story: `/studio/edit/story/{storyId}`
- Edit chapter: `/studio/edit/{chapterId}`
- Browse novels (reading): `/novels`
- Read novel: `/novels/{storyId}`
- Browse comics (comic format): `/comics`
- Read comic: `/comics/{storyId}`
- Community view: `/community/story/{storyId}` (published stories only)

**Generation Time:** 4-20 minutes depending on story size and complexity
- Scene evaluation adds 1-3 minutes per story
- Each scene evaluated and improved iteratively for quality assurance

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
- **Vercel Blob images**: ALL images found using Vercel Blob list API by prefix `stories/{storyId}/`
  - Story cover images (1792x1024, 16:9)
  - Scene images (1792x1024, 16:9)
  - Character portraits (1024x1024)
  - Setting visuals (1792x1024, 16:9)
  - All optimized variants (AVIF, WebP, JPEG in multiple sizes)
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
  - Scene Evaluation: Use OpenAI GPT-4o-mini via Vercel AI Gateway (automatic quality assessment)
  - Scene Improvement: Use OpenAI GPT-4o-mini via Vercel AI Gateway (iterative refinement)
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

## Scene Quality Evaluation and Validation

**Automated Scene Evaluation, Formatting, and Image Validation:**

Every scene generated through the story generation pipeline is automatically:
1. **Formatted** - Rule-based text formatting for optimal mobile readability
2. **Validated** - Image existence and accessibility checking with auto-regeneration
3. **Evaluated** - Quality assessment using "Architectonics of Engagement" framework
4. **Improved** - Iterative refinement until professional quality standards are met

### Automated Formatting Rules

**Text Formatting** (`src/lib/services/scene-formatter.ts`):

Every scene undergoes deterministic rule-based formatting BEFORE evaluation:

1. **Description Paragraph Length**: Max 3 sentences per description paragraph
   - Long paragraphs are automatically split for mobile readability
   - Example: 5-sentence paragraph → split into 2 paragraphs (3 + 2)

2. **Spacing Between Description and Dialogue**: Blank line (2 newlines) required
   - Ensures visual separation between narrative and dialogue
   - Automatically inserted if missing

**Why Automated?** AI models struggle to consistently follow exact formatting rules. Post-processing ensures 100% compliance.

**Performance**: ~10-50ms per scene, negligible cost

**Testing**:
```bash
dotenv --file .env.local run pnpm test -- __tests__/scene-formatter.test.ts
```

### Automated Image Validation

**Image Validation** (`src/lib/services/image-validator.ts`):

Every scene's image is validated during the first evaluation iteration:

1. **Image URL Exists**: Scene must have non-null `imageUrl`
2. **Image URL Accessible**: HEAD request verifies image returns HTTP 200
3. **Optimized Variants Exist**: 18 variants (AVIF, WebP, JPEG × 6 sizes)

**Auto-Regeneration**: If any check fails and `regenerateIfMissing: true`:
- Extract visual description from scene content (first 2-3 paragraphs)
- Build cinematic image prompt with scene title, setting, characters
- Generate new image via DALL-E 3 (1792×1024, 16:9)
- Create 18 optimized variants automatically
- Update database with new URLs

**Performance**:
- Validation: ~50-200ms per scene (network request)
- Regeneration: ~2-4 seconds per scene (when needed)
- Expected regeneration rate: 1-5% of scenes

**Testing**:
```bash
dotenv --file .env.local run pnpm test -- __tests__/image-validator.test.ts
```

### Evaluation Framework

**Based on**: "Architectonics of Engagement" - a narrative quality assessment framework

**Evaluation Service**: `src/lib/services/scene-evaluation-loop.ts`

**API Endpoint**: POST `/api/evaluation/scene` - Evaluate individual scenes

### Quality Metrics

Each scene is scored on a **1-4 scale** across 5 categories:

1. **Plot** (Goal Clarity, Conflict Engagement, Stakes Progression)
   - Scene has clear dramatic goal
   - Conflict is compelling and escalates
   - Stakes are evident and meaningful

2. **Character** (Voice Distinctiveness, Motivation Clarity, Emotional Authenticity)
   - Characters have unique voices
   - Motivations drive action
   - Emotions feel genuine and earned

3. **Pacing** (Tension Modulation, Scene Rhythm, Narrative Momentum)
   - Tension rises and falls strategically
   - Scene moves at engaging pace
   - Momentum propels story forward

4. **Prose** (Sentence Variety, Word Choice Precision, Sensory Engagement)
   - Sentences vary in length and structure
   - Words are precise and evocative
   - Multiple senses engaged

5. **World-Building** (Setting Integration, Detail Balance, Immersion)
   - Setting supports and enhances action
   - Details enrich without overwhelming
   - Reader feels present in the scene

### Scoring Scale

- **1.0 - Nascent**: Foundational elements present but underdeveloped
- **2.0 - Developing**: Core elements functional but needing refinement
- **3.0 - Effective**: Professionally crafted, engaging, meets quality standards ✅
- **4.0 - Exemplary**: Exceptional craft, deeply immersive, publishable excellence

### Evaluation Loop Process

```typescript
// Automatic evaluation for each scene during generation
import { evaluateAndImproveScene } from '@/lib/services/scene-evaluation-loop';

const result = await evaluateAndImproveScene(
  sceneId,
  sceneContent,
  {
    maxIterations: 2,           // Limit iterations to control cost/time
    passingScore: 3.0,          // "Effective" level required
    improvementLevel: 'moderate', // Balanced refinement
    storyContext: {
      storyGenre: 'mystery',
      arcPosition: 'middle',
      chapterNumber: 3,
      characterContext: ['Detective Sarah - driven investigator', 'Suspect John - nervous accountant']
    }
  }
);

// Returns:
// - scene: Updated scene object
// - evaluations: Array of all evaluation results
// - iterations: Number of improvement cycles
// - finalScore: Overall quality score (0-4)
// - passed: Whether scene met threshold
// - improvements: List of changes made
```

### Integration in Story Generation

Evaluation is integrated into `src/lib/ai/scene-content-generator.ts` as **Phase 7.5**:

1. Scene content is generated (Phase 7)
2. Scene is evaluated against quality metrics (Phase 7.5)
3. If score < 3.0, AI improves scene based on feedback
4. Re-evaluation occurs (max 2 total iterations)
5. Scene is accepted when passing or max iterations reached
6. Process continues to next scene

### Configuration

**Default Settings** (configured in scene-content-generator.ts):
- **Max Iterations**: 2 (to control generation time and cost)
- **Passing Score**: 3.0/4.0 (Effective level)
- **Improvement Level**: 'moderate' (balanced refinement)
- **Context**: Full story context (genre, arc position, character info)

### Expected Results

Based on testing and design:
- **70-80%** of scenes pass on first evaluation
- **15-20%** require one improvement iteration
- **5-10%** reach max iterations without passing threshold
- **Average final score**: 3.2-3.5/4.0 across all scenes

### Performance Impact

- **Time Added**: 1-3 minutes per story (depending on scene count)
- **Cost**: Minimal (uses GPT-4o-mini for evaluation and improvement)
- **Quality Improvement**: Scenes are more engaging, better paced, and professionally crafted

### Improvement Actions

When a scene scores below 3.0, the AI:
- Reviews high-priority feedback (e.g., weak conflict, unclear goal)
- Addresses category-specific improvements (e.g., add sensory details, improve dialogue)
- Preserves scene strengths identified in evaluation
- Maintains author voice and story consistency
- Uses moderate improvement level (balanced refinement without over-rewriting)

### API Usage

For manual scene evaluation:

```bash
# Evaluate a single scene
curl -X POST http://localhost:3000/api/evaluation/scene \
  -H "Content-Type: application/json" \
  -d '{
    "sceneId": "scene_abc123",
    "content": "Scene narrative content...",
    "context": {
      "storyGenre": "mystery",
      "arcPosition": "beginning"
    }
  }'
```

### Documentation

- **API Reference**: `docs/scene-evaluation-api.md`
- **Implementation**: `src/lib/services/scene-evaluation-loop.ts`
- **Evaluation Service**: `src/lib/evaluation/index.ts`

---

## Documentation

**Complete Documentation Index:** See `docs/README.md` for full documentation catalog

### Essential Documentation

**For New Developers:**
- **[docs/README.md](docs/README.md)** - Complete documentation index (start here!)
- **[CLAUDE.md](CLAUDE.md)** - This file - Project overview and guidelines

**Core Feature Specifications:**
- **[docs/story-specification.md](docs/story-specification.md)** - Story structure and HNS methodology
- **[docs/reading-specification.md](docs/reading-specification.md)** - Reading UX, mobile nav, comments, likes
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
- **[docs/story-generator-skill.md](docs/story-generator-skill.md)** - Complete story generation via Claude Code skill
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
- ✅ Updated `docs/reading-specification.md` - Added bottom navigation implementation details

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

**Git and Repository Management:**
- Always check current git repository URL before using GitHub MCP tools
- Follow conventional commit message format
- Use feature branches for development work