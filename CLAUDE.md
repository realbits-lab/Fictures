# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## 🤖 Autonomous Task Execution Policy

### Todo List Execution
- Execute all todos continuously without stopping between items
- Mark tasks as completed immediately and proceed to next task
- Only pause for critical blockers or security-sensitive decisions
- After creating a todo list, automatically begin execution without waiting for confirmation
- Execute todos sequentially and autonomously
- For minor decisions, use your best judgment and document the choice in code comments

### When to Stop and Ask
- **DO STOP FOR**:
  - Security decisions (API keys, permissions, authentication)
  - Destructive operations (data deletion, breaking changes)
  - Ambiguous architecture choices that could lead to wasted work
  - Unclear requirements that affect core functionality
- **DON'T STOP FOR**:
  - Minor implementation details
  - Variable naming conventions
  - Code organization and refactoring
  - Non-blocking errors that can be fixed automatically
  - Standard code quality improvements

### Error Handling During Todos
- Attempt automatic error recovery first
- Fix non-blocking errors and continue
- Only stop for blocking errors that prevent continuation
- Document error fixes in code comments or commit messages
- Run type-check and lint to verify fixes before moving to next todo

### Progress Communication
- Provide brief updates as you complete major milestones
- Show final summary when all todos are complete
- Don't wait for acknowledgment between individual todo items
- Keep working through the list while providing status updates

---

## 🎯 Most Critical Documents for Claude Code

When working on this project, these are the **TOP PRIORITY** documents to reference:

1. **[Novel Specification (SSOT)](apps/web/docs/novels/novels-specification.md)** - The canonical data model - ALWAYS check this first for data structure questions
2. **[Database Schema Code](apps/web/src/lib/schemas/database/index.ts)** - The executable schema that MUST follow the specification
3. **[AI Server API Reference](apps/ai-server/docs/api/api-reference.md)** - Complete AI service API documentation (uses `.auth/user.json` for API keys)
4. **[Web Development Guide](apps/web/CLAUDE.md)** - Essential Next.js development instructions
5. **[AI Server Development Guide](apps/ai-server/CLAUDE.md)** - Essential Python service instructions
6. **[Authentication API](apps/web/docs/api/authentication.md)** - Auth system documentation
7. **[Performance Implementation](apps/web/docs/performance/IMPLEMENTATION-SUMMARY.md)** - Performance optimization guidelines
8. **[UI Development Guide](apps/web/docs/ui/ui-development.md)** - Frontend development patterns

⚠️ **REMEMBER**: Always check and update related documentation when making code changes (see Documentation Synchronization Policy below)

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

### ✅ Code Quality Verification (MANDATORY)

**CRITICAL: After completing ANY code changes, you MUST run type checks and linting.**

This is a **mandatory** step for all code modifications:

1. **After making changes in `apps/web/`**:
   ```bash
   cd apps/web
   pnpm type-check    # Run TypeScript type checking
   pnpm lint          # Run Biome linting
   ```

2. **After making changes in `apps/ai-server/`**:
   ```bash
   cd apps/ai-server
   # Run Python type checking and linting as appropriate
   ```

**Why This Matters**:
- Catches type errors immediately
- Ensures code quality standards
- Prevents broken code from being committed
- Maintains codebase consistency

**Exception**: Only skip validation if the user explicitly says "skip type check" or "don't run lint"

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

### Running Development Servers

**IMPORTANT**: Before running development servers, always kill existing processes on the required ports:

- **Web Server (Port 3000)**: Kill any process using port 3000 before running `pnpm dev` in `apps/web/`
- **AI Server (Port 8000)**: Kill any process using port 8000 before running the server in `apps/ai-server/`

**Process Management Principle**:
- **ALWAYS kill processes by PID (process number), NEVER by process name**
- Use `lsof -ti :PORT` to get PIDs, then `kill -9 PID` to terminate
- Process names can match multiple unrelated processes and cause unintended termination
- Example: `lsof -ti :3000 | xargs -r kill -9` (safe, targeted)
- Never use: `pkill next` or `killall node` (dangerous, kills all matching processes)

**Quick Start - Running Both Servers**:

```bash
# 1. Kill existing processes on ports 3000 and 8000
fuser -k 3000/tcp 8000/tcp 2>/dev/null || true

# 2. Start AI Server (Python FastAPI) - MUST use venv
cd apps/ai-server
source venv/bin/activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > ../../logs/ai-server.log 2>&1 &
cd ../..

# 3. Start Web Server (Next.js)
cd apps/web
dotenv -e .env.local -- pnpm dev > ../../logs/dev-server.log 2>&1 &
cd ../..

# 4. Verify both servers are running
sleep 10
curl -s http://localhost:8000/health | jq .  # AI server health check
curl -s http://localhost:3000 | head -5      # Web server check
```

**Important Notes**:
- **AI Server**: MUST activate Python venv before starting (`source venv/bin/activate`)
- **Web Server**: MUST use `dotenv -e .env.local` to load environment variables
- **Background Processes**: Both servers run in background with output redirected to `logs/`
- **Port Check**: Always kill existing processes first to prevent port conflicts

**Detailed Guides**:
- **Web Server**: See [apps/web/CLAUDE.md](apps/web/CLAUDE.md#development-process-guidelines) for complete web server setup
- **AI Server**: See [apps/ai-server/CLAUDE.md](apps/ai-server/CLAUDE.md#development-commands) for complete AI server setup and Python environment details

## Authentication & API Keys

### Local API Key Storage

Store API keys and authentication data in `.auth/user.json`:

```json
{
  "apiKey": "sk_test_your_api_key_here",
  "email": "user@example.com"
}
```

**Important:**
- Create `.auth` directory in project root if it doesn't exist
- The `.auth` directory is in `.gitignore` to prevent committing credentials
- All code examples use `.auth/user.json` for API key storage
- See [AI Server API Reference](apps/ai-server/docs/api/api-reference.md) for usage examples

## Git and Repository Management

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/*`
- **Commit format**: Follow conventional commit message format
- Always check current git repository URL before using GitHub tools

## Database Management

### Schema Source of Truth

- **Documentation SSOT**: `apps/web/docs/novels/novels-specification.md` defines the canonical data model
- **Code SSOT**: `apps/web/src/lib/schemas/database/index.ts` is the executable schema (code cannot reference markdown)
- **Generated Output**: `apps/web/drizzle/schema.ts` and `drizzle/relations.ts` are auto-generated by Drizzle Kit
- **Principle**: `src/lib/schemas/database/index.ts` MUST always follow and reflect `novels-specification.md`
- **When updating schema**:
  1. First: Modify specification (`docs/novels/novels-specification.md`)
  2. Second: Update source schema (`src/lib/schemas/database/index.ts`)
  3. Third: Run `pnpm db:generate` to regenerate output files

### Schema-First Type Definition Principle

**CRITICAL: Always check schema directory for types before creating new ones.**

When you need type definitions (TypeScript interfaces, Zod schemas, etc.):

1. **FIRST**: Check centralized schema directories for existing types:
   - `apps/web/src/lib/schemas/database/` - Database table schemas and types
   - `apps/web/src/lib/schemas/api/` - API request/response types
   - `apps/web/src/lib/schemas/validation/` - Validation schemas

2. **IF NOT FOUND**: Create new type definitions in the appropriate schema directory:
   - Database models → `src/lib/schemas/database/`
   - API contracts → `src/lib/schemas/api/`
   - Form validation → `src/lib/schemas/validation/`

3. **NEVER**: Create type definitions in API route directories or component directories

**Why This Matters:**
- **Prevents Type Duplication**: Single source of truth for type definitions
- **Maintains Consistency**: Same types used across entire codebase
- **Enables Reusability**: Types can be imported anywhere they're needed
- **Avoids Schema Drift**: Central location prevents divergent type definitions

**Example (Correct):**
```typescript
// ✅ Import from centralized schema
import type { MetricResult, EvaluationError } from "@/lib/schemas/api/evaluation";
import { EVALUATION_ERROR_CODES } from "@/lib/schemas/api/evaluation";
```

**Example (Incorrect):**
```typescript
// ❌ DO NOT create types in API route directories
// apps/web/src/app/api/evaluation/types.ts  ← WRONG LOCATION
export interface MetricResult { ... }
```

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

## 🔗 Quick Reference: Critical Documentation Links

### 🎯 Primary Development Guides (Start Here)
- **[📖 Web Development Guide](apps/web/CLAUDE.md)** - Complete Next.js development guide
- **[🐍 AI Server Development Guide](apps/ai-server/CLAUDE.md)** - Python AI service guide
- **[📚 Web Documentation Index](apps/web/docs/CLAUDE.md)** - Web docs organization
- **[🔧 Scripts Guide](apps/web/scripts/CLAUDE.md)** - Development scripts guide

### 🏗️ Architecture & Specifications

#### Database & Schema (Source of Truth)
- **[📋 Novel Specification (SSOT)](apps/web/docs/novels/novels-specification.md)** - Canonical data model documentation
- **[💾 Database Schema Code](apps/web/src/lib/schemas/database/index.ts)** - Executable schema (follows spec)

#### System Architecture
- **[🏛️ Monorepo Architecture](docs/monorepo/architecture.md)** - Overall system design
- **[🔐 Authentication Layer Pattern](docs/architecture/authentication-layer-pattern.md)** - Auth architecture
- **[🖼️ Image Architecture](apps/web/docs/image/image-architecture.md)** - Image system design
- **[🎭 Comics Architecture](apps/web/docs/comics/comics-architecture.md)** - Comics system design

### 📡 API Documentation

#### AI Server APIs
- **[🤖 AI Server API Reference](apps/ai-server/docs/api/api-reference.md)** - Complete AI API docs
- **[🔑 AI Authentication Guide](apps/ai-server/docs/general/authentication.md)** - AI server auth
- **[⚙️ AI Server Architecture](apps/ai-server/docs/general/architecture.md)** - AI system design

#### Web Application APIs
- **[🔐 Authentication API](apps/web/docs/api/authentication.md)** - Auth endpoints
- **[📝 Studio API](apps/web/docs/api/studio.md)** - Studio endpoints
- **[🖼️ Images API](apps/web/docs/api/images.md)** - Image endpoints
- **[⚡ Evaluation API](apps/web/docs/api/evaluation-api-structure.md)** - Quality evaluation
- **[👤 Users API](apps/web/docs/api/users.md)** - User management

### 🚀 Performance & Optimization

- **[⚡ Performance Implementation Summary](apps/web/docs/performance/IMPLEMENTATION-SUMMARY.md)** - Performance overview
- **[💾 Database Performance](apps/web/docs/performance/performance-database.md)** - DB optimization
- **[🔄 Caching Strategies](apps/web/docs/performance/performance-caching.md)** - Cache implementation
- **[📚 Novel Performance](apps/web/docs/performance/performance-novels.md)** - Novel optimization

### 🎨 UI & Frontend

- **[🎨 UI Specification](apps/web/docs/ui/ui-specification.md)** - UI design specs
- **[💻 UI Development Guide](apps/web/docs/ui/ui-development.md)** - Frontend development
- **[🎯 Theme System](apps/web/docs/ui/theme-system.md)** - Theming approach
- **[📦 shadcn Component Guide](apps/web/docs/ui/shadcn-component-guide.md)** - Component library

### 📚 Feature-Specific Documentation

#### Novel Generation System
- **[📖 Novel Development](apps/web/docs/novels/novels-development.md)** - Novel implementation
- **[✅ Novel Evaluation](apps/web/docs/novels/novels-evaluation.md)** - Quality assessment
- **[⚡ Novel Optimization](apps/web/docs/novels/novels-optimization.md)** - Performance tuning

#### Studio & Agent System
- **[🤖 Studio Agent Specification](apps/web/docs/studio/studio-agent-specification.md)** - Agent design
- **[💻 Studio Agent Development](apps/web/docs/studio/studio-agent-development.md)** - Agent implementation
- **[📊 Studio API Quick Reference](apps/web/docs/studio/studio-api-quick-reference.md)** - API shortcuts

#### Community Features
- **[👥 Community Specification](apps/web/docs/community/community-specification.md)** - Community design
- **[⚡ Community Performance](apps/web/docs/community/community-performance-fix.md)** - Performance fixes

### 🧪 Testing & Quality

- **[🧪 Test Specification](apps/web/docs/test/test-specification.md)** - Testing strategy
- **[✅ Test Development](apps/web/docs/test/test-development.md)** - Test implementation
- **[📊 Cache Testing Guide](apps/web/docs/performance/cache-testing-guide.md)** - Cache validation

### 🚀 Setup & Getting Started

- **[🏁 Getting Started](docs/GETTING_STARTED.md)** - Project quickstart
- **[📋 Setup Checklist](docs/monorepo/setup-checklist.md)** - Setup verification
- **[🐍 Python Version Guide](apps/ai-server/docs/general/python-version-guide.md)** - Python setup
- **[⚡ AI Server Quick Start](apps/ai-server/docs/general/quick-start.md)** - AI server setup

### 🔧 Operational Guides

- **[🔑 Google AI API Setup](docs/operation/google-ai-api-key-setup.md)** - API key configuration
- **[🏗️ Environment Architecture](docs/operation/environment-architecture.md)** - Environment setup
- **[🔐 Cross-System Authentication](docs/operation/cross-system-authentication.md)** - Multi-system auth

### 📊 Analytics & Monitoring

- **[📈 Google Analytics Setup](apps/web/docs/analysis/google-analytics-setup.md)** - GA4 configuration
- **[📊 Vercel Analytics Setup](apps/web/docs/analysis/vercel-analytics-setup.md)** - Vercel analytics
- **[💰 Google AdSense Guide](apps/web/docs/adsense/google-adsense-complete-guide.md)** - AdSense setup

### 🔑 Authentication & Security

- **[🔑 Authentication Profiles](apps/web/docs/auth/authentication-profiles.md)** - Auth configuration
- **[📁 .auth/user.json](apps/web/.auth/user.json)** - Local auth storage (create if needed)

---

**For detailed workspace-specific guidance, refer to:**
- 📖 **[Web Development](apps/web/CLAUDE.md)** - Complete web app guide
- 🐍 **[AI Server Development](apps/ai-server/CLAUDE.md)** - Complete AI service guide
