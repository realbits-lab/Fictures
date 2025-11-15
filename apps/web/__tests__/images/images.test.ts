/**
 * Unit Tests for Images System
 *
 * Tests the complete image generation system following 3-layer architecture:
 * - Generator Layer: Pure image generation (no DB, no uploads)
 * - Service Layer: Orchestration with DB operations and Vercel Blob uploads
 * - API Layer: HTTP requests (tested separately)
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { put } from "@vercel/blob";
import { createImageGenerationClient } from "@/lib/ai/image-generation";
import type {
    GeneratorImageParams,
    GeneratorImageResult,
} from "@/lib/schemas/generators/types";
import { generateImage } from "@/lib/studio/generators/images-generator";
import { optimizeImage } from "@/lib/studio/services/image-optimization-service";
import type {
    ServiceImagesParams,
    ServiceImagesResult,
} from "@/lib/studio/services/images-service";
import { ImagesService } from "@/lib/studio/services/images-service";

// Mock dependencies
jest.mock("@/lib/ai/image-generation");
jest.mock("@/lib/studio/generators/images-generator");
jest.mock("@/lib/studio/services/image-optimization-service");
jest.mock("@vercel/blob");

describe("Images System", () => {
    describe("Generator Layer - generateImage()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should generate image with correct parameters", async () => {
            // Arrange
            const mockImageUrl = "https://provider.com/image.png";
            const mockWidth = 1664;
            const mockHeight = 928;
            const mockModel = "gemini-2.5-flash";
            const mockProvider = "gemini";
            const mockImageBuffer = new ArrayBuffer(1024 * 1024);

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
    });

    describe("Service Layer - ImagesService.generateAndSave()", () => {
        let service: ImagesService;

        beforeEach(() => {
            jest.clearAllMocks();
            service = new ImagesService();
        });

        it("should orchestrate image generation, upload, and optimization", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024 * 300);
            const mockBlobUrl = "https://blob.vercel-storage.com/image.png";

            (generateImage as jest.Mock).mockResolvedValue({
                imageUrl: "https://provider.com/temp-image.png",
                imageBuffer: mockImageBuffer,
                width: 1664,
                height: 928,
                size: mockImageBuffer.byteLength,
                aspectRatio: "16:9",
                model: "gemini-2.5-flash",
                provider: "gemini",
                generationTime: 5000,
            });

            (put as jest.Mock).mockResolvedValue({
                url: mockBlobUrl,
            });

            const mockOptimizedSet = {
                imageId: "opt_123",
                originalUrl: mockBlobUrl,
                variants: [
                    {
                        format: "avif" as const,
                        device: "mobile" as const,
                        resolution: "1x" as const,
                        width: 832,
                        height: 464,
                        url: "https://blob.vercel-storage.com/avif-1x.avif",
                        size: 10240,
                    },
                    {
                        format: "avif" as const,
                        device: "mobile" as const,
                        resolution: "2x" as const,
                        width: 1664,
                        height: 928,
                        url: "https://blob.vercel-storage.com/avif-2x.avif",
                        size: 20480,
                    },
                ],
                generatedAt: new Date().toISOString(),
            };

            (optimizeImage as jest.Mock).mockResolvedValue(mockOptimizedSet);

            const params: ServiceImagesParams = {
                prompt: "A mysterious forest at twilight",
                contentId: "scene_789",
                imageType: "scene",
                userId: "user_123",
            };

            // Act
            const result: ServiceImagesResult =
                await service.generateAndSave(params);

            // Assert - Generator was called correctly
            expect(generateImage).toHaveBeenCalledWith({
                prompt: params.prompt,
                aspectRatio: "16:9",
                imageType: params.imageType,
            });

            // Assert - Vercel Blob upload was called
            expect(put).toHaveBeenCalledWith(
                expect.stringContaining("stories/scene_789/scene"),
                mockImageBuffer,
                {
                    access: "public",
                    contentType: "image/png",
                },
            );

            // Assert - Optimization was called
            expect(optimizeImage).toHaveBeenCalledWith(
                mockBlobUrl,
                expect.stringMatching(/^img_\d+_[a-z0-9]+$/),
                params.contentId,
                "scene",
                params.contentId,
            );

            // Assert - Result structure
            expect(result.imageUrl).toBe(mockBlobUrl);
            expect(result.blobUrl).toBe(mockBlobUrl);
            expect(result.width).toBe(1664);
            expect(result.height).toBe(928);
            expect(result.size).toBe(mockImageBuffer.byteLength);
            expect(result.aspectRatio).toBe("16:9");
            expect(result.optimizedSet).toEqual(mockOptimizedSet);
            expect(result.isPlaceholder).toBe(false);
            expect(result.model).toBe("gemini-2.5-flash");
            expect(result.provider).toBe("gemini");
            expect(result.metadata.generationTime).toBe(5000);
            expect(result.metadata.optimizationTime).toBeGreaterThan(0);
            expect(result.metadata.uploadTime).toBeGreaterThan(0);
            expect(result.metadata.totalTime).toBeGreaterThan(0);
        });

        it("should use correct aspect ratios for different image types", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024);
            (generateImage as jest.Mock).mockResolvedValue({
                imageUrl: "https://provider.com/image.png",
                imageBuffer: mockImageBuffer,
                width: 1024,
                height: 1024,
                size: mockImageBuffer.byteLength,
                aspectRatio: "1:1",
                model: "gemini-2.5-flash",
                provider: "gemini",
                generationTime: 3000,
            });

            (put as jest.Mock).mockResolvedValue({
                url: "https://blob.vercel-storage.com/image.png",
            });

            (optimizeImage as jest.Mock).mockResolvedValue({
                imageId: "opt_123",
                originalUrl: "https://blob.vercel-storage.com/image.png",
                variants: [],
                generatedAt: new Date().toISOString(),
            });

            // Act & Assert - Story (16:9)
            await service.generateAndSave({
                prompt: "Story cover",
                contentId: "story_123",
                imageType: "story",
                userId: "user_123",
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "16:9",
                }),
            );

            // Act & Assert - Character (1:1)
            await service.generateAndSave({
                prompt: "Character portrait",
                contentId: "char_123",
                imageType: "character",
                userId: "user_123",
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "1:1",
                }),
            );

            // Act & Assert - Comic Panel (9:16)
            await service.generateAndSave({
                prompt: "Comic panel",
                contentId: "scene_123",
                imageType: "comic-panel",
                userId: "user_123",
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "9:16",
                }),
            );
        });
    });
});
