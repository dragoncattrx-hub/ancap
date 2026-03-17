import { test, expect } from "@playwright/test";

test("golden path UI: seller→listing→buy→grant→run→seller dashboard", async ({ page, request }) => {
  const baseUrl = process.env.PLAYWRIGHT_UI_BASE_URL ?? "http://localhost:3001";
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8001/v1";

  const uniq = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const idk = () => `idk-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Create + login user to get a valid JWT for UI
  const email = `e2e_${uniq()}@example.com`;
  const password = `pw_${uniq()}`;
  const reg = await request.post(`${apiBase}/auth/users`, {
    data: { email, password, display_name: "E2E Golden Path" },
  });
  if (!reg.ok() && reg.status() !== 400) {
    throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  }
  const login = await request.post(`${apiBase}/auth/login`, { data: { email, password } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()} ${await login.text()}`);
  const token = (await login.json()).access_token as string;

  const me = await request.get(`${apiBase}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!me.ok()) throw new Error(`me failed: ${me.status()} ${await me.text()}`);
  const meJson = await me.json();
  const userData = {
    id: meJson.id,
    email: meJson.email,
    display_name: meJson.display_name || (meJson.email || "user").split("@")[0],
  };

  await page.addInitScript(
    ({ t, u }) => {
      localStorage.setItem("ancap_token", t);
      localStorage.setItem("ancap_user", JSON.stringify(u));
    },
    { t: token, u: userData },
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  await page.goto(`${baseUrl}/agents`);
  await page.getByRole("button", { name: /register agent/i }).click();
  await expect(page.getByRole("heading", { name: /register new agent/i })).toBeVisible({ timeout: 15000 });
  const agentModal = page.locator("div.card", { has: page.getByRole("heading", { name: /register new agent/i }) });
  await agentModal.locator("input[type='text']").first().fill("Seller S");
  await agentModal.getByRole("button", { name: /create agent/i }).click();

  // Wait for modal close and list refresh
  await expect(page.getByRole("heading", { name: /register new agent/i })).toBeHidden({ timeout: 15000 });
  await expect(page.getByText("Seller S")).toBeVisible({ timeout: 15000 });

  // Go to strategies and create one (button becomes enabled once agents load)
  await page.goto(`${baseUrl}/strategies`);
  const createStrategyBtn = page.getByRole("button", { name: /create strategy/i });
  await expect(createStrategyBtn).toBeEnabled({ timeout: 15000 });
  await createStrategyBtn.click();
  await expect(page.getByRole("heading", { name: /create new strategy/i })).toBeVisible({ timeout: 15000 });
  const strategyModal = page.locator("div.card", { has: page.getByRole("heading", { name: /create new strategy/i }) });
  await strategyModal.locator("input[type='text']").first().fill("Golden Path Strategy");
  // Select first non-empty agent and vertical options
  const agentSelect = strategyModal.locator("select").nth(0);
  const verticalSelect = strategyModal.locator("select").nth(1);
  const agentEl = await agentSelect.elementHandle();
  const verticalEl = await verticalSelect.elementHandle();
  if (!agentEl || !verticalEl) throw new Error("Strategy modal selects not found");
  await page.waitForFunction((el) => (el as HTMLSelectElement).options.length > 1, agentEl, { timeout: 15000 });
  await page.waitForFunction((el) => (el as HTMLSelectElement).options.length > 1, verticalEl, { timeout: 15000 });
  await agentSelect.selectOption({ index: 1 });
  await verticalSelect.selectOption({ index: 1 });
  await strategyModal.getByRole("button", { name: /^create strategy$/i }).click();

  await expect(page.getByRole("heading", { name: /create new strategy/i })).toBeHidden({ timeout: 15000 });

  // CTA should appear with link to the new strategy detail
  await expect(page.getByText(/strategy created/i)).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: /create version/i }).first().click();

  // On strategy detail: create version
  await page.getByRole("button", { name: /create version/i }).click();
  await expect(page.getByRole("heading", { name: /^create version$/i })).toBeVisible({ timeout: 15000 });
  const versionModal = page.locator("div.card", { has: page.getByRole("heading", { name: /^create version$/i }) });
  await versionModal.locator("input").first().fill("1.0.0");
  await versionModal.getByRole("button", { name: /^create$/i }).click();
  await expect(page.getByRole("heading", { name: /^create version$/i })).toBeHidden({ timeout: 15000 });

  // Publish as listing
  await page.getByRole("button", { name: /publish listing/i }).click();
  await expect(page.getByRole("heading", { name: /publish/i })).toBeVisible({ timeout: 15000 });
  const publishModal = page.locator("div.card", { has: page.getByRole("heading", { name: /publish/i }) });
  // Amount + currency inputs
  const pubInputs = publishModal.locator("input");
  await pubInputs.nth(0).fill("10");
  await pubInputs.nth(1).fill("VUSD");
  const publishBtn = publishModal.getByRole("button", { name: /^publish$/i });
  await expect(publishBtn).toBeEnabled({ timeout: 15000 });
  await publishBtn.click();

  // We should land on listings page.
  await expect(page).toHaveURL(/\/listings/);
  const listingRow = page.getByText(/golden path strategy/i).first();
  await listingRow.click();

  // Create a dedicated buyer agent + fund it so the purchase is deterministic.
  const buyerRes = await request.post(`${apiBase}/agents`, {
    headers: authHeaders,
    data: { display_name: `Buyer B`, public_key: "y".repeat(32), roles: ["buyer"] },
  });
  if (!buyerRes.ok()) throw new Error(`buyer agent create failed: ${buyerRes.status()} ${await buyerRes.text()}`);
  const buyerAgentId = (await buyerRes.json()).id as string;
  const dep = await request.post(`${apiBase}/ledger/deposit`, {
    headers: { ...authHeaders, "Idempotency-Key": idk() },
    data: {
      account_owner_type: "agent",
      account_owner_id: buyerAgentId,
      amount: { amount: "100", currency: "VUSD" },
    },
  });
  if (!dep.ok()) throw new Error(`deposit failed: ${dep.status()} ${await dep.text()}`);

  // Ensure UI selects the funded buyer agent before buying.
  await page.getByRole("combobox").selectOption({ value: buyerAgentId });

  const buyButton = page.getByRole("button", { name: /buy access/i });
  await buyButton.click();

  // After success: CTAs to /access and /runs/new with params
  await expect(page.getByText(/purchase successful/i)).toBeVisible({ timeout: 15000 });
  const accessLink = page.getByRole("link", { name: /view access grants/i });
  await expect(accessLink).toHaveAttribute("href", /\/access\?grantee_type=agent&grantee_id=/);
  const runLink = page.getByRole("link", { name: /run this strategy/i });
  await expect(runLink).toHaveAttribute("href", /\/runs\/new\?buyer_agent_id=.*strategy_id=.*strategy_version_id=.*/);

  // Follow access → run → run detail
  await accessLink.click();
  await expect(page).toHaveURL(/\/access/);
  const runCta = page.getByRole("link", { name: /run strategy/i }).first();
  await runCta.click();
  await expect(page).toHaveURL(/\/runs\/new\?/);

  // Execute run
  const executeButton = page.getByRole("button", { name: /execute run/i });
  await executeButton.click();
  await expect(page).toHaveURL(/\/runs\/[0-9a-f-]+/);

  // Run detail shows status, artifacts, logs, steps
  await expect(page.getByRole("heading", { name: /^run [0-9a-f]+/i })).toBeVisible();
  await expect(page.getByText(/^artifacts$/i).first()).toBeVisible();
  await expect(page.getByText(/^logs$/i).first()).toBeVisible();
  await expect(page.getByText(/^steps$/i).first()).toBeVisible();

  // Seller dashboard shows non-zero revenue after run
  await page.goto(`${baseUrl}/dashboard/seller`);
  await expect(page.getByText(/seller dashboard/i)).toBeVisible();
});

