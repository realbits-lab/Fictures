/**
 * Type-safe API client for Fictures AI Server
 *
 * This client provides type-safe access to the AI server API endpoints.
 * Types are automatically generated from the FastAPI OpenAPI schema.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface AIClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class FicturesAIClient {
  private client: AxiosInstance;

  constructor(config: AIClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || 'http://localhost:8000',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  }

  /**
   * Generate text using local language model
   */
  async generateText(params: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
  }) {
    const response = await this.client.post('/api/v1/text/generate', params);
    return response.data;
  }

  /**
   * List available text generation models
   */
  async listTextModels() {
    const response = await this.client.get('/api/v1/text/models');
    return response.data;
  }

  /**
   * Generate image using local diffusion model
   */
  async generateImage(params: {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    num_inference_steps?: number;
    guidance_scale?: number;
    seed?: number;
  }) {
    const response = await this.client.post('/api/v1/images/generate', params);
    return response.data;
  }

  /**
   * List available image generation models
   */
  async listImageModels() {
    const response = await this.client.get('/api/v1/images/models');
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance with default configuration
export const aiClient = new FicturesAIClient();

// Export for custom configuration
export default FicturesAIClient;
