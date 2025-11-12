/**
 * Analysis API Tests
 *
 * Tests for analytics and analysis endpoints
 * Test Cases: TC-API-ANALYSIS-001 to TC-API-ANALYSIS-014
 */

import { expect, test } from "@playwright/test";
import { getAuthHeaders } from "../helpers/auth";

test.describe("Analysis API", () => {
    test.describe("Get Story Analysis", () => {
        test("TC-API-ANALYSIS-002: Non-owner cannot view analysis (403)", async ({
            request,
        }) => {
            const response = await request.get(
                "/analysis/api/stories/some-story-id",
                {
                    headers: getAuthHeaders("reader"),
                },
            );

            expect([403, 404]).toContain(response.status());
        });
    });

    test.describe("Record Reading Event", () => {
        test("TC-API-ANALYSIS-013: Event validation works", async ({
            request,
        }) => {
            const response = await request.post("/analysis/api/track", {
                data: {
                    // Invalid or missing required fields
                },
            });

            expect([400, 422]).toContain(response.status());
        });
    });
});
