---
name: story-generator
description: Generate complete AI-powered stories with parts, chapters, scenes, characters, and settings. Automatically publishes when user says "create". Use when user asks to generate, create, write, or make a story or fiction.
---

# Story Generator

Generate complete AI-powered stories with full structure (parts, chapters, scenes, characters, settings) and optionally publish them to the community.

## When to Use This Skill

Activate this skill when the user requests:
- "generate a story about..."
- "create a story about..."
- "write a story about..."
- "make a story..."
- Any story/fiction generation request

## Publishing Behavior

**Auto-publish determination:**
- User says **"create"** → Automatically publish to community
- User says **"generate"** or **"write"** → Save as draft only
- User explicitly mentions **"publish"** → Automatically publish

## Story Generation Workflow

### 1. Get Story Prompt

If user hasn't provided a story idea, ask:
```
What kind of story would you like me to create?
```

Encourage specific prompts with:
- **Genre**: mystery, sci-fi, fantasy, thriller, romance
- **Setting**: time period and location
- **Theme**: core message or moral
- **Characters**: protagonist description (optional)
- **Conflict**: central problem

### 2. Run Generation Script

**For draft stories (generate/write):**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs "USER_STORY_PROMPT" > logs/story-generation.log 2>&1 &
```

**For published stories (create):**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "USER_STORY_PROMPT" > logs/story-generation.log 2>&1 &
```

### 3. Monitor Progress

The script provides real-time updates via Server-Sent Events (SSE):
- 🧠 Generating HNS structure
- 🎨 Generating character images
- 🖼️ Generating setting images
- ✅ Story complete
- 📤 Publishing (if applicable)

### 4. Report Results

Extract from output and present:
- Story ID and title
- Genre and status (Draft/Published)
- Structure statistics (parts, chapters, scenes, characters, settings)
- Direct navigation links

## Response Templates

### For Draft Stories (generate/write)

```
I'll generate a [genre] story for you.

Generating complete story structure with:
- Parts, chapters, and scenes
- Character profiles with AI images
- Setting descriptions with AI visuals

[Monitor progress and report key milestones]

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

### For Published Stories (create)

```
I'll create and publish a [genre] story for you.

Generating complete story with:
- Parts, chapters, and scenes
- Character profiles with AI images
- Setting descriptions with AI visuals

[Monitor progress and report key milestones]

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

## Technical Details

**Script:** `scripts/generate-complete-story.mjs`

**APIs:**
- `POST /api/stories/generate-hns` - Story generation (SSE streaming)
- `PUT /api/stories/{id}/visibility` - Publishing

**Authentication:**
- Uses writer@fictures.xyz credentials from `.auth/user.json`
- API key loaded automatically
- Required scopes: stories:write, chapters:write, ai:use

**AI Models:**
- Text: OpenAI GPT-4o-mini (via Vercel AI Gateway)
- Images: Google Gemini 2.5 Flash (16:9, 1792x1024 PNG)

**Storage:**
- Images: Vercel Blob (permanent, public access)
- Data: Neon PostgreSQL with Drizzle ORM

## Generation Time

- **Small stories** (3-5 chapters): 3-5 minutes
- **Medium stories** (5-10 chapters): 5-8 minutes
- **Large stories** (10+ chapters): 8-15 minutes

Most time is spent on AI image generation for characters and settings.

## What Gets Generated

**Complete story structure using HNS (Hook, Need, Setup) methodology:**

1. **Story metadata**: title, genre, premise, dramatic question, theme
2. **Parts**: 3-act structure (Setup, Confrontation, Resolution)
3. **Chapters**: detailed specifications with purpose and hooks
4. **Scenes**: complete content with goal, conflict, outcome
5. **Characters**: profiles with AI-generated portrait images
6. **Settings**: descriptions with AI-generated environment images

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
Please verify the writer profile has a valid API key.
```

### Generation Timeout
```
⏱️ Story generation is taking longer than usual (10+ minutes).

Large or complex stories can take time. The generation is still running.
Check logs/story-generation.log for current progress.
```

## Example Interactions

**Example 1: Simple Generate Request**

User: "Generate a mystery story"

Response: Ask for specific details about the mystery (detective, amateur sleuth, locked-room, historical, etc.), then generate draft.

**Example 2: Create and Publish Request**

User: "Create a sci-fi story about time travel"

Response: Recognize "create" → run with --publish flag → report published story with community link.

**Example 3: Detailed Request**

User: "Write a fantasy adventure about a young wizard discovering forbidden magic"

Response: Use detailed prompt to generate comprehensive fantasy story as draft.

## Best Practices

1. **Clear explanations**: Always explain what you're doing
2. **Progress monitoring**: Report generation milestones
3. **Actionable errors**: Provide solutions, not just error messages
4. **Intent confirmation**: Clarify "create" vs "generate" if ambiguous
5. **Complete links**: Include all relevant navigation links
6. **Concise output**: Summarize results clearly

## Advanced Prompting

Encourage users to provide:
- **Genre specifics**: Subgenres and tone
- **Themes**: Moral lessons or messages
- **Setting details**: Time period, location, atmosphere
- **Character hooks**: Protagonist personality or background
- **Core conflict**: What problem drives the story

**Example advanced prompt:**
```
"Create an epic fantasy story set in a magical academy where students learn
elemental magic. The protagonist is a young scholar who discovers forbidden
necromancy that could save or destroy the kingdom. Include themes of power,
responsibility, and moral ambiguity. Generate vivid magical settings and
diverse characters with unique abilities."
```

## Troubleshooting

**Q: Story generation failed**
A: Check dev server is running, verify credentials in .auth/user.json, review logs/story-generation.log

**Q: Images didn't generate**
A: Image generation can fail but story still completes. Check OPENAI_API_KEY and AI_GATEWAY_API_KEY in .env.local

**Q: Where can I edit the story?**
A: Use the Edit link: http://localhost:3000/writing/{storyId}

**Q: How do I publish a draft later?**
A: Visit /writing/{storyId} and use the publish button, or run script with --publish flag

## Routes Reference

- **All stories**: `/writing`
- **Edit story**: `/writing/{storyId}`
- **Read story**: `/reading/{storyId}`
- **Community**: `/community/story/{storyId}` (published only)

## Notes

- Stories use HNS methodology for structured storytelling
- Generated stories are production-ready with complete content
- All database entries include full relationships (story → parts → chapters → scenes)
- Published stories appear in community and reading pages
- Images are permanently stored in Vercel Blob
- Story status: "writing" (draft) or "published" (public)
