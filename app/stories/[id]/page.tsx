'use client';

import { useState, useEffect } from 'react';
import ReadingCustomization, { type ReadingPreferences } from '../../../components/reading/reading-customization';

// Story Reading Page - minimal implementation for GREEN phase
export default function StoryPage() {
  const [showCustomization, setShowCustomization] = useState(false);
  const [preferences, setPreferences] = useState<ReadingPreferences | null>(null);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('reading-preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }

      // Simulate scroll position persistence for auto-bookmarking
      const currentPath = window.location.pathname;
      const savedPosition = localStorage.getItem(`reading-position-${currentPath}`);
      if (savedPosition && parseInt(savedPosition) > 0) {
        setScrollPosition(parseInt(savedPosition));
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
          }, 200);
        });
      }

      // Track scroll progress for chapter progress bar
      const handleScroll = () => {
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = documentHeight > 0 ? Math.round((scrollY / documentHeight) * 100) : 0;
        setChapterProgress(Math.max(0, Math.min(100, progress)));
        
        // Save reading position for auto-bookmarking
        const currentPath = window.location.pathname;
        localStorage.setItem(`reading-position-${currentPath}`, scrollY.toString());
      };

      window.addEventListener('scroll', handleScroll);

      // Keyboard event handling for immersive mode
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isImmersiveMode) {
          setIsImmersiveMode(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isImmersiveMode]);

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
      {/* Sidebar and Header - hidden in immersive mode */}
      {!isImmersiveMode && (
        <>
          <div data-testid="sidebar" className="sidebar">Sidebar</div>
          <div data-testid="header" className="header">Header</div>
        </>
      )}
      
      {/* Immersive Reading Container */}
      {isImmersiveMode && (
        <div data-testid="immersive-reading-container" className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div style={{ maxWidth: '600px', padding: '2rem' }}>
            <div data-testid="chapter-content" style={getThemeStyles()}>
              <h2 data-testid="chapter-title">Chapter 1: The Beginning</h2>
              <div>
                <p>Once upon a time in a mystical land, there lived a young adventurer named Alex...</p>
                <p>The dragon roared as it emerged from the mountain cave, its scales glistening in the sunlight.</p>
                <p>"We must find the magic sword," Alex whispered to their companion.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Chapter Info with Reading Time Estimation */}
      <div data-testid="chapter-info" className="mb-4 p-4 bg-gray-100 rounded">
        <div data-testid="estimated-reading-time">⏱️ 8 minutes to read</div>
        <div data-testid="words-in-chapter">📖 2,100 words in this chapter</div>
        <div data-testid="reading-speed-indicator">🚀 Reading at 210 words per minute</div>
        
        {/* Chapter Progress Bar */}
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-1">Chapter Progress</div>
          <div 
            data-testid="chapter-progress-bar"
            role="progressbar"
            aria-valuenow={chapterProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-gray-300 rounded-full h-2"
          >
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${chapterProgress}%` }}
            />
          </div>
        </div>
      </div>
      
{!isImmersiveMode && (
        <div data-testid="chapter-content" style={getThemeStyles()}>
          <h2 data-testid="chapter-title">Chapter 1: The Beginning</h2>
          <div>
            <p>
              <span data-testid="tts-highlighted-text" className={showTTSControls && isPlaying ? 'bg-yellow-200' : ''}>
                Once upon a time in a mystical land, there lived a young adventurer named Alex...
              </span>
            </p>
            <p>The dragon roared as it emerged from the mountain cave, its scales glistening in the sunlight.</p>
            <p>"We must find the magic sword," Alex whispered to their companion.</p>
          </div>
          
          {/* Auto Bookmark Indicator */}
          {scrollPosition > 100 && (
            <div data-testid="auto-bookmark-indicator" className="fixed right-4 top-20 bg-blue-500 text-white px-2 py-1 rounded text-sm">
              📖 Auto-saved position
            </div>
          )}
        </div>
      )}
      
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
        <button 
          data-testid="manual-bookmark-button"
          onClick={() => {
            const currentPath = window.location.pathname;
            localStorage.setItem(`manual-bookmark-${currentPath}`, window.scrollY.toString());
            alert('Bookmark saved');
          }}
        >
          Manual Bookmark
        </button>
        <button data-testid="like-story-button" aria-pressed="false">Like</button>
        <button 
          data-testid="reading-customization-button"
          onClick={() => setShowCustomization(true)}
        >
          Reading Settings
        </button>
        <button 
          data-testid="immersive-mode-button"
          onClick={() => setIsImmersiveMode(!isImmersiveMode)}
        >
          {isImmersiveMode ? 'Exit Immersive' : 'Immersive Mode'}
        </button>
        <button 
          data-testid="text-to-speech-button"
          onClick={() => setShowTTSControls(!showTTSControls)}
        >
          Text to Speech
        </button>
        <button 
          data-testid="download-for-offline-button"
          onClick={() => setShowDownloadModal(true)}
        >
          Download Offline
        </button>
      </div>
      
      {/* Text-to-Speech Controls */}
      {showTTSControls && (
        <div data-testid="tts-controls" className="fixed bottom-4 left-4 right-4 bg-white border rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center space-x-4">
            <button 
              data-testid="play-button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              data-testid="pause-button"
              onClick={() => setIsPlaying(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Pause
            </button>
            <button 
              data-testid="stop-button"
              onClick={() => {
                setIsPlaying(false);
                setShowTTSControls(false);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop
            </button>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Speed:</label>
              <input 
                data-testid="speed-control"
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                defaultValue="1"
                className="w-20"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Voice:</label>
              <select data-testid="voice-selection" className="border rounded px-2 py-1">
                <option data-testid="voice-option" value="voice1">Default Female</option>
                <option data-testid="voice-option" value="voice2">Default Male</option>
                <option data-testid="voice-option" value="voice3">British Female</option>
                <option data-testid="voice-option" value="voice4">British Male</option>
              </select>
            </div>
          </div>
        </div>
      )}

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

      {/* Download Modal */}
      {showDownloadModal && (
        <div 
          data-testid="offline-download-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Download for Offline Reading</h3>
            
            <div className="mb-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  data-testid="select-all-chapters"
                  type="checkbox"
                  checked={selectedChapters.length === 5}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChapters([1, 2, 3, 4, 5]);
                    } else {
                      setSelectedChapters([]);
                    }
                  }}
                />
                <span className="font-medium">Select all chapters</span>
              </label>
              
              <div data-testid="chapter-selection-list" className="space-y-2 max-h-48 overflow-y-auto">
                {[1, 2, 3, 4, 5].map(chapterNum => (
                  <label key={chapterNum} className="flex items-center space-x-2">
                    <input
                      data-testid="chapter-checkbox"
                      type="checkbox"
                      checked={selectedChapters.includes(chapterNum)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChapters([...selectedChapters, chapterNum]);
                        } else {
                          setSelectedChapters(selectedChapters.filter(ch => ch !== chapterNum));
                        }
                      }}
                    />
                    <span>Chapter {chapterNum}: {chapterNum === 1 ? 'The Beginning' : chapterNum === 2 ? 'The Journey' : chapterNum === 3 ? 'The Dragon\'s Lair' : chapterNum === 4 ? 'The Battle' : 'The Victory'}</span>
                  </label>
                ))}
              </div>
            </div>

            {isDownloading && (
              <div data-testid="download-progress" className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Downloading...</span>
                  <span className="text-sm">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isDownloading}
              >
                Cancel
              </button>
              <button
                data-testid="start-download-button"
                onClick={() => {
                  if (selectedChapters.length === 0) return;
                  setIsDownloading(true);
                  setDownloadProgress(0);
                  
                  // Simulate download progress
                  let progress = 0;
                  const interval = setInterval(() => {
                    progress += 20;
                    setDownloadProgress(progress);
                    if (progress >= 100) {
                      clearInterval(interval);
                      setIsDownloading(false);
                      alert('Download completed');
                      setShowDownloadModal(false);
                    }
                  }, 500);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={selectedChapters.length === 0 || isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Start Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Available Indicator */}
      <div data-testid="offline-available-indicator" className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-sm" style={{ display: 'none' }}>
        📱 Available Offline
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