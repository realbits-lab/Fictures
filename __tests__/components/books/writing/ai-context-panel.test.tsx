import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import AIContextPanel from '@/components/books/writing/ai-context-panel';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('AIContextPanel Component', () => {
  const mockContextData = {
    bookId: 'book-1',
    bookTitle: 'My Novel',
    bookGenre: 'Fantasy',
    bookSynopsis: 'A young hero discovers magical powers and must save the world.',
    storyId: 'story-1',
    storyTitle: 'The Beginning',
    storySynopsis: 'The hero\'s origin story and first adventure.',
    storyThemes: ['coming of age', 'good vs evil', 'friendship'],
    storyWorldSettings: {
      setting: 'Medieval fantasy world',
      magic_system: 'Elemental magic based on emotions',
      major_locations: ['Royal City', 'Enchanted Forest', 'Ancient Ruins']
    },
    partId: 'part-1',
    partTitle: 'Origins',
    partDescription: 'The hero discovers their powers.',
    partThematicFocus: 'Self-discovery',
    partTimeframe: { start: 'Spring, Year 1', duration: '3 months' },
    partLocation: 'Royal City and surrounding lands',
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterSummary: 'Hero awakens to strange dreams and discovers magical abilities.',
    chapterPOV: 'first-person',
    chapterSetting: 'Hero\'s home village',
    chapterCharactersPresent: ['Hero', 'Mentor', 'Village Elder'],
    previousChapterSummary: null,
    nextChapterHints: 'Hero will meet their first magical creature.',
    sceneId: 'scene-1',
    sceneTitle: 'The Awakening',
    sceneContent: 'Hero wakes from a prophetic dream...',
    sceneType: 'exposition',
    scenePOV: 'first-person',
    sceneLocation: 'Hero\'s bedroom',
    sceneTimeOfDay: 'dawn',
    sceneCharactersPresent: ['Hero'],
    sceneMood: 'mysterious',
    scenePurpose: 'Establish the inciting incident',
    sceneConflict: 'Hero struggles to understand the dream',
    sceneResolution: 'Hero decides to seek answers',
    sceneHooks: ['What did the dream mean?', 'Who was the mysterious figure?'],
    sceneBeats: ['Hero wakes startled', 'Reflects on vivid dream', 'Notices strange sensations'],
    characterProfiles: [
      {
        id: 'hero-1',
        name: 'Aiden',
        role: 'protagonist',
        description: 'Young farm boy with hidden magical potential',
        traits: ['curious', 'brave', 'naive'],
        motivations: ['discover truth about powers', 'protect loved ones'],
        relationships: [
          { character: 'Mentor', relationship: 'student-teacher', status: 'developing' }
        ]
      },
      {
        id: 'mentor-1',
        name: 'Eldara',
        role: 'mentor',
        description: 'Wise mage who recognizes the hero\'s potential',
        traits: ['wise', 'patient', 'mysterious'],
        motivations: ['guide the hero', 'prepare for coming darkness'],
        relationships: [
          { character: 'Hero', relationship: 'teacher-student', status: 'initial' }
        ]
      }
    ],
    relevantPlotPoints: [
      'Ancient prophecy speaks of a chosen one',
      'Dark forces are stirring in the north',
      'The magical academy has been closed for decades'
    ],
    continuityNotes: [
      'Hero has not yet manifested any visible magic',
      'Weather has been unusually cold this spring',
      'Village harvest festival is next week'
    ],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ context: mockContextData })
    });
  });

  describe('Component Rendering', () => {
    it('should render the AI context panel with all sections', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('ai-context-panel')).toBeInTheDocument();
      });

      expect(screen.getByTestId('context-hierarchy')).toBeInTheDocument();
      expect(screen.getByTestId('context-characters')).toBeInTheDocument();
      expect(screen.getByTestId('context-plot')).toBeInTheDocument();
      expect(screen.getByTestId('context-continuity')).toBeInTheDocument();
      expect(screen.getByTestId('ai-generation-controls')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<AIContextPanel sceneId="scene-1" />);

      expect(screen.getByTestId('context-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading context...')).toBeInTheDocument();
    });

    it('should handle error state when context fails to load', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Context load failed'));

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load AI context')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display hierarchy context', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter One')).toBeInTheDocument();
      expect(screen.getByText('The Awakening')).toBeInTheDocument();
    });

    it('should display character information', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('Aiden')).toBeInTheDocument();
      });

      expect(screen.getByText('Aiden')).toBeInTheDocument();
      expect(screen.getByText('protagonist')).toBeInTheDocument();
      expect(screen.getByText('Eldara')).toBeInTheDocument();
      expect(screen.getByText('mentor')).toBeInTheDocument();
    });

    it('should display plot points and continuity notes', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('Ancient prophecy speaks of a chosen one')).toBeInTheDocument();
      });

      expect(screen.getByText('Ancient prophecy speaks of a chosen one')).toBeInTheDocument();
      expect(screen.getByText('Hero has not yet manifested any visible magic')).toBeInTheDocument();
    });
  });

  describe('Context Sections', () => {
    it('should allow expanding and collapsing hierarchy section', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-hierarchy')).toBeInTheDocument();
      });

      // Should be expanded by default
      expect(screen.getByText('Fantasy')).toBeInTheDocument();

      const collapseButton = screen.getByTestId('collapse-hierarchy');
      await user.click(collapseButton);

      // Should collapse and hide details
      expect(screen.queryByText('Fantasy')).not.toBeInTheDocument();

      // Expand again
      await user.click(collapseButton);
      expect(screen.getByText('Fantasy')).toBeInTheDocument();
    });

    it('should allow expanding and collapsing characters section', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-characters')).toBeInTheDocument();
      });

      expect(screen.getByText('Young farm boy with hidden magical potential')).toBeInTheDocument();

      const collapseButton = screen.getByTestId('collapse-characters');
      await user.click(collapseButton);

      expect(screen.queryByText('Young farm boy with hidden magical potential')).not.toBeInTheDocument();
    });

    it('should allow expanding and collapsing plot section', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-plot')).toBeInTheDocument();
      });

      expect(screen.getByText('Dark forces are stirring in the north')).toBeInTheDocument();

      const collapseButton = screen.getByTestId('collapse-plot');
      await user.click(collapseButton);

      expect(screen.queryByText('Dark forces are stirring in the north')).not.toBeInTheDocument();
    });

    it('should show character details in expandable cards', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('Aiden')).toBeInTheDocument();
      });

      // Character details should be collapsed initially
      expect(screen.queryByText('curious')).not.toBeInTheDocument();

      const characterCard = screen.getByTestId('character-card-hero-1');
      await user.click(characterCard);

      // Should show character traits and motivations
      expect(screen.getByText('curious')).toBeInTheDocument();
      expect(screen.getByText('discover truth about powers')).toBeInTheDocument();
    });

    it('should display world settings in hierarchy section', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('Medieval fantasy world')).toBeInTheDocument();
      });

      expect(screen.getByText('Medieval fantasy world')).toBeInTheDocument();
      expect(screen.getByText('Elemental magic based on emotions')).toBeInTheDocument();
      expect(screen.getByText('Royal City')).toBeInTheDocument();
    });
  });

  describe('AI Generation Controls', () => {
    it('should render AI generation controls', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('ai-generation-controls')).toBeInTheDocument();
      });

      expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      expect(screen.getByTestId('generate-button')).toBeInTheDocument();
      expect(screen.getByTestId('context-options')).toBeInTheDocument();
    });

    it('should allow customizing context for AI generation', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-options')).toBeInTheDocument();
      });

      const includeCharacters = screen.getByLabelText('Include character details');
      const includePlot = screen.getByLabelText('Include plot points');
      const includeContinuity = screen.getByLabelText('Include continuity notes');

      expect(includeCharacters).toBeChecked();
      expect(includePlot).toBeChecked();
      expect(includeContinuity).toBeChecked();

      await user.click(includePlot);
      expect(includePlot).not.toBeChecked();
    });

    it('should generate AI content with context', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ context: mockContextData })
      }).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          generatedContent: 'AI generated scene content...',
          tokensUsed: 150 
        })
      });

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      });

      const promptInput = screen.getByTestId('context-prompt-input');
      const generateButton = screen.getByTestId('generate-button');

      await user.type(promptInput, 'Generate a continuation of this scene where the hero discovers their powers.');
      await user.click(generateButton);

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/generate', 
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Generate a continuation')
        })
      );
    });

    it('should show generation progress', async () => {
      const user = userEvent.setup();
      
      // Mock slow generation response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ context: mockContextData })
      }).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ generatedContent: 'Generated...' })
          }), 1000)
        )
      );

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      });

      const promptInput = screen.getByTestId('context-prompt-input');
      const generateButton = screen.getByTestId('generate-button');

      await user.type(promptInput, 'Test prompt');
      await user.click(generateButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Generate')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle generation errors', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ context: mockContextData })
      }).mockRejectedValueOnce(new Error('Generation failed'));

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      });

      const promptInput = screen.getByTestId('context-prompt-input');
      const generateButton = screen.getByTestId('generate-button');

      await user.type(promptInput, 'Test prompt');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('Context Refresh', () => {
    it('should refresh context when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-context')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(1);

      const refreshButton = screen.getByTestId('refresh-context');
      await user.click(refreshButton);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('should auto-refresh context periodically', async () => {
      jest.useFakeTimers();
      
      render(<AIContextPanel sceneId="scene-1" autoRefresh={true} refreshInterval={30000} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Fast forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('should show last updated timestamp', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('last-updated')).toBeInTheDocument();
      });

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should handle refresh errors gracefully', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ context: mockContextData })
      }).mockRejectedValueOnce(new Error('Refresh failed'));

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-context')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-context');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('Refresh failed')).toBeInTheDocument();
      });

      // Should still show previous context
      expect(screen.getByText('My Novel')).toBeInTheDocument();
    });
  });

  describe('Context Filtering and Search', () => {
    it('should filter characters by name', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('character-search')).toBeInTheDocument();
      });

      expect(screen.getByText('Aiden')).toBeInTheDocument();
      expect(screen.getByText('Eldara')).toBeInTheDocument();

      const searchInput = screen.getByTestId('character-search');
      await user.type(searchInput, 'Aiden');

      expect(screen.getByText('Aiden')).toBeInTheDocument();
      expect(screen.queryByText('Eldara')).not.toBeInTheDocument();
    });

    it('should filter plot points by keyword', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('plot-search')).toBeInTheDocument();
      });

      expect(screen.getByText('Ancient prophecy speaks of a chosen one')).toBeInTheDocument();
      expect(screen.getByText('Dark forces are stirring in the north')).toBeInTheDocument();

      const searchInput = screen.getByTestId('plot-search');
      await user.type(searchInput, 'prophecy');

      expect(screen.getByText('Ancient prophecy speaks of a chosen one')).toBeInTheDocument();
      expect(screen.queryByText('Dark forces are stirring in the north')).not.toBeInTheDocument();
    });

    it('should highlight search matches', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('character-search')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('character-search');
      await user.type(searchInput, 'Aiden');

      const highlightedText = screen.getByTestId('character-name-hero-1');
      expect(highlightedText).toHaveClass('bg-yellow-200');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support Ctrl+R to refresh context', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      await user.keyboard('{Control>}r{/Control}');

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should support Ctrl+G to focus on generation prompt', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      });

      await user.keyboard('{Control>}g{/Control}');

      const promptInput = screen.getByTestId('context-prompt-input');
      expect(promptInput).toHaveFocus();
    });

    it('should support Enter to generate when prompt is focused', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-prompt-input')).toBeInTheDocument();
      });

      const promptInput = screen.getByTestId('context-prompt-input');
      await user.click(promptInput);
      await user.type(promptInput, 'Test prompt');
      await user.keyboard('{Enter}');

      expect(fetch).toHaveBeenCalledWith('/api/books/scene-1/generate', expect.any(Object));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('ai-context-panel')).toBeInTheDocument();
      });

      const panel = screen.getByTestId('ai-context-panel');
      expect(panel).toHaveAttribute('aria-label', 'AI context and generation panel');

      const hierarchySection = screen.getByTestId('context-hierarchy');
      expect(hierarchySection).toHaveAttribute('role', 'region');
      expect(hierarchySection).toHaveAttribute('aria-labelledby', 'hierarchy-heading');
    });

    it('should support keyboard navigation between sections', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-hierarchy')).toBeInTheDocument();
      });

      const hierarchyButton = screen.getByTestId('collapse-hierarchy');
      const charactersButton = screen.getByTestId('collapse-characters');

      hierarchyButton.focus();
      await user.keyboard('{Tab}');

      expect(charactersButton).toHaveFocus();
    });

    it('should announce generation status to screen readers', async () => {
      const user = userEvent.setup();
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');

      const promptInput = screen.getByTestId('context-prompt-input');
      const generateButton = screen.getByTestId('generate-button');

      await user.type(promptInput, 'Test');
      await user.click(generateButton);

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent('Generating AI content...');
      });
    });

    it('should have descriptive button labels', async () => {
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-context')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTestId('refresh-context');
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh context data');

      const generateButton = screen.getByTestId('generate-button');
      expect(generateButton).toHaveAttribute('aria-label', 'Generate AI content with current context');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <AIContextPanel {...props} />;
      };

      const { rerender } = render(<TestWrapper sceneId="scene-1" />);
      rerender(<TestWrapper sceneId="scene-1" />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize context processing', async () => {
      const processSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { rerender } = render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      rerender(<AIContextPanel sceneId="scene-1" />);

      // Context processing should not run again for same data
      expect(processSpy).toHaveBeenCalledTimes(0);

      processSpy.mockRestore();
    });

    it('should handle large context data efficiently', async () => {
      const largeContext = {
        ...mockContextData,
        characterProfiles: Array.from({ length: 100 }, (_, i) => ({
          id: `character-${i}`,
          name: `Character ${i}`,
          role: 'minor',
          description: `Description for character ${i}`,
          traits: ['trait1', 'trait2'],
          motivations: ['motivation1'],
          relationships: []
        }))
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ context: largeContext })
      });

      const startTime = performance.now();
      
      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);
    });
  });

  describe('Error Recovery', () => {
    it('should retry context loading on failure', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ context: mockContextData })
        });

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('context-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial context data gracefully', async () => {
      const partialContext = {
        bookId: 'book-1',
        bookTitle: 'My Novel',
        // Missing other fields
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ context: partialContext })
      });

      render(<AIContextPanel sceneId="scene-1" />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      // Should not crash and should show available data
      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.queryByTestId('context-error')).not.toBeInTheDocument();
    });
  });
});