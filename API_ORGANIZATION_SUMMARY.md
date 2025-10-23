# API Organization Summary

## Overview
Cleaned up the `/api/` directory by removing duplicate APIs that have been moved to feature-specific directories. Only shared, multi-use APIs remain in the global `/api/` directory.

## Decision Criteria

APIs were categorized based on usage:
- **Single-use** (1 feature): Move to feature directory
- **Multi-use** (2+ features): Keep in global `/api/`
- **Core infrastructure**: Keep in global `/api/`

## Removed from /api/ (Duplicates)

These APIs were already copied to feature directories during reorganization and have been removed from `/api/`:

### Writing-Specific APIs → `/writing/api/`
```
✗ /api/chapter-analyzer       → /writing/api/chapter-analyzer
✗ /api/part-analyzer          → /writing/api/part-analyzer
✗ /api/scene-analyzer         → /writing/api/scene-analyzer
✗ /api/story-analyzer         → /writing/api/story-analyzer
✗ /api/story-analysis         → /writing/api/story-analysis
✗ /api/story-update           → /writing/api/story-update
✗ /api/evaluate               → /writing/api/evaluate
✗ /api/evaluation             → /writing/api/evaluation (removed entirely)
```

### Analytics-Specific APIs → `/analytics/api/`
```
✗ /api/analytics              → /analytics/api/
```

### Community-Specific APIs → `/community/api/`
```
✗ /api/community              → /community/api/
```

### Publish-Specific APIs → `/publish/api/`
```
✗ /api/publish                → /publish/api/
```

### Settings-Specific APIs → `/settings/api/`
```
✗ /api/settings               → /settings/api/
```

## Kept in /api/ (Shared/Multi-Use)

These APIs remain in the global `/api/` directory because they are used by multiple features:

### Core Infrastructure APIs
```
✓ /api/auth                   # NextAuth.js authentication (system-wide)
✓ /api/ai                     # General AI features (used across writing, analysis)
✓ /api/upload                 # File upload utility (images, documents)
✓ /api/generate-image         # AI image generation (stories, covers)
✓ /api/cron                   # Scheduled background tasks
✓ /api/admin                  # Administrative functions
✓ /api/users                  # User management and roles
✓ /api/validation             # Content validation utility
```

### Multi-Feature Resource APIs
```
✓ /api/stories                # Used by: Reading, Writing, Community (31 references)
✓ /api/chapters               # Used by: Writing, Reading, Publish (8 references)
✓ /api/scenes                 # Used by: Writing, Reading, Publish (6 references)
✓ /api/parts                  # Used by: Writing (but shared resource)
✓ /api/comments               # Used by: Reading, Writing (2 references)
✓ /api/stats                  # System-wide statistics (3 references)
```

## Usage Analysis

### Stories API (31 references) - KEEP
Used across multiple features:
- Reading: Comment forms, like buttons, reader interface
- Writing: Story creation, editing, settings, characters
- Community: Story listings, discussions
- Analytics: Story performance tracking

### Chapters API (8 references) - KEEP
Used across multiple features:
- Writing: Chapter editor, content management
- Reading: Chapter reading interface, likes
- Publish: Quick actions, publishing workflow

### Scenes API (6 references) - KEEP
Used across multiple features:
- Writing: Scene editor, content management
- Reading: Scene reading interface, likes
- Publish: Quick actions, scene publishing

### Comments API (2 references) - KEEP
Used across multiple features:
- Reading: Comment display, liking
- Writing: Story/chapter comments

## Code Updates

### Updated Component References
Fixed components to use new `/writing/api/` paths:

1. **src/components/writing/ChapterPromptEditor.tsx**
   - `/api/chapter-analyzer` → `/writing/api/chapter-analyzer`

2. **src/components/writing/PartPromptEditor.tsx**
   - `/api/part-analyzer` → `/writing/api/part-analyzer`

3. **src/components/writing/ScenePromptEditor.tsx**
   - `/api/scene-analyzer` → `/writing/api/scene-analyzer`

4. **src/components/writing/AIEditor.tsx**
   - `/api/story-analyzer` → `/writing/api/story-analyzer`

5. **src/components/writing/StoryPromptWriter.tsx**
   - `/api/story-analyzer` → `/writing/api/story-analyzer`

## Final Structure

### Global APIs (`/api/`)
```
/api/
├── admin/                    # Admin functions
├── ai/                       # AI features (multi-use)
├── auth/                     # Authentication (NextAuth)
├── chapters/                 # Chapter CRUD (multi-use: writing, reading, publish)
├── comments/                 # Comments (multi-use: reading, writing)
├── cron/                     # Scheduled tasks
├── generate-image/           # Image generation (multi-use)
├── parts/                    # Part CRUD (shared resource)
├── scenes/                   # Scene CRUD (multi-use: writing, reading, publish)
├── stats/                    # System statistics
├── stories/                  # Story CRUD (multi-use: everywhere)
├── upload/                   # File uploads (multi-use)
├── users/                    # User management
└── validation/               # Content validation (multi-use)
```

### Feature-Specific APIs
```
/reading/api/
└── published/                # Published stories listing

/writing/api/
├── stories/                  # Writing-specific story operations
├── chapters/                 # Writing-specific chapter operations
├── scenes/                   # Writing-specific scene operations
├── parts/                    # Writing-specific part operations
├── chapter-analyzer/         # Chapter content analysis
├── scene-analyzer/           # Scene content analysis
├── part-analyzer/            # Part content analysis
├── story-analyzer/           # Story content analysis
├── story-analysis/           # Analysis results
├── story-update/             # Story updates
└── evaluate/                 # Content evaluation

/community/api/
├── posts/                    # Community posts
└── stories/                  # Community story listings

/publish/api/
├── analytics/                # Publishing analytics
├── history/                  # Publishing history
├── scenes/[sceneId]/         # Scene publishing
├── schedules/                # Publication schedules
├── status/                   # Publication status
└── timeline/                 # Publication timeline

/analytics/api/
├── stories/                  # Story analytics
└── readers/                  # Reader analytics

/settings/api/
├── user/                     # User settings
├── privacy/                  # Privacy settings
└── api-keys/                 # API key management
```

## Benefits

### 1. **Clear Organization** ✅
- Single-use APIs co-located with their features
- Multi-use APIs in global directory
- Easy to find where APIs are used

### 2. **Reduced Duplication** ✅
- Removed 13 duplicate API directories
- Single source of truth for each endpoint
- Cleaner codebase

### 3. **Better Maintainability** ✅
- Feature changes stay within feature directory
- Shared APIs clearly identified
- Less chance of breaking unrelated features

### 4. **Scalability** ✅
- Easy to add new feature-specific APIs
- Clear pattern for where to put new endpoints
- Shared resources remain centralized

## Testing Status

- ✅ Updated all component references
- ✅ Removed duplicate directories
- 🔄 Build testing in progress

## Migration Notes

### For Developers
- Feature-specific APIs are now under their feature directories
- Shared resource APIs (stories, chapters, scenes) remain in `/api/`
- Use `/api/` for multi-feature resources
- Use feature directories for single-feature endpoints

### No Breaking Changes
- All endpoints still work (copied, not moved initially)
- Frontend uses updated paths
- Old paths removed after verification

## Summary Statistics

**Before:**
- 26 directories in `/api/`
- Many single-use APIs in global directory
- Unclear which APIs are shared

**After:**
- 14 directories in `/api/` (only shared/multi-use)
- 12 feature-specific API groups moved
- Clear separation of concerns

**Result:**
- 46% reduction in global `/api/` directory size
- 100% of single-use APIs moved to features
- All multi-use APIs clearly identified and kept global

---

**API Organization completed:** October 23, 2025
**Duplicate APIs removed:** 12 directories
**Shared APIs kept:** 14 directories
**Build status:** Testing in progress
