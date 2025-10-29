# Story Generator Updates - URL Fixes & Publishing Feature

## Overview

Updated the story generator skill and script to use correct Next.js routes and added auto-publishing functionality.

## Changes Made

### 1. Fixed URLs

**Corrected Routes:**
- ❌ OLD: `/stories/{id}` → ✅ NEW: `/writing` (all stories)
- ❌ OLD: `/write/{id}` → ✅ NEW: `/writing/{id}` (edit story)
- ❌ OLD: `/read/{id}` → ✅ NEW: `/reading/{id}` (read story)
- ✅ NEW: `/community/story/{id}` (community view - published only)

### 2. Added Publishing Functionality

**New `--publish` Flag:**
```bash
# Generate as draft (default)
dotenv --file .env.local run node scripts/generate-complete-story.mjs "Story prompt"

# Generate and publish
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "Story prompt"
```

**Publishing API:**
- Endpoint: `PUT /api/stories/{id}/visibility`
- Request: `{ "isPublic": true }`
- Response: Story status changes from `writing` to `published`

### 3. Updated Claude Code Skill

**Smart Auto-Publishing:**
- User says **"create"** → Auto-publish
- User says **"generate"** or **"write"** → Draft only
- User explicitly mentions **"publish"** → Auto-publish

**Example Interactions:**

| User Request | Skill Action | Result |
|--------------|-------------|---------|
| "Generate a mystery story" | Run without `--publish` | Draft story |
| "Create a mystery story" | Run with `--publish` | Published story |
| "Write a sci-fi story" | Run without `--publish` | Draft story |
| "Generate and publish..." | Run with `--publish` | Published story |

### 4. Enhanced Script Output

**New Features:**
- Shows publication status in summary
- Different link sets for draft vs published
- Community link only shown for published stories
- Clear status indicators (✏️ Draft vs 📢 Published)

**Example Output:**
```
✅ Story generated successfully!
📤 Publishing story XFP0rSnqjdjg-ijs61eaz...
✅ Story published successfully! Status: published

📖 STORY DETAILS:
   ID: XFP0rSnqjdjg-ijs61eaz
   Title: The Stolen Canvas
   Genre: Mystery, Crime
   Status: 📢 Published

🔗 DIRECT LINKS:
   📝 Edit story: http://localhost:3000/writing/XFP0rSnqjdjg-ijs61eaz
   📖 Read story: http://localhost:3000/reading/XFP0rSnqjdjg-ijs61eaz
   🌐 Community: http://localhost:3000/community/story/XFP0rSnqjdjg-ijs61eaz
   📋 All stories: http://localhost:3000/writing

🎉 Story published and available to the community!
```

## Updated Files

### Script Files
- `scripts/generate-complete-story.mjs`
  - Added `publishStory()` function
  - Added `--publish` flag support
  - Updated `printFinalSummary()` with correct URLs
  - Added publication status parameter

### Skill Files
- `.claude/skills/story-generator.md`
  - Complete rewrite following Claude Code best practices
  - Added auto-publish logic for "create" requests
  - Updated all URLs to match actual routes
  - Added comprehensive examples and templates
  - Improved error handling guidance

### Documentation
- `CLAUDE.md`
  - Updated Story Generation section
  - Added correct routes documentation
  - Added `--publish` flag documentation
  - Added skill behavior explanation

- `scripts/README.md`
  - Updated usage examples
  - Added `--publish` flag examples
  - Updated output examples with correct URLs

- `docs/story-generator-updates.md`
  - This summary document

## Testing

**Test Scenario 1: Draft Generation**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs "A short mystery story"
```
Result: ✅ Story created with status `writing` (draft)

**Test Scenario 2: Published Generation**
```bash
dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "A short mystery story"
```
Result: ✅ Story created and published with status `published`

## Claude Code Skill Usage

### Via Skill Invocation

**User:** "Create a fantasy story about dragons"

**Claude Response:**
1. Recognizes "create" → will auto-publish
2. Runs: `dotenv --file .env.local run node scripts/generate-complete-story.mjs --publish "fantasy story about dragons"`
3. Monitors progress
4. Reports: Published story with community link

**User:** "Generate a sci-fi story about space"

**Claude Response:**
1. Recognizes "generate" → will create draft
2. Runs: `dotenv --file .env.local run node scripts/generate-complete-story.mjs "sci-fi story about space"`
3. Monitors progress
4. Reports: Draft story without community link

## Benefits

### Correct URLs
- ✅ All links now work correctly
- ✅ Users can navigate directly to their stories
- ✅ Consistent with Next.js app routing

### Smart Publishing
- ✅ Auto-publishes when user says "create"
- ✅ Keeps drafts private by default
- ✅ Clear distinction between draft and published
- ✅ Community integration for published stories

### Better UX
- ✅ Clear status indicators
- ✅ Appropriate links for each status
- ✅ Helpful tips and suggestions
- ✅ Error messages with solutions

## Best Practices Applied

Based on Claude Code skill best practices research:

1. **Clear Descriptions** - Skill explains what it does upfront
2. **Smart Discovery** - Skill knows when to activate based on user intent
3. **Progressive Disclosure** - Different detail levels for different requests
4. **Error Recovery** - Actionable error messages
5. **User Guidance** - Templates and examples for common scenarios
6. **Tool Integration** - Proper use of background processes and logging

## Technical Implementation

### Publishing Flow

1. **Generation Complete** → Story ID returned
2. **Check Publish Flag** → `--publish` present?
3. **If Yes:**
   - Call `publishStory(storyId, apiUrl)`
   - Make PUT request to `/api/stories/{id}/visibility`
   - Send `{ "isPublic": true }`
   - Update status to `published`
4. **Report Results** → Show appropriate links

### API Integration

```javascript
async function publishStory(storyId, apiUrl) {
  const response = await fetch(`${apiUrl}/api/stories/${storyId}/visibility`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ isPublic: true })
  });

  if (!response.ok) {
    throw new Error(`Failed to publish: ${response.status}`);
  }

  return await response.json();
}
```

## Future Enhancements

Potential improvements:
1. **Unpublish Command** - Allow unpublishing stories
2. **Batch Publishing** - Publish multiple stories at once
3. **Scheduled Publishing** - Publish at specific times
4. **Visibility Levels** - More granular visibility control (private, unlisted, public)
5. **Publication Settings** - Custom publishing options (featured, categories, etc.)

## Migration Guide

### For Existing Scripts

Old scripts using wrong URLs should be updated:

```bash
# OLD
echo "View at: http://localhost:3000/stories/${storyId}"

# NEW
echo "View at: http://localhost:3000/writing/${storyId}"
```

### For Claude Code Usage

Users should now say:
- "Create" when they want published stories
- "Generate" or "write" when they want drafts

## Conclusion

The story generator skill now:
- ✅ Uses correct Next.js routes
- ✅ Supports auto-publishing
- ✅ Follows Claude Code best practices
- ✅ Provides better user experience
- ✅ Offers clear status indicators
- ✅ Includes comprehensive documentation

All URLs are now correct and functional, and the publishing feature seamlessly integrates with the story generation workflow.

---

**Updated:** October 25, 2025
**Files Modified:** 5
**New Features:** Auto-publish, correct URLs, enhanced UX
