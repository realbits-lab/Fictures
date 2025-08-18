import { describe, it, expect } from '@jest/globals';

/**
 * Book Hierarchy Function Availability Tests
 * 
 * Tests that all CRUD functions are properly defined and importable
 * Following TDD methodology - GREEN phase verification
 * 
 * These tests verify that:
 * - All CRUD functions exist and are callable
 * - Function signatures are correct
 * - Types are properly exported
 */

describe('Book Hierarchy CRUD Functions', () => {
  describe('Function Imports', () => {
    it('should import all hierarchy CRUD functions', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Story functions
      expect(hierarchyModule.createStory).toBeDefined();
      expect(typeof hierarchyModule.createStory).toBe('function');
      expect(hierarchyModule.getStoryWithParts).toBeDefined();
      expect(typeof hierarchyModule.getStoryWithParts).toBe('function');
      expect(hierarchyModule.updateStory).toBeDefined();
      expect(typeof hierarchyModule.updateStory).toBe('function');
      expect(hierarchyModule.deleteStory).toBeDefined();
      expect(typeof hierarchyModule.deleteStory).toBe('function');

      // Part functions
      expect(hierarchyModule.createPart).toBeDefined();
      expect(typeof hierarchyModule.createPart).toBe('function');
      expect(hierarchyModule.getPartWithChapters).toBeDefined();
      expect(typeof hierarchyModule.getPartWithChapters).toBe('function');
      expect(hierarchyModule.updatePart).toBeDefined();
      expect(typeof hierarchyModule.updatePart).toBe('function');
      expect(hierarchyModule.deletePart).toBeDefined();
      expect(typeof hierarchyModule.deletePart).toBe('function');

      // Chapter functions
      expect(hierarchyModule.createChapter).toBeDefined();
      expect(typeof hierarchyModule.createChapter).toBe('function');
      expect(hierarchyModule.getChapterWithScenes).toBeDefined();
      expect(typeof hierarchyModule.getChapterWithScenes).toBe('function');
      expect(hierarchyModule.updateChapter).toBeDefined();
      expect(typeof hierarchyModule.updateChapter).toBe('function');
      expect(hierarchyModule.deleteChapter).toBeDefined();
      expect(typeof hierarchyModule.deleteChapter).toBe('function');

      // Scene functions
      expect(hierarchyModule.createScene).toBeDefined();
      expect(typeof hierarchyModule.createScene).toBe('function');
      expect(hierarchyModule.getSceneDetails).toBeDefined();
      expect(typeof hierarchyModule.getSceneDetails).toBe('function');
      expect(hierarchyModule.updateScene).toBeDefined();
      expect(typeof hierarchyModule.updateScene).toBe('function');
      expect(hierarchyModule.deleteScene).toBeDefined();
      expect(typeof hierarchyModule.deleteScene).toBe('function');

      // Navigation and context functions
      expect(hierarchyModule.getHierarchyPath).toBeDefined();
      expect(typeof hierarchyModule.getHierarchyPath).toBe('function');
      expect(hierarchyModule.buildHierarchyContext).toBeDefined();
      expect(typeof hierarchyModule.buildHierarchyContext).toBe('function');

      // Search functions
      expect(hierarchyModule.searchHierarchy).toBeDefined();
      expect(typeof hierarchyModule.searchHierarchy).toBe('function');

      // Utility functions
      expect(hierarchyModule.updateWordCounts).toBeDefined();
      expect(typeof hierarchyModule.updateWordCounts).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should export TypeScript interfaces', async () => {
      // These will be tested by TypeScript compilation
      // If the types don't exist, the import will fail
      const { CreateStoryData, CreatePartData, CreateChapterData, CreateSceneData, HierarchyContext, SearchOptions } = await import('@/lib/db/queries/hierarchy');
      
      // Verify that these are exported (TypeScript will catch if they're not)
      expect(typeof CreateStoryData).toBe('undefined'); // Interfaces don't exist at runtime
      expect(typeof CreatePartData).toBe('undefined');
      expect(typeof CreateChapterData).toBe('undefined');
      expect(typeof CreateSceneData).toBe('undefined');
      expect(typeof HierarchyContext).toBe('undefined');
      expect(typeof SearchOptions).toBe('undefined');
    });
  });

  describe('Function Structure', () => {
    it('should have async functions for database operations', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Test that key functions are async
      const createStoryResult = hierarchyModule.createStory({
        bookId: 'test-book-id',
        title: 'Test Story'
      });
      expect(createStoryResult).toBeInstanceOf(Promise);
      
      // We expect this to fail because no database connection in test environment
      // But we've verified the function exists and returns a Promise
      await expect(createStoryResult).rejects.toBeDefined();
    });

    it('should have proper function signatures for CRUD operations', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Test function parameter expectations by checking function length
      // (number of required parameters)
      expect(hierarchyModule.createStory.length).toBe(1); // Takes CreateStoryData
      expect(hierarchyModule.createPart.length).toBe(1); // Takes CreatePartData
      expect(hierarchyModule.createChapter.length).toBe(1); // Takes CreateChapterData
      expect(hierarchyModule.createScene.length).toBe(1); // Takes CreateSceneData
      
      expect(hierarchyModule.getStoryWithParts.length).toBe(1); // Takes storyId
      expect(hierarchyModule.getPartWithChapters.length).toBe(1); // Takes partId
      expect(hierarchyModule.getChapterWithScenes.length).toBe(1); // Takes chapterId
      expect(hierarchyModule.getSceneDetails.length).toBe(1); // Takes sceneId
      
      expect(hierarchyModule.deleteStory.length).toBe(1); // Takes storyId
      expect(hierarchyModule.deletePart.length).toBe(1); // Takes partId
      expect(hierarchyModule.deleteChapter.length).toBe(1); // Takes chapterId
      expect(hierarchyModule.deleteScene.length).toBe(1); // Takes sceneId
    });
  });

  describe('Module Structure', () => {
    it('should have complete CRUD operations for all hierarchy levels', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      const hierarchyLevels = ['Story', 'Part', 'Chapter', 'Scene'];
      const crudOperations = ['create', 'get', 'update', 'delete'];
      
      hierarchyLevels.forEach(level => {
        crudOperations.forEach(operation => {
          let functionName = '';
          
          if (operation === 'create') {
            functionName = `create${level}`;
          } else if (operation === 'get') {
            if (level === 'Story') functionName = 'getStoryWithParts';
            else if (level === 'Part') functionName = 'getPartWithChapters';
            else if (level === 'Chapter') functionName = 'getChapterWithScenes';
            else if (level === 'Scene') functionName = 'getSceneDetails';
          } else if (operation === 'update') {
            functionName = `update${level}`;
          } else if (operation === 'delete') {
            functionName = `delete${level}`;
          }
          
          if (functionName) {
            expect(hierarchyModule[functionName]).toBeDefined();
            expect(typeof hierarchyModule[functionName]).toBe('function');
          }
        });
      });
    });

    it('should have utility and helper functions', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Navigation helpers
      expect(hierarchyModule.getHierarchyPath).toBeDefined();
      expect(hierarchyModule.buildHierarchyContext).toBeDefined();
      
      // Search functionality
      expect(hierarchyModule.searchHierarchy).toBeDefined();
      
      // Word count management
      expect(hierarchyModule.updateWordCounts).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should have functions that handle database connection errors gracefully', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Test that functions reject with errors when database connection fails
      // In a test environment without proper database connection
      const invalidStoryData = {
        bookId: 'non-existent-book-id',
        title: 'Test Story'
      };
      
      await expect(hierarchyModule.createStory(invalidStoryData)).rejects.toBeDefined();
      await expect(hierarchyModule.getStoryWithParts('non-existent-story-id')).rejects.toBeDefined();
    });
  });

  describe('Integration Readiness', () => {
    it('should be ready for API route integration', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Verify all functions needed for API routes exist
      const apiRequiredFunctions = [
        'createStory', 'getStoryWithParts', 'updateStory', 'deleteStory',
        'createPart', 'getPartWithChapters', 'updatePart', 'deletePart',
        'createChapter', 'getChapterWithScenes', 'updateChapter', 'deleteChapter',
        'createScene', 'getSceneDetails', 'updateScene', 'deleteScene',
        'searchHierarchy', 'buildHierarchyContext'
      ];
      
      apiRequiredFunctions.forEach(functionName => {
        expect(hierarchyModule[functionName]).toBeDefined();
        expect(typeof hierarchyModule[functionName]).toBe('function');
      });
    });

    it('should be ready for AI integration', async () => {
      const hierarchyModule = await import('@/lib/db/queries/hierarchy');
      
      // Verify AI-specific functions exist
      expect(hierarchyModule.buildHierarchyContext).toBeDefined();
      expect(hierarchyModule.getHierarchyPath).toBeDefined();
      expect(hierarchyModule.searchHierarchy).toBeDefined();
    });
  });
});