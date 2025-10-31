# Novel Schema Gap Analysis

**Date**: 2025-10-31
**Purpose**: Identify differences between current database schema and novels-specification.md requirements

## Summary

This document compares the current Drizzle ORM schema (`src/lib/db/schema.ts`) with the Adversity-Triumph Engine specification (`docs/novels/novels-specification.md`) to identify missing fields and required migrations.

---

## 1. Stories Table

### Current Fields
```typescript
- id, title, description, genre, status, tags
- authorId, targetWordCount, currentWordCount, viewCount, rating, ratingCount
- content, imageUrl, imageVariants
- premise, dramaticQuestion, theme (HNS legacy)
- hnsData
```

### Required by Specification (Section 3.3)
```typescript
- summary: text // General thematic premise and moral framework
- genre: string
- tone: string // 'hopeful' | 'dark' | 'bittersweet' | 'satirical'
- moralFramework: string // What virtues are valued in this world?
- userId: string // Note: currently named 'authorId'
```

### Missing Fields
- ❌ `summary` - NEW FIELD (primary planning field)
- ❌ `tone` - NEW FIELD (emotional direction)
- ❌ `moralFramework` - NEW FIELD (virtue framework)
- ⚠️  `authorId` should be `userId` (naming alignment)

### Migration Strategy
1. Add `summary` as text field (nullable initially for migration)
2. Add `tone` as varchar(50) with enum constraint
3. Add `moralFramework` as text field
4. Keep `authorId` for backward compatibility (don't rename)
5. Migrate: `summary` = `premise` + `dramaticQuestion` + `theme` (combine legacy fields)

---

## 2. Parts Table

### Current Fields
```typescript
- id, title, description, storyId, authorId, orderIndex
- targetWordCount, currentWordCount, content
- structuralRole, summary, keyBeats
- hnsData
```

### Required by Specification (Section 3.4)
```typescript
- id, storyId, title
- summary: text // MACRO adversity-triumph arcs with progression planning
- actNumber: number // 1, 2, or 3
- characterArcs: json[] // Array of macro arc tracking objects
```

### Missing Fields
- ✅ `summary` - ALREADY EXISTS
- ❌ `actNumber` - NEW FIELD (Act I/II/III designation)
- ❌ `characterArcs` - NEW FIELD (macro arc tracking)

### Migration Strategy
1. Add `actNumber` as integer (1-3)
2. Add `characterArcs` as json field
3. Populate `actNumber` from `orderIndex` (1, 2, 3 mapping)
4. Keep `description` and other HNS fields for backward compatibility

---

## 3. Chapters Table

### Current Fields
```typescript
- id, title, summary, storyId, partId, authorId, orderIndex
- wordCount, targetWordCount, status
- purpose, hook, characterFocus, publishedAt, scheduledFor
- pacingGoal, actionDialogueRatio, chapterHook
- hnsData
```

### Required by Specification (Section 3.5)
```typescript
- id, partId, storyId, title
- summary: text // Single adversity-triumph cycle
- characterId: string // References Character.id (focus character)
- arcPosition: enum // 'beginning' | 'middle' | 'climax' | 'resolution'
- contributesToMacroArc: text // How this advances macro arc
- focusCharacters: string[] // Character ID(s)
- adversityType: enum // 'internal' | 'external' | 'both'
- virtueType: enum // 'courage' | 'compassion' | 'integrity' | 'sacrifice' | 'loyalty' | 'wisdom'
- seedsPlanted: json[] // Setup for future payoffs
- seedsResolved: json[] // Past setups that pay off
- connectsToPreviousChapter: text // Causal linking
- createsNextAdversity: text // Forward linking
```

### Missing Fields
- ✅ `summary` - ALREADY EXISTS
- ❌ `characterId` - NEW FIELD (single focus character)
- ❌ `arcPosition` - NEW FIELD (position in macro arc)
- ❌ `contributesToMacroArc` - NEW FIELD (arc progression note)
- ❌ `focusCharacters` - NEW FIELD (JSON array of character IDs)
- ❌ `adversityType` - NEW FIELD (conflict type)
- ❌ `virtueType` - NEW FIELD (moral virtue tested)
- ❌ `seedsPlanted` - NEW FIELD (setup tracking)
- ❌ `seedsResolved` - NEW FIELD (payoff tracking)
- ❌ `connectsToPreviousChapter` - NEW FIELD (backward causal link)
- ❌ `createsNextAdversity` - NEW FIELD (forward causal link)

### Migration Strategy
1. Add all 11 new fields
2. Create enums: `arcPositionEnum`, `adversityTypeEnum`, `virtueTypeEnum`
3. All fields nullable initially for existing data
4. Migrate `characterId` from `characterFocus` if parseable

---

## 4. Scenes Table

### Current Fields
```typescript
- id, title, content, chapterId, orderIndex, wordCount
- goal, conflict, outcome
- imageUrl, imageVariants
- povCharacterId, settingId, narrativeVoice, summary, entryHook, emotionalShift
- characterIds, placeIds
- publishedAt, scheduledFor, visibility, autoPublish, publishedBy, unpublishedAt, unpublishedBy
- comicStatus, comicPublishedAt, comicPublishedBy, comicUnpublishedAt, comicUnpublishedBy
- comicGeneratedAt, comicPanelCount, comicVersion
- viewCount, uniqueViewCount, novelViewCount, novelUniqueViewCount, comicViewCount, comicUniqueViewCount, lastViewedAt
- hnsData
```

### Required by Specification (Section 3.6)
```typescript
- id, chapterId, storyId, title
- summary: text // Scene specification (planning layer)
- cyclePhase: enum // 'setup' | 'confrontation' | 'virtue' | 'consequence' | 'transition'
- emotionalBeat: enum // 'fear' | 'hope' | 'tension' | 'relief' | 'elevation' | 'catharsis' | 'despair' | 'joy'
- content: text // Full prose narrative (execution layer)
- imageUrl, imageVariants
```

### Missing Fields
- ✅ `summary` - ALREADY EXISTS
- ✅ `content` - ALREADY EXISTS
- ❌ `cyclePhase` - NEW FIELD (4-phase cycle position)
- ❌ `emotionalBeat` - NEW FIELD (emotional target)

### Migration Strategy
1. Add `cyclePhase` enum field
2. Add `emotionalBeat` enum field
3. Create enums: `cyclePhaseEnum`, `emotionalBeatEnum`
4. Fields nullable for existing scenes

---

## 5. Characters Table

### Current Fields
```typescript
- id, name, storyId, isMain, content
- imageUrl, imageVariants
- role, archetype, summary, storyline
- personality: json // {traits, myers_briggs, enneagram}
- backstory: json
- motivations: json // {primary, secondary, fear}
- voice: json
- physicalDescription: json
- visualReferenceId
- hnsData
```

### Required by Specification (Section 3.1)
```typescript
- id, storyId, name, isMain
- summary: text // 1-2 sentence essence
- coreTrait: string // THE defining moral virtue
- internalFlaw: string // MUST include cause
- externalGoal: string // What they THINK will solve problem
- personality: json // {traits: string[], values: string[]}
- backstory: text // 2-4 paragraphs focused history
- relationships: json // Jeong system tracking
- physicalDescription: json // {age, appearance, distinctiveFeatures, style}
- voiceStyle: json // {tone, vocabulary, quirks, emotionalRange}
- imageUrl, imageVariants
- visualStyle: string
```

### Missing Fields
- ✅ `summary` - ALREADY EXISTS
- ✅ `isMain` - ALREADY EXISTS
- ❌ `coreTrait` - NEW FIELD (moral virtue core)
- ❌ `internalFlaw` - NEW FIELD (adversity source)
- ❌ `externalGoal` - NEW FIELD (what they seek)
- ⚠️  `personality` - EXISTS but different structure (needs migration)
- ⚠️  `backstory` - EXISTS but json (should be text)
- ❌ `relationships` - NEW FIELD (Jeong system)
- ✅ `physicalDescription` - ALREADY EXISTS (verify structure)
- ❌ `voiceStyle` - NEW FIELD (dialogue generation)
- ❌ `visualStyle` - NEW FIELD (image generation)

### Migration Strategy
1. Add `coreTrait`, `internalFlaw`, `externalGoal` as text fields
2. Add `relationships` as json field
3. Add `voiceStyle` as json field
4. Add `visualStyle` as text field
5. Migrate `backstory` content from json to text (flatten if needed)
6. Update `personality` structure (add `values` array)

---

## 6. Settings Table

### Current Fields
```typescript
- id, name, storyId, description
- mood, sensory, visualStyle, visualReferences, colorPalette, architecturalStyle
- imageUrl, imageVariants
```

### Required by Specification (Section 3.2)
```typescript
- id, storyId, name, description
- adversityElements: json // {physicalObstacles, scarcityFactors, dangerSources, socialDynamics}
- symbolicMeaning: text // Moral framework reflection
- cycleAmplification: json // {setup, confrontation, virtue, consequence, transition}
- mood: text
- emotionalResonance: text // What emotion this amplifies
- sensory: json // {sight, sound, smell, touch, taste}
- architecturalStyle: text
- imageUrl, imageVariants
- visualStyle: text
- visualReferences: json
- colorPalette: json
```

### Missing Fields
- ✅ `description`, `mood`, `sensory`, `visualStyle`, `visualReferences`, `colorPalette`, `architecturalStyle` - ALREADY EXIST
- ❌ `adversityElements` - NEW FIELD (external conflict source)
- ❌ `symbolicMeaning` - NEW FIELD (thematic significance)
- ❌ `cycleAmplification` - NEW FIELD (how setting amplifies phases)
- ❌ `emotionalResonance` - NEW FIELD (emotional amplification)

### Migration Strategy
1. Add `adversityElements` as json field
2. Add `symbolicMeaning` as text field
3. Add `cycleAmplification` as json field
4. Add `emotionalResonance` as text field

---

## Migration Priority

### Phase 1: Critical Fields (Required for Generation)
1. **Stories**: `summary`, `tone`, `moralFramework`
2. **Parts**: `actNumber`, `characterArcs`
3. **Characters**: `coreTrait`, `internalFlaw`, `externalGoal`, `relationships`, `voiceStyle`
4. **Settings**: `adversityElements`, `symbolicMeaning`, `cycleAmplification`, `emotionalResonance`

### Phase 2: Cycle Tracking (Required for Quality)
1. **Chapters**: `characterId`, `arcPosition`, `contributesToMacroArc`, `focusCharacters`, `adversityType`, `virtueType`, `seedsPlanted`, `seedsResolved`, `connectsToPreviousChapter`, `createsNextAdversity`
2. **Scenes**: `cyclePhase`, `emotionalBeat`

### Phase 3: Enhancement Fields (Optional)
1. **Characters**: `visualStyle`
2. **Parts**: Keep legacy HNS fields for backward compatibility

---

## Enum Definitions Needed

```typescript
// For stories
export const toneEnum = pgEnum('tone', ['hopeful', 'dark', 'bittersweet', 'satirical']);

// For chapters
export const arcPositionEnum = pgEnum('arc_position', ['beginning', 'middle', 'climax', 'resolution']);
export const adversityTypeEnum = pgEnum('adversity_type', ['internal', 'external', 'both']);
export const virtueTypeEnum = pgEnum('virtue_type', ['courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom']);

// For scenes
export const cyclePhaseEnum = pgEnum('cycle_phase', ['setup', 'confrontation', 'virtue', 'consequence', 'transition']);
export const emotionalBeatEnum = pgEnum('emotional_beat', ['fear', 'hope', 'tension', 'relief', 'elevation', 'catharsis', 'despair', 'joy']);
```

---

## Backward Compatibility Strategy

**Keep ALL existing fields** to ensure:
- Existing HNS stories continue to work
- Gradual migration possible
- No data loss
- APIs can support both systems during transition

**Deprecation Plan**:
- Mark HNS fields as optional in TypeScript
- Remove from NEW story generation
- Keep for reading/displaying existing stories
- Document migration path in CLAUDE.md

---

## Next Steps

1. ✅ Complete gap analysis (this document)
2. ⏳ Create migration SQL file (`drizzle/add-adversity-triumph-fields.sql`)
3. ⏳ Update `src/lib/db/schema.ts` with new fields
4. ⏳ Update TypeScript types in `src/lib/novels/types.ts`
5. ⏳ Update generation APIs to populate new fields
6. ⏳ Create data migration script for existing stories
7. ⏳ Update documentation (CLAUDE.md) with synchronization strategy

---

## Estimated Impact

**Database Changes**:
- Stories: +3 fields
- Parts: +2 fields
- Chapters: +11 fields
- Scenes: +2 fields
- Characters: +7 fields
- Settings: +4 fields
- **Total**: 29 new fields + 6 new enums

**Code Changes**:
- All 9 generation API endpoints need updates
- TypeScript types need updates
- Migration script required for existing data
- Documentation updates required

**Timeline Estimate**:
- Schema migration: 1-2 hours
- Type updates: 1 hour
- API updates: 4-6 hours
- Testing: 2-3 hours
- **Total**: 8-12 hours of development work
