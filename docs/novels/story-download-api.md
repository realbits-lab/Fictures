# Story Download API Documentation

This document describes the API endpoints for generating and downloading complete stories with all related content.

## Overview

The story download functionality allows you to:
1. Generate a new story with AI using the HNS (Holistic Narrative Structure) framework
2. Download all story content as a single ZIP package including:
   - Complete story in markdown format
   - All scene content organized by parts and chapters
   - Character images and metadata
   - Setting images and metadata
   - HNS data for story, parts, chapters, and scenes

## API Endpoints

### 1. Generate Story (HNS)

Generate a complete story using AI with the Holistic Narrative Structure framework.

**Endpoint:** `POST /api/stories/generate-hns`

**Authentication:** Required (Session or API Key)

**Required Scope:** `stories:write`

**Request Body:**
```json
{
  "prompt": "Your story idea or concept",
  "language": "English"
}
```

**Response:** Server-Sent Events (SSE) stream with progress updates

**Progress Events:**
- `progress`: Generation progress updates
- `hns_complete`: HNS structure generated
- `complete`: Story generation complete with story ID

**Example:**
```bash
curl -X POST http://localhost:3000/api/stories/generate-hns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "prompt": "A cyberpunk detective story in Neo-Tokyo",
    "language": "English"
  }'
```

### 2. Download Story Package

Download a complete story package as a ZIP file.

**Endpoint:** `GET /api/stories/{storyId}/download`

**Authentication:** Required (Session or API Key)

**Required Scope:** `stories:read`

**Access Control:**
- Story owner can download any of their stories
- Published stories can be downloaded by anyone

**Response:** ZIP file containing:

```
story_package.zip
├── {Story_Title}.md                      # Complete story in markdown
├── story_metadata.json                   # Story metadata
├── hns_data/
│   ├── story_hns.json                   # Story-level HNS data
│   ├── parts/
│   │   └── part_1_hns.json              # Part-level HNS data
│   ├── chapters/
│   │   ├── part_1_chapter_1_hns.json    # Chapter-level HNS data
│   │   └── ...
│   ├── scenes/
│   │   ├── part_1_chapter_1_scene_1_hns.json
│   │   └── ...
│   └── characters/
│       ├── character_name_hns.json      # Character HNS data
│       └── ...
├── characters/
│   ├── characters.json                  # All character metadata
│   └── images/
│       ├── character_name.png           # Character images
│       └── ...
└── settings/
    ├── settings.json                    # All setting metadata
    └── images/
        ├── setting_name.png             # Setting images
        └── ...
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/stories/abc123/download \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -o story_package.zip
```

## Using the Scripts

### Test Complete Workflow (Generate + Download)

Generate a new story and download it in one go:

```bash
dotenv --file .env.local run node scripts/test-story-download.mjs
```

This script will:
1. Generate a cyberpunk detective story
2. Monitor the generation progress via SSE
3. Download the complete story package
4. Save it to the `downloads/` directory

### Download Existing Story

Download an already generated story:

```bash
dotenv --file .env.local run node scripts/download-story.mjs <story-id>
```

Example:
```bash
dotenv --file .env.local run node scripts/download-story.mjs abc123def456
```

## Authentication

### Using Session Authentication

If you're logged into the web app, you can make requests from the same browser session without additional authentication.

### Using API Key Authentication

1. Generate an API key from your account settings (see [API Key Generation Guide](./api-key-generation.md))
2. Include it in the Authorization header:
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

For detailed instructions on generating and managing API keys, see the [API Key Generation Guide](./api-key-generation.md).

## Story Content Structure

### Markdown Format

The generated markdown file contains:

```markdown
# {Story Title}

## Description
{Story description}

## Premise
{Story premise}

## Dramatic Question
{Main dramatic question}

## Theme
{Story theme}

---

# Part 1: {Part Title}
{Part description}

## Chapter 1: {Chapter Title}
**Summary:** {Chapter summary}

### Scene 1: {Scene Title}
{Scene content}

### Scene 2: {Scene Title}
{Scene content}

---

## Chapter 2: {Chapter Title}
...
```

### HNS Data Format

HNS (Holistic Narrative Structure) data files contain structured information about each element:

**Story HNS Data:**
```json
{
  "story": {
    "story_id": "abc123",
    "title": "Story Title",
    "premise": "...",
    "dramatic_question": "...",
    "theme": "...",
    // ... additional HNS fields
  }
}
```

**Chapter HNS Data:**
```json
{
  "chapter_id": "ch123",
  "title": "Chapter Title",
  "summary": "...",
  "pacing_goal": "moderate",
  "action_dialogue_ratio": "60/40",
  "chapter_hook": {
    "type": "mystery",
    "description": "...",
    "urgency_level": "medium"
  }
  // ... additional HNS fields
}
```

**Scene HNS Data:**
```json
{
  "scene_id": "sc123",
  "title": "Scene Title",
  "summary": "...",
  "goal": "...",
  "conflict": "...",
  "outcome": "...",
  "pov_character_id": "char123",
  "setting_id": "set123",
  "emotional_shift": {
    "from": "calm",
    "to": "anxious"
  }
  // ... additional HNS fields
}
```

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Authentication
AUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# AI Integration
AI_GATEWAY_API_KEY=your_gateway_key

# Database
POSTGRES_URL=your_postgres_url

# Storage
BLOB_READ_WRITE_TOKEN=your_blob_token
```

## Error Handling

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```
Solution: Include valid authentication credentials

**403 Forbidden (Insufficient permissions):**
```json
{
  "error": "Insufficient permissions. Required scope: stories:read"
}
```
Solution: Ensure your API key has the required scope

**403 Forbidden (No access):**
```json
{
  "error": "You do not have access to this story"
}
```
Solution: You can only download your own stories or published stories

**404 Not Found:**
```json
{
  "error": "Story not found"
}
```
Solution: Verify the story ID is correct

**500 Internal Server Error:**
```json
{
  "error": "Failed to create download package",
  "details": "Error message"
}
```
Solution: Check server logs for details

## Best Practices

1. **Test Locally First**: Always test story generation and download on localhost before deploying
2. **Monitor Progress**: Use the SSE events to show progress to users during generation
3. **Handle Large Files**: Story packages with images can be several MB, plan accordingly
4. **Incremental Saves**: The generation API saves incrementally, so if it fails partway through, you may have partial data
5. **Error Recovery**: Implement retry logic for network failures during download

## Examples

### Complete Node.js Example

```javascript
import fs from 'fs';

async function generateAndDownloadStory(prompt) {
  // Step 1: Generate story
  const genResponse = await fetch('http://localhost:3000/api/stories/generate-hns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ prompt, language: 'English' }),
  });

  // Step 2: Process SSE stream
  const reader = genResponse.body.getReader();
  const decoder = new TextDecoder();
  let storyId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.phase === 'complete') {
          storyId = data.data.storyId;
        }
      }
    }
  }

  // Step 3: Download story package
  const downloadResponse = await fetch(
    `http://localhost:3000/api/stories/${storyId}/download`,
    {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    }
  );

  const buffer = await downloadResponse.arrayBuffer();
  fs.writeFileSync(`story_${storyId}.zip`, Buffer.from(buffer));

  return storyId;
}
```

### Browser Example

```javascript
async function downloadStory(storyId) {
  const response = await fetch(`/api/stories/${storyId}/download`);
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `story_${storyId}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

## Troubleshooting

### Story Generation Fails

1. Check AI_GATEWAY_API_KEY is valid
2. Verify database connection
3. Check server logs for AI errors
4. Ensure sufficient API credits

### Download Fails

1. Verify story exists in database
2. Check authentication credentials
3. Ensure blob storage is configured correctly
4. Verify sufficient disk space for ZIP creation

### Images Missing

1. Check BLOB_READ_WRITE_TOKEN is valid
2. Verify image generation completed successfully
3. Check blob storage URLs are accessible
4. Review image generation logs

## Support

For issues or questions:
1. Check the server logs in `logs/dev-server.log`
2. Review the test script output in `logs/test-story-download.log`
3. Open an issue on GitHub with error details and steps to reproduce
