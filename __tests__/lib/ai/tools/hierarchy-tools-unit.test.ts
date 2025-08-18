import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock AI SDK and dependencies before importing
const mockGenerateObject = jest.fn();
jest.mock('ai', () => ({
  generateObject: mockGenerateObject,
  tool: jest.fn((config) => ({ 
    description: config.description,
    parameters: config.parameters,
    execute: config.execute 
  })),
}));

// Mock the hierarchy context manager
const mockContextManager = {
  getContext: jest.fn(),
  generatePrompt: jest.fn()
};
jest.mock('@/lib/ai/context/hierarchy-context-manager', () => ({
  HierarchicalContextManager: jest.fn(() => mockContextManager),
}));

// Mock database queries
jest.mock('@/lib/db/queries/hierarchy', () => ({
  createScene: jest.fn(),
  updateScene: jest.fn(),
  createChapter: jest.fn(),
  createPart: jest.fn(),
  createStory: jest.fn(),
}));

import { 
  hierarchyTools,
  createSceneWithContext,
  expandPartToChapters,
  generateStoryStructure,
  improveCharacterConsistency,
  generateChapterSummary,
  type SceneGenerationParams,
  type PartExpansionParams,
  type StoryStructureParams,
  type CharacterConsistencyParams,
  type ChapterSummaryParams
} from '@/lib/ai/tools/hierarchy-tools';

describe('AI Tools for Hierarchy - Unit Tests', () => {
  const mockSceneId = 'scene-123';
  const mockChapterId = 'chapter-456';
  const mockPartId = 'part-789';
  const mockStoryId = 'story-abc';
  const mockBookId = 'book-def';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockContextManager.getContext.mockResolvedValue({
      scene: { current: { id: mockSceneId, title: 'Test Scene' } },
      chapter: { summary: 'Test chapter' },
      part: { description: 'Test part' },
      story: { synopsis: 'Test story' },
      book: { title: 'Test book' }
    });
    
    mockContextManager.generatePrompt.mockResolvedValue('Generated context prompt for AI');
  });

  describe('createSceneWithContext', () => {
    test('should create a new scene with full story context', async () => {
      const params: SceneGenerationParams = {
        chapterId: mockChapterId,
        sceneType: 'dialogue',
        prompt: 'Create a scene where the hero meets a mentor',
        includeContext: true,
        characterFocus: ['Hero', 'Mentor'],
        mood: 'mysterious',
        location: 'Ancient Library'
      };

      const expectedSceneContent = {
        title: 'Meeting the Mentor',
        content: 'The hero enters the ancient library where shadows dance between towering bookshelves...',
        sceneType: 'dialogue',
        purpose: 'Introduce mentor character and provide guidance',
        conflict: 'Hero must overcome skepticism about magical abilities',
        mood: 'mysterious',
        charactersPresent: ['Hero', 'Mentor'],
        location: 'Ancient Library'
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedSceneContent
      });

      const result = await createSceneWithContext(params);

      expect(result).toEqual(expectedSceneContent);
      expect(mockContextManager.getContext).toHaveBeenCalled();
      expect(mockContextManager.generatePrompt).toHaveBeenCalled();
      expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Create a scene where the hero meets a mentor'),
        schema: expect.any(Object)
      }));
    });

    test('should create scene without context when includeContext is false', async () => {
      const params: SceneGenerationParams = {
        chapterId: mockChapterId,
        sceneType: 'action',
        prompt: 'Create an action scene',
        includeContext: false
      };

      const expectedSceneContent = {
        title: 'Battle Scene',
        content: 'Swords clash in the moonlight...',
        sceneType: 'action',
        purpose: 'Advance plot through conflict'
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedSceneContent
      });

      const result = await createSceneWithContext(params);

      expect(result).toEqual(expectedSceneContent);
      expect(mockContextManager.getContext).not.toHaveBeenCalled();
      expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Create an action scene')
      }));
    });

    test('should handle different scene types correctly', async () => {
      const sceneTypes = ['action', 'dialogue', 'exposition', 'transition', 'climax'] as const;
      
      for (const sceneType of sceneTypes) {
        const params: SceneGenerationParams = {
          chapterId: mockChapterId,
          sceneType,
          prompt: `Create a ${sceneType} scene`,
          includeContext: false // Skip context to avoid multiple calls
        };

        mockGenerateObject.mockResolvedValue({
          object: {
            title: `${sceneType} Scene`,
            content: `Content for ${sceneType} scene`,
            sceneType,
            purpose: `Purpose for ${sceneType} scene`
          }
        });

        const result = await createSceneWithContext(params);

        expect(result.sceneType).toBe(sceneType);
      }
    });

    test('should validate required parameters', async () => {
      const invalidParams = {
        chapterId: '',
        sceneType: 'dialogue',
        prompt: ''
      } as SceneGenerationParams;

      await expect(createSceneWithContext(invalidParams)).rejects.toThrow('Missing required parameters');
    });

    test('should handle context retrieval failures gracefully', async () => {
      mockContextManager.getContext.mockRejectedValue(new Error('Context failed'));

      const params: SceneGenerationParams = {
        chapterId: mockChapterId,
        sceneType: 'dialogue',
        prompt: 'Create a scene',
        includeContext: true
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          title: 'Test Scene',
          content: 'Test content',
          sceneType: 'dialogue',
          purpose: 'Test purpose'
        }
      });

      // Should not throw error, but proceed without context
      const result = await createSceneWithContext(params);
      expect(result.title).toBe('Test Scene');
    });
  });

  describe('expandPartToChapters', () => {
    test('should expand a part into detailed chapter outlines', async () => {
      const params: PartExpansionParams = {
        partId: mockPartId,
        chapterCount: 3,
        targetWordCount: 15000,
        thematicFocus: 'Character development and world-building',
        includeSceneBreakdown: true
      };

      const expectedChapterOutlines = {
        chapters: [
          {
            chapterNumber: 1,
            title: 'The Journey Begins',
            summary: 'Hero leaves home and enters the wider world',
            scenes: [
              { title: 'Farewell', sceneType: 'emotion', purpose: 'Establish stakes' },
              { title: 'The Road', sceneType: 'transition', purpose: 'Show journey' }
            ],
            wordCountTarget: 5000,
            pov: 'Third Person',
            setting: 'Village and countryside'
          }
        ],
        totalWordCount: 15000,
        thematicProgression: 'From isolation to community'
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedChapterOutlines
      });

      const result = await expandPartToChapters(params);

      expect(result).toEqual(expectedChapterOutlines);
      expect(result.totalWordCount).toBe(15000);
      expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('Character development and world-building')
      }));
    });

    test('should handle different chapter counts', async () => {
      const params: PartExpansionParams = {
        partId: mockPartId,
        chapterCount: 5,
        targetWordCount: 25000
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          chapters: Array(5).fill(0).map((_, i) => ({
            chapterNumber: i + 1,
            title: `Chapter ${i + 1}`,
            summary: `Summary for chapter ${i + 1}`,
            wordCountTarget: 5000
          })),
          totalWordCount: 25000,
          thematicProgression: 'Progressive development'
        }
      });

      const result = await expandPartToChapters(params);

      expect(result.chapters).toHaveLength(5);
      expect(result.totalWordCount).toBe(25000);
    });
  });

  describe('generateStoryStructure', () => {
    test('should generate complete story structure from premise', async () => {
      const params: StoryStructureParams = {
        bookId: mockBookId,
        premise: 'A young farm boy discovers he has magical powers and must save the kingdom from an ancient evil',
        genre: 'Epic Fantasy',
        targetLength: 'novel',
        themes: ['coming of age', 'good vs evil', 'friendship'],
        characterCount: 5
      };

      const expectedStoryStructure = {
        title: 'The Last Mage',
        synopsis: 'When darkness threatens the realm, an unlikely hero must master forbidden magic to save his world',
        storyStructure: {
          setup: 'Farm boy discovers magical heritage',
          incitingIncident: 'Village attacked by dark forces',
          risingAction: 'Training and gathering allies',
          climax: 'Final battle with ancient evil',
          resolution: 'Kingdom saved, hero transformed'
        },
        characters: [
          {
            name: 'Erin Blackwood',
            role: 'protagonist',
            background: 'Farm boy with hidden magical lineage',
            arc: 'From naive youth to powerful mage'
          }
        ],
        worldBuilding: {
          setting: 'Medieval fantasy realm of Aethermoor',
          magicSystem: 'Elemental magic bound to ancient bloodlines',
          cultures: ['Rural farming communities', 'Noble courts', 'Wizard enclaves']
        },
        partBreakdown: [
          {
            partNumber: 1,
            title: 'The Awakening',
            description: 'Discovery of powers and call to adventure',
            chapterCount: 8
          }
        ]
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedStoryStructure
      });

      const result = await generateStoryStructure(params);

      expect(result).toEqual(expectedStoryStructure);
      expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
        prompt: expect.stringContaining('young farm boy discovers he has magical powers')
      }));
    });

    test('should handle different target lengths', async () => {
      const targetLengths = ['novella', 'novel', 'epic'] as const;
      
      for (const targetLength of targetLengths) {
        const params: StoryStructureParams = {
          bookId: mockBookId,
          premise: 'A story premise',
          genre: 'Fantasy',
          targetLength
        };

        mockGenerateObject.mockResolvedValue({
          object: {
            title: 'Generated Story',
            synopsis: 'Generated synopsis',
            storyStructure: {
              setup: 'Setup',
              incitingIncident: 'Incident',
              risingAction: 'Action',
              climax: 'Climax',
              resolution: 'Resolution'
            },
            characters: [],
            worldBuilding: {
              setting: 'Setting',
              cultures: []
            },
            partBreakdown: []
          }
        });

        const result = await generateStoryStructure(params);

        expect(result.title).toBe('Generated Story');
        expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
          prompt: expect.stringContaining(targetLength)
        }));
      }
    });
  });

  describe('improveCharacterConsistency', () => {
    test('should analyze and improve character consistency across scenes', async () => {
      const params: CharacterConsistencyParams = {
        bookId: mockBookId,
        characterName: 'Hero',
        sceneIds: [mockSceneId, 'scene-456', 'scene-789'],
        focusAreas: ['personality', 'speech patterns', 'motivations']
      };

      const expectedConsistencyAnalysis = {
        characterName: 'Hero',
        consistencyScore: 78,
        issues: [
          {
            type: 'personality',
            description: 'Character shows inconsistent bravery levels',
            scenes: ['scene-456'],
            suggestion: 'Establish clear character growth arc'
          }
        ],
        recommendations: [
          'Create character voice guide',
          'Add character development notes to scenes'
        ],
        improvedScenes: [
          {
            sceneId: 'scene-456',
            improvements: {
              dialogue: 'Updated dialogue to match character voice',
              characterActions: 'Adjusted actions to reflect personality'
            }
          }
        ]
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedConsistencyAnalysis
      });

      const result = await improveCharacterConsistency(params);

      expect(result).toEqual(expectedConsistencyAnalysis);
      expect(result.consistencyScore).toBe(78);
      expect(result.issues).toHaveLength(1);
    });

    test('should handle characters with high consistency scores', async () => {
      const params: CharacterConsistencyParams = {
        bookId: mockBookId,
        characterName: 'MentorCharacter',
        sceneIds: [mockSceneId]
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          characterName: 'MentorCharacter',
          consistencyScore: 95,
          issues: [],
          recommendations: ['Character maintains excellent consistency'],
          improvedScenes: []
        }
      });

      const result = await improveCharacterConsistency(params);

      expect(result.consistencyScore).toBe(95);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('generateChapterSummary', () => {
    test('should generate comprehensive chapter summary for context', async () => {
      const params: ChapterSummaryParams = {
        chapterId: mockChapterId,
        includeSceneBreakdown: true,
        includeCharacterArcs: true,
        includeThematicElements: true,
        summaryStyle: 'detailed'
      };

      const expectedChapterSummary = {
        chapterId: mockChapterId,
        title: 'The Mentor\'s Wisdom',
        summary: 'The hero receives crucial guidance from an ancient mentor, learning about their true heritage and the challenges ahead.',
        sceneBreakdown: [
          {
            sceneNumber: 1,
            title: 'Arrival at the Library',
            summary: 'Hero enters the ancient library seeking answers',
            purpose: 'Establish setting and mood',
            keyEvents: ['Discovery of hidden entrance', 'First glimpse of mentor']
          }
        ],
        characterArcs: [
          {
            character: 'Hero',
            arcProgression: 'From ignorant farm boy to aware but reluctant chosen one',
            keyMoments: ['Learning true parentage', 'Accepting first lesson']
          }
        ],
        thematicElements: [
          'Destiny vs. free will',
          'The burden of knowledge'
        ],
        wordCount: 4500,
        progression: {
          plotAdvancement: 'Major revelation moves story forward',
          characterDevelopment: 'Significant growth in protagonist',
          worldBuilding: 'Ancient lore and history revealed'
        }
      };

      mockGenerateObject.mockResolvedValue({
        object: expectedChapterSummary
      });

      const result = await generateChapterSummary(params);

      expect(result).toEqual(expectedChapterSummary);
      expect(result.sceneBreakdown).toHaveLength(1);
      expect(result.characterArcs).toHaveLength(1);
    });

    test('should generate brief summary when requested', async () => {
      const params: ChapterSummaryParams = {
        chapterId: mockChapterId,
        summaryStyle: 'brief',
        includeSceneBreakdown: false,
        includeCharacterArcs: false
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          chapterId: mockChapterId,
          title: 'The Mentor\'s Wisdom',
          summary: 'Hero meets mentor and learns about their destiny.',
          wordCount: 4500
        }
      });

      const result = await generateChapterSummary(params);

      expect(result.summary).toBe('Hero meets mentor and learns about their destiny.');
      expect(result.sceneBreakdown).toBeUndefined();
    });
  });

  describe('hierarchyTools integration', () => {
    test('should export all hierarchy tools for AI SDK integration', () => {
      expect(hierarchyTools).toBeDefined();
      expect(hierarchyTools.createScene).toBeDefined();
      expect(hierarchyTools.expandPart).toBeDefined();
      expect(hierarchyTools.generateStoryStructure).toBeDefined();
      expect(hierarchyTools.improveCharacterConsistency).toBeDefined();
      expect(hierarchyTools.generateChapterSummary).toBeDefined();
    });

    test('should have proper tool configurations for AI SDK', () => {
      const tools = hierarchyTools;
      
      // Each tool should have description and parameters
      expect(tools.createScene.description).toContain('scene');
      expect(tools.expandPart.description).toContain('part');
      expect(tools.generateStoryStructure.description).toContain('story');
      expect(tools.improveCharacterConsistency.description).toContain('character');
      expect(tools.generateChapterSummary.description).toContain('summaries');
      
      // Tools should have parameters defined
      expect(tools.createScene.parameters).toBeDefined();
      expect(tools.expandPart.parameters).toBeDefined();
      expect(tools.generateStoryStructure.parameters).toBeDefined();
      expect(tools.improveCharacterConsistency.parameters).toBeDefined();
      expect(tools.generateChapterSummary.parameters).toBeDefined();
    });

    test('should have executable functions for each tool', () => {
      const tools = hierarchyTools;
      
      expect(typeof tools.createScene.execute).toBe('function');
      expect(typeof tools.expandPart.execute).toBe('function');
      expect(typeof tools.generateStoryStructure.execute).toBe('function');
      expect(typeof tools.improveCharacterConsistency.execute).toBe('function');
      expect(typeof tools.generateChapterSummary.execute).toBe('function');
    });
  });

  describe('error handling', () => {
    test('should handle AI generation failures gracefully', async () => {
      mockGenerateObject.mockRejectedValue(new Error('AI service unavailable'));

      const params: SceneGenerationParams = {
        chapterId: mockChapterId,
        sceneType: 'dialogue',
        prompt: 'Create a scene',
        includeContext: false
      };

      await expect(createSceneWithContext(params)).rejects.toThrow('AI service unavailable');
    });

    test('should validate input parameters', async () => {
      const invalidParams = {
        chapterId: '',
        sceneType: 'dialogue',
        prompt: ''
      } as SceneGenerationParams;

      await expect(createSceneWithContext(invalidParams)).rejects.toThrow('Missing required parameters');
    });
  });

  describe('schema validation', () => {
    test('should use proper Zod schemas for AI generation', async () => {
      const params: SceneGenerationParams = {
        chapterId: mockChapterId,
        sceneType: 'dialogue',
        prompt: 'Create a scene',
        includeContext: false
      };

      mockGenerateObject.mockResolvedValue({
        object: {
          title: 'Test Scene',
          content: 'Test content',
          sceneType: 'dialogue',
          purpose: 'Test purpose'
        }
      });

      await createSceneWithContext(params);

      expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
        schema: expect.any(Object)
      }));
    });
  });
});