import { test, expect } from "@playwright/test";

test.describe("Wave 3 surfaces", () => {
  test("evolution page renders", async ({ page }) => {
    await page.goto("/evolution");
    await expect(page.getByRole("heading", { name: /Evolution Studio/i })).toBeVisible();
  });

  test("tournaments page renders", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: /Tournaments/i })).toBeVisible();
  });

  test("bounties page renders", async ({ page }) => {
    await page.goto("/bounties");
    await expect(page.getByRole("heading", { name: /Bug Bounty/i })).toBeVisible();
  });
});

