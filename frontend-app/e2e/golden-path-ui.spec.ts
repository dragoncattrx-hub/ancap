import { test, expect } from "@playwright/test";

import { createPasswordUserSession, seedAuthenticatedPage } from "./support/auth";

test("golden path UI: seller→listing→buy→grant→run→seller dashboard", async ({ page, request }) => {
  const baseUrl =
    process.env.PLAYWRIGHT_UI_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8080";
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8080/api/v1";

  const uniq = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const idk = () => `idk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sellerName = `Seller S ${uniq()}`;
  const strategyName = `Golden Path Strategy ${uniq()}`;

  const turnstileToken = process.env.PLAYWRIGHT_TURNSTILE_TOKEN;
  const { token, userData } = await createPasswordUserSession(request, {
    apiBase,
    displayName: "E2E Golden Path",
    emailPrefix: "e2e",
    turnstileToken,
  });
  await seedAuthenticatedPage(page, {
    baseUrl,
    apiBase,
    token,
    userData,
  });
  const authHeaders = { Authorization: `Bearer ${token}` };

  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "ancap_cookie_consent_v1",
        JSON.stringify({ necessary: true, analytics: false, marketing: false, savedAt: new Date().toISOString() }),
      );
    } catch {}
  });

  // Bootstrap seller agent + strategy + version via API, then exercise listing/buy/run flow through the UI.
  const sellerRes = await request.post(`${apiBase}/agents`, {
    headers: authHeaders,
    data: { display_name: sellerName, public_key: "x".repeat(32), roles: ["seller"] },
  });
  if (!sellerRes.ok()) throw new Error(`seller agent create failed: ${sellerRes.status()} ${await sellerRes.text()}`);
  const sellerAgentId = (await sellerRes.json()).id as string;

  const verticalsRes = await request.get(`${apiBase}/verticals`, { headers: authHeaders });
  if (!verticalsRes.ok()) throw new Error(`verticals failed: ${verticalsRes.status()} ${await verticalsRes.text()}`);
  const verticalsJson = await verticalsRes.json();
  const verticalId = verticalsJson.items?.[0]?.id as string | undefined;
  if (!verticalId) throw new Error("no vertical available for golden-path-ui test");

  const strategyRes = await request.post(`${apiBase}/strategies`, {
    headers: authHeaders,
    data: {
      name: strategyName,
      description: "Golden path UI e2e strategy",
      owner_agent_id: sellerAgentId,
      vertical_id: verticalId,
    },
  });
  if (!strategyRes.ok()) throw new Error(`strategy create failed: ${strategyRes.status()} ${await strategyRes.text()}`);
  const strategyId = (await strategyRes.json()).id as string;

  const poolRes = await request.post(`${apiBase}/pools`, {
    headers: authHeaders,
    data: {
      name: `Golden Path Pool ${uniq()}`,
      risk_profile: "experimental",
      owner_agent_id: sellerAgentId,
      rules: { mode: "demo", vertical_id: verticalId },
    },
  });
  if (!poolRes.ok()) throw new Error(`pool create failed: ${poolRes.status()} ${await poolRes.text()}`);

  const versionRes = await request.post(`${apiBase}/strategies/${strategyId}/versions`, {
    headers: authHeaders,
    data: {
      semver: "1.0.0",
      workflow: {
        vertical_id: verticalId,
        version: "1.0.0",
        steps: [{ id: "const", action: "const", args: { value: 1 }, save_as: "x" }],
      },
      changelog: "Initial e2e version",
    },
  });
  if (!versionRes.ok()) throw new Error(`version create failed: ${versionRes.status()} ${await versionRes.text()}`);

  const sellerFunding = await request.post(`${apiBase}/ledger/deposit`, {
    headers: { ...authHeaders, "Idempotency-Key": idk() },
    data: {
      account_owner_type: "agent",
      account_owner_id: sellerAgentId,
      amount: { amount: "100", currency: "USD" },
    },
  });
  if (!sellerFunding.ok()) throw new Error(`seller funding failed: ${sellerFunding.status()} ${await sellerFunding.text()}`);

  await page.goto(`${baseUrl}/strategies/${strategyId}`);
  await expect(page.getByRole("heading", { name: new RegExp(strategyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible({ timeout: 15000 });

  // Publish as listing
  await page.getByRole("button", { name: /publish listing/i }).click();
  await expect(page.getByRole("heading", { name: /publish/i })).toBeVisible({ timeout: 15000 });
  const publishModal = page.locator("div.card", { has: page.getByRole("heading", { name: /publish/i }) });
  // Fill labeled fields so the flow stays stable as the modal evolves.
  await publishModal.getByLabel(/price/i).fill("10");
  await publishModal.getByLabel(/^currency$/i).fill("USD");
  const publishBtn = publishModal.getByRole("button", { name: /^publish$/i });
  await expect(publishBtn).toBeEnabled({ timeout: 15000 });
  await Promise.all([
    page.waitForURL(/\/listings/, { timeout: 15000 }),
    publishBtn.click(),
  ]);

  const listingCard = page.locator('a.card[href^="/listings/"]', {
    has: page.getByRole("heading", { name: new RegExp(strategyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }),
  }).first();
  await expect(listingCard).toBeVisible({ timeout: 15000 });
  await listingCard.click();

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
      amount: { amount: "100", currency: "USD" },
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

  // Execute run after the run form fully hydrates and a pool/version are available.
  await expect(page.getByRole("heading", { name: /run strategy/i })).toBeVisible({ timeout: 15000 });
  const executeButton = page.getByRole("button", { name: /execute run/i });
  await expect(executeButton).toBeEnabled({ timeout: 15000 });
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

