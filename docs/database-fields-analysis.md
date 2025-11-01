---
title: Database Fields Analysis - Complete Field Mapping
---

# Database Fields Analysis

## Stories Table (15 database fields)

### Database Schema Fields:
1. ✅ id
2. ✅ title
3. ✅ genre
4. ✅ status
5. ✅ authorId
6. ✅ viewCount
7. ✅ rating
8. ✅ ratingCount
9. ✅ imageUrl
10. ✅ imageVariants
11. ✅ summary
12. ✅ tone
13. ✅ moralFramework
14. ✅ createdAt
15. ✅ updatedAt

### Currently Displayed (22 rows in UI):
1. ID - `story.id`
2. Title - `story.title`
3. Genre - `story.genre`
4. Status - `story.status`
5. Author ID - `(story as any).authorId`
6. View Count - `(story as any).viewCount`
7. Rating - `(story as any).rating`
8. Rating Count - `(story as any).ratingCount`
9. Image URL - `(story as any).imageUrl`
10. Image Variants - `(story as any).imageVariants`
11. Summary - `(story as any).summary`
12. Tone - `(story as any).tone`
13. Moral Framework - `(story as any).moralFramework`
14. **❌ Part IDs** - NOT IN SCHEMA (removed in schema simplification)
15. **❌ Chapter IDs** - NOT IN SCHEMA (removed in schema simplification)
16. **❌ Scene IDs** - NOT IN SCHEMA (removed in schema simplification)
17. Parts Count - DERIVED from `story.parts?.length`
18. Chapters Count - DERIVED from `story.chapters?.length`
19. Total Scenes - DERIVED (computed)
20. Created At - `(story as any).createdAt`
21. Updated At - `(story as any).updatedAt`
22. Public - DERIVED from `story.isPublic`

### Issues:
- ❌ Displaying 3 non-existent fields (partIds, chapterIds, sceneIds)
- ❌ Missing actual database timestamp fields in proper format
- ✅ All actual database fields are displayed

## Parts Table (9 database fields)

### Database Schema Fields:
1. ✅ id
2. ✅ title
3. ✅ storyId
4. ✅ authorId
5. ✅ summary
6. ✅ orderIndex
7. ✅ characterArcs
8. ✅ createdAt
9. ✅ updatedAt

### Check Current Display:
Need to verify if ALL 9 fields are shown in the UI table.

## Chapters Table (25 database fields)

### Database Schema Fields:
1. id
2. title
3. summary
4. storyId
5. partId
6. authorId
7. orderIndex
8. status
9. purpose
10. hook
11. characterFocus
12. publishedAt
13. scheduledFor
14. characterId
15. arcPosition
16. contributesToMacroArc
17. focusCharacters
18. adversityType
19. virtueType
20. seedsPlanted
21. seedsResolved
22. connectsToPreviousChapter
23. createsNextAdversity
24. createdAt
25. updatedAt

### Check Current Display:
Need to verify if ALL 25 fields are shown in the UI table.

## Scenes Table (38 actual database fields)

### Database Schema Fields:
1. id
2. title
3. content
4. chapterId
5. orderIndex
6. imageUrl
7. imageVariants
8. summary
9. cyclePhase
10. emotionalBeat
11. characterFocus
12. sensoryAnchors
13. dialogueVsDescription
14. suggestedLength
15. publishedAt
16. scheduledFor
17. visibility
18. autoPublish
19. publishedBy
20. unpublishedAt
21. unpublishedBy
22. comicStatus
23. comicPublishedAt
24. comicPublishedBy
25. comicUnpublishedAt
26. comicUnpublishedBy
27. comicGeneratedAt
28. comicPanelCount
29. comicVersion
30. viewCount
31. uniqueViewCount
32. novelViewCount
33. novelUniqueViewCount
34. comicViewCount
35. comicUniqueViewCount
36. lastViewedAt
37. createdAt
38. updatedAt

### REMOVED/Legacy Fields (NOT in schema):
- ❌ goal - NOT IN SCHEMA (legacy field)
- ❌ conflict - NOT IN SCHEMA (legacy field)
- ❌ outcome - NOT IN SCHEMA (legacy field)

### Check Current Display:
Need to verify if ALL 38 actual fields are shown, and legacy fields should be removed.

## Characters Table (25 database fields)

### Database Schema Fields:
1. id
2. name
3. storyId
4. isMain
5. content
6. imageUrl
7. imageVariants
8. role
9. archetype
10. summary
11. storyline
12. personality
13. backstory
14. motivations
15. voice
16. physicalDescription
17. visualReferenceId
18. coreTrait
19. internalFlaw
20. externalGoal
21. relationships
22. voiceStyle
23. visualStyle
24. createdAt
25. updatedAt

### Check Current Display:
Need to verify if ALL 25 fields are shown in the UI.

## Settings Table (18 database fields)

### Database Schema Fields:
1. id
2. name
3. storyId
4. description
5. mood
6. sensory
7. visualStyle
8. visualReferences
9. colorPalette
10. architecturalStyle
11. imageUrl
12. imageVariants
13. adversityElements
14. symbolicMeaning
15. cycleAmplification
16. emotionalResonance
17. createdAt
18. updatedAt

### Check Current Display:
Need to verify if ALL 18 fields are shown in the UI.

## Summary of Issues:

1. **Stories Table**:
   - Displaying 3 NON-EXISTENT fields (partIds, chapterIds, sceneIds) that were removed in schema simplification
   - These should be REMOVED from display

2. **Scenes Table**:
   - May be displaying 3 LEGACY fields (goal, conflict, outcome) that no longer exist in schema
   - These should be REMOVED from display

3. **All Tables**:
   - Need to verify EVERY database field is actually shown in the UI
   - Need to ensure NO legacy/removed fields are displayed
   - Need to ensure proper formatting for JSON, dates, and complex fields
