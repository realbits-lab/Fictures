# Fictures Documentation Index

Complete documentation for the Fictures AI-powered story writing platform.

---

## Quick Start

- **[CLAUDE.md](../CLAUDE.md)** - Project overview and development guidelines for Claude Code
- **[Getting Started](#setup--configuration)** - Environment setup and configuration
- **[Core Features](#feature-specifications)** - Main platform features

---

## Setup & Configuration

### Environment & Tools
- **[claude-code-skills-setup.md](claude-code-skills-setup.md)** - Claude Code skills installation and usage

### Authentication & APIs
- **[authentication-profiles.md](authentication-profiles.md)** - User authentication profiles and role management
- **[google-analytics-setup.md](google-analytics-setup.md)** - Google Analytics 4 integration
- **[vercel-analytics-setup.md](vercel-analytics-setup.md)** - Vercel Analytics integration
- **[google-adsense-complete-guide.md](google-adsense-complete-guide.md)** - Google AdSense monetization setup

---

## Feature Specifications

### Core Story System
- **[story-specification.md](story-specification.md)** - Story structure, HNS methodology, parts/chapters/scenes
- **[parts-chapters-necessity-analysis.md](parts-chapters-necessity-analysis.md)** - Analysis of story hierarchy necessity

### Reading Experience
- **[reading-specification.md](reading-specification.md)** - ✅ Reading UI, mobile responsiveness, comments, like/dislike
  - Mobile navigation implementation (always-visible bottom nav)
  - Reply features and threaded comments
  - Engagement features (likes)

### Community Features
- **[community-specification.md](community-specification.md)** - Community posts, sharing, discussions, rich text editor
- **[publish-specification.md](publish-specification.md)** - Story publishing workflow and permissions

### Analytics & Insights
- **[analytics-specification.md](analytics-specification.md)** - Analytics dashboard, AI insights, quality metrics

---

## AI & Image Generation

### Complete Guides
- **[image-system-guide.md](image-system-guide.md)** - ⭐ START HERE - Complete image system overview

### Detailed References
- **[image-generation-guide.md](image-generation-guide.md)** - Quick start for AI image generation
- **[story-image-generation.md](story-image-generation.md)** - DALL-E 3 integration and implementation
- **[image-optimization.md](image-optimization.md)** - ✅ 18-variant optimization system (AVIF/WebP/JPEG)
- **[image-prompt-specification.md](image-prompt-specification.md)** - Image prompt templates and best practices
- **[image-generation-aspect-ratio.md](image-generation-aspect-ratio.md)** - Aspect ratio requirements (16:9, 1:1)
- **[comic-panel-generation.md](comic-panel-generation.md)** - Comic panel-specific image generation

### Scene Quality
- **[scene-evaluation-api.md](scene-evaluation-api.md)** - ✅ Automated scene quality evaluation (Architectonics of Engagement)
- **[qualitative-evaluation-framework.md](qualitative-evaluation-framework.md)** - Quality assessment framework
- **[scene-writing-discipline.md](scene-writing-discipline.md)** - Best practices for scene writing

### Story Generation
- **[story-generator-skill.md](story-generator-skill.md)** - Claude Code skill for complete story generation
- **[story-generator-updates.md](story-generator-updates.md)** - Story generation updates and improvements

### APIs & Downloads
- **[story-download-api.md](story-download-api.md)** - Export stories with images (JSON, Markdown, PDF)
- **[ai-sdk-persistent-chat-history.md](ai-sdk-persistent-chat-history.md)** - Chat history persistence with AI SDK

---

## Performance & Optimization

### Caching Strategy
- **[caching-strategy.md](caching-strategy.md)** - ⭐ COMPLETE GUIDE - All caching layers (SWR, localStorage, Redis)
  - Consolidates: 30min-cache-retention, cache-optimization-report, database-optimization-strategy (Redis section)

### Database Optimization
- **[database-optimization-strategy.md](database-optimization-strategy.md)** - ✅ PostgreSQL indexes, N+1 fixes, query optimization
- **[hnsdata-vs-tables-analysis.md](hnsdata-vs-tables-analysis.md)** - Database schema design analysis

### Performance Reports
- **[performance-optimization-summary.md](performance-optimization-summary.md)** - Overall performance improvements summary
- **[optimization-results.md](optimization-results.md)** - Optimization test results and metrics
- **[server-cache-performance-report.md](server-cache-performance-report.md)** - Redis cache performance analysis

### Loading Optimizations
- **[first-visit-optimization-strategy.md](first-visit-optimization-strategy.md)** - First-time visitor experience optimization
- **[instant-cache-loading-optimization.md](instant-cache-loading-optimization.md)** - Instant loading strategies
- **[memory-cache-optimization.md](memory-cache-optimization.md)** - Client-side memory optimization
- **[reading-performance-optimization.md](reading-performance-optimization.md)** - Reading experience performance
- **[story-card-loading-optimization.md](story-card-loading-optimization.md)** - Story card loading speed

### Specific Optimizations
- See **[bug-fixes/](bug-fixes/)** for cache fix details (prefetch, verification)

---

## Bug Fixes & Improvements

### Summary Documents
- **[mobile-improvements-summary.md](mobile-improvements-summary.md)** - ⭐ Complete mobile UX improvements overview
- **[mobile-reading-improvements.md](mobile-reading-improvements.md)** - Mobile reading enhancements

### Detailed Bug Fix Reports
- **[bug-fixes/](bug-fixes/)** - Complete directory of bug fix reports and performance investigations
  - Cache fixes (prefetch, miss detection, verification)
  - Mobile fixes (bottom nav, scene title GNB, scroll flickering)
  - Navigation improvements
  - Data loading optimizations
  - Scene loading performance investigations
  - **See [bug-fixes/README.md](bug-fixes/README.md) for complete index**

---

## Schema & Database

### Schema Changes
- **[schema-refactoring-summary.md](schema-refactoring-summary.md)** - Database schema refactoring history

### Performance Testing & Analysis
- **[redis-cache-test-results.md](redis-cache-test-results.md)** - Redis cache testing results
- **[bug-fixes/](bug-fixes/)** - Performance investigations (scene loading, timing gaps)

---

## Real-Time Features

**Status:** ✅ IMPLEMENTED (Redis Pub/Sub + SSE)

- **[real-time-story-updates.md](real-time-story-updates.md)** - ✅ Real-time story update implementation
  - Server: `src/app/api/community/events/route.ts`
  - Client: `src/lib/hooks/use-community-events.ts`
- **[real-time-comparison.md](real-time-comparison.md)** - Real-time vs polling comparison
- **[real-time-implementation-summary.md](real-time-implementation-summary.md)** - Real-time feature summary

---

## Story Management

### Generation & Creation
- **[story-generator-skill.md](story-generator-skill.md)** - Complete story generation via Claude Code skill

### Removal & Cleanup
- **[story-removal.md](story-removal.md)** - Story removal process and cleanup
- **[story-remover-improvements.md](story-remover-improvements.md)** - Story removal enhancements

### Reading & Engagement
- **[reading-history-implementation.md](reading-history-implementation.md)** - Reading history tracking
- **[like-dislike-implementation.md](like-dislike-implementation.md)** - Like/dislike feature implementation

---

## Testing

### E2E Testing
- **[gnb-menu-test-specification.md](gnb-menu-test-specification.md)** - Global navigation menu E2E tests

---

## UI Development

- **[ui-specification.md](ui-specification.md)** - UI component specifications and design system
- **[ui-development.md](ui-development.md)** - UI development guidelines

---

## Documentation by Status

### ✅ Implemented & Production
- caching-strategy.md (complete 3-layer caching)
- image-optimization.md (18-variant system)
- database-optimization-strategy.md (indexes, N+1 fixes)
- reading-specification.md (mobile nav, comments, likes)
- scene-evaluation-api.md (quality evaluation)
- story-image-generation.md (DALL-E 3 integration)

### 🚧 Partial Implementation
- community-specification.md (some features pending)
- analytics-specification.md (mock data, real APIs pending)

### 📋 Specification Only
- publish-specification.md
- ui-specification.md (design system planning)

---

## Documentation by Feature Area

### Story Writing
- story-specification, parts-chapters-necessity-analysis, scene-writing-discipline

### AI Features
- image-system-guide, story-image-generation, scene-evaluation-api, ai-sdk-persistent-chat-history

### Performance
- caching-strategy, database-optimization-strategy, performance-optimization-summary

### User Experience
- reading-specification, community-specification, mobile-reading-improvements

### Infrastructure
- authentication-profiles, google-analytics-setup, vercel-analytics-setup

---

## Quick Navigation by Task

### "I want to generate images"
→ Start: [image-system-guide.md](image-system-guide.md)
→ Quick guide: [image-generation-guide.md](image-generation-guide.md)
→ Implementation: [story-image-generation.md](story-image-generation.md)

### "I want to improve performance"
→ Start: [caching-strategy.md](caching-strategy.md)
→ Database: [database-optimization-strategy.md](database-optimization-strategy.md)
→ Results: [performance-optimization-summary.md](performance-optimization-summary.md)

### "I want to understand the story system"
→ Start: [story-specification.md](story-specification.md)
→ Reading UX: [reading-specification.md](reading-specification.md)
→ Generation: [story-generator-skill.md](story-generator-skill.md)

### "I want to set up authentication"
→ [authentication-profiles.md](authentication-profiles.md)

### "I want to understand caching"
→ [caching-strategy.md](caching-strategy.md) - Complete guide covering all layers

---

## Documentation Consolidation History

**Consolidation Date:** 2025-10-25

### Files Consolidated
- ~~30min-cache-retention.md~~ → Merged into **caching-strategy.md**
- ~~cache-optimization-report.md~~ → Merged into **caching-strategy.md**
- ~~bottom-nav-always-visible.md~~ → Merged into **reading-specification.md**
- ~~api-key-generation.md~~ → Removed (generic content)

### Files Organized into Subdirectories
- **18 bug fix reports** → Moved to **bug-fixes/** directory
  - Cache fixes, mobile fixes, navigation fixes, etc.
  - See [bug-fixes/README.md](bug-fixes/README.md) for complete index

### New Summary Documents Created
- **caching-strategy.md** - Complete 3-layer caching guide
- **image-system-guide.md** - Image generation & optimization overview
- **mobile-improvements-summary.md** - Mobile UX improvements overview
- **bug-fixes/README.md** - Bug fix directory index

### Result
- **Before:** 72 files in docs/, scattered organization
- **After:** 55 main docs + 20 bug fix reports, organized structure
- **Improvement:** Easier navigation, clear categorization, reduced redundancy

---

## Contributing to Documentation

When adding new documentation:
1. Add file to appropriate section in this index
2. Use clear, descriptive filenames (lowercase with dashes)
3. Include status indicator (✅ implemented, 🚧 partial, 📋 spec only)
4. Cross-reference related documents
5. Update CLAUDE.md if it affects development workflow

---

**Last Updated:** 2025-10-25
**Total Documents:** 55 main docs + 20 bug fix reports = 75 total
**Organization:** Consolidated and organized by category
**Core Guides:** 10 essential documents for new developers
