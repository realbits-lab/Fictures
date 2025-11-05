/**
 * Publish API Tests
 *
 * Tests for publishing and scheduling endpoints
 * Test Cases: TC-API-PUBLISH-001 to TC-API-PUBLISH-013
 */

import { test, expect } from '@playwright/test';
import { getAuthHeaders } from '../helpers/auth';

test.describe('Publish API', () => {
  test.describe('Publish Scene', () => {
    test('TC-API-PUBLISH-002: Non-owner cannot publish scene (403)', async ({ request }) => {
      const response = await request.post('/publish/api/scenes/some-scene-id', {
        headers: getAuthHeaders('reader'),
      });

      expect([403, 404]).toContain(response.status());
    });
  });
});
