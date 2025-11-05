# Fictures - AI Story Writing Platform (Monorepo)

> **Next.js 15 + Python FastAPI** - Complete platform with local AI model serving

## 🏗️ Monorepo Structure

```
Fictures/
├── apps/
│   ├── web/          # Next.js 15 story writing platform
│   └── ai-server/    # Python FastAPI for local AI models
├── packages/
│   └── api-client/   # TypeScript client for AI server
└── docs/             # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- pnpm 9+

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/realbits-lab/Fictures.git
cd Fictures

# Install dependencies
pnpm install

# Setup Python environment
cd apps/ai-server
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cd ../..
```

### 2. Configure Environment

```bash
# Copy environment template (if you have one)
cp .env.example apps/web/.env.local

# Add your environment variables
# - Database (Neon PostgreSQL)
# - Authentication (NextAuth.js)
# - AI Gateway
# - Blob Storage
```

### 3. Run Development Servers

```bash
# Run both Next.js and AI server
pnpm dev

# Or run individually
pnpm dev:web    # Next.js on :3000
pnpm dev:ai     # FastAPI on :8000
```

### 4. Access Applications

- **Web App**: http://localhost:3000
- **AI Server API Docs**: http://localhost:8000/docs
- **AI Server Health**: http://localhost:8000/health

## 📦 What's Included

### Next.js Web App (`apps/web`)
- ✅ **Next.js 15** with App Router
- ✅ **Novel Generation** - Adversity-Triumph Engine
- ✅ **Database** - PostgreSQL (Neon) with Drizzle ORM
- ✅ **Authentication** - NextAuth.js v5 (Google OAuth + Email/Password)
- ✅ **AI Integration** - Gemini 2.5 Flash via Vercel AI SDK
- ✅ **Image Storage** - Vercel Blob
- ✅ **Styling** - Tailwind CSS v4
- ✅ **Testing** - Jest + Playwright

### Python AI Server (`apps/ai-server`)
- ✅ **FastAPI** with automatic OpenAPI docs
- ✅ **Text Generation** API endpoint
- ✅ **Image Generation** API endpoint
- ✅ **CORS** configured for Next.js
- ✅ **Hot Reload** with uvicorn
- ✅ **Type Safety** with Pydantic schemas

### TypeScript API Client (`packages/api-client`)
- ✅ **Type-Safe** client for AI server
- ✅ **Auto-Generated** types from OpenAPI schema
- ✅ **Easy Integration** with Next.js

## 🎯 Key Features

### Story Generation
- **Novel Generation**: Multi-phase generation (summary → characters → settings → parts → chapters → scenes)
- **Scene Quality**: Automated evaluation and improvement
- **Image Generation**: Story covers, character portraits, scene illustrations
- **Moral Framework**: Adversity-Triumph Engine methodology

### Local AI Models
- **Text Generation**: Use Llama, Mistral, or other local LLMs
- **Image Generation**: Stable Diffusion XL, FLUX, or custom models
- **Cost Savings**: No cloud API costs
- **Privacy**: Data never leaves your infrastructure

### Type Safety
- **Python → TypeScript**: Pydantic models generate TypeScript types
- **Compile-Time Errors**: Catch API contract violations early
- **Auto-Complete**: Full IDE support for AI endpoints

## 📖 Documentation

### Essential Guides
- **[MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)** - Quick start (if migrating)
- **[MONOREPO-SETUP.md](MONOREPO-SETUP.md)** - Complete setup guide
- **[docs/monorepo-architecture.md](docs/monorepo-architecture.md)** - Architecture overview
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines

### Component Documentation
- **[apps/ai-server/README.md](apps/ai-server/README.md)** - AI server setup
- **[packages/api-client/README.md](packages/api-client/README.md)** - API client usage

### Feature Documentation
- **Novel Generation**: `docs/novels/` (specification, development, testing)
- **Image System**: `docs/image/` (generation, optimization)

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Run both servers
pnpm dev:web          # Next.js only
pnpm dev:ai           # AI server only

# Building
pnpm build            # Build Next.js app

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run Jest tests
pnpm test:watch       # Watch mode

# Type Generation (AI Client)
cd packages/api-client
pnpm generate         # Generate types from AI server
```

## 🔧 Adding Local AI Models

### Text Generation (Llama Example)

1. **Download model**:
```bash
cd apps/ai-server/models/text
# Download from Hugging Face
huggingface-cli download meta-llama/Llama-3.2-3B
```

2. **Implement loading** in `apps/ai-server/src/services/text_service.py`:
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

def load_text_model():
    model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-3B")
    tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-3B")
    return model, tokenizer
```

3. **Update route** in `apps/ai-server/src/routes/text_generation.py`

### Image Generation (Stable Diffusion Example)

1. **Download model**:
```bash
cd apps/ai-server/models/images
# Download Stable Diffusion XL
```

2. **Implement loading** in `apps/ai-server/src/services/image_service.py`:
```python
from diffusers import StableDiffusionXLPipeline
import torch

def load_image_model():
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16
    )
    pipe.to("cuda")
    return pipe
```

3. **Update route** in `apps/ai-server/src/routes/image_generation.py`

## 🌐 Using the AI Server in Next.js

### In API Routes (Server-Side)

```typescript
// apps/web/src/app/api/ai/generate/route.ts
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
      prompt: 'Write a story about...',
    });
    console.log(result.text);
  };

  return <button onClick={generate}>Generate</button>;
}
```

## 🚢 Deployment

### Next.js → Vercel
```bash
cd apps/web
vercel deploy
```

### Python AI Server → Railway
```bash
cd apps/ai-server
railway up
```

**Alternative Platforms:**
- **Fly.io** - Containerized deployment
- **Modal Labs** - On-demand GPU inference
- **AWS/GCP** - Full control

## 🧪 Testing

```bash
# Unit tests (Jest)
pnpm test
pnpm test:watch

# E2E tests (Playwright)
cd apps/web
dotenv --file .env.local run npx playwright test
```

## 📊 Project Status

- ✅ Monorepo structure with pnpm workspaces
- ✅ FastAPI server with OpenAPI documentation
- ✅ TypeScript client with type generation
- ✅ Development workflow configured
- ⏳ Add local AI models (your next step!)
- ⏳ Integrate AI endpoints in Next.js

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **FastAPI** - Python web framework
- **Vercel AI SDK** - AI integration toolkit
- **Drizzle ORM** - TypeScript ORM
- **NextAuth.js** - Authentication
- **Hugging Face** - Model hub

## 📧 Support

- **Issues**: https://github.com/realbits-lab/Fictures/issues
- **Documentation**: See `docs/` directory
- **AI Server Docs**: http://localhost:8000/docs (when running)

---

Built with ❤️ using Next.js, Python, and local AI models
