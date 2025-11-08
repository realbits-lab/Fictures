/**
 * AI Server Image Provider
 * Calls the FastAPI AI server for image generation (Qwen-Image-Lightning v2.0)
 */

import { getImageDimensions } from "../image-config";
import type {
	ImageGenerationRequest,
	ImageGenerationResponse,
} from "../types/image";

export interface AIServerConfig {
	url: string;
	timeout: number;
	apiKey?: string;
}

export class AIServerImageProvider {
	private config: AIServerConfig;

	constructor(config: AIServerConfig) {
		this.config = config;
	}

	async generate(
		request: ImageGenerationRequest,
	): Promise<ImageGenerationResponse> {
		const dimensions = getImageDimensions("ai-server", request.aspectRatio);

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		// Add API key if provided
		if (this.config.apiKey) {
			headers["Authorization"] = `Bearer ${this.config.apiKey}`;
		}

		const response = await fetch(`${this.config.url}/api/v1/images/generate`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				prompt: request.prompt,
				width: dimensions.width,
				height: dimensions.height,
				num_inference_steps: 4,
				guidance_scale: 1.0,
				seed: request.seed,
			}),
			signal: AbortSignal.timeout(this.config.timeout),
		});

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
