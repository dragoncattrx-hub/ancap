import { test, expect, type Page } from "@playwright/test";

async function mockAuthedApi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("ancap_token", "token_test");
    localStorage.setItem(
      "ancap_user",
      JSON.stringify({ email: "e2e@example.com", display_name: "E2E" }),
    );
  });

  await page.route("**/api/v1/agents**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "a_1",
            display_name: "Agent One",
            roles: ["seller"],
            status: "active",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });
  await page.route("**/api/v1/strategies**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "s_1",
            name: "Strategy One",
            description: "Test strategy",
            agent_id: "a_1",
            vertical_id: "v_1",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });
  await page.route("**/api/v1/verticals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [{ id: "v_1", name: "DeFi" }] }),
    });
  });
  await page.route("**/api/v1/runs**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    });
  });
}

test.describe('ANCAP Frontend - UI Tests', () => {
  test('Home page loads and displays hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check page loads
    await expect(page).toHaveTitle(/ANCAP/i);
    
    // Check hero section is visible
    await expect(page.locator('h1')).toContainText('AI-Native Capital Allocation Platform');
    
    // Check navigation for unauthenticated users
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('Dashboard page loads and shows metrics', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/dashboard');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Dashboard|Панель/i);
    
    // Check metrics blocks are visible (current UI: agents/strategies/runs)
    const cards = page.locator(".responsive-grid .card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText(/Agents|dashboard\.agents|Агенты/i);
    await expect(cards.nth(1)).toContainText(/Active Strategies|dashboard\.activeStrategies|Стратег/i);
    await expect(cards.nth(2)).toContainText(/Runs|dashboard\.runs|Запуск/i);
  });

  test('Agents page loads and shows agent cards', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/agents');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Agents|Агенты/i);
    
    // Check "Register Agent" button exists
    await expect(page.getByText(/Register Agent|Зарегистрировать агента/i)).toBeVisible();
    
    // Check at least one agent card is visible (mocked API)
    await expect(page.getByText("Agent One")).toBeVisible();
  });

  test('Strategies page loads and shows strategy cards', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/strategies');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Strategies|Стратегии/i);
    
    // Check "Create Strategy" button exists
    await expect(page.getByText(/Create Strategy|Создать стратегию/i)).toBeVisible();
    
    // Check at least one strategy card is visible (mocked API)
    await expect(page.getByText("Strategy One")).toBeVisible();
  });

  test('Projects page loads and shows project info', async ({ page }) => {
    await page.goto('/projects');
    
    // Check page loads without errors
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check some project-related content exists
    await expect(page.getByRole("heading", { name: /ANCAP/i }).first()).toBeVisible();
  });

  test('Navigation works between pages', async ({ page }) => {
    await mockAuthedApi(page);
    await page.goto('/dashboard');
    
    // Navigate to Agents
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator('h1')).toContainText(/Agents|Агенты/i);
    
    // Navigate to Strategies
    await page.click('a[href="/strategies"]');
    await expect(page).toHaveURL(/\/strategies/);
    await expect(page.locator('h1')).toContainText(/Strategies|Стратегии/i);
  });

  test('Language switching works', async ({ page }) => {
    await page.goto('/');
    
    // Check default language (English)
    await expect(page.locator('h1')).toContainText('AI-Native Capital Allocation Platform');
    
    // Find and click Russian language button
    const ruButton = page.locator('button:has-text("RU"), button:has-text("РУ")');
    if (await ruButton.isVisible()) {
      await ruButton.click();
      
      // Wait for language change
      await page.waitForTimeout(500);
      
      // Check Russian text appears on landing sections
      await expect(page.locator("body")).toContainText(/Продукт|Видение|Документация|Платформа/);
    }
  });

  test('All pages return 200 status', async ({ page }) => {
    const pages = ['/', '/dashboard', '/agents', '/strategies', '/projects'];
    
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    }
  });
});
