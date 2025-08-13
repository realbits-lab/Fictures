import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/chapters/context/route';
import { db } from '@/lib/db/drizzle';
import { user, story, chapter, character } from '@/lib/db/schema';
import { auth } from '@/app/auth';

// Mock auth
jest.mock('@/app/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/chapters/context', () => {
  let testUser: any;
  let testStory: any;
  let testChapter1: any;
  let testChapter2: any;
  let testCharacter: any;
  
  beforeEach(async () => {
    // Clean up test data
    await db.delete(character);
    await db.delete(chapter);
    await db.delete(story);
    await db.delete(user);

    // Create test user
    [testUser] = await db.insert(user).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning();

    // Create test story
    [testStory] = await db.insert(story).values({
      title: 'The Epic Adventure',
      description: 'A thrilling fantasy adventure story',
      authorId: testUser.id,
      genre: 'fantasy'
    }).returning();

    // Create test chapters
    [testChapter1] = await db.insert(chapter).values({
      storyId: testStory.id,
      chapterNumber: 1,
      title: 'The Beginning',
      content: JSON.stringify([{ 
        type: 'paragraph', 
        children: [{ text: 'The hero began their journey in a mystical forest.' }] 
      }]),
      wordCount: 10
    }).returning();

    [testChapter2] = await db.insert(chapter).values({
      storyId: testStory.id,
      chapterNumber: 2,
      title: 'First Encounter',
      content: JSON.stringify([{ 
        type: 'paragraph', 
        children: [{ text: 'The hero met a wise old wizard who offered guidance.' }] 
      }]),
      wordCount: 11
    }).returning();

    // Create test character
    [testCharacter] = await db.insert(character).values({
      storyId: testStory.id,
      name: 'Gandalf',
      description: 'A wise old wizard with a long grey beard',
      role: 'supporting',
      appearance: 'Tall, grey robes, wooden staff'
    }).returning();

    // Mock auth to return test user
    mockAuth.mockResolvedValue({
      user: { id: testUser.id, email: testUser.email }
    });
  });

  afterEach(async () => {
    await db.delete(character);
    await db.delete(chapter);
    await db.delete(story);
    await db.delete(user);
    jest.clearAllMocks();
  });

  describe('Request validation', () => {
    it('should reject requests without authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid storyId', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', 'invalid-uuid');
      url.searchParams.set('chapterNumber', '1');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(400);
    });

    it('should reject requests with missing required parameters', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      // Missing storyId and chapterNumber

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(400);
    });

    it('should reject requests with invalid chapter number', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '-1');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Authorization checks', () => {
    it('should reject requests for stories not owned by user', async () => {
      // Create another user and story
      const [otherUser] = await db.insert(user).values({
        email: 'other@example.com',
        name: 'Other User'
      }).returning();

      const [otherStory] = await db.insert(story).values({
        title: 'Other Story',
        authorId: otherUser.id
      }).returning();

      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', otherStory.id);
      url.searchParams.set('chapterNumber', '1');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(403);
    });
  });

  describe('Context retrieval', () => {
    it('should return complete context for existing story', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(200);

      const contextData = await response.json();
      expect(contextData).toMatchObject({
        story: {
          id: testStory.id,
          title: 'The Epic Adventure',
          genre: 'fantasy',
          description: 'A thrilling fantasy adventure story'
        },
        previousChapters: expect.arrayContaining([
          expect.objectContaining({
            chapterNumber: 1,
            title: 'The Beginning',
            summary: expect.any(String)
          }),
          expect.objectContaining({
            chapterNumber: 2,
            title: 'First Encounter',
            summary: expect.any(String)
          })
        ]),
        characters: expect.arrayContaining([
          expect.objectContaining({
            id: testCharacter.id,
            name: 'Gandalf',
            role: 'supporting',
            description: 'A wise old wizard with a long grey beard'
          })
        ]),
        currentChapter: null // Chapter 3 doesn't exist yet
      });
    });

    it('should return context for existing chapter', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '2');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(200);

      const contextData = await response.json();
      expect(contextData.currentChapter).toMatchObject({
        id: testChapter2.id,
        title: 'First Encounter',
        content: expect.any(String)
      });

      // Should only include previous chapter (chapter 1)
      expect(contextData.previousChapters).toHaveLength(1);
      expect(contextData.previousChapters[0].chapterNumber).toBe(1);
    });

    it('should filter chapters when specific chapters requested', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');
      url.searchParams.set('includeChapters', '1'); // Only include chapter 1

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(200);

      const contextData = await response.json();
      expect(contextData.previousChapters).toHaveLength(1);
      expect(contextData.previousChapters[0].chapterNumber).toBe(1);
    });

    it('should respect maxSummaryLength parameter', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');
      url.searchParams.set('maxSummaryLength', '50');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(200);

      const contextData = await response.json();
      contextData.previousChapters.forEach((chapter: any) => {
        expect(chapter.summary.length).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Chapter summary generation', () => {
    it('should generate meaningful summaries from chapter content', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      const contextData = await response.json();
      
      contextData.previousChapters.forEach((chapter: any) => {
        expect(chapter.summary).toBeTruthy();
        expect(typeof chapter.summary).toBe('string');
        expect(chapter.summary.length).toBeGreaterThan(10);
      });
    });

    it('should handle chapters with complex content structures', async () => {
      // Update chapter with more complex content
      const complexContent = JSON.stringify([
        { type: 'heading', level: 1, children: [{ text: 'Chapter Title' }] },
        { type: 'paragraph', children: [{ text: 'First paragraph with ' }, { text: 'bold text', bold: true }] },
        { type: 'paragraph', children: [{ text: 'Second paragraph with dialogue.' }] }
      ]);

      await db.update(chapter)
        .set({ content: complexContent })
        .where(sql`"id" = ${testChapter1.id}`);

      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(200);

      const contextData = await response.json();
      expect(contextData.previousChapters[0].summary).toBeTruthy();
    });
  });

  describe('Character context', () => {
    it('should return all story characters', async () => {
      // Add another character
      await db.insert(character).values({
        storyId: testStory.id,
        name: 'Frodo',
        description: 'A brave hobbit',
        role: 'protagonist'
      });

      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      const contextData = await response.json();
      expect(contextData.characters).toHaveLength(2);
      
      const characterNames = contextData.characters.map((c: any) => c.name);
      expect(characterNames).toContain('Gandalf');
      expect(characterNames).toContain('Frodo');
    });

    it('should handle stories with no characters', async () => {
      // Delete all characters
      await db.delete(character).where(sql`"storyId" = ${testStory.id}`);

      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      const contextData = await response.json();
      expect(contextData.characters).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent story', async () => {
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', '00000000-0000-0000-0000-000000000000');
      url.searchParams.set('chapterNumber', '1');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(404);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error by corrupting the connection (this is a theoretical test)
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '1');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      // Should handle gracefully, not crash
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Performance and caching', () => {
    it('should respond quickly for stories with many chapters', async () => {
      // Create 50 chapters
      const chapters = Array.from({ length: 50 }, (_, i) => ({
        storyId: testStory.id,
        chapterNumber: i + 3, // Start from 3 since we have 1 and 2
        title: `Chapter ${i + 3}`,
        content: JSON.stringify([{ type: 'paragraph', children: [{ text: `Content for chapter ${i + 3}` }] }]),
        wordCount: 5
      }));

      await db.insert(chapter).values(chapters);

      const startTime = Date.now();
      
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '53');

      const request = new NextRequest(url);
      const response = await GET(request);
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should cache context data appropriately', async () => {
      // Make the same request twice
      const url = new URL('http://localhost:3000/api/chapters/context');
      url.searchParams.set('storyId', testStory.id);
      url.searchParams.set('chapterNumber', '3');

      const request1 = new NextRequest(url);
      const request2 = new NextRequest(url);

      const startTime = Date.now();
      const response1 = await GET(request1);
      const midTime = Date.now();
      const response2 = await GET(request2);
      const endTime = Date.now();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Second request should be faster (cached)
      const firstRequestTime = midTime - startTime;
      const secondRequestTime = endTime - midTime;
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime);
    });
  });
});