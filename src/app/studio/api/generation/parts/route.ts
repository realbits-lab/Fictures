import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/novels/ai-client';
import { PARTS_GENERATION_PROMPT } from '@/lib/novels/system-prompts';
import type { StorySummaryResult, CharacterGenerationResult, PartGenerationResult } from '@/lib/novels/types';

const PARTS_EXPANSION_PROMPT = `${PARTS_GENERATION_PROMPT}

# THREE-ACT STRUCTURE WITH MACRO ARCS

You will design the MACRO adversity-triumph arcs that span entire acts. These are NOT individual chapters - each MACRO arc will be decomposed into 2-4 chapter-level micro-cycles later.

# ACT STRUCTURE

## Act 1: Setup & First Trials (25% of story)
**Narrative Function**: Establish world, introduce characters, reveal moral framework
**Character Arc Pattern**: "Hero refuses the call but is forced into it"
- MACRO Adversity (Internal): Character's flaw is TESTED by inciting incident
- MACRO Adversity (External): External problem that character cannot avoid
- MACRO Virtue: Small act that shows character CAN change (but doesn't yet)
- MACRO Consequence: Temporary success, but reveals DEEPER problem
- MACRO New Adversity: Real challenge emerges (transition to Act 2)

**Expected Duration**: 2-3 chapters per main character (3-6 chapters total)

## Act 2: Escalation & Dark Night (50% of story)
**Narrative Function**: Complicate world, escalate stakes, test characters repeatedly
**Character Arc Pattern**: "Hero tries old ways and fails, then hits rock bottom"

### Act 2A: Rising Action (25%)
- MACRO Adversity: Character tries to solve problem using FLAWED approach
- MACRO Virtue: Acts that SEEM virtuous but are tainted by flaw
- MACRO Consequence: Partial wins that don't solve core problem
- MACRO New Adversity: Complications from flawed approach

### Act 2B: Dark Night (25%)
- MACRO Adversity: Everything collapses, flaw fully exposed
- MACRO Virtue: Character faces choice - change or be destroyed
- MACRO Consequence: Loss, but also CLARITY about what must change
- MACRO New Adversity: Final challenge emerges (transition to Act 3)

**Expected Duration**: 4-6 chapters per arc (8-12 chapters total)

## Act 3: Climax & Resolution (25% of story)
**Narrative Function**: Resolve conflicts, demonstrate character transformation
**Character Arc Pattern**: "Hero acts from healed state and succeeds"
- MACRO Adversity: Final external obstacle + internal flaw's last stand
- MACRO Virtue: Character acts from TRANSFORMED state (flaw healed)
- MACRO Consequence: External problem solved BECAUSE internal change happened
- MACRO New Adversity: New normal, suggesting future beyond story

**Expected Duration**: 2-3 chapters per main character (3-6 chapters total)

# MACRO ARC DESIGN

For EACH main character, design their three-act MACRO arc:

## Character Identification
- **characterId**: Reference to character from previous generation
- **arcPosition**: "primary" (protagonist) or "secondary" (major supporting)

## Arc 1: Setup & First Trials
**macroAdversity**:
- **internal**: What aspect of their flaw is tested?
- **external**: What external problem forces them to act?

**macroVirtue**: What small virtuous act shows they CAN change (but haven't yet)?

**macroConsequence**: What temporary success hides a deeper problem?

**macroNewAdversity**: What real challenge emerges for Act 2?

**estimatedChapters**: 2-3 chapters

**progressionStrategy**: How will this arc decompose into chapter micro-cycles?

## Arc 2A: Rising Action
(Repeat structure for Act 2A)

## Arc 2B: Dark Night
(Repeat structure for Act 2B)

## Arc 3: Climax & Resolution
(Repeat structure for Act 3)

# CRITICAL PRINCIPLES

## Nested Cycles
- MACRO arc = 2-4 chapter micro-cycles
- Each chapter is ONE complete adversity-triumph cycle
- MACRO consequence becomes NEXT chapter's adversity
- Character progresses through LEARNING not sudden transformation

## Arc Interweaving
- Main character arcs should INTERSECT at key moments
- Secondary character arcs should SUPPORT main character tests
- Adversities should be CONNECTED (A's consequence creates B's adversity)
- Virtues should COMPOUND (A's sacrifice enables B's courage)

## Moral Framework Integration
- Each MACRO arc must test the story's moral framework
- Virtues should align with established values
- Consequences should follow moral logic (not arbitrary)
- Dark Night should be EARNED through accumulated failures

## Estimated Chapters
- Act 1: 3-6 chapters total (2-3 per main character)
- Act 2: 8-12 chapters total (4-6 per MACRO arc section)
- Act 3: 3-6 chapters total (2-3 per main character)
- **Total**: 14-24 chapters for complete story

# OUTPUT FORMAT

Return structured text with clear sections:

\`\`\`
# ACT 1: [Title]

## Summary
[2-3 sentence act summary]

## [Character Name] - Primary Arc

### MACRO Adversity
Internal: [Internal flaw being tested]
External: [External problem forcing action]

### MACRO Virtue
[Small virtuous act showing potential]

### MACRO Consequence
[Temporary success hiding deeper problem]

### MACRO New Adversity
[Real challenge emerging for Act 2]

### Estimated Chapters
[2-3 chapters]

### Progression Strategy
[How this MACRO arc decomposes into micro-cycles]

---

## [Character Name] - Secondary Arc
[Repeat structure]

---

# ACT 2: [Title]

## Summary
[2-3 sentence act summary]

## Part 2A: Rising Action

### [Character Name] - Primary Arc
[Repeat MACRO arc structure]

---

## Part 2B: Dark Night

### [Character Name] - Primary Arc
[Repeat MACRO arc structure]

---

# ACT 3: [Title]

## Summary
[2-3 sentence act summary]

## [Character Name] - Primary Arc
[Repeat MACRO arc structure]

---

# TOTAL ESTIMATED CHAPTERS: [14-24]
\`\`\`

# CRITICAL RULES
1. Each MACRO arc is 2-4 chapters (will decompose into micro-cycles later)
2. Internal adversity must be SPECIFIC flaw manifestation (not vague)
3. External adversity must FORCE character to act (not optional)
4. Virtue must be COSTLY (sacrifice, risk, discomfort)
5. Consequence must be BITTERSWEET (win something, lose something)
6. New adversity must CONNECT to previous consequence
7. Dark Night (Act 2B) must be character's LOWEST point
8. Act 3 virtue must show character acting from HEALED state
9. Progression strategy must explain micro-cycle decomposition
10. Total chapter estimate should be 14-24 chapters

# OUTPUT
Return ONLY the structured text, no JSON, no markdown code blocks.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      storySummary: StorySummaryResult;
      characters: CharacterGenerationResult[];
      partsCount?: number;
      chaptersPerPart?: number;
    };
    const { storySummary, characters, partsCount = 3, chaptersPerPart = 3 } = body;

    if (!storySummary || !characters || characters.length < 2) {
      return NextResponse.json(
        { error: 'Story summary and at least 2 characters are required' },
        { status: 400 }
      );
    }

    // Identify main characters
    const mainCharacters = characters.filter(c => c.isMain);
    if (mainCharacters.length === 0) {
      return NextResponse.json(
        { error: 'At least one main character is required' },
        { status: 400 }
      );
    }

    // Build context for part generation
    const partsContext = `
# STORY CONTEXT
Summary: ${storySummary.summary}
Genre: ${storySummary.genre}
Tone: ${storySummary.tone}

# MORAL FRAMEWORK
${storySummary.moralFramework}

# STORY STRUCTURE CONSTRAINTS (MUST FOLLOW EXACTLY)
Parts (Acts): ${partsCount}
Chapters per Part: ${chaptersPerPart}
TOTAL CHAPTERS: ${partsCount * chaptersPerPart}

# CHARACTERS
${characters.map((char) => `
## ${char.name} (${char.isMain ? 'MAIN' : 'Supporting'})
- Core Trait: ${char.coreTrait}
- Internal Flaw: ${char.internalFlaw}
- External Goal: ${char.externalGoal}
- Backstory Summary: ${char.backstory.substring(0, 200)}...
- Key Values: ${char.personality.values.join(', ')}
`).join('\n')}

# YOUR TASK
Design MACRO adversity-triumph arcs for each main character across EXACTLY ${partsCount} part${partsCount > 1 ? 's' : ''} (acts).
Each MACRO arc will later decompose into approximately ${chaptersPerPart} chapters.

${partsCount === 1 ? `
IMPORTANT: Since this is a single-part story, compress the traditional three-act structure into ONE complete arc:
- Setup adversity quickly
- Build to climax efficiently
- Resolve within ${chaptersPerPart} chapters
` : partsCount === 2 ? `
IMPORTANT: For a two-part structure:
- Part 1: Setup and rising action (build adversity)
- Part 2: Climax and resolution (resolve conflict)
` : `
IMPORTANT: For a three-part structure (traditional):
- Part 1 (Act 1): Setup and first trials
- Part 2 (Act 2): Escalation and dark night
- Part 3 (Act 3): Climax and resolution
`}

Generate the ${partsCount}-part structure following the output format. Create EXACTLY ${partsCount} parts with clear adversity-triumph arcs.
`;

    const result = await generateWithGemini({
      prompt: partsContext,
      systemPrompt: PARTS_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Parse structured text into parts array
    const parts = parsePartsFromText(result, characters, partsCount);

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Parts generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate parts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function parsePartsFromText(
  text: string,
  characters: CharacterGenerationResult[],
  partsCount: number
): PartGenerationResult[] {
  const parts: PartGenerationResult[] = [];

  // Split by acts (support both "ACT" and "PART" headers)
  const actSections = text.split(/# (?:ACT|PART) \d+:/);

  // Process each act (skip first empty split)
  for (let actNum = 1; actNum <= partsCount; actNum++) {
    const actSection = actSections[actNum];
    if (!actSection) continue;

    // Extract act title
    const titleMatch = actSection.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Act ${actNum}`;

    // Extract summary
    const summaryMatch = actSection.match(/## Summary\s*\n([^\n#]+)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract character arcs
    const characterArcs = [];

    // For Act 2 in 3-part structure, handle 2A and 2B subsections
    if (actNum === 2 && partsCount === 3) {
      // Split into 2A and 2B
      const [_, part2A, part2B] = actSection.split(/## Part 2[AB]:/);

      if (part2A) {
        const arcs2A = extractCharacterArcs(part2A, characters);
        characterArcs.push(...arcs2A);
      }

      if (part2B) {
        const arcs2B = extractCharacterArcs(part2B, characters);
        characterArcs.push(...arcs2B);
      }
    } else {
      // Single part or other acts
      const arcs = extractCharacterArcs(actSection, characters);
      characterArcs.push(...arcs);
    }

    parts.push({
      orderIndex: actNum - 1, // Convert act number (1-3) to 0-based index (0-2)
      title,
      summary,
      characterArcs,
    });
  }

  return parts;
}

function extractCharacterArcs(
  text: string,
  characters: CharacterGenerationResult[]
): any[] {
  const arcs = [];

  // Find all character arc sections
  const characterSections = text.split(/## ([^#\n]+) - (Primary|Secondary) Arc/);

  for (let i = 1; i < characterSections.length; i += 3) {
    const characterName = characterSections[i].trim();
    const arcPosition = characterSections[i + 1].toLowerCase() as 'primary' | 'secondary';
    const arcContent = characterSections[i + 2];

    // Find character by name
    const character = characters.find(c => c.name === characterName);
    if (!character) continue;

    // Extract arc fields
    const internalMatch = arcContent.match(/Internal:\s*([^\n]+)/);
    const externalMatch = arcContent.match(/External:\s*([^\n]+)/);
    const virtueMatch = arcContent.match(/### MACRO Virtue\s*\n([^\n#]+)/);
    const consequenceMatch = arcContent.match(/### MACRO Consequence\s*\n([^\n#]+)/);
    const newAdversityMatch = arcContent.match(/### MACRO New Adversity\s*\n([^\n#]+)/);
    const chaptersMatch = arcContent.match(/### Estimated Chapters\s*\n([^\n#]+)/);
    const strategyMatch = arcContent.match(/### Progression Strategy\s*\n([^\n#]+)/);

    arcs.push({
      characterId: character.id,
      macroAdversity: {
        internal: internalMatch ? internalMatch[1].trim() : '',
        external: externalMatch ? externalMatch[1].trim() : '',
      },
      macroVirtue: virtueMatch ? virtueMatch[1].trim() : '',
      macroConsequence: consequenceMatch ? consequenceMatch[1].trim() : '',
      macroNewAdversity: newAdversityMatch ? newAdversityMatch[1].trim() : '',
      estimatedChapters: chaptersMatch ? parseInt(chaptersMatch[1].match(/\d+/)?.[0] || '3') : 3,
      arcPosition,
      progressionStrategy: strategyMatch ? strategyMatch[1].trim() : '',
    });
  }

  return arcs;
}
