# Monorepo Setup Checklist

Follow this checklist to complete your monorepo migration and setup.

## ☑️ Pre-Migration Checklist

- [ ] Commit all current changes: `git add . && git commit -m "Pre-monorepo commit"`
- [ ] Create backup branch: `git checkout -b backup-before-monorepo`
- [ ] Return to main branch: `git checkout develop` (or your main branch)
- [ ] Ensure clean working directory: `git status`

## 📦 Migration Steps

### 1. Run Migration Script

- [ ] Make script executable: `chmod +x scripts/migrate-to-monorepo.sh`
- [ ] Review script contents: `cat scripts/migrate-to-monorepo.sh`
- [ ] Run migration: `./scripts/migrate-to-monorepo.sh`
- [ ] Verify files moved: `ls apps/web/src`

**Expected output:**
```
🔄 Migrating to monorepo structure...
📦 Moving Next.js files to apps/web...
  Moving src...
  Moving drizzle...
  Moving scripts...
  ...
✅ Migration complete!
```

### 2. Install Dependencies

- [ ] Install workspace dependencies: `pnpm install`
- [ ] Verify installation: `ls node_modules`
- [ ] Check workspace packages: `pnpm list --depth 0`

**Expected packages:**
- `@fictures/web`
- `@fictures/ai-server`
- `@fictures/api-client`

### 3. Set Up Python Environment

- [ ] Navigate to AI server: `cd apps/ai-server`
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate venv: `source venv/bin/activate` (macOS/Linux) or `venv\Scripts\activate` (Windows)
- [ ] Verify activation: `which python` (should show `apps/ai-server/venv/bin/python`)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Verify installation: `pip list`
- [ ] Install dev tools (optional): `pip install -r requirements-dev.txt`
- [ ] Return to root: `cd ../..`

### 4. Configure Environment Variables

- [ ] Copy web .env: `cp .env.local apps/web/.env.local` (if not already done)
- [ ] Create AI server .env: `touch apps/ai-server/.env`
- [ ] Add AI server variables:
  ```bash
  # apps/ai-server/.env
  TEXT_MODEL_PATH=models/text/llama-3.2-3b
  IMAGE_MODEL_PATH=models/images/stable-diffusion-xl
  CUDA_VISIBLE_DEVICES=0
  MODEL_CACHE_DIR=~/.cache/huggingface
  API_PORT=8000
  API_HOST=0.0.0.0
  CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
  ```

### 5. Test Setup

#### Test Next.js (Web App)

- [ ] Start web server: `pnpm dev:web`
- [ ] Verify console output (no errors)
- [ ] Open browser: http://localhost:3000
- [ ] Check if app loads correctly
- [ ] Stop server: `Ctrl+C`

#### Test AI Server

- [ ] Activate Python venv: `cd apps/ai-server && source venv/bin/activate && cd ../..`
- [ ] Start AI server: `pnpm dev:ai`
- [ ] Verify console output (no errors)
- [ ] Check health endpoint: `curl http://localhost:8000/health`
- [ ] Open API docs: http://localhost:8000/docs
- [ ] Test text endpoint:
  ```bash
  curl -X POST http://localhost:8000/api/v1/text/generate \
    -H "Content-Type: application/json" \
    -d '{"prompt": "Test", "max_tokens": 10}'
  ```
- [ ] Stop server: `Ctrl+C`

#### Test Both Servers Together

- [ ] Start both: `pnpm dev`
- [ ] Verify both servers running:
  - Web: http://localhost:3000
  - AI: http://localhost:8000/docs
- [ ] Check console for both server logs
- [ ] Stop both: `Ctrl+C`

### 6. Generate TypeScript Types

- [ ] Ensure AI server is running: `pnpm dev:ai`
- [ ] Open new terminal
- [ ] Navigate to API client: `cd packages/api-client`
- [ ] Generate types: `pnpm generate`
- [ ] Verify generated file: `ls src/generated/schema.ts`
- [ ] Check file contents: `head src/generated/schema.ts`

### 7. Test API Client Integration

- [ ] Create test file: `apps/web/src/app/api/test-ai/route.ts`
- [ ] Add test code:
  ```typescript
  import { aiClient } from '@fictures/api-client';

  export async function GET() {
    try {
      const health = await aiClient.healthCheck();
      return Response.json({ success: true, health });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  }
  ```
- [ ] Start both servers: `pnpm dev`
- [ ] Test endpoint: `curl http://localhost:3000/api/test-ai`
- [ ] Verify response: Should return `{"success": true, "health": {"status": "healthy"}}`

## 🎨 Adding AI Models (Optional)

### Text Generation Model

- [ ] Create directory: `mkdir -p apps/ai-server/models/text`
- [ ] Download model (choose one):
  - [ ] Llama 3.2: `ollama pull llama3.2:3b` (if using Ollama)
  - [ ] Mistral: Download from Hugging Face
  - [ ] Other LLM of your choice
- [ ] Verify model files: `ls apps/ai-server/models/text/`
- [ ] Implement in `apps/ai-server/src/services/text_service.py`
- [ ] Update `apps/ai-server/src/routes/text_generation.py`
- [ ] Test text generation: `curl -X POST http://localhost:8000/api/v1/text/generate ...`

### Image Generation Model

- [ ] Create directory: `mkdir -p apps/ai-server/models/images`
- [ ] Download model (choose one):
  - [ ] Stable Diffusion XL
  - [ ] FLUX.1 Schnell
  - [ ] Other diffusion model
- [ ] Verify model files: `ls apps/ai-server/models/images/`
- [ ] Implement in `apps/ai-server/src/services/image_service.py`
- [ ] Update `apps/ai-server/src/routes/image_generation.py`
- [ ] Test image generation: `curl -X POST http://localhost:8000/api/v1/images/generate ...`

## 📝 Post-Setup Tasks

### Documentation

- [ ] Read `MONOREPO-SETUP.md` - Complete setup guide
- [ ] Read `docs/monorepo-architecture.md` - Architecture overview
- [ ] Read `apps/ai-server/README.md` - AI server documentation
- [ ] Read `packages/api-client/README.md` - API client usage
- [ ] Update `CLAUDE.md` if needed with monorepo context

### Git

- [ ] Review changes: `git status`
- [ ] Stage new files: `git add .`
- [ ] Commit migration: `git commit -m "chore: migrate to monorepo structure with Python AI server"`
- [ ] Create feature branch: `git checkout -b feature/local-ai-models`
- [ ] Push to remote: `git push -u origin feature/local-ai-models`

### Deployment Setup (Future)

- [ ] Update Vercel configuration for `apps/web`
- [ ] Choose AI server deployment platform (Railway, Fly.io, Modal Labs)
- [ ] Configure environment variables in deployment platforms
- [ ] Test production builds locally: `pnpm build`

## 🐛 Troubleshooting

If you encounter issues, check:

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000
lsof -i :8000

# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Python Issues

```bash
# Deactivate and recreate venv
deactivate
rm -rf apps/ai-server/venv
cd apps/ai-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### pnpm Issues

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/web/node_modules
rm -rf packages/api-client/node_modules
pnpm install
```

### Type Generation Issues

```bash
# Ensure AI server is accessible
curl http://localhost:8000/health
curl http://localhost:8000/openapi.json

# Regenerate
cd packages/api-client
rm -rf src/generated
pnpm generate
```

## ✅ Success Criteria

You've successfully completed setup when:

- [x] ✅ Both servers start without errors: `pnpm dev`
- [x] ✅ Web app loads: http://localhost:3000
- [x] ✅ AI API docs load: http://localhost:8000/docs
- [x] ✅ Health check works: `curl http://localhost:8000/health`
- [x] ✅ TypeScript types generated: `packages/api-client/src/generated/schema.ts` exists
- [x] ✅ API client works in Next.js: Test endpoint returns success
- [x] ✅ No console errors in either server
- [x] ✅ Hot reload works for both servers

## 🎉 Next Steps

After completing this checklist:

1. **Add your AI models** - Download and implement local models
2. **Integrate AI features** - Use `@fictures/api-client` in your Next.js app
3. **Replace cloud APIs** - Gradually replace Gemini API with local models
4. **Optimize performance** - Tune model settings, implement caching
5. **Deploy** - Set up production deployments

## 📚 Additional Resources

- **AI Model Sources**:
  - Hugging Face: https://huggingface.co/models
  - Ollama: https://ollama.ai
  - Stability AI: https://stability.ai

- **Deployment Platforms**:
  - Railway: https://railway.app
  - Fly.io: https://fly.io
  - Modal Labs: https://modal.com
  - Vercel: https://vercel.com

- **Documentation**:
  - FastAPI: https://fastapi.tiangolo.com
  - Diffusers: https://huggingface.co/docs/diffusers
  - Transformers: https://huggingface.co/docs/transformers

---

**Need help?** Check the troubleshooting section or review the documentation files.
