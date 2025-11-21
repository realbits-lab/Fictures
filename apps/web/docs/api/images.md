# Image APIs

AI-powered image generation and upload services for story illustrations.

## Overview

The Image APIs provide two main capabilities:
1. **AI Image Generation**: Generate story illustrations using AI server (supports multiple providers)
2. **Image Upload**: Upload custom images to Vercel Blob storage

**AI Server Integration:**
The platform uses a dedicated AI server for image generation, configured via environment variables:
- `AI_SERVER_IMAGE_URL` - Dedicated server for image generation
- `AI_SERVER_IMAGE_TIMEOUT` - Generation timeout in ms (default: 120000)

All generated images are automatically:
- Stored in Vercel Blob storage
- Optimized with 4 variants (AVIF + JPEG × mobile 1x/2x)
- Sized at 1344×768 pixels (7:4 aspect ratio)

---

## Endpoints

### Generate Story Images

Generate AI-powered story illustrations via the AI server.

**Endpoint:** `POST /studio/api/images`

**Authentication:** Required (Session)

**Note:** This is the primary endpoint for generating story, character, setting, and scene images.

**Request Body:**

```json
{
  "prompt": "A mysterious forest at twilight with ancient trees, cinematic composition",
  "storyId": "story_abc123",
  "chapterId": "chapter_xyz789",
  "sceneId": "scene_def456",
  "style": "vivid",
  "quality": "standard",
  "autoPrompt": false
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| prompt | string | Conditional | - | Image generation prompt (required if autoPrompt is false) |
| storyId | string | No | - | Story ID for ownership verification and context |
| chapterId | string | No | - | Chapter ID for organizing images |
| sceneId | string | No | - | Scene ID for organizing images |
| style | string | No | vivid | Image style: `vivid` (hyper-real) or `natural` (realistic) |
| quality | string | No | standard | Quality level: `standard` or `hd` |
| autoPrompt | boolean | No | false | Auto-generate prompt from story context (requires storyId) |

**Validation Rules:**

- Either `prompt` OR `autoPrompt` must be provided
- If `storyId` is provided, ownership is verified
- If `autoPrompt` is true, `storyId` is required

**Auto-Generated Prompt:**

When `autoPrompt: true`, the system builds a prompt from story metadata:

```typescript
// Generated from story title, description, and genre
"A [genre] story scene depicting [title]: [description], cinematic widescreen composition"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Image generated successfully",
  "image": {
    "url": "https://blob.vercel-storage.com/.../image.png",
    "blobUrl": "https://blob.vercel-storage.com/.../image.png",
    "width": 1344,
    "height": 768,
    "size": 2846330,
    "aspectRatio": "7:4"
  },
  "prompt": "The final prompt used for generation"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Operation success status |
| message | string | Success message |
| image.url | string | Public URL of the generated image |
| image.blobUrl | string | Vercel Blob storage URL (same as url) |
| image.width | number | Image width in pixels (1344) |
| image.height | number | Image height in pixels (768) |
| image.size | number | Image file size in bytes |
| image.aspectRatio | string | Image aspect ratio (7:4) |
| prompt | string | The actual prompt used for generation |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Missing prompt/autoPrompt or invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Not the story owner |
| 500 | Internal Server Error | Image generation failed |

**Example - Manual Prompt:**

```bash
curl -X POST http://localhost:3000/studio/api/images \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "prompt": "A cyberpunk city street at night with neon signs, rain-soaked pavement, cinematic widescreen composition",
    "storyId": "story_abc123",
    "style": "vivid",
    "quality": "standard"
  }'
```

**Example - Auto Prompt:**

```bash
curl -X POST http://localhost:3000/studio/api/images \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "storyId": "story_abc123",
    "autoPrompt": true,
    "style": "natural"
  }'
```

**Image Generation Process:**

1. **Validation**: Check authentication and ownership
2. **Prompt**: Use provided prompt or auto-generate from story
3. **Generation**: Call AI server image generation endpoint
4. **Upload**: Store original image in Vercel Blob
5. **Optimization**: Generate 4 optimized variants automatically
6. **Response**: Return URLs and metadata

---

### Upload Image

Upload a custom image to Vercel Blob storage.

**Endpoint:** `POST /api/upload/image`

**Authentication:** Required (Session)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Image file (JPEG, PNG, GIF, WebP) |

**File Constraints:**

- **Max Size**: 5MB
- **Allowed Types**: image/jpeg, image/png, image/gif, image/webp
- **Max Width**: 1920px (automatically resized if larger)

**Success Response (200):**

```json
{
  "url": "https://blob.vercel-storage.com/.../uploads/user123/1234567890-image.jpg",
  "filename": "image.jpg",
  "size": 1024000,
  "width": 1920,
  "height": 1080
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| url | string | Public URL of the uploaded image |
| filename | string | Original filename |
| size | number | Final file size in bytes |
| width | number | Image width in pixels |
| height | number | Image height in pixels |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | No file, invalid type, or size exceeds 5MB |
| 401 | Unauthorized | Authentication required |
| 500 | Internal Server Error | Upload failed |

**Example:**

```bash
curl -X POST http://localhost:3000/api/upload/image \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Upload Process:**

1. **Validation**: Check file type and size
2. **Processing**: Resize if width > 1920px using Sharp
3. **Metadata**: Extract width and height
4. **Upload**: Store in Vercel Blob at `uploads/{userId}/{timestamp}-{filename}`
5. **Response**: Return public URL and metadata

---

### Get API Documentation

Get documentation for the image generation API.

**Endpoint:** `GET /api/images/generate`

**Authentication:** Not required

**Response (200):**

```json
{
  "message": "Story Image Generation API",
  "summary": "Generate story illustrations using Gemini 2.5 Flash with 7:4 aspect ratio (1344x768)",
  "usage": "POST with appropriate parameters",
  "parameters": {
    "prompt": {
      "type": "string",
      "required": "conditional",
      "summary": "Image generation prompt",
      "example": "A mysterious forest at twilight..."
    }
    // ... full parameter documentation
  },
  "response": { /* example response */ },
  "example": { /* example request */ }
}
```

---

## Image Optimization

All generated and uploaded images are automatically optimized for web performance.

### Optimization Pipeline

1. **Original**: 1344×768 PNG (Gemini 2.5 Flash output)
2. **AVIF Mobile 1x**: 672×384 AVIF (best compression)
3. **AVIF Mobile 2x**: 1344×768 AVIF (retina displays)
4. **JPEG Mobile 1x**: 672×384 JPEG (fallback)
5. **JPEG Mobile 2x**: 1344×768 JPEG (retina fallback)

### Variant Usage in HTML

```html
<picture>
  <source
    type="image/avif"
    srcset="mobile-1x.avif 1x, mobile-2x.avif 2x"
  />
  <source
    type="image/jpeg"
    srcset="mobile-1x.jpg 1x, mobile-2x.jpg 2x"
  />
  <img src="original.png" alt="Story illustration" />
</picture>
```

---

## Best Practices

### Prompt Engineering for Story Images

**Good Prompts:**
- Include setting and mood: "A mysterious forest at twilight"
- Add composition hints: "cinematic widescreen composition"
- Specify style: "vivid colors, dramatic lighting"
- Keep it descriptive but concise (20-50 words)

**Poor Prompts:**
- Too vague: "A scene"
- Too long: 200+ words with excessive details
- Missing context: "The thing"

### Performance Considerations

**Image Generation:**
- Takes 15-30 seconds per image
- Use for story covers and key scenes only
- Consider caching generated images

**Image Upload:**
- Faster than generation (1-3 seconds)
- Use for user avatars and custom assets
- Automatic optimization saves bandwidth

### Storage Management

**Blob Storage Paths:**
- Generated: `stories/{storyId}/images/{imageId}.png`
- Uploaded: `uploads/{userId}/{timestamp}-{filename}`
- Optimized variants: `{originalPath}.variants/{format}-{size}.{ext}`

**Cost Optimization:**
- Delete unused images to save storage costs
- Use optimized variants for faster loading
- Implement CDN caching for frequently accessed images

---

## Error Handling

### Common Errors

**Invalid Style:**
```json
{
  "error": "Failed to generate image",
  "details": "Invalid style parameter. Must be 'vivid' or 'natural'"
}
```

**File Too Large:**
```json
{
  "error": "Bad Request",
  "message": "File size exceeds 5MB limit"
}
```

**Authentication Failed:**
```json
{
  "error": "Authentication required"
}
```

**Rate Limit Exceeded:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many image generation requests. Please wait before trying again."
}
```

---

## Testing

### Test Image Generation

```bash
# Basic generation test
dotenv --file .env.local run node scripts/test-imagen-generation.mjs

# Test with specific prompt
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .auth/cookie.txt)" \
  -d '{
    "prompt": "A futuristic city skyline at sunset, cinematic widescreen",
    "style": "vivid"
  }'
```

### Test Image Upload

```bash
# Create test image
convert -size 1920x1080 xc:blue test-image.png

# Upload test
curl -X POST http://localhost:3000/api/upload/image \
  -H "Cookie: $(cat .auth/cookie.txt)" \
  -F "file=@test-image.png"
```

---

## Rate Limits

| Operation | Limit | Time Window |
|-----------|-------|-------------|
| Image Generation | 5 requests | per minute |
| Image Upload | 10 requests | per minute |

---

## Related Documentation

- [Image Generation Guide](../image/image-generation.md)
- [Image Optimization](../image/image-optimization.md)
- [Image Architecture](../image/image-architecture.md)
- [Novel Generation System](../novels/novels-specification.md)
