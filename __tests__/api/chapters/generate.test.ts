import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chapters/generate/route';
import { db } from '@/lib/db/drizzle';
import { user, story, chapter } from '@/lib/db/schema';
import { auth } from '@/app/auth';

// Mock auth
jest.mock('@/app/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock AI provider
jest.mock('@/lib/ai/providers', () => ({
  getDefaultModel: jest.fn().mockReturnValue({
    stream: jest.fn()
  })
}));

describe('/api/chapters/generate', () => {
  let testUser: any;
  let testStory: any;
  
  beforeEach(async () => {
    // Clean up test data
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
      title: 'Test Story',
      description: 'A test story for chapter generation',
      authorId: testUser.id,
      genre: 'fantasy'
    }).returning();

    // Mock auth to return test user
    mockAuth.mockResolvedValue({
      user: { id: testUser.id, email: testUser.email }
    });
  });

  afterEach(async () => {
    await db.delete(chapter);
    await db.delete(story);
    await db.delete(user);
    jest.clearAllMocks();
  });

  describe('Request validation', () => {
    it('should reject requests without authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid storyId', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: 'invalid-uuid',
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          // Missing chapterNumber and prompt
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with invalid chapter number', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: -1, // Invalid chapter number
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with empty prompt', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: '' // Empty prompt
        })
      });

      const response = await POST(request);
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

      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: otherStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Chapter generation', () => {
    it('should return streaming response for valid request', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
    });

    it('should include context when requested', async () => {
      // First create an existing chapter for context
      await db.insert(chapter).values({
        storyId: testStory.id,
        chapterNumber: 1,
        title: 'Previous Chapter',
        content: JSON.stringify([{ type: 'paragraph', children: [{ text: 'Previous content' }] }]),
        wordCount: 2
      });

      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 2,
          prompt: 'Continue the story',
          includeContext: {
            previousChapters: true,
            characters: true
          }
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should respect maxTokens parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter',
          maxTokens: 1000
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should respect temperature parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter',
          temperature: 0.5
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should handle AI provider errors gracefully', async () => {
      // Mock AI provider to throw an error
      const { getDefaultModel } = require('@/lib/ai/providers');
      getDefaultModel.mockReturnValue({
        stream: jest.fn().mockRejectedValue(new Error('AI provider error'))
      });

      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should handle database errors gracefully', async () => {
      // Mock db error by using invalid storyId after validation
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: '00000000-0000-0000-0000-000000000000', // Valid UUID but non-existent
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits for generation requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          prompt: 'Write a compelling opening chapter'
        })
      });

      // Make multiple rapid requests
      const responses = await Promise.all([
        POST(request),
        POST(request),
        POST(request),
        POST(request),
        POST(request),
        POST(request) // Should be rate limited
      ]);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});