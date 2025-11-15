/**
 * AI Server Image Provider
 * Calls the FastAPI AI server for image generation (Qwen-Image-Lightning v2.0)
 *
 * Now uses authentication context instead of passing API keys as parameters.
 */

import { getApiKey } from "@/lib/auth/server-context";
import { getImageDimensions } from "../image-config";
import type {
    ImageGenerationRequest,
    ImageGenerationResponse,
} from "../types/image";

export interface AIServerConfig {
    url: string;
    timeout: number;
}

export class AIServerImageProvider {
    private config: AIServerConfig;

    constructor(config: AIServerConfig) {
        this.config = config;
    }

    /**
     * Build headers with API key from authentication context
     */
    private buildHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Get API key from authentication context
        const apiKey = getApiKey();
        console.log("[AIServerImageProvider] buildHeaders - API key from context:", apiKey ? `${apiKey.substring(0, 10)}...` : "null");

        if (apiKey) {
            headers["x-api-key"] = apiKey;
        } else {
            console.log("[AIServerImageProvider] WARNING: No API key found in authentication context!");
        }

        return headers;
    }

    async generate(
        request: ImageGenerationRequest,
    ): Promise<ImageGenerationResponse> {
        const dimensions = getImageDimensions("ai-server", request.aspectRatio);

        const response = await fetch(
            `${this.config.url}/api/v1/images/generate`,
            {
                method: "POST",
                headers: this.buildHeaders(),
                body: JSON.stringify({
                    prompt: request.prompt,
                    width: dimensions.width,
                    height: dimensions.height,
                    num_inference_steps: 4,
                    guidance_scale: 1.0,
                    seed: request.seed,
                }),
                signal: AbortSignal.timeout(this.config.timeout),
            },
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`AI Server error: ${response.status} - ${error}`);
        }

        const result = await response.json();

        return {
            imageUrl: result.image_url,
            model: result.model,
            width: result.width,
            height: result.height,
            seed: result.seed,
            provider: "ai-server",
        };
    }
}
