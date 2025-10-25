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
- 📝 Generating scene content
- 🔄 Evaluating scene quality (per scene)
- ✨ Improving scenes based on evaluation (if needed)
- 🎨 Generating character images
- 🖼️ Generating setting images
- ✅ Story complete
- 📤 Publishing (if applicable)

### 4. Report Results

Extract from output and present:
- Story ID and title
- Genre and status (Draft/Published)
- Structure statistics (parts, chapters, scenes, characters, settings)

## Response Templates

### For Draft Stories (generate/write)

```
I'll generate a [genre] story for you.

Generating complete story structure with:
- Parts, chapters, and scenes
- Automatic quality evaluation (3.0+/4.0 target per scene)
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
- 🎬 Scenes: Z (avg quality: 3.X/4.0)
- 👥 Characters: N (M with images)
- 🏞️ Settings: P (Q with images)

**Quality Metrics:**
- Scenes passing first evaluation: X%
- Scenes improved: Y scenes
- Average final score: 3.X/4.0

The story is saved as a draft. You can edit it and publish when ready.
```

### For Published Stories (create)

```
I'll create and publish a [genre] story for you.

Generating complete story with:
- Parts, chapters, and scenes
- Automatic quality evaluation (3.0+/4.0 target per scene)
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
- 🎬 Scenes: Z (avg quality: 3.X/4.0)
- 👥 Characters: N (M with images)
- 🏞️ Settings: P (Q with images)

**Quality Metrics:**
- Scenes passing first evaluation: X%
- Scenes improved: Y scenes
- Average final score: 3.X/4.0

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
- Text Generation: OpenAI GPT-4o-mini (via Vercel AI Gateway)
- Scene Evaluation: OpenAI GPT-4o-mini (via Vercel AI Gateway)
- Scene Improvement: OpenAI GPT-4o-mini (via Vercel AI Gateway)
- Images: OpenAI DALL-E 3 (16:9, 1792x1024, 18 optimized variants)

**Storage:**
- Images: Vercel Blob (permanent, public access)
- Data: Neon PostgreSQL with Drizzle ORM

## Generation Time

- **Small stories** (3-5 chapters): 4-7 minutes
- **Medium stories** (5-10 chapters): 7-12 minutes
- **Large stories** (10+ chapters): 12-20 minutes

**Time breakdown:**
- Scene content generation and evaluation: 40-50%
- Character image generation: 25-30%
- Setting image generation: 20-25%
- HNS structure generation: 5-10%

**Note:** Quality evaluation adds 1-3 minutes depending on number of scenes. Each scene is evaluated and may be improved up to 2 times until it reaches quality threshold (3.0/4.0 score).

## Quality Evaluation System

Every scene is automatically evaluated using AI-powered quality assessment based on the **"Architectonics of Engagement"** framework.

**Evaluation Process:**
1. Scene is generated with complete narrative content
2. AI evaluates scene on 5 categories (1-4 scale):
   - **Plot** (3.0+ target): Goal clarity, conflict engagement, stakes progression
   - **Character** (3.0+ target): Voice distinctiveness, motivation clarity, emotional authenticity
   - **Pacing** (3.0+ target): Tension modulation, scene rhythm, narrative momentum
   - **Prose** (3.0+ target): Sentence variety, word choice precision, sensory engagement
   - **World-Building** (3.0+ target): Setting integration, detail balance, immersion
3. If overall score < 3.0 (Effective level), scene is improved based on feedback
4. Re-evaluation occurs (max 2 iterations total)
5. Scene is accepted when it passes 3.0 threshold or max iterations reached

**Quality Scoring Scale:**
- **1.0 - Nascent**: Foundational elements present but underdeveloped
- **2.0 - Developing**: Core elements functional but needing refinement
- **3.0 - Effective**: Professionally crafted, engaging, meets quality standards ✅
- **4.0 - Exemplary**: Exceptional craft, deeply immersive, publishable excellence

**What Gets Evaluated:**
- Scene structure (goal, conflict, outcome)
- Character voice and motivation
- Dialogue naturalness
- Sensory details and showing vs. telling
- Emotional authenticity
- Pacing and tension
- Prose quality and variety

**Improvement Actions:**
When a scene scores below 3.0, the AI:
- Reviews high-priority feedback (e.g., weak conflict, unclear goal)
- Addresses category-specific improvements (e.g., add sensory details, improve dialogue)
- Preserves scene strengths identified in evaluation
- Maintains author voice and story consistency
- Uses moderate improvement level (balanced refinement without over-rewriting)

**Expected Results:**
- 70-80% of scenes pass on first evaluation
- 15-20% require one improvement iteration
- 5-10% reach max iterations (2) without passing
- Average final score: 3.2-3.5/4.0 across all scenes

## What Gets Generated

**Complete story structure using HNS (Hook, Need, Setup) methodology:**

1. **Story metadata**: title, genre, premise, dramatic question, theme
2. **Parts**: 3-act structure (Setup, Confrontation, Resolution)
3. **Chapters**: detailed specifications with purpose and hooks
4. **Scenes**: complete content with goal, conflict, outcome
   - **Quality assured**: Each scene automatically evaluated and improved to 3.0+/4.0 standard
   - **Evaluation metrics**: Plot, character, pacing, prose, world-building
   - **Iterative improvement**: Up to 2 improvement cycles per scene
5. **Characters**: profiles with AI-generated portrait images (16:9, 1792x1024)
6. **Settings**: descriptions with AI-generated environment images (16:9, 1792x1024)

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
5. **Concise output**: Summarize results clearly

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

**Q: How do I publish a draft later?**
A: Run script with --publish flag or use the publish button in the web interface

**Q: Why is scene generation taking longer?**
A: Each scene now includes automatic quality evaluation and improvement (up to 2 iterations). This ensures higher quality but adds 1-3 minutes to generation time.

**Q: Can I disable evaluation?**
A: Evaluation is integrated into the generation process for quality assurance. Scenes that don't pass evaluation on first try are automatically improved.

**Q: What if a scene doesn't reach 3.0 score?**
A: After 2 improvement iterations, the scene is accepted even if it hasn't reached the 3.0 threshold. Manual editing can further improve it.

## Notes

- Stories use HNS methodology for structured storytelling
- Generated stories are production-ready with complete content
- All database entries include full relationships (story → parts → chapters → scenes)
- Published stories appear in community and reading pages
- Images are permanently stored in Vercel Blob
- Story status: "writing" (draft) or "published" (public)
