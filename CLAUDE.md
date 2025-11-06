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

## Documentation

- **Root docs/**: Platform-wide documentation
- **apps/web/docs/**: Web application documentation
- **apps/ai-server/**: Python service documentation

---

**For detailed workspace-specific guidance, refer to:**
- 📖 **Web Development**: `apps/web/CLAUDE.md`
- 🐍 **AI Server Development**: `apps/ai-server/CLAUDE.md`
