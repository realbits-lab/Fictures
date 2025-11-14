# CLAUDE.md - Web Application Documentation

This file provides Claude Code with a complete index of all feature documentation for the Next.js web application.

**IMPORTANT: When you change code, update the related documentation IMMEDIATELY.**

## Documentation Index

This section provides a complete index of all feature documentation. Each directory contains specialized documentation for specific features.

### Core Features

#### Story Generation & Management
- **[novels/](novels/)** - Novel generation using Adversity-Triumph Engine
  - `novels-specification.md` - Core concepts and data model
  - `novels-development.md` - API specs and system prompts
  - `novels-evaluation.md` - Validation and quality metrics
  - `novels-optimization.md` - Performance tuning
  - `novels-removal.md` - Deletion workflows

- **[toonplay/](toonplay/)** - Novel-to-Webtoon Adaptation System
  - `toonplay-specification.md` - Core concepts, visual grammar, and data model
  - `toonplay-development.md` - Implementation, API specs, and process flows
  - `toonplay-evaluation.md` - Quality metrics and testing strategies
  - Toonplay methodology (70% dialogue, 30% visual action, <5% narration, <10% internal monologue)
  - Panel generation pipeline with character consistency
  - Database-driven character descriptions for visual consistency

- **[comics/](comics/)** - Comic reader interface and display
  - Webtoon reader UI
  - Panel display optimization
  - Mobile reading experience

- **[studio/](studio/)** - Story creation workspace
  - AI agent specifications
  - API quick reference
  - UI components

#### Content Display & Reading
- **[scene/](scene/)** - Scene quality evaluation and tracking
  - Quality pipeline
  - View tracking
  - Analytics

- **[image/](image/)** - Image generation and optimization
  - Generation pipeline (Gemini 2.5 Flash)
  - 4-variant optimization (AVIF + JPEG × mobile 1x/2x)
  - Architecture overview

#### Community & Engagement
- **[community/](community/)** - Community features
  - Story sharing
  - Comments and discussions
  - Performance optimizations

- **[notification/](notification/)** - Notification system
  - Real-time updates (SSE)
  - Multi-channel notifications
  - User preferences

- **[publish/](publish/)** - Publishing & scheduling
  - Weekly scene-by-scene publishing
  - Timeline visualization
  - Automated scheduling

#### Analytics & Monitoring
- **[analysis/](analysis/)** - Reader analytics & insights
  - Story performance metrics
  - Reader engagement tracking

- **[analytics/](analytics/)** - Platform analytics setup
  - Google Analytics 4 integration
  - Vercel Analytics setup

- **[adsense/](adsense/)** - Google AdSense integration
  - Ad placement
  - Revenue optimization

#### Authentication & User Management
- **[auth/](auth/)** - Authentication system
  - User profiles and roles
  - API key management
  - Multi-environment auth

#### UI & UX
- **[ui/](ui/)** - UI components & design system
  - Component specifications
  - Theme system (light/dark mode)
  - Independent scrolling

- **[mobile/](mobile/)** - Mobile UX improvements
  - Touch-optimized controls
  - Mobile-first optimization
  - Responsive design

#### Performance & Optimization
- **[performance/](performance/)** - Performance optimization
  - Caching strategies (SWR, localStorage, Redis)
  - Database optimization
  - Blob deletion optimization
  - Feature-specific optimizations

#### Testing
- **[test/](test/)** - Testing specifications
  - E2E test specs (Playwright)
  - Component testing
  - Integration tests

## Quick Navigation by Task

**Common Development Tasks:**
- **Generate novels** → `novels/novels-specification.md`
- **Adapt novels to webtoons** → `toonplay/toonplay-specification.md`
- **Optimize images** → `image/image-optimization.md`
- **Add UI components** → `ui/ui-specification.md`
- **Improve performance** → `performance/performance-caching.md`
- **Set up testing** → `test/test-specification.md`
- **Understand story system** → `novels/novels-specification.md`
- **Work with community features** → `community/community-specification.md`

## Platform-Wide Documentation

**For documentation affecting multiple apps or the entire platform:**
- **Platform Architecture**: `../../../docs/operation/environment-architecture.md`
- **Monorepo Structure**: `../../../docs/monorepo/`
- **Root CLAUDE.md**: `../../../CLAUDE.md`

## Documentation Standards

**IMPORTANT: Keeping Docs Synchronized**

When you change code, update the related documentation IMMEDIATELY in this order:

1. **FIRST: Update Documentation** - Documentation is the single source of truth
2. **SECOND: Update Implementation** - Code follows documented specifications

**File Naming Conventions:**
- **Specifications**: `*-specification.md` - Feature design and architecture
- **Development**: `*-development.md` - Implementation guides
- **Testing**: `*-testing.md` - Test strategies and validation
- **Optimization**: `*-optimization.md` - Performance tuning

**See `../../../docs/CLAUDE.md` for complete documentation synchronization guidelines.**

---

**For detailed feature documentation, navigate to the relevant directory above.**
