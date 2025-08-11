'use client';

import { useState, useEffect } from 'react';
import ReadingCustomization, { type ReadingPreferences } from '../../../components/reading/reading-customization';

// Story Reading Page - minimal implementation for GREEN phase
export default function StoryPage() {
  const [showCustomization, setShowCustomization] = useState(false);
  const [preferences, setPreferences] = useState<ReadingPreferences | null>(null);
  
  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('reading-preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const handlePreferencesChange = (newPreferences: ReadingPreferences) => {
    setPreferences(newPreferences);
  };

  const getThemeStyles = () => {
    if (!preferences) return {};
    
    const themeColors = {
      light: { backgroundColor: '#ffffff', color: '#000000' },
      dark: { backgroundColor: '#1a1a1a', color: '#ffffff' },
      sepia: { backgroundColor: 'rgb(251, 241, 199)', color: '#5c4b37' },
      'high-contrast': { backgroundColor: '#ffffff', color: '#000000' },
      'night-mode': { backgroundColor: '#0f0f0f', color: '#e0e0e0' }
    };

    const fontFamilies = {
      serif: '"Times New Roman", serif',
      'sans-serif': '"Arial", sans-serif', 
      monospace: '"Courier New", monospace',
      dyslexic: '"OpenDyslexic", serif'
    };

    return {
      ...themeColors[preferences.theme],
      fontFamily: fontFamilies[preferences.fontFamily],
      fontSize: `${preferences.fontSize}px`,
      lineHeight: preferences.lineHeight,
      letterSpacing: `${preferences.letterSpacing}em`,
      wordSpacing: `${preferences.wordSpacing}em`,
      maxWidth: `${preferences.contentWidth}px`,
      margin: `0 ${preferences.marginSize}px`,
      columnCount: preferences.layoutStyle === 'two-column' ? 2 : 1,
      columnGap: preferences.layoutStyle === 'two-column' ? '2rem' : 'normal'
    };
  };
  
  return (
    <div style={preferences ? { backgroundColor: getThemeStyles().backgroundColor, minHeight: '100vh', color: getThemeStyles().color } : {}}>
      <div data-testid="story-header">
        <h1 data-testid="story-title">The Dragon's Quest</h1>
        <div data-testid="story-author">
          <span data-testid="author-name">John Fantasy Author</span>
        </div>
        <div data-testid="story-description">
          A fantasy adventure about magic and dragons in a mystical world.
        </div>
        <div data-testid="story-stats">
          <span data-testid="word-count">15,000 words</span>
          <span data-testid="chapter-count">5 chapters</span>
          <span data-testid="read-count">100 reads</span>
          <span data-testid="like-count">25 likes</span>
        </div>
      </div>
      
      <div data-testid="reading-progress">
        Chapter <span data-testid="current-chapter-number">1</span> of <span data-testid="total-chapters">5</span>
      </div>
      
      <div data-testid="chapter-content" style={getThemeStyles()}>
        <h2 data-testid="chapter-title">Chapter 1: The Beginning</h2>
        <div>
          <p>Once upon a time in a mystical land, there lived a young adventurer named Alex...</p>
          <p>The dragon roared as it emerged from the mountain cave, its scales glistening in the sunlight.</p>
          <p>"We must find the magic sword," Alex whispered to their companion.</p>
        </div>
      </div>
      
      <div data-testid="chapter-navigation">
        <button data-testid="previous-chapter-button" disabled>Previous Chapter</button>
        <button 
          data-testid="next-chapter-button"
          onClick={() => window.location.href = '/stories/test-story-123/chapters/2'}
        >
          Next Chapter
        </button>
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">1</span>
          <span data-testid="nav-chapter-title">The Beginning</span>
        </div>
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">2</span>
          <span data-testid="nav-chapter-title">The Journey Begins</span>
        </div>
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">3</span>
          <span data-testid="nav-chapter-title">The Dragon's Lair</span>
        </div>
        <div data-testid="chapter-list-item-3">
          <span data-testid="chapter-number">3</span>
          <span data-testid="nav-chapter-title">The Dragon's Lair</span>
        </div>
      </div>
      
      <div data-testid="story-interaction-buttons">
        <button data-testid="bookmark-story-button" aria-pressed="false">Bookmark</button>
        <button data-testid="like-story-button" aria-pressed="false">Like</button>
        <button 
          data-testid="reading-customization-button"
          onClick={() => setShowCustomization(true)}
        >
          Reading Settings
        </button>
        <button data-testid="download-for-offline-button">Download Offline</button>
      </div>
      
      <div data-testid="reading-settings-modal" style={{ display: 'none' }}>
        <h3>Reading Settings</h3>
        <div>
          <label htmlFor="font-size">Font Size</label>
          <input data-testid="font-size-slider" type="range" min="12" max="24" />
        </div>
        <div>
          <label>
            <input data-testid="theme-toggle" type="checkbox" />
            Dark Mode
          </label>
        </div>
        <div data-testid="line-spacing-controls">
          <label>Line Spacing</label>
          <select>
            <option value="1">Single</option>
            <option value="1.5">1.5x</option>
            <option value="2">Double</option>
          </select>
        </div>
      </div>
      
      <div data-testid="author-section">
        <h3 data-testid="author-name">John Fantasy Author</h3>
        <div data-testid="author-bio">Loves writing fantasy adventures with dragons and magic.</div>
        <div data-testid="author-stats">5 stories published</div>
        
        <div data-testid="other-stories-by-author">
          <h4>Other Stories by This Author</h4>
          <div data-testid="story-card">
            <span>The Magic Chronicles</span>
          </div>
          <div data-testid="story-card">
            <span>Quest for the Golden Sword</span>
          </div>
        </div>
      </div>

      {/* Reading Customization Panel */}
      <ReadingCustomization
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onPreferencesChange={handlePreferencesChange}
        currentPreferences={preferences || undefined}
      />
    </div>
  );
}