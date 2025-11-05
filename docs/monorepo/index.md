# Monorepo Documentation Index

Complete documentation for the Fictures monorepo structure with Next.js and Python FastAPI.

## 📚 Documentation Files

### Quick Start

1. **[migration-summary.md](migration-summary.md)** - 🚀 Start here! Quick overview and next steps
2. **[setup-checklist.md](setup-checklist.md)** - ☑️ Step-by-step setup checklist
3. **[setup-guide.md](setup-guide.md)** - 📖 Complete migration and setup guide

### Architecture & Design

4. **[architecture.md](architecture.md)** - 🏗️ Detailed monorepo architecture
5. **[readme.md](readme.md)** - 📄 Project overview and features

### Migration Script

Located at: **`/scripts/migrate-to-monorepo.sh`**

## 🎯 Reading Order

### For First-Time Setup

```
1. migration-summary.md     (5 min read)  - Understand what's been built
2. setup-checklist.md       (Follow along) - Complete setup step-by-step
3. setup-guide.md          (Reference)    - Detailed guide when needed
```

### For Understanding Architecture

```
1. architecture.md          (15 min read) - Complete architecture overview
2. readme.md               (10 min read) - Feature list and usage examples
```

## 📦 What's Documented

- ✅ pnpm workspaces configuration
- ✅ Next.js migration to `apps/web`
- ✅ Python FastAPI server setup
- ✅ TypeScript API client with type generation
- ✅ Development workflow
- ✅ Deployment strategies
- ✅ Local AI model integration
- ✅ Troubleshooting guides

## 🚀 Quick Start

```bash
# 1. Run migration
chmod +x scripts/migrate-to-monorepo.sh
./scripts/migrate-to-monorepo.sh

# 2. Install dependencies
pnpm install

# 3. Setup Python
cd apps/ai-server && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ../..

# 4. Run both servers
pnpm dev
```

Visit:
- Next.js: http://localhost:3000
- AI Server: http://localhost:8000/docs

## 🔗 Related Documentation

- **Component Docs**: `apps/ai-server/README.md`, `packages/api-client/README.md`
- **Project Docs**: `/CLAUDE.md`, `/docs/CLAUDE.md`
- **Feature Docs**: `/docs/novels/`, `/docs/image/`

---

**Ready to start?** → Read [migration-summary.md](migration-summary.md) first! 🚀
