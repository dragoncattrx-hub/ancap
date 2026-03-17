import { test, expect } from "@playwright/test";

test("register uses /api/v1 and redirects to dashboard", async ({ page }) => {
  const registered: { url?: string; method?: string } = {};

  // In dev, API_BASE may be "/api/v1" (proxy) OR an explicit NEXT_PUBLIC_API_URL
  // like ".../v1". Match on the stable suffix.
  await page.route("**/auth/users", async (route) => {
    const req = route.request();
    registered.url = req.url();
    registered.method = req.method();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "u_test", email: "e2e@example.com", display_name: "E2E" }),
    });
  });

  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: "token_test", token_type: "bearer", expires_in: 3600 }),
    });
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "u_test", email: "e2e@example.com", display_name: "E2E" }),
    });
  });

  await page.route("**/api/v1/agents**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
  });
  await page.route("**/api/v1/strategies**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
  });
  await page.route("**/api/v1/runs**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
  });

  await page.goto("/register", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Display Name").fill("E2E User");
  await page.getByLabel("Email").fill(`e2e_${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await Promise.all([
    page.waitForRequest("**/auth/users"),
    page.waitForRequest("**/auth/login"),
    page.waitForRequest("**/users/me"),
    page.getByRole("button", { name: "Register" }).click(),
  ]);

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  expect(registered.method).toBe("POST");
  expect(registered.url).toMatch(/\/(api\/v1|v1)\/auth\/users$/);
});

