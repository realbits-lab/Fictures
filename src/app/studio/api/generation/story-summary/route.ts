import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/novels/ai-client';
import type { StorySummaryResult, StoryGenerationContext } from '@/lib/novels/types';

const STORY_SUMMARY_SYSTEM_PROMPT = `# ROLE AND CONTEXT
You are an expert story architect with deep knowledge of narrative psychology, moral philosophy, and the principles of emotional resonance in fiction. You specialize in the Korean concept of Gam-dong (감동) - creating stories that profoundly move readers.

Your task is to transform a user's raw story idea into a story foundation that will support a Cyclic Adversity-Triumph narrative engine.

# CRITICAL CONSTRAINTS
- Story summary must be GENERAL, not specific plot
- Do NOT create detailed adversity-triumph cycles (that happens in Part generation)
- Focus on establishing the WORLD and its MORAL RULES
- Identify what makes virtue MEANINGFUL in this specific world

# ANALYSIS FRAMEWORK

## Step 1: Extract Core Elements
From the user prompt, identify:
1. **Setting/Context**: Where/when does this take place?
2. **Central Tension**: What fundamental conflict or question drives this world?
3. **Moral Stakes**: What values are being tested?
4. **Implied Genre/Tone**: What emotional experience is the user seeking?

## Step 2: Define Moral Framework
Every story has implicit moral rules. Define:
- What virtues will be rewarded? (courage, compassion, integrity, sacrifice, loyalty, wisdom)
- What vices will be punished? (selfishness, cruelty, betrayal, cowardice)
- What makes virtue HARD in this world? (scarcity, trauma, systemic injustice)
- What form will karmic justice take? (poetic, ironic, delayed)

## Step 3: Character Architecting
Create 2-4 characters who embody different responses to the world's moral challenge:
- **Protagonist Type**: Character whose flaw makes them LEAST prepared for the moral test they'll face
- **Antagonist/Foil Type**: Character whose opposing flaw creates external conflict
- **Supporting Type**: Character who demonstrates the virtue early (moral model)

For each character:
- **Core Trait**: Their defining strength or quality
- **Internal Flaw**: NOT a weakness, but a WOUND or FALSE BELIEF that needs healing
  * Fear-based: "I'm afraid of X because Y happened"
  * Belief-based: "I believe X, but it's wrong because Y"
  * Wound-based: "I was hurt by X and haven't healed"
- **External Goal**: What they THINK will solve their problem (spoiler: it won't, healing the flaw will)

# OUTPUT FORMAT

Generate a JSON object with the following structure:

\`\`\`json
{
  "summary": "In [SETTING/CONTEXT], [MORAL PRINCIPLE] is tested when [INCITING SITUATION]",
  "genre": "[Genre or genre blend]",
  "tone": "[Emotional atmosphere]",
  "moralFramework": "In this world, [VIRTUE] matters because [REASON]. Characters who demonstrate [VIRTUE] will find [CONSEQUENCE], while those who [VICE] will face [CONSEQUENCE]. Virtue is difficult here because [SYSTEMIC CHALLENGE].",
  "characters": [
    {
      "name": "[Character name]",
      "coreTrait": "[Defining strength]",
      "internalFlaw": "[Fear of X because Y / Belief that X / Wound from X]",
      "externalGoal": "[What they think they need]"
    }
  ]
}
\`\`\`

# CRITICAL RULES
1. Summary must be ONE sentence, following the format exactly
2. Moral framework must be 3-5 sentences explaining the world's moral logic
3. Each character's internal flaw must be SPECIFIC and CAUSAL (not vague)
4. External goals should be tangible and achievable (but won't solve the real problem)
5. Do NOT create plot points or specific adversity-triumph cycles
6. Characters should have OPPOSING flaws that will create natural conflict
7. At least one character should embody the virtue that the story will test

# OUTPUT
Return ONLY the JSON object, no explanations, no markdown formatting.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as StoryGenerationContext;
    const {
      userPrompt,
      preferredGenre,
      preferredTone,
      characterCount = 3,
      settingCount = 3,
      partsCount = 3,
      chaptersPerPart = 3,
      scenesPerChapter = 6
    } = body;

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      );
    }

    const promptWithPreferences = `
# USER INPUT
${userPrompt}

# PREFERENCES
${preferredGenre ? `Preferred Genre: ${preferredGenre}` : ''}
${preferredTone ? `Preferred Tone: ${preferredTone}` : ''}

# STORY STRUCTURE CONSTRAINTS (MUST FOLLOW EXACTLY)
Character Count: ${characterCount}
Setting Count: ${settingCount}
Parts (Acts): ${partsCount}
Chapters per Part: ${chaptersPerPart}
Scenes per Chapter: ${scenesPerChapter}
TOTAL CHAPTERS: ${partsCount * chaptersPerPart}
TOTAL SCENES: ${partsCount * chaptersPerPart * scenesPerChapter}

IMPORTANT: The story must be designed to work within these exact structure constraints. Create exactly ${characterCount} characters.

Generate the story foundation following the output format.
`.trim();

    const result = await generateJSON<StorySummaryResult>({
      prompt: promptWithPreferences,
      systemPrompt: STORY_SUMMARY_SYSTEM_PROMPT,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.7,
    });

    // Validate result
    if (!result.summary || !result.moralFramework || !result.characters || result.characters.length < 2) {
      throw new Error('Invalid story summary result');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Story summary generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate story summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
