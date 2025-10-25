# Story Generator

Generate complete AI-powered stories with full structure (parts, chapters, scenes, characters, settings) and optionally publish them to the community.

## When to Use This Skill

Use this skill when the user asks to:
- **Generate** a story ("generate a story about...", "generate fiction...")
- **Create** a story ("create a story about...", "create a new story...")
- **Write** a story ("write a story about...", "write fiction...")
- **Make** a story ("make a story about...", "make fiction...")

**Important:** If the user says "create" or requests publishing, automatically publish the story after generation.

## What This Skill Does

1. **Asks for story prompt** if not provided
2. **Generates complete story** using HNS (Hook, Need, Setup) methodology:
   - Story metadata (title, genre, premise, dramatic question, theme)
   - Parts (3-act structure)
   - Chapters (detailed specifications)
   - Scenes (complete content)
   - Characters (with AI-generated portrait images)
   - Settings (with AI-generated environment images)
3. **Saves to database** automatically
4. **Publishes story** (if requested with "create" or "--publish" flag)
5. **Reports results** with direct links

## Usage Instructions

### Step 1: Determine If Publishing Is Needed

Check the user's request:
- Contains "create"? → Auto-publish
- Contains "generate" or "write" without "create"? → Generate only (draft)
- User explicitly mentions "publish"? → Auto-publish

### Step 2: Get Story Prompt

If the user hasn't provided a story idea, ask:
```
What kind of story would you like me to create?
```

Be specific about what makes a good prompt:
- Genre (mystery, sci-fi, fantasy, etc.)
- Setting (where the story takes place)
- Main conflict or theme
- Characters (optional but helpful)

### Step 3: Run Generation Script

**For draft (generate/write):**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs "USER_STORY_PROMPT" > logs/story-generation.log 2>&1 &
```

**For published (create):**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "USER_STORY_PROMPT" > logs/story-generation.log 2>&1 &
```

### Step 4: Monitor Progress

The script provides real-time updates. Monitor the log file and report key milestones:
- 🧠 Generating story structure
- 🎨 Generating character images
- 🖼️ Generating setting images
- ✅ Story complete
- 📤 Publishing (if requested)

### Step 5: Report Final Results

Extract from the output:
- Story ID
- Title and genre
- Structure stats (parts, chapters, scenes, characters, settings)
- Publication status
- Direct links

## Response Template

### For "Generate" Requests (Draft)

```
I'll generate a [genre] story for you.

Generating complete story structure with:
- Parts, chapters, and scenes
- Character profiles with AI images
- Setting descriptions with AI visuals

[Monitor progress...]

✅ Story generated successfully!

**Story Details:**
- Title: [Title]
- Genre: [Genre]
- Status: ✏️ Draft (not published)

**Structure:**
- 📚 Parts: X
- 📝 Chapters: Y
- 🎬 Scenes: Z
- 👥 Characters: N (M with images)
- 🏞️ Settings: P (Q with images)

**Direct Links:**
- 📝 Edit: http://localhost:3000/writing/[ID]
- 📖 Read: http://localhost:3000/reading/[ID]
- 📋 All stories: http://localhost:3000/writing

The story is saved as a draft. You can edit it and publish when ready.
```

### For "Create" Requests (Published)

```
I'll create and publish a [genre] story for you.

Generating complete story structure with:
- Parts, chapters, and scenes
- Character profiles with AI images
- Setting descriptions with AI visuals

[Monitor progress...]

✅ Story generated successfully!
📤 Publishing to community...
✅ Story published!

**Story Details:**
- Title: [Title]
- Genre: [Genre]
- Status: 📢 Published

**Structure:**
- 📚 Parts: X
- 📝 Chapters: Y
- 🎬 Scenes: Z
- 👥 Characters: N (M with images)
- 🏞️ Settings: P (Q with images)

**Direct Links:**
- 📝 Edit: http://localhost:3000/writing/[ID]
- 📖 Read: http://localhost:3000/reading/[ID]
- 🌐 Community: http://localhost:3000/community/story/[ID]
- 📋 All stories: http://localhost:3000/writing

The story is now live and visible to the community!
```

## Authentication

- Uses **writer@fictures.xyz** credentials from `.auth/user.json`
- API key loaded automatically by the script
- Required scopes: stories:write, chapters:write, ai:use

## Expected Generation Time

- **Small stories** (3-5 chapters): 3-5 minutes
- **Medium stories** (5-10 chapters): 5-8 minutes
- **Large stories** (10+ chapters): 8-15 minutes

Most time is spent on AI image generation for characters and settings.

## Example Interactions

### Example 1: Simple Generate

**User:** "Generate a mystery story"

**Assistant:**
```
I'll generate a mystery story for you.

What kind of mystery would you like? For example:
- A detective investigating a crime
- An amateur sleuth solving a puzzle
- A locked-room mystery
- A historical mystery

Or describe your own mystery story idea.
```

**User:** "A detective story set in 1920s New York"

**Assistant:** [Runs script without --publish, monitors, reports draft]

### Example 2: Create and Publish

**User:** "Create a sci-fi story about time travel"

**Assistant:**
```
I'll create and publish a science fiction story about time travel.

Generating complete story with:
- Time travel plot and paradoxes
- Futuristic settings
- Complex characters
- AI-generated visuals

[Monitors progress and reports published story with community link]
```

### Example 3: Detailed Request

**User:** "Write a fantasy adventure about a young wizard discovering forbidden magic"

**Assistant:**
```
I'll generate a fantasy adventure story for you.

Creating story with:
- Young wizard protagonist
- Forbidden magic discovery
- Magical academy setting
- Epic conflict themes

[Monitors progress and reports draft story]
```

## Error Handling

### Server Not Running

```
❌ The development server isn't running.

Please start it with:
dotenv --file .env.local run pnpm dev

Then I'll try generating the story again.
```

### Authentication Error

```
❌ Authentication failed.

The writer credentials in .auth/user.json may be invalid.
Please check the file and ensure writer profile has a valid API key.
```

### Generation Timeout

```
⏱️ Story generation is taking longer than usual (10+ minutes).

This can happen with complex stories. The generation is still running.
Check logs/story-generation.log for current progress.
```

## Advanced Features

### Custom Story Prompts

Encourage users to include:
- **Genre:** Mystery, sci-fi, fantasy, thriller, romance
- **Theme:** Core message or moral
- **Setting:** Time period and location
- **Characters:** Protagonist description
- **Conflict:** Central problem

### Example Advanced Prompt

```
"Create an epic fantasy story set in a magical academy where students learn elemental magic. The protagonist is a young scholar who discovers forbidden necromancy that could save or destroy the kingdom. Include themes of power, responsibility, and moral ambiguity. Generate vivid magical settings and diverse characters with unique abilities."
```

## Best Practices (Following Claude Code Standards)

1. **Clear Descriptions:** Always explain what you're doing
2. **Progress Updates:** Monitor and report generation progress
3. **Error Handling:** Provide actionable error messages
4. **User Confirmation:** Clarify "create" vs "generate" intent if ambiguous
5. **Links:** Always include direct navigation links
6. **Concise Output:** Summarize results, don't dump raw output

## Technical Details

- **Script:** `scripts/generate-complete-story.mjs`
- **API:** POST `/api/stories/generate-hns` (SSE streaming)
- **Publishing:** PUT `/api/stories/{id}/visibility` with `{isPublic: true}`
- **AI Models:**
  - Text: OpenAI GPT-4o-mini (via Vercel AI Gateway)
  - Images: Google Gemini 2.5 Flash
- **Storage:** Vercel Blob (images), Neon PostgreSQL (data)
- **Format:** Images are 16:9 (1792x1024) PNG

## Troubleshooting

**Q: Story generation failed**
A: Check dev server is running, verify credentials, review logs

**Q: Images didn't generate**
A: Image generation can fail but story still completes. Check API keys.

**Q: Where can I edit the story?**
A: Use the "Edit" link: `/writing/{storyId}`

**Q: How do I publish a draft later?**
A: Go to `/writing/{storyId}` and use the publish button, or run the script again with `--publish`

## Notes

- Stories use HNS (Hook, Need, Setup) methodology for structured storytelling
- Generated stories are production-ready with complete content
- All images are stored permanently in Vercel Blob
- Database entries include full relationships (story → parts → chapters → scenes)
- Published stories appear in `/community` and `/reading` pages
