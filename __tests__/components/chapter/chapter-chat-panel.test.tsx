import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import ChapterChatPanel from '@/components/chapter/chapter-chat-panel';

// Mock the child components
jest.mock('@/components/chapter/chapter-prompt-input', () => {
  return function MockChapterPromptInput({ onSubmit, isGenerating, placeholder }: any) {
    return (
      <div data-testid="chapter-prompt-input">
        <textarea
          data-testid="prompt-textarea"
          placeholder={placeholder}
          disabled={isGenerating}
          onChange={(e) => {
            // Store value for test access
            e.target.setAttribute('data-value', e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              const value = (e.target as HTMLTextAreaElement).value;
              if (value.trim()) {
                onSubmit(value);
              }
            }
          }}
        />
        <button
          data-testid="submit-prompt-button"
          onClick={() => {
            const textarea = document.querySelector('[data-testid="prompt-textarea"]') as HTMLTextAreaElement;
            if (textarea?.value.trim()) {
              onSubmit(textarea.value);
            }
          }}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    );
  };
});

jest.mock('@/components/chapter/chapter-context-display', () => {
  return function MockChapterContextDisplay({ storyTitle, previousChapters, characters }: any) {
    return (
      <div data-testid="chapter-context-display">
        <div data-testid="story-title">{storyTitle}</div>
        <div data-testid="previous-chapters-count">{previousChapters?.length || 0}</div>
        <div data-testid="characters-count">{characters?.length || 0}</div>
      </div>
    );
  };
});

describe('ChapterChatPanel', () => {
  const defaultProps = {
    storyId: 'test-story-id',
    chapterNumber: 1,
    onGenerate: jest.fn(),
    isGenerating: false,
    generationHistory: []
  };

  const mockGenerationHistory = [
    {
      id: 'gen-1',
      prompt: 'Write an exciting opening',
      generatedContent: 'The adventure begins...',
      status: 'completed' as const,
      createdAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'gen-2',
      prompt: 'Make it more dramatic',
      generatedContent: 'The epic adventure begins...',
      status: 'completed' as const,
      createdAt: new Date('2024-01-01T11:00:00Z')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component rendering', () => {
    it('should render prompt input and context display', () => {
      render(<ChapterChatPanel {...defaultProps} />);

      expect(screen.getByTestId('chapter-prompt-input')).toBeInTheDocument();
      expect(screen.getByTestId('chapter-context-display')).toBeInTheDocument();
    });

    it('should display chapter information in header', () => {
      render(<ChapterChatPanel {...defaultProps} />);

      expect(screen.getByText(/chapter 1/i)).toBeInTheDocument();
    });

    it('should show generating state when active', () => {
      render(<ChapterChatPanel {...defaultProps} isGenerating={true} />);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should display previous chapter summary when provided', () => {
      const props = {
        ...defaultProps,
        previousChapterSummary: 'The hero started their journey in the enchanted forest.'
      };

      render(<ChapterChatPanel {...props} />);

      expect(screen.getByText(/previous chapter/i)).toBeInTheDocument();
      expect(screen.getByText('The hero started their journey in the enchanted forest.')).toBeInTheDocument();
    });
  });

  describe('Prompt input handling', () => {
    it('should handle prompt submission', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} />);

      const textarea = screen.getByTestId('prompt-textarea');
      await user.type(textarea, 'Write a compelling opening chapter');
      
      const submitButton = screen.getByTestId('submit-prompt-button');
      await user.click(submitButton);

      expect(defaultProps.onGenerate).toHaveBeenCalledWith('Write a compelling opening chapter');
    });

    it('should handle Ctrl+Enter to submit prompt', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} />);

      const textarea = screen.getByTestId('prompt-textarea');
      await user.type(textarea, 'Write a compelling opening chapter');
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(defaultProps.onGenerate).toHaveBeenCalledWith('Write a compelling opening chapter');
    });

    it('should not submit empty prompts', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} />);

      const submitButton = screen.getByTestId('submit-prompt-button');
      await user.click(submitButton);

      expect(defaultProps.onGenerate).not.toHaveBeenCalled();
    });

    it('should not submit whitespace-only prompts', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} />);

      const textarea = screen.getByTestId('prompt-textarea');
      await user.type(textarea, '   \n\t  ');
      
      const submitButton = screen.getByTestId('submit-prompt-button');
      await user.click(submitButton);

      expect(defaultProps.onGenerate).not.toHaveBeenCalled();
    });

    it('should disable input during generation', () => {
      render(<ChapterChatPanel {...defaultProps} isGenerating={true} />);

      const textarea = screen.getByTestId('prompt-textarea');
      const submitButton = screen.getByTestId('submit-prompt-button');

      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should clear input after successful submission', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} />);

      const textarea = screen.getByTestId('prompt-textarea');
      await user.type(textarea, 'Write a compelling opening chapter');
      
      const submitButton = screen.getByTestId('submit-prompt-button');
      await user.click(submitButton);

      expect(textarea).toHaveValue('');
    });
  });

  describe('Generation history', () => {
    it('should display generation history when available', () => {
      render(<ChapterChatPanel {...defaultProps} generationHistory={mockGenerationHistory} />);

      expect(screen.getByText(/history/i)).toBeInTheDocument();
      expect(screen.getAllByText(/write/i)).toHaveLength(2); // Both prompts contain "write"
    });

    it('should allow selecting previous prompts', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} generationHistory={mockGenerationHistory} />);

      const historyButton = screen.getByTestId('history-dropdown-trigger');
      await user.click(historyButton);

      const firstPrompt = screen.getByText('Write an exciting opening');
      await user.click(firstPrompt);

      const textarea = screen.getByTestId('prompt-textarea');
      expect(textarea).toHaveValue('Write an exciting opening');
    });

    it('should show most recent prompts first', () => {
      render(<ChapterChatPanel {...defaultProps} generationHistory={mockGenerationHistory} />);

      const historyItems = screen.getAllByTestId('history-item');
      expect(historyItems[0]).toHaveTextContent('Make it more dramatic');
      expect(historyItems[1]).toHaveTextContent('Write an exciting opening');
    });

    it('should limit history display to 10 items', () => {
      const longHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `gen-${i}`,
        prompt: `Prompt ${i}`,
        generatedContent: `Content ${i}`,
        status: 'completed' as const,
        createdAt: new Date()
      }));

      render(<ChapterChatPanel {...defaultProps} generationHistory={longHistory} />);

      const historyItems = screen.getAllByTestId('history-item');
      expect(historyItems).toHaveLength(10);
    });
  });

  describe('Context display', () => {
    it('should pass story context to context display component', () => {
      const props = {
        ...defaultProps,
        storyTitle: 'The Epic Adventure',
        previousChapters: [
          { chapterNumber: 1, title: 'The Beginning', summary: 'The journey starts' }
        ],
        characters: [
          { id: 'char-1', name: 'Hero', role: 'protagonist', description: 'The main character' }
        ]
      };

      render(<ChapterChatPanel {...props} />);

      expect(screen.getByTestId('story-title')).toHaveTextContent('The Epic Adventure');
      expect(screen.getByTestId('previous-chapters-count')).toHaveTextContent('1');
      expect(screen.getByTestId('characters-count')).toHaveTextContent('1');
    });

    it('should handle missing context gracefully', () => {
      render(<ChapterChatPanel {...defaultProps} />);

      expect(screen.getByTestId('previous-chapters-count')).toHaveTextContent('0');
      expect(screen.getByTestId('characters-count')).toHaveTextContent('0');
    });
  });

  describe('Prompt suggestions', () => {
    it('should show contextual prompt suggestions', () => {
      render(<ChapterChatPanel {...defaultProps} chapterNumber={1} />);

      expect(screen.getByText(/opening chapter/i)).toBeInTheDocument();
    });

    it('should show different suggestions for chapter 1 vs later chapters', () => {
      const { rerender } = render(<ChapterChatPanel {...defaultProps} chapterNumber={1} />);
      expect(screen.getByText(/opening chapter/i)).toBeInTheDocument();

      rerender(<ChapterChatPanel {...defaultProps} chapterNumber={5} />);
      expect(screen.getByText(/continue the story/i)).toBeInTheDocument();
    });

    it('should allow clicking suggestions to populate prompt', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} chapterNumber={1} />);

      const suggestion = screen.getByText(/opening chapter/i);
      await user.click(suggestion);

      const textarea = screen.getByTestId('prompt-textarea');
      expect(textarea.value).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChapterChatPanel {...defaultProps} />);

      const panel = screen.getByRole('region');
      expect(panel).toHaveAttribute('aria-label', expect.stringContaining('Chapter writing'));
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChapterChatPanel {...defaultProps} generationHistory={mockGenerationHistory} />);

      // Should be able to tab between elements
      await user.tab();
      expect(screen.getByTestId('prompt-textarea')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('submit-prompt-button')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('history-dropdown-trigger')).toHaveFocus();
    });

    it('should announce generation status to screen readers', () => {
      const { rerender } = render(<ChapterChatPanel {...defaultProps} />);

      // Start generation
      rerender(<ChapterChatPanel {...defaultProps} isGenerating={true} />);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/generating/i);
    });
  });

  describe('Error handling', () => {
    it('should display error messages', () => {
      const props = {
        ...defaultProps,
        error: 'Failed to generate chapter. Please try again.'
      };

      render(<ChapterChatPanel {...props} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to generate chapter. Please try again.');
    });

    it('should allow retrying after error', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        error: 'Generation failed',
        onRetry: jest.fn()
      };

      render(<ChapterChatPanel {...props} />);

      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      expect(props.onRetry).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should debounce prompt input', async () => {
      const user = userEvent.setup();
      const onPromptChange = jest.fn();
      
      render(<ChapterChatPanel {...defaultProps} onPromptChange={onPromptChange} />);

      const textarea = screen.getByTestId('prompt-textarea');
      
      // Rapid typing
      await user.type(textarea, 'Quick typing test');
      
      // Should debounce and not call for every keystroke
      await waitFor(() => {
        expect(onPromptChange).toHaveBeenCalledTimes(1);
      });
    });

    it('should virtualize long generation history', () => {
      const longHistory = Array.from({ length: 100 }, (_, i) => ({
        id: `gen-${i}`,
        prompt: `Prompt ${i}`,
        generatedContent: `Content ${i}`,
        status: 'completed' as const,
        createdAt: new Date()
      }));

      render(<ChapterChatPanel {...defaultProps} generationHistory={longHistory} />);

      // Should only render visible items
      const historyItems = screen.getAllByTestId('history-item');
      expect(historyItems.length).toBeLessThan(longHistory.length);
    });
  });

  describe('Responsive design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { container } = render(<ChapterChatPanel {...defaultProps} />);

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex-col'); // Stacked layout on mobile
    });

    it('should use horizontal layout on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      const { container } = render(<ChapterChatPanel {...defaultProps} />);

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('lg:flex-row'); // Side-by-side on desktop
    });
  });
});