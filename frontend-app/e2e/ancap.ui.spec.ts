import { test, expect } from "@playwright/test";

test.describe("ANCAP Frontend - UI smoke", () => {
  test("home page renders core public surface", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/ANCAP/i);
    await expect(page.locator("body")).toContainText(/ANCAP/i);
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/whitepaper"]')).toBeVisible();
  });

  test("public routes return success", async ({ page }) => {
    for (const path of ["/", "/projects", "/whitepaper", "/login", "/register"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} status`).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("language switcher is present and interactive", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    const ruButton = page.getByText(/^RU$/).first();
    await expect(ruButton).toBeVisible();
    await ruButton.click();
    await page.waitForTimeout(300);
    await expect(page.locator("body")).toContainText(/ANCAP/i);
  });
});
