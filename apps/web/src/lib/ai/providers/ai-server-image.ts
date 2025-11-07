/**
 * AI Server Image Provider
 * Calls the FastAPI AI server for image generation (Qwen-Image-Lightning v2.0)
 */

import type { ImageGenerationRequest, ImageGenerationResponse } from '../types/image';
import { getImageDimensions } from '../image-config';

export interface AIServerConfig {
  url: string;
  timeout: number;
}

export class AIServerImageProvider {
  private config: AIServerConfig;

  constructor(config: AIServerConfig) {
    this.config = config;
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const dimensions = getImageDimensions('ai-server', request.aspectRatio);

    const response = await fetch(`${this.config.url}/api/v1/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      provider: 'ai-server',
    };
  }
}
