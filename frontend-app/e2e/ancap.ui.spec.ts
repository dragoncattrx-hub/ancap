import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

async function seedAuth(page: Page, request: APIRequestContext) {
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080/api";
  const uniq = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e_ui_${uniq}@example.com`;
  const password = `pw_${uniq}`;

  const reg = await request.post(`${apiBase}/auth/users`, {
    data: { email, password, display_name: "E2E UI" },
  });
  if (!reg.ok() && reg.status() !== 400) {
    throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  }
  const login = await request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  }
  const token = (await login.json()).access_token as string;

  const me = await request.get(`${apiBase}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!me.ok()) {
    throw new Error(`me failed: ${me.status()} ${await me.text()}`);
  }
  const meJson = await me.json();

  await page.addInitScript(
    ({ t, u }) => {
      localStorage.setItem("ancap_token", t);
      localStorage.setItem("ancap_user", JSON.stringify(u));
    },
    {
      t: token,
      u: {
        id: meJson.id,
        email: meJson.email,
        display_name: meJson.display_name || (meJson.email || "e2e").split("@")[0],
      },
    },
  );
  await page.route("**/api/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: meJson.id,
        email: meJson.email,
        display_name: meJson.display_name || (meJson.email || "e2e").split("@")[0],
      }),
    });
  });
}

async function mockAuthedApi(page: Page, request: APIRequestContext) {
  await seedAuth(page, request);

  await page.route("**/api/agents**", async (route) => {
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
  await page.route("**/api/strategies**", async (route) => {
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
  await page.route("**/api/verticals**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [{ id: "v_1", name: "DeFi" }] }),
    });
  });
  await page.route("**/api/runs**", async (route) => {
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

  test('Dashboard page loads and shows metrics', async ({ page, request }) => {
    await mockAuthedApi(page, request);
    await page.goto('/dashboard');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Dashboard|Panel/i);
    
    // Check metrics blocks are visible (current UI: agents/strategies/runs)
    const cards = page.locator(".responsive-grid .card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText(/Agents|dashboard\.agents|Agents/i);
    await expect(cards.nth(1)).toContainText(/Active Strategies|dashboard\.activeStrategies|Strategist/i);
    await expect(cards.nth(2)).toContainText(/Runs|dashboard\.runs|Launch/i);
  });

  test('Agents page loads and shows agent cards', async ({ page, request }) => {
    await mockAuthedApi(page, request);
    await page.goto('/agents');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Agents|Agents/i);
    
    // Check "Register Agent" button exists
    await expect(page.getByText(/Register Agent|Register Agent/i)).toBeVisible();
    
    // Check at least one agent card is visible (mocked API)
    await expect(page.getByText("Agent One")).toBeVisible();
  });

  test('Strategies page loads and shows strategy cards', async ({ page, request }) => {
    await mockAuthedApi(page, request);
    await page.goto('/strategies');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText(/Strategies|Strategies/i);
    
    // Check "Create Strategy" button exists
    await expect(page.getByText(/Create Strategy|Create Strategy/i)).toBeVisible();
    
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

  test('Navigation works between pages', async ({ page, request }) => {
    await mockAuthedApi(page, request);
    await page.goto('/dashboard');
    
    // Navigate to Agents
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator('h1')).toContainText(/Agents|Agents/i);
    
    // Navigate to Strategies
    await page.click('a[href="/strategies"]');
    await expect(page).toHaveURL(/\/strategies/);
    await expect(page.locator('h1')).toContainText(/Strategies|Strategies/i);
  });

  test('Language switching works', async ({ page }) => {
    await page.goto('/');
    
    // Check default language (English)
    await expect(page.locator('h1')).toContainText('AI-Native Capital Allocation Platform');
    
    // Find and click Russian language button
    const ruButton = page.getByRole("button", { name: /^RU$/ }).first();
    if (await ruButton.isVisible()) {
      await ruButton.click();
      
      // Wait for language change
      await page.waitForTimeout(500);
      
      // Check Russian text appears on landing sections
      await expect(page.locator("body")).toContainText(/Product|Vision|Documentation|Platform/);
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
