/**
 * Studio Page Access Control Tests (Reader Role)
 *
 * Tests that reader role users cannot access Studio
 * Expected behavior: Redirect or access denied
 */

import { expect, test } from "@playwright/test";

test.describe("Studio Page - Reader Access Control", () => {
    test("TC-STUDIO-AUTH-002: Reader role users see access denied", async ({
        page,
    }) => {
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Reader should be redirected or see access denied
        const url = page.url();
        const accessDenied = await page
            .locator("text=/access denied|forbidden|unauthorized/i")
            .isVisible()
            .catch(() => false);

        expect(
            url.includes("/login") || url.includes("/signin") || accessDenied,
        ).toBeTruthy();
    });
});
