import { test, expect } from "@playwright/test";

test("contracts UI: accept + complete triggers payout", async ({ page, request }) => {
  const baseUrl = process.env.PLAYWRIGHT_UI_BASE_URL ?? "http://localhost:3001";
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://127.0.0.1:8001/v1";

  const idk = () => `idk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const uniq = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Create + login user to get a valid JWT for UI
  const email = `e2e_${uniq()}@example.com`;
  const password = `pw_${uniq()}`;
  const reg = await request.post(`${apiBase}/auth/users`, {
    data: { email, password, display_name: "E2E Contracts" },
  });
  if (!reg.ok() && reg.status() !== 400) {
    throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
  }
  const login = await request.post(`${apiBase}/auth/login`, {
    data: { email, password },
  });
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

  // Create employer + worker agents
  const employerRes = await request.post(`${apiBase}/agents`, {
    headers: authHeaders,
    data: { display_name: `Employer-${Date.now()}`, public_key: "x".repeat(32), roles: ["seller"] },
  });
  if (!employerRes.ok()) throw new Error(`agents create failed: ${employerRes.status()} ${await employerRes.text()}`);
  const employer = (await employerRes.json()).id as string;

  const workerRes = await request.post(`${apiBase}/agents`, {
    headers: authHeaders,
    data: { display_name: `Worker-${Date.now()}`, public_key: "y".repeat(32), roles: ["buyer"] },
  });
  if (!workerRes.ok()) throw new Error(`agents create failed: ${workerRes.status()} ${await workerRes.text()}`);
  const worker = (await workerRes.json()).id as string;

  // Fund employer
  const dep = await request.post(`${apiBase}/ledger/deposit`, {
    headers: { "Idempotency-Key": idk() },
    data: {
      account_owner_type: "agent",
      account_owner_id: employer,
      amount: { amount: "20", currency: "VUSD" },
    },
  });
  if (!dep.ok()) throw new Error(`deposit failed: ${dep.status()} ${await dep.text()}`);

  // Create contract (will start as proposed since no user context)
  const cRes = await request.post(`${apiBase}/contracts`, {
    headers: authHeaders,
    data: {
      employer_agent_id: employer,
      worker_agent_id: worker,
      scope_type: "generic",
      scope_ref_id: null,
      title: "E2E contract",
      description: "Test payout on complete",
      payment_model: "fixed",
      fixed_amount_value: "5",
      currency: "VUSD",
      max_runs: 1,
      risk_policy_id: null,
      created_from_order_id: null,
    },
  });
  if (!cRes.ok()) throw new Error(`contract create failed: ${cRes.status()} ${await cRes.text()}`);
  const contract = await cRes.json();
  const contractId = contract.id as string;
  expect(["draft", "proposed"]).toContain(contract.status);

  // Sanity: frontend proxy should be able to read the contract
  const proxyGet = await request.get(`${baseUrl}/api/v1/contracts/${contractId}`, {
    headers: authHeaders,
  });
  if (!proxyGet.ok()) {
    throw new Error(`proxy contract get failed: ${proxyGet.status()} ${await proxyGet.text()}`);
  }

  // Accept via UI and complete to trigger payout
  await page.goto(`${baseUrl}/contracts/${contractId}`);
  if (contract.status === "draft") {
    await page.getByRole("button", { name: /propose/i }).click();
    await expect(page.getByText(/status:\s*proposed/i)).toBeVisible();
  }
  await page.getByRole("button", { name: /^accept$/i }).click();
  await expect(page.getByText(/status:\s*active/i)).toBeVisible({ timeout: 15000 });

  // Ledger should contain escrow event for this contract
  const escrowEvents = await request.get(`${apiBase}/ledger/events?limit=200&type=contract_escrow`, {
    headers: authHeaders,
  });
  if (!escrowEvents.ok()) {
    throw new Error(`ledger events (escrow) failed: ${escrowEvents.status()} ${await escrowEvents.text()}`);
  }
  const escrowJson = await escrowEvents.json();
  const hasEscrow = (escrowJson.items || []).some((e: any) => e?.metadata?.contract_id === contractId);
  expect(hasEscrow).toBeTruthy();

  await page.getByRole("button", { name: /mark completed & payout/i }).click();
  await expect(page.getByText(/status:\s*completed/i)).toBeVisible({ timeout: 15000 });

  // New UI blocks should be visible (runs list may be empty for fixed contracts)
  await expect(page.getByText(/^runs$/i)).toBeVisible();
  await expect(page.getByText(/^activity$/i)).toBeVisible();

  const payoutEvents = await request.get(`${apiBase}/ledger/events?limit=200&type=contract_payout`, {
    headers: authHeaders,
  });
  if (!payoutEvents.ok()) {
    throw new Error(`ledger events (payout) failed: ${payoutEvents.status()} ${await payoutEvents.text()}`);
  }
  const payoutJson = await payoutEvents.json();
  const hasPayout = (payoutJson.items || []).some((e: any) => e?.metadata?.contract_id === contractId);
  expect(hasPayout).toBeTruthy();

  // Verify worker balance increased
  const balRes = await request.get(`${apiBase}/ledger/balance?owner_type=agent&owner_id=${worker}`);
  if (!balRes.ok()) throw new Error(`balance failed: ${balRes.status()} ${await balRes.text()}`);
  const bal = await balRes.json();
  const vusd = (bal.balances || []).find((b: any) => b.currency === "VUSD");
  const amt = Number(vusd?.amount || "0");
  expect(amt).toBeGreaterThanOrEqual(5);
});

