"use client";

import React, { createContext, useContext, useState } from 'react';

interface YamlData {
  storyYaml?: string;
  charactersYaml?: string;
  placesYaml?: string;
  partsYaml?: string;
  chaptersYaml?: string;
  scenesYaml?: string;
}

interface StoryCreationContextType {
  yamlData: YamlData;
  setYamlData: (data: YamlData) => void;
  updateYamlData: (key: keyof YamlData, value: string) => void;
  clearYamlData: () => void;
}

const StoryCreationContext = createContext<StoryCreationContextType | undefined>(undefined);

export function StoryCreationProvider({ children }: { children: React.ReactNode }) {
  const [yamlData, setYamlData] = useState<YamlData>({});

  const updateYamlData = (key: keyof YamlData, value: string) => {
    setYamlData(prev => ({ ...prev, [key]: value }));
  };

  const clearYamlData = () => {
    setYamlData({});
  };

  return (
    <StoryCreationContext.Provider value={{
      yamlData,
      setYamlData,
      updateYamlData,
      clearYamlData
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