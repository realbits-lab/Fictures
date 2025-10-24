"use client";

import React, { createContext, useContext, useState } from 'react';

interface JsonData {
  storyJson?: string;
  charactersJson?: string;
  placesJson?: string;
  partsJson?: string;
  chaptersJson?: string;
  scenesJson?: string;
}

interface StoryCreationContextType {
  jsonData: JsonData;
  setJsonData: (data: JsonData) => void;
  updateJsonData: (key: keyof JsonData, value: string) => void;
  clearJsonData: () => void;
}

const StoryCreationContext = createContext<StoryCreationContextType | undefined>(undefined);

export function StoryCreationProvider({ children }: { children: React.ReactNode }) {
  const [jsonData, setJsonData] = useState<JsonData>({});

  const updateJsonData = (key: keyof JsonData, value: string) => {
    setJsonData(prev => ({ ...prev, [key]: value }));
  };

  const clearJsonData = () => {
    setJsonData({});
  };

  return (
    <StoryCreationContext.Provider value={{
      jsonData,
      setJsonData,
      updateJsonData,
      clearJsonData
    }}>
      {children}
    </StoryCreationContext.Provider>
  );
}

export function useStoryCreation() {
  const context = useContext(StoryCreationContext);
  if (context === undefined) {
    throw new Error('useStoryCreation must be used within a StoryCreationProvider');
  }
  return context;
}