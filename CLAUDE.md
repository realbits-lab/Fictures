# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Information

- **Repository**: https://github.com/realbits-lab/Fictures
- **Project**: Fictures - AI-powered story writing platform
- **Architecture**: Monorepo with multiple workspaces

## Monorepo Structure

```
Fictures/
├── apps/
│   ├── web/              # Next.js 15 frontend application
│   │   └── CLAUDE.md     # Web-specific development guide
│   └── ai-server/        # Python FastAPI AI service
│       └── CLAUDE.md     # AI server-specific development guide
├── packages/             # Shared packages (if any)
└── docs/                 # Documentation
```

## Workspace Overview

### apps/web/ - Next.js Frontend
- **Framework**: Next.js 15 with App Router
- **Purpose**: Story writing, reading, and community platform
- **Tech Stack**: React, TypeScript, Tailwind CSS, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Port**: 3000
- **Guide**: See `apps/web/CLAUDE.md` for complete development guide

### apps/ai-server/ - Python AI Service
- **Framework**: FastAPI with Python 3.12.7
- **Purpose**: AI text and image generation services
- **Tech Stack**: vLLM, Stable Diffusion, Hugging Face models
- **Port**: 8000
- **Guide**: See `apps/ai-server/CLAUDE.md` for complete development guide

## Development Workflow

### Working in apps/web/
```bash
cd apps/web
# See apps/web/CLAUDE.md for detailed commands
```

### Working in apps/ai-server/
```bash
cd apps/ai-server
# See apps/ai-server/CLAUDE.md for detailed commands
```

## Git and Repository Management

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/*`
- **Commit format**: Follow conventional commit message format
- Always check current git repository URL before using GitHub tools

## Database Management

### Schema Source of Truth

- **Documentation SSOT**: `apps/web/docs/novels/novels-specification.md` defines the canonical data model
- **Code SSOT**: `apps/web/drizzle/schema.ts` is the executable schema (code cannot reference markdown)
- **Principle**: `drizzle/schema.ts` MUST always follow and reflect `novels-specification.md`
- When updating schema, modify specification first, then update schema.ts to match

## Documentation

- **Root docs/**: Platform-wide documentation
- **apps/web/docs/**: Web application documentation
- **apps/ai-server/docs/**: Python service documentation

### **CRITICAL: Documentation Synchronization Policy**

**Whenever you change or update any files, you MUST check and update related documentation.**

This is a mandatory requirement to prevent documentation drift and ensure the codebase remains maintainable.

#### Documentation Update Checklist

When making changes to code, **ALWAYS** follow this checklist:

1. **Identify Related Documentation**
   - Check `apps/web/docs/` for web application changes
   - Check `apps/ai-server/docs/` for AI server changes
   - Check root `docs/` for platform-wide changes

2. **Update Documentation IMMEDIATELY**
   - Update API specifications if you changed endpoints
   - Update architecture docs if you changed system design
   - Update implementation guides if you changed key functions
   - Update user guides if you changed user-facing features

3. **Verify Synchronization**
   - Code matches documentation
   - Examples in docs still work
   - API contracts are consistent
   - Database schemas are synchronized

#### Documentation-First Development (For Major Changes)

For significant features or architectural changes, follow the **Documentation-First** approach:

1. **FIRST**: Update documentation with the proposed changes
2. **SECOND**: Implement code according to updated documentation
3. **VERIFY**: Ensure code matches documented specifications

This approach is **mandatory** for:
- Novel generation system changes (see `apps/web/docs/novels/`)
- API endpoint modifications
- Database schema updates
- Authentication system changes

#### Common Documentation Locations

**Web Application (`apps/web/docs/`):**
- `api/` - API endpoint documentation
- `novels/` - Novel generation system
- `image/` - Image generation and optimization
- `auth/` - Authentication system
- `performance/` - Performance optimizations
- `ui/` - UI components and design system

**AI Server (`apps/ai-server/docs/`):**
- `api/` - AI service API reference
- `general/` - Architecture and setup guides
- Model configuration and usage

**Platform-wide (`docs/`):**
- `operation/` - Operational guides
- `monorepo/` - Monorepo setup and architecture

#### Why This Matters

- **Prevents Documentation Drift**: Code and docs stay synchronized
- **Enables Knowledge Transfer**: New developers understand the system correctly
- **Maintains Type Safety**: API contracts match actual implementation
- **Avoids Runtime Errors**: Database schemas stay consistent
- **Improves Maintainability**: Changes are properly documented and traceable

#### Example Workflow

```bash
# ✅ CORRECT: Update documentation when making changes
1. Change code in src/lib/auth/dual-auth.ts
2. Update apps/web/docs/api/authentication.md
3. Verify examples in documentation still work

# ❌ INCORRECT: Updating code without updating docs
1. Change code in src/lib/auth/dual-auth.ts
2. (Documentation becomes outdated)
```

**Remember**: Documentation is not optional. It is a critical part of the codebase and must be maintained with the same rigor as the code itself.

---

**For detailed workspace-specific guidance, refer to:**
- 📖 **Web Development**: `apps/web/CLAUDE.md`
- 🐍 **AI Server Development**: `apps/ai-server/CLAUDE.md`
