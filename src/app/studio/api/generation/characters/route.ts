import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/novels/ai-client';
import { CHARACTER_GENERATION_PROMPT } from '@/lib/novels/system-prompts';
import type { StorySummaryResult, CharacterGenerationResult } from '@/lib/novels/types';

const CHARACTER_EXPANSION_PROMPT = `${CHARACTER_GENERATION_PROMPT}

# INPUT
You receive basic character data from story summary generation.

# EXPANSION REQUIREMENTS

## Personality Development
- **traits**: 4-6 personality traits that explain behavior patterns
- **values**: 3-4 core values that drive decisions

## Backstory Crafting
Write 2-3 paragraph backstory that:
- Explains HOW the internal flaw was formed (wound, trauma, false belief)
- Shows what happened to create their core trait
- Establishes relationships with other characters
- Sets up their external goal as logical response to past

## Physical Description
- **age**: Specific age or age range
- **appearance**: Height, build, distinctive features
- **distinctiveFeatures**: What makes them memorable visually
- **style**: Clothing, grooming, presentation choices

## Voice Style Development
- **tone**: Overall speaking manner (formal, casual, sardonic, earnest)
- **vocabulary**: Word choice patterns (technical, simple, poetic, slang)
- **quirks**: 2-3 speech patterns (phrases, filler words, rhythm)
- **emotionalRange**: How they express different emotions

## Relationship Mapping
For EACH other character, define:
- **type**: ally, rival, family, romantic, mentor, adversary
- **jeongLevel**: 0-10 scale of accumulated affective bond
  - 0-2: Strangers or enemies
  - 3-5: Acquaintances or conflicted
  - 6-8: Friends or close family
  - 9-10: Deep bond (정 - jeong)
- **sharedHistory**: What experiences connect them
- **currentDynamic**: Current state of relationship

## Visual Style (for image generation)
Brief description of visual aesthetic for portrait generation:
- Art style direction
- Color palette
- Mood/atmosphere
- Reference style (if any)

# CHARACTER RELATIONSHIPS PRINCIPLES

## Jeong System (정)
Jeong is NOT love or friendship - it's accumulated shared experience creating affective bond:
- Built through repeated interaction (meals, work, conflict, support)
- Can exist between enemies (jeong from years of rivalry)
- Drives loyalty beyond rational choice
- Takes TIME to develop (instant jeong is rare)

## Relationship Dynamics
Characters should have:
- At least ONE high-jeong relationship (6+)
- At least ONE low-jeong relationship (0-2)
- Mix of relationship types (not all allies or all rivals)
- Relationships that will CREATE conflict through opposing values

# OUTPUT FORMAT
Return JSON array with this structure:

\`\`\`json
[
  {
    "id": "char_[random_id]",
    "name": "[Character name]",
    "isMain": true/false,
    "summary": "[One sentence character essence]",
    "coreTrait": "[From input]",
    "internalFlaw": "[From input]",
    "externalGoal": "[From input]",
    "personality": {
      "traits": ["trait1", "trait2", "trait3", "trait4"],
      "values": ["value1", "value2", "value3"]
    },
    "backstory": "[2-3 paragraph backstory explaining flaw formation]",
    "relationships": {
      "char_[other_id]": {
        "type": "ally",
        "jeongLevel": 7,
        "sharedHistory": "[What connects them]",
        "currentDynamic": "[Current state]"
      }
    },
    "physicalDescription": {
      "age": "[Age or range]",
      "appearance": "[Height, build, features]",
      "distinctiveFeatures": "[Memorable details]",
      "style": "[Clothing/grooming choices]"
    },
    "voiceStyle": {
      "tone": "[Speaking manner]",
      "vocabulary": "[Word choice pattern]",
      "quirks": ["quirk1", "quirk2"],
      "emotionalRange": "[How emotions are expressed]"
    },
    "visualStyle": "[Brief aesthetic description for portrait generation]"
  }
]
\`\`\`

# CRITICAL RULES
1. First character in array should be isMain: true
2. ALL characters must have bidirectional relationships (if A → B exists, B → A must exist)
3. Jeong levels should be CONSISTENT (A → B jeongLevel should ≈ B → A jeongLevel, ±1)
4. Internal flaws must be WOUNDS not weaknesses (fear from past trauma, not "is weak")
5. Backstories must CAUSALLY explain the flaw (show the wound being formed)
6. Relationships should create NATURAL conflict (opposing values, goals, or history)
7. Visual styles should be BRIEF (1-2 sentences for image generation prompt)

# OUTPUT
Return ONLY the JSON array, no markdown formatting, no explanations.`;

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 [CHARACTERS API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await request.json() as { storySummary: StorySummaryResult };
    const { storySummary } = body;

    console.log('[CHARACTERS API] Request summary:', {
      hasStorySummary: !!storySummary,
      genre: storySummary?.genre,
      tone: storySummary?.tone,
      characterCount: storySummary?.characters?.length || 0,
      characterNames: storySummary?.characters?.map(c => c.name).join(', ') || '(none)',
    });

    if (!storySummary || !storySummary.characters || storySummary.characters.length < 2) {
      console.error('❌ [CHARACTERS API] Validation failed:', {
        hasStorySummary: !!storySummary,
        hasCharacters: !!storySummary?.characters,
        characterCount: storySummary?.characters?.length || 0,
      });
      return NextResponse.json(
        { error: 'Valid story summary with at least 2 characters is required' },
        { status: 400 }
      );
    }

    console.log('✅ [CHARACTERS API] Validation passed');

    // Build context for character expansion
    const characterContext = `
# STORY CONTEXT
Genre: ${storySummary.genre}
Tone: ${storySummary.tone}
Moral Framework: ${storySummary.moralFramework}

# BASIC CHARACTER DATA
${storySummary.characters.map((char, idx) => `
${idx + 1}. ${char.name}
   - Core Trait: ${char.coreTrait}
   - Internal Flaw: ${char.internalFlaw}
   - External Goal: ${char.externalGoal}
`).join('\n')}

Expand these characters into complete profiles following the requirements.
`;

    console.log('[CHARACTERS API] 🤖 Calling AI generation...');
    console.log('[CHARACTERS API] Model: gemini-2.5-flash-lite');
    console.log('[CHARACTERS API] Temperature: 0.8');

    const result = await generateJSON<CharacterGenerationResult[]>({
      prompt: characterContext,
      systemPrompt: CHARACTER_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.8,
    });

    console.log('[CHARACTERS API] ✅ AI generation completed');
    console.log('[CHARACTERS API] Result summary:', {
      isArray: Array.isArray(result),
      count: Array.isArray(result) ? result.length : 0,
      expectedCount: storySummary.characters.length,
      characterNames: Array.isArray(result) ? result.map(c => c.name).join(', ') : '(invalid)',
    });

    // Validate result
    if (!Array.isArray(result) || result.length !== storySummary.characters.length) {
      console.error('❌ [CHARACTERS API] Validation failed: wrong number of characters');
      throw new Error('Invalid character generation result: wrong number of characters');
    }

    // Validate each character has required fields
    for (const char of result) {
      if (!char.id || !char.name || !char.personality || !char.backstory || !char.relationships) {
        throw new Error(`Invalid character data for ${char.name}: missing required fields`);
      }
    }

    // Validate relationship bidirectionality
    const charIds = result.map(c => c.id);
    for (const char of result) {
      const relatedIds = Object.keys(char.relationships);
      for (const relId of relatedIds) {
        if (!charIds.includes(relId)) {
          throw new Error(`Invalid relationship: ${char.id} references non-existent character ${relId}`);
        }
        // Check if reciprocal relationship exists
        const relatedChar = result.find(c => c.id === relId);
        if (!relatedChar || !relatedChar.relationships[char.id]) {
          throw new Error(`Missing reciprocal relationship: ${relId} → ${char.id}`);
        }
      }
    }

    console.log('✅ [CHARACTERS API] All validations passed, returning result');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Character generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate characters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
