# Monorepo Migration Guide

This guide covers the migration from a single Next.js app to a monorepo structure with Python AI server.

## 🏗️ New Structure

```
Fictures/
├── apps/
│   ├── web/                    # Next.js application (moved from root)
│   │   ├── src/
│   │   ├── scripts/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── ...
│   └── ai-server/              # Python FastAPI server (new)
│       ├── src/
│       │   ├── main.py
│       │   ├── routes/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── models/
│       ├── requirements.txt
│       └── package.json
├── packages/
│   └── api-client/             # TypeScript client for AI server (new)
│       ├── src/
│       └── package.json
├── pnpm-workspace.yaml         # Workspace configuration (new)
├── package.json                # Root orchestration (updated)
└── CLAUDE.md                   # Updated with monorepo info
```

## 📦 Migration Steps

### Step 1: Run Migration Script

```bash
# Make the script executable
chmod +x scripts/migrate-to-monorepo.sh

# Run migration
./scripts/migrate-to-monorepo.sh
```

This script:
- Creates `apps/web` directory
- Moves all Next.js files to `apps/web/`
- Copies `.env.local` to `apps/web/.env.local`
- Updates root `package.json`

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# This installs:
# - Root workspace dependencies
# - apps/web dependencies (Next.js)
# - packages/api-client dependencies (TypeScript client)
```

### Step 3: Set Up Python Environment

```bash
cd apps/ai-server

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install Python dependencies
pip install -r requirements.txt

# For development tools (optional)
pip install -r requirements-dev.txt
```

### Step 4: Test the Setup

```bash
# From monorepo root

# Test Next.js app
pnpm dev:web
# Visit: http://localhost:3000

# Test AI server (in another terminal)
pnpm dev:ai
# Visit: http://localhost:8000/docs

# Run both together
pnpm dev
```

## 🚀 Development Workflow

### Running Servers

```bash
# Run both servers in parallel
pnpm dev

# Run individually
pnpm dev:web    # Next.js on :3000
pnpm dev:ai     # FastAPI on :8000
```

### Building for Production

```bash
# Build Next.js app
pnpm build

# Or from apps/web
cd apps/web
pnpm build
```

### Running Tests

```bash
# Run Next.js tests
pnpm test

# Or from apps/web
cd apps/web
pnpm test
```

### Database Operations

```bash
# All database commands work from root
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## 🔧 TypeScript Type Generation

Generate type-safe TypeScript client from Python API:

```bash
# 1. Ensure AI server is running
pnpm dev:ai

# 2. Generate TypeScript types (in another terminal)
cd packages/api-client
pnpm generate
```

This creates `packages/api-client/src/generated/schema.ts` with all API types.

## 📝 Using the API Client in Next.js

### In API Routes (Server-Side)

```typescript
// apps/web/src/app/api/ai/text/route.ts
import { aiClient } from '@fictures/api-client';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const result = await aiClient.generateText({
    prompt,
    max_tokens: 1024,
    temperature: 0.8,
  });

  return Response.json(result);
}
```

### In React Components (Client-Side)

```typescript
// apps/web/src/components/AIGenerator.tsx
'use client';

import { aiClient } from '@fictures/api-client';

export function AIGenerator() {
  const generate = async () => {
    const result = await aiClient.generateText({
      prompt: 'Write a story...',
    });
    console.log(result.text);
  };

  return <button onClick={generate}>Generate</button>;
}
```

## 🐍 Adding Local AI Models

### Text Generation (e.g., Llama)

1. **Download model weights**:
```bash
cd apps/ai-server
mkdir -p models/text
# Download from Hugging Face, Ollama, etc.
```

2. **Implement model loading** in `apps/ai-server/src/services/text_service.py`:
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def load_text_model():
    model = AutoModelForCausalLM.from_pretrained("path/to/model")
    tokenizer = AutoTokenizer.from_pretrained("path/to/tokenizer")
    return model, tokenizer
```

3. **Update route handler** in `apps/ai-server/src/routes/text_generation.py`

### Image Generation (e.g., Stable Diffusion)

1. **Download model weights**:
```bash
cd apps/ai-server
mkdir -p models/images
# Download Stable Diffusion XL, FLUX, etc.
```

2. **Implement model loading** in `apps/ai-server/src/services/image_service.py`:
```python
from diffusers import StableDiffusionXLPipeline

def load_image_model():
    pipe = StableDiffusionXLPipeline.from_pretrained("path/to/model")
    return pipe
```

3. **Update route handler** in `apps/ai-server/src/routes/image_generation.py`

## 🔄 Development with Both Servers

### Typical Workflow

1. **Start both servers**:
```bash
pnpm dev
```

2. **Make changes to Python API**:
   - Edit files in `apps/ai-server/src/`
   - Server auto-reloads (thanks to `--reload` flag)

3. **Regenerate TypeScript types** (if API schema changed):
```bash
cd packages/api-client
pnpm generate
```

4. **Use new API in Next.js**:
   - Import from `@fictures/api-client`
   - Types are automatically updated

## 📚 Package References

### From apps/web

You can reference the API client:
```json
{
  "dependencies": {
    "@fictures/api-client": "workspace:*"
  }
}
```

Then use:
```typescript
import { aiClient } from '@fictures/api-client';
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (Next.js)
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000 (FastAPI)
lsof -ti:8000 | xargs kill -9
```

### Python Virtual Environment Issues

```bash
# Deactivate
deactivate

# Remove and recreate
rm -rf apps/ai-server/venv
cd apps/ai-server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### pnpm Install Fails

```bash
# Clear pnpm store
pnpm store prune

# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/web/node_modules
rm -rf packages/api-client/node_modules

# Reinstall
pnpm install
```

### TypeScript Type Generation Fails

Ensure:
1. AI server is running: `pnpm dev:ai`
2. Server is accessible: `curl http://localhost:8000/health`
3. OpenAPI endpoint works: `curl http://localhost:8000/openapi.json`

## 🚢 Deployment

### Next.js (Vercel)

Deploy from `apps/web` directory:
```bash
cd apps/web
vercel deploy
```

Update `vercel.json` if needed:
```json
{
  "buildCommand": "cd ../.. && pnpm build:web",
  "outputDirectory": ".next"
}
```

### Python AI Server

Options:
- **Railway**: Auto-detect `requirements.txt`
- **Fly.io**: Use `Dockerfile`
- **Render**: Deploy as Python service
- **Modal Labs**: For on-demand GPU inference

Example `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📖 Next Steps

1. ✅ Complete migration: `./scripts/migrate-to-monorepo.sh`
2. ✅ Test both servers: `pnpm dev`
3. 🔧 Add local AI models to `apps/ai-server/models/`
4. 🎨 Implement model loading in services
5. 🔄 Generate TypeScript types: `pnpm generate`
6. 🚀 Integrate AI features in Next.js app
7. 📚 Update documentation: `CLAUDE.md`

## 🆘 Support

- **AI Server API Docs**: http://localhost:8000/docs
- **AI Server README**: `apps/ai-server/README.md`
- **API Client README**: `packages/api-client/README.md`
- **Project CLAUDE.md**: Root `CLAUDE.md` (updated with monorepo info)
