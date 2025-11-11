/**
 * Gemini Image Provider
 * Uses Google Generative AI SDK for image generation
 */

import {
	type GenerateContentRequest,
	GoogleGenerativeAI,
} from "@google/generative-ai";
import { getImageDimensions } from "../image-config";
import type {
	ImageGenerationRequest,
	ImageGenerationResponse,
} from "../types/image";

export interface GeminiConfig {
	apiKey: string;
	modelName: string;
}

export class GeminiImageProvider {
	private client: GoogleGenerativeAI;
	private config: GeminiConfig;

	constructor(config: GeminiConfig) {
		if (!config.apiKey) {
			throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
		}

		this.client = new GoogleGenerativeAI(config.apiKey);
		this.config = config;
	}

	async generate(
		request: ImageGenerationRequest,
	): Promise<ImageGenerationResponse> {
		const dimensions = getImageDimensions("gemini", request.aspectRatio);

		// Use Imagen model for image generation
		const model = this.client.getGenerativeModel({
			model: this.config.modelName,
		});

		// Generate image using the generateContent API
		// Note: Gemini's image generation uses the generateContent method with specific parameters
		const result = await model.generateContent({
			contents: [
				{
					role: "user",
					parts: [
						{
							text: request.prompt,
						},
					],
				},
			],
			generationConfig: {
				responseType: "image",
				imageConfig: {
					aspectRatio: request.aspectRatio,
					numberOfImages: 1,
				},
			},
		} as GenerateContentRequest);

		const response = result.response;

		// Extract image data from response
		// The image is typically returned as base64 or a URL
		const imagePart = response.candidates?.[0]?.content?.parts?.[0];

		if (!imagePart || !("inlineData" in imagePart)) {
			throw new Error("No image data returned from Gemini");
		}

		// Convert to data URL
		const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

		return {
			imageUrl,
			model: this.config.modelName,
			width: dimensions.width,
			height: dimensions.height,
			seed: request.seed,
			provider: "gemini",
		};
	}
}
