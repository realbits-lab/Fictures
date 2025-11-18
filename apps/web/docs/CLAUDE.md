# CLAUDE.md - Web Application Documentation

This file provides Claude Code with a complete index of all feature documentation for the Next.js web application.

**IMPORTANT: When you change code, update the related documentation IMMEDIATELY.**

## Documentation Index

This section provides a complete index of all feature documentation. Each directory contains specialized documentation for specific features.

### Core Features

#### Story Generation & Management
- **[novels/](novels/)** - Novel generation using Adversity-Triumph Engine
  - `novels-specification.md` - Core concepts and data model (SSOT)
  - `novels-development.md` - API specs and system prompts
  - `novels-evaluation.md` - Validation and quality metrics

- **[toonplay/](toonplay/)** - Novel-to-Webtoon Adaptation System
  - `toonplay-specification.md` - Core concepts, visual grammar, and data model
  - `toonplay-development.md` - Implementation, API specs, and process flows
  - `toonplay-evaluation.md` - Quality metrics and testing strategies
  - Toonplay methodology (70% dialogue, 30% visual action, <5% narration, <10% internal monologue)
  - Panel generation pipeline with character consistency
  - Database-driven character descriptions for visual consistency

- **[comics/](comics/)** - Comics reader interface and display
  - `comics-specification.md` - Comics reader specifications
  - `comics-development.md` - Implementation guide
  - `comics-evaluation.md` - Quality evaluation for comics display
  - Webtoon reader UI
  - Panel display optimization
  - Mobile reading experience

- **[studio/](studio/)** - Story creation workspace
  - `studio-agent-specification.md` - AI agent specifications
  - `studio-agent-development.md` - Agent development guide
  - `studio-agent-implementation.md` - Agent implementation details
  - `studio-agent-ui.md` - Agent UI components
  - `studio-api-quick-reference.md` - Quick API reference
  - `studio-api-analysis.md` - API architecture analysis

#### Content Display & Reading
- **[scene/](scene/)** - Scene quality evaluation and tracking
  - `scene-quality-pipeline.md` - Quality evaluation framework
  - `scene-improvement-api.md` - Scene improvement API
  - `scene-view-tracking.md` - View tracking implementation
  - `scene-view-analysis.md` - View analytics
  - `scene-writing-discipline.md` - Writing best practices

- **[image/](image/)** - Image generation and optimization
  - `image-specification.md` - Image system specifications
  - `image-development.md` - Implementation guide and API documentation
  - `image-evaluation.md` - Quality evaluation and testing strategies
  - Generation pipeline (Gemini 2.5 Flash)
  - 4-variant optimization (AVIF + JPEG × mobile 1x/2x)

#### Community & Engagement
- **[community/](community/)** - Community features
  - `community-specification.md` - Community feature specifications
  - `community-caching-implementation.md` - Caching strategy
  - `community-performance-fix.md` - Performance improvements
  - `community-metrics-help.md` - Metrics and analytics
  - Story sharing and discussions
  - Comments and replies
  - Performance optimizations

- **[notification/](notification/)** - Notification system
  - `notification-specification.md` - System specification
  - `notification-development.md` - Implementation guide
  - `real-time-story-updates.md` - SSE implementation
  - `real-time-implementation-summary.md` - SSE completion report
  - `real-time-comparison.md` - Technology comparison
  - Real-time updates (SSE)
  - Multi-channel notifications
  - User preferences

- **[publish/](publish/)** - Publishing & scheduling
  - `publish-specification.md` - Publishing system specification
  - `publish-development.md` - Implementation guide
  - `publish-ui.md` - UI components
  - Weekly scene-by-scene publishing
  - Timeline visualization
  - Automated scheduling

#### Analytics & Monitoring
- **[analysis/](analysis/)** - Reader analytics & insights
  - `analysis-specification.md` - Analytics feature specifications
  - `analysis-development.md` - Implementation guide
  - `google-analytics-setup.md` - Google Analytics 4 setup
  - `vercel-analytics-setup.md` - Vercel Analytics setup
  - `data-tracking-strategy.md` - Data tracking strategy
  - Story performance metrics
  - Reader engagement tracking

- **[adsense/](adsense/)** - Google AdSense integration
  - `google-adsense-complete-guide.md` - Complete AdSense guide
  - Ad placement
  - Revenue optimization

#### Authentication & User Management
- **[auth/](auth/)** - Authentication system
  - `authentication-profiles.md` - User roles and API key management
  - `authentication-examples.md` - Authentication examples
  - User profiles and roles
  - API key management
  - Multi-environment auth

#### UI & UX
- **[ui/](ui/)** - UI components & design system
  - `README.md` - UI directory overview
  - `ui-specification.md` - Component specifications
  - `ui-development.md` - Development guidelines
  - `theme-system.md` - Theme system (light/dark mode)
  - `independent-scrolling.md` - Independent scroll implementation
  - `shadcn-component-guide.md` - shadcn/ui component guide
  - `shadcn-installation-report.md` - shadcn/ui installation report
  - `shadcn-mcp-reference.md` - shadcn/ui MCP reference

- **[mobile/](mobile/)** - Mobile UX improvements
  - `mobile-reading-improvements.md` - Mobile reading experience
  - `mobile-improvements-summary.md` - Mobile UX enhancements summary
  - Touch-optimized controls
  - Mobile-first optimization
  - Responsive design

#### API Documentation
- **[api/](api/)** - API endpoint documentation
  - `README.md` - API documentation index
  - `authentication.md` - Authentication endpoints
  - `studio.md` - Studio API endpoints
  - `images.md` - Image generation and management
  - `users.md` - User management endpoints
  - `admin.md` - Admin endpoints
  - `features.md` - Feature flags and configuration
  - `validation.md` - Validation schemas
  - `evaluation-api-structure.md` - Evaluation API structure
  - `cron.md` - Cron job endpoints

#### Architecture
- **[architecture/](architecture/)** - Architecture documentation
  - `schema-generation-architecture.md` - Database schema generation architecture

#### Performance & Optimization
- **[performance/](performance/)** - Performance optimization
  - `IMPLEMENTATION-SUMMARY.md` - Performance implementation summary
  - `optimization-caching.md` - Caching strategies (SWR, localStorage, Redis)
  - `optimization-database.md` - Database optimization
  - `optimization-blob-deletion.md` - Blob deletion optimization
  - `optimization-cache-invalidation.md` - Cache invalidation
  - `optimization-novels.md` - Novel generation performance
  - `optimization-comics.md` - Comics performance
  - `optimization-studio.md` - Studio performance
  - `optimization-community.md` - Community features performance
  - `optimization-comments.md` - Comments system performance
  - `cache-testing-guide.md` - Cache testing procedures
  - `novels-optimization.md` - Novel optimization strategies

#### Testing
- **[test/](test/)** - Testing specifications
  - `test-specification.md` - Testing strategy and specifications
  - `test-development.md` - Test implementation guide
  - E2E test specs (Playwright)
  - Component testing
  - Integration tests

## Quick Navigation by Task

**Common Development Tasks:**
- **Generate novels** → `novels/novels-specification.md`
- **Adapt novels to webtoons** → `toonplay/toonplay-specification.md`
- **Display comics/webtoons** → `comics/comics-specification.md`
- **Generate images** → `image/image-specification.md`
- **Optimize images** → `image/image-development.md`
- **Add UI components** → `ui/ui-specification.md` + `ui/shadcn-component-guide.md`
- **Improve performance** → `performance/optimization-caching.md` + `performance/IMPLEMENTATION-SUMMARY.md`
- **Set up testing** → `test/test-specification.md`
- **Understand story system** → `novels/novels-specification.md` (SSOT for data model)
- **Work with community features** → `community/community-specification.md`
- **Check API endpoints** → `api/README.md`
- **Understand auth system** → `auth/authentication-profiles.md`
- **Mobile optimization** → `mobile/mobile-reading-improvements.md`
- **Analytics setup** → `analysis/google-analytics-setup.md` + `analysis/vercel-analytics-setup.md`

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
