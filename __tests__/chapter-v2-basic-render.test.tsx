import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest, describe, it, expect } from '@jest/globals';

// Import the components to test basic rendering
import ChapterWriteLayout from '@/components/chapter/chapter-write-layout';
import ChapterChatPanel from '@/components/chapter/chapter-chat-panel';
import ChapterViewerPanel from '@/components/chapter/chapter-viewer-panel';
import ChapterPromptInput from '@/components/chapter/chapter-prompt-input';
import ChapterContentDisplay from '@/components/chapter/chapter-content-display';
import ChapterEditor from '@/components/chapter/chapter-editor';
import ChapterContextDisplay from '@/components/chapter/chapter-context-display';

// Mock the hooks to return stable values
jest.mock('@/hooks/use-chapter-generation', () => ({
  useChapterGeneration: () => ({
    isGenerating: false,
    content: 'Test chapter content',
    error: null,
    generationHistory: [],
    generate: jest.fn(),
    regenerate: jest.fn(),
    cancel: jest.fn(),
    clear: jest.fn(),
    getContext: jest.fn(),
    saveContent: jest.fn()
  })
}));

jest.mock('@/hooks/use-chapter-editor', () => ({
  useChapterEditor: () => ({
    content: 'Test chapter content',
    isEditing: false,
    isDirty: false,
    isSaving: false,
    lastSaved: new Date('2024-01-01T12:00:00Z'),
    wordCount: 3,
    setContent: jest.fn(),
    startEditing: jest.fn(),
    stopEditing: jest.fn(),
    save: jest.fn(),
    revert: jest.fn(),
    exportMarkdown: jest.fn(),
    exportHTML: jest.fn(),
    exportDocx: jest.fn()
  })
}));

describe('Chapter V2 - Basic Component Rendering', () => {
  const defaultProps = {
    storyId: 'test-story-id',
    chapterNumber: 1
  };

  it('should render ChapterPromptInput without errors', () => {
    const onSubmit = jest.fn();
    
    expect(() => {
      render(
        <ChapterPromptInput 
          onSubmit={onSubmit}
          disabled={false}
          placeholder="Test prompt"
        />
      );
    }).not.toThrow();
    
    expect(screen.getByTestId('chapter-prompt-input')).toBeInTheDocument();
  });

  it('should render ChapterContentDisplay without errors', () => {
    const onChange = jest.fn();
    
    expect(() => {
      render(
        <ChapterContentDisplay 
          content="Test content"
          isEditing={false}
          onContentChange={onChange}
          wordCount={2}
        />
      );
    }).not.toThrow();
  });

  it('should render ChapterEditor without errors', () => {
    const onChange = jest.fn();
    
    expect(() => {
      render(
        <ChapterEditor 
          content="Test content"
          onChange={onChange}
        />
      );
    }).not.toThrow();
    
    expect(screen.getByTestId('chapter-editor')).toBeInTheDocument();
  });

  it('should render ChapterContextDisplay without errors', () => {
    expect(() => {
      render(
        <ChapterContextDisplay 
          storyTitle="Test Story"
          storyDescription="Test Description"
        />
      );
    }).not.toThrow();
  });

  it('should render ChapterChatPanel without errors', () => {
    const onGenerate = jest.fn();
    
    expect(() => {
      render(
        <ChapterChatPanel 
          {...defaultProps}
          onGenerate={onGenerate}
          isGenerating={false}
          generationHistory={[]}
          error={null}
        />
      );
    }).not.toThrow();
    
    expect(screen.getByTestId('chapter-prompt-input')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-context-display')).toBeInTheDocument();
  });

  it('should render ChapterViewerPanel without errors', () => {
    const onSave = jest.fn();
    const onEdit = jest.fn();
    
    expect(() => {
      render(
        <ChapterViewerPanel 
          {...defaultProps}
          content="Test chapter content"
          onSave={onSave}
          onEdit={onEdit}
          isSaving={false}
          isEditing={false}
          lastSaved={new Date()}
          wordCount={3}
        />
      );
    }).not.toThrow();
  });

  it('should render ChapterWriteLayout without errors', () => {
    expect(() => {
      render(<ChapterWriteLayout {...defaultProps} />);
    }).not.toThrow();
    
    // Should render both main panels
    expect(screen.getByTestId('chapter-chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('chapter-viewer-panel')).toBeInTheDocument();
  });

  it('should display proper status messages in ChapterWriteLayout', () => {
    render(<ChapterWriteLayout {...defaultProps} />);
    
    // Should show word count and status
    expect(screen.getByText('3 words')).toBeInTheDocument();
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
  });
});