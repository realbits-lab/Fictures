/**
 * User API Tests
 *
 * Tests for user profile and account management endpoints
 * Test Cases: TC-API-USER-001 to TC-API-USER-011
 */

import { test, expect } from '@playwright/test';
import { getAuthHeaders } from '../helpers/auth';

test.describe('User API', () => {
  test.describe('Get User Profile', () => {
    test('TC-API-USER-003: Non-existent user returns 404', async ({ request }) => {
      const response = await request.get('/api/users/nonexistent-user-id');

      expect(response.status()).toBe(404);
    });
  });

  test.describe('Update User Profile', () => {
    test('TC-API-USER-006: User cannot update other\'s profile (403)', async ({ request }) => {
      const response = await request.put('/api/users/other-user-id', {
        headers: getAuthHeaders('writer'),
        data: {
          name: 'Updated Name',
        },
      });

      expect([403, 404]).toContain(response.status());
    });
  });
});
