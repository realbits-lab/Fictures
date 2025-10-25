# Story Generator Skill

Generate and publish complete AI stories with full structure including parts, chapters, scenes, characters, and settings.

## Purpose

This skill uses the `scripts/generate-complete-story.mjs` script to generate complete stories for the Fictures platform. It automates the entire story creation process using the HNS (Hook, Need, Setup) methodology.

## What This Skill Does

When invoked, this skill will:

1. **Generate Story Structure** - Creates complete story with:
   - Story metadata (title, genre, premise, dramatic question, theme)
   - Parts (story sections following 3-act structure)
   - Chapters (within each part)
   - Scenes (detailed scenes within chapters with full content)
   - Characters (with AI-generated portraits)
   - Settings (with AI-generated environment images)

2. **Publish to Database** - Automatically saves all content to the database

3. **Provide URLs** - Returns direct links to view, edit, and read the story

## Authentication

The skill uses the **writer@fictures.xyz** account from `.auth/user.json`. This account has the following scopes:
- stories:read
- stories:write
- chapters:read
- chapters:write
- analytics:read
- ai:use
- community:read
- community:write
- settings:read

## How to Use This Skill

### Step 1: Ask User for Story Prompt

Always start by asking the user what kind of story they want to generate:

**Example Questions:**
- "What kind of story would you like to generate?"
- "Describe the story you want me to create"
- "What's your story idea?"

### Step 2: Run the Script

Execute the story generation script with the user's prompt:

```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs "USER_STORY_PROMPT"
```

**Important**: Run as a background process with output redirection to monitor progress:

```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs "USER_STORY_PROMPT" > logs/story-generation.log 2>&1 &
```

### Step 3: Monitor Progress

The script provides real-time progress updates:
- 🧠 Generating HNS structure
- 🎨 Generating character images
- 🖼️ Generating setting images
- ✅ Story generation complete

### Step 4: Report Results

After completion, inform the user with:
- Story ID
- Story title and genre
- Structure statistics (parts, chapters, scenes)
- Character count (with/without images)
- Setting count (with/without images)
- Direct links to:
  - View story: `http://localhost:3000/stories/{storyId}`
  - Edit story: `http://localhost:3000/write/{storyId}`
  - Read story: `http://localhost:3000/read/{storyId}`

## Example Usage

### User Request Examples:

1. **Simple prompt:**
   ```
   User: "Generate a science fiction story about space exploration"
   ```

2. **Detailed prompt:**
   ```
   User: "Create a mystery thriller about a detective investigating a series of art thefts in Paris. Include themes of deception and redemption."
   ```

3. **Quick generation:**
   ```
   User: "Write a short fantasy story"
   ```

### Skill Response Pattern:

```
I'll generate a [genre] story for you with the following structure:
- Complete HNS story development
- Parts, chapters, and scenes
- Character profiles with AI-generated images
- Setting descriptions with AI-generated visuals

Running story generation...

[Monitor and report progress]

✅ Story generated successfully!

Story ID: [ID]
Title: [Title]
Genre: [Genre]

Structure:
- 📚 Parts: X
- 📝 Chapters: Y
- 🎬 Scenes: Z
- 👥 Characters: N (M with images)
- 🏞️ Settings: P (Q with images)

Links:
- View: http://localhost:3000/stories/[ID]
- Edit: http://localhost:3000/write/[ID]
- Read: http://localhost:3000/read/[ID]
```

## Expected Generation Time

- **Small stories** (3-5 chapters): 3-5 minutes
- **Medium stories** (5-10 chapters): 5-8 minutes
- **Large stories** (10+ chapters): 8-15 minutes

Generation time includes:
- AI text generation for story structure
- AI image generation for characters and settings
- Database operations

## Error Handling

If generation fails:

1. **Server not running**: Ensure dev server is running on port 3000
   ```bash
   dotenv --file .env.local run pnpm dev
   ```

2. **Authentication error**: Check `.auth/user.json` has valid writer credentials

3. **API key issues**: Verify `AI_GATEWAY_API_KEY` and `OPENAI_API_KEY` in `.env.local`

4. **Timeout**: Large stories may take longer - check logs for progress

## Advanced Options

### Custom Story Prompts

For best results, include in the prompt:
- **Genre**: Science fiction, mystery, fantasy, thriller, etc.
- **Theme**: Core message or moral
- **Setting**: Where the story takes place
- **Characters**: Main character descriptions
- **Conflict**: Central problem or challenge

### Example Advanced Prompt:

```
"Create an epic fantasy story set in a magical academy where students learn to control elemental powers. The main character is a young scholar who discovers a forbidden magic that could save or destroy the world. Include themes of power, responsibility, and friendship. Generate vivid magical settings and diverse characters with unique abilities."
```

## Integration with Other Skills

This skill can be combined with:
- **Publishing skills**: Automatically publish generated stories
- **Testing skills**: Verify story structure and content
- **Analytics skills**: Track story performance

## Technical Details

- **Script**: `scripts/generate-complete-story.mjs`
- **API Endpoint**: `POST /api/stories/generate-hns`
- **Authentication**: Bearer token from `.auth/user.json`
- **Method**: Server-Sent Events (SSE) streaming
- **AI Models**:
  - Text: OpenAI GPT-4o-mini via Vercel AI Gateway
  - Images: Google Gemini 2.5 Flash
- **Image Storage**: Vercel Blob
- **Database**: Neon PostgreSQL via Drizzle ORM

## Output Format

The script outputs:
- Real-time progress updates
- Story structure details
- Character and setting information
- Direct navigation links
- Error messages (if any)

All output is formatted with emoji icons for easy reading.

## Notes

- Stories are created in "writing" status (not published)
- All images are stored in Vercel Blob with public access
- Character and setting images are 16:9 aspect ratio (1792x1024)
- Story data follows HNS methodology for structured storytelling
- Database entries are created incrementally during generation

## Best Practices

1. **Always ask for user's story idea** - Don't assume a default prompt
2. **Run in background** - Use background execution for long-running generations
3. **Monitor progress** - Check output periodically to show user progress
4. **Provide links** - Always share view/edit/read URLs with the user
5. **Handle errors gracefully** - Provide helpful debugging tips if generation fails

## Skill Invocation

This skill should be invoked when the user wants to:
- Generate a new story
- Create story content
- Publish a story with AI
- Generate a complete narrative
- Create fiction content

**Trigger phrases:**
- "Generate a story about..."
- "Create a story..."
- "Write a story about..."
- "Make a story..."
- "Generate fiction..."
