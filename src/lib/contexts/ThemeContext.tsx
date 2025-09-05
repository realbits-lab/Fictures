"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright default theme',
    preview: {
      primary: 'rgb(59 130 246)',
      secondary: 'rgb(244 244 245)',
      background: 'rgb(255 255 255)',
      foreground: 'rgb(39 39 42)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme for low-light writing',
    preview: {
      primary: 'rgb(59 130 246)',
      secondary: 'rgb(39 39 42)',
      background: 'rgb(9 9 11)',
      foreground: 'rgb(244 244 245)',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calming blue tones inspired by the sea',
    preview: {
      primary: 'rgb(59 130 246)',
      secondary: 'rgb(219 234 254)',
      background: 'rgb(248 250 252)',
      foreground: 'rgb(30 58 138)',
    },
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    description: 'Creative purple theme for imaginative writing',
    preview: {
      primary: 'rgb(147 51 234)',
      secondary: 'rgb(233 213 255)',
      background: 'rgb(250 245 255)',
      foreground: 'rgb(88 28 135)',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Nature-inspired green theme for focused writing',
    preview: {
      primary: 'rgb(34 197 94)',
      secondary: 'rgb(220 252 231)',
      background: 'rgb(247 254 231)',
      foreground: 'rgb(21 128 61)',
    },
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Warm orange tones for cozy writing sessions',
    preview: {
      primary: 'rgb(234 88 12)',
      secondary: 'rgb(254 215 170)',
      background: 'rgb(255 247 237)',
      foreground: 'rgb(154 52 18)',
    },
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Elegant pink theme for romantic writing',
    preview: {
      primary: 'rgb(244 63 94)',
      secondary: 'rgb(254 205 211)',
      background: 'rgb(255 241 242)',
      foreground: 'rgb(159 18 57)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep dark theme for night owls',
    preview: {
      primary: 'rgb(168 85 247)',
      secondary: 'rgb(30 41 59)',
      background: 'rgb(15 23 42)',
      foreground: 'rgb(241 245 249)',
    },
  },
  {
    id: 'auto',
    name: 'System Auto',
    description: 'Automatically matches your system preference',
    preview: {
      primary: 'rgb(59 130 246)',
      secondary: 'rgb(244 244 245)',
      background: 'rgb(255 255 255)',
      foreground: 'rgb(39 39 42)',
    },
  },
];

interface ThemeContextValue {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentThemeId, setCurrentThemeId] = useState<string>('light');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentThemeId(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const html = document.documentElement;
    
    if (themeId === 'auto') {
      html.removeAttribute('data-theme');
    } else if (themeId === 'light') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', themeId);
    }
  };

  const setTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    if (isClient) {
      localStorage.setItem('theme', themeId);
      applyTheme(themeId);
    }
  };

  const currentTheme = themes.find(theme => theme.id === currentThemeId) || themes[0];

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}