import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chapters/save/route';
import { db } from '@/lib/db/drizzle';
import { user, story, chapter } from '@/lib/db/schema';
import { auth } from '@/app/auth';

// Mock auth
jest.mock('@/app/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/chapters/save', () => {
  let testUser: any;
  let testStory: any;
  let testChapter: any;
  
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
      description: 'A test story for chapter saving',
      authorId: testUser.id,
      genre: 'fantasy'
    }).returning();

    // Create test chapter
    [testChapter] = await db.insert(chapter).values({
      storyId: testStory.id,
      chapterNumber: 1,
      title: 'Test Chapter',
      content: JSON.stringify([{ type: 'paragraph', children: [{ text: 'Original content' }] }]),
      wordCount: 2
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

      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: 'Updated chapter content'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid storyId', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: 'invalid-uuid',
          chapterNumber: 1,
          content: 'Updated chapter content'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id
          // Missing chapterNumber and content
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with invalid chapter number', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 0, // Invalid chapter number
          content: 'Updated chapter content'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject requests with empty content', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: '' // Empty content
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

      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: otherStory.id,
          chapterNumber: 1,
          content: 'Unauthorized update'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Chapter saving', () => {
    it('should save new chapter successfully', async () => {
      const newContent = JSON.stringify([{ type: 'paragraph', children: [{ text: 'New chapter content for chapter 2' }] }]);
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 2,
          content: newContent
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: true,
        chapterId: expect.any(String),
        savedAt: expect.any(String),
        wordCount: expect.any(Number)
      });

      // Verify chapter was created in database
      const chapters = await db.select().from(chapter)
        .where(sql`"storyId" = ${testStory.id} AND "chapterNumber" = 2`);
      expect(chapters).toHaveLength(1);
      expect(JSON.parse(chapters[0].content)).toEqual(JSON.parse(newContent));
    });

    it('should update existing chapter successfully', async () => {
      const updatedContent = JSON.stringify([{ type: 'paragraph', children: [{ text: 'Updated chapter content' }] }]);
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: updatedContent
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: true,
        chapterId: testChapter.id,
        savedAt: expect.any(String),
        wordCount: expect.any(Number)
      });

      // Verify chapter was updated in database
      const updatedChapter = await db.select().from(chapter)
        .where(sql`"id" = ${testChapter.id}`);
      expect(updatedChapter).toHaveLength(1);
      expect(JSON.parse(updatedChapter[0].content)).toEqual(JSON.parse(updatedContent));
    });

    it('should calculate word count correctly', async () => {
      const content = JSON.stringify([{ 
        type: 'paragraph', 
        children: [{ text: 'This is a test chapter with exactly ten words in it.' }] 
      }]);
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 3,
          content
        })
      });

      const response = await POST(request);
      const responseData = await response.json();
      
      expect(responseData.wordCount).toBe(12); // "This is a test chapter with exactly ten words in it."
    });

    it('should handle auto-save requests', async () => {
      const content = JSON.stringify([{ type: 'paragraph', children: [{ text: 'Auto-saved content' }] }]);
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content,
          autoSave: true
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
    });

    it('should associate with generation ID when provided', async () => {
      const content = JSON.stringify([{ type: 'paragraph', children: [{ text: 'Generated content' }] }]);
      const generationId = '12345678-1234-1234-1234-123456789012';
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content,
          generationId
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Conflict resolution', () => {
    it('should handle concurrent save attempts', async () => {
      const content1 = JSON.stringify([{ type: 'paragraph', children: [{ text: 'First update' }] }]);
      const content2 = JSON.stringify([{ type: 'paragraph', children: [{ text: 'Second update' }] }]);
      
      const request1 = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: content1
        })
      });

      const request2 = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: content2
        })
      });

      // Make concurrent requests
      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ]);

      // Both should succeed (last-write-wins strategy)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: '00000000-0000-0000-0000-000000000000', // Valid UUID but non-existent
          chapterNumber: 1,
          content: 'Test content'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON content gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 1,
          content: 'invalid json content'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should handle large content efficiently', async () => {
      // Create a large content string (1MB)
      const largeText = 'A'.repeat(1000000);
      const content = JSON.stringify([{ type: 'paragraph', children: [{ text: largeText }] }]);
      
      const startTime = Date.now();
      
      const request = new NextRequest('http://localhost:3000/api/chapters/save', {
        method: 'POST',
        body: JSON.stringify({
          storyId: testStory.id,
          chapterNumber: 4,
          content
        })
      });

      const response = await POST(request);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});