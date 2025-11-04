---
title: Scripts Directory Documentation
---

# Scripts Directory Documentation

Production utility scripts for managing the Fictures platform. Run with: `dotenv --file .env.local run node scripts/<script>.mjs`

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
| `setup-auth-users.mjs` | Create test users | `node scripts/setup-auth-users.mjs` |
| `verify-auth-setup.mjs` | Verify authentication | `node scripts/verify-auth-setup.mjs` |
| `generate-minimal-story.mjs` | Generate minimal novel | `node scripts/generate-minimal-story.mjs` |
| `generate-comic-panels.mjs` | Generate comic panels | `node scripts/generate-comic-panels.mjs SCENE_ID [options]` |

---

## Authentication Setup

### setup-auth-users.mjs

Creates three test users (manager, writer, reader) with email/password authentication.

```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```

**Output**: Populates `.auth/user.json` with credentials and API keys.

### verify-auth-setup.mjs

Validates user accounts and API keys.

```bash
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

---

## Novel Generation

### generate-minimal-story.mjs

**Purpose**: Generate a **minimal-size novel** (fastest generation) using the Adversity-Triumph Engine with API key authentication.

**Quick Start**:
```bash
# Generate minimal story (1 part, 1 chapter, 3 scenes, 2 characters, 2 settings)
dotenv --file .env.local run node scripts/generate-minimal-story.mjs

# Background execution
dotenv --file .env.local run node scripts/generate-minimal-story.mjs > logs/minimal-story.log 2>&1 &
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
- Run `scripts/setup-auth-users.mjs` if key doesn't exist

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
- Environment variables: `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_GATEWAY_API_KEY`, `BLOB_READ_WRITE_TOKEN`

**Troubleshooting**:
- **401 Unauthorized**: Run `scripts/setup-auth-users.mjs` to create API keys
- **Connection refused**: Start dev server with `dotenv --file .env.local run pnpm dev`
- **Generation fails**: Check `logs/dev-server.log` for errors

---

## Comic Panel Generation

### generate-comic-panels.mjs

**Purpose**: Generate 7-12 comic panels for a scene using Toonplay 9-step pipeline with quality evaluation.

**Quick Start**:
```bash
# Preview
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --dry-run

# Generate
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID

# Force regenerate
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --force

# Verbose logging
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --verbose

# Background
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID > logs/comic-panels.log 2>&1 &
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
- `.env.local` with: `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_GATEWAY_API_KEY`, `BLOB_READ_WRITE_TOKEN`

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
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --verbose

# Check API logs
tail -f logs/dev-server.log | grep "generation/toonplay"
```

**Technical Details**:
- **API**: `POST /studio/api/generation/toonplay` (SSE stream)
- **Shot Types**: ESTABLISHING, WIDE, MEDIUM, CLOSE-UP, EXTREME CLOSE-UP, OVER-SHOULDER, POV
- **Image Optimization**: Mobile-first (1x/2x density), AVIF (modern) + JPEG (fallback), 25-30% smaller

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

**Setup**: Run `scripts/setup-auth-users.mjs` to create users and API keys.

### Environment Variables

Required in `.env.local`:
```bash
# Auth
AUTH_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# AI
GOOGLE_GENERATIVE_AI_API_KEY=***  # Gemini 2.5 Flash
AI_GATEWAY_API_KEY=***            # Vercel AI SDK Gateway

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
dotenv --file .env.local run node scripts/<script>.mjs [args]

# Background with logging
dotenv --file .env.local run node scripts/<script>.mjs [args] > logs/<script>.log 2>&1 &

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
4. **Check auth setup**: Run `verify-auth-setup.mjs` if errors
5. **Monitor logs**: Check `logs/` for background processes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| ECONNREFUSED | Ensure dev server running: `dotenv --file .env.local run pnpm dev` |
| Auth errors | Run `scripts/setup-auth-users.mjs` to create test users |
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
