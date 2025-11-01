import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/novels/ai-client';
import { CHAPTERS_GENERATION_PROMPT } from '@/lib/novels/system-prompts';
import type { PartGenerationResult, CharacterGenerationResult, ChapterGenerationResult, VirtueType, ArcPosition } from '@/lib/novels/types';

const CHAPTERS_EXPANSION_PROMPT = `${CHAPTERS_GENERATION_PROMPT}

# DECOMPOSING MACRO ARCS INTO MICRO-CYCLES

You receive ONE MACRO arc from a part (Act section). Your task is to break it down into 2-4 individual chapters, where EACH chapter is ONE complete adversity-triumph cycle.

# MICRO-CYCLE STRUCTURE

Each chapter follows the complete 4-phase cycle:

## Phase 1: Adversity (Setup + Confrontation)
- **Setup**: Establish character's current state post-previous chapter
- **Confrontation**: External obstacle + Internal flaw creates impossible choice

## Phase 2: Virtue
- Character makes COSTLY moral choice aligned with story values
- Choice requires SACRIFICING something (comfort, safety, pride, goal)
- Choice is NOT easy or obvious (internal conflict)

## Phase 3: Consequence
- Immediate result of virtuous action
- Usually BITTERSWEET (win one thing, lose another)
- May look like failure at first

## Phase 4: New Adversity (Transition)
- Consequence creates NEXT chapter's adversity
- Character can't return to previous state
- Forward momentum maintained

# CHAPTER DESIGN REQUIREMENTS

For EACH chapter in the MACRO arc:

## Title
Brief, evocative chapter title (2-5 words)

## Summary
2-3 sentences capturing the chapter's complete cycle

## Character ID
Reference to the character whose arc this chapter advances

## Arc Position
- **beginning**: First chapter of MACRO arc (introduces adversity)
- **middle**: Middle chapters of MACRO arc (escalates and complicates)
- **climax**: Highest tension chapter of MACRO arc (turning point)
- **resolution**: Final chapter of MACRO arc (resolves and transitions)

## Contributes To Macro Arc
1-2 sentences: How does this micro-cycle advance the MACRO arc?

## Focus Characters
- Array of character IDs present in this chapter
- First ID is protagonist of this chapter's cycle
- Others are supporting, antagonist, or witness roles

## Adversity Type
- **internal**: Character's flaw creates problem
- **external**: Environment/others create problem
- **both**: Flaw amplifies external problem (most common)

## Virtue Type
One of: courage, compassion, integrity, loyalty, wisdom, sacrifice

## Seeds Planted
Array of setups that will pay off later (JSON format):
[
  {
    "id": "seed_[random]",
    "description": "[What action/info is planted]",
    "expectedPayoff": "[How this will resolve later]"
  }
]

## Seeds Resolved
Array of payoffs from previous chapters (JSON format):
[
  {
    "sourceChapterId": "[Chapter where seed was planted]",
    "sourceSceneId": "[Scene where seed was planted]",
    "seedId": "[ID of resolved seed]",
    "payoffDescription": "[How seed paid off]"
  }
]

## Connects To Previous Chapter
1 sentence: How does this chapter's adversity emerge from previous consequence?

## Creates Next Adversity
1 sentence: How does this chapter's consequence become next adversity?

# PROGRESSION PATTERNS

## Beginning Chapters (Arc Position: beginning)
- Adversity: Introduce MACRO arc's core problem
- Virtue: Character's first attempt (may be flawed)
- Consequence: Partial success revealing deeper issue
- New Adversity: Problem escalates or transforms

## Middle Chapters (Arc Position: middle)
- Adversity: Complications from previous consequence
- Virtue: Better attempt, but still compromised by flaw
- Consequence: Bittersweet (progress + setback)
- New Adversity: Problem reaches crisis point

## Climax Chapters (Arc Position: climax)
- Adversity: Peak of MACRO arc tension (all or nothing)
- Virtue: Character acts from partially healed state
- Consequence: Significant change (breakthrough or breakdown)
- New Adversity: New normal or final test

## Resolution Chapters (Arc Position: resolution)
- Adversity: Final obstacle or flaw's last stand
- Virtue: Character acts from fully healed state
- Consequence: MACRO arc resolves (satisfying closure)
- New Adversity: Transition to next MACRO arc

# CAUSAL LINKING

Every chapter must link causally:

1. **Previous Consequence → Current Adversity**
   - Chapter 2's adversity comes from Chapter 1's consequence
   - NEVER start fresh without connection
   - Show HOW previous action created current problem

2. **Current Consequence → Next Adversity**
   - This chapter's consequence creates next chapter's setup
   - Plant seeds of next complication in current resolution
   - Forward momentum always maintained

3. **Seed Planting & Resolution**
   - Plant seeds in early chapters (info, items, relationships)
   - Resolve seeds in later chapters (not immediately)
   - Payoffs should feel EARNED not coincidental

# OUTPUT FORMAT

Return structured text with clear chapter separations:

\`\`\`
# CHAPTER 1: [Title]

## Summary
[2-3 sentence chapter summary]

## Metadata
- **Character ID**: [ID]
- **Arc Position**: beginning
- **Adversity Type**: [internal/external/both]
- **Virtue Type**: [courage/compassion/integrity/loyalty/wisdom/sacrifice]

## Contributes To Macro Arc
[How this micro-cycle advances the MACRO arc]

## Focus Characters
- [Character Name] (protagonist)
- [Character Name] (supporting)
- [Character Name] (antagonist)

## Seeds Planted
1. **seed_001**: [Description] → Expected payoff: [How will resolve]
2. **seed_002**: [Description] → Expected payoff: [How will resolve]

## Seeds Resolved
(None for first chapter)

## Causal Links
- **Connects to previous**: [How adversity emerges from previous consequence or MACRO arc start]
- **Creates next adversity**: [How consequence becomes next chapter's problem]

---

# CHAPTER 2: [Title]
[Repeat structure]

---

# CHAPTER 3: [Title]
[Repeat structure]

---

# CHAPTER 4: [Title] (if needed)
[Repeat structure]

\`\`\`

# CRITICAL RULES
1. Each chapter is ONE complete adversity-triumph cycle (all 4 phases)
2. Generate 2-4 chapters per MACRO arc (not more, not less)
3. Arc position must progress: beginning → middle(s) → climax → resolution
4. Virtue type must vary (not same virtue every chapter)
5. Adversity type should be "both" most often (flaw + external)
6. Seeds planted in early chapters MUST resolve in later chapters
7. Causal links must be EXPLICIT (show cause-effect clearly)
8. Final chapter of arc must transition to next MACRO arc's adversity
9. Focus characters should vary but always include arc's main character
10. Each chapter summary should be 2-3 sentences capturing complete cycle

# OUTPUT
Return ONLY the structured text, no JSON, no markdown code blocks.`;

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📑 [CHAPTERS API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await request.json() as {
      part: PartGenerationResult;
      characters: CharacterGenerationResult[];
      previousPartChapters?: ChapterGenerationResult[];
      chaptersPerPart?: number;
    };
    const { part, characters, previousPartChapters = [], chaptersPerPart } = body;

    console.log('[CHAPTERS API] Request body summary:', {
      hasPart: !!part,
      partTitle: part?.title,
      partId: (part as any)?.id,
      charactersCount: characters?.length || 0,
      characterNames: characters?.map(c => c.name).join(', '),
      previousChaptersCount: previousPartChapters.length,
      chaptersPerPart,
    });

    if (!part) {
      console.error('❌ [CHAPTERS API] Validation failed: Part is missing');
      return NextResponse.json(
        { error: 'Part is required' },
        { status: 400 }
      );
    }

    if (!characters || characters.length === 0) {
      console.error('❌ [CHAPTERS API] Validation failed: Characters are missing or empty');
      return NextResponse.json(
        { error: 'Characters are required' },
        { status: 400 }
      );
    }

    console.log('✅ [CHAPTERS API] Validation passed');
    console.log('[CHAPTERS API] Part data:', JSON.stringify({
      title: part.title,
      orderIndex: part.orderIndex,
      characterArcsCount: part.characterArcs?.length || 0,
    }, null, 2));

    // Build context for chapter generation
    const totalArcs = part.characterArcs.length;
    const targetChapterCount = chaptersPerPart !== undefined ? chaptersPerPart : totalArcs * 2; // Default to 2 chapters per arc if not specified

    const chaptersContext = `
# PART CONTEXT
Act ${part.orderIndex + 1}: ${part.title}
${part.summary}

# STORY STRUCTURE CONSTRAINTS (MUST FOLLOW EXACTLY)
${chaptersPerPart !== undefined ? `
CRITICAL: Generate EXACTLY ${chaptersPerPart} chapter${chaptersPerPart > 1 ? 's' : ''} for this part, NO MORE, NO LESS.
${chaptersPerPart === 1 ? `
Since you must generate only ONE chapter, COMBINE all character arcs into a SINGLE cohesive chapter that:
- Weaves together adversity-triumph cycles for all ${totalArcs} character${totalArcs > 1 ? 's' : ''}
- Maintains the moral framework for each character's journey
- Creates a unified narrative that advances all arcs simultaneously
- Prioritizes the primary character's arc while incorporating secondary arcs as support
` : chaptersPerPart < totalArcs ? `
Since you have ${chaptersPerPart} chapter${chaptersPerPart > 1 ? 's' : ''} for ${totalArcs} character arcs:
- Distribute character arcs across ${chaptersPerPart} chapter${chaptersPerPart > 1 ? 's' : ''}
- Primary character arc gets priority focus
- Secondary arcs can share chapters or be woven into primary arc chapters
- Each chapter must still be a complete adversity-triumph cycle
` : `
You have ${chaptersPerPart} chapters for ${totalArcs} character arcs.
- Each main character can have ${Math.floor(chaptersPerPart / totalArcs)}-${Math.ceil(chaptersPerPart / totalArcs)} chapter${Math.ceil(chaptersPerPart / totalArcs) > 1 ? 's' : ''}
- Distribute chapters to best serve the story's pacing and arc development
`}
` : ''}

# CHARACTER MACRO ARCS FOR THIS PART
${part.characterArcs.map((arc) => {
  const character = characters.find(c => c.id === arc.characterId);
  return `
## ${character?.name || 'Unknown'} (${arc.arcPosition})

**MACRO Adversity**:
- Internal: ${arc.macroAdversity.internal}
- External: ${arc.macroAdversity.external}

**MACRO Virtue**: ${arc.macroVirtue}

**MACRO Consequence**: ${arc.macroConsequence}

**MACRO New Adversity**: ${arc.macroNewAdversity}

**Estimated Chapters**: ${arc.estimatedChapters}

**Progression Strategy**: ${arc.progressionStrategy}
`;
}).join('\n')}

# CHARACTERS REFERENCE
${characters.map((char) => `
## ${char.name}
- ID: ${char.id}
- Core Trait: ${char.coreTrait}
- Internal Flaw: ${char.internalFlaw}
- External Goal: ${char.externalGoal}
`).join('\n')}

# PREVIOUS PART'S FINAL CHAPTERS (for causal linking)
${previousPartChapters.length > 0 ? previousPartChapters.slice(-2).map((ch) => `
- **${ch.title}**: ${ch.summary}
  - Consequence: ${ch.createsNextAdversity}
`).join('\n') : 'This is Act 1 - no previous chapters'}

# YOUR TASK
${chaptersPerPart !== undefined
  ? `Generate EXACTLY ${chaptersPerPart} chapter${chaptersPerPart > 1 ? 's' : ''} that ${chaptersPerPart === 1
      ? 'combines all character arcs into ONE unified adversity-triumph cycle'
      : `distribute${chaptersPerPart > 1 ? 's' : ''} the ${totalArcs} character arc${totalArcs > 1 ? 's' : ''} appropriately`}.`
  : `Decompose EACH character's MACRO arc into 2-4 individual chapters (micro-cycles).`}
Each chapter must be ONE complete adversity-triumph cycle.

Generate chapters following the output format, ensuring:
1. Causal linking between chapters (consequence → next adversity)
2. Seed planting in early chapters, resolution in later chapters
3. Arc position progression (beginning → middle → climax → resolution)
4. Variety in virtue types
${chaptersPerPart !== undefined ? `5. EXACTLY ${chaptersPerPart} chapter${chaptersPerPart > 1 ? 's' : ''} total (this is critical!)` : ''}
`;

    const result = await generateWithGemini({
      prompt: chaptersContext,
      systemPrompt: CHAPTERS_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 8192,
    });

    // Parse structured text into chapters array
    const chapters = parseChaptersFromText(result, characters);

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Chapters generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate chapters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function parseChaptersFromText(
  text: string,
  characters: CharacterGenerationResult[]
): ChapterGenerationResult[] {
  const chapters: ChapterGenerationResult[] = [];

  // Split by chapter headers
  const chapterSections = text.split(/# CHAPTER \d+:/);

  // Process each chapter (skip first empty split)
  for (let i = 1; i < chapterSections.length; i++) {
    const chapterSection = chapterSections[i];

    // Extract title
    const titleMatch = chapterSection.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Chapter ${i}`;

    // Extract summary
    const summaryMatch = chapterSection.match(/## Summary\s*\n([^\n#]+(?:\n[^\n#]+)*)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract metadata
    const characterIdMatch = chapterSection.match(/- \*\*Character ID\*\*:\s*([^\n]+)/);
    const arcPositionMatch = chapterSection.match(/- \*\*Arc Position\*\*:\s*([^\n]+)/);
    const adversityTypeMatch = chapterSection.match(/- \*\*Adversity Type\*\*:\s*([^\n]+)/);
    const virtueTypeMatch = chapterSection.match(/- \*\*Virtue Type\*\*:\s*([^\n]+)/);

    const characterId = characterIdMatch ? characterIdMatch[1].trim() : '';
    const arcPosition = arcPositionMatch ? arcPositionMatch[1].trim() as ArcPosition : 'middle';
    const adversityType = adversityTypeMatch ? adversityTypeMatch[1].trim() : 'both';
    const virtueType = virtueTypeMatch ? virtueTypeMatch[1].trim() as VirtueType : 'courage';

    // Extract "Contributes To Macro Arc"
    const contributesMatch = chapterSection.match(/## Contributes To Macro Arc\s*\n([^\n#]+)/);
    const contributesToMacroArc = contributesMatch ? contributesMatch[1].trim() : '';

    // Extract focus characters
    const focusCharactersSection = chapterSection.match(/## Focus Characters\s*\n((?:- [^\n]+\n?)+)/);
    const focusCharacters = [];
    if (focusCharactersSection) {
      const lines = focusCharactersSection[1].split('\n');
      for (const line of lines) {
        const charMatch = line.match(/- ([^(]+)/);
        if (charMatch) {
          const charName = charMatch[1].trim();
          const char = characters.find(c => c.name === charName);
          if (char) focusCharacters.push(char.id);
        }
      }
    }

    // Extract seeds planted
    const seedsPlantedSection = chapterSection.match(/## Seeds Planted\s*\n((?:\d+\. [^\n]+\n?)+)/);
    const seedsPlanted = [];
    if (seedsPlantedSection) {
      const lines = seedsPlantedSection[1].split(/\d+\.\s+/);
      for (const line of lines) {
        if (!line.trim()) continue;
        const seedMatch = line.match(/\*\*([^*]+)\*\*:\s*([^→]+)→\s*Expected payoff:\s*(.+)/);
        if (seedMatch) {
          seedsPlanted.push({
            id: seedMatch[1].trim(),
            description: seedMatch[2].trim(),
            expectedPayoff: seedMatch[3].trim(),
          });
        }
      }
    }

    // Extract seeds resolved
    const seedsResolvedSection = chapterSection.match(/## Seeds Resolved\s*\n((?:\d+\. [^\n]+\n?)+)/);
    const seedsResolved = [];
    if (seedsResolvedSection) {
      const lines = seedsResolvedSection[1].split(/\d+\.\s+/);
      for (const line of lines) {
        if (!line.trim() || line.includes('None')) continue;
        // Parse seed resolution format
        const match = line.match(/From Chapter\s+(\d+)[^:]*:\s*([^(]+)\(([^)]+)\)/);
        if (match) {
          seedsResolved.push({
            sourceChapterId: `chapter_${match[1]}`,
            sourceSceneId: '',
            seedId: match[2].trim(),
            payoffDescription: match[3].trim(),
          });
        }
      }
    }

    // Extract causal links
    const connectsToPreviousMatch = chapterSection.match(/- \*\*Connects to previous\*\*:\s*([^\n]+)/);
    const createsNextMatch = chapterSection.match(/- \*\*Creates next adversity\*\*:\s*([^\n]+)/);

    const connectsToPreviousChapter = connectsToPreviousMatch ? connectsToPreviousMatch[1].trim() : '';
    const createsNextAdversity = createsNextMatch ? createsNextMatch[1].trim() : '';

    chapters.push({
      title,
      summary,
      characterId,
      arcPosition,
      contributesToMacroArc,
      focusCharacters,
      adversityType,
      virtueType,
      seedsPlanted,
      seedsResolved,
      connectsToPreviousChapter,
      createsNextAdversity,
    });
  }

  return chapters;
}
