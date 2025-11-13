---
title: Documentation Directory Guide
---

# Documentation Directory Guide

Comprehensive guide to all documentation in the Fictures project. This file provides an overview of every directory and document, making it easy to find the information you need.

## 📋 Documentation Synchronization Principle

**CRITICAL: Documentation MUST stay synchronized with implementation.**

### The Rule

**When you change ANYTHING, update related documents IMMEDIATELY:**

1. **Change Code** → Update corresponding documentation
2. **Add Feature** → Create/update feature documentation
3. **Modify API** → Update API documentation
4. **Update Schema** → Update schema documentation
5. **Change Configuration** → Update setup documentation

### Why This Matters

- **Single Source of Truth**: Documentation defines intended behavior
- **Developer Experience**: Outdated docs lead to confusion and errors
- **Maintenance**: Easier to maintain when docs match reality
- **Onboarding**: New developers learn from documentation first

### How to Keep Docs Synchronized

#### Before Making Changes:
1. Identify which documents will be affected
2. List all related documentation files
3. Plan documentation updates alongside code changes

#### During Implementation:
1. Update documentation as you code (not after)
2. Keep a checklist of docs to update
3. Test examples in documentation

#### After Changes:
1. Review all related documentation
2. Verify examples still work
3. Update timestamps or version numbers if present
4. Commit documentation changes with code changes

### Documentation Types and Update Rules

| Change Type | Documentation to Update | Examples |
|------------|------------------------|----------|
| **API Endpoint** | API specs, usage guides, main CLAUDE.md | Add/modify route → Update API docs |
| **Database Schema** | Schema docs, migration guides, data models | Add table column → Update schema.md |
| **Environment Variable** | Setup guides, configuration docs | New env var → Update .env.example + docs |
| **CLI Script** | scripts/CLAUDE.md, main CLAUDE.md | New script → Add to scripts docs |
| **UI Component** | Component docs, style guides | New component → Document props/usage |
| **Feature** | Feature specification, user guides | New feature → Create/update feature docs |

### Examples of Proper Documentation Updates

#### Example 1: Adding New API Endpoint
```
✅ CORRECT:
1. Plan: New endpoint for scene deletion
2. Update: docs/studio/studio-api-quick-reference.md (add endpoint)
3. Update: CLAUDE.md (add to Key Routes section)
4. Implement: src/app/studio/api/scenes/[id]/route.ts
5. Test: Verify documentation examples work
6. Commit: Both code and documentation together

❌ WRONG:
1. Implement code
2. Commit code
3. "I'll update docs later" ← Never happens
```

#### Example 2: Changing Database Schema
```
✅ CORRECT:
1. Plan: Add emotional_tone to scenes table
2. Update: docs/novels/novels-specification.md (data model)
3. Update: docs/novels/novels-development.md (API changes)
4. Create: Migration file
5. Update: TypeScript interfaces
6. Update: API routes using the field
7. Commit: All changes together

❌ WRONG:
1. Create migration
2. Update code
3. Docs still show old schema ← Confusion ensues
```

#### Example 3: Multi-Environment Architecture (Real Example)
```
✅ WHAT WE DID:
1. Planned: Environment-aware system folder structure
2. Updated: docs/operation/environment-architecture.md FIRST
3. Updated: docs/image/image-generation.md
4. Implemented: blob-path.ts utilities
5. Implemented: image-generation.ts changes
6. Tested: Verified new structure works
7. Committed: Documentation + code together

This approach ensured:
- Documentation defined the design
- Implementation followed documented spec
- No confusion about intended behavior
- Easy to review and understand changes
```

### Quick Checklist for Every Change

- [ ] Identified all affected documentation
- [ ] Updated specifications/guides
- [ ] Updated API documentation
- [ ] Updated examples and code samples
- [ ] Updated main CLAUDE.md if workflow changed
- [ ] Tested examples work
- [ ] Committed docs with code changes

**Remember**: Good documentation saves hours of debugging and confusion. Always update docs FIRST or ALONGSIDE code changes, never after!

---

## 📂 Directory Structure

**Monorepo Documentation Organization:**

```
Fictures/
├── docs/                              # Platform-wide documentation
│   ├── CLAUDE.md                      # This file - Documentation guide
│   ├── monorepo/                      # Monorepo architecture docs
│   └── operation/                     # Platform operations (environment, API keys)
│
├── apps/
│   ├── web/
│   │   ├── CLAUDE.md                  # Web app development guide
│   │   └── docs/                      # Web app documentation
│   │       ├── README.md              # Web docs index
│   │       ├── novels/                # Novel generation (Adversity-Triumph Engine)
│   │       ├── comics/                # Comics generation & display
│   │       ├── studio/                # Studio workspace
│   │       ├── publish/               # Publishing & scheduling
│   │       ├── scene/                 # Scene quality & tracking
│   │       ├── image/                 # Image generation & optimization
│   │       ├── ui/                    # UI components & themes
│   │       ├── mobile/                # Mobile UX improvements
│   │       ├── adsense/               # Google AdSense integration
│   │       ├── analytics/             # Platform analytics setup
│   │       ├── analysis/              # Reader analytics & insights
│   │       ├── auth/                  # Authentication system
│   │       ├── community/             # Community features
│   │       ├── notification/          # User notification system
│   │       ├── performance/           # Performance optimization
│   │       └── test/                  # Testing specifications
│   │
│   └── ai-server/
│       ├── CLAUDE.md                  # AI server development guide
│       └── docs/                      # AI server documentation
│           ├── readme.md              # AI server docs index
│           ├── quick-start.md         # Quick start guide
│           ├── setup.md               # Setup instructions
│           ├── architecture.md        # System architecture
│           ├── api-reference.md       # API documentation
│           └── python-version-guide.md # Python setup guide
```

---

## 📁 Platform-Wide Documentation

This root `docs/` directory contains only platform-wide documentation that applies to the entire monorepo.

### `/monorepo/` - Monorepo Architecture

**Purpose**: Monorepo structure and organization documentation.

**Status**: 📋 Documentation

---

### `/operation/` - Operational Guides

**Purpose**: Platform-wide operational documentation.

**Files**:
- `environment-architecture.md` - Multi-environment architecture (main/develop)
- `google-ai-api-key-setup.md` - Google AI API key setup
- `test-page-protection.md` - Test page security

**Status**: ✅ Implemented

---

## 📁 Application-Specific Documentation

For detailed feature documentation, see the respective app's `docs/` directory:

### Web Application Docs

**Location**: `apps/web/docs/`

**Access**: See [apps/web/docs/README.md](../apps/web/docs/README.md) for complete web app documentation index

**Key Categories**:
- **Story Generation**: novels/, comics/, studio/, publish/, scene/
- **UI/UX**: ui/, mobile/, image/
- **Community**: community/, notification/, auth/
- **Analytics**: adsense/, analytics/, analysis/
- **Performance**: performance/
- **Testing**: test/

### AI Server Docs

**Location**: `apps/ai-server/docs/`

**Access**: See [apps/ai-server/docs/readme.md](../apps/ai-server/docs/readme.md) for AI server documentation

**Key Files**:
- `quick-start.md` - Quick start guide
- `setup.md` - Setup instructions
- `architecture.md` - System architecture
- `api-reference.md` - API documentation
- `python-version-guide.md` - Python setup guide

---

## 📄 Legacy Content (Archived)

The following sections document features that were previously in the root docs directory but have been moved to app-specific locations:

### `/adsense/` → `apps/web/docs/adsense/` - Google AdSense Integration

**Purpose**: Documentation for Google AdSense integration and monetization.

**Files**:
- `google-adsense-complete-guide.md` - Complete guide to AdSense setup, ad placement, and revenue optimization

**Status**: ✅ Implemented

---

### `/analysis/` - Reader Analytics & Insights

**Purpose**: Analytics for story performance and reader engagement.

**Files**:
- `analysis-specification.md` - Analytics feature specifications, metrics, and implementation

**Related**:
- `/analytics/` - Platform-wide analytics (Google Analytics, Vercel Analytics)
- `/scene/scene-view-analysis.md` - Scene-level view analytics

**Status**: 🚧 Partial implementation

---

### `/analytics/` - Platform Analytics Setup

**Purpose**: Setup guides for analytics platforms (Google Analytics, Vercel Analytics).

**Files**:
- `google-analytics-setup.md` - Google Analytics 4 setup and configuration
- `vercel-analytics-setup.md` - Vercel Analytics integration guide

**Status**: ✅ Implemented

---

### `/auth/` - Authentication System

**Purpose**: Authentication profiles and API key management.

**Files**:
- `authentication-profiles.md` - User roles, API keys, and authentication methods

**Related**:
- `operation/environment-architecture.md` - Multi-environment auth structure
- `scripts/setup-auth-users.ts` - Create authentication users
- `scripts/verify-auth-setup.ts` - Verify authentication setup

**Key Concepts**:
- Three roles: Manager (admin:all), Writer (stories:write), Reader (stories:read)
- Dual authentication: API keys + NextAuth sessions
- Multi-environment: Separate profiles for main/develop

**Status**: ✅ Implemented

---

### `/comics/` - Comics Generation & Display

**Purpose**: Comic panel generation using Toonplay methodology and webtoon display.

**Files**:
- `comics-architecture.md` - ⭐ Overview of comics system architecture
- `comics-generation.md` - Panel generation process (9-step pipeline)
- `comics-optimization.md` - Performance optimization for comics
- `comics-toonplay.md` - Toonplay methodology (70% dialogue, 30% visual action)

**Related**:
- `scripts/generate-comic-panels.ts` - Comic panel generation script
- API: `/studio/api/generation/toonplay` - SSE streaming comic generation
- UI: `/comics/[storyId]` - Webtoon reader

**Key Features**:
- 7-12 panels per scene
- Quality evaluation (5-category rubric)
- Mobile-optimized webtoon layout
- Gemini 2.5 Flash image generation (1344×768, 7:4)

**Status**: ✅ Implemented

---

### `/community/` - Community Features

**Purpose**: Story sharing, discussion, and community engagement.

**Files**:
- `community-specification.md` - Community feature specifications
- `community-caching-implementation.md` - Community data caching strategy
- `community-performance-fix.md` - Performance improvements for community features
- `community-metrics-help.md` - Community metrics and analytics

**Features**:
- Story posts and discussions
- Comments and replies
- Likes and bookmarks
- User profiles

**Status**: 🚧 Partial implementation

---

### `/notification/` - User Notification System

**Purpose**: Multi-channel notification system for real-time updates and persistent notifications.

**Files**:
- `notification-specification.md` - ⭐ Complete notification system specification
- `notification-development.md` - Implementation guide with code examples
- `real-time-story-updates.md` - SSE implementation details
- `real-time-implementation-summary.md` - SSE completion report
- `real-time-comparison.md` - Technology comparison (SSE vs WebSocket vs Polling)

**Key Features**:
- **Real-Time Events**: Server-Sent Events (SSE) with Redis Pub/Sub (`<100ms` latency)
- **Notification Types**: Story events, social events, community events, system events
- **Multi-Channel**: In-app real-time, notification center (planned), push (planned), email (planned)
- **User Preferences**: Granular control over notification types and channels
- **Rate Limiting**: Anti-spam protection and notification grouping

**Technology Stack**:
- Server-Sent Events (SSE) via native Web API
- Redis Pub/Sub (ioredis)
- PostgreSQL for persistent notifications
- Web Push API (planned)
- Email notifications (planned)

**Related**:
- `src/lib/redis/client.ts` - Redis infrastructure
- `src/app/api/community/events/route.ts` - SSE endpoint
- `src/lib/hooks/use-community-events.ts` - React SSE client hook
- `src/lib/services/notification-service.ts` - Notification service (planned)

**Status**: 🚧 Partial (Real-time SSE implemented, persistent notifications planned)

---

### `/image/` - Image Generation & Optimization

**Purpose**: AI image generation and multi-variant optimization system.

**Files**:
- `image-architecture.md` - ⭐ Complete image system overview
- `image-generation.md` - Image generation using Gemini 2.5 Flash
- `image-optimization.md` - 4-variant optimization pipeline (AVIF + JPEG × mobile 1x/2x)

**Key Features**:
- Gemini 2.5 Flash image generation (1344×768, 7:4 aspect ratio)
- Automatic optimization: 4 variants per image
- Environment-aware placeholders: `{environment}/system/placeholders/`
- CDN-optimized delivery

**Related**:
- `src/lib/services/image-generation.ts` - Image generation service
- `src/lib/services/image-optimization.ts` - Optimization service
- `src/lib/utils/blob-path.ts` - Blob path utilities

**Status**: ✅ Implemented

---

### `/mobile/` - Mobile UX Improvements

**Purpose**: Mobile-first user experience enhancements.

**Files**:
- `mobile-reading-improvements.md` - Mobile reading experience improvements
- `mobile-improvements-summary.md` - Summary of mobile UX enhancements

**Focus**:
- Touch-optimized controls
- Mobile-first image optimization
- Responsive typography
- Bottom navigation

**Status**: ✅ Implemented

---

### `/novels/` - Novel Generation (Adversity-Triumph Engine)

**Purpose**: AI-powered novel generation using the Adversity-Triumph Engine methodology.

**Files**:
- `novels-specification.md` - ⭐ Core concepts, data model, Adversity-Triumph Engine theory
- `novels-development.md` - API architecture, system prompts, implementation specs
- `novels-evaluation.md` - Validation methods, quality metrics, evaluation strategies
- `novels-optimization.md` - Performance tuning, cost optimization
- `novels-removal.md` - Story deletion workflows
- `character-schema-sync-2025-11-02.md` - Character schema synchronization
- `scene-setting-connection-implementation.md` - Scene-setting connections
- `schema-simplification.md` - Database schema simplification
- `schema-synchronization-strategy.md` - Schema sync strategy across all layers

**Key Concepts**:
- **Adversity-Triumph Engine**: Korean Gam-dong narrative psychology
- **9-Phase Generation**: Story Summary → Characters → Settings → Parts → Chapters → Scene Summaries → Scene Content → Scene Evaluation → Images
- **Moral Framework**: Stories built on tested virtues and meaningful consequences
- **Character Arcs**: Internal flaws → Crisis → Transformation

**Related**:
- `scripts/generate-minimal-story.ts` - Minimal story generation (fastest)
- API: `/studio/api/novels/generate` - Unified generation API with SSE streaming
- UI: `/novels/[storyId]` - Novel reader

**Generation Time**: 5-25 minutes depending on story size

**Status**: ✅ Implemented

---

### `/operation/` - Operational Guides

**Purpose**: Operational documentation for development and deployment.

**Files**:
- `environment-architecture.md` - ⭐ Multi-environment architecture (main/develop)
- `google-ai-api-key-setup.md` - Google Generative AI API key setup guide

**Key Features**:
- NODE_ENV-based environment detection
- Separate authentication profiles per environment
- Environment-prefixed blob storage
- System folder structure with placeholders
- Google AI Studio and Cloud Console API key generation

**Related**:
- `src/lib/utils/environment.ts` - Environment utilities
- `src/lib/utils/blob-path.ts` - Blob path utilities
- `src/lib/utils/auth-loader.ts` - Auth loading utilities
- `scripts/migrate-auth-structure.ts` - Auth migration script
- `scripts/migrate-system-folder.ts` - System folder migration script

**Status**: ✅ Implemented

---

### `/performance/` - Performance Optimization

**Purpose**: Performance optimization guides and implementation reports.

**Files**:
- `performance-caching.md` - Caching strategy (SWR, localStorage, Redis)
- `performance-database.md` - Database optimization (indexes, N+1 fixes)
- `performance-blob-deletion.md` - Blob deletion optimization (10-25x faster)
- `performance-novels.md` - Novel generation performance
- `performance-comics.md` - Comics performance optimization
- `performance-studio.md` - Studio workspace performance
- `performance-community.md` - Community features performance
- `performance-comments.md` - Comments system performance
- `cache-testing-guide.md` - Cache testing procedures
- `IMPLEMENTATION-SUMMARY.md` - Performance implementation summary

**Key Optimizations**:
- 3-layer caching (SWR + localStorage + Redis)
- Database indexes and query optimization
- Batch blob deletion
- Mobile-first image optimization

**Status**: ✅ Implemented

---

### `/publish/` - Publishing & Scheduling

**Purpose**: Weekly scene-by-scene publishing system with automated scheduling.

**Files**:
- `publish-specification.md` - ⭐ What, why, and how - conceptual framework
- `publish-development.md` - Implementation guide with code examples and phases

**Key Features**:
- **Weekly scene scheduling**: Automate scene releases on consistent weekly schedule
- **Timeline visualization**: Beautiful calendar showing scheduled/published scenes
- **Manual controls**: One-click publish/unpublish for individual scenes
- **Vercel cron automation**: Daily cron job publishes scenes at scheduled times
- **Scene-level granularity**: Publish scenes individually (not just chapters)

**Related**:
- Database: `publishingSchedules`, `scheduledPublications` tables
- API: `POST /publish/api/schedules` - Create publishing schedules
- API: `GET /publish/api/timeline` - Get timeline events
- API: `GET /publish/api/cron` - Vercel cron job endpoint
- API: `POST /publish/api/scenes/[id]` - Manual publish scene
- API: `POST /publish/api/scenes/[id]/unpublish` - Unpublish scene
- UI: `/publish` - Publishing center

**Technology**:
- Vercel cron jobs (daily execution at 8:00 AM UTC)
- PostgreSQL queue system
- Weekly release schedules (Monday/Friday recommended)
- Manual override capabilities

**Status**: 📋 Specification complete, implementation pending

---

### `/scene/` - Scene Quality & Tracking

**Purpose**: Scene quality evaluation and view tracking.

**Files**:
- `scene-quality-pipeline.md` - Scene quality evaluation framework
- `scene-evaluation-api.md` - Scene evaluation API documentation
- `scene-view-tracking.md` - Scene view tracking implementation
- `scene-view-analysis.md` - Scene view analytics
- `scene-writing-discipline.md` - Scene writing best practices

**Key Features**:
- **Architectonics of Engagement**: 5-category quality rubric (Plot, Character, Pacing, Prose, World-Building)
- **Scoring**: 1-4 scale (passing: 3.0/4.0)
- **Automatic Evaluation**: All scenes evaluated during generation
- **Iterative Improvement**: Up to 2 improvement cycles
- **View Tracking**: Anonymous view counting and analytics

**Related**:
- `src/lib/services/scene-evaluation-loop.ts` - Evaluation service
- API: `/studio/api/evaluate/scene` - Scene evaluation endpoint

**Status**: ✅ Implemented

---

### `/studio/` - Studio Workspace

**Purpose**: Studio workspace documentation (story creation and management).

**Files**:
- `studio-agent-specification.md` - AI agent specifications
- `studio-agent-development.md` - Agent development guide
- `studio-agent-implementation.md` - Agent implementation details
- `studio-agent-ui.md` - Agent UI components
- `studio-api-quick-reference.md` - ⭐ Quick API reference
- `studio-api-analysis.md` - API architecture analysis

**Features**:
- Story creation and editing
- AI-powered writing assistance
- Character and setting management
- Chapter and scene organization

**Related**:
- UI: `/studio` - Studio dashboard
- UI: `/studio/new` - Create new story
- UI: `/studio/edit/story/[id]` - Edit story

**Status**: ✅ Implemented

---

### `/test/` - Testing Specifications

**Purpose**: Test specifications for automated testing.

**Files**:
- `gnb-menu-test-specification.md` - Global navigation menu test specs

**Related**:
- Playwright tests: `tests/*.spec.ts`
- Jest tests: `__tests__/*.test.ts`

**Status**: 🚧 Partial implementation

---

### `/ui/` - UI Components & Themes

**Purpose**: UI component documentation and design system.

**Files**:
- `README.md` - UI directory overview
- `ui-specification.md` - UI component specifications
- `ui-development.md` - UI development guidelines
- `theme-system.md` - Theme system (light/dark mode)
- `independent-scrolling.md` - Independent scroll implementation

**Key Features**:
- Tailwind CSS v4
- Dark mode support
- Mobile-first responsive design
- Accessibility standards

**Status**: ✅ Implemented

---

## 📄 Project-Level Documents

These documents are in the root `docs/` directory:

### Cache & Performance Reports
- `CACHE-INVALIDATION-ROLLOUT-GUIDE.md` - Cache invalidation deployment guide
- `PHASE1-COMPLETION-REPORT.md` - Phase 1 completion report
- `PHASE2-CACHE-INVALIDATION-FINDINGS.md` - Phase 2 cache findings
- `PHASE2-COMPLETION-REPORT.md` - Phase 2 completion report
- `PHASE2-PROGRESS-REPORT.md` - Phase 2 progress report
- `PHASE2-UPDATE-REPORT.md` - Phase 2 update report
- `ROLLOUT-EXECUTION-REPORT.md` - Rollout execution report

**Status**: ✅ Historical reports (completed phases)

---

## 🔍 Quick Navigation by Topic

### Getting Started
1. **Project Setup**: `/CLAUDE.md` (root) - Main monorepo guide
2. **Web App Setup**: `/apps/web/CLAUDE.md` - Next.js development guide
3. **AI Server Setup**: `/apps/ai-server/CLAUDE.md` - Python development guide
4. **Environment Setup**: `operation/environment-architecture.md` - Platform-wide

### Web Application Features
See [apps/web/docs/README.md](../apps/web/docs/README.md) for complete index.

**Quick Links**:
1. **Novel Generation**: `apps/web/docs/novels/novels-specification.md`
2. **Comics**: `apps/web/docs/comics/comics-architecture.md`
3. **Image System**: `apps/web/docs/image/image-architecture.md`
4. **Studio**: `apps/web/docs/studio/studio-api-quick-reference.md`
5. **Performance**: `apps/web/docs/performance/performance-caching.md`
6. **UI Development**: `apps/web/docs/ui/ui-development.md`

### AI Server
See [apps/ai-server/docs/readme.md](../apps/ai-server/docs/readme.md) for complete guide.

**Quick Links**:
1. **Quick Start**: `apps/ai-server/docs/quick-start.md`
2. **Python Setup**: `apps/ai-server/docs/python-version-guide.md`
3. **Architecture**: `apps/ai-server/docs/architecture.md`
4. **API Reference**: `apps/ai-server/docs/api-reference.md`

---

## 📝 Documentation Best Practices

### File Naming Conventions
- **Use lowercase with hyphens**: `feature-name-specification.md` (NOT `Feature-Name-Specification.md`)
- **Always lowercase filenames**: `readme.md`, `quick-start.md`, `implementation-summary.md`
- **Exception**: Project root `README.md` and `CLAUDE.md` (uppercase for visibility)
- **Use descriptive names**: `novels-development.md` not `dev.md`
- **Group related docs in directories**

**Examples:**
- ✅ `docs/ai-server/quick-start.md`
- ✅ `docs/ai-server/implementation-summary.md`
- ✅ `docs/novels/novels-specification.md`
- ❌ `docs/ai-server/QUICK-START.md`
- ❌ `docs/ai-server/README.MD`
- ❌ `docs/novels/Novels-Specification.md`

**Why lowercase?**
- Consistent across all platforms (case-sensitive filesystems)
- Avoids confusion between `README.md`, `Readme.md`, `readme.md`
- Easier to type and remember
- Standard practice in modern web development

### Document Structure
All documents should include:
1. **Frontmatter** (title, description, etc.)
2. **Overview/Purpose** section
3. **Table of Contents** (for long docs)
4. **Code Examples** (where applicable)
5. **Related Documentation** links
6. **Status** indicator

### Status Indicators
- ✅ **Implemented**: Feature is complete and documented
- 🚧 **Partial**: Feature partially implemented
- 📋 **Specification**: Design doc only, not implemented
- 🏗️ **In Progress**: Currently being developed
- 🔄 **Needs Update**: Documentation needs updating

---

## 🔄 Keeping This File Updated

**When you add/remove/rename documentation:**

1. Update the **Directory Structure** section
2. Add/update entry in **Directory Details**
3. Update **Quick Navigation** if needed
4. Update status indicators
5. Commit this file with your changes

**This file is the master index for all documentation. Keep it synchronized!**

---

## 📚 Related Documentation

- **Main Project Guide**: `/CLAUDE.md` (root) - Monorepo overview
- **Web App Guide**: `/apps/web/CLAUDE.md` - Next.js development
- **Web App Docs Index**: `/apps/web/docs/README.md` - Complete web docs
- **AI Server Guide**: `/apps/ai-server/CLAUDE.md` - Python development
- **AI Server Docs Index**: `/apps/ai-server/docs/readme.md` - Complete AI server docs
- **Scripts Documentation**: `/apps/web/scripts/CLAUDE.md` - Web app scripts

---

**Last Updated**: 2025-11-06
**Status**: ✅ Current (Reorganized for monorepo structure)
