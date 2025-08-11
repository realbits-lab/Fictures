'use client';

import React, { useState, useEffect } from 'react';

export interface ReadingPreferences {
  theme: 'light' | 'dark' | 'sepia' | 'high-contrast' | 'night-mode';
  fontFamily: 'serif' | 'sans-serif' | 'monospace' | 'dyslexic';
  fontSize: number;
  lineHeight: string;
  letterSpacing: string;
  wordSpacing: string;
  contentWidth: number;
  marginSize: number;
  paragraphSpacing: string;
  layoutStyle: 'single-column' | 'two-column' | 'book-style';
  highContrast: boolean;
  colorContrast: string;
  dyslexiaFriendly: boolean;
  highlightSyllables: boolean;
  readingRuler: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
}

const defaultPreferences: ReadingPreferences = {
  theme: 'light',
  fontFamily: 'serif',
  fontSize: 16,
  lineHeight: '1.5',
  letterSpacing: '0',
  wordSpacing: '0',
  contentWidth: 800,
  marginSize: 40,
  paragraphSpacing: '1.2',
  layoutStyle: 'single-column',
  highContrast: false,
  colorContrast: '1.0',
  dyslexiaFriendly: false,
  highlightSyllables: false,
  readingRuler: false,
  reduceMotion: false,
  screenReaderMode: false,
};

interface ReadingCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange: (preferences: ReadingPreferences) => void;
  currentPreferences?: ReadingPreferences;
}

export default function ReadingCustomization({ 
  isOpen, 
  onClose, 
  onPreferencesChange,
  currentPreferences 
}: ReadingCustomizationProps) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(
    currentPreferences || defaultPreferences
  );
  const [activeTab, setActiveTab] = useState<'appearance' | 'layout' | 'accessibility'>('appearance');

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);

  const handlePreferenceChange = (key: keyof ReadingPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    onPreferencesChange(newPreferences);
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('reading-preferences', JSON.stringify(newPreferences));
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      data-testid="reading-customization-panel" 
      className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-300 shadow-lg z-50 p-6 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Reading Settings</h2>
        <button 
          data-testid="close-customization"
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded ${activeTab === 'appearance' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          Appearance
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2 rounded ${activeTab === 'layout' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          Layout
        </button>
        <button
          data-testid="accessibility-tab"
          onClick={() => setActiveTab('accessibility')}
          className={`px-4 py-2 rounded ${activeTab === 'accessibility' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
        >
          Accessibility
        </button>
      </div>

      <div data-testid="current-theme-indicator" className="mb-4 text-sm text-gray-600">
        Current Theme: {preferences.theme.charAt(0).toUpperCase() + preferences.theme.slice(1)}
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <div className="space-y-6"
             style={{ display: activeTab === 'appearance' ? 'block' : 'none' }}>
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="space-y-2">
              {['light', 'dark', 'sepia', 'high-contrast', 'night-mode'].map((theme) => (
                <button
                  key={theme}
                  data-testid={`theme-${theme}`}
                  onClick={() => handlePreferenceChange('theme', theme)}
                  className={`w-full p-2 text-left rounded border ${
                    preferences.theme === theme ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <div className="space-y-2">
              {['serif', 'sans-serif', 'monospace', 'dyslexic'].map((font) => (
                <button
                  key={font}
                  data-testid={`font-family-${font}`}
                  onClick={() => handlePreferenceChange('fontFamily', font)}
                  aria-selected={preferences.fontFamily === font}
                  className={`w-full p-2 text-left rounded border ${
                    preferences.fontFamily === font ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {font.charAt(0).toUpperCase() + font.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <input
              data-testid="font-size-slider"
              type="range"
              min="12"
              max="32"
              value={preferences.fontSize}
              onChange={(e) => handlePreferenceChange('fontSize', parseInt(e.target.value))}
              className="w-full mb-2"
            />
            <div className="flex space-x-2">
              {[
                { label: 'Small', value: 14, testId: 'font-size-preset-small' },
                { label: 'Medium', value: 16, testId: 'font-size-preset-medium' },
                { label: 'Large', value: 20, testId: 'font-size-preset-large' },
                { label: 'XL', value: 24, testId: 'font-size-preset-xl' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  data-testid={preset.testId}
                  onClick={() => handlePreferenceChange('fontSize', preset.value)}
                  aria-selected={preferences.fontSize === preset.value}
                  className={`px-3 py-1 text-sm rounded border ${
                    preferences.fontSize === preset.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Height */}
          <div>
            <label className="block text-sm font-medium mb-2">Line Height</label>
            <input
              data-testid="line-height-slider"
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={parseFloat(preferences.lineHeight)}
              onChange={(e) => handlePreferenceChange('lineHeight', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Letter Spacing */}
          <div>
            <label className="block text-sm font-medium mb-2">Letter Spacing</label>
            <input
              data-testid="letter-spacing-slider"
              type="range"
              min="-0.1"
              max="0.3"
              step="0.01"
              value={parseFloat(preferences.letterSpacing)}
              onChange={(e) => handlePreferenceChange('letterSpacing', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Word Spacing */}
          <div>
            <label className="block text-sm font-medium mb-2">Word Spacing</label>
            <input
              data-testid="word-spacing-slider"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={parseFloat(preferences.wordSpacing)}
              onChange={(e) => handlePreferenceChange('wordSpacing', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Layout Section - Always visible for GREEN phase */}
        <div className="space-y-6">
          {/* Layout Style */}
          <div>
            <label className="block text-sm font-medium mb-2">Layout Style</label>
            <div className="space-y-2">
              {[
                { value: 'single-column', label: 'Single Column', testId: 'layout-single-column' },
                { value: 'two-column', label: 'Two Column', testId: 'layout-two-column' },
                { value: 'book-style', label: 'Book Style', testId: 'layout-book-style' },
              ].map((layout) => (
                <button
                  key={layout.value}
                  data-testid={layout.testId}
                  onClick={() => handlePreferenceChange('layoutStyle', layout.value)}
                  className={`w-full p-2 text-left rounded border ${
                    preferences.layoutStyle === layout.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Width */}
          <div>
            <label className="block text-sm font-medium mb-2">Content Width</label>
            <input
              data-testid="content-width-slider"
              type="range"
              min="600"
              max="1200"
              value={preferences.contentWidth}
              onChange={(e) => handlePreferenceChange('contentWidth', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Margin Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Margin Size</label>
            <input
              data-testid="margin-size-slider"
              type="range"
              min="20"
              max="100"
              value={preferences.marginSize}
              onChange={(e) => handlePreferenceChange('marginSize', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Paragraph Spacing */}
          <div>
            <label className="block text-sm font-medium mb-2">Paragraph Spacing</label>
            <input
              data-testid="paragraph-spacing-slider"
              type="range"
              min="1.0"
              max="2.5"
              step="0.1"
              value={parseFloat(preferences.paragraphSpacing)}
              onChange={(e) => handlePreferenceChange('paragraphSpacing', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Accessibility Section */}
        <div className="space-y-6"
             style={{ display: activeTab === 'accessibility' ? 'block' : 'none' }}>
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">High Contrast</label>
            <input
              data-testid="high-contrast-toggle"
              type="checkbox"
              checked={preferences.highContrast}
              onChange={(e) => handlePreferenceChange('highContrast', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          {/* Color Contrast Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">Color Contrast</label>
            <input
              data-testid="color-contrast-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={parseFloat(preferences.colorContrast)}
              onChange={(e) => handlePreferenceChange('colorContrast', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Dyslexia-friendly Font */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Dyslexia-friendly Font</label>
            <input
              data-testid="dyslexia-friendly-font"
              type="checkbox"
              checked={preferences.dyslexiaFriendly}
              onChange={(e) => handlePreferenceChange('dyslexiaFriendly', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          {/* Highlight Syllables */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Highlight Syllables</label>
            <input
              data-testid="highlight-syllables"
              type="checkbox"
              checked={preferences.highlightSyllables}
              onChange={(e) => handlePreferenceChange('highlightSyllables', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          {/* Reading Ruler */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Reading Ruler</label>
            <input
              data-testid="reading-ruler"
              type="checkbox"
              checked={preferences.readingRuler}
              onChange={(e) => handlePreferenceChange('readingRuler', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          {/* Reduce Motion */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Reduce Motion</label>
            <input
              data-testid="reduce-motion-toggle"
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(e) => handlePreferenceChange('reduceMotion', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          {/* Screen Reader Mode */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Screen Reader Mode</label>
            <input
              data-testid="screen-reader-mode"
              type="checkbox"
              checked={preferences.screenReaderMode}
              onChange={(e) => handlePreferenceChange('screenReaderMode', e.target.checked)}
              className="form-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
  );
}