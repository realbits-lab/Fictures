---
title: Studio Agent Specification
---

# Studio Agent Specification

## Executive Summary

The Studio Agent is an AI-powered assistant that guides writers through the complete story generation workflow using the Adversity-Triumph Engine methodology. Unlike traditional chat interfaces, the Studio Agent combines transparent multi-step reasoning, progressive content generation, and intelligent advisory to help writers create emotionally resonant stories.

**Core Innovation**: The agent guides writers through a structured 9-phase generation process, providing context-aware advice at each step, while maintaining full transparency of AI reasoning and tool execution.

**Status**: 📋 Specification Ready for Implementation

**Related Documents:**
- 📖 **Novel Specification** (`docs/novels/novels-specification.md`): Adversity-Triumph Engine methodology
- 🔧 **Novel Development** (`docs/novels/novels-development.md`): Generation APIs and system prompts
- 💬 **Agent Chat Reference** (`docs/studio/studio-agent-chat.md`): Base chat system architecture
- 🛠️ **Development Guide** (`docs/studio/studio-agent-development.md`): Implementation specifications

---

## Part I: Philosophy & Vision

### 1.1 Design Philosophy

**Guided, Not Automated**
- Writers maintain creative control at every step
- Agent provides expert guidance based on narrative psychology
- Transparent reasoning makes AI decisions explainable
- Progressive generation allows review and iteration

**Progressive, Not Linear**
- Each phase builds on previous completed work
- Writers can pause, review, and adjust before continuing
- Earlier decisions inform later generation
- No "black box" full story generation

**Intelligent, Not Mechanical**
- Agent understands Adversity-Triumph Engine principles
- Context-aware advice based on current progress
- Detects incomplete prerequisites and guides users
- Learns from story context to provide relevant suggestions

**Transparent, Not Opaque**
- All tool executions visible to user
- Chain of thought reasoning displayed
- Database operations shown and confirmed
- Generated content immediately reviewable

### 1.2 Core Capabilities

**1. Progressive Story Generation**
- Guides through 9-phase Adversity-Triumph Engine workflow
- Ensures proper sequencing (Story → Characters → Settings → Parts → Chapters → Scenes)
- Validates prerequisites before allowing next phase
- Maintains story coherence across all phases

**2. Intelligent Advisory System**
- Provides methodology-specific guidance at each phase
- Suggests improvements based on Adversity-Triumph principles
- Warns about potential issues (missing characters, weak moral framework)
- Offers examples and best practices from novels-specification.md

**3. Database-Integrated CRUD Operations**
- Creates, reads, updates, deletes story-related entities
- Validates data integrity before database operations
- Shows database changes to user for confirmation
- Maintains relational consistency (cascading, foreign keys)

**4. API Key Management**
- Retrieves user's AI Gateway API key from database
- Validates key before generation operations
- Secures API calls with user-specific authentication
- Provides fallback guidance if key missing

---

## Part II: User Journey & Workflow

### 2.1 Entry Point: Create New Story

**User Action**: Clicks "Create New Story" button on `/studio` page

**System Response**:
1. Redirect to Studio Agent Chat:
   ```
   /studio/agent/new
   ```

2. Initialize agent with context:
   ```typescript
   {
     currentPhase: 'story-summary',
     completedPhases: [],
     mode: 'generation'
   }
   ```

3. Agent will create story record when generation begins

**Agent's First Message**:
```
✨ Welcome to Story Creation!

I'll guide you through creating an emotionally resonant story using the Adversity-Triumph Engine methodology.

We'll work through 9 phases:
1. Story Summary (15-30 min) - Define moral framework and characters
2. Character Generation (20-40 min) - Develop detailed character profiles
3. Settings Generation (15-30 min) - Create emotional environments
4. Part Summaries (30-60 min) - Structure 3-act macro arcs
5. Chapter Summaries (60-120 min) - Break down micro-cycles
6. Scene Summaries (30-60 min) - Plan scene specifications
7. Scene Content (120-180 min) - Generate full prose
8. Scene Evaluation (30-60 min) - Quality assessment & improvement
9. Image Generation (30-90 min) - Visual assets for all content

Let's start with Phase 1: Story Summary.

Tell me about your story idea - what world, what moral question, what characters are you imagining?
```

### 2.2 Phase 1: Story Summary Generation

**Prerequisites**: None (first phase)

**User Input Example**:
> "A refugee woman starts a garden in a destroyed city, and a former enemy soldier helps her secretly"

**Agent's Advisory Process**:

**Step 1: Understanding Intent**
```
Let me analyze your story idea using the Adversity-Triumph framework...

I see:
- Setting: Post-war destroyed city (scarcity, moral complexity)
- Potential moral question: Can healing replace revenge?
- Character archetypes:
  * Refugee woman (survivor, nurturer)
  * Former enemy soldier (guilt, seeking redemption)

This has excellent potential for Gam-dong (profound emotional resonance).
```

**Step 2: Advisory Guidance**
```
Based on the Adversity-Triumph Engine, I'll help you define the story foundation:

1. Define a MORAL FRAMEWORK
   - What virtues matter in this destroyed world?
   - What makes virtue difficult here? (Scarcity? Trauma?)
   - How will the story affirm moral order?

2. Identify CHARACTER ARCHETYPES
   - Who will embody and test these virtues?
   - What roles (protagonist, antagonist, allies)?
   - Brief concept only - we'll develop full characters in Phase 2

3. Establish TONE & GENRE
   - Emotional atmosphere you want to create
   - Genre blend (literary fiction, post-war drama?)

Should I generate the story summary now? This will create:
- Thematic premise
- Moral framework definition
- Character archetype concepts (for Phase 2 development)
- Genre and tone
```

**Step 3: Tool Execution (After User Confirmation)**

Agent uses: `generateStorySummary` tool
```typescript
{
  userPrompt: "A refugee woman starts a garden...",
  userId: session.user.id,
  storyId: storyId
}
```

**Step 4: Database Update (Transparent)**

Agent uses: `updateStory` tool
```typescript
{
  storyId: storyId,
  data: {
    summary: "In a war-torn city where scarcity has destroyed trust...",
    genre: "Literary Fiction, Post-War Drama",
    tone: "Bittersweet, Hopeful, Contemplative",
    moralFramework: "In this world, compassion and courage...",
    characterArchetypes: "Refugee woman (survivor, nurturer), Former enemy soldier (guilt-driven, seeking redemption)"
  }
}
```

**Note**: Only the `stories` table is updated. No character records created yet - those will be generated in Phase 2.

**Step 5: Confirmation & Next Phase**
```
✅ Story Summary Complete!

**Summary**: In a war-torn city where scarcity has destroyed trust between former enemies, the power of creation and compassion is tested when two broken souls find healing through tending life together

**Moral Framework**: Compassion and courage to rebuild matter because they break cycles of revenge. Virtue is difficult because survival feels zero-sum and war wounds are fresh.

**Genre**: Literary Fiction, Post-War Drama

**Tone**: Bittersweet, Hopeful, Contemplative

**Character Archetypes Identified** (to be developed in Phase 2):
- Refugee woman (survivor, nurturer)
- Former enemy soldier (guilt-driven, seeking redemption)

This foundation is saved to your story. ✅ Saved to database (stories table only)

**Next Phase**: Character Generation
Estimated time: 20-40 minutes

Now I'll create full character profiles from these archetypes with:
- Name and physical description
- Core trait (moral virtue)
- Internal flaw with CAUSE (wound/fear/false belief and why)
- External goal vs. internal need
- Detailed backstory
- Relationships (Jeong system)
- Voice style for dialogue
- Character portrait (AI-generated image)

Ready to continue? Say "generate characters" or ask me questions about the character archetypes first.
```

### 2.3 Phase 2-9: Progressive Generation Pattern

Each subsequent phase follows this pattern:

**1. Prerequisites Check**
```
Agent verifies:
- Previous phase completed
- Required data exists in database
- Story context is sufficient for next phase

If prerequisites missing:
"⚠️ Cannot generate [Phase X] yet.

You need to complete:
- [Missing Phase A]
- [Missing Phase B]

Would you like me to guide you through [Missing Phase A] first?"
```

**2. Phase-Specific Advisory**
```
Agent provides:
- Methodology guidance from novels-specification.md
- Current story context recap
- What will be generated in this phase
- How it builds on previous work
- Estimated time and cost (if applicable)
- Best practices and warnings
```

**3. Generation Execution**
```
Agent:
- Uses appropriate generation tool
- Shows tool execution in real-time
- Streams progress updates
- Displays generated content for review
```

**4. Database Persistence**
```
Agent:
- Uses CRUD tools to save generated content
- Shows database operations to user
- Confirms successful persistence
- Provides links to view/edit content
```

**5. Quality Check & Iteration**
```
Agent:
- Evaluates generated content (if applicable)
- Suggests improvements if quality < 3.0/4.0
- Offers regeneration option
- Allows manual editing before proceeding
```

**6. Progress Update & Next Steps**
```
Agent:
- Updates story progress tracking
- Shows completed phases
- Suggests next logical phase
- Estimates remaining time
- Allows jumping to specific phases (if prerequisites met)
```

---

## Part III: Advisory Intelligence System

### 3.1 Context-Aware Guidance

The agent maintains awareness of:

**Story State**
- Current phase in generation workflow
- Completed phases and their outputs
- Pending phases and dependencies
- Story metadata (genre, tone, moral framework)

**Content Quality**
- Character depth (internal flaw has cause?)
- Setting richness (adversity elements defined?)
- Part structure (MACRO arcs clear?)
- Chapter coherence (causal chains intact?)
- Scene quality (evaluation scores)

**User Preferences**
- Pacing (detailed vs. quick generation)
- Involvement level (review everything vs. trust AI)
- Writing style preferences
- Genre expertise

**Methodology Adherence**
- Adversity-Triumph cycle completeness
- Intrinsic motivation in virtuous actions
- Causal linking for earned luck
- Seed planting and resolution tracking

### 3.2 Advisory Triggers

**Preventive Guidance** (before issues occur)
```
Scenario: User wants to generate chapters without defining settings

Agent Response:
"⚠️ Advisory: Missing Settings

I notice you haven't generated settings yet. Settings are crucial because:

1. **Adversity Source**: Settings provide external obstacles (scarcity, danger, social dynamics)
2. **Cycle Amplification**: Settings enhance emotional beats in each scene
3. **Sensory Richness**: Settings ground abstract emotions in physical details

I can generate chapters without settings, but scenes will lack:
- Specific sensory details
- Environmental adversity
- Symbolic meaning

Recommendation: Generate settings first (15-30 min)

Proceed anyway? (not recommended)
```

**Corrective Guidance** (after detecting issues)
```
Scenario: Generated character lacks causal internal flaw

Agent Response:
"⚠️ Quality Issue Detected

Character: Jin
Internal Flaw: "Cannot forgive himself"

This flaw is too vague. The Adversity-Triumph Engine requires:
Format: "[fears/believes/wounded by] X because Y"

Why: The CAUSE creates:
- Empathy (reader understands why)
- Specificity (guides scene writing)
- Resolution path (clear healing arc)

Suggestion:
"Believes he is irredeemable because he followed orders that killed innocents, including a child"

Should I regenerate this character with a causal flaw?
```

**Opportunistic Guidance** (suggesting improvements)
```
Scenario: Story has strong characters but weak seed planting

Agent Response:
"💡 Enhancement Opportunity

Your character arcs are excellent! (High Jeong scores, clear flaws)

I notice seed planting could be stronger:
- Current: 2 seeds planted in Act I
- Recommended: 4-6 seeds for optimal "earned luck" feeling

Seeds create:
- Surprising but inevitable payoffs
- Reader satisfaction ("I remember that!")
- Emotional resonance (actions matter)

Would you like me to:
1. Suggest additional seeds for existing chapters?
2. Explain seed planting best practices?
3. Continue as-is?
```

### 3.3 Methodology Teaching

Agent explains Adversity-Triumph concepts as needed:

**Example: Explaining Intrinsic Motivation**
```
User: "Why does the agent keep flagging 'transactional language'?"

Agent Response:
"Great question! This is a core Adversity-Triumph principle.

**Intrinsic Motivation** = character acts from true values, not for reward

❌ Transactional (AVOID):
"She helped him, hoping he'd help her later"
"He knew this kindness would pay off"

✅ Intrinsic (GOOD):
"She helped him because she couldn't bear to see suffering"
"He acted from duty, expecting nothing"

**Why it matters**:
- Transactional → calculative, not morally elevated
- Intrinsic → audience feels moral beauty, gets Gam-dong

**The trick**: Character CAN benefit later, but they can't ACT FOR the benefit.

The 'earned luck' feels magical BECAUSE character didn't expect it.

Does this clarify why I'm flagging those phrases?
```

---

## Part IV: Database Integration Architecture

### 4.1 CRUD Tool Strategy

**Philosophy**: Database as Transparent Partner

Every database operation:
1. Shown to user BEFORE execution
2. Requires confirmation for destructive ops (delete, overwrite)
3. Provides rollback guidance if regretted
4. Maintains referential integrity

**Tool Categories**:

**Story Operations**
- `updateStory(storyId, data)` - Update story metadata
- `getStory(storyId)` - Retrieve story with all related data
- `deleteStory(storyId)` - Remove story (with cascade warning)

**Character Operations**
- `createCharacter(storyId, data)` - Add character to story
- `updateCharacter(characterId, data)` - Modify character profile
- `getCharacters(storyId)` - Get all story characters
- `deleteCharacter(characterId)` - Remove character (with dependency check)

**Setting Operations**
- `createSetting(storyId, data)` - Add setting to story
- `updateSetting(settingId, data)` - Modify setting
- `getSettings(storyId)` - Get all story settings
- `deleteSetting(settingId)` - Remove setting

**Part Operations**
- `createPart(storyId, data)` - Add part (act)
- `updatePart(partId, data)` - Modify part summary
- `getParts(storyId)` - Get all parts
- `deletePart(partId)` - Remove part (with chapter warning)

**Chapter Operations**
- `createChapter(partId, data)` - Add chapter to part
- `updateChapter(chapterId, data)` - Modify chapter
- `getChapters(partId)` - Get part chapters
- `deleteChapter(chapterId)` - Remove chapter (with scene warning)

**Scene Operations**
- `createScene(chapterId, data)` - Add scene to chapter
- `updateScene(sceneId, data)` - Modify scene content
- `getScenes(chapterId)` - Get chapter scenes
- `deleteScene(sceneId)` - Remove scene

**Batch Operations** (for efficiency)
- `batchCreateScenes(chapterId, scenesData[])` - Create multiple scenes
- `batchUpdateScenes(updates[])` - Update multiple scenes
- `batchDeleteScenes(sceneIds[])` - Remove multiple scenes

### 4.2 Data Validation Before Persistence

**Pre-Save Validation**:

```typescript
// Example: Character validation before createCharacter()
function validateCharacterData(data: CharacterData): ValidationResult {
  const errors = [];

  // Required fields
  if (!data.name) errors.push("Character name required");
  if (!data.coreTrait) errors.push("Core trait required");

  // Methodology validation
  if (!data.internalFlaw.includes("because")) {
    errors.push("Internal flaw must include CAUSE (use 'because')");
  }

  // Enum validation
  const validTraits = ['courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom'];
  if (!validTraits.includes(data.coreTrait)) {
    errors.push(`Core trait must be one of: ${validTraits.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

**Agent Response to Validation Failure**:
```
"❌ Cannot save character to database

Validation errors:
- Internal flaw must include CAUSE (use 'because')
- Core trait must be one of: courage, compassion, integrity, sacrifice, loyalty, wisdom

Should I:
1. Regenerate character with correct format?
2. Let you manually edit and retry?
3. Explain the validation rules?
```

### 4.3 Relationship Integrity Maintenance

**Cascading Operations**:

```
User: "Delete Part 2"

Agent Advisory:
"⚠️ Cascading Delete Warning

Deleting Part 2 will also delete:
- 4 chapters
- 18 scenes
- 1,847 words of content

This CANNOT be undone.

Are you sure? Type 'DELETE PART 2' to confirm.

Alternative: Archive instead? (preserves data, hides from story)"
```

**Foreign Key Validation**:

```
Agent attempting: createScene(chapterId: 'invalid')

Database response: Foreign key constraint violation

Agent Response:
"❌ Database Error: Invalid Chapter Reference

The chapter ID 'invalid' doesn't exist in the database.

This usually means:
- Chapter was deleted
- Wrong story selected
- Database sync issue

Current story chapters:
- Chapter 1: "Breaking Ground"
- Chapter 2: "The Gift"
- Chapter 3: "Confrontation"

Which chapter should this scene belong to?"
```

---

## Part V: API Key Management

### 5.1 User API Key Storage

**Database Schema** (existing `users` table extension):
```typescript
users table {
  id: uuid
  email: string
  // ... existing fields

  // NEW FIELDS:
  aiGatewayApiKey: string (encrypted)
  apiKeyCreatedAt: timestamp
  apiKeyLastUsed: timestamp
}
```

### 5.2 API Key Retrieval & Validation

**Agent Initialization**:
```typescript
// On agent chat page load
async function initializeStudioAgent(userId: string) {
  // Retrieve user's API key
  const user = await getUserById(userId);

  if (!user.aiGatewayApiKey) {
    // No API key found - guide user to add one
    return {
      hasApiKey: false,
      message: "Please add your Vercel AI Gateway API key to continue"
    };
  }

  // Validate key (test API call)
  const isValid = await validateApiKey(user.aiGatewayApiKey);

  if (!isValid) {
    return {
      hasApiKey: true,
      isValid: false,
      message: "Your API key appears invalid. Please update it in settings."
    };
  }

  return {
    hasApiKey: true,
    isValid: true,
    apiKey: user.aiGatewayApiKey
  };
}
```

**Agent Response to Missing Key**:
```
"🔑 API Key Required

To generate story content, I need your Vercel AI Gateway API key.

This key:
- Authenticates AI generation requests
- Is stored encrypted in your account
- Is never shared or exposed

How to get your key:
1. Go to https://vercel.com/dashboard
2. Navigate to AI Gateway settings
3. Create a new API key
4. Add it in Settings → AI Configuration

Once added, return here and we'll continue creating your story!

[Go to Settings] [I'll add it later]
```

### 5.3 Secure API Usage

**Key Encryption**:
```typescript
// Store encrypted
import { encrypt, decrypt } from '@/lib/crypto';

async function saveUserApiKey(userId: string, apiKey: string) {
  const encrypted = encrypt(apiKey, process.env.ENCRYPTION_KEY);

  await db.update(users)
    .set({
      aiGatewayApiKey: encrypted,
      apiKeyCreatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

// Retrieve decrypted
async function getUserApiKey(userId: string): Promise<string> {
  const user = await getUserById(userId);
  return decrypt(user.aiGatewayApiKey, process.env.ENCRYPTION_KEY);
}
```

**Rate Limiting & Cost Tracking**:
```typescript
// Track API usage
await db.insert(apiUsage).values({
  userId: userId,
  operation: 'generateChapter',
  tokenCount: 5000,
  cost: 0.025, // $0.025
  timestamp: new Date()
});
```

---

## Part VI: Success Metrics

### 6.1 User Experience Metrics

**Completion Rates**
- Stories started vs. completed (all 9 phases): Target 60%+
- Phase completion by phase: Identify drop-off points
- Time per phase: Compare against estimates

**User Satisfaction**
- Agent helpfulness rating (1-5 scale): Target 4.2+
- Advisory relevance rating: Target 4.0+
- Transparency satisfaction: Target 4.5+

**Engagement Metrics**
- Messages per story: Average conversation depth
- Iteration rate: How often users regenerate/edit
- Manual edits: Ratio of AI-generated to user-edited content

### 6.2 Quality Metrics

**Story Quality**
- Average scene evaluation scores: Target 3.2+/4.0
- First-pass success rate: Target 85%+
- Methodology adherence:
  - Intrinsic motivation detection: Target 90%+
  - Causal chain continuity: Target 95%+
  - Seed resolution rate: Target 70%+

**Agent Performance**
- Advisory accuracy: Relevant suggestions 80%+
- Prerequisite detection: 100% accuracy
- Database validation: 100% data integrity

### 6.3 Technical Metrics

**Performance**
- Agent response time (first token): < 2 seconds
- Tool execution time: Track by tool type
- Database query performance: < 100ms for reads
- Chat history load time: < 1 second

**Reliability**
- API key validation success: 99%+
- Database transaction success: 99.9%+
- Generation failure recovery: 95%+
- Data consistency checks: 100% pass rate

---

## Part VII: User Scenarios

### Scenario 1: First-Time Writer

**Profile**: No writing experience, excited about AI assistance

**Journey**:
1. Clicks "Create New Story", redirected to agent
2. Agent provides warm welcome, explains 9 phases
3. User shares story idea (vague, unstructured)
4. Agent asks clarifying questions to extract:
   - Moral question
   - Character archetypes
   - Emotional tone desired
5. Agent generates story summary with detailed explanation
6. User sees transparent tool execution, database updates
7. Agent provides educational commentary on each phase
8. User completes story with high satisfaction (feels guided)

**Success Indicators**:
- Completes all 9 phases
- High advisory engagement (asks questions)
- Positive feedback on guidance quality

### Scenario 2: Experienced Writer

**Profile**: Published author, using AI for drafting speed

**Journey**:
1. Starts with detailed story pitch (moral framework already clear)
2. Agent recognizes depth, adjusts tone to peer-level
3. User requests "fast mode" - minimal advisory, trust AI
4. Agent generates phases with brief confirmations
5. User pauses at Scene Content to manually refine dialogue
6. Agent detects manual edits, offers:
   - "Learn your dialogue style for future scenes?"
   - "Apply similar refinements to other scenes?"
7. User completes story in record time with targeted interventions

**Success Indicators**:
- Fast completion (lower time per phase)
- Low iteration rate (trusts first generation)
- Strategic manual edits (knows when to intervene)

### Scenario 3: Collaborative Team

**Profile**: Writing team working on shared story universe

**Journey**:
1. Writer A creates story, completes Phases 1-3
2. Writer B joins via `/studio/agent/{storyId}`
3. Agent loads full conversation history
4. Agent summarizes: "Story so far: [recap], completed up to Settings"
5. Writer B asks: "Why did we choose this moral framework?"
6. Agent shows relevant messages from history where decision was made
7. Writer B continues with Phases 4-6
8. Writer A returns, sees progress, completes Phases 7-9

**Success Indicators**:
- Seamless handoff between writers
- Context preservation (no redundant questions)
- Collaboration efficiency (faster than solo)

### Scenario 4: Recovery from Error

**Profile**: User encountered generation failure mid-story

**Journey**:
1. User was generating Scene Content, API timeout occurred
2. Partial scene saved to database, marked as incomplete
3. User returns to agent chat
4. Agent detects incomplete scene:
   ```
   "👋 Welcome back!

   I see Scene 4 generation was interrupted. The scene is partially complete (487 words of 800 target).

   Options:
   1. Continue from where we left off
   2. Regenerate the entire scene
   3. Mark as complete and move on

   What would you like to do?"
   ```
5. User chooses "Continue from where we left off"
6. Agent resumes, completes scene successfully
7. Story generation continues without data loss

**Success Indicators**:
- Zero data loss
- Clear recovery options
- User confidence maintained

---

## Part VIII: Future Enhancements

### 8.1 Planned Features (Phase 2)

**Voice & Tone Customization**
- Agent adapts communication style to user preference
- Formal vs. casual tone
- Detailed vs. concise explanations
- Teaching mode vs. peer mode

**Advanced Analytics**
- Story health dashboard
- Cycle completeness visualization
- Emotional arc graphs
- Seed tracking diagram

### 8.2 Experimental Features (Research)

**Dynamic Tool Discovery (MCP)**
- Third-party writing tools integration
- Custom methodology plugins
- External API connections (grammar, thesaurus)

**Reinforcement Learning from User Feedback**
- Learn from user's accept/reject decisions
- Personalize advisory triggers
- Optimize generation prompts per user

**Multi-Modal Generation**
- Audio narration generation
- Video storyboard creation
- Interactive story prototypes

---

## Conclusion

The Studio Agent transforms story creation from a solitary, overwhelming task into a guided, transparent, and emotionally intelligent collaboration between writer and AI.

**Core Strengths**:
1. **Methodology-Driven**: Built on proven Adversity-Triumph principles
2. **Progressive**: No overwhelming automation, step-by-step guidance
3. **Transparent**: All AI reasoning and tool execution visible
4. **Integrated**: Database CRUD as first-class tools
5. **Secure**: User API keys encrypted and validated
6. **Educational**: Teaches narrative psychology while creating

**Expected Outcomes**:
- 60%+ story completion rate (vs. industry 20-30%)
- 4.2+ average satisfaction rating
- 85%+ first-pass quality success
- 3.2+ average scene evaluation scores

**Implementation Priority**:
1. Core agent chat with tool visualization (Week 1-2)
2. CRUD tools for all story entities (Week 3-4)
3. Generation tools integration (Week 5-6)
4. Advisory intelligence system (Week 7-8)
5. API key management (Week 9)
6. Testing and refinement (Week 10)

**Ready for Development**: See `studio-agent-development.md` for complete implementation specifications.
