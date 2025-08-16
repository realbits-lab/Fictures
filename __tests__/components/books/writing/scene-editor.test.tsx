import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import SceneEditor from '@/components/books/writing/scene-editor';

// Mock the rich text editor
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content" dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
  )
}));

// Mock debounce for auto-save
jest.mock('lodash/debounce', () => (fn: any) => {
  fn.cancel = jest.fn();
  return fn;
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SceneEditor Component', () => {
  const mockSceneData = {
    id: 'scene-1',
    chapterId: 'chapter-1',
    sceneNumber: 1,
    title: 'Opening Scene',
    content: '<p>This is the scene content.</p>',
    wordCount: 25,
    order: 0,
    sceneType: 'action',
    pov: 'first-person',
    location: 'Forest clearing',
    timeOfDay: 'dawn',
    charactersPresent: ['protagonist', 'mentor'],
    mood: 'tense',
    purpose: 'Establish the world and introduce the main character',
    conflict: 'Character discovers mysterious artifact',
    resolution: 'Character decides to investigate further',
    hooks: ['What is the artifact?', 'Who left it there?'],
    beats: ['Character enters clearing', 'Discovers artifact', 'Hears approaching footsteps'],
    isComplete: false,
    notes: 'Focus on atmospheric description',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockEditor = {
    getHTML: jest.fn(() => '<p>This is the scene content.</p>'),
    getText: jest.fn(() => 'This is the scene content.'),
    commands: {
      setContent: jest.fn(),
      focus: jest.fn(),
      insertContent: jest.fn()
    },
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
    isEditable: true,
    isFocused: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useEditor } = require('@tiptap/react');
    useEditor.mockReturnValue(mockEditor);
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ scene: mockSceneData })
    });
  });

  describe('Component Rendering', () => {
    it('should render the scene editor with content', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('scene-editor')).toBeInTheDocument();
      });

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Opening Scene')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      expect(screen.getByTestId('scene-editor-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading scene...')).toBeInTheDocument();
    });

    it('should handle error state when scene fails to load', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Scene not found'));

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('scene-editor-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load scene')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display word count', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('word-count')).toBeInTheDocument();
      });

      expect(screen.getByText('25 words')).toBeInTheDocument();
    });

    it('should show save status indicator', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('save-status')).toBeInTheDocument();
      });

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Rich Text Editing', () => {
    it('should initialize editor with scene content', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p>This is the scene content.</p>');
      });
    });

    it('should handle text input and update word count', async () => {
      const user = userEvent.setup();
      mockEditor.getText.mockReturnValue('This is updated scene content with more words.');

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      // Simulate typing
      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' Additional text.');

      expect(screen.getByText('9 words')).toBeInTheDocument();
    });

    it('should support formatting toolbar', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
      });

      expect(screen.getByTestId('bold-button')).toBeInTheDocument();
      expect(screen.getByTestId('italic-button')).toBeInTheDocument();
      expect(screen.getByTestId('underline-button')).toBeInTheDocument();
      expect(screen.getByTestId('heading-button')).toBeInTheDocument();
    });

    it('should apply bold formatting when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('bold-button')).toBeInTheDocument();
      });

      const boldButton = screen.getByTestId('bold-button');
      await user.click(boldButton);

      expect(mockEditor.commands.insertContent).toHaveBeenCalledWith('<strong></strong>');
    });

    it('should support undo/redo functionality', async () => {
      const user = userEvent.setup();
      mockEditor.commands.undo = jest.fn();
      mockEditor.commands.redo = jest.fn();

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('undo-button')).toBeInTheDocument();
      });

      const undoButton = screen.getByTestId('undo-button');
      const redoButton = screen.getByTestId('redo-button');

      await user.click(undoButton);
      expect(mockEditor.commands.undo).toHaveBeenCalled();

      await user.click(redoButton);
      expect(mockEditor.commands.redo).toHaveBeenCalled();
    });
  });

  describe('Scene Metadata Editing', () => {
    it('should render metadata form fields', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('scene-metadata')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Scene Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Scene Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Point of View')).toBeInTheDocument();
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
      expect(screen.getByLabelText('Time of Day')).toBeInTheDocument();
      expect(screen.getByLabelText('Mood')).toBeInTheDocument();
    });

    it('should populate metadata fields with scene data', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Opening Scene')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('action')).toBeInTheDocument();
      expect(screen.getByDisplayValue('first-person')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Forest clearing')).toBeInTheDocument();
      expect(screen.getByDisplayValue('dawn')).toBeInTheDocument();
      expect(screen.getByDisplayValue('tense')).toBeInTheDocument();
    });

    it('should update metadata when fields change', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Scene Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Scene Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Scene Title');

      expect(screen.getByDisplayValue('Updated Scene Title')).toBeInTheDocument();
    });

    it('should handle characters present list', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('characters-present')).toBeInTheDocument();
      });

      expect(screen.getByText('protagonist')).toBeInTheDocument();
      expect(screen.getByText('mentor')).toBeInTheDocument();

      // Add new character
      const addCharacterInput = screen.getByPlaceholderText('Add character...');
      await user.type(addCharacterInput, 'villain{enter}');

      expect(screen.getByText('villain')).toBeInTheDocument();
    });

    it('should handle story beats editing', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('story-beats')).toBeInTheDocument();
      });

      expect(screen.getByText('Character enters clearing')).toBeInTheDocument();
      expect(screen.getByText('Discovers artifact')).toBeInTheDocument();

      // Add new beat
      const addBeatButton = screen.getByText('Add Beat');
      await user.click(addBeatButton);

      const newBeatInput = screen.getByPlaceholderText('Enter story beat...');
      await user.type(newBeatInput, 'Character examines artifact closely');

      expect(screen.getByDisplayValue('Character examines artifact closely')).toBeInTheDocument();
    });

    it('should handle hooks editing', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('story-hooks')).toBeInTheDocument();
      });

      expect(screen.getByText('What is the artifact?')).toBeInTheDocument();
      expect(screen.getByText('Who left it there?')).toBeInTheDocument();

      // Add new hook
      const addHookButton = screen.getByText('Add Hook');
      await user.click(addHookButton);

      const newHookInput = screen.getByPlaceholderText('Enter story hook...');
      await user.type(newHookInput, 'Why does it glow?');

      expect(screen.getByDisplayValue('Why does it glow?')).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should auto-save content changes after delay', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      // Simulate content change
      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' New content.');

      // Wait for debounced auto-save
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/save', expect.any(Object));
      }, { timeout: 3000 });
    });

    it('should auto-save metadata changes', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Scene Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Scene Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Title');

      // Wait for debounced auto-save
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/save', expect.any(Object));
      }, { timeout: 3000 });
    });

    it('should show saving indicator during save', async () => {
      const user = userEvent.setup();
      
      // Mock slow save response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          }), 1000)
        )
      );

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' Trigger save.');

      // Should show saving status
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      // Should return to saved status
      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      
      (fetch as jest.Mock).mockRejectedValue(new Error('Save failed'));

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' Trigger failed save.');

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should cancel auto-save when component unmounts', () => {
      const { unmount } = render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      const debouncedSave = require('lodash/debounce')();
      
      unmount();

      expect(debouncedSave.cancel).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support Ctrl+S to manual save', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}s{/Control}');

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/save', expect.any(Object));
    });

    it('should support Ctrl+B for bold formatting', async () => {
      const user = userEvent.setup();
      mockEditor.commands.toggleBold = jest.fn();

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}b{/Control}');

      expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    });

    it('should support Ctrl+I for italic formatting', async () => {
      const user = userEvent.setup();
      mockEditor.commands.toggleItalic = jest.fn();

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}i{/Control}');

      expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
    });

    it('should support Ctrl+Z for undo', async () => {
      const user = userEvent.setup();
      mockEditor.commands.undo = jest.fn();

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}z{/Control}');

      expect(mockEditor.commands.undo).toHaveBeenCalled();
    });

    it('should support Ctrl+Y for redo', async () => {
      const user = userEvent.setup();
      mockEditor.commands.redo = jest.fn();

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}y{/Control}');

      expect(mockEditor.commands.redo).toHaveBeenCalled();
    });
  });

  describe('Scene Completion', () => {
    it('should toggle scene completion status', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('completion-toggle')).toBeInTheDocument();
      });

      const completionToggle = screen.getByTestId('completion-toggle');
      expect(completionToggle).not.toBeChecked();

      await user.click(completionToggle);

      expect(completionToggle).toBeChecked();
      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/save', 
        expect.objectContaining({
          body: expect.stringContaining('"isComplete":true')
        })
      );
    });

    it('should show completion status indicator', async () => {
      const completedScene = { ...mockSceneData, isComplete: true };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scene: completedScene })
      });

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('completion-status')).toBeInTheDocument();
      });

      expect(screen.getByText('Scene Complete')).toBeInTheDocument();
      expect(screen.getByTestId('completion-icon')).toHaveClass('text-green-600');
    });

    it('should require confirmation to mark scene as complete', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('completion-toggle')).toBeInTheDocument();
      });

      const completionToggle = screen.getByTestId('completion-toggle');
      await user.click(completionToggle);

      expect(screen.getByText('Mark scene as complete?')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export scene to markdown', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('export-menu')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      const markdownOption = screen.getByText('Export as Markdown');
      await user.click(markdownOption);

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/export', 
        expect.objectContaining({
          body: expect.stringContaining('"format":"markdown"')
        })
      );
    });

    it('should export scene to HTML', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('export-menu')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      const htmlOption = screen.getByText('Export as HTML');
      await user.click(htmlOption);

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/export', 
        expect.objectContaining({
          body: expect.stringContaining('"format":"html"')
        })
      );
    });

    it('should export scene to plain text', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('export-menu')).toBeInTheDocument();
      });

      const exportButton = screen.getByTestId('export-button');
      await user.click(exportButton);

      const textOption = screen.getByText('Export as Text');
      await user.click(textOption);

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/export', 
        expect.objectContaining({
          body: expect.stringContaining('"format":"text"')
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('scene-editor')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('scene-editor');
      expect(editor).toHaveAttribute('aria-label', 'Scene editor');

      const contentArea = screen.getByTestId('editor-content');
      expect(contentArea).toHaveAttribute('role', 'textbox');
      expect(contentArea).toHaveAttribute('aria-multiline', 'true');
    });

    it('should support screen reader announcements', async () => {
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should have keyboard accessible toolbar', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
      });

      const toolbar = screen.getByTestId('formatting-toolbar');
      expect(toolbar).toHaveAttribute('role', 'toolbar');

      const boldButton = screen.getByTestId('bold-button');
      boldButton.focus();

      await user.keyboard('{Tab}');
      
      const italicButton = screen.getByTestId('italic-button');
      expect(italicButton).toHaveFocus();
    });

    it('should announce save status changes', async () => {
      const user = userEvent.setup();
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const statusRegion = screen.getByRole('status');
      
      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' Trigger save.');

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent('Saving scene...');
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <SceneEditor {...props} />;
      };

      const { rerender } = render(<TestWrapper sceneId="scene-1" chapterId="chapter-1" />);
      rerender(<TestWrapper sceneId="scene-1" chapterId="chapter-1" />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should cleanup editor on unmount', () => {
      const { unmount } = render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      unmount();

      expect(mockEditor.destroy).toHaveBeenCalled();
    });

    it('should handle large content efficiently', async () => {
      const largeContent = '<p>' + 'Large content '.repeat(1000) + '</p>';
      mockEditor.getHTML.mockReturnValue(largeContent);

      const startTime = performance.now();
      
      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('should handle editor initialization errors', () => {
      const { useEditor } = require('@tiptap/react');
      useEditor.mockReturnValue(null);

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      expect(screen.getByTestId('editor-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to initialize editor')).toBeInTheDocument();
    });

    it('should handle API timeout errors', async () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('scene-editor-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load scene')).toBeInTheDocument();
    });

    it('should recover from save errors with retry', async () => {
      const user = userEvent.setup();
      
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      render(<SceneEditor sceneId="scene-1" chapterId="chapter-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      });

      const editor = screen.getByTestId('editor-content');
      await user.click(editor);
      await user.type(editor, ' Trigger save error.');

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });
  });
});