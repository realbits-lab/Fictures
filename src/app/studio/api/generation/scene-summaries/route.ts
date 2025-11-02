import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/novels/ai-client';
import { SCENE_SUMMARIES_PROMPT } from '@/lib/novels/system-prompts';
import type { ChapterGenerationResult, CharacterGenerationResult, SettingGenerationResult, SceneSummaryResult, CyclePhase, EmotionalBeat } from '@/lib/novels/types';

const SCENE_SUMMARIES_EXPANSION_PROMPT = `${SCENE_SUMMARIES_PROMPT}

# BREAKING DOWN CHAPTER CYCLES INTO SCENES

You receive ONE chapter (a complete adversity-triumph micro-cycle). Your task is to break it down into 5-8 scenes that follow the cycle's 5 phases.

# 5-PHASE CYCLE STRUCTURE

## Phase 1: Setup (1-2 scenes)
**Goal**: Establish character state and introduce adversity
- Show character's current emotional/physical state
- Establish setting and context
- Introduce the problem/obstacle
- Emotional Beat: Usually "hope" or "fear" depending on tone

## Phase 2: Confrontation (2-3 scenes)
**Goal**: Escalate adversity through character's flawed response
- Character tries to solve problem using old patterns
- Flaw makes situation WORSE
- External obstacle compounds with internal flaw
- Emotional Beat: "tension" escalating to "despair"

## Phase 3: Virtue (1-2 scenes, LONGEST)
**Goal**: Character makes costly moral choice (EMOTIONAL PEAK)
- Internal struggle (flaw vs values)
- Virtuous action that requires SACRIFICE
- Ceremonial pacing (slow down for moral moment)
- Emotional Beat: "elevation" (moral elevation response)

## Phase 4: Consequence (1-2 scenes)
**Goal**: Show immediate result of virtue
- Usually BITTERSWEET (win + loss)
- External outcome (what changed in world)
- Internal outcome (character's state)
- Emotional Beat: "catharsis" or "relief" mixed with loss

## Phase 5: Transition (1 scene)
**Goal**: Bridge to next chapter's adversity
- Brief scene establishing new normal
- Seed next adversity
- Character can't return to previous state
- Emotional Beat: "hope" or "tension" depending on what's coming

# SCENE SPECIFICATIONS

For EACH scene:

## Title
Brief, evocative scene title (2-5 words)

## Summary
2-3 sentences describing what happens in this scene
- Who is present
- What action occurs
- What emotion/revelation emerges

## Cycle Phase
One of: setup, confrontation, virtue, consequence, transition

## Emotional Beat
One of: fear, hope, tension, relief, elevation, catharsis, despair, joy

## Character Focus
- Array of character IDs present in scene
- First ID is POV/focus character
- Maximum 3-4 characters per scene (avoid crowd scenes)

## Setting Selection
Choose ONE setting from available settings that best fits this scene:
- Consider the cycle phase (setup, confrontation, virtue, consequence, transition)
- Use setting's cycleAmplification to match emotional needs
- Settings can be reused across scenes, but aim for variety
- Physical setting should match the action (confined space for confrontation, open space for freedom, etc.)

## Sensory Anchors
3-5 specific sensory details that ground the scene:
- Draw from the selected setting's sensory palette
- Sight: Specific visual (not generic)
- Sound: Distinctive audio element
- Smell: Evocative scent
- Touch: Physical sensation
- Taste: If relevant

Example: ["Flickering fluorescent light casting green tinge", "Drip-drip-drip of leak echoing", "Smell of mildew and old coffee", "Cold metal chair biting through jeans"]

## Dialogue vs Description Balance
- **dialogue-heavy**: 60%+ dialogue (confrontation scenes, character conflict)
- **balanced**: 40-60% dialogue (most scenes)
- **description-heavy**: 20-40% dialogue (setup, virtue, introspection)

## Suggested Length
- **short**: 400-600 words (transition, brief setup)
- **medium**: 600-800 words (confrontation, consequence)
- **long**: 800-1000 words (virtue scenes, complex confrontations)

# VIRTUE SCENE SPECIAL REQUIREMENTS

Virtue scenes (Phase 3) are THE emotional peak. They require:

### Length
- ALWAYS mark as "long" (800-1000 words minimum)
- These are the MOST IMPORTANT scenes

### Pacing Direction
- "Slow down during virtuous action" → description-heavy
- "Ceremony requires reverence" → less dialogue, more internal
- "Emotional lingering after act" → extended consequence

### Sensory Anchors
- Must include PHYSICAL sensations of moral choice
- Witness elements (who/what observes this act)
- Environmental details that amplify significance

### Emotional Beat
- ALWAYS "elevation" (moral elevation)
- This is reader's peak emotional response

# SCENE DISTRIBUTION

## 5-Scene Chapter (minimum)
1. Setup (1 scene)
2. Confrontation (2 scenes)
3. Virtue (1 scene)
4. Consequence (1 scene)
5. Transition (implicit in consequence)

## 6-Scene Chapter (common)
1. Setup (1 scene)
2. Confrontation (2 scenes)
3. Virtue (1 scene)
4. Consequence (1 scene)
5. Transition (1 scene)

## 7-Scene Chapter (complex)
1. Setup (2 scenes)
2. Confrontation (3 scenes)
3. Virtue (1 scene)
4. Consequence (1 scene)
5. Transition (implicit)

## 8-Scene Chapter (rare, epic)
1. Setup (2 scenes)
2. Confrontation (3 scenes)
3. Virtue (2 scenes - extended moral moment)
4. Consequence (1 scene)
5. Transition (implicit)

# OUTPUT FORMAT

Return structured text with clear scene separations:

\`\`\`
# SCENE 1: [Title]

## Summary
[2-3 sentence scene summary]

## Setting
[Setting Name from available settings]

## Cycle Phase
setup

## Emotional Beat
hope

## Character Focus
- [Character Name] (POV)
- [Character Name] (present)
- [Character Name] (present)

## Sensory Anchors
- [Specific sight detail]
- [Specific sound detail]
- [Specific smell detail]
- [Specific touch detail]

## Dialogue vs Description
balanced

## Suggested Length
medium

---

# SCENE 2: [Title]
[Repeat structure]

---

# SCENE 3: [Title]
[Repeat structure]

---

[Continue for all 5-8 scenes]

\`\`\`

# CRITICAL RULES
1. Generate 5-8 scenes total (not fewer, not more)
2. MUST have exactly ONE virtue scene (Phase 3)
3. Virtue scene MUST be marked "long" length
4. Virtue scene MUST have "elevation" emotional beat
5. Cycle phases must follow order: setup → confrontation → virtue → consequence → transition
6. Emotional beats must ESCALATE tension before virtue, then RELEASE after
7. Character focus should stay consistent per scene (don't jump POVs mid-scene)
8. Each scene MUST specify a setting from available settings (use exact setting name)
9. Settings should MATCH cycle phase needs (use cycleAmplification guidance)
10. Sensory anchors must be SPECIFIC not generic ("metallic blood taste" not "bad taste")
11. Sensory anchors should DRAW from selected setting's sensory palette
12. Confrontation phase needs 2-3 scenes minimum (most of the action)
13. Each scene summary should clearly state WHAT HAPPENS (action not theme)

# OUTPUT
Return ONLY the structured text, no JSON, no markdown code blocks.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      chapter: ChapterGenerationResult;
      characters: CharacterGenerationResult[];
      settings: SettingGenerationResult[];
      scenesPerChapter?: number;
    };
    const { chapter, characters, settings, scenesPerChapter = 6 } = body;

    if (!chapter || !characters || !settings) {
      return NextResponse.json(
        { error: 'Chapter, characters, and settings are required' },
        { status: 400 }
      );
    }

    // Build context for scene generation
    const charactersSection = chapter.focusCharacters.map((charId) => {
      const char = characters.find(c => c.id === charId);
      if (!char) return '';
      return `## ${char.name}
- Core Trait: ${char.coreTrait}
- Internal Flaw: ${char.internalFlaw}
- Voice: ${char.voiceStyle.tone}, ${char.voiceStyle.vocabulary}
- Emotional Range: ${char.voiceStyle.emotionalRange}`;
    }).join('\n\n');

    const settingsSection = settings.map((setting) => {
      return `## ${setting.name}
${setting.description.substring(0, 300)}...

**Adversity Elements**:
- Physical: ${setting.adversityElements.physicalObstacles.join(', ')}
- Dangers: ${setting.adversityElements.dangerSources.join(', ')}

**Cycle Amplification for Virtue Phase**: ${setting.cycleAmplification.virtue}

**Sensory Palette**:
- Sight: ${setting.sensory.sight.slice(0, 2).join(', ')}
- Sound: ${setting.sensory.sound.slice(0, 2).join(', ')}
- Smell: ${setting.sensory.smell.slice(0, 2).join(', ')}`;
    }).join('\n\n');

    const seedsResolveSection = chapter.seedsResolved.length > 0
      ? chapter.seedsResolved.map((seed) => `- **${seed.seedId}**: ${seed.payoffDescription}`).join('\n')
      : 'No seeds to resolve in this chapter';

    const seedsPlantSection = chapter.seedsPlanted.length > 0
      ? chapter.seedsPlanted.map((seed) => `- **${seed.id}**: ${seed.description} (will pay off: ${seed.expectedPayoff})`).join('\n')
      : 'No new seeds to plant in this chapter';

    const scenesContext = `
# CHAPTER CONTEXT
Title: ${chapter.title}
Summary: ${chapter.summary}

**Adversity Type**: ${chapter.adversityType}
**Virtue Type**: ${chapter.virtueType}
**Arc Position**: ${chapter.arcPosition}

**Macro Arc Contribution**: ${chapter.contributesToMacroArc}

**Causal Links**:
- Connects to previous: ${chapter.connectsToPreviousChapter}
- Creates next adversity: ${chapter.createsNextAdversity}

# CHARACTERS IN THIS CHAPTER
${charactersSection}

# AVAILABLE SETTINGS
${settingsSection}

# SEEDS TO RESOLVE (if any)
${seedsResolveSection}

# SEEDS TO PLANT (if any)
${seedsPlantSection}

# YOUR TASK
Break this chapter's adversity-triumph cycle into EXACTLY ${scenesPerChapter} scenes following the 5-phase structure.

IMPORTANT: Generate exactly ${scenesPerChapter} scenes, no more, no less.

Remember:
1. Phase 3 (Virtue) is THE emotional peak - make it the longest scene
2. Use sensory details from settings to ground scenes
3. Character voices should be distinct (use voice style info)
4. Resolve any seeds that should pay off in this chapter
5. Plant any seeds that should set up future payoffs
${scenesPerChapter < 5 ? `6. Since you have only ${scenesPerChapter} scenes, compress phases efficiently while maintaining the virtue peak` : ''}

Generate ${scenesPerChapter} scene summaries following the output format.
`;

    const result = await generateWithGemini({
      prompt: scenesContext,
      systemPrompt: SCENE_SUMMARIES_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Parse structured text into scenes array
    const scenes = parseScenesFromText(result, characters, settings);

    return NextResponse.json(scenes);
  } catch (error) {
    console.error('Scene summaries generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate scene summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function parseScenesFromText(
  text: string,
  characters: CharacterGenerationResult[],
  settings: SettingGenerationResult[]
): SceneSummaryResult[] {
  const scenes: SceneSummaryResult[] = [];

  // Split by scene headers
  const sceneSections = text.split(/# SCENE \d+:/);

  // Process each scene (skip first empty split)
  for (let i = 1; i < sceneSections.length; i++) {
    const sceneSection = sceneSections[i];

    // Extract title
    const titleMatch = sceneSection.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Scene ${i}`;

    // Extract summary
    const summaryMatch = sceneSection.match(/## Summary\s*\n([^\n#]+(?:\n[^\n#]+)*)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract setting
    const settingMatch = sceneSection.match(/## Setting\s*\n([^\n]+)/);
    const settingName = settingMatch ? settingMatch[1].trim() : null;

    // Map setting name to ID
    const setting = settings.find(s => s.name === settingName);
    const settingId = setting?.id || undefined;

    // Extract cycle phase
    const cyclePhaseMatch = sceneSection.match(/## Cycle Phase\s*\n([^\n]+)/);
    const cyclePhase = cyclePhaseMatch ? cyclePhaseMatch[1].trim() as CyclePhase : 'setup';

    // Extract emotional beat
    const emotionalBeatMatch = sceneSection.match(/## Emotional Beat\s*\n([^\n]+)/);
    const emotionalBeat = emotionalBeatMatch ? emotionalBeatMatch[1].trim() as EmotionalBeat : 'tension';

    // Extract character focus
    const characterFocusSection = sceneSection.match(/## Character Focus\s*\n((?:- [^\n]+\n?)+)/);
    const characterFocus = [];
    if (characterFocusSection) {
      const lines = characterFocusSection[1].split('\n');
      for (const line of lines) {
        const charMatch = line.match(/- ([^(]+)/);
        if (charMatch) {
          const charName = charMatch[1].trim();
          const char = characters.find(c => c.name === charName);
          if (char) characterFocus.push(char.id);
        }
      }
    }

    // Extract sensory anchors
    const sensoryAnchorsSection = sceneSection.match(/## Sensory Anchors\s*\n((?:- [^\n]+\n?)+)/);
    const sensoryAnchors = [];
    if (sensoryAnchorsSection) {
      const lines = sensoryAnchorsSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/- (.+)/);
        if (match) sensoryAnchors.push(match[1].trim());
      }
    }

    // Extract dialogue vs description
    const dialogueVsDescriptionMatch = sceneSection.match(/## Dialogue vs Description\s*\n([^\n]+)/);
    const dialogueVsDescription = dialogueVsDescriptionMatch
      ? dialogueVsDescriptionMatch[1].trim() as 'dialogue-heavy' | 'balanced' | 'description-heavy'
      : 'balanced';

    // Extract suggested length
    const suggestedLengthMatch = sceneSection.match(/## Suggested Length\s*\n([^\n]+)/);
    const suggestedLength = suggestedLengthMatch
      ? suggestedLengthMatch[1].trim() as 'short' | 'medium' | 'long'
      : 'medium';

    scenes.push({
      title,
      summary,
      cyclePhase,
      emotionalBeat,
      characterFocus,
      settingId,
      sensoryAnchors,
      dialogueVsDescription,
      suggestedLength,
    });
  }

  return scenes;
}
