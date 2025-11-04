---
title: Multi-Environment Architecture
---

# Multi-Environment Architecture

Complete documentation for the multi-environment system separating development and production data.

## Overview

The Fictures platform uses a multi-environment architecture to isolate development and production data across:
- **Authentication profiles** - Separate user credentials per environment
- **Vercel Blob storage** - Environment-prefixed file paths

## Environment Detection

**Detection Method:** `NODE_ENV` environment variable

```typescript
NODE_ENV=development → "develop" environment
NODE_ENV=production  → "main" environment
```

**Default:** `develop` (for safety in non-production contexts)

## Architecture Components

### 1. Authentication (.auth/user.json)

**Structure:**
```json
{
  "main": {
    "profiles": {
      "manager": { "email": "...", "password": "...", "apiKey": "..." },
      "writer": { "email": "...", "password": "...", "apiKey": "..." },
      "reader": { "email": "...", "password": "...", "apiKey": "..." }
    }
  },
  "develop": {
    "profiles": {
      "manager": { "email": "...", "password": "...", "apiKey": "..." },
      "writer": { "email": "...", "password": "...", "apiKey": "..." },
      "reader": { "email": "...", "password": "...", "apiKey": "..." }
    }
  }
}
```

**Usage:**
```typescript
import { loadProfile } from '@/lib/utils/auth-loader';
import { getEnvDisplayName } from '@/lib/utils/environment';

// Load profile for current environment
const writer = loadProfile('writer');
console.log(`Environment: ${getEnvDisplayName()}`);
console.log(`API Key: ${writer.apiKey}`);
```

**Scripts:**
- `scripts/setup-auth-users.ts` - Creates users in both environments
- `scripts/verify-auth-setup.ts` - Verifies both environments
- `scripts/migrate-auth-structure.ts` - Migrates old flat structure to new multi-env structure

### 2. Vercel Blob Storage

**Path Structure:**
```
{environment}/stories/{storyId}/{imageType}/{imageId}.png
{environment}/uploads/{userId}/{timestamp}-{filename}
{environment}/system/placeholders/{imageType}-{variant}.png
```

**Examples:**
```
develop/stories/story_abc123/scene/scene_xyz789.png
develop/uploads/usr_123/1234567890-avatar.jpg
develop/system/placeholders/character-default.png
main/stories/story_def456/character/char_abc123.png
main/system/placeholders/scene-illustration.png
```

**Blob Path Utilities:**

```typescript
import { getBlobPath } from '@/lib/utils/blob-path';

// Simple path construction
const relativePath = 'stories/story_123/scene/image.png';
const fullPath = getBlobPath(relativePath);
// Returns: "develop/stories/story_123/scene/image.png" (in develop)
// Returns: "main/stories/story_123/scene/image.png" (in production)

// Helper functions
import {
  getStoryCoverPath,
  getSceneImagePath,
  getCharacterPortraitPath,
  getSettingVisualPath,
  getComicPanelPath,
  getEnvironmentPrefix,
  getStoryBlobPrefix,
  getSystemPlaceholderPath,
  getSystemPlaceholderUrl
} from '@/lib/utils/blob-path';

// Story cover
const coverPath = getStoryCoverPath('story_123');
// Returns: "develop/stories/story_123/cover.png"

// Scene image
const scenePath = getSceneImagePath('story_123', 'scene_456');
// Returns: "develop/stories/story_123/scenes/scene_456/image.png"

// System placeholder path
const placeholderPath = getSystemPlaceholderPath('character');
// Returns: "develop/system/placeholders/character-default.png"

// System placeholder URL
const placeholderUrl = getSystemPlaceholderUrl('character');
// Returns: "https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/develop/system/placeholders/character-default.png"

// Environment prefix for listing
const prefix = getEnvironmentPrefix();
// Returns: "develop/"

// Story-specific prefix for deletion
const storyPrefix = getStoryBlobPrefix('story_123');
// Returns: "develop/stories/story_123/"
```

### 3. Core Utilities

#### environment.ts
```typescript
import { getFicturesEnv, getEnvDisplayName, isMainEnv, isDevelopEnv } from '@/lib/utils/environment';

const env = getFicturesEnv(); // 'main' | 'develop'
const displayName = getEnvDisplayName(); // 'Production' | 'Development'
const isProd = isMainEnv(); // boolean
const isDev = isDevelopEnv(); // boolean
```

#### auth-loader.ts
```typescript
import {
  loadAuthData,
  loadProfiles,
  loadProfile,
  saveAuthData,
  updateProfiles,
  updateProfile
} from '@/lib/utils/auth-loader';

// Load all profiles for current environment
const profiles = loadProfiles(); // { manager, writer, reader }

// Load specific profile
const writer = loadProfile('writer');

// Load profile for specific environment
const mainWriter = loadProfile('writer', 'main');
```

#### blob-path.ts
```typescript
import {
  getBlobPath,
  getStoryCoverPath,
  getSceneImagePath,
  getCharacterPortraitPath,
  getSettingVisualPath,
  getComicPanelPath,
  getEnvironmentPrefix,
  getStoryBlobPrefix,
  extractEnvironmentFromUrl,
  isBlobPathInEnvironment
} from '@/lib/utils/blob-path';

// All functions automatically use current environment
// Optional env parameter for explicit environment selection
```

## Updated Components

### Scripts
All scripts use environment-aware authentication:
- ✅ `scripts/setup-auth-users.ts`
- ✅ `scripts/verify-auth-setup.ts`
- ✅ `scripts/generate-minimal-story.ts`
- ✅ `scripts/generate-comic-panels.ts`
- ✅ `scripts/reset-all-stories.ts`

### Services
All services use environment-aware blob paths:
- ✅ `src/lib/services/image-generation.ts`
- ✅ `src/lib/services/image-optimization.ts`

### API Routes
All API routes use environment-aware blob operations:
- ✅ `src/app/api/upload/image/route.ts`
- ✅ `src/app/studio/api/stories/[id]/route.ts` (deletion uses URLs - already compatible)
- ✅ `src/app/studio/api/reset-all/route.ts`

## Migration Guide

### From Old to New Auth Structure

**Run migration script:**
```bash
pnpm exec tsx scripts/migrate-auth-structure.ts --dry-run  # Preview
pnpm exec tsx scripts/migrate-auth-structure.ts            # Execute
```

**What it does:**
- Creates backup: `.auth/user.json.backup`
- Transforms flat structure to main/develop structure
- Duplicates credentials to both environments initially

**Manual migration:**
```json
// OLD FORMAT
{
  "profiles": {
    "manager": { ... },
    "writer": { ... },
    "reader": { ... }
  }
}

// NEW FORMAT
{
  "main": {
    "profiles": {
      "manager": { ... },
      "writer": { ... },
      "reader": { ... }
    }
  },
  "develop": {
    "profiles": {
      "manager": { ... },
      "writer": { ... },
      "reader": { ... }
    }
  }
}
```

### Existing Blob Files

**Note:** Existing blob files without environment prefixes will NOT be accessible after migration. You need to:

1. **Option A: Move existing files** (recommended for production)
   ```typescript
   // Manual process - list, copy, delete
   // Use Vercel Blob API or dashboard
   ```

2. **Option B: Regenerate content** (recommended for development)
   ```bash
   # Delete all stories
   dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm

   # Regenerate with new paths
   dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts
   ```

## Development Workflow

### Local Development (develop environment)

```bash
# Set environment (usually in .env.local)
NODE_ENV=development

# Start dev server
dotenv --file .env.local run pnpm dev

# Generate test data
dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts

# All data goes to develop/ prefix
# File: develop/stories/story_123/scene/image.png
```

### Production (main environment)

```bash
# Set environment (in production .env)
NODE_ENV=production

# Deploy to Vercel
vercel --prod

# All data goes to main/ prefix
# File: main/stories/story_123/scene/image.png
```

## Environment Variables

**Required in .env.local:**
```bash
NODE_ENV=development  # or production
DATABASE_URL=***
DATABASE_URL_UNPOOLED=***
BLOB_READ_WRITE_TOKEN=***
GOOGLE_GENERATIVE_AI_API_KEY=***
AI_GATEWAY_API_KEY=***
```

**No additional environment variables needed!** The system uses `NODE_ENV` which is standard.

## Data Isolation

### Benefits

1. **Safety:** Development testing doesn't affect production data
2. **Clean separation:** Easy to identify environment from blob URLs
3. **Independent cleanup:** Can reset develop environment without touching main
4. **Debugging:** Environment visible in blob URLs and logs

### Blob Storage Structure

```
Vercel Blob Root
├── main/
│   ├── system/
│   │   └── placeholders/
│   │       ├── character-default.png
│   │       ├── scene-illustration.png
│   │       ├── setting-visual.png
│   │       └── story-cover.png
│   ├── stories/
│   │   └── story_abc123/
│   │       ├── cover.png
│   │       ├── scene/
│   │       ├── character/
│   │       └── setting/
│   └── uploads/
│       └── usr_123/
└── develop/
    ├── system/
    │   └── placeholders/
    │       ├── character-default.png
    │       ├── scene-illustration.png
    │       ├── setting-visual.png
    │       └── story-cover.png
    ├── stories/
    │   └── story_xyz789/
    │       ├── cover.png
    │       ├── scene/
    │       ├── character/
    │       └── setting/
    └── uploads/
        └── usr_456/
```

**System Folder Migration:**
- Legacy `system/` folder → Copied to `main/system/` and `develop/system/`
- Migration script: `scripts/migrate-system-folder.ts`
- After migration, legacy `system/` folder can be safely removed

## Troubleshooting

### Auth file not found
```bash
# Create auth file with both environments
dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts
```

### Wrong environment
```bash
# Check current environment
node -e "console.log(process.env.NODE_ENV)"

# Verify .env.local has correct NODE_ENV
cat .env.local | grep NODE_ENV
```

### Images not found
```bash
# Check blob path includes correct environment prefix
# develop: develop/stories/...
# main: main/stories/...

# Verify environment in logs:
# Scripts show: "🌍 Environment: Development" or "Production"
```

### Migration issues
```bash
# Check backup was created
ls -la .auth/user.json.backup

# Verify migration completed
pnpm exec tsx scripts/verify-auth-setup.ts
```

## Best Practices

1. **Always use utility functions** - Never construct blob paths manually
2. **Test in develop first** - Always test changes in develop environment
3. **Separate credentials** - Use different API keys for main vs develop (security)
4. **Monitor environment** - Scripts show current environment in logs
5. **Clean up develop** - Regularly reset develop environment to save storage costs

## Security Considerations

1. **Same credentials initially** - Migration duplicates credentials to both environments
2. **Recommendation:** Generate separate API keys for main environment in production
3. **API key rotation:** Update `.auth/user.json` and regenerate users
4. **Gitignored:** `.auth/user.json` is never committed to repository

## Related Documentation

- **Scripts:** [scripts/CLAUDE.md](../scripts/CLAUDE.md)
- **Image System:** [docs/image/image-architecture.mdx](image/image-architecture.mdx)
- **Main Guide:** [CLAUDE.md](../CLAUDE.md)

---

**Implementation Date:** 2025-11-04
**Author:** Multi-environment refactoring
**Status:** ✅ Complete
