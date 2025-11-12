/**
 * AI Client - Text Generation Wrapper
 * Unified interface for multiple AI providers (Gemini, AI Server)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { promptManager } from "./prompt-manager";
import type {
    GenerationOptions,
    ModelProvider,
    PromptType,
    TextGenerationRequest,
    TextGenerationResponse,
} from "./types";

/**
 * Environment configuration
 */
const getConfig = () => {
    const provider = (process.env.TEXT_GENERATION_PROVIDER ||
        "gemini") as ModelProvider;

    return {
        provider,
        gemini: {
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
            modelName: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-mini",
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || "0.7"),
            maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "8192", 10),
        },
        aiServer: {
            url: process.env.AI_SERVER_TEXT_URL || "http://localhost:8000",
            timeout: parseInt(
                process.env.AI_SERVER_TEXT_TIMEOUT || "120000",
                10,
            ),
        },
    };
};

/**
 * Abstract base class for text generation providers
 */
abstract class TextGenerationProvider {
    abstract generate(
        request: TextGenerationRequest,
    ): Promise<TextGenerationResponse>;
    abstract generateStream(
        request: TextGenerationRequest,
    ): AsyncGenerator<string, void, unknown>;
}

/**
 * Gemini Provider Implementation
 */
class GeminiProvider extends TextGenerationProvider {
    private client: GoogleGenerativeAI;
    private config: ReturnType<typeof getConfig>["gemini"];

    constructor() {
        super();
        this.config = getConfig().gemini;

        if (!this.config.apiKey) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        }

        this.client = new GoogleGenerativeAI(this.config.apiKey);
    }

    async generate(
        request: TextGenerationRequest,
    ): Promise<TextGenerationResponse> {
        const model = this.client.getGenerativeModel({
            model: request.model || this.config.modelName,
        });

        // Build generation config
        const generationConfig: any = {
            temperature: request.temperature ?? this.config.temperature,
            maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
            topP: request.topP ?? 0.95,
            stopSequences: request.stopSequences,
        };

        // Add structured output configuration if JSON format requested
        if (request.responseFormat === "json" && request.responseSchema) {
            generationConfig.responseMimeType = "application/json";

            // Convert Zod schema to JSON Schema if needed
            let jsonSchema: any;
            if (request.responseSchema && "_def" in request.responseSchema) {
                // It's a Zod schema - use native z.toJSONSchema()
                console.log(
                    "[GeminiProvider] Converting Zod schema to JSON Schema (native)",
                );
                jsonSchema = z.toJSONSchema(
                    request.responseSchema as z.ZodType<any>,
                    {
                        target: "openapi-3.0",
                        $refStrategy: "none",
                    },
                );
                console.log(
                    "[GeminiProvider] Converted schema keys:",
                    Object.keys(jsonSchema),
                );
                console.log(
                    "[GeminiProvider] Converted schema type:",
                    jsonSchema.type,
                );
                console.log(
                    "[GeminiProvider] Converted schema properties:",
                    jsonSchema.properties
                        ? Object.keys(jsonSchema.properties)
                        : "none",
                );
            } else {
                // It's already a JSON Schema object
                console.log("[GeminiProvider] Using pre-defined JSON Schema");
                jsonSchema = request.responseSchema;
            }

            // Remove $schema field that Gemini doesn't accept
            const { $schema, ...cleanSchema } = jsonSchema;
            generationConfig.responseSchema = cleanSchema;

            console.log(
                "[GeminiProvider] Final schema for Gemini:",
                JSON.stringify(cleanSchema, null, 2).substring(0, 800),
            );
        }

        // Combine system and user prompts
        const fullPrompt = request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
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
        request: TextGenerationRequest,
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
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig,
        });

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                yield chunkText;
            }
        }
    }

    /**
     * Generate structured output using Gemini's native JSON schema support
     *
     * This method uses Gemini's responseMimeType and responseSchema config
     * to enforce strict schema validation, following the official pattern from:
     * https://ai.google.dev/gemini-api/docs/structured-output
     *
     * @param prompt - The generation prompt
     * @param zodSchema - Zod schema defining the expected output structure
     * @param options - Additional generation options
     * @returns Parsed and validated object matching the schema
     */
    async generateStructured<T>(
        prompt: string,
        zodSchema: z.ZodType<T>,
        options?: {
            systemPrompt?: string;
            model?: string;
            temperature?: number;
            maxTokens?: number;
            topP?: number;
        },
    ): Promise<T> {
        const model = this.client.getGenerativeModel({
            model: options?.model || this.config.modelName,
        });

        // Convert Zod schema to JSON Schema using Zod's native method
        console.log(
            "[GeminiProvider] generateStructured - Converting Zod to JSON Schema (native)",
        );

        const jsonSchema = z.toJSONSchema(zodSchema, {
            target: "openapi-3.0",
            $refStrategy: "none",
        });

        console.log(
            "[GeminiProvider] Full JSON Schema:",
            JSON.stringify(jsonSchema, null, 2),
        );
        console.log("[GeminiProvider] Schema type:", jsonSchema.type);
        console.log(
            "[GeminiProvider] Schema properties:",
            jsonSchema.properties ? Object.keys(jsonSchema.properties) : "none",
        );

        // Remove fields that Gemini doesn't support
        // Gemini's recent updates (Nov 2025) support most JSON Schema keywords,
        // but $schema should still be removed
        const cleanedSchema = this.cleanJsonSchema(jsonSchema);

        console.log(
            "[GeminiProvider] Cleaned schema sample:",
            JSON.stringify(cleanedSchema, null, 2).substring(0, 800),
        );

        // Build generation config with structured output
        const generationConfig: any = {
            temperature: options?.temperature ?? this.config.temperature,
            maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
            topP: options?.topP ?? 0.95,
            responseMimeType: "application/json",
            responseSchema: cleanedSchema,
        };

        // Combine system and user prompts
        const fullPrompt = options?.systemPrompt
            ? `${options.systemPrompt}\n\n${prompt}`
            : prompt;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            generationConfig,
        });

        const response = result.response;
        const text = response.text();

        console.log("[GeminiProvider] generateStructured - Response received");
        console.log("[GeminiProvider] Response length:", text?.length || 0);
        console.log(
            "[GeminiProvider] Tokens used:",
            response.usageMetadata?.totalTokenCount,
        );

        if (!text || text.trim() === "") {
            throw new Error("Empty response from Gemini structured output");
        }

        // Parse and validate the JSON response
        const parsed = JSON.parse(text);

        // Validate against the Zod schema to ensure type safety
        const validated = zodSchema.parse(parsed);

        return validated;
    }

    /**
     * Clean JSON Schema to remove fields that Gemini doesn't support
     * Recursively processes nested objects and arrays
     */
    private cleanJsonSchema(schema: any): any {
        if (schema === null || schema === undefined) {
            return schema;
        }

        if (Array.isArray(schema)) {
            return schema.map((item) => this.cleanJsonSchema(item));
        }

        if (typeof schema === "object") {
            const cleaned: Record<string, any> = {};

            for (const [key, value] of Object.entries(schema)) {
                // Skip fields that Gemini doesn't support
                // Note: Gemini does NOT support additionalProperties or $schema
                if (key === "$schema" || key === "additionalProperties") {
                    continue;
                }

                cleaned[key] = this.cleanJsonSchema(value);
            }

            return cleaned;
        }

        return schema;
    }
}

/**
 * AI Server Provider Implementation (Qwen-3 via FastAPI)
 */
class AIServerProvider extends TextGenerationProvider {
    private config: ReturnType<typeof getConfig>["aiServer"];

    constructor() {
        super();
        this.config = getConfig().aiServer;
    }

    async generate(
        request: TextGenerationRequest,
    ): Promise<TextGenerationResponse> {
        const fullPrompt = request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt;

        // Build request body
        const requestBody: any = {
            prompt: fullPrompt,
            max_tokens: request.maxTokens ?? 2048,
            temperature: request.temperature ?? 0.7,
            top_p: request.topP ?? 0.9,
            stop_sequences: request.stopSequences ?? [],
        };

        // Add structured output configuration if JSON format requested
        if (request.responseFormat === "json" && request.responseSchema) {
            requestBody.response_format = "json";

            // Convert Zod schema to JSON Schema if needed
            let jsonSchema: any;
            if (request.responseSchema && "_def" in request.responseSchema) {
                // It's a Zod schema - use native z.toJSONSchema()
                jsonSchema = z.toJSONSchema(
                    request.responseSchema as z.ZodType<any>,
                    {
                        target: "openapi-3.0",
                        $refStrategy: "none",
                    },
                );
            } else {
                // It's already a JSON Schema object
                jsonSchema = request.responseSchema;
            }

            // Remove $schema field if present
            const { $schema, ...cleanSchema } = jsonSchema;
            requestBody.response_schema = cleanSchema;
        }

        const response = await fetch(
            `${this.config.url}/api/v1/text/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(this.config.timeout),
            },
        );

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
        request: TextGenerationRequest,
    ): AsyncGenerator<string, void, unknown> {
        const fullPrompt = request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt;

        const response = await fetch(`${this.config.url}/api/v1/text/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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
            throw new Error("No response body from AI Server");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                yield parsed.text;
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE data:", e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Generate structured output using AI Server's guided JSON generation
     *
     * This method uses AI Server's response_format and response_schema config
     * to enforce strict schema validation via guided generation.
     *
     * @param prompt - The generation prompt
     * @param zodSchema - Zod schema defining the expected output structure
     * @param options - Additional generation options
     * @returns Parsed and validated object matching the schema
     */
    async generateStructured<T>(
        prompt: string,
        zodSchema: z.ZodType<T>,
        options?: {
            systemPrompt?: string;
            model?: string;
            temperature?: number;
            maxTokens?: number;
            topP?: number;
        },
    ): Promise<T> {
        const fullPrompt = options?.systemPrompt
            ? `${options.systemPrompt}\n\n${prompt}`
            : prompt;

        // Convert Zod schema to JSON Schema using Zod's native method
        console.log(
            "[AIServerProvider] generateStructured - Converting Zod to JSON Schema (native)",
        );

        const jsonSchema = z.toJSONSchema(zodSchema, {
            target: "openapi-3.0",
            $refStrategy: "none",
        });

        console.log(
            "[AIServerProvider] Full JSON Schema:",
            JSON.stringify(jsonSchema, null, 2),
        );
        console.log("[AIServerProvider] Schema type:", jsonSchema.type);
        console.log(
            "[AIServerProvider] Schema properties:",
            jsonSchema.properties ? Object.keys(jsonSchema.properties) : "none",
        );

        // Remove $schema field if present (AI Server doesn't need it)
        const { $schema, ...cleanSchema } = jsonSchema;

        console.log(
            "[AIServerProvider] Cleaned schema sample:",
            JSON.stringify(cleanSchema, null, 2).substring(0, 800),
        );

        // Build request body with structured output configuration
        const requestBody: any = {
            prompt: fullPrompt,
            max_tokens: options?.maxTokens ?? 2048,
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP ?? 0.9,
            response_format: "json",
            response_schema: cleanSchema,
        };

        const response = await fetch(
            `${this.config.url}/api/v1/text/generate`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(this.config.timeout),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`AI Server error: ${response.status} - ${error}`);
        }

        const result = await response.json();
        const text = result.text;

        console.log(
            "[AIServerProvider] generateStructured - Response received",
        );
        console.log("[AIServerProvider] Response length:", text?.length || 0);
        console.log("[AIServerProvider] Tokens used:", result.tokens_used);

        if (!text || text.trim() === "") {
            throw new Error("Empty response from AI Server structured output");
        }

        // Parse and validate the JSON response
        const parsed = JSON.parse(text);

        // Validate against the Zod schema to ensure type safety
        const validated = zodSchema.parse(parsed);

        return validated;
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

        if (this.providerType === "gemini") {
            this.provider = new GeminiProvider();
        } else if (this.providerType === "ai-server") {
            this.provider = new AIServerProvider();
        } else {
            throw new Error(`Unsupported provider: ${this.providerType}`);
        }
    }

    /**
     * Generate text with raw prompt
     */
    async generate(
        request: TextGenerationRequest,
    ): Promise<TextGenerationResponse> {
        return this.provider.generate(request);
    }

    /**
     * Generate text with streaming
     */
    async *generateStream(
        request: TextGenerationRequest,
    ): AsyncGenerator<string, void, unknown> {
        yield* this.provider.generateStream(request);
    }

    /**
     * Generate text using prompt template
     */
    async generateWithTemplate(
        promptType: PromptType,
        variables: Record<string, string>,
        options?: GenerationOptions,
    ): Promise<TextGenerationResponse> {
        const { system, user } = promptManager.getPrompt(
            this.providerType,
            promptType,
            variables,
        );

        return this.generate({
            prompt: user,
            systemPrompt: system,
            ...options,
        });
    }

    /**
     * Generate structured output using Gemini's native JSON schema support
     *
     * This method enforces strict schema validation at the API level,
     * ensuring the AI output matches your Zod schema exactly.
     *
     * @example
     * ```typescript
     * import { z } from 'zod';
     *
     * const schema = z.object({
     *   title: z.string(),
     *   genre: z.string(),
     *   tone: z.enum(['hopeful', 'dark', 'bittersweet']),
     * });
     *
     * const result = await textGenerationClient.generateStructured(
     *   'Generate a story about a brave knight',
     *   schema,
     *   { temperature: 0.8 }
     * );
     * // result is fully typed as { title: string; genre: string; tone: ... }
     * ```
     *
     * @param prompt - The generation prompt
     * @param zodSchema - Zod schema defining the expected output structure
     * @param options - Additional generation options
     * @returns Parsed and validated object matching the schema
     */
    async generateStructured<T>(
        prompt: string,
        zodSchema: z.ZodType<T>,
        options?: {
            systemPrompt?: string;
            model?: string;
            temperature?: number;
            maxTokens?: number;
            topP?: number;
        },
    ): Promise<T> {
        // Both Gemini and AI Server providers support structured output natively
        if (this.provider instanceof GeminiProvider) {
            return this.provider.generateStructured(prompt, zodSchema, options);
        }

        if (this.provider instanceof AIServerProvider) {
            return this.provider.generateStructured(prompt, zodSchema, options);
        }

        // Fallback for other providers - use regular generation and parse
        const response = await this.generate({
            prompt,
            systemPrompt: options?.systemPrompt,
            model: options?.model,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            topP: options?.topP,
            responseFormat: "json",
            responseSchema: zodSchema,
        });

        const parsed = JSON.parse(response.text);
        return zodSchema.parse(parsed);
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
