/**
 * Unit Tests for Images Service
 *
 * Tests orchestration layer with database operations and Vercel Blob uploads.
 * Following the 3-layer architecture pattern.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { put } from "@vercel/blob";
import { optimizeImage } from "@/lib/services/image-optimization";
import { generateImage } from "@/lib/studio/generators/images-generator";
import type {
    ServiceImageParams,
    ServiceImageResult,
} from "@/lib/studio/services/images-service";
import { ImagesService } from "@/lib/studio/services/images-service";

// Mock dependencies
jest.mock("@/lib/studio/generators/images-generator");
jest.mock("@/lib/services/image-optimization");
jest.mock("@vercel/blob");

describe("Images Service", () => {
    let service: ImagesService;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        service = new ImagesService();
    });

    describe("generateAndUpload", () => {
        it("should orchestrate image generation, upload, and optimization", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024 * 300); // 300KB
            const mockBlobUrl = "https://blob.vercel-storage.com/image.png";

            // Mock generator
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

            // Mock Vercel Blob upload
            (put as jest.Mock).mockResolvedValue({
                url: mockBlobUrl,
            });

            // Mock optimization
            const mockOptimizedSet = {
                imageId: "opt_123",
                originalUrl: mockBlobUrl,
                variants: [
                    {
                        format: "avif" as const,
                        device: "mobile" as const,
                        resolution: "1x" as const,
                        width: 672,
                        height: 384,
                        url: "https://blob.vercel-storage.com/avif-1x.avif",
                        size: 10240,
                    },
                    {
                        format: "avif" as const,
                        device: "mobile" as const,
                        resolution: "2x" as const,
                        width: 1344,
                        height: 768,
                        url: "https://blob.vercel-storage.com/avif-2x.avif",
                        size: 20480,
                    },
                    {
                        format: "jpeg" as const,
                        device: "mobile" as const,
                        resolution: "1x" as const,
                        width: 672,
                        height: 384,
                        url: "https://blob.vercel-storage.com/jpeg-1x.jpg",
                        size: 30720,
                    },
                    {
                        format: "jpeg" as const,
                        device: "mobile" as const,
                        resolution: "2x" as const,
                        width: 1344,
                        height: 768,
                        url: "https://blob.vercel-storage.com/jpeg-2x.jpg",
                        size: 56320,
                    },
                ],
                generatedAt: new Date().toISOString(),
            };

            (optimizeImage as jest.Mock).mockResolvedValue(mockOptimizedSet);

            const params: ServiceImageParams = {
                prompt: "A mysterious forest at twilight",
                storyId: "story_123",
                imageType: "scene",
                chapterId: "chapter_456",
                sceneId: "scene_789",
            };

            // Act
            const result: ServiceImageResult =
                await service.generateAndUpload(params);

            // Assert - Generator was called correctly
            expect(generateImage).toHaveBeenCalledWith({
                prompt: params.prompt,
                aspectRatio: "16:9", // Default for scene
                seed: undefined,
                imageType: params.imageType,
            });

            // Assert - Vercel Blob upload was called
            expect(put).toHaveBeenCalledWith(
                expect.stringContaining("stories/story_123/chapters"),
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
                params.storyId,
                "scene",
                params.sceneId,
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
            await service.generateAndUpload({
                prompt: "Story cover",
                storyId: "story_123",
                imageType: "story",
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "16:9",
                }),
            );

            // Act & Assert - Character (1:1)
            await service.generateAndUpload({
                prompt: "Character portrait",
                storyId: "story_123",
                imageType: "character",
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "1:1",
                }),
            );

            // Act & Assert - Comic Panel (9:16)
            await service.generateAndUpload({
                prompt: "Comic panel",
                storyId: "story_123",
                imageType: "comic-panel",
                sceneId: "scene_123",
                panelNumber: 1,
            });

            expect(generateImage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    aspectRatio: "9:16",
                }),
            );
        });

        it("should allow aspect ratio override", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024);
            (generateImage as jest.Mock).mockResolvedValue({
                imageUrl: "https://provider.com/image.png",
                imageBuffer: mockImageBuffer,
                width: 1024,
                height: 1536,
                size: mockImageBuffer.byteLength,
                aspectRatio: "2:3",
                model: "gemini-2.5-flash",
                provider: "gemini",
                generationTime: 4000,
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

            // Act - Override default 16:9 for story with 2:3
            await service.generateAndUpload({
                prompt: "Portrait style story cover",
                storyId: "story_123",
                imageType: "story",
                aspectRatio: "2:3", // Override
            });

            // Assert
            expect(generateImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    aspectRatio: "2:3",
                }),
            );
        });

        it("should build correct blob paths for different image types", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024);
            const mockGeneratorResult = {
                imageUrl: "https://provider.com/image.png",
                imageBuffer: mockImageBuffer,
                width: 1024,
                height: 1024,
                size: mockImageBuffer.byteLength,
                aspectRatio: "1:1" as const,
                model: "gemini-2.5-flash" as const,
                provider: "gemini" as const,
                generationTime: 3000,
            };

            (generateImage as jest.Mock).mockResolvedValue(mockGeneratorResult);
            (put as jest.Mock).mockResolvedValue({
                url: "https://blob.vercel-storage.com/image.png",
            });
            (optimizeImage as jest.Mock).mockResolvedValue({
                imageId: "opt_123",
                originalUrl: "https://blob.vercel-storage.com/image.png",
                variants: [],
                generatedAt: new Date().toISOString(),
            });

            // Act & Assert - Story cover
            await service.generateAndUpload({
                prompt: "Story cover",
                storyId: "story_123",
                imageType: "story",
            });

            expect(put).toHaveBeenCalledWith(
                expect.stringMatching(/stories\/story_123\/cover\.png$/),
                expect.anything(),
                expect.anything(),
            );

            // Act & Assert - Character
            await service.generateAndUpload({
                prompt: "Character",
                storyId: "story_123",
                imageType: "character",
            });

            expect(put).toHaveBeenLastCalledWith(
                expect.stringMatching(
                    /stories\/story_123\/characters\/\d+\.png$/,
                ),
                expect.anything(),
                expect.anything(),
            );

            // Act & Assert - Scene
            await service.generateAndUpload({
                prompt: "Scene",
                storyId: "story_123",
                imageType: "scene",
                chapterId: "chapter_456",
                sceneId: "scene_789",
            });

            expect(put).toHaveBeenLastCalledWith(
                expect.stringMatching(
                    /stories\/story_123\/chapters\/chapter_456\/scenes\/scene_789\/image\.png$/,
                ),
                expect.anything(),
                expect.anything(),
            );
        });

        it("should map comic-panel to panel for optimization", async () => {
            // Arrange
            const mockImageBuffer = new ArrayBuffer(1024);
            (generateImage as jest.Mock).mockResolvedValue({
                imageUrl: "https://provider.com/image.png",
                imageBuffer: mockImageBuffer,
                width: 928,
                height: 1664,
                size: mockImageBuffer.byteLength,
                aspectRatio: "9:16",
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

            // Act
            await service.generateAndUpload({
                prompt: "Comic panel",
                storyId: "story_123",
                imageType: "comic-panel",
                sceneId: "scene_123",
                panelNumber: 1,
            });

            // Assert - Optimization should receive "panel" instead of "comic-panel"
            expect(optimizeImage).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.anything(),
                "panel", // Mapped from "comic-panel"
                expect.anything(),
            );
        });
    });
});
