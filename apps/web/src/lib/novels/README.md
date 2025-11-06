# Multi-Model Text Generation System

This directory contains the unified text generation system for Fictures, supporting multiple AI model providers.

## 🎯 Overview

The system provides a **single environment variable** to switch between different text generation models:
- **Gemini 2.5 Flash Mini** (Google AI API) - Cloud-based, fast, cost-effective
- **Qwen-3** (AI Server) - Self-hosted, local inference via FastAPI

All prompts are managed separately per model, allowing customization and optimization for each provider.

## 📁 File Structure

```
src/lib/novels/
├── README.md                 # This file
├── types.ts                  # TypeScript type definitions
├── prompt-manager.ts         # Centralized prompt management
├── system-prompts.ts         # Detailed system prompts
└── ai-client.ts              # Main text generation wrapper
```

## 🚀 Quick Start

### 1. Environment Configuration

Set your preferred provider in `.env.local`:

```bash
# Choose your text generation provider
TEXT_GENERATION_PROVIDER=gemini  # or "ai-server"

# Gemini Configuration (if using gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
GEMINI_MODEL_NAME=gemini-2.5-flash-mini
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=8192

# AI Server Configuration (if using ai-server)
AI_SERVER_URL=http://localhost:8000
AI_SERVER_TIMEOUT=120000
```

### 2. Basic Usage

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

// Generate text with raw prompt
const result = await textGenerationClient.generate({
  prompt: 'Write a dramatic scene...',
  systemPrompt: 'You are a creative writer...',
  temperature: 0.7,
  maxTokens: 2048,
});

console.log(result.text);
console.log(result.model);
console.log(result.tokensUsed);
```

### 3. Using Prompt Templates

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

// Generate using predefined prompt template
const result = await textGenerationClient.generateWithTemplate(
  'scene_content',
  {
    title: 'The Dark Forest',
    summary: 'Character enters mysterious forest',
    characters: 'Alice, Bob',
    previousContext: 'They fled the castle...',
  },
  {
    temperature: 0.8,
    maxTokens: 3000,
  }
);

console.log(result.text);
```

### 4. Streaming Generation

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

// Stream text generation for better UX
for await (const chunk of textGenerationClient.generateStream({
  prompt: 'Write a long story...',
  systemPrompt: 'You are a novelist...',
})) {
  process.stdout.write(chunk);
}
```

### 5. Legacy Compatibility

```typescript
import { generateWithGemini } from '@/lib/novels/ai-client';

// Works with existing code (automatically uses configured provider)
const text = await generateWithGemini({
  prompt: 'Generate chapter...',
  systemPrompt: 'You are a story architect...',
  model: 'gemini-2.5-flash-mini',
  temperature: 0.7,
  maxTokens: 8192,
});
```

## 📝 Available Prompt Types

The system includes pre-configured prompt templates:

1. **`chapter_generation`** - Generate story chapters with Adversity-Triumph cycle
2. **`scene_content`** - Write immersive scene content with dialogue
3. **`scene_summary`** - Break chapters into scene summaries
4. **`character_dialogue`** - Generate authentic character conversations
5. **`setting_description`** - Create vivid location descriptions
6. **`story_summary`** - Develop story concepts and premises

### Customizing Prompts Per Model

```typescript
import { promptManager } from '@/lib/novels/prompt-manager';

// Update Gemini-specific prompt
promptManager.updatePrompt('gemini', 'scene_content', {
  system: 'Your custom system prompt for Gemini...',
  userTemplate: 'Custom user template with {variables}...',
});

// Update AI Server (Qwen-3) specific prompt
promptManager.updatePrompt('ai-server', 'scene_content', {
  system: 'Your custom system prompt for Qwen-3...',
  userTemplate: 'Custom user template optimized for Qwen...',
});
```

## 🔧 API Route Example

```typescript
// src/app/studio/api/generation/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { textGenerationClient } from '@/lib/novels/ai-client';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();

    // Generate using prompt template
    const result = await textGenerationClient.generateWithTemplate(
      'chapter_generation',
      { context },
      {
        temperature: 0.7,
        maxTokens: 4096,
      }
    );

    return NextResponse.json({
      text: result.text,
      model: result.model,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
```

## 🎨 Model Provider Details

### Gemini 2.5 Flash Mini

**Pros:**
- ✅ Fast response times
- ✅ Cost-effective for high volume
- ✅ No infrastructure management
- ✅ Excellent for creative writing
- ✅ Strong instruction following

**Cons:**
- ❌ Requires API key
- ❌ Internet dependency
- ❌ Usage costs (pay per token)

**Best for:**
- Production deployments
- High-scale applications
- Rapid prototyping
- Cloud-first architectures

### AI Server (Qwen-3)

**Pros:**
- ✅ Self-hosted (no external API)
- ✅ No per-token costs
- ✅ Complete data privacy
- ✅ Customizable inference settings

**Cons:**
- ❌ Requires GPU hardware
- ❌ Self-managed infrastructure
- ❌ Higher latency than cloud API

**Best for:**
- Local development
- Privacy-sensitive applications
- Cost optimization (high volume)
- Offline environments

## 🔄 Switching Between Providers

Simply change the environment variable - **no code changes required**:

```bash
# Switch to Gemini
TEXT_GENERATION_PROVIDER=gemini

# Switch to AI Server
TEXT_GENERATION_PROVIDER=ai-server
```

The system automatically:
- Uses provider-specific prompts
- Handles API differences
- Maintains consistent interface
- Returns standardized responses

## 🧪 Testing Different Providers

```typescript
// Test script example
import { textGenerationClient } from '@/lib/novels/ai-client';

const testPrompt = {
  prompt: 'Write a short dramatic scene',
  systemPrompt: 'You are a creative writer',
  maxTokens: 500,
};

console.log('Provider:', textGenerationClient.getProviderType());

const result = await textGenerationClient.generate(testPrompt);

console.log('Generated text:', result.text);
console.log('Model used:', result.model);
console.log('Tokens:', result.tokensUsed);
```

## 📊 Performance Comparison

| Feature | Gemini 2.5 Flash Mini | AI Server (Qwen-3) |
|---------|----------------------|-------------------|
| Response Time | ~1-3 seconds | ~3-10 seconds |
| Cost | Pay per token | Hardware only |
| Setup | API key | FastAPI + GPU |
| Scalability | Auto-scales | Manual scaling |
| Privacy | Cloud API | Self-hosted |

## 🛠️ Advanced Usage

### Custom Generation Options

```typescript
const result = await textGenerationClient.generate({
  prompt: 'Your prompt here',
  systemPrompt: 'Your system prompt',
  temperature: 0.8,      // Creativity (0.0 - 1.0)
  maxTokens: 4096,       // Maximum response length
  topP: 0.95,            // Nucleus sampling
  stopSequences: ['END'], // Stop generation at these tokens
});
```

### Error Handling

```typescript
try {
  const result = await textGenerationClient.generate({
    prompt: 'Generate content...',
  });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      console.error('Invalid API key');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out');
    } else {
      console.error('Generation failed:', error.message);
    }
  }
}
```

## 📚 System Prompts

All system prompts are defined in `system-prompts.ts`:

- **`CHAPTERS_GENERATION_PROMPT`** - Adversity-Triumph narrative framework
- **`SCENE_CONTENT_PROMPT`** - Immersive scene writing guidelines
- **`SCENE_SUMMARY_PROMPT`** - Scene breakdown principles
- **`STORY_SUMMARY_PROMPT`** - Story development framework
- **`CHARACTER_GENERATION_PROMPT`** - Character design philosophy

These prompts encode the **Adversity-Triumph Engine** methodology for emotionally resonant storytelling.

## 🔐 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TEXT_GENERATION_PROVIDER` | Yes | `gemini` | Provider selection: `gemini` or `ai-server` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | If using Gemini | - | Google AI API key |
| `GEMINI_MODEL_NAME` | No | `gemini-2.5-flash-mini` | Gemini model to use |
| `GEMINI_TEMPERATURE` | No | `0.7` | Gemini creativity (0.0-1.0) |
| `GEMINI_MAX_TOKENS` | No | `8192` | Gemini max output tokens |
| `AI_SERVER_URL` | If using AI Server | `http://localhost:8000` | AI Server endpoint |
| `AI_SERVER_TIMEOUT` | No | `120000` | AI Server request timeout (ms) |

## 🎯 Design Principles

1. **Single Source of Truth**: One environment variable controls everything
2. **Provider Isolation**: Each model has its own optimized prompts
3. **Unified Interface**: Same API regardless of provider
4. **Easy Migration**: Switch providers without code changes
5. **Type Safety**: Full TypeScript support
6. **Extensible**: Easy to add new providers

## 📖 Related Documentation

- **Story Generation**: `/docs/novels/novels-specification.md`
- **API Development**: `/docs/novels/novels-development.md`
- **Testing Guide**: `/docs/novels/novels-testing.md`

---

**For questions or issues, refer to the main project documentation or create an issue on GitHub.**
