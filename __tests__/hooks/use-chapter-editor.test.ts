import { renderHook, act, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { useChapterEditor } from '@/hooks/use-chapter-editor';

// Mock fetch for save operations
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock timers for auto-save
jest.useFakeTimers();

describe('useChapterEditor', () => {
  const defaultOptions = {
    initialContent: '<p>Initial chapter content</p>',
    autoSave: false,
    autoSaveDelay: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockFetch.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe('Initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      expect(result.current.content).toBe('<p>Initial chapter content</p>');
      expect(result.current.isEditing).toBe(false);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).toBe(null);
      expect(result.current.wordCount).toBeGreaterThan(0);
    });

    it('should calculate initial word count correctly', () => {
      const content = '<p>This is a test chapter with exactly ten words.</p>';
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        initialContent: content 
      }));

      expect(result.current.wordCount).toBe(9); // "This is a test chapter with exactly ten words"
    });

    it('should restore content from localStorage if available', () => {
      const savedContent = '<p>Restored content from localStorage</p>';
      mockLocalStorage.getItem.mockReturnValue(savedContent);

      const { result } = renderHook(() => useChapterEditor({
        ...defaultOptions,
        restoreFromStorage: true,
        storageKey: 'chapter-1'
      }));

      expect(result.current.content).toBe(savedContent);
      expect(result.current.isDirty).toBe(true); // Different from initial
    });
  });

  describe('Content editing', () => {
    it('should update content and mark as dirty', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<p>Updated content</p>');
      });

      expect(result.current.content).toBe('<p>Updated content</p>');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.wordCount).toBe(2); // "Updated content"
    });

    it('should not mark as dirty when content is same as initial', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<p>Initial chapter content</p>');
      });

      expect(result.current.isDirty).toBe(false);
    });

    it('should enter editing mode', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.startEditing();
      });

      expect(result.current.isEditing).toBe(true);
    });

    it('should exit editing mode', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.startEditing();
      });

      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.stopEditing();
      });

      expect(result.current.isEditing).toBe(false);
    });
  });

  describe('Save functionality', () => {
    it('should save content successfully', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Content to save</p>');
      });

      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.save();
      });

      expect(onSave).toHaveBeenCalledWith('<p>Content to save</p>');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSaved).toBeInstanceOf(Date);
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save errors', async () => {
      const onSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Content to save</p>');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.isDirty).toBe(true); // Should remain dirty
      expect(result.current.lastSaved).toBe(null);
      expect(result.current.isSaving).toBe(false);
    });

    it('should set saving state during save operation', async () => {
      let resolveSave: () => void;
      const onSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => { resolveSave = resolve; })
      );

      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Content to save</p>');
      });

      // Start save operation
      act(() => {
        result.current.save();
      });

      expect(result.current.isSaving).toBe(true);

      // Resolve save
      await act(async () => {
        resolveSave!();
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should prevent multiple simultaneous saves', async () => {
      const onSave = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Content to save</p>');
      });

      // Start first save
      act(() => {
        result.current.save();
      });

      expect(result.current.isSaving).toBe(true);

      // Try second save while first is in progress
      await act(async () => {
        await result.current.save();
      });

      // Should only call onSave once
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-save functionality', () => {
    it('should auto-save after delay when enabled', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        autoSave: true,
        autoSaveDelay: 1000,
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Auto-save content</p>');
      });

      expect(onSave).not.toHaveBeenCalled();

      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('<p>Auto-save content</p>');
      });
    });

    it('should debounce auto-save on rapid content changes', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        autoSave: true,
        autoSaveDelay: 1000,
        onSave 
      }));

      // Rapid content changes
      act(() => {
        result.current.setContent('<p>Content 1</p>');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.setContent('<p>Content 2</p>');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.setContent('<p>Content 3</p>');
      });

      // Complete the debounce period
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith('<p>Content 3</p>');
      });
    });

    it('should not auto-save when content is not dirty', () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        autoSave: true,
        onSave 
      }));

      // Set to same content
      act(() => {
        result.current.setContent('<p>Initial chapter content</p>');
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should cancel auto-save when manual save occurs', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        autoSave: true,
        autoSaveDelay: 1000,
        onSave 
      }));

      act(() => {
        result.current.setContent('<p>Manual save content</p>');
      });

      // Manual save before auto-save timer
      await act(async () => {
        await result.current.save();
      });

      // Advance timer past auto-save delay
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should only have been called once (manual save)
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Revert functionality', () => {
    it('should revert to initial content', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<p>Modified content</p>');
      });

      expect(result.current.content).toBe('<p>Modified content</p>');
      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.revert();
      });

      expect(result.current.content).toBe('<p>Initial chapter content</p>');
      expect(result.current.isDirty).toBe(false);
    });

    it('should revert to last saved content when available', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({ 
        ...defaultOptions, 
        onSave 
      }));

      // Modify and save
      act(() => {
        result.current.setContent('<p>Saved content</p>');
      });

      await act(async () => {
        await result.current.save();
      });

      // Modify again
      act(() => {
        result.current.setContent('<p>Modified again</p>');
      });

      // Revert should go back to saved content
      act(() => {
        result.current.revert();
      });

      expect(result.current.content).toBe('<p>Saved content</p>');
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Export functionality', () => {
    it('should export as markdown', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<h1>Chapter Title</h1><p>Chapter content with <strong>bold</strong> text.</p>');
      });

      const markdown = result.current.exportMarkdown();
      expect(markdown).toContain('# Chapter Title');
      expect(markdown).toContain('Chapter content with **bold** text.');
    });

    it('should export as HTML', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<h1>Chapter Title</h1><p>Chapter content</p>');
      });

      const html = result.current.exportHTML();
      expect(html).toContain('<h1>Chapter Title</h1>');
      expect(html).toContain('<p>Chapter content</p>');
    });

    it('should export as DOCX blob', async () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<h1>Chapter Title</h1><p>Chapter content</p>');
      });

      const docxBlob = await result.current.exportDocx();
      expect(docxBlob).toBeInstanceOf(Blob);
      expect(docxBlob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  });

  describe('Word count calculation', () => {
    it('should calculate word count for plain text', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('This is a simple test with seven words.');
      });

      expect(result.current.wordCount).toBe(8); // "This is a simple test with seven words"
    });

    it('should calculate word count for HTML content', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('<p>This is <strong>bold</strong> and <em>italic</em> text.</p>');
      });

      expect(result.current.wordCount).toBe(6); // "This is bold and italic text"
    });

    it('should handle empty content', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('');
      });

      expect(result.current.wordCount).toBe(0);
    });

    it('should handle content with only whitespace', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      act(() => {
        result.current.setContent('   \n\t   ');
      });

      expect(result.current.wordCount).toBe(0);
    });
  });

  describe('Local storage integration', () => {
    it('should save to localStorage when enabled', () => {
      const { result } = renderHook(() => useChapterEditor({
        ...defaultOptions,
        persistToStorage: true,
        storageKey: 'chapter-1'
      }));

      act(() => {
        result.current.setContent('<p>Content to persist</p>');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chapter-1',
        '<p>Content to persist</p>'
      );
    });

    it('should debounce localStorage saves', () => {
      const { result } = renderHook(() => useChapterEditor({
        ...defaultOptions,
        persistToStorage: true,
        storageKey: 'chapter-1'
      }));

      // Rapid changes
      act(() => {
        result.current.setContent('<p>Content 1</p>');
        result.current.setContent('<p>Content 2</p>');
        result.current.setContent('<p>Content 3</p>');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only save once with final content
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chapter-1',
        '<p>Content 3</p>'
      );
    });

    it('should clear localStorage on successful save', async () => {
      const onSave = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useChapterEditor({
        ...defaultOptions,
        persistToStorage: true,
        storageKey: 'chapter-1',
        onSave
      }));

      act(() => {
        result.current.setContent('<p>Content to save</p>');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chapter-1');
    });
  });

  describe('Performance optimizations', () => {
    it('should debounce word count calculation', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      // Rapid content changes
      act(() => {
        result.current.setContent('<p>Content 1</p>');
        result.current.setContent('<p>Content 2 with more words</p>');
        result.current.setContent('<p>Content 3 with even more words here</p>');
      });

      // Word count should reflect final content
      expect(result.current.wordCount).toBe(8); // "Content 3 with even more words here"
    });

    it('should memoize export functions', () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      const exportMarkdown1 = result.current.exportMarkdown;
      const exportMarkdown2 = result.current.exportMarkdown;

      expect(exportMarkdown1).toBe(exportMarkdown2); // Same reference
    });
  });

  describe('Error handling', () => {
    it('should handle export errors gracefully', async () => {
      const { result } = renderHook(() => useChapterEditor(defaultOptions));

      // Mock a problematic content that might cause export to fail
      act(() => {
        result.current.setContent('<p>Content with \x00 null characters</p>');
      });

      // Should not throw
      expect(() => result.current.exportMarkdown()).not.toThrow();
      expect(await result.current.exportDocx()).toBeInstanceOf(Blob);
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useChapterEditor({
        ...defaultOptions,
        persistToStorage: true,
        storageKey: 'chapter-1'
      }));

      // Should not crash when localStorage fails
      expect(() => {
        act(() => {
          result.current.setContent('<p>New content</p>');
        });
      }).not.toThrow();
    });
  });
});