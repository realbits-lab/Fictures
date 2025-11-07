# Validation APIs

Content validation and dialogue formatting services for story components.

## Overview

The Validation APIs provide:
1. **Story Component Validation**: Validate stories, parts, chapters, scenes, characters, and settings
2. **Dialogue Formatting**: Format and validate dialogue in story content
3. **Full Story Structure Validation**: Validate entire story hierarchies

---

## Endpoints

### Validate Story Components

Validate individual story components or full story structures.

**Endpoint:** `POST /api/validation`

**Authentication:** Required (Session)

**Runtime:** Node.js

**Request Body (Single Component):**

```json
{
  "type": "scene",
  "data": {
    "id": "scene_123",
    "title": "The Opening",
    "content": "Scene content here...",
    "chapterId": "chapter_456"
  },
  "includeWarnings": true
}
```

**Request Body (Full Validation):**

```json
{
  "type": "full",
  "data": {
    "story": { /* story data */ },
    "parts": [ /* parts array */ ],
    "chapters": [ /* chapters array */ ],
    "scenes": [ /* scenes array */ ],
    "characters": [ /* characters array */ ],
    "settings": [ /* settings array */ ]
  },
  "includeWarnings": true
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| type | string | Yes | - | Validation type: `story`, `part`, `chapter`, `scene`, `character`, `setting`, `full` |
| data | object/array | Yes | - | Component data or full story structure |
| includeWarnings | boolean | No | true | Include warnings in validation results |

**Validation Types:**

| Type | Description | Data Structure |
|------|-------------|----------------|
| story | Validate story metadata | Story object |
| part | Validate story part | Part object |
| chapter | Validate chapter | Chapter object |
| scene | Validate scene content | Scene object |
| character | Validate character | Character object |
| setting | Validate setting | Setting object |
| full | Validate entire story | Full story structure |

**Success Response (200) - Single Component:**

```json
{
  "success": true,
  "type": "scene",
  "result": {
    "valid": true,
    "completeness": 85,
    "errors": [],
    "warnings": [
      {
        "field": "content",
        "message": "Scene content is shorter than recommended (500 words minimum)"
      }
    ],
    "suggestions": [
      "Consider adding more descriptive details to reach recommended length"
    ]
  }
}
```

**Success Response (200) - Full Validation:**

```json
{
  "success": true,
  "type": "full",
  "result": {
    "story": {
      "valid": true,
      "completeness": 90,
      "errors": [],
      "warnings": []
    },
    "parts": [
      {
        "id": "part_123",
        "valid": true,
        "completeness": 85,
        "errors": [],
        "warnings": []
      }
    ],
    "chapters": [ /* chapter validation results */ ],
    "scenes": [ /* scene validation results */ ],
    "characters": [ /* character validation results */ ],
    "settings": [ /* settings validation results */ ]
  }
}
```

**Validation Result Fields:**

| Field | Type | Description |
|-------|------|-------------|
| valid | boolean | Whether the component passes validation |
| completeness | number | Completion percentage (0-100) |
| errors | array | Critical validation errors |
| warnings | array | Non-critical warnings |
| suggestions | array | Improvement suggestions |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid validation type or data structure |
| 401 | Unauthorized | Authentication required |
| 500 | Internal Server Error | Validation processing failed |

**Example - Validate Scene:**

```bash
curl -X POST http://localhost:3000/api/validation \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "type": "scene",
    "data": {
      "id": "scene_123",
      "title": "The Opening",
      "content": "A mysterious figure entered the room...",
      "chapterId": "chapter_456"
    },
    "includeWarnings": true
  }'
```

**Example - Full Story Validation:**

```bash
curl -X POST http://localhost:3000/api/validation \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "type": "full",
    "data": {
      "story": { "id": "story_123", "title": "My Story" },
      "chapters": [...],
      "scenes": [...]
    }
  }'
```

---

### Get Validation Status

Get the current validation status for a story.

**Endpoint:** `GET /api/validation`

**Authentication:** Required (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storyId | string | Yes | Story ID to check validation status |

**Success Response (200):**

```json
{
  "success": true,
  "storyId": "story_123",
  "validationStatus": {
    "lastValidated": "2024-01-15T10:30:00.000Z",
    "overallValid": true,
    "componentStatus": {
      "story": { "valid": true, "completeness": 85 },
      "parts": { "valid": true, "completeness": 90 },
      "chapters": { "valid": true, "completeness": 75 },
      "scenes": { "valid": true, "completeness": 60 },
      "characters": { "valid": true, "completeness": 95 },
      "settings": { "valid": true, "completeness": 80 }
    }
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing storyId parameter |
| 401 | Unauthorized | Authentication required |
| 500 | Internal Server Error | Failed to fetch validation status |

**Example:**

```bash
curl -X GET "http://localhost:3000/api/validation?storyId=story_123" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

### Format Dialogue

Format and validate dialogue in scene content.

**Endpoint:** `POST /api/validation/dialogue-formatter`

**Authentication:** Not required

**Request Body:**

```json
{
  "content": "John said Hello there How are you Mary replied I am fine",
  "action": "format"
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| content | string | Yes | - | Scene content to format/validate |
| action | string | No | format | Action: `format` or `validate` |

**Actions:**

| Action | Description |
|--------|-------------|
| format | Format dialogue and return formatted content with validation |
| validate | Only validate without formatting |

**Success Response (200) - Format:**

```json
{
  "content": "John said, \"Hello there. How are you?\"\n\nMary replied, \"I am fine.\"",
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": [],
    "statistics": {
      "dialogueLines": 2,
      "characterSpeaking": 2,
      "averageDialogueLength": 15
    }
  },
  "changes": {
    "originalLength": 56,
    "formattedLength": 62,
    "wasModified": true
  }
}
```

**Success Response (200) - Validate:**

```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    {
      "line": 3,
      "message": "Consider adding speaker attribution for clarity"
    }
  ],
  "statistics": {
    "dialogueLines": 5,
    "characterSpeaking": 2,
    "averageDialogueLength": 20
  }
}
```

**Validation Statistics:**

| Field | Type | Description |
|-------|------|-------------|
| dialogueLines | number | Total dialogue lines |
| characterSpeaking | number | Number of characters speaking |
| averageDialogueLength | number | Average words per dialogue |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing content or invalid action |
| 500 | Internal Server Error | Formatting/validation failed |

**Example - Format:**

```bash
curl -X POST http://localhost:3000/api/validation/dialogue-formatter \
  -H "Content-Type: application/json" \
  -d '{
    "content": "John said Hello there How are you",
    "action": "format"
  }'
```

**Example - Validate:**

```bash
curl -X POST http://localhost:3000/api/validation/dialogue-formatter \
  -H "Content-Type: application/json" \
  -d '{
    "content": "\"Hello,\" said John.",
    "action": "validate"
  }'
```

---

## Validation Rules

### Story Validation

**Required Fields:**
- title (min 3 characters)
- summary (min 50 characters)
- genre

**Completeness Criteria:**
- Has at least 1 part or chapter
- Has cover image
- Has complete metadata

### Chapter Validation

**Required Fields:**
- title (min 3 characters)
- chapterNumber
- storyId or partId

**Completeness Criteria:**
- Has at least 3 scenes
- All scenes have content
- Chapter summary exists

### Scene Validation

**Required Fields:**
- title
- content (min 100 words)
- chapterId

**Completeness Criteria:**
- Content length: 500-2000 words (recommended)
- Has scene image
- Proper dialogue formatting
- Clear scene transitions

### Character Validation

**Required Fields:**
- name
- role
- storyId

**Completeness Criteria:**
- Has character description
- Has character portrait
- Has backstory or motivation

### Setting Validation

**Required Fields:**
- name
- storyId

**Completeness Criteria:**
- Has detailed description
- Has setting image
- Has mood/atmosphere description

---

## Dialogue Formatting Rules

### Automatic Formatting

1. **Quote Marks**: Add proper quotation marks around dialogue
2. **Punctuation**: Add commas, periods, and question marks
3. **Attribution**: Format speaker tags (said, replied, asked)
4. **Paragraphs**: Separate dialogue from narration
5. **Line Breaks**: Add spacing between dialogue exchanges

### Best Practices

**Good Dialogue:**
```
"Hello there," John said with a warm smile.

Mary looked up from her book. "Oh, hi John. I didn't expect to see you here."

"Neither did I," he replied, pulling up a chair.
```

**Poor Dialogue:**
```
John said hello there Mary said hi back they talked
```

---

## Validation Completeness

Completeness scores range from 0-100%:

| Score | Status | Description |
|-------|--------|-------------|
| 90-100% | Excellent | Fully complete and ready for publication |
| 75-89% | Good | Minor improvements needed |
| 60-74% | Fair | Several fields need attention |
| 0-59% | Poor | Significant work required |

---

## Error Handling

### Common Validation Errors

**Missing Required Fields:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Content Too Short:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "content",
      "message": "Scene content must be at least 100 words"
    }
  ]
}
```

**Invalid Structure:**
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "path": ["data", "chapterId"],
      "message": "Required field missing"
    }
  ]
}
```

---

## Testing

### Test Scene Validation

```bash
curl -X POST http://localhost:3000/api/validation \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .auth/cookie.txt)" \
  -d '{
    "type": "scene",
    "data": {
      "id": "scene_test",
      "title": "Test Scene",
      "content": "This is a test scene with some content...",
      "chapterId": "chapter_123"
    }
  }'
```

### Test Dialogue Formatting

```bash
curl -X POST http://localhost:3000/api/validation/dialogue-formatter \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello said John How are you asked Mary",
    "action": "format"
  }'
```

---

## Related Documentation

- [Scene Quality Evaluation](../scene/scene-quality-pipeline.md)
- [Novel Generation System](../novels/novels-specification.md)
- [Database Schema](../../drizzle/schema.ts)
