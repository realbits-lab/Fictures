import { renderHook, act, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { useChapterGeneration } from '@/hooks/use-chapter-generation';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock ReadableStream
class MockReadableStream {
  private chunks: string[];
  private reader: any;

  constructor(chunks: string[]) {
    this.chunks = chunks;
  }

  getReader() {
    let index = 0;
    return {
      read: jest.fn().mockImplementation(() => {
        if (index >= this.chunks.length) {
          return Promise.resolve({ done: true, value: undefined });
        }
        const chunk = this.chunks[index++];
        const encoder = new TextEncoder();
        return Promise.resolve({ 
          done: false, 
          value: encoder.encode(chunk + '\n') 
        });
      })
    };
  }
}

describe('useChapterGeneration', () => {
  const defaultOptions = {
    storyId: 'test-story-id',
    chapterNumber: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useChapterGeneration(defaultOptions.storyId, defaultOptions.chapterNumber));

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.content).toBe('');
      expect(result.current.error).toBe(null);
      expect(result.current.generationHistory).toEqual([]);
    });
  });

  describe('Chapter generation', () => {
    it('should start generation and update state', async () => {
      const mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"The story begins..."}',
        '{"type":"content","content":" in a mystical land."}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      act(() => {
        result.current.generate('Write a compelling opening chapter');
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(result.current.content).toBe('The story begins... in a mystical land.');
      expect(mockFetch).toHaveBeenCalledWith('/api/chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: 'test-story-id',
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });
    });

    it('should handle generation with context options', async () => {
      const mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"Chapter content with context"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      act(() => {
        result.current.generate('Continue the story', {
          includeContext: {
            previousChapters: true,
            characters: true
          },
          maxTokens: 2000,
          temperature: 0.8
        });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: 'test-story-id',
          chapterNumber: 1,
          prompt: 'Continue the story',
          includeContext: {
            previousChapters: true,
            characters: true
          },
          maxTokens: 2000,
          temperature: 0.8
        })
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Failed to generate chapter: Internal Server Error');
      expect(result.current.content).toBe('');
    });

    it('should handle streaming errors', async () => {
      const mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"error","error":"AI model unavailable"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('AI model unavailable');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Network error occurred');
    });
  });

  describe('Generation cancellation', () => {
    it('should cancel ongoing generation', async () => {
      const mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"Partial content..."}'
        // No completion chunk - simulates long generation
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      act(() => {
        result.current.generate('Long generation prompt');
      });

      expect(result.current.isGenerating).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Generation cancelled');
    });

    it('should not cancel when not generating', () => {
      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      act(() => {
        result.current.cancel();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Generation history', () => {
    it('should track generation history', async () => {
      const mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"Generated content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.generate('First prompt');
      });

      expect(result.current.generationHistory).toHaveLength(1);
      expect(result.current.generationHistory[0]).toMatchObject({
        prompt: 'First prompt',
        status: 'completed',
        generatedContent: 'Generated content'
      });

      // Generate again
      await act(async () => {
        await result.current.generate('Second prompt');
      });

      expect(result.current.generationHistory).toHaveLength(2);
    });

    it('should limit history to maximum items', async () => {
      const mockChunks = [
        '{"type":"status","status":"completed"}',
        '{"type":"content","content":"Content"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      // Generate 15 times (over the usual limit of 10)
      for (let i = 0; i < 15; i++) {
        await act(async () => {
          await result.current.generate(`Prompt ${i + 1}`);
        });
      }

      expect(result.current.generationHistory.length).toBeLessThanOrEqual(10);
      // Should keep the most recent ones
      expect(result.current.generationHistory[0].prompt).toBe('Prompt 15');
    });
  });

  describe('Regeneration', () => {
    it('should regenerate from history', async () => {
      // First generation
      let mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"Original content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.generate('Original prompt');
      });

      const generationId = result.current.generationHistory[0].id;

      // Regenerate
      mockChunks = [
        '{"type":"status","status":"generating"}',
        '{"type":"content","content":"Regenerated content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      await act(async () => {
        await result.current.regenerate(generationId);
      });

      expect(result.current.content).toBe('Regenerated content');
      expect(mockFetch).toHaveBeenLastCalledWith('/api/chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: 'test-story-id',
          chapterNumber: 1,
          prompt: 'Original prompt',
          regenerate: true,
          generationId
        })
      });
    });

    it('should handle invalid generation ID for regeneration', async () => {
      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      await act(async () => {
        await result.current.regenerate('invalid-id');
      });

      expect(result.current.error).toBe('Generation not found in history');
    });
  });

  describe('Context retrieval', () => {
    it('should fetch chapter context', async () => {
      const mockContext = {
        story: { id: 'test-story-id', title: 'Test Story' },
        previousChapters: [],
        characters: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockContext
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      let context: any;
      await act(async () => {
        context = await result.current.getContext();
      });

      expect(context).toEqual(mockContext);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/chapters/context?storyId=test-story-id&chapterNumber=1`
      );
    });

    it('should cache context for performance', async () => {
      const mockContext = { story: {}, previousChapters: [], characters: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockContext
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      // First call
      await act(async () => {
        await result.current.getContext();
      });

      // Second call should use cache
      await act(async () => {
        await result.current.getContext();
      });

      // Should only make one API call due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-save integration', () => {
    it('should call onSuccess callback when generation completes', async () => {
      const onSuccess = jest.fn();
      const mockChunks = [
        '{"type":"content","content":"Generated content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => 
        useChapterGeneration({ ...defaultOptions, onSuccess })
      );

      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(onSuccess).toHaveBeenCalledWith('Generated content');
    });

    it('should auto-save when enabled', async () => {
      const mockChunks = [
        '{"type":"content","content":"Auto-save content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          body: new MockReadableStream(mockChunks)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response);

      const { result } = renderHook(() => 
        useChapterGeneration({ ...defaultOptions, autoSave: true })
      );

      await act(async () => {
        await result.current.generate('Test prompt');
      });

      // Should make save API call
      expect(mockFetch).toHaveBeenCalledWith('/api/chapters/save', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Auto-save content')
      }));
    });
  });

  describe('State management', () => {
    it('should clear all state', () => {
      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      // Set some state first
      act(() => {
        result.current.generate('Test');
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.content).toBe('');
      expect(result.current.error).toBe(null);
      expect(result.current.generationHistory).toEqual([]);
      expect(result.current.isGenerating).toBe(false);
    });

    it('should handle multiple concurrent generations', async () => {
      const mockChunks = [
        '{"type":"content","content":"Content"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      // Start two generations
      act(() => {
        result.current.generate('First prompt');
        result.current.generate('Second prompt');
      });

      // Should cancel the first and start the second
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      // Should have called fetch for the second generation
      expect(mockFetch).toHaveBeenLastCalledWith('/api/chapters/generate', 
        expect.objectContaining({
          body: expect.stringContaining('Second prompt')
        })
      );
    });
  });

  describe('Error recovery', () => {
    it('should retry failed generations', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Second call succeeds
      const mockChunks = [
        '{"type":"content","content":"Retry success"}',
        '{"type":"status","status":"completed"}'
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: new MockReadableStream(mockChunks)
      } as Response);

      const { result } = renderHook(() => useChapterGeneration(defaultOptions));

      // First attempt
      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(result.current.error).toBeTruthy();

      // Retry
      await act(async () => {
        await result.current.generate('Test prompt');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.content).toBe('Retry success');
    });
  });
});