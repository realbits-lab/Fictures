/**
 * DEBUG TEST - Check if chapter components import and render
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest, describe, it, expect } from '@jest/globals';

describe('Chapter Component Debug', () => {
  it('should import ChapterWriteLayout successfully', async () => {
    const ChapterWriteLayout = await import('@/components/chapter/chapter-write-layout');
    expect(ChapterWriteLayout).toBeDefined();
    expect(ChapterWriteLayout.default).toBeDefined();
  });

  it('should render a simple div without hooks', () => {
    function SimpleComponent() {
      return (
        <div data-testid="simple-test">
          <h1>Chapter 1</h1>
          <div role="region" aria-label="chapter writing prompt">Chat Panel</div>
          <div role="region" aria-label="chapter content viewer">Viewer Panel</div>
        </div>
      );
    }

    const result = render(<SimpleComponent />);
    
    console.log('Container HTML:', result.container.innerHTML);
    console.log('Document body HTML:', document.body.innerHTML);
    
    expect(screen.getByTestId('simple-test')).toBeInTheDocument();
  });
});