# Web Application Documentation

Complete documentation for the Fictures Next.js web application.

## 📖 Documentation Index

### Core Features

#### Story Generation & Management
- **[novels/](novels/)** - Novel generation using Adversity-Triumph Engine
  - `novels-specification.md` - Core concepts and data model
  - `novels-development.md` - API specs and system prompts
  - `novels-testing.md` - Validation and quality metrics
  - `novels-optimization.md` - Performance tuning
  - `novels-removal.md` - Deletion workflows

- **[comics/](comics/)** - Comic panel generation and display
  - Toonplay methodology (70% dialogue, 30% visual action)
  - Panel generation pipeline
  - Webtoon reader interface

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

## 🚀 Quick Navigation

**Getting Started:**
1. Read the [main CLAUDE.md](../CLAUDE.md) in the web app root
2. Check [Platform-wide docs](../../../docs/) for environment setup
3. Review feature-specific docs based on what you're working on

**Common Tasks:**
- **Generate novels** → `novels/novels-specification.md`
- **Optimize images** → `image/image-optimization.md`
- **Add UI components** → `ui/ui-specification.md`
- **Improve performance** → `performance/performance-caching.md`
- **Set up testing** → `test/test-specification.md`

## 📋 Platform-Wide Documentation

For documentation that affects multiple apps or the entire platform:
- **Platform Architecture**: `../../../docs/operation/environment-architecture.md`
- **Monorepo Structure**: `../../../docs/monorepo/`
- **Root CLAUDE.md**: `../../../CLAUDE.md`

## 🔄 Documentation Standards

### Keeping Docs Updated

**IMPORTANT**: When you change code, update the related documentation IMMEDIATELY.

See `../../../docs/CLAUDE.md` for complete documentation synchronization guidelines.

### File Organization

- **Specifications**: `*-specification.md` - Feature design and architecture
- **Development**: `*-development.md` - Implementation guides
- **Testing**: `*-testing.md` - Test strategies and validation
- **Optimization**: `*-optimization.md` - Performance tuning

---

**For detailed feature documentation, navigate to the relevant directory above.**
