# API Type Application Summary

This document tracks the application of unified type naming convention to all generator API routes.

## Unified Type Pattern

```typescript
// API Layer Types
interface Generate{Entity}Request { ... }
interface Generate{Entity}Response { success: true; ... }
interface Generate{Entity}ErrorResponse { error: string; details?: any }
```

## Completed

### ✅ stories/route.ts
- `GenerateStoryRequest`
- `GenerateStoryResponse`
- `GenerateStoryErrorResponse`

### ✅ characters/route.ts
- `GenerateCharactersRequest`
- `GenerateCharactersResponse`
- `GenerateCharactersErrorResponse`

## Remaining (Apply Same Pattern)

### Settings
**File:** `src/app/studio/api/settings/route.ts`
```typescript
interface GenerateSettingsRequest {
  storyId: string;
  settingCount?: number;
}

interface GenerateSettingsResponse {
  success: true;
  settings: Array<Setting>;
  metadata: { totalGenerated: number; generationTime: number };
}

interface GenerateSettingsErrorResponse {
  error: string;
  details?: any;
}
```

### Parts
**File:** `src/app/studio/api/parts/route.ts`
```typescript
interface GeneratePartsRequest {
  storyId: string;
  partsCount?: number;
}

interface GeneratePartsResponse {
  success: true;
  parts: Array<Part>;
  metadata: { totalGenerated: number; generationTime: number };
}

interface GeneratePartsErrorResponse {
  error: string;
  details?: any;
}
```

### Chapters
**File:** `src/app/studio/api/chapters/route.ts`
```typescript
interface GenerateChaptersRequest {
  storyId: string;
  chaptersPerPart?: number;
}

interface GenerateChaptersResponse {
  success: true;
  chapters: Array<Chapter>;
  metadata: { totalGenerated: number; generationTime: number };
}

interface GenerateChaptersErrorResponse {
  error: string;
  details?: any;
}
```

### Scene Summaries
**File:** `src/app/studio/api/scene-summaries/route.ts`
```typescript
interface GenerateSceneSummariesRequest {
  storyId: string;
  scenesPerChapter?: number;
}

interface GenerateSceneSummariesResponse {
  success: true;
  scenes: Array<Scene>;
  metadata: { totalGenerated: number; generationTime: number };
}

interface GenerateSceneSummariesErrorResponse {
  error: string;
  details?: any;
}
```

### Scene Content
**File:** `src/app/studio/api/scene-content/route.ts`
```typescript
interface GenerateSceneContentRequest {
  sceneId: string;
  language?: string;
}

interface GenerateSceneContentResponse {
  success: true;
  scene: {
    id: string;
    content: string;
    wordCount: number;
  };
  metadata: { generationTime: number };
}

interface GenerateSceneContentErrorResponse {
  error: string;
  details?: any;
}
```

## Implementation Steps (For Each Route)

1. **Add Type Definitions** after `export const runtime = "nodejs";`
2. **Type Request Body**: `const body = (await request.json()) as Generate{Entity}Request;`
3. **Type Response**: `const response: Generate{Entity}Response = { ... };`
4. **Type Errors**: `const errorResponse: Generate{Entity}ErrorResponse = { ... };`
5. **Run Biome**: `pnpm biome check --write src/app/studio/api/{route}/route.ts`

## Benefits

- ✅ Type safety across all API endpoints
- ✅ Consistent naming convention
- ✅ Self-documenting API contracts
- ✅ Better IDE autocomplete
- ✅ Compile-time validation
