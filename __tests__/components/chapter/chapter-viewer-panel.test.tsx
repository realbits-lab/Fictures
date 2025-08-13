import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import ChapterViewerPanel from '@/components/chapter/chapter-viewer-panel';

// Mock the child components
jest.mock('@/components/chapter/chapter-content-display', () => {
  return function MockChapterContentDisplay({ content, isEditing, onToggleEdit }: any) {
    return (
      <div data-testid="chapter-content-display">
        {isEditing ? (
          <textarea
            data-testid="content-editor"
            defaultValue={content}
            onChange={(e) => {
              // Store value for test access
              e.target.setAttribute('data-value', e.target.value);
            }}
          />
        ) : (
          <div data-testid="content-preview" dangerouslySetInnerHTML={{ __html: content }} />
        )}
        <button data-testid="toggle-edit-button" onClick={onToggleEdit}>
          {isEditing ? 'Preview' : 'Edit'}
        </button>
      </div>
    );
  };
});

jest.mock('@/components/chapter/chapter-editor', () => {
  return function MockChapterEditor({ content, onChange, onSave, onCancel }: any) {
    return (
      <div data-testid="chapter-editor">
        <textarea
          data-testid="editor-textarea"
          defaultValue={content}
          onChange={(e) => onChange(e.target.value)}
        />
        <button data-testid="save-button" onClick={onSave}>Save</button>
        <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

describe('ChapterViewerPanel', () => {
  const defaultProps = {
    content: '<p>This is the chapter content.</p>',
    isGenerating: false,
    onSave: jest.fn(),
    onEdit: jest.fn(),
    isSaving: false,
    lastSaved: null,
    wordCount: 5
  };

  const mockSavedDate = new Date('2024-01-01T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component rendering', () => {
    it('should render content display and toolbar', () => {
      render(<ChapterViewerPanel {...defaultProps} />);

      expect(screen.getByTestId('chapter-content-display')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-toolbar')).toBeInTheDocument();
    });

    it('should display word count in toolbar', () => {
      render(<ChapterViewerPanel {...defaultProps} wordCount={1234} />);

      expect(screen.getByText('1,234 words')).toBeInTheDocument();
    });

    it('should show save status when available', () => {
      render(<ChapterViewerPanel {...defaultProps} lastSaved={mockSavedDate} />);

      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });

    it('should show generating state', () => {
      render(<ChapterViewerPanel {...defaultProps} isGenerating={true} />);

      expect(screen.getByTestId('generating-indicator')).toBeInTheDocument();
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    it('should show saving state', () => {
      render(<ChapterViewerPanel {...defaultProps} isSaving={true} />);

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Content display modes', () => {
    it('should show preview mode by default', () => {
      render(<ChapterViewerPanel {...defaultProps} />);

      expect(screen.getByTestId('content-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('content-editor')).not.toBeInTheDocument();
    });

    it('should switch to edit mode when toggled', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('content-preview')).not.toBeInTheDocument();
    });

    it('should call onEdit when content is edited', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      // Switch to edit mode
      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      // Edit content
      const editor = screen.getByTestId('content-editor');
      await user.clear(editor);
      await user.type(editor, '<p>Updated chapter content.</p>');

      expect(defaultProps.onEdit).toHaveBeenCalledWith('<p>Updated chapter content.</p>');
    });

    it('should switch back to preview mode after editing', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      // Switch to edit mode
      let editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      // Switch back to preview mode
      editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      expect(screen.getByTestId('content-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('content-editor')).not.toBeInTheDocument();
    });
  });

  describe('Save functionality', () => {
    it('should handle manual save', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const saveButton = screen.getByTestId('save-chapter-button');
      await user.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalledWith(defaultProps.content);
    });

    it('should disable save button when saving', () => {
      render(<ChapterViewerPanel {...defaultProps} isSaving={true} />);

      const saveButton = screen.getByTestId('save-chapter-button');
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when generating', () => {
      render(<ChapterViewerPanel {...defaultProps} isGenerating={true} />);

      const saveButton = screen.getByTestId('save-chapter-button');
      expect(saveButton).toBeDisabled();
    });

    it('should show save keyboard shortcut', () => {
      render(<ChapterViewerPanel {...defaultProps} />);

      const saveButton = screen.getByTestId('save-chapter-button');
      expect(saveButton).toHaveAttribute('title', expect.stringContaining('Ctrl+S'));
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      const onSaveWithError = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      render(<ChapterViewerPanel {...defaultProps} onSave={onSaveWithError} />);

      const saveButton = screen.getByTestId('save-chapter-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/save failed/i);
      });
    });
  });

  describe('Auto-save functionality', () => {
    it('should show auto-save status', () => {
      render(<ChapterViewerPanel {...defaultProps} lastSaved={mockSavedDate} autoSave={true} />);

      expect(screen.getByText(/auto-saved/i)).toBeInTheDocument();
    });

    it('should show unsaved changes indicator', () => {
      render(<ChapterViewerPanel {...defaultProps} isDirty={true} />);

      expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('should trigger auto-save after delay', async () => {
      const onAutoSave = jest.fn();
      render(<ChapterViewerPanel {...defaultProps} onAutoSave={onAutoSave} autoSaveDelay={100} />);

      // Trigger content change
      fireEvent.change(document, { target: { value: 'new content' } });

      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('Export functionality', () => {
    it('should show export options', () => {
      render(<ChapterViewerPanel {...defaultProps} />);

      const exportButton = screen.getByTestId('export-dropdown-trigger');
      expect(exportButton).toBeInTheDocument();
    });

    it('should handle markdown export', async () => {
      const user = userEvent.setup();
      const onExportMarkdown = jest.fn().mockReturnValue('# Chapter Content\n\nThis is the content.');
      
      render(<ChapterViewerPanel {...defaultProps} onExportMarkdown={onExportMarkdown} />);

      const exportButton = screen.getByTestId('export-dropdown-trigger');
      await user.click(exportButton);

      const markdownOption = screen.getByText(/markdown/i);
      await user.click(markdownOption);

      expect(onExportMarkdown).toHaveBeenCalled();
    });

    it('should handle HTML export', async () => {
      const user = userEvent.setup();
      const onExportHTML = jest.fn().mockReturnValue('<h1>Chapter Content</h1><p>This is the content.</p>');
      
      render(<ChapterViewerPanel {...defaultProps} onExportHTML={onExportHTML} />);

      const exportButton = screen.getByTestId('export-dropdown-trigger');
      await user.click(exportButton);

      const htmlOption = screen.getByText(/html/i);
      await user.click(htmlOption);

      expect(onExportHTML).toHaveBeenCalled();
    });

    it('should handle DOCX export', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['fake docx content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const onExportDocx = jest.fn().mockResolvedValue(mockBlob);
      
      render(<ChapterViewerPanel {...defaultProps} onExportDocx={onExportDocx} />);

      const exportButton = screen.getByTestId('export-dropdown-trigger');
      await user.click(exportButton);

      const docxOption = screen.getByText(/word/i);
      await user.click(docxOption);

      expect(onExportDocx).toHaveBeenCalled();
    });
  });

  describe('Content formatting', () => {
    it('should render rich text content correctly', () => {
      const richContent = '<h1>Chapter Title</h1><p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      
      render(<ChapterViewerPanel {...defaultProps} content={richContent} />);

      const preview = screen.getByTestId('content-preview');
      expect(preview).toContainHTML(richContent);
    });

    it('should sanitize harmful HTML', () => {
      const harmfulContent = '<p>Safe content</p><script>alert("xss")</script>';
      
      render(<ChapterViewerPanel {...defaultProps} content={harmfulContent} />);

      const preview = screen.getByTestId('content-preview');
      expect(preview).not.toContainHTML('<script>');
      expect(preview).toContainHTML('<p>Safe content</p>');
    });

    it('should handle empty content gracefully', () => {
      render(<ChapterViewerPanel {...defaultProps} content="" />);

      expect(screen.getByText(/no content/i)).toBeInTheDocument();
    });

    it('should calculate word count accurately', () => {
      const content = '<p>This is a test chapter with exactly ten words total.</p>';
      
      render(<ChapterViewerPanel {...defaultProps} content={content} wordCount={10} />);

      expect(screen.getByText('10 words')).toBeInTheDocument();
    });
  });

  describe('Toolbar functionality', () => {
    it('should show formatting tools in edit mode', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      // Switch to edit mode
      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
    });

    it('should apply bold formatting', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      const boldButton = screen.getByTestId('bold-button');
      await user.click(boldButton);

      // Should insert bold tags or apply formatting
      expect(screen.getByTestId('content-editor')).toHaveAttribute('data-format', expect.stringContaining('bold'));
    });

    it('should apply italic formatting', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      const italicButton = screen.getByTestId('italic-button');
      await user.click(italicButton);

      expect(screen.getByTestId('content-editor')).toHaveAttribute('data-format', expect.stringContaining('italic'));
    });

    it('should show character and paragraph count', () => {
      const content = '<p>This is a paragraph.</p><p>This is another paragraph.</p>';
      
      render(<ChapterViewerPanel {...defaultProps} content={content} />);

      expect(screen.getByText(/2 paragraphs/i)).toBeInTheDocument();
    });
  });

  describe('Reading experience', () => {
    it('should support different view modes', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const viewModeButton = screen.getByTestId('view-mode-selector');
      await user.click(viewModeButton);

      expect(screen.getByText(/reading mode/i)).toBeInTheDocument();
      expect(screen.getByText(/editing mode/i)).toBeInTheDocument();
    });

    it('should adjust font size', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const fontSizeButton = screen.getByTestId('font-size-control');
      await user.click(fontSizeButton);

      const increaseButton = screen.getByTestId('increase-font-size');
      await user.click(increaseButton);

      const preview = screen.getByTestId('content-preview');
      expect(preview).toHaveStyle('font-size: 1.125rem'); // Increased font size
    });

    it('should toggle dark mode', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      const darkModeButton = screen.getByTestId('dark-mode-toggle');
      await user.click(darkModeButton);

      const panel = screen.getByTestId('chapter-viewer-panel');
      expect(panel).toHaveClass('dark');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChapterViewerPanel {...defaultProps} />);

      const panel = screen.getByRole('region');
      expect(panel).toHaveAttribute('aria-label', expect.stringContaining('Chapter content'));
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      // Tab through elements
      await user.tab();
      expect(screen.getByTestId('save-chapter-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('toggle-edit-button')).toHaveFocus();
    });

    it('should announce content changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ChapterViewerPanel {...defaultProps} />);

      // Edit content
      const editButton = screen.getByTestId('toggle-edit-button');
      await user.click(editButton);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/editing mode/i);
    });

    it('should support high contrast mode', () => {
      render(<ChapterViewerPanel {...defaultProps} highContrast={true} />);

      const panel = screen.getByTestId('chapter-viewer-panel');
      expect(panel).toHaveClass('high-contrast');
    });
  });

  describe('Performance', () => {
    it('should virtualize large content', () => {
      const largeContent = '<p>' + 'Large content. '.repeat(1000) + '</p>';
      
      render(<ChapterViewerPanel {...defaultProps} content={largeContent} />);

      // Should render without performance issues
      expect(screen.getByTestId('content-preview')).toBeInTheDocument();
    });

    it('should debounce auto-save', async () => {
      const onAutoSave = jest.fn();
      render(<ChapterViewerPanel {...defaultProps} onAutoSave={onAutoSave} autoSaveDelay={100} />);

      // Rapid content changes
      for (let i = 0; i < 5; i++) {
        fireEvent.change(document, { target: { value: `content ${i}` } });
      }

      // Should debounce and only save once
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  describe('Error handling', () => {
    it('should handle rendering errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidContent = '<p>Valid content</p><invalid-tag>';
      render(<ChapterViewerPanel {...defaultProps} content={invalidContent} />);

      // Should render without crashing
      expect(screen.getByTestId('content-preview')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should show offline indicator when network is unavailable', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });

      render(<ChapterViewerPanel {...defaultProps} />);

      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });
  });
});