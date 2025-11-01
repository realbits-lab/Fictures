# Scripts Directory Documentation

This directory contains utility scripts for managing stories, testing features, and maintaining the Fictures platform. All scripts should be run with environment variables loaded from `.env.local`.

## General Usage Pattern

```bash
# Standard execution pattern
dotenv --file .env.local run node scripts/<script-name>.mjs [arguments]

# Background execution with logging
dotenv --file .env.local run node scripts/<script-name>.mjs [arguments] > logs/<script-name>.log 2>&1 &
```

## Authentication

Most scripts use authentication from `.auth/user.json` which contains:
- **manager** profile: For admin operations (manager@fictures.xyz)
- **writer** profile: For story generation and management operations (writer@fictures.xyz)

The authentication file structure:
```json
{
  "defaultProfile": "manager",
  "profiles": {
    "manager": {
      "email": "manager@fictures.xyz",
      "userId": "...",
      "apiKey": "...",
      "cookies": [...]
    },
    "writer": {
      "email": "writer@fictures.xyz",
      "userId": "...",
      "apiKey": "...",
      "cookies": [...]
    }
  }
}
```

---

## Story Generation Scripts

### generate-complete-story.mjs

**Purpose**: Generate a complete story using HNS (Hook-Nurture-Satisfy) methodology.

**Authentication**: Uses `writer@fictures.xyz` from `.auth/user.json`

**Input**:
- `[story-prompt]` - Optional story description (uses default if omitted)
- `--publish` - Optional flag to auto-publish after generation

**Output**:
- Story ID
- Complete story structure in database
- AI-generated images (characters, settings, scenes)
- 18 optimized image variants per image
- Progress logs during generation

**Usage**:
```bash
# Generate with default prompt
dotenv --file .env.local run node scripts/generate-complete-story.mjs

# Generate with custom prompt
dotenv --file .env.local run node scripts/generate-complete-story.mjs "Your story idea"

# Generate and auto-publish
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "Story prompt"
```

**Generation Time**: 4-20 minutes depending on complexity

### test-novel-generation.mjs

**Purpose**: Test novel generation using Adversity-Triumph Engine.

**Usage**: Testing the novel generation pipeline

### test-novel-generation-comprehensive.mjs

**Purpose**: Comprehensive test of novel generation system.

**Usage**: Full end-to-end novel generation testing

### test-novels-generation-phase-2-1.mjs

**Purpose**: Test novel generation phase 2, part 1.

**Usage**: Phase-specific novel generation testing

### test-novels-generation-phase-2-2.mjs

**Purpose**: Test novel generation phase 2, part 2.

**Usage**: Phase-specific novel generation testing

### test-novels-generation-phase-2-3.mjs

**Purpose**: Test novel generation phase 2, part 3.

**Usage**: Phase-specific novel generation testing

---

## Story Management Scripts

### list-stories.mjs

**Purpose**: List all stories with metadata and optional search filtering.

**Authentication**: Uses session from `.auth/user.json`

**Input**:
- `[search-term]` - Optional search term to filter by title

**Output**: List of stories with title, ID, genre, status, visibility, creation date

**Usage**:
```bash
# List all stories
dotenv --file .env.local run node scripts/list-stories.mjs

# Search by title
dotenv --file .env.local run node scripts/list-stories.mjs "detective"
```

### publish-story.mjs

**Purpose**: Change story status from 'writing' to 'published'.

**Authentication**: Uses session from `.auth/user.json`

**Input**: `STORY_ID` - Required story ID to publish

**Output**: Success confirmation, story metadata, community view URL

**Usage**:
```bash
dotenv --file .env.local run node scripts/publish-story.mjs STORY_ID
```

### publish-story-db.mjs

**Purpose**: Publish story directly in database.

**Usage**: Direct database publishing

### publish-all-content.mjs

**Purpose**: Publish all content (stories, chapters, scenes).

**Usage**: Bulk publishing operations

### publish-chapter-and-community.mjs

**Purpose**: Publish chapter and create community post.

**Usage**: Chapter publishing with community integration

### get-story-details.mjs

**Purpose**: Fetch and display detailed story information.

**Authentication**: Uses session from `.auth/user.json`

**Input**: `STORY_ID` - Required story ID

**Output**: Full story metadata, part/chapter/scene counts, character and setting information

**Usage**:
```bash
dotenv --file .env.local run node scripts/get-story-details.mjs STORY_ID
```

### find-story-by-title.mjs

**Purpose**: Find story by title search.

**Usage**: Title-based story lookup

### check-story.mjs

**Purpose**: Check story data integrity.

**Usage**: Story validation

---

## Story Removal Scripts

### remove-story.mjs

**Purpose**: Remove a single story with complete cleanup of database records and Vercel Blob images.

**Authentication**: Uses session from `.auth/user.json`

**Input**:
- `STORY_ID` - Required story ID to remove
- `--dry-run` - Optional flag to preview deletion without actual removal

**What Gets Removed**:
- Database records (story, parts, chapters, scenes, characters, settings)
- Vercel Blob images (ALL images found using list API with prefix `stories/{storyId}/`)
- Community data (posts, likes, replies, bookmarks)
- Analytics data (reading sessions, insights, events)

**Performance**: Uses batch deletion for 10-25x faster blob cleanup

**Usage**:
```bash
# Dry run (preview only)
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run

# Actual removal
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID

# Background execution
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID > logs/story-removal.log 2>&1 &
```

**Safety Features**: 3-second confirmation delay, dry-run mode, transaction-based operations, owner verification

### remove-all-stories.mjs

**Purpose**: Remove all stories for a user with complete cleanup.

**Authentication**: Uses session from `.auth/user.json`

**Input**:
- `--confirm` - Required flag to proceed with deletion
- `--dry-run` - Optional flag to preview without deletion

**Usage**:
```bash
# Dry run (preview only)
dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run

# Actual removal
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm
```

### remove-all-stories-manager.mjs

**Purpose**: Remove all stories using manager account.

**Usage**: Manager-level story deletion

### remove-all-stories-api-key.mjs

**Purpose**: Remove all stories using API key authentication.

**Usage**: API key-based deletion

### delete-all-stories-api.mjs

**Purpose**: Delete all stories via API.

**Usage**: API-based story deletion

---

## Comic Generation Scripts

### generate-comic-panels-api.mjs

**Purpose**: Generate comic panels for a specific scene using the comic generation API.

**Authentication**: Uses `writer@fictures.xyz` API key from `.auth/user.json`

**Input**:
- `<scene-id>` - Required scene ID
- `--panels <n>` - Optional target panel count (1-3, default: auto)
- `--no-regen` - Optional flag to skip regeneration if panels exist
- `--port <n>` - Optional API port (default: 3000)

**Output**: Scene information, screenplay text, panel details with dialogue and SFX

**Usage**:
```bash
# Generate panels (auto panel count)
dotenv --file .env.local run node scripts/generate-comic-panels-api.mjs SCENE_ID

# Generate with specific panel count
dotenv --file .env.local run node scripts/generate-comic-panels-api.mjs SCENE_ID --panels 3

# Don't regenerate if panels exist
dotenv --file .env.local run node scripts/generate-comic-panels-api.mjs SCENE_ID --no-regen
```

### generate-comics-direct.mjs

**Purpose**: Direct comic generation using internal services (bypassing API).

**Usage**: Testing comic generation logic directly

### generate-comics-glitch-scene.mjs

**Purpose**: Generate comics for a specific "glitch" scene for testing.

**Usage**: Testing specific scene comic generation

### test-comic-generation.mjs

**Purpose**: Test comic generation functionality.

**Usage**: Comic generation testing

### regenerate-comic-panels.mjs

**Purpose**: Regenerate comic panels for existing scenes.

**Usage**: Panel regeneration

### regenerate-glitch-panels.mjs

**Purpose**: Regenerate panels for glitch scenes.

**Usage**: Panel regeneration for specific scenes

### regenerate-panels-via-api.mjs

**Purpose**: Regenerate panels using API.

**Usage**: API-based panel regeneration

### remove-all-comic-panels.mjs

**Purpose**: Remove all comic panels from database.

**Usage**: Comic panel cleanup

### list-comic-scenes.mjs

**Purpose**: List all scenes with comic panels.

**Usage**: Comic scene inventory

### list-comic-image-urls.mjs

**Purpose**: List all comic image URLs.

**Usage**: Comic image inventory

### check-comic-panels.mjs

**Purpose**: Check comic panel data.

**Usage**: Comic panel verification

### check-panel-text.mjs

**Purpose**: Check panel text content.

**Usage**: Panel text validation

---

## Image Generation & Testing Scripts

### test-gemini-generation-simple.mjs

**Purpose**: Test Gemini 2.5 Flash image generation with 7:4 aspect ratio.

**Authentication**: Uses `GOOGLE_GENERATIVE_AI_API_KEY` from environment

**Output**:
- Image saved to `logs/test-images/gemini-simple-{timestamp}.png`
- File size and dimension verification (expected: 1344×768)

**Expected Dimensions**: 1344×768 (7:4 aspect ratio)

**Usage**:
```bash
dotenv --file .env.local run node scripts/test-gemini-generation-simple.mjs
```

### test-gemini-image-16-9.mjs

**Purpose**: Test Gemini image generation with 16:9 aspect ratio.

**Usage**: Aspect ratio testing

### test-gemini-native-16-9.mjs

**Purpose**: Test Gemini native 16:9 support.

**Usage**: Native aspect ratio testing

### test-gemini-optimization-pipeline.mjs

**Purpose**: End-to-end test of Gemini image generation + optimization pipeline.

**Authentication**: Uses `GOOGLE_GENERATIVE_AI_API_KEY` and `BLOB_READ_WRITE_TOKEN`

**Output**:
- Original image (1344×768)
- 4 optimized variants (AVIF/JPEG × mobile 1x/2x)
- Dimension verification for each variant
- File size comparison and performance metrics

**Usage**:
```bash
dotenv --file .env.local run node scripts/test-gemini-optimization-pipeline.mjs
```

### test-story-image-generation.mjs

**Purpose**: Test story image generation service.

**Usage**: Testing image generation for stories, scenes, characters, and settings

### create-placeholder-images.mjs

**Purpose**: Create placeholder images for missing content.

**Usage**: Generate placeholder images

### create-remaining-placeholders.mjs

**Purpose**: Create remaining placeholder images.

**Usage**: Complete placeholder generation

---

## Database & Cache Scripts

### clear-redis-cache.mjs

**Purpose**: Clear Redis cache for specific chapter and story.

**Authentication**: Uses `REDIS_URL` from environment

**Input**: Hardcoded chapter ID and story ID in script (edit script to change)

**Cache Keys Cleared**:
- `chapter:{chapterId}:scenes:public`
- `chapter:{chapterId}:public`
- `story:{storyId}:public`
- `story:{storyId}:chapters:public`

**Usage**:
```bash
# Edit script to set chapter/story IDs, then run:
dotenv --file .env.local run node scripts/clear-redis-cache.mjs
```

### invalidate-cache.mjs

**Purpose**: Invalidate specific caches.

**Usage**: Targeted cache invalidation

### check-database-stories.mjs

**Purpose**: Verify story data in database.

**Usage**: Database verification and debugging

### check-database-via-api.mjs

**Purpose**: Check database through API endpoints.

**Usage**: API-based database verification

### check-and-clean-db.ts

**Purpose**: Database cleanup and verification (TypeScript).

**Usage**: Comprehensive database maintenance

### query-stories-db.mjs

**Purpose**: Query stories directly from database.

**Usage**: Direct database queries for debugging

### check-column-naming.mjs

**Purpose**: Check database column naming conventions.

**Usage**: Schema validation

### check-scenes-fields.mjs

**Purpose**: Check scenes table field definitions.

**Usage**: Scenes table schema verification

### deep-cleanup-database.mjs

**Purpose**: Deep database cleanup.

**Usage**: Thorough database maintenance

### cleanup-all-stories.ts

**Purpose**: Clean up all stories (TypeScript).

**Usage**: Comprehensive story cleanup

### cleanup-all-story-data.mjs

**Purpose**: Clean up all story-related data.

**Usage**: Complete data cleanup

### cleanup-test-stories.mjs

**Purpose**: Clean up test stories.

**Usage**: Test data cleanup

### complete-reset.mjs

**Purpose**: Complete system reset.

**Usage**: Full database reset

### reset-all-data.mjs

**Purpose**: Reset all data to initial state.

**Usage**: Data reset

---

## Blob Storage Scripts

### cleanup-vercel-blob.mjs

**Purpose**: Clean up all Vercel Blob files under `stories/` prefix.

**Authentication**: Uses `BLOB_READ_WRITE_TOKEN` from environment

**Input**: `--confirm` - Required flag to proceed with deletion

**Output**: Total file count, batch deletion progress, final summary

**Usage**:
```bash
# Preview (no deletion)
dotenv --file .env.local run node scripts/cleanup-vercel-blob.mjs

# Actual deletion
dotenv --file .env.local run node scripts/cleanup-vercel-blob.mjs --confirm
```

**Safety Features**: Requires `--confirm` flag, preview mode, batch processing (100 files at a time)

### cleanup-story-blobs.mjs

**Purpose**: Clean up blobs for specific story.

**Usage**: Targeted blob cleanup

### list-blob-storage.mjs

**Purpose**: List all blob storage files.

**Usage**: Blob storage inspection

### verify-blob-cleanup.mjs

**Purpose**: Verify blob cleanup was successful.

**Usage**: Post-cleanup verification

### verify-blob-paths.mjs

**Purpose**: Verify blob path structure.

**Usage**: Path structure validation

---

## Scene Testing & Formatting Scripts

### test-scene-formatter.mjs

**Purpose**: Test scene formatting rules.

**Usage**: Unit testing for scene formatting logic

### reformat-scenes.mjs

**Purpose**: Reformat existing scene content.

**Usage**: Batch scene content reformatting

### reformat-scenes-sql.mjs

**Purpose**: SQL-based scene reformatting.

**Usage**: Direct database scene reformatting

### reformat-with-verify.mjs

**Purpose**: Reformat scenes with verification.

**Usage**: Safe scene reformatting with checks

### check-scene-content.mjs

**Purpose**: Check scene content for issues.

**Usage**: Scene content validation

### find-story-scene.mjs

**Purpose**: Find specific scene in story.

**Usage**: Scene lookup and debugging

### find-detective-scene.mjs

**Purpose**: Find detective story scenes.

**Usage**: Testing specific story type

### find-glitch-scene.mjs

**Purpose**: Find glitch-related scenes.

**Usage**: Bug reproduction and testing

### advanced-reformat.mjs

**Purpose**: Advanced text reformatting.

**Usage**: Complex formatting operations

### enhanced-reformat.mjs

**Purpose**: Enhanced reformatting with additional features.

**Usage**: Extended formatting capabilities

### proper-dialogue-split.mjs

**Purpose**: Split dialogue properly.

**Usage**: Dialogue formatting

### split-description-dialogue.mjs

**Purpose**: Separate description from dialogue.

**Usage**: Content parsing and formatting

### fix-multi-dialogue.mjs

**Purpose**: Fix multiple dialogue issues.

**Usage**: Dialogue correction

### repair-broken-quotes.mjs

**Purpose**: Fix broken quote marks.

**Usage**: Quote mark correction

### debug-formatter.mjs

**Purpose**: Debug formatting issues.

**Usage**: Formatter debugging

### test-formatter-logic.mjs

**Purpose**: Test formatter logic.

**Usage**: Formatter unit testing

### test-formatter-output.mjs

**Purpose**: Test formatter output.

**Usage**: Formatter integration testing

### test-dialogue-regex.mjs

**Purpose**: Test dialogue regex patterns.

**Usage**: Regex pattern testing

### test-curly-quote.mjs

**Purpose**: Test curly quote handling.

**Usage**: Quote character testing

---

## Migration Scripts

### apply-comic-migration.mjs

**Purpose**: Apply comic-related database migrations.

**Usage**: Database schema updates for comics

### create-comic-panels-table.mjs

**Purpose**: Create comic panels table.

**Usage**: Initial comic panels schema

### migrate-comics-to-new-path.mjs

**Purpose**: Migrate comic image paths.

**Usage**: Path structure migration

### migrate-system-directory.mjs

**Purpose**: Migrate system directory structure.

**Usage**: Directory reorganization

---

## Authentication Scripts

### capture-manager-auth.mjs

**Purpose**: Capture authentication for manager account.

**Usage**: Manager authentication setup

### capture-writer-auth.mjs

**Purpose**: Capture authentication for writer account.

**Usage**: Writer authentication setup

### create-playwright-auth.mjs

**Purpose**: Create Playwright authentication files.

**Usage**: Playwright test authentication setup

### check-session.mjs

**Purpose**: Check current session validity.

**Usage**: Session verification

### check-api-keys.mjs

**Purpose**: Verify API key configuration.

**Usage**: API key validation

---

## User Management Scripts

### create-user.mjs

**Purpose**: Create new user account.

**Usage**: User account creation

### create-manager-user.mjs

**Purpose**: Create manager user account.

**Usage**: Manager account setup

### reset-manager-password.mjs

**Purpose**: Reset manager account password.

**Usage**: Password reset

---

## Testing & Debugging Scripts

### test-community-story-performance.mjs

**Purpose**: Test community story performance.

**Usage**: Performance benchmarking

### test-metric-full-click.mjs

**Purpose**: Test full metric click tracking.

**Usage**: Analytics testing

### test-metric-help-icons.mjs

**Purpose**: Test help icon metrics.

**Usage**: UI metrics testing

### test-metric-help-simple.mjs

**Purpose**: Simple metric help testing.

**Usage**: Basic metrics testing

### monitor-story-generation.mjs

**Purpose**: Monitor story generation progress.

**Usage**: Real-time generation monitoring

### debug-community-story.mjs

**Purpose**: Debug community story issues.

**Usage**: Community feature debugging

### debug-update.mjs

**Purpose**: Debug update operations.

**Usage**: Update operation debugging

---

## Verification Scripts

### verify-cleanup.mjs

**Purpose**: Verify cleanup operations.

**Usage**: Post-cleanup verification

### verify-complete-cleanup.mjs

**Purpose**: Verify complete cleanup.

**Usage**: Comprehensive cleanup verification

### verify-reading-history-fix.mjs

**Purpose**: Verify reading history fixes.

**Usage**: Reading history validation

### verify-update.mjs

**Purpose**: Verify update operations.

**Usage**: Update verification

### verify-hns-removal.mjs

**Purpose**: Verify HNS system removal.

**Usage**: HNS cleanup verification

---

## Shell Scripts

### capture-api-error.sh

**Purpose**: Capture API error responses.

**Usage**: Error logging and debugging (shell script)

### add-frontmatter.sh

**Purpose**: Add frontmatter to markdown files.

**Usage**: Markdown file processing (shell script)

### add-frontmatter.mjs

**Purpose**: Add frontmatter to markdown files (Node.js version).

**Usage**: Markdown file processing

---

## SQL Scripts

### drop-all-tables.sql

**Purpose**: Drop all database tables.

**Usage**: Database reset (SQL script)

### reset-story-tables.sql

**Purpose**: Reset story-related tables.

**Usage**: Story table reset (SQL script)

---

## Documentation Files

### CLAUDE.md

**Purpose**: This file - Scripts directory overview and usage guide.

### README.md

**Purpose**: Scripts directory README.

### gemini-16-9-findings.md

**Purpose**: Documentation of Gemini 16:9 aspect ratio findings.

**Usage**: Reference for Gemini image generation implementation

### README-gemini-test.md

**Purpose**: Gemini testing documentation.

**Usage**: Testing guide for Gemini features

---

## Common Patterns

### Error Handling

All scripts include:
- Environment variable validation
- API response error checking
- Try-catch blocks for async operations
- Meaningful error messages
- Exit codes (0 for success, 1 for errors)

### Authentication

Scripts use one of these patterns:
1. **Session cookie** from `.auth/user.json`
2. **API key** from `.auth/user.json` writer profile
3. **Environment variables** (for external services)

### Logging

Most scripts support:
- Console output with emojis for readability
- Background execution with log file redirection
- Progress indicators for long operations
- Summary reports at completion

### Safety Features

Deletion scripts include:
- Dry-run mode for preview
- Confirmation delays before execution
- Explicit confirmation flags required
- Batch processing for efficiency
- Comprehensive reporting

---

## Best Practices

1. **Always use environment variables**: `dotenv --file .env.local run`
2. **Background long operations**: Redirect to logs directory
3. **Test with dry-run first**: Preview changes before executing
4. **Check authentication**: Ensure `.auth/user.json` is up to date
5. **Monitor logs**: Check log files for background processes
6. **Kill port 3000 processes**: Before running dev server
7. **Use correct profile**: Manager for admin, writer for generation

## Troubleshooting

### Common Issues

**ECONNREFUSED errors**:
- Ensure dev server is running: `dotenv --file .env.local run pnpm dev`

**Authentication errors**:
- Check `.auth/user.json` has valid session cookies
- Re-run authentication capture if expired

**API key errors**:
- Verify API key in `.auth/user.json` writer profile
- Check API key scopes include required permissions

**Blob storage errors**:
- Verify `BLOB_READ_WRITE_TOKEN` in `.env.local`
- Check Vercel Blob quota limits

**Redis errors**:
- Verify `REDIS_URL` in `.env.local`
- Check Redis connection status

---

## Script Dependencies

Most scripts depend on:
- **Node.js**: Runtime environment
- **pnpm**: Package manager
- **dotenv**: Environment variable loading
- **@vercel/blob**: Blob storage operations
- **redis**: Cache operations
- **Next.js app**: Must be running for API scripts
- **.auth/user.json**: Authentication credentials
- **.env.local**: Environment configuration

## Development Workflow

1. **Start dev server**: `dotenv --file .env.local run pnpm dev`
2. **List stories**: `node scripts/list-stories.mjs`
3. **Generate story**: `node scripts/generate-complete-story.mjs "prompt"`
4. **Test comics**: `node scripts/generate-comic-panels-api.mjs SCENE_ID`
5. **Clean up**: `node scripts/remove-story.mjs STORY_ID`
6. **Cache refresh**: Edit and run `node scripts/clear-redis-cache.mjs`
