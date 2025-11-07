---
title: Studio Agent UI Specification
---

# Studio Agent UI Specification

## Executive Summary

The Studio Agent UI uses a **3-panel adaptive layout** inspired by modern AI interfaces (Claude Artifacts, Windsurf, Cursor) but optimized for story writing workflows.

**Design Philosophy**:
- **Transparent**: All AI operations visible as visual cards
- **Organized**: Separate navigation, artifacts, and conversation
- **Contextual**: Show relevant artifacts based on current phase
- **Flexible**: Panels can be resized, collapsed, or popped out
- **Clean**: Minimal clutter, Apple-like attention to detail

**Status**: 📋 Specification Ready for Implementation

**Related Documents**:
- 📖 **Agent Specification** (`docs/studio/studio-agent-specification.md`): Conceptual design and user journeys
- 🔧 **Agent Development** (`docs/studio/studio-agent-development.md`): Implementation guide

---

## Part I: Layout Architecture

### 1.1 Three-Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header: Story Title | Phase Progress Bar | User Menu               │
├─────────┬────────────────────────────────────────┬───────────────────┤
│         │                                        │                   │
│  LEFT   │           CENTER                       │      RIGHT        │
│  PANEL  │           PANEL                        │      PANEL        │
│ (200px) │          (flex-1)                      │     (400px)       │
│         │                                        │                   │
│  Tree   │     Artifact Viewer                    │   Agent Chat      │
│  Nav    │     (Context-Aware)                    │   (Conversation)  │
│         │                                        │                   │
│  Story  │  - Character Cards                     │  - Messages       │
│  Struct │  - Setting Visualizations              │  - Tool Execution │
│         │  - Arc Diagrams                        │  - Input Field    │
│  Phase  │  - Scene Content                       │  - Suggestions    │
│  Status │  - Database Changes                    │                   │
│         │                                        │                   │
└─────────┴────────────────────────────────────────┴───────────────────┘
```

### 1.2 Panel Specifications

#### Left Panel: Navigation Tree (200-300px, resizable)

**Purpose**: Story structure navigation + phase progress tracking

**Components**:
1. **Story Tree** (collapsible hierarchy):
   ```
   📖 Story Title
   ├─ 📝 Story Summary
   ├─ 👥 Characters (3)
   │  ├─ Yuna (protagonist)
   │  ├─ Jin (antagonist)
   │  └─ Marcus (ally)
   ├─ 🏛️ Settings (2)
   │  ├─ The Garden
   │  └─ The Ruins
   ├─ 📚 Parts (3)
   │  ├─ Act I: Setup
   │  │  ├─ Ch1: Breaking Ground
   │  │  │  ├─ Scene 1.1: The Ruins
   │  │  │  ├─ Scene 1.2: First Seed
   │  │  │  └─ Scene 1.3: Hope Rising
   │  │  └─ Ch2: The Gift
   │  │     ├─ Scene 2.1: The Encounter
   │  │     └─ Scene 2.2: Trust Building
   │  ├─ Act II: Confrontation
   │  └─ Act III: Resolution
   ```

2. **Phase Progress** (bottom section):
   ```
   ┌─────────────────────────┐
   │ Generation Progress     │
   ├─────────────────────────┤
   │ ✅ 1. Story Summary     │
   │ ✅ 2. Characters        │
   │ ✅ 3. Settings          │
   │ ✅ 4. Parts             │
   │ ✅ 5. Chapters          │
   │ 🔄 6. Scene Summaries   │ <- Current phase
   │ ⏸️ 7. Scene Content     │
   │ ⏸️ 8. Evaluation        │
   │ ⏸️ 9. Images            │
   ├─────────────────────────┤
   │ Overall: 55% Complete   │
   │ Est. Time: 45-90 min    │
   └─────────────────────────┘
   ```

**Features**:
- Click tree items → Show in artifact panel
- Hover → Quick preview tooltip
- Color coding: Blue (current), Green (complete), Gray (pending)

#### Center Panel: Artifact Viewer (flex-1, main area)

**Purpose**: Display story artifacts with context-aware rendering

**Artifact Types & Renderings**:

1. **Empty State** (no artifact selected):
   ```
   ┌────────────────────────────────────┐
   │                                    │
   │          ✨ Studio Agent           │
   │                                    │
   │   Select an item from the tree     │
   │   or continue chatting to          │
   │   generate story content           │
   │                                    │
   └────────────────────────────────────┘
   ```

2. **Character Card**:
   ```
   ┌────────────────────────────────────────────────┐
   │ 👤 Character: Yuna                             │
   ├────────────────────────────────────────────────┤
   │ [AI-Generated Portrait Image 1344×768, 7:4]    │
   ├────────────────────────────────────────────────┤
   │ Core Trait: Compassion                         │
   │ Internal Flaw: Fears trusting former enemies   │
   │                because betrayal killed family  │
   │ External Goal: Grow enough food for winter     │
   │                                                │
   │ Backstory:                                     │
   │ [2-4 paragraph backstory with rich details]   │
   │                                                │
   │ Voice Style:                                   │
   │ - Tone: Warm but cautious                     │
   │ - Vocabulary: Simple, nature-focused          │
   │ - Quirks: Uses farming metaphors              │
   │                                                │
   │ [Edit] [Regenerate] [Delete]                  │
   └────────────────────────────────────────────────┘
   ```

3. **Chapter Summary**:
   ```
   ┌────────────────────────────────────────────────┐
   │ 📄 Chapter 1: Breaking Ground                  │
   ├────────────────────────────────────────────────┤
   │ Order: 1                                       │
   │ Part: Act I - Setup                            │
   │ Status: ✅ Complete                            │
   │                                                │
   │ Summary:                                       │
   │ Yuna discovers a patch of fertile soil among   │
   │ the ruins. Despite her fear of outsiders, she  │
   │ accepts help from Jin, a former soldier...     │
   │                                                │
   │ Adversity-Triumph Cycle:                       │
   │ • Adversity: Trust fears meet resource need    │
   │ • Virtue: Compassionate acceptance             │
   │ • Consequence: Unexpected alliance forms       │
   │ • New Adversity: Debt creates obligation       │
   │                                                │
   │ Scenes: 3 (all complete)                       │
   │ Word Count: 2,450                              │
   │                                                │
   │ [Edit] [Regenerate Scenes] [View Scenes]      │
   └────────────────────────────────────────────────┘
   ```

4. **Scene Summary** (compact view from tree):
   ```
   ┌────────────────────────────────────────────────┐
   │ 🎬 Scene 1.2: First Seed                       │
   ├────────────────────────────────────────────────┤
   │ Chapter: Breaking Ground                       │
   │ Cycle Phase: VIRTUE                            │
   │ Emotional Beat: Hope                           │
   │ Status: ✅ Complete                            │
   │                                                │
   │ Summary:                                       │
   │ Yuna plants the first seed Jin gave her. As    │
   │ she tends the soil, she shares stories of her  │
   │ lost family, surprising herself with openness. │
   │                                                │
   │ Word Count: 847                                │
   │ Quality Score: 3.4/4.0 ✅                      │
   │                                                │
   │ [View Full Content] [Edit] [Regenerate]       │
   └────────────────────────────────────────────────┘
   ```

5. **Scene Content** (full prose view):
   ```
   ┌────────────────────────────────────────────────┐
   │ 📄 Scene 1.2: First Seed (Full Content)        │
   │ Cycle Phase: VIRTUE | Emotional Beat: Hope     │
   ├────────────────────────────────────────────────┤
   │ [Scene Image 1792×1024, 16:9]                  │
   ├────────────────────────────────────────────────┤
   │                                                │
   │ The garden was a patchwork of hope and        │
   │ desperation. Yuna knelt among the seedlings,  │
   │ her fingers tracing the delicate leaves.      │
   │                                                │
   │ She heard footsteps—heavy, hesitant.          │
   │                                                │
   │ "I brought seeds," Jin said, voice barely     │
   │ above a whisper.                              │
   │                                                │
   │ [Full formatted content with max 3 sentences  │
   │  per paragraph for mobile readability]        │
   │                                                │
   │ Quality Score: 3.4/4.0 ✅                      │
   │ Word Count: 847                                │
   │                                                │
   │ [Edit] [Regenerate] [Evaluate]                │
   └────────────────────────────────────────────────┘
   ```

6. **Emotional Arc Diagram** (Visx-powered interactive chart):
   ```
   ┌────────────────────────────────────────────────┐
   │ 📊 Emotional Arc: Adversity-Triumph Engine     │
   │ [Part I: Act I - Setup]              [Play ▶] │
   ├────────────────────────────────────────────────┤
   │                                                │
   │    Emotion                                     │
   │      ↑                                         │
   │   10 │         ●───┐                          │
   │      │        /│   │  ⭐ Virtue (Ch2)         │
   │    5 │       / │   └─●                        │
   │      │      /  │     │  ✨ Earned Luck       │
   │    0 │─────●   │     └──●                     │
   │      │  Adversity    New Adversity            │
   │   -5 │   (Ch1)         (Ch3)                  │
   │      │                                         │
   │  -10 │                                         │
   │      └────────────────────────────→ Timeline  │
   │         Ch1    Ch2    Ch3    Ch4              │
   │                                                │
   │ 🤖 Character Avatar (animated along path)     │
   │                                                │
   │ Annotations:                                   │
   │ ⭐ Virtuous Action - Compassion shown          │
   │ ✨ Unintended Consequence - Trust gained       │
   │                                                │
   │ [Zoom] [Export SVG] [View Data]               │
   └────────────────────────────────────────────────┘
   ```

7. **Chapter Flow Editor** (React Flow-powered node editor):
   ```
   ┌────────────────────────────────────────────────┐
   │ 🎯 Chapter Flow: Part I (Act I)                │
   │ [Add Chapter] [Auto-Layout] [Validate Cycles]  │
   ├────────────────────────────────────────────────┤
   │                                                │
   │  ┌──────────────┐     ┌──────────────┐        │
   │  │ Chapter 1    │────▶│ Chapter 2    │        │
   │  ├──────────────┤     ├──────────────┤        │
   │  │ 1. Adversity:│     │ 1. Adversity:│        │
   │  │ Yuna fears   │     │ Jin's guilt  │        │
   │  │ trusting...  │     │ prevents...  │        │
   │  │              │     │              │        │
   │  │ 2. Virtue:   │     │ 2. Virtue:   │        │
   │  │ Helps enemy  │     │ Reveals past │        │
   │  │              │     │              │        │
   │  │ 3. Earned    │     │ 3. Earned    │        │
   │  │ Luck: Seeds  │     │ Luck: Trust  │        │
   │  │              │     │              │        │
   │  │ 4. New Adv:  │     │ 4. New Adv:  │        │
   │  │ Debt owed──┐ │     │ Danger from  │        │
   │  └────────────┼─┘     └──────────────┘        │
   │               └────────────▶                   │
   │                                                │
   │ [Drag nodes to reorder] [Click to edit]       │
   └────────────────────────────────────────────────┘
   ```

5. **Scene Content** (formatted prose):
   ```
   ┌────────────────────────────────────────────────┐
   │ 📄 Scene 1.2: The Gift                         │
   │ Cycle Phase: VIRTUE                            │
   ├────────────────────────────────────────────────┤
   │ [Scene Image 1792×1024, 16:9]                  │
   ├────────────────────────────────────────────────┤
   │                                                │
   │ The garden was a patchwork of hope and        │
   │ desperation. Yuna knelt among the seedlings,  │
   │ her fingers tracing the delicate leaves.      │
   │                                                │
   │ She heard footsteps—heavy, hesitant.          │
   │                                                │
   │ "I brought seeds," Jin said, voice barely     │
   │ above a whisper.                              │
   │                                                │
   │ [Full formatted content with max 3 sentences  │
   │  per paragraph for mobile readability]        │
   │                                                │
   │ Quality Score: 3.4/4.0 ✅                      │
   │ Word Count: 847                                │
   │                                                │
   │ [Edit] [Regenerate] [Evaluate]                │
   └────────────────────────────────────────────────┘
   ```

8. **Database Changes** (confirmation before execution):
   ```
   ┌────────────────────────────────────────────────┐
   │ 💾 Database Operation: createCharacter         │
   ├────────────────────────────────────────────────┤
   │ ⚠️ Confirm database change                     │
   │                                                │
   │ Table: characters                              │
   │ Action: INSERT                                 │
   │                                                │
   │ New Record:                                    │
   │ - name: "Yuna"                                 │
   │ - isMain: true                                 │
   │ - coreTrait: "compassion"                      │
   │ - internalFlaw: "Fears trusting..."           │
   │ - backstory: "In a war-torn city..."          │
   │ - imageUrl: "[generated_url]"                  │
   │                                                │
   │ [✅ Confirm] [❌ Cancel]                       │
   └────────────────────────────────────────────────┘
   ```

#### Right Panel: Agent Chat (400-600px, resizable)

**Purpose**: Conversation with Studio Agent + tool execution transparency

**Components**:

1. **Message Thread** (scrollable):
   ```
   ┌────────────────────────────────────────┐
   │ 🤖 Assistant                           │
   │ ┌────────────────────────────────────┐ │
   │ │ Welcome to Story Creation!         │ │
   │ │                                    │ │
   │ │ I'll guide you through the         │ │
   │ │ Adversity-Triumph Engine...        │ │
   │ └────────────────────────────────────┘ │
   │                                        │
   │ 👤 User                                │
   │ ┌────────────────────────────────────┐ │
   │ │ A refugee woman starts a garden    │ │
   │ │ in a destroyed city...             │ │
   │ └────────────────────────────────────┘ │
   │                                        │
   │ 🤖 Assistant (with tool)               │
   │ ┌────────────────────────────────────┐ │
   │ │ Great concept! Let me analyze...   │ │
   │ │                                    │ │
   │ │ I see excellent potential for      │ │
   │ │ Gam-dong (emotional resonance)     │ │
   │ │                                    │ │
   │ │ 🔧 Tool Execution:                 │ │
   │ │ ┌──────────────────────────────┐   │ │
   │ │ │ ✅ checkPrerequisites        │   │ │
   │ │ │ Target: story-summary        │   │ │
   │ │ │ Result: Ready to proceed     │   │ │
   │ │ │ Time: 45ms                   │   │ │
   │ │ └──────────────────────────────┘   │ │
   │ │                                    │ │
   │ │ Should I generate the story        │ │
   │ │ summary now?                       │ │
   │ └────────────────────────────────────┘ │
   └────────────────────────────────────────┘
   ```

2. **Tool Execution Cards** (inline with messages):
   ```
   ┌─────────────────────────────────────┐
   │ 🔧 generateStorySummary             │
   ├─────────────────────────────────────┤
   │ Status: ✅ Completed (12.4s)        │
   │                                     │
   │ Input:                              │
   │ {                                   │
   │   userPrompt: "A refugee woman...", │
   │   storyId: "story_123"              │
   │ }                                   │
   │                                     │
   │ Output:                             │
   │ {                                   │
   │   summary: "In a war-torn city...", │
   │   genre: "Literary Fiction",        │
   │   tone: "Bittersweet, Hopeful"      │
   │ }                                   │
   │                                     │
   │ [View Full Result]                  │
   └─────────────────────────────────────┘
   ```

3. **Input Area** (bottom):
   ```
   ┌─────────────────────────────────────┐
   │ @mention for context:               │
   │ - @story [Story Title]              │
   │ - @part Act I                       │
   │ - @chapter Chapter 1                │
   │ - @scene Scene 1.2                  │
   │ - @character Yuna                   │
   │ - @setting The Garden               │
   ├─────────────────────────────────────┤
   │ [Textarea: Auto-resize 80-200px]    │
   │ Tell me about your story...         │
   │                                     │
   │                                     │
   │                       [Send ⏎]      │
   ├─────────────────────────────────────┤
   │ Suggested Actions:                  │
   │ • Generate characters               │
   │ • Continue with next phase          │
   │ • Evaluate current scene quality    │
   └─────────────────────────────────────┘
   ```

### 1.3 Responsive Behavior

**Desktop (>1024px)**:
- All 3 panels visible
- Left: 250px, Center: flex-1, Right: 450px
- Resizable panels with drag handles

**Mobile (<1024px)**:
- Tab-based layout: [Tree] [Artifact] [Chat]
- Active tab fills screen
- Bottom tab bar for switching between panels
- Chat panel as default view
- Swipe gestures to switch tabs

---

## Part II: Component Specifications

### 2.1 Story Tree Navigator

**Component**: `StoryTreeNavigator`

**Props**:
```typescript
interface StoryTreeNavigatorProps {
  storyId: string;
  currentPhase: string;
  completedPhases: string[];
  onSelectNode: (nodeId: string, nodeType: string) => void;
  onContextMenu: (nodeId: string, action: string) => void;
}
```

**Features**:
- Lazy loading (load children on expand)
- Keyboard navigation (arrow keys, Enter to select)
- Collapsible sections
- Smooth expand/collapse animations

**States**:
- Loading: Skeleton UI with shimmer
- Empty: "No content yet" message
- Error: Error boundary with retry option

### 2.2 Artifact Viewer

**Component**: `ArtifactViewer`

**Props**:
```typescript
interface ArtifactViewerProps {
  artifact: Artifact | null;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
}

type Artifact =
  | { type: 'story'; data: Story }
  | { type: 'part'; data: Part }
  | { type: 'chapter'; data: Chapter }
  | { type: 'scene-summary'; data: Scene }
  | { type: 'scene-content'; data: Scene }
  | { type: 'character'; data: Character }
  | { type: 'setting'; data: Setting }
  | { type: 'emotional-arc'; data: EmotionalArcData }
  | { type: 'chapter-flow'; data: ChapterFlowData }
  | { type: 'db-change'; data: DbChange }
  | { type: 'empty' };
```

**Rendering Strategy**:
- Dynamic component selection based on artifact type
- Lazy image loading with blur-up placeholders
- Syntax highlighting for code/JSON
- Interactive SVG for diagrams
- Markdown rendering for prose

**Animation**:
- Fade-in when artifact changes (300ms)
- Skeleton loading for slow operations
- Smooth transitions between artifacts

### 2.3 Agent Chat

**Component**: `AgentChat`

**Props**:
```typescript
interface AgentChatProps {
  chatId: string;
  storyId: string;
  onArtifactGenerated: (artifact: Artifact) => void;
}
```

**Features**:
- **Message Types**:
  - User message
  - Assistant message (with reasoning)
  - Tool execution card (inline)
  - System message (phase transitions)

- **Context Management**:
  - @-mentions for characters, scenes, settings
  - Pinned context (always included)
  - Auto-suggest context based on current phase

- **Input Enhancements**:
  - Auto-resize textarea (min 80px, max 200px)
  - Shift+Enter for newline, Enter to send
  - Suggested actions (chips below input)
  - Voice input (optional)

- **Tool Visualization**:
  - Real-time status (⏳ Loading → ✅ Success / ❌ Error)
  - Collapsible input/output JSON
  - Execution time display
  - Error messages with retry option

### 2.4 Phase Progress Indicator

**Component**: `PhaseProgress`

**Visual Design**:
```
┌────────────────────────────────┐
│ Phase 6 of 9: Scene Summaries  │
├────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░ 60%    │
├────────────────────────────────┤
│ ✅ Story Summary      (15 min) │
│ ✅ Characters         (28 min) │
│ ✅ Settings           (19 min) │
│ ✅ Parts              (34 min) │
│ ✅ Chapters           (67 min) │
│ 🔄 Scene Summaries    (22 min) │ <- Current
│ ⏸️ Scene Content               │
│ ⏸️ Evaluation                  │
│ ⏸️ Images                      │
├────────────────────────────────┤
│ Est. Remaining: 45-90 min      │
│ [Pause] [Skip] [Settings]     │
└────────────────────────────────┘
```

**Features**:
- Click phase → Jump to that phase (if prerequisites met)
- Hover → Show phase details (time estimate, what's generated)
- Auto-update on completion
- Warning if trying to skip without prerequisites

---

## Part III: Interaction Patterns

### 3.1 Artifact Generation Flow

**User Action** → **Agent Response** → **Artifact Display**

1. User sends message: "Generate characters"
2. Agent shows reasoning:
   ```
   "I'll create character profiles based on the story summary.

   I'll use the generateCharacters tool with:
   - Story context
   - 3 characters (protagonist, antagonist, ally)
   - Realistic visual style
   "
   ```
3. Tool execution card appears (loading state)
4. On success:
   - Tool card shows ✅ with execution time
   - Agent says: "✅ Characters created! I've added Yuna, Jin, and Marcus to your story."
   - Center panel automatically shows first character card
   - Left tree updates with new character nodes

### 3.2 Database Change Confirmation

**Every database operation requires user confirmation before execution:**

1. Agent proposes tool: `createCharacter`
2. Center panel shows confirmation dialog:
   ```
   ┌──────────────────────────────────┐
   │ 💾 Database Operation            │
   ├──────────────────────────────────┤
   │ ⚠️ Confirm database change       │
   │                                  │
   │ Tool: createCharacter            │
   │ Table: characters                │
   │ Action: INSERT                   │
   │                                  │
   │ New Record:                      │
   │ {                                │
   │   id: "char_abc123",             │
   │   name: "Yuna",                  │
   │   coreTrait: "compassion",       │
   │   internalFlaw: "Fears...",      │
   │   backstory: "In a war...",      │
   │   imageUrl: "[generated_url]"    │
   │ }                                │
   │                                  │
   │ [✅ Confirm] [❌ Cancel]         │
   └──────────────────────────────────┘
   ```

3. User actions:
   - Click "✅ Confirm" → Execute database operation
   - Click "❌ Cancel" → Abort operation, return to chat

4. After confirmation, operation executes and shows success message in chat

### 3.3 Context Management (@-mentions)

**User types in chat input:**
```
"Improve @character Yuna's backstory to emphasize her connection to @setting The Garden"
```

**UI behavior**:
1. As user types `@`, show autocomplete:
   ```
   @story ...
   @part ...
   @chapter ...
   @scene ...
   @character ...
   @setting ...
   ```

2. After selecting `@character`:
   ```
   @character Yuna
   @character Jin
   @character Marcus
   ```

3. Selected mentions appear as chips in input:
   ```
   [📌 Yuna] [📌 The Garden]
   ```

4. Agent receives context automatically:
   ```typescript
   {
     mentions: [
       { type: 'character', id: 'char_yuna', name: 'Yuna' },
       { type: 'setting', id: 'set_garden', name: 'The Garden' }
     ]
   }
   ```

**Supported @-mention types:**
- `@story` - Story title and summary
- `@part` - Part summary and chapters
- `@chapter` - Chapter summary and scenes
- `@scene` - Scene summary or full content
- `@character` - Character profile
- `@setting` - Setting details

### 3.4 Error Handling

**Graceful degradation for all error states:**

1. **API Key Missing**:
   ```
   ┌─────────────────────────────────────┐
   │ 🔑 API Key Required                 │
   ├─────────────────────────────────────┤
   │ To generate story content, you need │
   │ a Fictures API key with these       │
   │ scopes:                             │
   │ • ai:use                            │
   │ • stories:write                     │
   │                                     │
   │ [Go to Settings] [Learn More]      │
   └─────────────────────────────────────┘
   ```

2. **Generation Failure**:
   ```
   ┌─────────────────────────────────────┐
   │ ❌ Generation Failed                │
   ├─────────────────────────────────────┤
   │ Tool: generateCharacters            │
   │ Error: Request timeout (30s)        │
   │                                     │
   │ This usually means:                 │
   │ • AI service is overloaded          │
   │ • Network connection issue          │
   │                                     │
   │ [Retry] [Try Simpler Prompt]       │
   └─────────────────────────────────────┘
   ```

3. **Database Constraint Violation**:
   ```
   ┌─────────────────────────────────────┐
   │ ⚠️ Database Error                   │
   ├─────────────────────────────────────┤
   │ Cannot delete Part 2 - it has 4     │
   │ chapters with content.              │
   │                                     │
   │ Would you like to:                  │
   │ • Delete chapters and part          │
   │ • Keep chapters, remove from part   │
   │ • Cancel                            │
   │                                     │
   │ [Delete All] [Keep Chapters] [Cancel]│
   └─────────────────────────────────────┘
   ```

---

## Part IV: Visual Design System

### 4.1 Color Palette

**Semantic Colors**:
```css
/* Phase Status */
--phase-complete: #10b981;     /* Green */
--phase-current: #3b82f6;      /* Blue */
--phase-pending: #9ca3af;      /* Gray */
--phase-error: #ef4444;        /* Red */

/* UI Elements */
--primary: #6366f1;            /* Indigo */
--secondary: #8b5cf6;          /* Purple */
--accent: #ec4899;             /* Pink */
--background: #ffffff;         /* White */
--surface: #f9fafb;            /* Light gray */
--border: #e5e7eb;             /* Gray-200 */

/* Text */
--text-primary: #111827;       /* Gray-900 */
--text-secondary: #6b7280;     /* Gray-500 */
--text-tertiary: #9ca3af;      /* Gray-400 */

/* Tool Execution */
--tool-loading: #f59e0b;       /* Amber */
--tool-success: #10b981;       /* Green */
--tool-error: #ef4444;         /* Red */
```

### 4.2 Typography

**Font Stack**:
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

**Type Scale**:
```css
--text-xs: 0.75rem;     /* 12px - Labels, metadata */
--text-sm: 0.875rem;    /* 14px - Body text, chat */
--text-base: 1rem;      /* 16px - Default */
--text-lg: 1.125rem;    /* 18px - Headings */
--text-xl: 1.25rem;     /* 20px - Panel headers */
--text-2xl: 1.5rem;     /* 24px - Page title */
```

### 4.3 Spacing System

**8px Grid**:
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

### 4.4 Components

**Cards**:
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--space-4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**Buttons**:
```css
.button-primary {
  background: var(--primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: 6px;
  font-weight: 500;
  transition: background 150ms;
}

.button-primary:hover {
  background: #4f46e5; /* Darker indigo */
}
```

**Tool Execution Card**:
```css
.tool-card {
  background: #f0f9ff; /* Blue-50 */
  border-left: 4px solid var(--primary);
  padding: var(--space-3);
  margin: var(--space-2) 0;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.tool-card.loading {
  border-left-color: var(--tool-loading);
}

.tool-card.success {
  border-left-color: var(--tool-success);
}

.tool-card.error {
  border-left-color: var(--tool-error);
  background: #fef2f2; /* Red-50 */
}
```

---

## Part V: Implementation Priority

### 5.1 Phase 1: Core Layout (Week 1-2)

**Goal**: Basic 3-panel layout with navigation

- [ ] Responsive grid layout (3 panels)
- [ ] Panel resize functionality
- [ ] Collapse/expand panels
- [ ] Story tree navigator (basic)
- [ ] Empty state for artifact panel
- [ ] Agent chat UI (messages only, no tools yet)

**Deliverable**: Users can chat with agent and see story tree

### 5.2 Phase 2: Artifact Rendering (Week 3-4)

**Goal**: Display story artifacts in center panel

- [ ] Character card component
- [ ] Setting card component
- [ ] Scene content viewer (formatted prose)
- [ ] Arc diagram (static SVG first)
- [ ] Artifact routing (click tree → show artifact)
- [ ] Image lazy loading with placeholders

**Deliverable**: Generated content displays beautifully

### 5.3 Phase 3: Tool Visualization (Week 5-6)

**Goal**: Transparent tool execution in chat

- [ ] Tool execution card component
- [ ] Real-time status updates (loading → success/error)
- [ ] Collapsible JSON input/output
- [ ] Database change visualization
- [ ] Tool history in cascade pattern (like Windsurf)
- [ ] Rollback functionality for database operations

**Deliverable**: All AI operations are visible and transparent

### 5.4 Phase 4: Context Management (Week 7-8)

**Goal**: @-mention system for context

- [ ] @-mention autocomplete
- [ ] Context chips in input
- [ ] Pinned contexts
- [ ] Context indicators in messages
- [ ] Smart suggestions based on phase

**Deliverable**: Users can easily provide context to agent

### 5.5 Phase 5: Polish & UX (Week 9-10)

**Goal**: Production-ready UX

- [ ] Keyboard shortcuts
- [ ] Loading states & animations
- [ ] Error boundaries
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Mobile responsive design
- [ ] Dark mode support
- [ ] Performance optimization (virtual scrolling, lazy loading)

**Deliverable**: Smooth, polished user experience

---

## Part VI: Technical Implementation

### 6.1 Tech Stack

**Frontend**:
- React 19 + Server Components
- Tailwind CSS v4
- Shadcn UI components
- **Visx** (@visx/xychart, @visx/annotation) - Emotional arc visualization
- **React Flow** (@xyflow/react) - Chapter flow node editor
- **react-spring** - Character avatar animation along path
- React-Aria (accessibility)
- React-Virtual (tree scrolling)

**State Management**:
- Zustand (global state)
- React Query (server state)
- Local storage (panel sizes, preferences)

**Real-time**:
- Server-Sent Events (SSE) for streaming
- Optimistic updates for database operations

### 6.2 Code Structure

```
src/
├── app/studio/
│   ├── agent/
│   │   └── [chatId]/
│   │       ├── page.tsx                    # Main layout
│   │       └── layout.tsx                  # 3-panel grid
│   └── api/
│       └── agent/
│           └── route.ts                    # Agent endpoint
│
├── components/studio/
│   ├── layout/
│   │   ├── studio-agent-layout.tsx         # 3-panel grid
│   │   ├── resizable-panel.tsx             # Panel resize logic
│   │   └── responsive-panels.tsx           # Responsive behavior
│   │
│   ├── tree/
│   │   ├── story-tree-navigator.tsx        # Left panel tree
│   │   ├── story-tree-node.tsx             # Tree node component
│   │   ├── phase-progress.tsx              # Phase indicator
│   │   └── tree-context-menu.tsx           # Right-click menu
│   │
│   ├── artifacts/
│   │   ├── artifact-viewer.tsx             # Center panel router
│   │   ├── character-card.tsx              # Character artifact
│   │   ├── setting-card.tsx                # Setting artifact
│   │   ├── scene-viewer.tsx                # Scene content
│   │   ├── emotional-arc-diagram.tsx       # Visx emotional arc chart
│   │   ├── chapter-flow-editor.tsx         # React Flow node editor
│   │   ├── animated-character-avatar.tsx   # react-spring animation
│   │   ├── db-change-viewer.tsx            # Database changes
│   │   └── empty-state.tsx                 # No artifact selected
│   │
│   ├── chat/
│   │   ├── agent-chat.tsx                  # Right panel chat
│   │   ├── agent-message.tsx               # Message component
│   │   ├── tool-execution-card.tsx         # Tool visualization
│   │   ├── chat-input.tsx                  # Input with @-mentions
│   │   ├── context-mention.tsx             # @-mention autocomplete
│   │   └── suggested-actions.tsx           # Action chips
│   │
│   └── shared/
│       ├── loading-skeleton.tsx            # Loading states
│       ├── error-boundary.tsx              # Error handling
│       └── image-with-placeholder.tsx      # Lazy image loading
│
├── hooks/
│   ├── use-studio-layout.ts               # Panel state management
│   ├── use-artifact-viewer.ts             # Artifact routing
│   ├── use-context-mentions.ts            # @-mention logic
│   └── use-tool-execution.ts              # Tool status tracking
│
└── lib/studio/
    ├── artifact-types.ts                   # TypeScript types
    ├── tree-builder.ts                     # Build tree from DB data
    └── context-manager.ts                  # Context resolution
```

### 6.3 Performance Optimization

**Critical Performance Metrics**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Panel resize: 60fps
- Message send to first token: < 2s

**Optimization Strategies**:

1. **Virtual Scrolling**:
   ```typescript
   // Use react-virtual for story tree
   import { useVirtual } from '@tanstack/react-virtual';

   const rowVirtualizer = useVirtual({
     size: storyNodes.length,
     parentRef: treeContainerRef,
     estimateSize: () => 32, // 32px per row
     overscan: 5, // Render 5 extra items
   });
   ```

2. **Code Splitting**:
   ```typescript
   // Lazy load artifact components
   const CharacterCard = lazy(() => import('./character-card'));
   const ArcDiagram = lazy(() => import('./arc-diagram'));
   ```

3. **Image Optimization**:
   ```typescript
   // Use Next.js Image with blur placeholders
   <Image
     src={character.imageUrl}
     width={1344}
     height={768}
     placeholder="blur"
     blurDataURL={character.imageVariants.placeholder}
     loading="lazy"
   />
   ```

4. **Debounced Resize**:
   ```typescript
   // Debounce panel resize events
   const debouncedResize = useMemo(
     () => debounce((width) => updatePanelWidth(width), 100),
     []
   );
   ```

---

## Part VII: Accessibility

### 7.1 Keyboard Navigation

**Global Shortcuts**:
- `Cmd/Ctrl + K` → Focus chat input
- `Cmd/Ctrl + B` → Toggle left panel
- `Cmd/Ctrl + \` → Toggle right panel
- `Cmd/Ctrl + 1-9` → Jump to phase 1-9
- `Escape` → Close modals/popovers

**Tree Navigation**:
- `Arrow Up/Down` → Navigate tree nodes
- `Arrow Right` → Expand node
- `Arrow Left` → Collapse node
- `Enter` → Select node
- `Space` → Toggle checkbox (if applicable)

**Chat Input**:
- `Tab` → Autocomplete @-mention
- `Enter` → Send message
- `Shift + Enter` → New line
- `Cmd/Ctrl + Z` → Undo

### 7.2 ARIA Labels

**Example**:
```jsx
<button
  aria-label="Regenerate character profile"
  aria-describedby="regen-tooltip"
  onClick={handleRegenerate}
>
  <RefreshIcon />
</button>

<div id="regen-tooltip" role="tooltip" className="sr-only">
  Click to regenerate this character using AI. Previous version will be saved.
</div>
```

### 7.3 Screen Reader Support

**Announce Tool Execution**:
```jsx
<div role="status" aria-live="polite" aria-atomic="true">
  {toolStatus === 'loading' && 'Generating character profile...'}
  {toolStatus === 'success' && 'Character profile generated successfully'}
  {toolStatus === 'error' && 'Failed to generate character. Please retry.'}
</div>
```

---

## Part VIII: Future Enhancements

### 8.1 Advanced Features (Post-MVP)

**Multi-Tab Artifacts**:
- View multiple artifacts side-by-side
- Tab system in center panel
- Compare characters, settings, scenes

**Collaborative Editing**:
- Real-time cursors in tree/chat
- Live presence indicators
- Shared chat sessions

**Voice Input**:
- Speech-to-text for chat input
- Voice commands ("Generate characters", "Show Scene 3")

### 8.2 Export & Publishing

**Export Options**:
- Download story as PDF
- Export to EPUB/MOBI
- Copy markdown
- Share link to read-only view

**Publishing Workflow**:
- Preview in reader mode
- Publish to community
- Schedule publication
- Version control (Git-like)

---

## Part IX: Advanced Narrative Visualizations

### 9.1 The Adversity-Triumph Engine Visualization Framework

The Studio Agent implements two complementary visualization approaches for the Adversity-Triumph Engine methodology:

**Path A: The Analyzer** - Emotional arc visualization (Visx)
**Path B: The Builder** - Node-based chapter flow editor (React Flow)

Both visualizations target the same 4-phase narrative cycle:
1. **Adversity Establishment** → Internal flaw meets external obstacle
2. **Virtuous Action** → Intrinsically motivated moral choice (triggers moral elevation)
3. **Unintended Consequence** → Causally-linked "earned luck" (creates Gam-dong)
4. **New Adversity Creation** → Resolution creates next challenge

### 9.2 Path A: Emotional Arc Diagram (The Analyzer)

**Purpose**: Visualize the emotional journey of the story using Kurt Vonnegut's "story shapes" methodology.

**Implementation**: Visx (@visx/xychart, @visx/annotation)

#### Component: `EmotionalArcDiagram`

```typescript
// components/studio/artifacts/emotional-arc-diagram.tsx
import React, { useRef } from 'react';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Annotation, CircleSubject, Connector, HtmlLabel } from '@visx/annotation';
import { AnimatedCharacterAvatar } from './animated-character-avatar';

interface EmotionalArcDiagramProps {
  partId: string;
  scenes: Scene[];
}

export function EmotionalArcDiagram({ partId, scenes }: EmotionalArcDiagramProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const width = 800;
  const height = 400;

  // Map emotionalBeat to numeric value (-10 to +10)
  const mapBeatToValue = (beat: string): number => {
    const mapping = {
      'deep-despair': -10,
      'despair': -7,
      'conflict': -5,
      'tension': -3,
      'neutral': 0,
      'hope': 3,
      'relief': 5,
      'joy': 7,
      'triumph': 10,
    };
    return mapping[beat] || 0;
  };

  // Prepare data
  const data = scenes.map((scene, index) => ({
    x: index,
    y: mapBeatToValue(scene.emotionalBeat),
    scene,
  }));

  // Scales
  const xScale = scalePoint({
    domain: data.map(d => d.x),
    range: [50, width - 50],
  });

  const yScale = scaleLinear({
    domain: [-10, 10],
    range: [height - 50, 50],
  });

  return (
    <div className="relative">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          📊 Emotional Arc: Adversity-Triumph Engine
        </h3>
        <button
          onClick={() => playAnimation()}
          className="btn-primary"
        >
          Play Animation ▶
        </button>
      </div>

      {/* Main SVG Chart */}
      <svg width={width} height={height} className="border rounded-lg bg-surface">
        {/* Axes */}
        <line
          x1={50}
          y1={height - 50}
          x2={width - 50}
          y2={height - 50}
          stroke="#9ca3af"
          strokeWidth={1}
        />
        <line
          x1={50}
          y1={50}
          x2={50}
          y2={height - 50}
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* Zero line */}
        <line
          x1={50}
          y1={yScale(0)}
          x2={width - 50}
          y2={yScale(0)}
          stroke="#e5e7eb"
          strokeDasharray="4,4"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={width / 2} y={height - 10} textAnchor="middle" className="text-xs">
          Timeline (Scenes)
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
          className="text-xs"
        >
          Emotional State
        </text>

        {/* Main line path */}
        <LinePath
          ref={pathRef}
          data={data}
          x={d => xScale(d.x) ?? 0}
          y={d => yScale(d.y)}
          stroke="#3b82f6"
          strokeWidth={3}
          curve="curveCatmullRom"
        />

        {/* Annotations for special phases */}
        {data.map(({ x, y, scene }) => {
          const xPos = xScale(x) ?? 0;
          const yPos = yScale(y);

          // Only annotate virtue and consequence phases
          if (scene.cyclePhase === 'virtue') {
            return (
              <Annotation key={scene.id} x={xPos} y={yPos} dx={40} dy={-40}>
                <Connector type="line" stroke="#f59e0b" />
                <CircleSubject stroke="#f59e0b" radius={6} strokeWidth={2} fill="gold" />
                <HtmlLabel>
                  <div className="annotation-label bg-amber-50 border-amber-400">
                    <strong>⭐ Virtuous Action</strong>
                    <div className="text-xs">{scene.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {scene.summary.slice(0, 60)}...
                    </div>
                  </div>
                </HtmlLabel>
              </Annotation>
            );
          }

          if (scene.cyclePhase === 'consequence') {
            return (
              <Annotation key={scene.id} x={xPos} y={yPos} dx={40} dy={40}>
                <Connector type="line" stroke="#10b981" />
                <CircleSubject stroke="#10b981" radius={6} strokeWidth={2} fill="lightgreen" />
                <HtmlLabel>
                  <div className="annotation-label bg-green-50 border-green-400">
                    <strong>✨ Unintended Consequence (Earned Luck)</strong>
                    <div className="text-xs">{scene.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {scene.summary.slice(0, 60)}...
                    </div>
                  </div>
                </HtmlLabel>
              </Annotation>
            );
          }

          return null;
        })}

        {/* Animated character avatar */}
        <AnimatedCharacterAvatar pathRef={pathRef} width={width} height={height} />
      </svg>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Virtuous Action</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span>Unintended Consequence (Gam-dong)</span>
        </div>
      </div>
    </div>
  );
}
```

#### Key Features:

1. **Emotional Beat Mapping**: Converts scene's `emotionalBeat` property to Y-axis value
2. **Special Phase Annotations**: Highlights `virtue` and `consequence` phases with rich HTML labels
3. **Interactive Tooltips**: Shows scene title and summary on annotation hover
4. **Character Animation**: Animated avatar travels along the emotional path (see 9.4)

### 9.3 Path B: Chapter Flow Editor (The Builder)

**Purpose**: Interactive node-based editor for authoring the 4-phase cycle at the chapter level.

**Implementation**: React Flow (@xyflow/react)

#### Component: `ChapterFlowEditor`

```typescript
// components/studio/artifacts/chapter-flow-editor.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChapterNode } from './chapter-node';

const nodeTypes = {
  chapter: ChapterNode,
};

interface ChapterFlowEditorProps {
  partId: string;
  chapters: Chapter[];
  onUpdate: (chapters: Chapter[]) => void;
}

export function ChapterFlowEditor({ partId, chapters, onUpdate }: ChapterFlowEditorProps) {
  // Convert chapters to React Flow nodes
  const initialNodes: Node[] = chapters.map((chapter, index) => ({
    id: chapter.id,
    type: 'chapter',
    position: { x: index * 350, y: 100 },
    data: {
      chapterNumber: chapter.order,
      adversity: chapter.summary?.adversity || '',
      virtue: chapter.summary?.virtue || '',
      consequence: chapter.summary?.consequence || '',
      newAdversity: chapter.summary?.newAdversity || '',
      onUpdate: (field: string, value: string) => handleNodeUpdate(chapter.id, field, value),
    },
  }));

  // Convert chapter connections to edges
  const initialEdges: Edge[] = chapters
    .filter(chapter => chapter.connectsToPreviousChapter)
    .map(chapter => ({
      id: `edge-${chapter.id}`,
      source: chapters.find(c => c.order === chapter.order - 1)?.id || '',
      target: chapter.id,
      label: 'Creates adversity',
      type: 'smoothstep',
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleNodeUpdate = (chapterId: string, field: string, value: string) => {
    // Update chapter data in parent component
    const updatedChapters = chapters.map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          summary: {
            ...chapter.summary,
            [field]: value,
          },
        };
      }
      return chapter;
    });
    onUpdate(updatedChapters);
  };

  const handleAddChapter = () => {
    // Logic to add new chapter node
    const newOrder = chapters.length + 1;
    const newChapter = {
      id: `chapter_${Date.now()}`,
      order: newOrder,
      title: `Chapter ${newOrder}`,
      summary: {
        adversity: '',
        virtue: '',
        consequence: '',
        newAdversity: '',
      },
    };

    const newNode: Node = {
      id: newChapter.id,
      type: 'chapter',
      position: { x: (newOrder - 1) * 350, y: 100 },
      data: {
        chapterNumber: newOrder,
        adversity: '',
        virtue: '',
        consequence: '',
        newAdversity: '',
        onUpdate: (field: string, value: string) =>
          handleNodeUpdate(newChapter.id, field, value),
      },
    };

    setNodes(nds => [...nds, newNode]);
    onUpdate([...chapters, newChapter]);
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          🎯 Chapter Flow: {partId} (4-Phase Adversity-Triumph Cycle)
        </h3>
        <div className="flex gap-2">
          <button onClick={handleAddChapter} className="btn-secondary">
            + Add Chapter
          </button>
          <button className="btn-secondary">Auto-Layout</button>
          <button className="btn-secondary">Validate Cycles</button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div style={{ height: '600px', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="border rounded-lg"
        >
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-muted-foreground">
        💡 <strong>Tips:</strong> Drag nodes to reorder chapters. Click nodes to edit the 4-phase
        cycle. Connect nodes to link adversity → consequence chains.
      </div>
    </div>
  );
}
```

#### Custom Chapter Node Component

```typescript
// components/studio/artifacts/chapter-node.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function ChapterNode({ data }) {
  return (
    <div className="chapter-node bg-white border-2 border-gray-300 rounded-lg p-4 w-80 shadow-lg">
      {/* Top connection handle */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div className="font-bold mb-3 text-center border-b pb-2">
        Chapter {data.chapterNumber} - Micro-Cycle
      </div>

      {/* 4-Phase Cycle Fields */}
      <div className="space-y-3">
        {/* Phase 1: Adversity */}
        <div>
          <label className="text-xs font-semibold text-red-600">
            1. Adversity (Micro):
          </label>
          <textarea
            defaultValue={data.adversity}
            onChange={(e) => data.onUpdate('adversity', e.target.value)}
            className="nodrag w-full text-xs border rounded p-2 mt-1"
            rows={2}
            placeholder="Internal flaw meets external obstacle..."
          />
        </div>

        {/* Phase 2: Virtue */}
        <div>
          <label className="text-xs font-semibold text-amber-600">
            2. Virtuous Action:
          </label>
          <textarea
            defaultValue={data.virtue}
            onChange={(e) => data.onUpdate('virtue', e.target.value)}
            className="nodrag w-full text-xs border rounded p-2 mt-1"
            rows={2}
            placeholder="Intrinsically motivated moral choice..."
          />
        </div>

        {/* Phase 3: Consequence */}
        <div>
          <label className="text-xs font-semibold text-green-600">
            3. Unintended Consequence (Earned Luck):
          </label>
          <textarea
            defaultValue={data.consequence}
            onChange={(e) => data.onUpdate('consequence', e.target.value)}
            className="nodrag w-full text-xs border rounded p-2 mt-1"
            rows={2}
            placeholder="Causally-linked surprise payoff..."
          />
        </div>

        {/* Phase 4: New Adversity */}
        <div>
          <label className="text-xs font-semibold text-purple-600">
            4. New Adversity (Creates next):
          </label>
          <textarea
            defaultValue={data.newAdversity}
            onChange={(e) => data.onUpdate('newAdversity', e.target.value)}
            className="nodrag w-full text-xs border rounded p-2 mt-1"
            rows={2}
            placeholder="Resolution creates next challenge..."
          />
        </div>
      </div>

      {/* Bottom connection handle */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
```

### 9.4 Character Animation Along Emotional Path

**Purpose**: Animate a character avatar along the SVG path to visualize the story journey.

**Implementation**: react-spring + SVG `getPointAtLength()` API

#### Component: `AnimatedCharacterAvatar`

```typescript
// components/studio/artifacts/animated-character-avatar.tsx
import React, { useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface AnimatedCharacterAvatarProps {
  pathRef: React.RefObject<SVGPathElement>;
  width: number;
  height: number;
}

export function AnimatedCharacterAvatar({ pathRef, width, height }: AnimatedCharacterAvatarProps) {
  const [springs, api] = useSpring(() => ({ progress: 0 }));

  const playAnimation = () => {
    if (!pathRef.current) return;

    api.start({
      from: { progress: 0 },
      to: { progress: 1 },
      config: { duration: 5000, easing: (t) => t }, // Linear easing
    });
  };

  return (
    <>
      {/* Play button (external) */}
      <button
        onClick={playAnimation}
        className="btn-primary"
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        Play Animation ▶
      </button>

      {/* Animated character SVG */}
      <animated.g
        transform={springs.progress.to((progress) => {
          if (!pathRef.current) return 'translate(0, 0)';

          // Get total path length
          const totalLength = pathRef.current.getTotalLength();

          // Get point at current progress
          const point = pathRef.current.getPointAtLength(progress * totalLength);

          // Return transform to position character
          return `translate(${point.x}, ${point.y})`;
        })}
      >
        {/* Character avatar (simple circle with icon) */}
        <circle r={12} fill="#6366f1" opacity={0.9} />
        <text
          textAnchor="middle"
          dy={5}
          fontSize={16}
          fill="white"
        >
          🤖
        </text>
      </animated.g>
    </>
  );
}
```

**How It Works**:

1. **react-spring** animates a `progress` value from 0 to 1 over 5 seconds
2. **`to()` interpolator** runs on every animation frame:
   - Gets total path length: `pathRef.current.getTotalLength()`
   - Calculates current point: `getPointAtLength(progress * totalLength)`
   - Returns SVG transform to position avatar
3. **Result**: Smooth animation of character traveling along emotional arc

### 9.5 Integration with Studio Agent

**How These Visualizations Fit into the 3-Panel Layout**:

1. **Left Panel (Tree Navigator)**:
   - Click "Part I" → Center panel shows **Emotional Arc Diagram**
   - Click "Chapter Flow" → Center panel shows **Chapter Flow Editor**

2. **Center Panel (Artifact Viewer)**:
   - `emotional-arc` artifact type → Renders `<EmotionalArcDiagram />`
   - `chapter-flow` artifact type → Renders `<ChapterFlowEditor />`

3. **Agent Chat (Right Panel)**:
   - Agent can suggest: "Would you like to see the emotional arc for Act I?"
   - Agent can guide: "Let's build the chapter flow together. I'll show you the editor."

**Example Agent Interaction**:

```
🤖 Assistant:
"✅ I've generated all scenes for Part I!

Would you like to visualize the emotional arc?

This will show:
- The adversity-triumph cycle across all chapters
- Annotations for virtuous actions (⭐) and earned luck (✨)
- An animated character traveling the story journey

[Show Emotional Arc] [Continue to Next Part]"
```

User clicks "Show Emotional Arc" → Center panel displays the Visx chart with annotations and animation.

---

## Conclusion

The Studio Agent UI combines the best patterns from modern AI interfaces:
- **Claude's Artifacts** → Dedicated artifact panel for complex content
- **Windsurf's Cascade** → Visual cards for tool execution transparency
- **Code Editor Sidebars** → Flexible panel system with tree navigation

**Key Innovations**:
1. **3-Panel Adaptive Layout** → Organizes navigation, artifacts, and conversation
2. **Tool Execution Transparency** → Every database operation visible as cards
3. **Context-Aware Artifacts** → Show relevant content based on current phase
4. **@-Mention Context** → Easy way to provide context to agent
5. **Phase Progress Tracking** → Visual feedback on 9-phase journey

**Expected User Experience**:
- Writers feel **guided** through the generation process
- All AI operations are **transparent** and explainable
- Story structure is **always visible** in tree navigator
- Generated content is **immediately viewable** in beautiful artifacts
- Database changes are **reviewable** and **reversible**

**Implementation Timeline**: 10 weeks from core layout to production-ready UX

**Next Steps**: Begin with Phase 1 implementation (core layout) and iterate based on user feedback.
