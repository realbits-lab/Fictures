---
title: Comic Panel Generation Script Guide
---

# Comic Panel Generation Script

Generate comic panels for scenes using the Toonplay 9-step pipeline with automated quality evaluation and improvement.

## Quick Start

```bash
# Preview what would be generated
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --dry-run

# Generate comic panels
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID

# Force regeneration of existing panels
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --force
```

## Prerequisites

1. **Development server running**: 
   ```bash
   dotenv --file .env.local run pnpm dev
   ```

2. **Valid scene ID**: Get scene IDs from your database or use list-stories.mjs

3. **Authentication**: Script uses `writer@fictures.xyz` API key from `.auth/user.json`

4. **Environment variables**: Ensure `.env.local` is properly configured with:
   - `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini 2.5 Flash for image generation
   - `AI_GATEWAY_API_KEY` - Vercel AI Gateway for text generation
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob for image storage

## Command Line Options

| Option | Description |
|--------|-------------|
| `<scene-id>` | **Required** - Scene ID to generate panels for |
| `--dry-run` | Preview generation without creating panels |
| `--force` | Regenerate panels even if they already exist |
| `--verbose` | Show detailed generation logs |

## How It Works

### Generation Pipeline (9 Steps)

1. **Analyze Scene Structure** - Parse scene content and extract key elements
2. **Generate Panel Summaries** - Create 7-12 panel summaries with shot types
3. **Create Panel Content** - Write dialogue, SFX, and narrative for each panel
4. **Generate Panel Images** - Create 1344×768px images using Gemini 2.5 Flash
5. **Optimize Images** - Generate 4 variants (AVIF + JPEG × mobile 1x/2x)
6. **Evaluate Quality** - Score using 5-category rubric (Pacing, Visual Grammar, etc.)
7. **Improve If Needed** - Iteratively improve panels if score < 3.0/5.0 (max 2 cycles)
8. **Store Panels** - Save to database with full metadata
9. **Update Scene Status** - Mark scene comic status as "draft"

### Quality Evaluation

- **5 Categories**: Pacing, Visual Grammar, Character Consistency, Narrative Clarity, Webtoon Adaptation
- **Scoring**: 1-5 scale per category (1=Weak, 2=Developing, 3=Effective, 4=Strong, 5=Exceptional)
- **Passing Score**: 3.0/5.0 average ("Effective" level)
- **Improvement**: Up to 2 cycles if below threshold

## Usage Examples

### Basic Generation

```bash
# Get a scene ID from your story
dotenv --file .env.local run node scripts/generate-comic-panels.mjs scene_abc123xyz
```

### Preview Before Generating

```bash
# Dry run - see what would be generated
dotenv --file .env.local run node scripts/generate-comic-panels.mjs scene_abc123xyz --dry-run
```

Output:
```
🔍 DRY RUN - Preview of what would be generated:

Scene Information:
  ID: scene_abc123xyz
  Title: The Discovery
  Chapter: chapter_xyz789
  Content length: 1842 characters
  Comic status: none

Generation Pipeline:
  1. Analyze scene content and structure
  2. Generate panel summaries (7-12 panels)
  3. Create panel content (dialogue, SFX, narrative)
  4. Generate panel images (1344×768px, 7:4 ratio)
  5. Optimize images (4 variants: AVIF + JPEG × 2 sizes)
  6. Evaluate quality (5-category rubric)
  7. Improve if needed (up to 2 cycles)
  8. Store panels in database
  9. Update scene comic status

Expected Output:
  - 7-12 comic panels with images
  - 4 optimized variants per image
  - Quality score: 3.0+/5.0
  - Total generation time: 5-15 minutes

💡 Remove --dry-run flag to execute generation
```

### Regenerate Existing Panels

```bash
# Force regeneration (useful for testing improvements)
dotenv --file .env.local run node scripts/generate-comic-panels.mjs scene_abc123xyz --force
```

### Verbose Logging

```bash
# See detailed logs during generation
dotenv --file .env.local run node scripts/generate-comic-panels.mjs scene_abc123xyz --verbose
```

### Background Execution

```bash
# Run in background with log file
dotenv --file .env.local run node scripts/generate-comic-panels.mjs scene_abc123xyz > logs/comic-panels.log 2>&1 &

# Monitor progress
tail -f logs/comic-panels.log
```

## Example Output

### Successful Generation

```
🎬 Comic Panel Generation Script
================================

Scene ID: scene_abc123xyz
Mode: EXECUTE

🔍 Fetching scene data for: scene_abc123xyz
✅ Scene data retrieved:
   Title: The Discovery
   Chapter: chapter_xyz789
   Content: Elena gasped as she uncovered the ancient artifact...
   Image: Yes
   Comic Status: none

🎨 Generating comic panels for scene: The Discovery
   Using Toonplay 9-step pipeline with quality evaluation

   [1/9] Analyzing scene structure...
   [2/9] Generating panel summaries...
   [3/9] Creating panel content...
   ✓ Panel 1: WIDE SHOT - Elena stands at the edge of ancient ruins, sunrise behind her
   ✓ Panel 2: CLOSE-UP - Her fingers trace glowing symbols on weathered stone
   ✓ Panel 3: MEDIUM SHOT - She pulls out a worn journal, comparing notes
   ✓ Panel 4: EXTREME CLOSE-UP - Ancient text begins to shimmer with light
   ✓ Panel 5: WIDE SHOT - The entire wall illuminates, revealing hidden door
   ✓ Panel 6: MEDIUM SHOT - Elena steps back in awe, hand covering mouth
   ✓ Panel 7: CLOSE-UP - Her determined expression as she reaches for door
   ✓ Panel 8: WIDE SHOT - Door slowly opens, golden light spilling out
   [4/9] Generating panel images...
   [5/9] Optimizing images...
   [6/9] Evaluating quality...
   📊 Quality Score: 3.4/5.0
   [7/9] Storing panels...
   [8/9] Updating scene status...

✅ Generation complete!
   Total panels: 8
   Final quality score: 3.4/5.0
   Improvement iterations: 0

⏱️  Generation time: 7.2s

📊 Generation Summary:
   Scene: The Discovery
   Panels created: 8
   Quality score: 3.4/5.0
   Improvement iterations: 0

✨ Comic panels generated successfully!

View comic at: http://localhost:3000/comics/story_123?scene=scene_abc123xyz
```

### Generation with Improvement

```
🎨 Generating comic panels for scene: The Confrontation
   Using Toonplay 9-step pipeline with quality evaluation

   [1/9] Analyzing scene structure...
   [2/9] Generating panel summaries...
   [3/9] Creating panel content...
   ✓ Panel 1: WIDE SHOT - Two figures face each other in dim corridor
   ✓ Panel 2: MEDIUM SHOT - Marcus's jaw clenches, fists at his sides
   ...
   [6/9] Evaluating quality...
   📊 Quality Score: 2.8/5.0
   ⚠️  Below threshold, starting improvement cycle...
   
   🔄 Improvement cycle 1/2 completed
   📊 Quality Score: 3.1/5.0

✅ Generation complete!
   Total panels: 9
   Final quality score: 3.1/5.0
   Improvement iterations: 1

⏱️  Generation time: 12.4s
```

## Output Details

### What Gets Created

**Database Records:**
- Comic panel entries in `comic_panels` table
- Each panel includes:
  - Panel number and position
  - Shot type (WIDE SHOT, CLOSE-UP, MEDIUM SHOT, etc.)
  - Content (dialogue, SFX, narrative)
  - Characters visible in panel
  - Mood/atmosphere description
  - Camera angle and framing
  - Image URL and optimized variants

**Image Files (Vercel Blob):**
- Original: 1344×768px PNG (7:4 aspect ratio)
- Optimized variants (4 per panel):
  - AVIF mobile 1x (672×384)
  - AVIF mobile 2x (1344×768)
  - JPEG mobile 1x (672×384)
  - JPEG mobile 2x (1344×768)

**Scene Updates:**
- `comic_status` changed from "none" to "draft"
- `comic_toonplay` JSON field populated with panel data

## Performance

- **Generation Time**: 5-15 minutes per scene
  - 7-12 panels generated
  - Image generation: ~30-60 seconds per panel
  - Image optimization: ~10-20 seconds per panel
  - Quality evaluation: ~20-30 seconds
  - Improvement cycles: +5-8 minutes if needed

- **Success Rate**:
  - 70-80% pass on first evaluation (score ≥ 3.0)
  - 95%+ pass after 1 improvement cycle
  - 99%+ pass after 2 improvement cycles

## Troubleshooting

### Common Issues

**"Scene not found" error:**
- Verify scene ID exists in database
- Check that scene belongs to a valid story
- Ensure scene has content to generate from

**"Panels already exist" warning:**
- Use `--force` flag to regenerate
- Or use `--dry-run` to preview without warning

**Authentication errors:**
- Check `.auth/user.json` exists
- Verify writer API key is present
- Ensure API key hasn't expired

**Image generation failures:**
- Check `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`
- Verify Gemini API quota isn't exceeded
- Check network connectivity to Google AI API

**Blob storage errors:**
- Verify `BLOB_READ_WRITE_TOKEN` in `.env.local`
- Check Vercel Blob quota limits
- Ensure network connectivity to Vercel

**Quality never passes threshold:**
- Check scene content quality (needs sufficient detail)
- Verify AI model is responding properly
- Check logs for evaluation rubric details

### Debug Mode

```bash
# Enable verbose logging
dotenv --file .env.local run node scripts/generate-comic-panels.mjs SCENE_ID --verbose

# Check API logs
tail -f logs/dev-server.log | grep "generation/toonplay"
```

## Related Scripts

- **list-stories.mjs** - Find scene IDs for your stories
- **get-story-details.mjs** - View story structure with scene IDs
- **remove-all-comic-panels.mjs** - Clean up generated panels
- **check-comic-panels.mjs** - Verify panel data integrity

## API Endpoint

The script calls the Toonplay generation API:

```
POST /studio/api/generation/toonplay
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "sceneId": "scene_abc123xyz"
}
```

Response: Server-Sent Events (SSE) stream with progress updates

## Next Steps

After generating comic panels:

1. **View the comic**: Visit the URL shown in output
2. **Review quality**: Check panels and images in browser
3. **Publish**: Use publish scripts to make comic public
4. **Iterate**: Regenerate with `--force` if improvements needed

## Technical Details

### Toonplay Format

Comics use the "Toonplay" format:
- **70% dialogue** - Character conversations and reactions
- **30% visual action** - Dynamic scenes and movements
- **<5% narration** - Minimal text boxes

### Shot Types Used

- ESTABLISHING SHOT - Set location and atmosphere
- WIDE SHOT - Show full scene and spatial relationships
- MEDIUM SHOT - Focus on characters and interactions
- CLOSE-UP - Emphasize emotions and details
- EXTREME CLOSE-UP - Highlight critical moments
- OVER-THE-SHOULDER - Perspective shots
- POV (Point of View) - Character's viewpoint

### Image Optimization Strategy

Each panel image is optimized for:
- **Mobile-first**: 1x and 2x pixel density variants
- **Format flexibility**: AVIF (modern) + JPEG (fallback)
- **Performance**: 25-30% smaller file sizes vs original
- **Quality**: Maintains visual fidelity at all sizes

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review API endpoint responses
- Verify environment configuration
- Test with `--dry-run` first
