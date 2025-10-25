/**
 * Image Validator Tests
 *
 * Tests the image validation and regeneration system
 */

import {
  validateSceneImage,
  validateSceneImages,
} from '@/lib/services/image-validator';

// Mock the image generation service
jest.mock('@/lib/services/image-generation', () => ({
  generateStoryImage: jest.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/test-regenerated-image.png',
    optimizedSet: {
      imageId: 'test-image-id',
      originalUrl: 'https://blob.vercel-storage.com/test-regenerated-image.png',
      variants: [
        { format: 'avif', size: 'mobile', url: 'https://blob.vercel-storage.com/test-avif-mobile.avif' },
        { format: 'webp', size: 'mobile', url: 'https://blob.vercel-storage.com/test-webp-mobile.webp' },
      ],
      generatedAt: new Date().toISOString(),
    },
  }),
}));

// Mock fetch for URL accessibility checks
global.fetch = jest.fn();

describe('Image Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSceneImage', () => {
    const mockSceneContext = {
      sceneTitle: 'Test Scene',
      sceneContent: 'This is a test scene with some content about a room and characters.',
      storyId: 'test-story-id',
    };

    test('should detect missing image URL', async () => {
      const result = await validateSceneImage(
        'test-scene-id',
        null,
        null,
        mockSceneContext,
        {
          checkAccessibility: false,
          regenerateIfMissing: false,
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('missing_url');
    });

    test('should detect missing image variants', async () => {
      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/test-image.png',
        null,
        mockSceneContext,
        {
          checkAccessibility: false,
          regenerateIfMissing: false,
        }
      );

      expect(result.issues.some(i => i.type === 'missing_variants')).toBe(true);
    });

    test('should detect inaccessible image URL', async () => {
      // Mock fetch to return 404
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/missing-image.png',
        { variants: [] },
        mockSceneContext,
        {
          checkAccessibility: true,
          regenerateIfMissing: false,
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'url_not_accessible')).toBe(true);
    });

    test('should pass validation for valid image with variants', async () => {
      // Mock fetch to return 200 OK
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/valid-image.png',
        {
          imageId: 'test-id',
          originalUrl: 'https://blob.vercel-storage.com/valid-image.png',
          variants: [
            { format: 'avif', size: 'mobile', url: 'https://blob.vercel-storage.com/test.avif' },
          ],
          generatedAt: new Date().toISOString(),
        },
        mockSceneContext,
        {
          checkAccessibility: true,
          regenerateIfMissing: false,
        }
      );

      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
      expect(result.regenerated).toBe(false);
    });

    test('should regenerate missing image when enabled', async () => {
      const result = await validateSceneImage(
        'test-scene-id',
        null,
        null,
        mockSceneContext,
        {
          checkAccessibility: false,
          regenerateIfMissing: true,
        }
      );

      expect(result.regenerated).toBe(true);
      expect(result.imageUrl).toBe('https://blob.vercel-storage.com/test-regenerated-image.png');
      expect(result.imageVariants).toBeDefined();
      expect(result.imageVariants.variants.length).toBeGreaterThan(0);
    });

    test('should regenerate inaccessible image when enabled', async () => {
      // Mock fetch to return 404
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/broken-image.png',
        null,
        mockSceneContext,
        {
          checkAccessibility: true,
          regenerateIfMissing: true,
        }
      );

      expect(result.regenerated).toBe(true);
      expect(result.imageUrl).toBe('https://blob.vercel-storage.com/test-regenerated-image.png');
    });

    test('should handle network timeout gracefully', async () => {
      // Mock fetch to timeout
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/slow-image.png',
        { variants: [] },
        mockSceneContext,
        {
          checkAccessibility: true,
          regenerateIfMissing: false,
          timeout: 50, // Very short timeout to trigger
        }
      );

      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.type === 'url_not_accessible')).toBe(true);
    });
  });

  describe('validateSceneImages (batch)', () => {
    test('should validate multiple scenes', async () => {
      // Mock fetch to return success for first, fail for second
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 404 });

      const scenes = [
        {
          sceneId: 'scene-1',
          imageUrl: 'https://blob.vercel-storage.com/image-1.png',
          imageVariants: {
            variants: [{ format: 'avif', size: 'mobile', url: 'test.avif' }],
          },
          sceneTitle: 'Scene 1',
          sceneContent: 'Content for scene 1',
          storyId: 'story-1',
        },
        {
          sceneId: 'scene-2',
          imageUrl: 'https://blob.vercel-storage.com/broken.png',
          imageVariants: null,
          sceneTitle: 'Scene 2',
          sceneContent: 'Content for scene 2',
          storyId: 'story-1',
        },
      ];

      const results = await validateSceneImages(scenes, {
        checkAccessibility: true,
        regenerateIfMissing: true,
      });

      expect(results.size).toBe(2);

      const result1 = results.get('scene-1');
      expect(result1?.isValid).toBe(true);
      expect(result1?.regenerated).toBe(false);

      const result2 = results.get('scene-2');
      expect(result2?.regenerated).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    const mockSceneContext = {
      sceneTitle: 'Test Scene',
      sceneContent: 'Test content',
      storyId: 'test-story-id',
    };

    test('should handle empty scene content', async () => {
      const result = await validateSceneImage(
        'test-scene-id',
        null,
        null,
        {
          ...mockSceneContext,
          sceneContent: '',
        },
        {
          regenerateIfMissing: true,
        }
      );

      expect(result.regenerated).toBe(true);
    });

    test('should handle very long scene content', async () => {
      const longContent = 'This is a test. '.repeat(500); // Very long content

      const result = await validateSceneImage(
        'test-scene-id',
        null,
        null,
        {
          ...mockSceneContext,
          sceneContent: longContent,
        },
        {
          regenerateIfMissing: true,
        }
      );

      expect(result.regenerated).toBe(true);
    });

    test('should handle malformed image variants', async () => {
      const result = await validateSceneImage(
        'test-scene-id',
        'https://blob.vercel-storage.com/test.png',
        { variants: 'invalid' } as any, // Malformed variants
        mockSceneContext,
        {
          checkAccessibility: false,
          regenerateIfMissing: false,
        }
      );

      expect(result.issues.some(i => i.type === 'missing_variants')).toBe(true);
    });
  });
});
