import { test, expect } from "@playwright/test";

test.describe("AI Console UI", () => {
  test("renders core sections", async ({ page }) => {
    await page.goto("/ai-console");
    await expect(page.getByRole("heading", { name: /AI Console/i })).toBeVisible();
    await expect(page.getByText(/Incentives summary/i)).toBeVisible();
    await expect(page.getByText(/Decision log browser/i)).toBeVisible();
  });
});

