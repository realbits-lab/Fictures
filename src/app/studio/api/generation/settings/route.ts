import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/novels/ai-client';
import { SETTINGS_GENERATION_PROMPT } from '@/lib/novels/system-prompts';
import type { StorySummaryResult, SettingGenerationResult } from '@/lib/novels/types';

const SETTINGS_EXPANSION_PROMPT = `${SETTINGS_GENERATION_PROMPT}

# INPUT
You receive story summary with genre, tone, and moral framework.

# SETTING DESIGN PRINCIPLES

Settings are NOT just backdrops - they are:
1. **Adversity Generators**: Physical/social obstacles that create external conflict
2. **Emotional Amplifiers**: Environments that intensify cycle phases
3. **Symbolic Mirrors**: Physical manifestations of internal character states

# SETTING REQUIREMENTS

## Core Description
Write 2-3 paragraph description covering:
- Physical layout and key features
- Atmosphere and sensory experience
- Social dynamics and power structures
- What makes this place DIFFICULT (scarcity, danger, isolation)

## Adversity Elements
Identify specific obstacles this setting creates:

### physicalObstacles
- Terrain challenges (mountains, rivers, confined spaces)
- Environmental hazards (weather, decay, darkness)
- Resource limitations (food, water, tools, shelter)

### scarcityFactors
- What is LIMITED in this environment?
- What must characters COMPETE for?
- What creates SURVIVAL pressure?

### dangerSources
- Physical threats (predators, collapse, poison)
- Social threats (surveillance, persecution, violence)
- Psychological threats (isolation, claustrophobia, paranoia)

### socialDynamics
- Power hierarchies (who controls what)
- Cultural norms that create conflict
- Group tensions (factions, classes, outsiders)

## Symbolic Meaning
1-2 sentences: What does this setting REPRESENT thematically?
- How does it mirror the moral framework?
- What internal struggle does it externalize?

## Cycle Amplification
For EACH adversity-triumph cycle phase, describe how setting intensifies emotion:

### setup
- Setting details that establish normalcy or foreshadow trouble
- Environmental cues that create unease or comfort
- How space reflects character's initial state

### confrontation
- Physical features that make conflict HARDER
- Environmental pressure that escalates tension
- Setting details that trap or expose characters

### virtue
- Features that make virtuous action MORE COSTLY
- Environmental witnesses (nature, architecture, people)
- Space that amplifies moral significance

### consequence
- How setting CHANGES after virtue (literal or perceptual)
- Environmental response to action (weather, light, atmosphere)
- Details that reflect new emotional state

### transition
- Features that suggest forward movement or stasis
- Environmental hints of next adversity
- Setting details that close one cycle and open next

## Sensory Palette
For EACH sense, provide 3-5 specific details:

### sight
- Colors, light quality, shadows
- Shapes, textures, patterns
- Movement, stillness, contrast

### sound
- Ambient noise (wind, water, machinery)
- Organic sounds (animals, people, breathing)
- Silence types (tense, peaceful, eerie)

### smell
- Natural scents (earth, plants, water)
- Man-made odors (food, fuel, decay)
- Emotional associations (comfort, disgust, memory)

### touch
- Temperature (heat, cold, humidity)
- Textures (rough, smooth, sticky)
- Physical sensations (wind, pressure, pain)

### taste
- Air quality (dust, salt, smoke)
- Food/drink if relevant
- Metaphorical tastes (bitter, sweet)

## Visual Style (for image generation)
- **architecturalStyle**: Brief description of structural aesthetic (if applicable)
- **visualStyle**: Overall art direction (cinematic, painterly, realistic)
- **visualReferences**: 2-3 reference styles or artists
- **colorPalette**: 4-6 hex colors that define the setting's mood

# SETTING TYPES TO CONSIDER

## Confined Spaces (Intensity Amplifiers)
- Prisons, ships, bunkers, caves
- Forces character proximity
- Creates claustrophobic tension
- Makes virtue MORE significant (no escape)

## Scarcity Environments (Resource Pressure)
- Deserts, wastelands, sieges
- Competition for survival
- Moral tests through deprivation
- Value of sharing/sacrifice amplified

## Hostile Nature (External Adversity)
- Storms, mountains, oceans, jungles
- Nature as antagonist
- Survival requires cooperation
- Virtue against overwhelming odds

## Social Hierarchies (Power Dynamics)
- Courts, schools, workplaces, armies
- Status competition
- Virtue requires challenging authority
- Consequence affects social position

## Liminal Spaces (Transformation Zones)
- Borders, thresholds, crossroads
- Between-states (dawn, dusk)
- Transformation possible
- Symbolic of internal change

# OUTPUT FORMAT
Return JSON array of 2-3 primary settings:

\`\`\`json
[
  {
    "id": "setting_[random_id]",
    "name": "[Setting name]",
    "description": "[2-3 paragraph description]",
    "adversityElements": {
      "physicalObstacles": ["obstacle1", "obstacle2", "obstacle3"],
      "scarcityFactors": ["scarcity1", "scarcity2"],
      "dangerSources": ["danger1", "danger2", "danger3"],
      "socialDynamics": ["dynamic1", "dynamic2"]
    },
    "symbolicMeaning": "[What this setting represents thematically]",
    "cycleAmplification": {
      "setup": "[How setting establishes phase]",
      "confrontation": "[How setting escalates conflict]",
      "virtue": "[How setting amplifies moral moment]",
      "consequence": "[How setting reflects change]",
      "transition": "[How setting suggests next cycle]"
    },
    "mood": "[Overall emotional atmosphere]",
    "emotionalResonance": "[Primary emotion this setting evokes]",
    "sensory": {
      "sight": ["detail1", "detail2", "detail3"],
      "sound": ["detail1", "detail2", "detail3"],
      "smell": ["detail1", "detail2"],
      "touch": ["detail1", "detail2"],
      "taste": ["detail1"]
    },
    "architecturalStyle": "[Structural aesthetic if applicable]",
    "visualStyle": "[Art direction for image generation]",
    "visualReferences": ["reference1", "reference2"],
    "colorPalette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4"]
  }
]
\`\`\`

# CRITICAL RULES
1. Create 2-3 PRIMARY settings (not every location)
2. Each setting must create DIFFERENT types of adversity
3. Settings should CONTRAST with each other (confined vs open, safe vs dangerous)
4. Adversity elements must be SPECIFIC and ACTIONABLE for scene writing
5. Cycle amplification must show HOW setting affects EACH phase specifically
6. Sensory details must be CONCRETE not abstract ("rust and wet stone" not "old")
7. Visual style must be BRIEF (for image generation prompt)
8. Color palette must use actual hex codes

# OUTPUT
Return ONLY the JSON array, no markdown formatting, no explanations.`;

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏛️  [SETTINGS API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await request.json() as { storySummary: StorySummaryResult };
    const { storySummary } = body;

    console.log('[SETTINGS API] Request summary:', {
      hasStorySummary: !!storySummary,
      genre: storySummary?.genre,
      tone: storySummary?.tone,
      characterCount: storySummary?.characters?.length || 0,
    });

    if (!storySummary) {
      console.error('❌ [SETTINGS API] Validation failed: Story summary is missing');
      return NextResponse.json(
        { error: 'Story summary is required' },
        { status: 400 }
      );
    }

    console.log('✅ [SETTINGS API] Validation passed');

    // Build context for settings generation
    const settingsContext = `
# STORY CONTEXT
Summary: ${storySummary.summary}
Genre: ${storySummary.genre}
Tone: ${storySummary.tone}

# MORAL FRAMEWORK
${storySummary.moralFramework}

# CHARACTERS (for understanding who will use these settings)
${storySummary.characters.map((char, idx) => `
${idx + 1}. ${char.name}
   - Core Trait: ${char.coreTrait}
   - Internal Flaw: ${char.internalFlaw}
   - External Goal: ${char.externalGoal}
`).join('\n')}

Create 2-3 primary settings that will:
1. Generate external adversity for these characters
2. Amplify the moral tests in the framework
3. Create distinct emotional atmospheres for different story phases
`;

    console.log('[SETTINGS API] 🤖 Calling AI generation...');
    console.log('[SETTINGS API] Model: gemini-2.5-flash-lite');
    console.log('[SETTINGS API] Temperature: 0.8');

    const result = await generateJSON<SettingGenerationResult[]>({
      prompt: settingsContext,
      systemPrompt: SETTINGS_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.8,
    });

    console.log('[SETTINGS API] ✅ AI generation completed');
    console.log('[SETTINGS API] Result summary:', {
      isArray: Array.isArray(result),
      count: Array.isArray(result) ? result.length : 0,
      settingNames: Array.isArray(result) ? result.map(s => s.name).join(', ') : '(invalid)',
    });

    // Validate result
    if (!Array.isArray(result) || result.length < 2 || result.length > 3) {
      console.error('❌ [SETTINGS API] Validation failed: should return 2-3 settings');
      throw new Error('Invalid settings generation result: should return 2-3 settings');
    }

    // Validate each setting has required fields
    for (const setting of result) {
      if (!setting.id || !setting.name || !setting.description) {
        throw new Error(`Invalid setting data for ${setting.name}: missing basic fields`);
      }
      if (!setting.adversityElements || !setting.cycleAmplification || !setting.sensory) {
        throw new Error(`Invalid setting data for ${setting.name}: missing required structures`);
      }
      // Validate adversity elements
      const { adversityElements } = setting;
      if (!adversityElements.physicalObstacles?.length || !adversityElements.dangerSources?.length) {
        throw new Error(`Invalid setting data for ${setting.name}: missing adversity elements`);
      }
      // Validate cycle amplification has all phases
      const { cycleAmplification } = setting;
      const requiredPhases = ['setup', 'confrontation', 'virtue', 'consequence', 'transition'];
      for (const phase of requiredPhases) {
        if (!cycleAmplification[phase as keyof typeof cycleAmplification]) {
          throw new Error(`Invalid setting data for ${setting.name}: missing ${phase} in cycle amplification`);
        }
      }
      // Validate sensory details
      const { sensory } = setting;
      if (!sensory.sight?.length || !sensory.sound?.length) {
        throw new Error(`Invalid setting data for ${setting.name}: missing sensory details`);
      }
    }

    console.log('✅ [SETTINGS API] All validations passed, returning result');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
