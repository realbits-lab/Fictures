# Novel Generation Library Refactoring Plan

## Problem Statement

**Current Architecture Issues:**

1. **Code Duplication**: Generation logic exists in two places:
   - `src/lib/novels/orchestrator.ts` - Inline generation for unified API
   - `src/app/studio/api/novels/*/route.ts` - Individual API endpoints

2. **Maintenance Burden**: Changes to generation logic require updates in multiple places

3. **Inconsistency Risk**: Different implementations can drift apart

4. **Testing Difficulty**: Cannot test generation logic independently from API routes

## Current Structure Analysis

### Orchestrator (`src/lib/novels/orchestrator.ts`)
```typescript
export async function generateCompleteNovel(params) {
  // Phase 1: Story generation (inline logic)
  // Phase 2: Characters generation (inline logic)
  // Phase 3: Settings generation (inline logic)
  // Phase 4: Parts generation (inline logic)
  // Phase 5: Chapters generation (inline logic)
  // Phase 6: Scene summaries generation (inline logic)
  // Phase 7: Scene content generation (inline logic)
  // Phase 8: Scene evaluation (inline logic)
  // Phase 9: Images generation (inline logic)
}
```

### Individual API Endpoints
```
src/app/studio/api/novels/
├── route.ts                    # Unified generation (uses orchestrator)
├── characters/route.ts         # Individual character generation
├── settings/route.ts           # Individual setting generation
├── parts/route.ts              # Individual parts generation
├── chapters/route.ts           # Individual chapters generation
├── scene-summaries/route.ts    # Individual scene summaries
├── scene-content/route.ts      # Individual scene content
├── scene-evaluation/route.ts   # Individual evaluation
└── images/route.ts             # Individual image generation
```

## Proposed Architecture

### New Structure: Studio Generator Library

**Architectural Decision**: Place generators under `studio` instead of `novels`
- **`studio`**: Creation/generation functionality (write operations)
- **`novels`**: Reading/viewing functionality (read operations)

```
src/lib/studio/
├── generators/                        # NEW: Common generator functions
│   ├── index.ts                      # Export all generators
│   ├── story-generator.ts            # Story generation
│   ├── characters-generator.ts       # Character generation
│   ├── settings-generator.ts         # Setting generation
│   ├── parts-generator.ts            # Parts generation
│   ├── chapters-generator.ts         # Chapters generation
│   ├── scene-summaries-generator.ts  # Scene summaries generation
│   ├── scene-content-generator.ts    # Scene content generation
│   ├── scene-evaluation-generator.ts # Scene evaluation
│   └── images-generator.ts           # Image generation
└── agent-*.ts                         # Existing agent tools

src/lib/novels/
├── orchestrator.ts                    # Unified generation (uses studio generators)
├── types.ts                          # Shared types
├── system-prompts.ts                 # Shared prompts
└── ai-client.ts                      # AI integration
```

### Generator Function Signature

Each generator follows a consistent pattern:

```typescript
// Example: characters-generator.ts
export interface GenerateCharactersParams {
  storyId: string;
  userId: string;
  story: StorySummaryResult;
  characterCount: number;
  language?: string;
}

export interface GenerateCharactersResult {
  characters: Character[];
  metadata: {
    totalGenerated: number;
    generationTime: number;
  };
}

export async function generateCharacters(
  params: GenerateCharactersParams
): Promise<GenerateCharactersResult> {
  // 1. Validate input
  // 2. Prepare prompts
  // 3. Call AI
  // 4. Parse and validate result
  // 5. Save to database
  // 6. Generate images if needed
  // 7. Return result
}
```

### Usage Pattern

**1. In Orchestrator:**
```typescript
import { generateCharacters } from '@/lib/studio/generators';

export async function generateCompleteNovel(params) {
  // Phase 1: Story
  const story = await generateStory({...});
  onProgress({ phase: 'story_complete', data: { story } });

  // Phase 2: Characters
  const charactersResult = await generateCharacters({
    storyId: story.id,
    userId: params.userId,
    story: story,
    characterCount: params.characterCount,
  });
  onProgress({ phase: 'characters_complete', data: charactersResult });

  // ... continue with other phases
}
```

**2. In Individual API Endpoints:**
```typescript
// src/app/studio/api/novels/characters/route.ts
import { generateCharacters } from '@/lib/studio/generators';

export async function POST(request: NextRequest) {
  const { storyId, characterCount } = await request.json();

  // Fetch story data
  const story = await db.query.stories.findFirst({
    where: eq(stories.id, storyId),
  });

  // Use common generator
  const result = await generateCharacters({
    storyId,
    userId: session.user.id,
    story,
    characterCount,
  });

  return NextResponse.json(result);
}
```

## Benefits

### 1. DRY Principle
- ✅ Single source of truth for generation logic
- ✅ Changes in one place apply everywhere
- ✅ Reduced code duplication

### 2. Maintainability
- ✅ Easier to update prompts and logic
- ✅ Clear separation of concerns
- ✅ Better code organization

### 3. Testability
- ✅ Can unit test generators independently
- ✅ Can mock generators in API route tests
- ✅ Easier to test edge cases

### 4. Consistency
- ✅ Unified API always matches individual endpoints
- ✅ Same validation and error handling
- ✅ Consistent response formats

### 5. Flexibility
- ✅ Easy to add new generation methods
- ✅ Can compose generators for complex workflows
- ✅ Reusable across different contexts

## Implementation Plan

### Phase 1: Setup (Low Risk)
1. Create `src/lib/studio/generators/` directory
2. Create `index.ts` with exports
3. Define common interfaces in new `generator-types.ts`

### Phase 2: Extract Generators (One at a time)
For each phase (story, characters, settings, etc.):

1. **Extract from orchestrator**:
   - Copy generation logic to new generator file
   - Parameterize all dependencies
   - Add proper TypeScript types
   - Add error handling

2. **Update orchestrator**:
   - Import and use new generator
   - Remove inline logic
   - Test unified API endpoint

3. **Update individual API endpoint**:
   - Import and use new generator
   - Remove duplicate logic
   - Test individual endpoint

4. **Verify**:
   - Run unit tests
   - Run integration tests
   - Test both unified and individual endpoints

### Phase 3: Cleanup
1. Remove unused prompt constants from individual routes
2. Consolidate system prompts if needed
3. Update documentation
4. Run Biome formatting

### Phase 4: Testing
1. Unit tests for each generator
2. Integration tests for orchestrator
3. API endpoint tests
4. End-to-end generation test

## Migration Strategy

### Safe Incremental Approach

**Week 1: Foundation**
- Create generators directory
- Extract story generator
- Test with both unified and individual endpoints

**Week 2-3: Core Generators**
- Extract characters generator
- Extract settings generator
- Extract parts generator
- Test each after extraction

**Week 4-5: Content Generators**
- Extract chapters generator
- Extract scene-summaries generator
- Extract scene-content generator
- Extract scene-evaluation generator

**Week 6: Images & Finalization**
- Extract images generator
- Final testing
- Documentation updates
- Performance verification

### Rollback Plan

Each generator can be rolled back independently:
1. Revert generator file changes
2. Restore inline logic in orchestrator
3. Restore logic in individual API endpoint
4. Test endpoints still work

## Code Examples

### Example 1: Story Generator

```typescript
// src/lib/studio/generators/story-generator.ts
import { generateJSON } from '@/lib/novels/ai-client';
import { STORY_SUMMARY_PROMPT } from '@/lib/novels/system-prompts';
import type { StorySummaryResult } from '@/lib/novels/types';

export interface GenerateStoryParams {
  userId: string;
  userPrompt: string;
  language?: string;
  preferredGenre?: string;
  preferredTone?: string;
}

export interface GenerateStoryResult {
  story: StorySummaryResult;
  storyId: string;
  metadata: {
    generationTime: number;
  };
}

export async function generateStory(
  params: GenerateStoryParams
): Promise<GenerateStoryResult> {
  const startTime = Date.now();

  // Build prompt
  const prompt = `${STORY_SUMMARY_PROMPT}

User Concept: ${params.userPrompt}
${params.preferredGenre ? `Preferred Genre: ${params.preferredGenre}` : ''}
${params.preferredTone ? `Preferred Tone: ${params.preferredTone}` : ''}
Language: ${params.language || 'English'}`;

  // Generate story data
  const storyData = await generateJSON<StorySummaryResult>(
    prompt,
    `Generate a compelling story foundation based on the user's concept.
     Focus on establishing strong themes, moral framework, and emotional arcs.`
  );

  // Validate result
  if (!storyData.title || !storyData.genre || !storyData.moralFramework) {
    throw new Error('Invalid story data generated');
  }

  // Save to database
  const [story] = await db.insert(stories).values({
    userId: params.userId,
    title: storyData.title,
    summary: storyData.summary,
    genre: storyData.genre,
    tone: storyData.tone,
    moralFramework: storyData.moralFramework,
    language: params.language || 'English',
  }).returning();

  return {
    story: storyData,
    storyId: story.id,
    metadata: {
      generationTime: Date.now() - startTime,
    },
  };
}
```

### Example 2: Characters Generator

```typescript
// src/lib/studio/generators/characters-generator.ts
import { generateJSON } from '@/lib/novels/ai-client';
import { CHARACTER_GENERATION_PROMPT } from '@/lib/novels/system-prompts';
import { generateCharacterPortrait } from './images-generator';
import type { Character, StorySummaryResult } from '@/lib/novels/types';

export interface GenerateCharactersParams {
  storyId: string;
  userId: string;
  story: StorySummaryResult;
  characterCount: number;
  language?: string;
  onProgress?: (current: number, total: number) => void;
}

export interface GenerateCharactersResult {
  characters: Character[];
  metadata: {
    totalGenerated: number;
    generationTime: number;
  };
}

export async function generateCharacters(
  params: GenerateCharactersParams
): Promise<GenerateCharactersResult> {
  const startTime = Date.now();
  const characters: Character[] = [];

  for (let i = 0; i < params.characterCount; i++) {
    // Report progress
    params.onProgress?.(i + 1, params.characterCount);

    // Generate character data
    const characterData = await generateJSON<Character>(
      CHARACTER_GENERATION_PROMPT,
      `Create character ${i + 1} of ${params.characterCount} for the story.
       Story: ${params.story.title}
       Genre: ${params.story.genre}
       Moral Framework: ${params.story.moralFramework}`
    );

    // Save to database
    const [character] = await db.insert(characters).values({
      storyId: params.storyId,
      name: characterData.name,
      summary: characterData.summary,
      coreTrait: characterData.coreTrait,
      internalFlaw: characterData.internalFlaw,
      // ... other fields
    }).returning();

    // Generate portrait
    const portrait = await generateCharacterPortrait({
      character: characterData,
      storyId: params.storyId,
    });

    characters.push({
      ...characterData,
      id: character.id,
      imageUrl: portrait.url,
    });
  }

  return {
    characters,
    metadata: {
      totalGenerated: characters.length,
      generationTime: Date.now() - startTime,
    },
  };
}
```

## Success Criteria

- ✅ All generation logic extracted to common library
- ✅ Orchestrator uses only common generators
- ✅ Individual API endpoints use only common generators
- ✅ No code duplication between orchestrator and API endpoints
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Performance same or better than before

## Risks & Mitigation

### Risk 1: Breaking Changes
- **Mitigation**: Incremental extraction, test each phase
- **Rollback**: Revert to previous implementation per generator

### Risk 2: Performance Regression
- **Mitigation**: Benchmark before and after
- **Monitoring**: Track generation times

### Risk 3: Increased Complexity
- **Mitigation**: Clear interfaces, good documentation
- **Training**: Code review, team discussion

## Next Steps

1. **Review this plan** - Get approval from team
2. **Create feature branch** - `feature/generator-refactoring`
3. **Start Phase 1** - Setup generators directory
4. **Extract first generator** - Story generator (safest to start)
5. **Test thoroughly** - Ensure no regressions
6. **Continue incrementally** - One generator at a time

## Questions to Consider

1. Should generators handle database operations or return data for caller to save?
2. Should progress callbacks be built into generators or passed as params?
3. How to handle image generation - inline or separate?
4. Should we add caching layer in generators?
5. Do we need generator composition utilities?

---

**Status**: Draft - Awaiting Review
**Created**: 2025-11-08
**Author**: Claude Code
