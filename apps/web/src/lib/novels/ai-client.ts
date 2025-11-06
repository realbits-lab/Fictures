/**
 * AI Client - Text Generation Wrapper
 * Unified interface for multiple AI providers (Gemini, AI Server)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ModelProvider,
  PromptType,
  TextGenerationRequest,
  TextGenerationResponse,
  GenerationOptions,
} from './types';
import { promptManager } from './prompt-manager';

/**
 * Environment configuration
 */
const getConfig = () => {
  const provider = (process.env.TEXT_GENERATION_PROVIDER || 'gemini') as ModelProvider;

  return {
    provider,
    gemini: {
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      modelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash-mini',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
    },
    aiServer: {
      url: process.env.AI_SERVER_URL || 'http://localhost:8000',
      timeout: parseInt(process.env.AI_SERVER_TIMEOUT || '120000', 10),
    },
  };
};

/**
 * Abstract base class for text generation providers
 */
abstract class TextGenerationProvider {
  abstract generate(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  abstract generateStream(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown>;
}

/**
 * Gemini Provider Implementation
 */
class GeminiProvider extends TextGenerationProvider {
  private client: GoogleGenerativeAI;
  private config: ReturnType<typeof getConfig>['gemini'];

  constructor() {
    super();
    this.config = getConfig().gemini;

    if (!this.config.apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
    }

    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  async generate(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const model = this.client.getGenerativeModel({
      model: request.model || this.config.modelName,
    });

    const generationConfig = {
      temperature: request.temperature ?? this.config.temperature,
      maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
      topP: request.topP ?? 0.95,
      stopSequences: request.stopSequences,
    };

    // Combine system and user prompts
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    return {
      text,
      model: request.model || this.config.modelName,
      tokensUsed: response.usageMetadata?.totalTokenCount,
      finishReason: response.candidates?.[0]?.finishReason,
    };
  }

  async *generateStream(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown> {
    const model = this.client.getGenerativeModel({
      model: request.model || this.config.modelName,
    });

    const generationConfig = {
      temperature: request.temperature ?? this.config.temperature,
      maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
      topP: request.topP ?? 0.95,
      stopSequences: request.stopSequences,
    };

    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig,
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }
}

/**
 * AI Server Provider Implementation (Qwen-3 via FastAPI)
 */
class AIServerProvider extends TextGenerationProvider {
  private config: ReturnType<typeof getConfig>['aiServer'];

  constructor() {
    super();
    this.config = getConfig().aiServer;
  }

  async generate(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const response = await fetch(`${this.config.url}/api/v1/text/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP ?? 0.9,
        stop_sequences: request.stopSequences ?? [],
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Server error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      model: result.model,
      tokensUsed: result.tokens_used,
      finishReason: result.finish_reason,
    };
  }

  async *generateStream(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown> {
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const response = await fetch(`${this.config.url}/api/v1/text/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP ?? 0.9,
        stop_sequences: request.stopSequences ?? [],
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Server error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body from AI Server');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                yield parsed.text;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Text Generation Wrapper
 * Provides unified interface for all text generation operations
 */
class TextGenerationWrapper {
  private provider: TextGenerationProvider;
  private providerType: ModelProvider;

  constructor() {
    const config = getConfig();
    this.providerType = config.provider;

    if (this.providerType === 'gemini') {
      this.provider = new GeminiProvider();
    } else if (this.providerType === 'ai-server') {
      this.provider = new AIServerProvider();
    } else {
      throw new Error(`Unsupported provider: ${this.providerType}`);
    }
  }

  /**
   * Generate text with raw prompt
   */
  async generate(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    return this.provider.generate(request);
  }

  /**
   * Generate text with streaming
   */
  async *generateStream(
    request: TextGenerationRequest
  ): AsyncGenerator<string, void, unknown> {
    yield* this.provider.generateStream(request);
  }

  /**
   * Generate text using prompt template
   */
  async generateWithTemplate(
    promptType: PromptType,
    variables: Record<string, string>,
    options?: GenerationOptions
  ): Promise<TextGenerationResponse> {
    const { system, user } = promptManager.getPrompt(this.providerType, promptType, variables);

    return this.generate({
      prompt: user,
      systemPrompt: system,
      ...options,
    });
  }

  /**
   * Get current provider type
   */
  getProviderType(): ModelProvider {
    return this.providerType;
  }
}

// Global singleton instance
export const textGenerationClient = new TextGenerationWrapper();

/**
 * Legacy compatibility function for existing code
 */
export async function generateWithGemini(options: {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const result = await textGenerationClient.generate({
    prompt: options.prompt,
    systemPrompt: options.systemPrompt,
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  });

  return result.text;
}
