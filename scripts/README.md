# Scripts Directory

This directory contains utility scripts for the Fictures project.

## Story Generation

### `generate-complete-story.mjs`

**Purpose:** Generate complete AI stories with full structure including parts, chapters, scenes, characters, and settings.

**Authentication:** Uses writer@fictures.xyz credentials from `.auth/user.json`

**Usage:**

```bash
# Default story prompt (draft)
dotenv --file .env.local run node scripts/generate-complete-story.mjs

# Custom story prompt (draft)
dotenv --file .env.local run node scripts/generate-complete-story.mjs "A detective story about art theft in Paris"

# Custom story prompt with auto-publish
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "A detective story about art theft in Paris"

# Background execution with logging and publishing
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "Story prompt" > logs/story-generation.log 2>&1 &
```

**What It Generates:**

- Story metadata (title, genre, premise, dramatic question, theme)
- Parts (3-act structure)
- Chapters (detailed specifications)
- Scenes (complete content)
- Characters (with AI-generated portrait images)
- Settings (with AI-generated environment images)

**Generation Time:** 3-15 minutes depending on story complexity

**Output:**

The script provides:
- Real-time progress updates via SSE
- Story structure statistics
- Character and setting information
- Direct links to view/edit/read the generated story

**Example Output:**

```
================================================================================
📚 COMPLETE STORY GENERATION
================================================================================

👤 Writer: writer@fictures.xyz
🔑 API Key: fic_Sh7a4nYARGmJ...
🌐 API URL: http://localhost:3000/api/stories/generate-hns

📝 Story Prompt:
   A detective story about art theft in Paris

================================================================================

🚀 Starting story generation...

✅ Connection established, streaming progress...

🧠 generating_hns: Generating complete story structure using HNS...
🎨 generating_character_images: Generating character images...

✅ HNS STRUCTURE GENERATED SUCCESSFULLY!
   📌 Story ID: ABC123xyz

📊 Story Structure:
   📖 Title: The Parisian Heist
   🎭 Genre: Mystery, Crime, Thriller
   📚 Parts: 3
   📝 Chapters: 7
   🎬 Scenes: 15
   👥 Characters: 6
   🏞️  Settings: 5

🖼️ generating_setting_images: Generating setting images...

🎉 STORY GENERATION COMPLETED!

📤 Publishing story ABC123xyz...
✅ Story published successfully! Status: published

================================================================================
✅ STORY GENERATION SUMMARY
================================================================================

📖 STORY DETAILS:
   ID: ABC123xyz
   Title: The Parisian Heist
   Genre: Mystery, Crime, Thriller
   Status: 📢 Published
   ...

🔗 DIRECT LINKS:
   📝 Edit story: http://localhost:3000/writing/ABC123xyz
   📖 Read story: http://localhost:3000/reading/ABC123xyz
   🌐 Community: http://localhost:3000/community/story/ABC123xyz
   📋 All stories: http://localhost:3000/writing

🎉 Story published and available to the community!
```

## Requirements

- Development server running on port 3000
- Valid writer credentials in `.auth/user.json`
- Environment variables configured in `.env.local`:
  - `AI_GATEWAY_API_KEY` - Vercel AI Gateway for text generation
  - `OPENAI_API_KEY` - OpenAI API for image generation
  - `DATABASE_URL` - Neon PostgreSQL database (pooled connection)
  - `BLOB_READ_WRITE_TOKEN` - Vercel Blob for image storage

## Claude Code Integration

This script is integrated with Claude Code via the `story-generator` skill in `.claude/skills/story-generator.md`.

To use the skill in Claude Code, simply ask:
- "Generate a story about..."
- "Create a story..."
- "Write a story about..."

The skill will handle the complete workflow including prompt gathering, execution, monitoring, and reporting.

## Troubleshooting

**Server not running:**
```bash
dotenv --file .env.local run pnpm dev
```

**Authentication error:**
Check `.auth/user.json` has valid writer profile with API key

**API key issues:**
Verify `AI_GATEWAY_API_KEY` and `OPENAI_API_KEY` in `.env.local`

**Timeout:**
Large stories may take 10-15 minutes - check logs for progress
