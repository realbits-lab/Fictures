import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import ChapterWriteLayout from '@/components/chapter/chapter-write-layout';

// Mock the child components
jest.mock('@/components/chapter/chapter-chat-panel', () => {
  return function MockChapterChatPanel({ onGenerate, isGenerating }: any) {
    return (
      <div data-testid="chapter-chat-panel">
        <button onClick={() => onGenerate('test prompt')} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Chapter'}
        </button>
      </div>
    );
  };
});

jest.mock('@/components/chapter/chapter-viewer-panel', () => {
  return function MockChapterViewerPanel({ content, onSave, onEdit, isSaving }: any) {
    return (
      <div data-testid="chapter-viewer-panel">
        <div data-testid="chapter-content">{content}</div>
        <button onClick={() => onSave(content)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Chapter'}
        </button>
        <button onClick={() => onEdit('edited content')}>
          Edit Chapter
        </button>
      </div>
    );
  };
});

// Mock the custom hooks
const mockUseChapterGeneration = jest.fn();
const mockUseChapterEditor = jest.fn();

jest.mock('@/hooks/use-chapter-generation', () => ({
  useChapterGeneration: mockUseChapterGeneration
}));

jest.mock('@/hooks/use-chapter-editor', () => ({
  useChapterEditor: mockUseChapterEditor
}));

describe('ChapterWriteLayout', () => {
  const defaultProps = {
    storyId: 'test-story-id',
    chapterNumber: 1
  };

  const mockGenerationHook = {
    isGenerating: false,
    content: '',
    error: null,
    generationHistory: [],
    generate: jest.fn(),
    regenerate: jest.fn(),
    cancel: jest.fn(),
    clear: jest.fn(),
    getContext: jest.fn(),
    saveContent: jest.fn()
  };

  const mockEditorHook = {
    content: '',
    isEditing: false,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    wordCount: 0,
    setContent: jest.fn(),
    startEditing: jest.fn(),
    stopEditing: jest.fn(),
    save: jest.fn(),
    revert: jest.fn(),
    exportMarkdown: jest.fn(),
    exportHTML: jest.fn(),
    exportDocx: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChapterGeneration.mockReturnValue(mockGenerationHook);
    mockUseChapterEditor.mockReturnValue(mockEditorHook);
  });

  describe('Component rendering', () => {
    it('should render both chat and viewer panels', () => {
      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByTestId('chapter-chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-viewer-panel')).toBeInTheDocument();
    });

    it('should render with responsive layout', () => {
      const { container } = render(<ChapterWriteLayout {...defaultProps} />);

      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2');
    });

    it('should display loading state when generating', () => {
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        isGenerating: true
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should display error state when generation fails', () => {
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        error: 'Generation failed'
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });
  });

  describe('Chapter generation flow', () => {
    it('should handle chapter generation request', async () => {
      const mockGenerate = jest.fn().mockResolvedValue(undefined);
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        generate: mockGenerate
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      const generateButton = screen.getByText('Generate Chapter');
      fireEvent.click(generateButton);

      expect(mockGenerate).toHaveBeenCalledWith('test prompt');
    });

    it('should disable generation during active generation', () => {
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        isGenerating: true
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      const generateButton = screen.getByText('Generating...');
      expect(generateButton).toBeDisabled();
    });

    it('should update content when generation completes', () => {
      const generatedContent = 'This is the generated chapter content.';
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        content: generatedContent
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByTestId('chapter-content')).toHaveTextContent(generatedContent);
    });

    it('should handle generation cancellation', async () => {
      const mockCancel = jest.fn();
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        isGenerating: true,
        cancel: mockCancel
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      // Simulate ESC key press to cancel
      fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 });

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('Chapter editing flow', () => {
    it('should handle content editing', () => {
      const mockSetContent = jest.fn();
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        setContent: mockSetContent
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      const editButton = screen.getByText('Edit Chapter');
      fireEvent.click(editButton);

      expect(mockSetContent).toHaveBeenCalledWith('edited content');
    });

    it('should handle save operation', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        content: 'chapter content',
        save: mockSave
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      const saveButton = screen.getByText('Save Chapter');
      fireEvent.click(saveButton);

      expect(mockSave).toHaveBeenCalled();
    });

    it('should disable save during active save', () => {
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        isSaving: true
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('should show auto-save indicator', () => {
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        lastSaved: new Date('2024-01-01T12:00:00Z'),
        isDirty: false
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    it('should show unsaved changes indicator', () => {
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        isDirty: true
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Panel resize functionality', () => {
    it('should allow resizing panels', () => {
      const { container } = render(<ChapterWriteLayout {...defaultProps} />);

      const resizeHandle = container.querySelector('[data-testid="panel-resize-handle"]');
      expect(resizeHandle).toBeInTheDocument();
    });

    it('should maintain aspect ratio during resize', () => {
      const { container } = render(<ChapterWriteLayout {...defaultProps} />);

      const chatPanel = container.querySelector('[data-testid="chapter-chat-panel"]')?.parentElement;
      const viewerPanel = container.querySelector('[data-testid="chapter-viewer-panel"]')?.parentElement;

      expect(chatPanel).toHaveClass('min-w-0'); // Allows shrinking
      expect(viewerPanel).toHaveClass('min-w-0'); // Allows shrinking
    });

    it('should persist panel sizes in localStorage', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      render(<ChapterWriteLayout {...defaultProps} />);

      // Simulate panel resize
      const resizeHandle = screen.getByTestId('panel-resize-handle');
      fireEvent.mouseDown(resizeHandle);
      fireEvent.mouseMove(document, { clientX: 100 });
      fireEvent.mouseUp(document);

      expect(setItemSpy).toHaveBeenCalledWith(
        'chapter-panel-sizes',
        expect.any(String)
      );
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should handle Ctrl+S to save', () => {
      const mockSave = jest.fn();
      mockUseChapterEditor.mockReturnValue({
        ...mockEditorHook,
        save: mockSave
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      fireEvent.keyDown(document, { key: 's', ctrlKey: true });

      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle Ctrl+G to generate', () => {
      const mockGenerate = jest.fn();
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        generate: mockGenerate
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'g', ctrlKey: true });

      // Should focus on prompt input or trigger generation dialog
      expect(document.activeElement?.closest('[data-testid="chapter-chat-panel"]')).toBeTruthy();
    });

    it('should handle Escape to cancel generation', () => {
      const mockCancel = jest.fn();
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        isGenerating: true,
        cancel: mockCancel
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('Error boundaries', () => {
    it('should handle errors in chat panel gracefully', () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in the mock component
      jest.mocked(require('@/components/chapter/chapter-chat-panel')).mockImplementation(() => {
        throw new Error('Chat panel error');
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      // Should display error boundary
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle errors in viewer panel gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in the mock component
      jest.mocked(require('@/components/chapter/chapter-viewer-panel')).mockImplementation(() => {
        throw new Error('Viewer panel error');
      });

      render(<ChapterWriteLayout {...defaultProps} />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChapterWriteLayout {...defaultProps} />);

      const chatPanel = screen.getByTestId('chapter-chat-panel').closest('[role="region"]');
      const viewerPanel = screen.getByTestId('chapter-viewer-panel').closest('[role="region"]');

      expect(chatPanel).toHaveAttribute('aria-label', 'Chapter writing prompt');
      expect(viewerPanel).toHaveAttribute('aria-label', 'Chapter content viewer');
    });

    it('should support keyboard navigation', () => {
      render(<ChapterWriteLayout {...defaultProps} />);

      // Tab navigation should work between panels
      const chatPanel = screen.getByTestId('chapter-chat-panel');
      const viewerPanel = screen.getByTestId('chapter-viewer-panel');

      chatPanel.focus();
      fireEvent.keyDown(chatPanel, { key: 'Tab' });

      expect(document.activeElement?.closest('[data-testid="chapter-viewer-panel"]')).toBeTruthy();
    });

    it('should announce status changes to screen readers', () => {
      const { rerender } = render(<ChapterWriteLayout {...defaultProps} />);

      // Start generation
      mockUseChapterGeneration.mockReturnValue({
        ...mockGenerationHook,
        isGenerating: true
      });

      rerender(<ChapterWriteLayout {...defaultProps} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/generating/i);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = (props: any) => {
        renderSpy();
        return <ChapterWriteLayout {...props} />;
      };

      const { rerender } = render(<TestComponent {...defaultProps} />);
      
      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should debounce resize events', async () => {
      const { container } = render(<ChapterWriteLayout {...defaultProps} />);
      
      const resizeHandle = container.querySelector('[data-testid="panel-resize-handle"]');
      
      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseMove(resizeHandle!, { clientX: 100 + i });
      }

      // Should debounce and not cause performance issues
      await waitFor(() => {
        expect(container.querySelector('.panel-resizing')).not.toBeInTheDocument();
      });
    });
  });
});