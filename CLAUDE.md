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

## Database Management

**IMPORTANT: Uses Neon PostgreSQL Database**
- Database operations use Drizzle ORM - see `src/lib/db/schema.ts`
- Always prefix commands with `dotenv --file .env.local run` for proper database connectivity
- DO NOT use Supabase MCP tools - this project uses Neon PostgreSQL

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

## Novel Generation

**Primary Generation System: Adversity-Triumph Engine**

The platform uses the Adversity-Triumph Engine for novel generation, creating emotionally resonant stories with deep character development and moral frameworks.

**UI Generation:**
- **Location**: `/studio/new` - Novel creation page
- **API Endpoint**: `POST /studio/api/novels/generate` (SSE streaming)
- **Model**: Gemini 2.5 Flash & Flash Lite (via Google AI API)

**Generation Pipeline (9 Phases):**
1. **Story Summary** - Generate story foundation and moral framework
2. **Characters** - Expand character profiles with detailed arcs and internal flaws
3. **Settings** - Create immersive locations with adversity elements
4. **Parts** - Structure three-act framework with macro character arcs
5. **Chapters** - Generate detailed chapter structure with micro-arcs
6. **Scene Summaries** - Break down chapters into scene outlines
7. **Scene Content** - Generate full narrative content for each scene
8. **Scene Evaluation** - Evaluate and improve scene quality automatically
9. **Images** - Generate character portraits and setting visuals (7:4, 1344x768)

**What It Generates:**
- Story metadata (title, genre, summary, moral framework, tone)
- Characters with:
  - Core traits, internal flaws, external goals
  - Detailed personality, backstory, relationships
  - Physical descriptions and voice style
  - AI-generated portrait images (1344×768, 7:4)
- Settings with:
  - Adversity elements (obstacles, scarcity, dangers)
  - Symbolic meaning and cycle amplification
  - Sensory details (sight, sound, smell, touch, taste)
  - AI-generated environment images (1344×768, 7:4)
- Parts (3-act structure with macro character arcs)
- Chapters (with adversity types, virtue tests, narrative seeds)
- Scenes (with cycle phases, emotional beats, full narrative content)
- 4 optimized image variants per image (AVIF, JPEG × mobile 1x/2x)

**User Experience:**
1. Navigate to `/studio/new`
2. Enter story prompt and preferences
3. Click "Generate Story"
4. Watch real-time progress through 9 phases
5. View generated story at `/studio/edit/story/{storyId}`

**Routes:**
- Studio dashboard: `/studio`
- Create story: `/studio/new`
- Edit story: `/studio/edit/story/{storyId}`
- Edit chapter: `/studio/edit/{chapterId}`
- Browse novels: `/novels`
- Read novel: `/novels/{storyId}`
- Browse comics: `/comics`
- Read comic: `/comics/{storyId}`
- Community view: `/community/story/{storyId}` (published stories only)

**Generation Time:** 5-25 minutes depending on story complexity
- Story summary: ~30 seconds
- Characters: ~1-2 minutes
- Settings: ~1-2 minutes
- Parts: ~1-2 minutes
- Chapters: ~2-3 minutes
- Scene summaries: ~1-2 minutes
- Scene content: ~5-10 minutes (varies by scene count)
- Scene evaluation: ~1-2 minutes
- Images: ~2-5 minutes

**Legacy System (Deprecated):**
- The old HNS (Hook-Nurture-Satisfy) system at `/studio/api/stories/generate-hns` is deprecated
- Use the new Novel generation system for all new stories
- Legacy endpoint may be removed in future releases

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

## Novel Generation

**IMPORTANT: Documentation-First Development Process**

The novel generation system uses the Adversity-Triumph Engine methodology with a strict documentation-first approach to ensure synchronization across documentation, implementation, and automation tools.

### Novel Generation Change Protocol

When making ANY changes to the novel generation system, ALWAYS follow this order:

**1. FIRST: Update Documentation** (`docs/novels/`)
- **Primary documentation files:**
  - `novels-specification.md` - Core concepts, data model, theoretical foundation
  - `novels-generation.md` - API architecture, system prompts, implementation specs
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

### Novel Generation System Overview

**Architecture:**
- **Location**: `docs/novels/novels-generation.md` - Complete specification
- **Methodology**: Adversity-Triumph Engine (Korean Gam-dong narrative psychology)
- **API Endpoints**: `/studio/api/generation/*` - Generation APIs for story creation
- **Database**: Novel-specific tables in Neon PostgreSQL (see `drizzle/` migrations)
- **AI Model**: Gemini 2.5 Flash & Flash Lite (via Google AI API)
- **Image Generation**: Gemini 2.5 Flash (1344×768, 7:4 aspect ratio)
- **Image Optimization**: 4 variants per image (AVIF/JPEG × mobile 1x/2x)

**Generation Flow:**
1. Story Summary → 2. Characters → 3. Settings → 4. Parts → 5. Chapters → 6. Scene Summaries → 7. Scene Content → 8. Scene Evaluation → 9. Images

**Documentation Reference:**
- 📖 **Specification**: `docs/novels/novels-specification.md` - Core concepts and data model
- 🔧 **Generation Guide**: `docs/novels/novels-generation.md` - API specs and system prompts
- 🧪 **Testing Guide**: `docs/novels/novels-testing.md` - Validation and quality metrics
- ⚡ **Optimization**: `docs/novels/novels-optimization.md` - Performance and cost tuning
- 🗑️ **Removal**: `docs/novels/novels-removal.md` - Deletion workflows

**Related System:**
- The existing "Story Generation" system (HNS methodology with `/api/stories/generate-hns`) is separate from the Novels system
- Novels use Adversity-Triumph Engine, Stories use HNS (Hook-Nurture-Satisfy)
- Both systems share image generation and optimization infrastructure

## Code Guidelines

**Core Development Practices:**
- **Package Manager**: Use pnpm instead of npm for all operations
- **Environment Variables**: Always prefix commands with `dotenv --file .env.local run`
- **Authentication**: Use NextAuth.js session management throughout
- **Database**: All operations through Drizzle ORM - see `src/lib/db/`
- **AI Integration**:
  - Text Generation: Use Gemini 2.5 Flash & Flash Lite via Google AI API with GOOGLE_GENERATIVE_AI_API_KEY
  - Scene Evaluation: Automated quality assessment (part of Novel generation pipeline)
  - Scene Improvement: Iterative refinement until quality threshold met
  - Image Generation: Use Gemini 2.5 Flash with GOOGLE_GENERATIVE_AI_API_KEY (7:4, 1344x768)
  - Image Optimization: Automatic generation of 4 variants (AVIF, JPEG × mobile 1x/2x)
- **Image Storage**: Generated images stored in Vercel Blob with public access
- **Error Handling**: Implement proper error boundaries and loading states
- **Performance**: Optimize for story writing workflow and database queries

## Image Generation & Optimization

**AI-Powered Story Illustrations with Automatic Optimization:**

### Image Generation
- **Service**: `src/lib/novels/` - Novel generation handles image creation
- **API Endpoint**: POST `/studio/api/generation/images` - Generate story illustrations
- **Model**: Gemini 2.5 Flash via Google AI API
- **Original Format**: 1344x768 pixels (7:4 aspect ratio), PNG
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