---
title: Scripts Directory Documentation
---

# Scripts Directory Documentation

This directory contains **permanent utility scripts** for production use in managing the Fictures platform. All scripts should be run with environment variables loaded from `.env.local`.

> **Note**: For temporary testing and debugging scripts, see `test-scripts/` directory.

## General Usage Pattern

```bash
# Standard execution pattern
dotenv --file .env.local run node scripts/<script-name>.mjs [arguments]

# Background execution with logging
dotenv --file .env.local run node scripts/<script-name>.mjs [arguments] > logs/<script-name>.log 2>&1 &
```

## Available Scripts

### Authentication Setup

#### setup-auth-users.mjs

**Purpose**: Create authentication users for testing (manager, writer, reader).

**Usage**:
```bash
dotenv --file .env.local run node scripts/setup-auth-users.mjs
```

**Output**:
- Creates three test users with email/password authentication
- Populates `.auth/user.json` with credentials and API keys
- Users: manager@fictures.xyz, writer@fictures.xyz, reader@fictures.xyz

#### verify-auth-setup.mjs

**Purpose**: Verify authentication setup is correct.

**Usage**:
```bash
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

**Output**:
- Validates user accounts exist
- Checks API keys are valid
- Confirms authentication data in `.auth/user.json`

---

### Comic Panel Generation

#### generate-comic-panels.mjs

**Purpose**: Generate comic panels for a specific scene using the Toonplay 9-step pipeline.

**Authentication**: Uses `writer@fictures.xyz` API key from `.auth/user.json`

**Input**:
- `<scene-id>` - Required scene ID to generate panels for
- `--dry-run` - Optional flag to preview generation without creating panels
- `--force` - Optional flag to regenerate panels even if they already exist
- `--verbose` - Optional flag to show detailed generation logs

**Output**:
- Progress updates for each generation step
- Panel-by-panel creation logs with shot types and content
- Quality evaluation scores (out of 5.0)
- Improvement cycle notifications if score < 3.0
- Final summary with panel count and quality score
- Comic viewing URL

**Features**:
- Validates scene existence before generation
- Checks for existing panels (warns unless --force used)
- Uses Toonplay 9-step generation pipeline
- Generates 7-12 panels per scene with optimized images
- Automatic quality evaluation using 5-category rubric
- Iterative improvement (up to 2 cycles) until quality threshold met
- Creates 4 optimized image variants per panel (AVIF + JPEG × 2 sizes)
- Server-Sent Events (SSE) for real-time progress updates

**Quality Evaluation**:
- **Rubric**: 5 categories (Pacing, Visual Grammar, Character Consistency, Narrative Clarity, Webtoon Adaptation)
- **Passing Score**: 3.0/5.0 ("Effective" level)
- **Max Iterations**: 2 improvement cycles

**Usage**:
```bash
# Preview generation (dry run)
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --dry-run

# Generate panels
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID

# Regenerate existing panels
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --force

# Generate with verbose logging
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --verbose

# Background execution with logging
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID > logs/comic-panels.log 2>&1 &
```

**Generation Time**: 5-15 minutes depending on scene complexity and improvement iterations

**Example Output**:
```
🎬 Comic Panel Generation Script
================================

Scene ID: scene_abc123
Mode: EXECUTE

🔍 Fetching scene data for: scene_abc123
✅ Scene data retrieved:
   Title: The Discovery
   Chapter: chapter_xyz789
   Content: Elena gasped as she uncovered...
   Image: Yes
   Comic Status: none

🎨 Generating comic panels for scene: The Discovery
   Using Toonplay 9-step pipeline with quality evaluation

   [1/9] Analyzing scene structure...
   [2/9] Generating panel summaries...
   [3/9] Creating panel content...
   ✓ Panel 1: WIDE SHOT - Elena stands at the edge of the ancient ruins...
   ✓ Panel 2: CLOSE-UP - Her fingers trace mysterious symbols...
   ...
   [4/9] Generating panel images...
   [5/9] Optimizing images...
   [6/9] Evaluating quality...
   📊 Quality Score: 3.2/5.0
   [7/9] Storing panels...
   [8/9] Updating scene status...

✅ Generation complete!
   Total panels: 8
   Final quality score: 3.2/5.0
   Improvement iterations: 0

⏱️  Generation time: 8.3s

📊 Generation Summary:
   Scene: The Discovery
   Panels created: 8
   Quality score: 3.2/5.0
   Improvement iterations: 0

✨ Comic panels generated successfully!

View comic at: http://localhost:3000/comics/story_123?scene=scene_abc123
```

**Complete Documentation**: See [README-generate-comic-panels.md](./README-generate-comic-panels.md)

---

## Script Organization

### scripts/ vs test-scripts/

**`scripts/` directory (this directory)**:
- ✅ Permanent utility scripts for production use
- ✅ Well-tested and documented
- ✅ Part of the standard workflow
- ✅ Referenced in main CLAUDE.md documentation

**`test-scripts/` directory**:
- 🧪 Temporary scripts for testing and debugging
- 🧪 One-time exploration and experimentation
- 🧪 May be incomplete or experimental
- 🧪 Can be deleted after testing complete

## Authentication

Scripts use authentication from `.auth/user.json`:

```json
{
  "profiles": {
    "manager": {
      "email": "manager@fictures.xyz",
      "password": "...",
      "apiKey": "fic_..."
    },
    "writer": {
      "email": "writer@fictures.xyz",
      "password": "...",
      "apiKey": "fic_..."
    },
    "reader": {
      "email": "reader@fictures.xyz",
      "password": "...",
      "apiKey": "fic_..."
    }
  }
}
```

**Setting up authentication**:
```bash
# Create test users
dotenv --file .env.local run node scripts/setup-auth-users.mjs

# Verify setup
dotenv --file .env.local run node scripts/verify-auth-setup.mjs
```

## Environment Variables

All scripts require `.env.local` with:

```bash
# Authentication
AUTH_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# AI Integration
GOOGLE_GENERATIVE_AI_API_KEY=***   # Gemini 2.5 Flash
AI_GATEWAY_API_KEY=***             # Vercel AI SDK Gateway

# Database & Storage
DATABASE_URL=***                   # Neon PostgreSQL (pooled)
DATABASE_URL_UNPOOLED=***          # Neon PostgreSQL (direct)
BLOB_READ_WRITE_TOKEN=***          # Vercel Blob storage
REDIS_URL=***                      # Session storage

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Patterns

### Error Handling

All scripts include:
- Environment variable validation
- API response error checking
- Try-catch blocks for async operations
- Meaningful error messages
- Exit codes (0 for success, 1 for errors)

### Logging

Scripts support:
- Console output with emojis for readability
- Background execution with log file redirection
- Progress indicators for long operations
- Summary reports at completion

### Safety Features

Scripts include:
- Dry-run mode for preview
- Confirmation prompts before destructive operations
- Explicit confirmation flags required
- Comprehensive reporting

## Best Practices

1. **Always use environment variables**: `dotenv --file .env.local run`
2. **Background long operations**: Redirect to logs directory
3. **Test with dry-run first**: Preview changes before executing
4. **Check authentication**: Ensure `.auth/user.json` is up to date
5. **Monitor logs**: Check log files for background processes

## Troubleshooting

### Common Issues

**ECONNREFUSED errors**:
- Ensure dev server is running: `dotenv --file .env.local run pnpm dev`

**Authentication errors**:
- Run `node scripts/setup-auth-users.mjs` to create test users
- Verify `.auth/user.json` has valid API keys

**API key errors**:
- Check API key in `.auth/user.json` writer profile
- Verify API key scopes include required permissions

**Environment variable errors**:
- Ensure `.env.local` exists and is properly configured
- Check all required variables are set

## Adding New Scripts

When adding new production scripts to this directory:

1. **Create the script** in `scripts/` directory
2. **Add documentation** to this CLAUDE.md file
3. **Create README** if script is complex (like `README-generate-comic-panels.md`)
4. **Test thoroughly** before committing
5. **Update main CLAUDE.md** if script is part of core workflow

## Related Documentation

- **Main Project Guide**: [../CLAUDE.md](../CLAUDE.md)
- **Test Scripts**: [../test-scripts/CLAUDE.md](../test-scripts/CLAUDE.md)
- **Comics Documentation**: [../docs/comics/](../docs/comics/)
- **API Documentation**: [../docs/](../docs/)
