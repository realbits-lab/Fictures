/**
 * Generation API Tests
 *
 * Tests for AI story generation endpoints
 * Test Cases: TC-API-GEN-001 to TC-API-GEN-025
 */

import { test, expect } from '@playwright/test';
import { getAuthHeaders } from '../helpers/auth';

test.describe('Generation API', () => {
  test.describe('Generate Story', () => {
    test('TC-API-GEN-002: Invalid input parameters return 400', async ({ request }) => {
      const response = await request.post('/studio/api/novels/generate', {
        headers: getAuthHeaders('writer'),
        data: {
          // Invalid or missing required parameters
          parts: -1, // Invalid value
        },
      });

      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('Generate Images', () => {
    test('TC-API-GEN-024: Invalid prompts return 400', async ({ request }) => {
      const response = await request.post('/studio/api/generation/images', {
        headers: getAuthHeaders('writer'),
        data: {
          prompt: '', // Empty prompt
        },
      });

      expect([400, 422]).toContain(response.status());
    });
  });
});
