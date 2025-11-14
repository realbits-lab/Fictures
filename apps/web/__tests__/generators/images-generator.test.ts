/**
 * Unit Tests for Images Generator
 *
 * Tests pure generation logic - NO database operations, NO uploads.
 * Following the 3-layer architecture pattern.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createImageGenerationClient } from "@/lib/ai/image-generation";
import type {
    GeneratorImageParams,
    GeneratorImageResult,
} from "@/lib/schemas/generators/types";
import { generateImage } from "@/lib/studio/generators/images-generator";

// Mock the AI image generation client
jest.mock("@/lib/ai/image-generation");

describe("Images Generator", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe("generateImage", () => {
        it("should generate image with correct parameters", async () => {
            // Arrange
            const mockImageUrl = "https://provider.com/image.png";
            const mockWidth = 1664;
            const mockHeight = 928;
            const mockModel = "gemini-2.5-flash";
            const mockProvider = "gemini";

            const mockImageBuffer = new ArrayBuffer(1024 * 1024); // 1MB mock buffer

            // Mock AI client
            const mockGenerate = jest.fn().mockResolvedValue({
                imageUrl: mockImageUrl,
                width: mockWidth,
                height: mockHeight,
                model: mockModel,
                provider: mockProvider,
            });

            const mockClient = {
                generate: mockGenerate,
                getProviderType: jest.fn().mockReturnValue("gemini"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            // Mock global fetch
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
            } as any);

            const params: GeneratorImageParams = {
                prompt: "A mysterious forest at twilight",
                aspectRatio: "16:9",
                seed: 12345,
                imageType: "scene",
            };

            // Act
            const result: GeneratorImageResult = await generateImage(params);

            // Assert
            expect(mockGenerate).toHaveBeenCalledWith({
                prompt: params.prompt,
                aspectRatio: params.aspectRatio,
                seed: params.seed,
            });

            expect(result.imageUrl).toBe(mockImageUrl);
            expect(result.imageBuffer).toBe(mockImageBuffer);
            expect(result.width).toBe(mockWidth);
            expect(result.height).toBe(mockHeight);
            expect(result.size).toBe(mockImageBuffer.byteLength);
            expect(result.aspectRatio).toBe(params.aspectRatio);
            expect(result.model).toBe(mockModel);
            expect(result.provider).toBe(mockProvider);
            expect(result.generationTime).toBeGreaterThan(0);

            // Verify fetch was called to download image
            expect(global.fetch).toHaveBeenCalledWith(mockImageUrl);
        });

        it("should handle different image types", async () => {
            // Arrange
            const mockClient = {
                generate: jest.fn().mockResolvedValue({
                    imageUrl: "https://provider.com/image.png",
                    width: 1024,
                    height: 1024,
                    model: "gemini-2.5-flash",
                    provider: "gemini",
                }),
                getProviderType: jest.fn().mockReturnValue("gemini"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
            } as any);

            const imageTypes: Array<
                "story" | "character" | "setting" | "scene" | "comic-panel"
            > = ["story", "character", "setting", "scene", "comic-panel"];

            // Act & Assert
            for (const imageType of imageTypes) {
                const params: GeneratorImageParams = {
                    prompt: `Test ${imageType} image`,
                    aspectRatio: "1:1",
                    imageType,
                };

                const result = await generateImage(params);

                expect(result.imageUrl).toBeDefined();
                expect(result.imageBuffer).toBeDefined();
                expect(result.width).toBeGreaterThan(0);
                expect(result.height).toBeGreaterThan(0);
            }
        });

        it("should throw error when image fetch fails", async () => {
            // Arrange
            const mockClient = {
                generate: jest.fn().mockResolvedValue({
                    imageUrl: "https://provider.com/image.png",
                    width: 1024,
                    height: 576,
                    model: "gemini-2.5-flash",
                    provider: "gemini",
                }),
                getProviderType: jest.fn().mockReturnValue("gemini"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            // Mock fetch to fail
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                statusText: "Not Found",
            } as any);

            const params: GeneratorImageParams = {
                prompt: "Test image",
                aspectRatio: "16:9",
                imageType: "scene",
            };

            // Act & Assert
            await expect(generateImage(params)).rejects.toThrow(
                "Failed to fetch generated image: Not Found",
            );
        });

        it("should handle AI server provider", async () => {
            // Arrange
            const mockClient = {
                generate: jest.fn().mockResolvedValue({
                    imageUrl: "https://ai-server.com/image.png",
                    width: 1664,
                    height: 928,
                    model: "qwen-vl-plus",
                    provider: "ai-server",
                }),
                getProviderType: jest.fn().mockReturnValue("ai-server"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(2048)),
            } as any);

            const params: GeneratorImageParams = {
                prompt: "Test AI server image",
                aspectRatio: "16:9",
                imageType: "scene",
            };

            // Act
            const result = await generateImage(params);

            // Assert
            expect(result.provider).toBe("ai-server");
            expect(result.model).toBe("qwen-vl-plus");
        });

        it("should work without optional seed parameter", async () => {
            // Arrange
            const mockClient = {
                generate: jest.fn().mockResolvedValue({
                    imageUrl: "https://provider.com/image.png",
                    width: 1024,
                    height: 1024,
                    model: "gemini-2.5-flash",
                    provider: "gemini",
                }),
                getProviderType: jest.fn().mockReturnValue("gemini"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
            } as any);

            const params: GeneratorImageParams = {
                prompt: "Test image without seed",
                aspectRatio: "1:1",
                imageType: "character",
                // No seed parameter
            };

            // Act
            const result = await generateImage(params);

            // Assert
            expect(mockClient.generate).toHaveBeenCalledWith({
                prompt: params.prompt,
                aspectRatio: params.aspectRatio,
                seed: undefined,
            });
            expect(result).toBeDefined();
        });

        it("should calculate generation time", async () => {
            // Arrange
            const mockClient = {
                generate: jest.fn().mockImplementation(async () => {
                    // Simulate some processing time
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    return {
                        imageUrl: "https://provider.com/image.png",
                        width: 1024,
                        height: 576,
                        model: "gemini-2.5-flash",
                        provider: "gemini",
                    };
                }),
                getProviderType: jest.fn().mockReturnValue("gemini"),
            };

            (createImageGenerationClient as jest.Mock).mockReturnValue(
                mockClient,
            );

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
            } as any);

            const params: GeneratorImageParams = {
                prompt: "Test timing",
                aspectRatio: "16:9",
                imageType: "scene",
            };

            // Act
            const result = await generateImage(params);

            // Assert
            expect(result.generationTime).toBeGreaterThanOrEqual(100);
        });
    });
});
