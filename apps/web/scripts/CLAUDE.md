---
title: Scripts Directory Documentation
---

# Scripts Directory Documentation

Production utility scripts for managing the Fictures platform. Run with: `dotenv --file .env.local run pnpm exec tsx scripts/<script>.ts`

> **Note**: For temporary/testing scripts, see `test-scripts/` directory.

## Documentation Principle

**CRITICAL: This documentation MUST stay synchronized with the scripts directory.**

When making ANY changes to scripts in this directory:
1. **Create new script** → Add documentation section below
2. **Update script** → Update corresponding documentation
3. **Delete script** → Remove documentation section
4. **Rename script** → Update all references

**Why**: This file serves as the single source of truth for production scripts. Outdated documentation leads to confusion and errors.

## Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-auth-users.ts` | Create test users | `pnpm exec tsx scripts/setup-auth-users.ts` |
| `verify-auth-setup.ts` | Verify authentication | `pnpm exec tsx scripts/verify-auth-setup.ts` |
| `generate-minimal-story.ts` | Generate minimal novel | `pnpm exec tsx scripts/generate-minimal-story.ts` |
| `generate-comic-panels.ts` | Generate comic panels | `pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID [options]` |
| `remove-story.ts` | ⚠️ Remove single story | `pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm` |
| `reset-all-stories.ts` | ⚠️ Reset all story data | `pnpm exec tsx scripts/reset-all-stories.ts --confirm` |

---

## Authentication Setup

### setup-auth-users.ts

Creates three test users (manager, writer, reader) with email/password authentication.

```bash
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

**Output**: Populates `.auth/user.json` with credentials and API keys.

### verify-auth-setup.ts

Validates user accounts and API keys.

```bash
dotenv --file .env.local run pnpm exec tsx scripts/verify-auth-setup.ts
```

---

## Novel Generation

### generate-minimal-story.ts

**Purpose**: Generate a **minimal-size novel** (fastest generation) using the Adversity-Triumph Engine with API key authentication.

**Quick Start**:
```bash
# Generate minimal story (1 part, 1 chapter, 3 scenes, 2 characters, 2 settings)
dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts

# Background execution
dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts > logs/minimal-story.log 2>&1 &
```

**Features**:
- ✅ **Minimal configuration** - Smallest possible complete story
- ✅ **Fastest generation** - 5-10 minutes total
- ✅ Direct API authentication (no browser/Playwright needed)
- ✅ Real-time progress via Server-Sent Events (SSE)
- ✅ Automatic image generation with 4 optimized variants
- ✅ Quality evaluation for all scenes
- ✅ Complete Adversity-Triumph narrative cycle

**Default Configuration**:
- **Parts**: 1 (shortest story structure)
- **Chapters**: 1 per part
- **Scenes**: 3 per chapter (minimum for adversity-triumph cycle)
- **Characters**: 2 (minimum for story dynamics)
- **Settings**: 2 (minimum for location variety)
- **Language**: English
- **Genre**: Contemporary
- **Tone**: Hopeful

**Pipeline** (9 phases):
1. Story Summary → Moral framework
2. Characters → Profiles with internal flaws
3. Settings → Immersive environments
4. Parts → Story structure
5. Chapters → Chapter summaries
6. Scene Summaries → Scene breakdown
7. Scene Content → Full narrative
8. Scene Evaluation → Quality assessment
9. Images → Story cover + character portraits + scene images

**Authentication**:
- Uses writer API key from `.auth/user.json`
- Requires `stories:write` scope
- Run `scripts/setup-auth-users.ts` if key doesn't exist

**Generation Time**: 5-10 minutes for minimal story (1 part, 1 chapter, 3 scenes)

**Output**:
- Complete story in database with all metadata
- AI-generated images (1344×768, 7:4 aspect ratio)
- 4 optimized variants per image (AVIF + JPEG × mobile 1x/2x)
- Story details saved to `logs/api-story-generation.json`

**View Story**:
- Novel format: `http://localhost:3000/novels/{storyId}`
- Comic format: `http://localhost:3000/comics/{storyId}`
- Edit: `http://localhost:3000/studio/edit/story/{storyId}`

**Customization**:
Edit the script to modify `userPrompt`, genre, tone, or counts.

**Prerequisites**:
- Dev server running: `dotenv --file .env.local run pnpm dev`
- Valid writer API key in `.auth/user.json`
- Environment variables: `GOOGLE_GENERATIVE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`

**Troubleshooting**:
- **401 Unauthorized**: Run `scripts/setup-auth-users.ts` to create API keys
- **Connection refused**: Start dev server with `dotenv --file .env.local run pnpm dev`
- **Generation fails**: Check `logs/dev-server.log` for errors

---

## Comic Panel Generation

### generate-comic-panels.ts

**Purpose**: Generate 7-12 comic panels for a scene using Toonplay 9-step pipeline with quality evaluation.

**Quick Start**:
```bash
# Preview
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID --dry-run

# Generate
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID

# Force regenerate
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID --force

# Verbose logging
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID --verbose

# Background
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID > logs/comic-panels.log 2>&1 &
```

**Options**:
- `<scene-id>` - **Required** scene ID
- `--dry-run` - Preview without generating
- `--force` - Regenerate existing panels
- `--verbose` - Show detailed logs

**Pipeline** (9 steps):
1. Analyze scene structure
2. Generate panel summaries (7-12 panels)
3. Create panel content (dialogue, SFX, narrative)
4. Generate images (Gemini 2.5 Flash, 1344×768px)
5. Optimize images (4 variants: AVIF + JPEG × mobile 1x/2x)
6. Evaluate quality (5-category rubric)
7. Improve if needed (up to 2 cycles if score < 3.0/5.0)
8. Store panels in database
9. Update scene comic status to "draft"

**Quality Evaluation**:
- **Categories**: Pacing, Visual Grammar, Character Consistency, Narrative Clarity, Webtoon Adaptation
- **Scoring**: 1-5 scale (1=Weak, 3=Effective, 5=Exceptional)
- **Passing**: 3.0/5.0 average
- **Success**: 70-80% pass first time, 95%+ after 1 improvement cycle

**Performance**:
- **Time**: 5-15 minutes per scene
- **Output**: 7-12 panels with 4 optimized image variants each
- **Format**: Toonplay (70% dialogue, 30% visual action, <5% narration)

**Output**:
- **Database**: Comic panels in `comic_panels` table with full metadata
- **Images**: Original PNG (1344×768) + 4 optimized variants per panel
- **Scene**: `comic_status` → "draft", `comic_toonplay` JSON populated

**Prerequisites**:
- Dev server running: `dotenv --file .env.local run pnpm dev`
- Valid scene ID from database
- `.auth/user.json` with writer API key
- `.env.local` with: `GOOGLE_GENERATIVE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`

**Troubleshooting**:
- **"Scene not found"**: Verify scene ID exists in database
- **"Panels exist"**: Use `--force` to regenerate
- **Auth errors**: Check `.auth/user.json` has valid writer API key
- **Image errors**: Verify `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
- **Blob errors**: Check `BLOB_READ_WRITE_TOKEN` and quota
- **Quality fails**: Ensure scene has sufficient content detail

**Debug**:
```bash
# Verbose mode
dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts SCENE_ID --verbose

# Check API logs
tail -f logs/dev-server.log | grep "generation/toonplay"
```

**Technical Details**:
- **API**: `POST /studio/api/novels/toonplay` (SSE stream)
- **Shot Types**: ESTABLISHING, WIDE, MEDIUM, CLOSE-UP, EXTREME CLOSE-UP, OVER-SHOULDER, POV
- **Image Optimization**: Mobile-first (1x/2x density), AVIF (modern) + JPEG (fallback), 25-30% smaller

---

## Story Data Management

### remove-story.ts

**⚠️ DESTRUCTIVE OPERATION - Use with caution!**

**Purpose**: Permanently delete a single story and all related data from database and Vercel Blob storage.

**Quick Start**:
```bash
# Preview mode (shows what will be deleted WITHOUT deleting)
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID

# Execute destructive removal (requires --confirm flag)
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm

# Background execution with logging
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm > logs/remove-story.log 2>&1 &
```

**Options**:
- `<STORY_ID>` - **Required** story ID to remove
- `--confirm` - **Required** to execute actual deletion (safety flag)

**What Gets Deleted**:

**Database Records**:
- **story**: Story record and metadata
- **parts**: All story parts
- **chapters**: All chapter summaries and metadata
- **scenes**: All scene content and metadata
- **characters**: All character profiles and relationships
- **settings**: All setting descriptions

**Vercel Blob Files**:
- **Prefix**: `stories/{storyId}/` (all files under this prefix)
- **Includes**:
  - Story cover image (1344×768, 7:4)
  - Scene images (1344×768, 7:4)
  - Character portraits (1024×1024)
  - Setting visuals (1344×768, 7:4)
  - All optimized variants (AVIF + JPEG × mobile 1x/2x)
- **Deletion Method**: Batch deletion with pagination (100 files per batch)

**Safety Features**:
- ✅ **Preview Mode**: Default behavior shows what will be deleted without deleting
- ✅ **Confirmation Flag**: Requires explicit `--confirm` to proceed
- ✅ **5-Second Delay**: Countdown before execution starts (press Ctrl+C to cancel)
- ✅ **Writer Access**: Requires `stories:write` or `admin:all` scope
- ✅ **Detailed Report**: Shows exact deletion counts for transparency
- ✅ **Audit Log**: Saves deletion report to `logs/remove-story-{storyId}-{timestamp}.json`

**Performance**:
- **Database Deletion**: ~1-2 seconds (cascading deletes)
- **Blob Deletion**: Varies by file count (100 files per batch)
- **Total Time**: Typically 5-15 seconds depending on story size
- **Max Duration**: 60 seconds (API timeout)

**Output Example**:
```
✅ REMOVAL COMPLETE

============================================================

📊 Deletion Report:

Story Information:
  • ID:              story_abc123
  • Title:           My Amazing Story

Database Records Deleted:
  • Parts:           3
  • Chapters:        8
  • Scenes:          24
  • Characters:      5
  • Settings:        4

Blob Files Deleted:
  • Total Files:     96
  • Batches:         1

Timestamp: 2025-11-08T10:30:45.123Z

============================================================

📄 Report saved to: logs/remove-story-story_abc123-2025-11-08T10-30-45.json
```

**Prerequisites**:
- Dev server running: `dotenv --file .env.local run pnpm dev`
- Writer or Manager account API key in `.auth/user.json`
- `.env.local` with: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN`

**Troubleshooting**:
- **No story ID provided**: Must provide story ID as first argument
- **401 Unauthorized**: API key missing or invalid in `.auth/user.json`
  - Solution: Run `scripts/setup-auth-users.ts` to create accounts
- **403 Forbidden**: Account lacks `stories:write` or `admin:all` scope
  - Solution: Use writer or manager account (not reader)
- **404 Not Found**: Story ID does not exist in database
  - Solution: Verify story ID is correct
- **ECONNREFUSED**: Dev server not running
  - Solution: Start server with `dotenv --file .env.local run pnpm dev`

**Debug**:
```bash
# Preview without deleting
dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts story_abc123

# Check writer API key
cat .auth/user.json | jq '.profiles.writer.apiKey'

# Monitor API logs
tail -f logs/dev-server.log | grep "remove-story"
```

**Technical Details**:
- **API**: `POST /studio/api/remove-story` (writer/admin endpoint)
- **Authentication**: Writer or Manager API key from `.auth/user.json` profiles
- **Database**: Cascading deletes in proper order to respect foreign key constraints
- **Blob Deletion**: Pagination with cursor-based iteration (100 files per batch)
- **Max Duration**: 60 seconds (defined in API route)

**Use Cases**:
- **Development Testing**: Remove specific test stories
- **Content Cleanup**: Delete unwanted or test stories
- **User Request**: Remove stories upon user request
- **Quality Control**: Remove low-quality or problematic content

**⚠️ WARNING**: This operation is **IRREVERSIBLE**. All deleted data cannot be recovered. Always use preview mode first to verify what will be deleted.

---

### reset-all-stories.ts

**⚠️ DESTRUCTIVE OPERATION - Use with extreme caution!**

**Purpose**: Permanently delete ALL story data from database and Vercel Blob storage. This is a complete reset that removes everything related to stories.

**Quick Start**:
```bash
# Preview mode (shows what will be deleted WITHOUT deleting)
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts

# Execute destructive reset (requires --confirm flag)
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm

# Background execution with logging
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm > logs/reset-all.log 2>&1 &
```

**Options**:
- `--confirm` - **Required** to execute actual deletion (safety flag)

**What Gets Deleted**:

**Database Records** (6 tables):
- **stories**: All story metadata and summaries
- **parts**: All story parts
- **chapters**: All chapter summaries and metadata
- **scenes**: All scene content and metadata
- **characters**: All character profiles and relationships
- **settings**: All setting descriptions
- **aiInteractions**: All AI generation history

**Vercel Blob Files**:
- **Prefix**: `stories/` (all files under this prefix)
- **Includes**:
  - Story cover images (1344×768, 7:4)
  - Scene images (1344×768, 7:4)
  - Character portraits (1024×1024)
  - Setting visuals (1344×768, 7:4)
  - All optimized variants (AVIF + JPEG × mobile 1x/2x)
- **Deletion Method**: Batch deletion with pagination (100 files per batch)

**Safety Features**:
- ✅ **Preview Mode**: Default behavior shows what will be deleted without deleting
- ✅ **Confirmation Flag**: Requires explicit `--confirm` to proceed
- ✅ **5-Second Delay**: Countdown before execution starts (press Ctrl+C to cancel)
- ✅ **Admin-Only**: Requires `admin:all` scope (manager account only)
- ✅ **Detailed Report**: Shows exact deletion counts for transparency
- ✅ **Audit Log**: Saves deletion report to `logs/reset-all-{timestamp}.json`

**Performance**:
- **Database Deletion**: ~2-5 seconds (cascading deletes)
- **Blob Deletion**: Varies by file count (100 files per batch)
- **Total Time**: Typically 10-30 seconds depending on blob file count
- **Max Duration**: 60 seconds (API timeout)

**Output Example**:
```
✅ RESET COMPLETE

============================================================

📊 Deletion Report:

Database Records Deleted:
  • Stories:         15
  • Parts:           22
  • Chapters:        45
  • Scenes:          135
  • Characters:      30
  • Settings:        25
  • AI Interactions: 428

Blob Files Deleted:
  • Total Files:     540
  • Batches:         6

Timestamp: 2025-11-04T10:30:45.123Z

============================================================

📄 Report saved to: logs/reset-all-2025-11-04T10-30-45.json
```

**Prerequisites**:
- Dev server running: `dotenv --file .env.local run pnpm dev`
- Manager account API key in `.auth/user.json`
- `.env.local` with: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN`

**Troubleshooting**:
- **401 Unauthorized**: Manager API key missing or invalid in `.auth/user.json`
  - Solution: Run `scripts/setup-auth-users.ts` to create manager account
- **403 Forbidden**: Account lacks `admin:all` scope
  - Solution: Only manager accounts have this scope (not writer or reader)
- **ECONNREFUSED**: Dev server not running
  - Solution: Start server with `dotenv --file .env.local run pnpm dev`
- **Timeout**: Too many blob files to delete within 60 seconds
  - Solution: Script will still complete, check logs for actual deletion count

**Debug**:
```bash
# Preview without deleting
dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts

# Check manager API key
cat .auth/user.json | jq '.profiles.manager.apiKey'

# Monitor API logs
tail -f logs/dev-server.log | grep "RESET ALL"
```

**Technical Details**:
- **API**: `POST /studio/api/reset-all` (admin-only endpoint)
- **Authentication**: Manager API key from `.auth/user.json` profiles
- **Database**: Cascading deletes in proper order to respect foreign key constraints
- **Blob Deletion**: Pagination with cursor-based iteration (100 files per batch)
- **Max Duration**: 60 seconds (defined in API route)

**Use Cases**:
- **Development Testing**: Clear all test data between development cycles
- **Quality Assurance**: Reset to clean state for QA testing
- **Database Cleanup**: Remove accumulated test stories during development
- **Fresh Start**: Complete reset before production deployment

**⚠️ WARNING**: This operation is **IRREVERSIBLE**. All deleted data cannot be recovered. Always use preview mode first to verify what will be deleted.

---

## General Patterns

### Authentication

Scripts use `.auth/user.json`:
```json
{
  "profiles": {
    "manager": { "email": "manager@fictures.xyz", "password": "...", "apiKey": "fic_..." },
    "writer": { "email": "writer@fictures.xyz", "password": "...", "apiKey": "fic_..." },
    "reader": { "email": "reader@fictures.xyz", "password": "...", "apiKey": "fic_..." }
  }
}
```

**Setup**: Run `scripts/setup-auth-users.ts` to create users and API keys.

### Environment Variables

Required in `.env.local`:
```bash
# Auth
AUTH_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# AI
GOOGLE_GENERATIVE_AI_API_KEY=***  # Gemini 2.5 Flash

# Database & Storage
DATABASE_URL=***                  # Neon PostgreSQL (pooled)
DATABASE_URL_UNPOOLED=***         # Neon PostgreSQL (direct)
BLOB_READ_WRITE_TOKEN=***         # Vercel Blob
REDIS_URL=***                     # Session storage

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Execution Patterns

```bash
# Standard
dotenv --file .env.local run pnpm exec tsx scripts/<script>.ts [args]

# Background with logging
dotenv --file .env.local run pnpm exec tsx scripts/<script>.ts [args] > logs/<script>.log 2>&1 &

# Monitor background process
tail -f logs/<script>.log
```

### Script Features

All scripts include:
- ✅ Environment variable validation
- ✅ Error handling with meaningful messages
- ✅ Progress indicators for long operations
- ✅ Exit codes (0=success, 1=error)
- ✅ Dry-run modes where applicable
- ✅ Summary reports on completion

---

## Best Practices

1. **Always prefix with dotenv**: `dotenv --file .env.local run`
2. **Background long operations**: Redirect to `logs/` directory
3. **Test with dry-run first**: Preview before executing
4. **Check auth setup**: Run `verify-auth-setup.ts` if errors
5. **Monitor logs**: Check `logs/` for background processes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| ECONNREFUSED | Ensure dev server running: `dotenv --file .env.local run pnpm dev` |
| Auth errors | Run `scripts/setup-auth-users.ts` to create test users |
| API key errors | Check `.auth/user.json` has valid API keys |
| Env var errors | Verify `.env.local` exists with all required variables |

---

## Managing Scripts

**IMPORTANT: Always update this CLAUDE.md file when modifying scripts.**

### Adding New Scripts

1. **Create script** in `scripts/` directory
2. **Add documentation** to this file immediately:
   - Add entry to Quick Reference table
   - Add detailed section under appropriate category
   - Include: Purpose, Usage, Options, Prerequisites, Troubleshooting
3. **Test thoroughly** before committing
4. **Update main CLAUDE.md** if part of core workflow
5. **Commit both** script and documentation together

### Updating Existing Scripts

1. **Modify script** as needed
2. **Update documentation** in this file:
   - Update usage examples if commands changed
   - Update options if flags added/removed
   - Update prerequisites if requirements changed
3. **Test changes** thoroughly
4. **Commit both** script and documentation together

### Deleting Scripts

1. **Remove script** from `scripts/` directory
2. **Remove documentation** from this file:
   - Remove from Quick Reference table
   - Remove detailed section
   - Update any references in other sections
3. **Update main CLAUDE.md** if script was referenced there
4. **Commit all changes** together

**scripts/** (this directory):
- ✅ Permanent production utilities
- ✅ Well-tested and documented
- ✅ Part of standard workflow

**test-scripts/**:
- 🧪 Temporary testing/debugging
- 🧪 One-time exploration
- 🧪 Can be deleted after use

---

## Related Documentation

- [../CLAUDE.md](../CLAUDE.md) - Main project guide
- [../test-scripts/CLAUDE.md](../test-scripts/CLAUDE.md) - Test scripts
- [../docs/comics/](../docs/comics/) - Comics documentation
- [../docs/](../docs/) - API documentation
