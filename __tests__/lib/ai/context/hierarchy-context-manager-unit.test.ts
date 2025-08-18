import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock the entire hierarchy queries module BEFORE importing our module
jest.mock('@/lib/db/queries/hierarchy', () => ({
  buildHierarchyContext: jest.fn(),
}));

import { 
  generateContextPrompt,
  cacheContext,
  invalidateContextCache,
  HierarchicalContextManager,
  type HierarchicalContext,
  type ContextOptions
} from '@/lib/ai/context/hierarchy-context-manager';

describe('HierarchicalContextManager - Unit Tests', () => {
  const mockHierarchyContext: HierarchicalContext = {
    scene: {
      current: {
        id: 'scene-123',
        chapterId: 'chapter-456',
        sceneNumber: 1,
        title: 'Opening Scene',
        content: 'The protagonist enters the mysterious castle...',
        sceneType: 'exposition',
        pov: 'Third Person',
        location: 'Castle Entrance',
        charactersPresent: ['protagonist', 'guard'],
        mood: 'mysterious',
        purpose: 'Establish setting and introduce main character',
        conflict: 'Protagonist must gain entry to the castle',
        wordCount: 250,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      previous: [
        {
          id: 'scene-prev-1',
          title: 'Journey to Castle',
          content: 'The long journey through the forest...',
          sceneType: 'transition',
          mood: 'tense',
          purpose: 'Build anticipation for castle arrival'
        }
      ],
      next: [
        {
          id: 'scene-next-1',
          title: 'Meeting the Guardian',
          content: 'A mysterious figure approaches...',
          sceneType: 'dialogue',
          mood: 'mysterious',
          purpose: 'Introduce key supporting character'
        }
      ]
    },
    chapter: {
      summary: 'The protagonist arrives at the mysterious castle and encounters its guardians',
      scenes: [
        { id: 'scene-prev-1', title: 'Journey to Castle', sceneType: 'transition' },
        { id: 'scene-123', title: 'Opening Scene', sceneType: 'exposition' },
        { id: 'scene-next-1', title: 'Meeting the Guardian', sceneType: 'dialogue' }
      ],
      pov: 'Third Person',
      setting: 'Ancient Castle in the Misty Mountains',
      progression: 15
    },
    part: {
      description: 'The Quest Begins - Our hero sets out on their journey',
      thematicFocus: 'Courage and self-discovery',
      chapterSummaries: [
        'Protagonist leaves home village',
        'Journey through the dangerous forest',
        'Arrival at the mysterious castle'
      ],
      characterArcs: [
        {
          character: 'protagonist',
          arc: 'From reluctant villager to determined hero',
          currentState: 'Uncertain but determined'
        }
      ]
    },
    story: {
      synopsis: 'A young villager must venture into a mysterious castle to save their homeland from an ancient curse',
      themes: ['courage', 'self-discovery', 'good vs evil', 'coming of age'],
      worldSettings: {
        time: 'Medieval fantasy',
        location: 'Kingdom of Aethermoor',
        magicSystem: 'Ancient runes and elemental magic',
        cultures: ['Mountain folk', 'Forest dwellers', 'Castle inhabitants']
      },
      characterProfiles: [
        {
          name: 'protagonist',
          age: 18,
          background: 'Village blacksmith apprentice',
          personality: 'Brave but inexperienced',
          goals: 'Save the village from the curse',
          relationships: ['mentor: village elder', 'friend: castle guard']
        }
      ],
      plotStructure: {
        act1: 'Setup and inciting incident',
        act2: 'Rising action and complications',
        act3: 'Climax and resolution'
      }
    },
    book: {
      title: 'The Cursed Castle Chronicles',
      genre: 'Epic Fantasy',
      overallProgress: 25,
      wordCount: 15000
    }
  };

  describe('generateContextPrompt', () => {
    test('should generate comprehensive context prompt with all sections', () => {
      const options: ContextOptions = {
        includeCharacterProfiles: true,
        includePlotStructure: true,
        includeWorldSettings: true,
        contextDepth: 'full'
      };

      const prompt = generateContextPrompt(mockHierarchyContext, options);

      expect(prompt).toContain('BOOK CONTEXT');
      expect(prompt).toContain('The Cursed Castle Chronicles');
      expect(prompt).toContain('Epic Fantasy');
      
      expect(prompt).toContain('STORY CONTEXT');
      expect(prompt).toContain('young villager must venture');
      expect(prompt).toContain('courage');
      expect(prompt).toContain('self-discovery');
      
      expect(prompt).toContain('WORLD SETTINGS');
      expect(prompt).toContain('Medieval fantasy');
      expect(prompt).toContain('Kingdom of Aethermoor');
      
      expect(prompt).toContain('CHARACTER PROFILES');
      expect(prompt).toContain('protagonist');
      expect(prompt).toContain('Village blacksmith apprentice');
      
      expect(prompt).toContain('PART CONTEXT');
      expect(prompt).toContain('The Quest Begins');
      expect(prompt).toContain('Courage and self-discovery');
      
      expect(prompt).toContain('CHAPTER CONTEXT');
      expect(prompt).toContain('mysterious castle and encounters');
      expect(prompt).toContain('Third Person');
      
      expect(prompt).toContain('SCENE CONTEXT');
      expect(prompt).toContain('Opening Scene');
      expect(prompt).toContain('mysterious castle');
      expect(prompt).toContain('protagonist');
      
      expect(prompt).toContain('PREVIOUS SCENES');
      expect(prompt).toContain('Journey to Castle');
      
      expect(prompt).toContain('NEXT SCENES');
      expect(prompt).toContain('Meeting the Guardian');
    });

    test('should generate minimal context prompt when options exclude details', () => {
      const options: ContextOptions = {
        includeCharacterProfiles: false,
        includePlotStructure: false,
        includeWorldSettings: false,
        contextDepth: 'minimal'
      };

      const prompt = generateContextPrompt(mockHierarchyContext, options);

      expect(prompt).toContain('BOOK CONTEXT');
      expect(prompt).toContain('SCENE CONTEXT');
      expect(prompt).not.toContain('CHARACTER PROFILES');
      expect(prompt).not.toContain('WORLD SETTINGS');
      expect(prompt).not.toContain('PLOT STRUCTURE');
    });

    test('should format character profiles correctly', () => {
      const options: ContextOptions = {
        includeCharacterProfiles: true,
        contextDepth: 'full'
      };

      const prompt = generateContextPrompt(mockHierarchyContext, options);

      expect(prompt).toContain('CHARACTER PROFILES');
      expect(prompt).toContain('- protagonist:');
      expect(prompt).toContain('Age: 18');
      expect(prompt).toContain('Background: Village blacksmith apprentice');
      expect(prompt).toContain('Goals: Save the village from the curse');
    });

    test('should format world settings correctly', () => {
      const options: ContextOptions = {
        includeWorldSettings: true,
        contextDepth: 'full'
      };

      const prompt = generateContextPrompt(mockHierarchyContext, options);

      expect(prompt).toContain('WORLD SETTINGS');
      expect(prompt).toContain('Time: Medieval fantasy');
      expect(prompt).toContain('Location: Kingdom of Aethermoor');
      expect(prompt).toContain('Magic System: Ancient runes and elemental magic');
    });

    test('should handle missing optional data gracefully', () => {
      const contextWithMissingData: HierarchicalContext = {
        ...mockHierarchyContext,
        story: {
          ...mockHierarchyContext.story,
          characterProfiles: undefined,
          worldSettings: undefined,
        }
      };

      const prompt = generateContextPrompt(contextWithMissingData);

      expect(prompt).toContain('BOOK CONTEXT');
      expect(prompt).toContain('STORY CONTEXT');
      expect(prompt).toContain('SCENE CONTEXT');
      // Should not crash with missing data
    });
  });

  describe('cacheContext', () => {
    test('should cache context with proper expiration', async () => {
      const sceneId = 'test-scene-123';
      const ttl = 3600; // 1 hour

      await expect(cacheContext(sceneId, mockHierarchyContext, ttl)).resolves.not.toThrow();
    });

    test('should handle cache storage failures gracefully', async () => {
      const sceneId = 'invalid-scene';
      
      // Should not throw error even if cache fails
      await expect(cacheContext(sceneId, mockHierarchyContext)).resolves.not.toThrow();
    });
  });

  describe('invalidateContextCache', () => {
    test('should invalidate cache for specific scene', async () => {
      const sceneId = 'test-scene-123';
      
      await expect(invalidateContextCache(sceneId)).resolves.not.toThrow();
    });

    test('should invalidate cache for entire hierarchy when requested', async () => {
      const sceneId = 'test-scene-123';
      
      await expect(invalidateContextCache(sceneId, { invalidateHierarchy: true })).resolves.not.toThrow();
    });
  });

  describe('HierarchicalContextManager class', () => {
    let manager: HierarchicalContextManager;

    beforeEach(() => {
      manager = new HierarchicalContextManager({
        cacheEnabled: true,
        defaultTTL: 3600,
        maxCacheSize: 100
      });
    });

    test('should initialize with default configuration', () => {
      const defaultManager = new HierarchicalContextManager();
      expect(defaultManager).toBeDefined();
    });

    test('should clear all cached contexts', async () => {
      // Should not throw error
      expect(() => manager.clearCache()).not.toThrow();
    });

    test('should handle invalid cache operations gracefully', async () => {
      // Should not throw error
      await expect(manager.invalidateCache('invalid-scene-id')).resolves.not.toThrow();
    });
  });

  describe('prompt formatting edge cases', () => {
    test('should handle empty character profiles', () => {
      const contextWithEmptyProfiles: HierarchicalContext = {
        ...mockHierarchyContext,
        story: {
          ...mockHierarchyContext.story,
          characterProfiles: []
        }
      };

      const prompt = generateContextPrompt(contextWithEmptyProfiles, { includeCharacterProfiles: true });

      expect(prompt).toContain('BOOK CONTEXT');
      expect(prompt).toContain('STORY CONTEXT');
      // Should not include CHARACTER PROFILES section when empty
      expect(prompt).not.toContain('CHARACTER PROFILES');
    });

    test('should handle missing scene content', () => {
      const contextWithMissingContent: HierarchicalContext = {
        ...mockHierarchyContext,
        scene: {
          ...mockHierarchyContext.scene,
          current: {
            ...mockHierarchyContext.scene.current,
            content: undefined as any
          }
        }
      };

      const prompt = generateContextPrompt(contextWithMissingContent);

      expect(prompt).toContain('SCENE CONTEXT');
      expect(prompt).toContain('Current Scene:');
      // Should handle missing content gracefully
    });

    test('should handle undefined previous and next scenes', () => {
      const contextWithNoAdjacentScenes: HierarchicalContext = {
        ...mockHierarchyContext,
        scene: {
          ...mockHierarchyContext.scene,
          previous: undefined as any,
          next: undefined as any
        }
      };

      const prompt = generateContextPrompt(contextWithNoAdjacentScenes);

      expect(prompt).toContain('SCENE CONTEXT');
      expect(prompt).not.toContain('PREVIOUS SCENES');
      expect(prompt).not.toContain('NEXT SCENES');
    });
  });

  describe('context options validation', () => {
    test('should use default options when none provided', () => {
      const prompt = generateContextPrompt(mockHierarchyContext);

      expect(prompt).toContain('BOOK CONTEXT');
      expect(prompt).toContain('CHARACTER PROFILES');
      expect(prompt).toContain('WORLD SETTINGS');
    });

    test('should respect individual option flags', () => {
      const optionsWithoutProfiles: ContextOptions = {
        includeCharacterProfiles: false,
        includeWorldSettings: true,
        includePlotStructure: true
      };

      const prompt = generateContextPrompt(mockHierarchyContext, optionsWithoutProfiles);

      expect(prompt).not.toContain('CHARACTER PROFILES');
      expect(prompt).toContain('WORLD SETTINGS');
      expect(prompt).toContain('PLOT STRUCTURE');
    });
  });
});