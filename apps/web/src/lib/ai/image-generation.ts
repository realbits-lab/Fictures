/**
 * Image Generation Wrapper
 * Unified interface for multiple image generation providers (Gemini, AI Server)
 */

import { AIServerImageProvider } from "./providers/ai-server-image";
import { GeminiImageProvider } from "./providers/gemini-image";
import type {
    ImageGenerationRequest,
    ImageGenerationResponse,
    ImageProvider,
} from "./types/image";

/**
 * Environment configuration
 */
const getConfig = () => {
    const provider = (process.env.IMAGE_GENERATION_PROVIDER ||
        "gemini") as ImageProvider;

    return {
        provider,
        gemini: {
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
            modelName:
                process.env.GEMINI_IMAGE_MODEL_NAME ||
                "imagen-3.0-generate-001",
        },
        aiServer: {
            url:
                process.env.AI_SERVER_IMAGE_URL ||
                process.env.AI_SERVER_URL ||
                "http://localhost:8000",
            timeout: parseInt(
                process.env.AI_SERVER_IMAGE_TIMEOUT ||
                    process.env.AI_SERVER_TIMEOUT ||
                    "120000",
                10,
            ),
            apiKey: process.env.AI_SERVER_API_KEY,
        },
    };
};

/**
 * Abstract base class for image generation providers
 */
abstract class ImageGenerationProvider {
    abstract generate(
        request: ImageGenerationRequest,
    ): Promise<ImageGenerationResponse>;
}

/**
 * Image Generation Wrapper
 * Provides unified interface for all image generation operations
 */
class ImageGenerationWrapper {
    private provider: ImageGenerationProvider;
    private providerType: ImageProvider;

    constructor() {
        const config = getConfig();
        this.providerType = config.provider;

        if (this.providerType === "gemini") {
            this.provider = new GeminiImageProvider(
                config.gemini,
            ) as unknown as ImageGenerationProvider;
        } else if (this.providerType === "ai-server") {
            this.provider = new AIServerImageProvider(
                config.aiServer,
            ) as unknown as ImageGenerationProvider;
        } else {
            throw new Error(`Unsupported provider: ${this.providerType}`);
        }
    }

    /**
     * Generate image
     */
    async generate(
        request: ImageGenerationRequest,
    ): Promise<ImageGenerationResponse> {
        return this.provider.generate(request);
    }

    /**
     * Get current provider type
     */
    getProviderType(): ImageProvider {
        return this.providerType;
    }
}

/**
 * Global singleton instance
 */
export const imageGenerationClient = new ImageGenerationWrapper();

/**
 * Convenience function for generating images
 */
export async function generateImage(
    prompt: string,
    aspectRatio: ImageGenerationRequest["aspectRatio"] = "16:9",
    seed?: number,
): Promise<ImageGenerationResponse> {
    return imageGenerationClient.generate({
        prompt,
        aspectRatio,
        seed,
    });
}
