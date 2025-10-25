---
name: story-remover
description: Remove stories with complete cleanup of database records, Vercel Blob images, and all related data (likes, dislikes, replies, community posts). Use when user asks to remove, delete, or clean up a story.
---

# Story Remover

Remove stories completely including all database records, Vercel Blob storage images, and related data (likes, dislikes, replies, community posts).

## When to Use This Skill

Activate this skill when the user requests:
- "remove a story..."
- "delete a story..."
- "clean up story..."
- "remove all stories..."
- Any story deletion/cleanup request

## Story Removal Workflow

### 1. Identify Target Stories

**Single story removal:**
Ask for story ID or title if not provided:
```
Which story would you like to remove? Please provide the story ID or title.
```

**Multiple/all stories removal:**
Confirm the scope:
```
⚠️ This will remove [X] stories and all related data:
- Database records (parts, chapters, scenes, characters, settings)
- Vercel Blob images (character portraits, setting visuals)
- Community data (posts, likes, replies)

Are you sure you want to proceed? (yes/no)
```

### 2. Run Removal Script

**For single story:**
```bash
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID > logs/story-removal.log 2>&1 &
```

**For all stories (with confirmation):**
```bash
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm > logs/story-removal.log 2>&1 &
```

### 3. Monitor Progress

The script provides real-time updates:
- 🔍 Finding story and related data
- 🗑️ Removing database records
- 📦 Deleting Vercel Blob images
- 🧹 Cleaning up community data
- ✅ Removal complete

### 4. Report Results

Extract from output and present:
- Story ID and title (removed)
- Records deleted (parts, chapters, scenes, characters, settings)
- Images deleted from Vercel Blob
- Community data removed (posts, likes, replies)

## Data Removal Scope

**Database Tables Cleaned:**
1. **stories** - Main story record
2. **parts** - Story parts/acts
3. **chapters** - Story chapters
4. **scenes** - Chapter scenes
5. **characters** - Story characters
6. **settings** - Story settings/locations
7. **aiInteractions** - AI writing assistance history
8. **communityPosts** - Community story posts
9. **communityLikes** - Post likes/dislikes
10. **communityReplies** - Post replies
11. **storyBookmarks** - User bookmarks
12. **storyLikes** - Story likes
13. **readingSessions** - Reading analytics
14. **storyInsights** - Analytics insights

**Vercel Blob Storage:**
- Character portrait images (1024x1024 PNG)
- Setting environment images (1792x1024 PNG, 16:9)
- Any other story-related images

## Response Templates

### For Single Story Removal

```
I'll remove the story "[Title]" and all related data.

This includes:
- 📚 Story structure (parts, chapters, scenes)
- 👥 Characters ([N] characters, [M] with images)
- 🏞️ Settings ([P] settings, [Q] with images)
- 💬 Community data (posts, likes, replies)
- 📦 Vercel Blob images

[Monitor progress and report key milestones]

✅ Story removed successfully!

**Cleanup Summary:**
- Story: [Title] (ID: [storyId])
- Database records deleted: [N]
- Blob images deleted: [M]
- Community posts removed: [P]
- Likes/replies removed: [Q]

The story and all related data have been permanently removed.
```

### For Multiple Stories Removal

```
⚠️ You're about to remove [X] stories:

[List of story titles and IDs]

This will permanently delete:
- All story content and structure
- [N] total characters with images
- [M] total settings with images
- All community posts and interactions
- All Vercel Blob images

Type 'yes' to confirm removal.

[After confirmation]

Removing [X] stories...

[Monitor progress for each story]

✅ All stories removed successfully!

**Cleanup Summary:**
- Stories removed: [X]
- Total database records: [N]
- Total blob images: [M]
- Total community data: [P]

All data has been permanently removed.
```

## Technical Details

**Scripts:**
- `scripts/remove-story.mjs` - Single story removal
- `scripts/remove-all-stories.mjs` - Bulk story removal

**APIs:**
- `DELETE /api/stories/{id}` - Story deletion endpoint
- `DELETE /api/stories/bulk` - Bulk deletion endpoint

**Authentication:**
- Uses writer@fictures.xyz credentials from `.auth/user.json`
- Required scopes: stories:delete, admin:delete

**Database Operations:**
- Cascading deletes for related records
- Transaction-based to ensure atomicity
- Foreign key constraints respected

**Blob Storage:**
- Extracts image URLs from character/setting records
- Deletes from Vercel Blob using blob IDs
- Handles missing/already-deleted images gracefully

## Safety Features

1. **Confirmation prompts** for bulk operations
2. **Dry-run mode** to preview what will be deleted
3. **Transaction rollback** on errors
4. **Audit logging** of deletions
5. **Backup option** before removal (optional)

## Error Handling

### Story Not Found
```
❌ Story not found.

The story ID "[storyId]" doesn't exist in the database.
Please verify the story ID and try again.
```

### Partial Deletion Error
```
⚠️ Partial deletion occurred.

Database records were removed, but some Blob images failed to delete:
- Failed images: [list of URLs]

The story data is removed, but orphaned images may remain in Blob storage.
You can manually delete them from the Vercel dashboard.
```

### Permission Error
```
❌ Permission denied.

You don't have permission to delete this story.
Only the story author or admins can remove stories.
```

## Example Interactions

**Example 1: Remove Single Story**

User: "Remove the mystery story I just created"

Response: Find the most recent mystery story → confirm → remove with full cleanup → report results.

**Example 2: Remove All Stories**

User: "Delete all my test stories"

Response: Find all stories → list them → request confirmation → remove all with progress updates → summary report.

**Example 3: Remove with Blob Cleanup**

User: "Clean up story XYZ and all its images"

Response: Remove story XYZ → delete all character/setting images from Vercel Blob → report cleanup summary.

## Best Practices

1. **Always confirm** before removing stories
2. **List what will be deleted** for transparency
3. **Report progress** during bulk operations
4. **Verify completion** and handle errors gracefully
5. **Provide actionable errors** if issues occur

## Dry-Run Mode

For testing or verification before actual deletion:

```bash
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run
```

This will:
- List all records that would be deleted
- Show all Blob images that would be removed
- Not actually delete anything

## Troubleshooting

**Q: Can I recover a deleted story?**
A: No, deletion is permanent. Consider using dry-run mode first or implement backup before deletion.

**Q: Some images weren't deleted**
A: Check Vercel Blob dashboard and manually delete orphaned images. The script logs failed deletions.

**Q: Database records remain after deletion**
A: Check for foreign key constraint violations. The script should handle cascading deletes, but verify schema relationships.

## Notes

- Deletion is **permanent** and **irreversible**
- All related data is removed to prevent orphaned records
- Vercel Blob images are deleted to save storage costs
- Community interactions (likes, replies) are removed
- Consider implementing soft-delete for recovery options
- Audit logs track who deleted what and when
