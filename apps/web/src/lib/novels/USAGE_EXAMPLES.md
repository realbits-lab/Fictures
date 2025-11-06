# Usage Examples - Multi-Model Text Generation

This document shows practical examples of using the multi-model text generation system.

## 🎯 Table of Contents

1. [Basic Text Generation](#basic-text-generation)
2. [Using Prompt Templates](#using-prompt-templates)
3. [Streaming Generation](#streaming-generation)
4. [Legacy Compatibility](#legacy-compatibility)
5. [API Route Examples](#api-route-examples)
6. [Custom Prompt Management](#custom-prompt-management)

---

## Basic Text Generation

### Simple Generation Request

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateStoryContent() {
  const result = await textGenerationClient.generate({
    prompt: 'Write a dramatic opening scene set in a medieval castle.',
    systemPrompt: 'You are a skilled fantasy writer specializing in vivid descriptions.',
    temperature: 0.7,
    maxTokens: 1000,
  });

  console.log('Generated text:', result.text);
  console.log('Model used:', result.model);
  console.log('Tokens used:', result.tokensUsed);
  console.log('Finish reason:', result.finishReason);
}
```

### With Custom Options

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateDialogue() {
  const result = await textGenerationClient.generate({
    prompt: 'Write a tense conversation between two rival knights.',
    systemPrompt: 'Write authentic medieval dialogue with period-appropriate language.',
    temperature: 0.8,        // Higher creativity for dialogue
    maxTokens: 2000,
    topP: 0.95,              // Nucleus sampling
    stopSequences: ['END'],  // Stop at specific tokens
  });

  return result.text;
}
```

---

## Using Prompt Templates

### Chapter Generation Template

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateChapter() {
  const result = await textGenerationClient.generateWithTemplate(
    'chapter_generation',
    {
      context: `
        Act 2: The Dark Forest
        Character: Sir Aldric must overcome his pride
        Adversity: Lost in enemy territory, betrayed by his squire
        Virtue: Must choose between pride and asking enemy for help
      `,
    },
    {
      temperature: 0.7,
      maxTokens: 4096,
    }
  );

  return result.text;
}
```

### Scene Content Template

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateScene() {
  const result = await textGenerationClient.generateWithTemplate(
    'scene_content',
    {
      title: 'The Confrontation',
      summary: 'Sir Aldric faces his rival in the throne room',
      characters: 'Sir Aldric (protagonist), Lord Blackwood (antagonist)',
      previousContext: 'Aldric discovered the betrayal and stormed the castle',
    },
    {
      temperature: 0.8,  // Higher creativity for prose
      maxTokens: 3000,
    }
  );

  return result.text;
}
```

### Character Dialogue Template

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateDialogue() {
  const result = await textGenerationClient.generateWithTemplate(
    'character_dialogue',
    {
      characters: 'Sir Aldric (proud, honorable), Lady Evelyn (cunning, pragmatic)',
      context: 'They must decide whether to trust the mysterious stranger',
      tone: 'tense, with underlying mistrust',
    }
  );

  return result.text;
}
```

---

## Streaming Generation

### Basic Streaming

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function streamStoryGeneration() {
  console.log('Starting stream...\n');

  for await (const chunk of textGenerationClient.generateStream({
    prompt: 'Write a long fantasy story about a forgotten kingdom.',
    systemPrompt: 'You are an epic fantasy storyteller.',
    maxTokens: 4096,
  })) {
    process.stdout.write(chunk);
  }

  console.log('\n\nStream completed!');
}
```

### Streaming with SSE (Server-Sent Events)

```typescript
// API Route: app/api/generate/stream/route.ts
import { NextRequest } from 'next/server';
import { textGenerationClient } from '@/lib/novels/ai-client';

export async function POST(request: NextRequest) {
  const { prompt, systemPrompt } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of textGenerationClient.generateStream({
          prompt,
          systemPrompt,
          maxTokens: 4096,
        })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## Legacy Compatibility

### Using generateWithGemini (Old Code)

```typescript
import { generateWithGemini } from '@/lib/novels/ai-client';

// This function works with both Gemini and AI Server
// It automatically uses the provider set in TEXT_GENERATION_PROVIDER
async function legacyGeneration() {
  const text = await generateWithGemini({
    prompt: 'Write a story opening...',
    systemPrompt: 'You are a creative writer...',
    model: 'gemini-2.5-flash-mini',  // Model name (provider-agnostic)
    temperature: 0.7,
    maxTokens: 2048,
  });

  return text;
}
```

### Migrating Old Code

**Before (direct Gemini API):**
```typescript
const response = await generateWithGemini({
  prompt: myPrompt,
  systemPrompt: mySystemPrompt,
  model: 'gemini-2.5-flash',
});
```

**After (new wrapper - same code!):**
```typescript
// No changes needed! Just set TEXT_GENERATION_PROVIDER in .env
const response = await generateWithGemini({
  prompt: myPrompt,
  systemPrompt: mySystemPrompt,
  model: 'gemini-2.5-flash-mini',
});
```

---

## API Route Examples

### Complete Chapter Generation Route

```typescript
// app/studio/api/generation/chapters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { textGenerationClient } from '@/lib/novels/ai-client';

export async function POST(request: NextRequest) {
  try {
    const { partContext, characters } = await request.json();

    // Validation
    if (!partContext || !characters) {
      return NextResponse.json(
        { error: 'Part context and characters are required' },
        { status: 400 }
      );
    }

    // Generate using template
    const result = await textGenerationClient.generateWithTemplate(
      'chapter_generation',
      {
        context: JSON.stringify({ partContext, characters }),
      },
      {
        temperature: 0.7,
        maxTokens: 4096,
      }
    );

    // Parse and return chapters
    const chapters = parseChaptersFromText(result.text, characters);

    return NextResponse.json({
      chapters,
      model: result.model,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('Chapter generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate chapters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function parseChaptersFromText(text: string, characters: any[]) {
  // Your parsing logic here
  return [];
}
```

### Scene Content Generation Route

```typescript
// app/studio/api/generation/scene-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { textGenerationClient } from '@/lib/novels/ai-client';
import type { SceneContentResult } from '@/lib/novels/types';

export async function POST(request: NextRequest) {
  try {
    const { sceneSummary, characters, settings } = await request.json();

    if (!sceneSummary || !characters || !settings) {
      return NextResponse.json(
        { error: 'Scene summary, characters, and settings are required' },
        { status: 400 }
      );
    }

    // Build context
    const sceneContext = buildSceneContext(sceneSummary, characters, settings);

    // Generate with high creativity for prose
    const result = await textGenerationClient.generate({
      prompt: sceneContext,
      systemPrompt: 'You are a skilled scene writer...',
      temperature: 0.8,  // Higher creativity for prose
      maxTokens: 4096,
    });

    const response: SceneContentResult = {
      content: result.text.trim(),
      emotionalTone: sceneSummary.emotionalBeat,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scene content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene content' },
      { status: 500 }
    );
  }
}

function buildSceneContext(sceneSummary: any, characters: any[], settings: any[]) {
  return `Scene: ${sceneSummary.title}\nSummary: ${sceneSummary.summary}`;
}
```

---

## Custom Prompt Management

### Getting and Customizing Prompts

```typescript
import { promptManager } from '@/lib/novels/prompt-manager';

// Get current provider type
import { textGenerationClient } from '@/lib/novels/ai-client';
const provider = textGenerationClient.getProviderType();
console.log('Current provider:', provider); // 'gemini' or 'ai-server'

// Get prompt for current provider
const prompt = promptManager.getPrompt(provider, 'scene_content', {
  title: 'The Battle',
  summary: 'Epic confrontation',
  characters: 'Hero, Villain',
  previousContext: 'They met on the battlefield',
});

console.log('System prompt:', prompt.system);
console.log('User prompt:', prompt.user);
```

### Updating Provider-Specific Prompts

```typescript
import { promptManager } from '@/lib/novels/prompt-manager';

// Customize Gemini prompts
promptManager.updatePrompt('gemini', 'scene_content', {
  system: `You are a master storyteller specializing in cinematic scenes.
Write with vivid imagery and emotional depth.`,
  userTemplate: `Scene: {title}
Summary: {summary}

Write a compelling scene with:
- Strong visual details
- Authentic dialogue
- Emotional resonance`,
});

// Customize AI Server (Qwen-3) prompts differently
promptManager.updatePrompt('ai-server', 'scene_content', {
  system: `You are a creative writer. Write engaging narrative prose.`,
  userTemplate: `Create a scene titled "{title}" with this summary: {summary}

Focus on clear storytelling and character development.`,
});
```

### Viewing All Prompts

```typescript
import { promptManager } from '@/lib/novels/prompt-manager';

// Get all prompts for Gemini
const geminiPrompts = promptManager.getAllPrompts('gemini');
console.log('Gemini prompts:', geminiPrompts);

// Get all prompts for AI Server
const aiServerPrompts = promptManager.getAllPrompts('ai-server');
console.log('AI Server prompts:', aiServerPrompts);
```

---

## 🧪 Testing Examples

### Unit Test Example

```typescript
// __tests__/ai-client.test.ts
import { textGenerationClient } from '@/lib/novels/ai-client';

describe('Text Generation Client', () => {
  it('should generate text successfully', async () => {
    const result = await textGenerationClient.generate({
      prompt: 'Write a test story',
      systemPrompt: 'You are a test writer',
      maxTokens: 100,
    });

    expect(result.text).toBeDefined();
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.model).toBeDefined();
  });

  it('should use template successfully', async () => {
    const result = await textGenerationClient.generateWithTemplate(
      'story_summary',
      {
        genre: 'Fantasy',
        themes: 'courage, sacrifice',
        audience: 'young adult',
        length: 'novel',
      }
    );

    expect(result.text).toBeDefined();
    expect(result.model).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
// test-scripts/test-multi-model.mjs
import { textGenerationClient } from '../src/lib/novels/ai-client.ts';

async function testMultiModel() {
  console.log('Testing multi-model generation...');
  console.log('Provider:', textGenerationClient.getProviderType());

  const prompt = {
    prompt: 'Write a short fantasy story opening.',
    systemPrompt: 'You are a creative fantasy writer.',
    maxTokens: 500,
  };

  console.log('\nGenerating with current provider...');
  const result = await textGenerationClient.generate(prompt);

  console.log('\nResult:');
  console.log('Model:', result.model);
  console.log('Tokens:', result.tokensUsed);
  console.log('Text length:', result.text.length);
  console.log('\nGenerated text:');
  console.log(result.text);
}

testMultiModel();
```

---

## 📊 Performance Monitoring

### Tracking Generation Metrics

```typescript
import { textGenerationClient } from '@/lib/novels/ai-client';

async function generateWithMetrics(prompt: string) {
  const startTime = Date.now();

  const result = await textGenerationClient.generate({
    prompt,
    systemPrompt: 'You are a writer...',
    maxTokens: 2048,
  });

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Log metrics
  console.log({
    provider: textGenerationClient.getProviderType(),
    model: result.model,
    tokensUsed: result.tokensUsed,
    durationMs: duration,
    tokensPerSecond: result.tokensUsed ? (result.tokensUsed / (duration / 1000)).toFixed(2) : 'N/A',
    textLength: result.text.length,
  });

  return result;
}
```

---

**For more information, see [README.md](./README.md)**
