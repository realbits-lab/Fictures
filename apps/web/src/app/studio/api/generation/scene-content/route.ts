import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/novels/ai-client';
import { SCENE_CONTENT_PROMPT_V11 } from '@/lib/novels/system-prompts';
import type { SceneSummaryResult, CharacterGenerationResult, SettingGenerationResult, SceneContentResult } from '@/lib/novels/types';

const SCENE_CONTENT_EXPANSION_PROMPT = `${SCENE_CONTENT_PROMPT_V11}

# ADDITIONAL CONTEXT FOR PROSE GENERATION

You will write the full prose narrative for a scene based on its summary and context.

# SCENE CONTEXT USAGE

## Character Voices
Use the character voice style information to ensure each character sounds distinct:
- **tone**: Overall speaking manner (formal, casual, earnest, etc.)
- **vocabulary**: Word choice patterns (technical, simple, poetic, slang)
- **quirks**: Speech patterns, filler words, distinctive phrases
- **emotionalRange**: How this character expresses different emotions

Example:
- Technical character: "The correlation coefficient suggests..."
- Simple character: "Looks like they're connected somehow..."
- Poetic character: "Two threads woven in the same tapestry..."

## Setting Integration
Use setting's sensory palette and adversity elements to ground the scene:
- Incorporate specific sensory details from setting's sensory arrays
- Use physical obstacles to create external pressure
- Leverage symbolic meaning to reinforce emotional tone
- Apply cycle amplification guidance for this cycle phase

## Emotional Beat Execution
Align prose with the scene's emotional beat:
- **fear**: Short sentences, sensory hyperawareness, internal warnings
- **hope**: Longer sentences, upward imagery, possibilities opening
- **tension**: Interrupted thoughts, physical tightness, time pressure
- **relief**: Exhale moments, physical release, slower pace
- **elevation**: Witness perspective, moral clarity, transcendent moment
- **catharsis**: Emotional release, tears, transformation acknowledgment
- **despair**: Fragmented thoughts, sensory shutdown, heaviness
- **joy**: Sensory expansion, laughter, connection moments

# PROSE QUALITY CHECKLIST

Before finalizing, ensure:

## Description Paragraphs
- [ ] NO paragraph exceeds 3 sentences
- [ ] Sensory details are SPECIFIC (not "looked nice" but "polished oak gleaming")
- [ ] Action is CLEAR (readers can visualize)

## Dialogue
- [ ] Each character has DISTINCT voice (vocabulary, rhythm, quirks)
- [ ] Dialogue tags are MINIMAL (prefer action beats)
- [ ] Subtext is present (characters don't say everything directly)

## Spacing
- [ ] Blank line (2 newlines) between description and dialogue blocks
- [ ] Dialogue exchanges are easy to follow visually
- [ ] Paragraphs have breathing room

## Pacing
- [ ] Sentence length VARIES (mix short and long)
- [ ] Action scenes use SHORT sentences
- [ ] Emotional scenes use LONGER, flowing sentences
- [ ] Virtue scenes SLOW DOWN (ceremonial pacing)

## Cycle Phase Alignment
- [ ] Setup: Establishes context without rushing
- [ ] Confrontation: Escalates through action and dialogue
- [ ] Virtue: SLOWS DOWN, emotional lingering, 800-1000 words
- [ ] Consequence: Shows immediate impact, bittersweet tone
- [ ] Transition: Brief, forward-looking, seeds next adversity

# CRITICAL RULES FOR VIRTUE SCENES

If cycle phase is "virtue":

1. **Length**: 800-1000 words MINIMUM (this is THE scene)
2. **Pacing**: SLOW DOWN during the virtuous action
   - Use short sentences or fragments
   - Allow silence and stillness
   - Let reader witness every detail
3. **Emotional Lingering**: 2-3 paragraphs AFTER the virtuous act
   - Show character's internal state post-action
   - Physical sensations (trembling, tears, breath)
   - NO immediate jump to next plot point
4. **Moral Clarity**: Make the virtue VISIBLE and COSTLY
   - What is being sacrificed?
   - What makes this HARD?
   - Why does this MATTER?

# OUTPUT FORMAT

Return ONLY the prose narrative. No metadata, no explanations, no scene titles.

Start directly with the prose:

\`\`\`
[First paragraph of scene prose]

[Dialogue or description continues]

[Continue until scene concludes naturally]
\`\`\`

# LENGTH TARGETS

Based on scene's suggested length:
- **short** (400-600 words): Setup or transition scenes
- **medium** (600-800 words): Most confrontation and consequence scenes
- **long** (800-1000 words): ALL virtue scenes, complex confrontations

# CRITICAL RULES
1. NO metadata or explanations - ONLY prose
2. Description paragraphs MAX 3 sentences
3. Blank line between description and dialogue blocks
4. Character voices must be DISTINCT (use voice style info)
5. Sensory details must be SPECIFIC (use setting sensory palette)
6. Virtue scenes must be 800-1000 words with emotional lingering
7. Cycle phase determines pacing (slow for virtue, fast for confrontation)
8. Emotional beat determines tone (use appropriate sentence structure)
9. Show don't tell (actions reveal emotion, not labels)
10. End scene at natural conclusion (don't drag or cut abruptly)

# OUTPUT
Return ONLY the prose narrative, starting immediately with the first paragraph.`;

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✍️  [SCENE CONTENT API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await request.json() as {
      sceneSummary: SceneSummaryResult;
      characters: CharacterGenerationResult[];
      settings: SettingGenerationResult[];
      chapterContext: {
        title: string;
        summary: string;
        virtueType: string;
      };
      storyContext: {
        genre: string;
        tone: string;
        moralFramework: string;
      };
    };

    const { sceneSummary, characters, settings, chapterContext, storyContext } = body;

    console.log('[SCENE CONTENT API] Request parameters:', {
      hasSceneSummary: !!sceneSummary,
      sceneTitle: sceneSummary?.title,
      cyclePhase: sceneSummary?.cyclePhase,
      suggestedLength: sceneSummary?.suggestedLength,
      charactersCount: characters?.length || 0,
    });

    if (!sceneSummary || !characters || !settings) {
      console.error('❌ [SCENE CONTENT API] Validation failed');
      return NextResponse.json(
        { error: 'Scene summary, characters, and settings are required' },
        { status: 400 }
      );
    }

    console.log('✅ [SCENE CONTENT API] Validation passed');

    // Build rich context for scene content generation
    const charactersSection = sceneSummary.characterFocus.map((charId) => {
      const char = characters.find(c => c.id === charId);
      if (!char) return '';
      return `## ${char.name}
**Core Trait**: ${char.coreTrait}
**Internal Flaw**: ${char.internalFlaw}

**Voice Style**:
- Tone: ${char.voiceStyle.tone}
- Vocabulary: ${char.voiceStyle.vocabulary}
- Quirks: ${char.voiceStyle.quirks.join(', ')}
- Emotional Range: ${char.voiceStyle.emotionalRange}

**Personality**: ${char.personality.traits.join(', ')}
**Values**: ${char.personality.values.join(', ')}

**Physical**: ${char.physicalDescription.appearance}`;
    }).join('\n\n');

    const settingSection = settings.slice(0, 1).map((setting) => {
      const tasteSection = setting.sensory.taste?.length ? `- Taste: ${setting.sensory.taste.join(', ')}` : '';
      return `## ${setting.name}
${((setting as any).summary || (setting as any).description || '').substring(0, 400)}

**Mood**: ${setting.mood}
**Emotional Resonance**: ${setting.emotionalResonance}

**Cycle Amplification (${sceneSummary.cyclePhase})**: ${setting.cycleAmplification[sceneSummary.cyclePhase]}

**Sensory Details**:
- Sight: ${setting.sensory.sight.join(', ')}
- Sound: ${setting.sensory.sound.join(', ')}
- Smell: ${setting.sensory.smell.join(', ')}
- Touch: ${setting.sensory.touch.join(', ')}
${tasteSection}`;
    }).join('\n\n');

    const sensoryAnchorsSection = sceneSummary.sensoryAnchors.map((anchor) => `- ${anchor}`).join('\n');

    const lengthTarget = sceneSummary.suggestedLength === 'short' ? '400-600'
      : sceneSummary.suggestedLength === 'medium' ? '600-800'
      : '800-1000';

    const virtueNote = sceneSummary.cyclePhase === 'virtue'
      ? '⭐ THIS IS A VIRTUE SCENE - 800-1000 words, slow ceremonial pacing, emotional lingering'
      : `Maintain ${sceneSummary.cyclePhase} phase energy`;

    const sceneContentContext = `
# SCENE SPECIFICATION
Title: ${sceneSummary.title}
Summary: ${sceneSummary.summary}

**Cycle Phase**: ${sceneSummary.cyclePhase}
**Emotional Beat**: ${sceneSummary.emotionalBeat}
**Dialogue vs Description**: ${sceneSummary.dialogueVsDescription}
**Suggested Length**: ${sceneSummary.suggestedLength}

# CHAPTER CONTEXT
Title: ${chapterContext.title}
Summary: ${chapterContext.summary}
Virtue Type: ${chapterContext.virtueType}

# STORY CONTEXT
Genre: ${storyContext.genre}
Tone: ${storyContext.tone}
Moral Framework: ${storyContext.moralFramework}

# CHARACTERS IN THIS SCENE
${charactersSection}

# SETTING DETAILS
${settingSection}

# SENSORY ANCHORS FOR THIS SCENE
${sensoryAnchorsSection}

# YOUR TASK
Write the full prose narrative for this scene following the specification above.

Key priorities:
1. ${virtueNote}
2. Emotional beat: ${sceneSummary.emotionalBeat} (adjust sentence structure accordingly)
3. Character voices must be DISTINCT (use voice style info)
4. Ground scene in setting's sensory details
5. ${sceneSummary.suggestedLength} length target (${lengthTarget} words)

Generate the prose following the output format (prose only, no metadata).
`;

    console.log('[SCENE CONTENT API] 🤖 Calling AI generation...');
    console.log('[SCENE CONTENT API] Model: gemini-2.5-flash, MaxTokens: 4096');
    console.log('[SCENE CONTENT API] Temperature: 0.8 (creative prose)');

    const result = await generateWithGemini({
      prompt: sceneContentContext,
      systemPrompt: SCENE_CONTENT_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash',
      temperature: 0.8,
      maxTokens: 4096,
    });

    console.log('[SCENE CONTENT API] ✅ AI generation completed');

    // Determine emotional tone from first paragraph
    const firstParagraph = result.split('\n\n')[0];
    const emotionalTone = sceneSummary.emotionalBeat;

    const response: SceneContentResult = {
      content: result.trim(),
      emotionalTone,
    };

    console.log('[SCENE CONTENT API] Result summary:', {
      contentLength: response.content.length,
      wordCount: response.content.split(/\s+/).length,
      paragraphCount: response.content.split('\n\n').length,
      emotionalTone: response.emotionalTone,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scene content generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate scene content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
