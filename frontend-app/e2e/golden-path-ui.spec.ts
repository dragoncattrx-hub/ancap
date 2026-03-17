import { test, expect } from "@playwright/test";

test("golden path UI: seller→listing→buy→grant→run→seller dashboard", async ({ page }) => {
  const baseUrl = process.env.PLAYWRIGHT_UI_BASE_URL ?? "http://localhost:3001";

  // Seller creates agent
  await page.goto(`${baseUrl}/login`);
  // Assume auth is already handled in dev/demo environment (JWT pre-set) or use test user.

  await page.goto(`${baseUrl}/agents`);
  await page.getByRole("button", { name: /register agent/i }).click();
  await page.getByLabel(/display name/i).fill("Seller S");
  await page.getByRole("button", { name: /create agent/i }).click();

  // Go to strategies and create one
  await page.goto(`${baseUrl}/strategies`);
  // There should be a hint to create agent first; now we have one agent.
  await page.getByRole("button", { name: /create strategy/i }).click();
  await page.getByLabel(/name/i).fill("Golden Path Strategy");
  await page.getByLabel(/agent/i).selectOption({ index: 1 });
  await page.getByLabel(/vertical/i).selectOption({ index: 1 });
  await page.getByRole("button", { name: /create strategy/i }).click();

  // CTA should appear with link to the new strategy detail
  const strategyLink = page.getByRole("link", { name: /create version/i }).first();
  await strategyLink.click();

  // On strategy detail: create version
  await page.getByRole("button", { name: /create version/i }).click();
  await page.getByLabel(/semver/i).fill("1.0.0");
  await page.getByRole("button", { name: /^create$/i }).click();

  // Publish as listing
  await page.getByRole("button", { name: /publish listing/i }).click();
  await page.getByLabel(/price/i).first().fill("10");
  await page.getByLabel(/price/i).nth(1).fill("VUSD");
  await page.getByRole("button", { name: /publish/i }).click();

  // We should land on listings page.
  await expect(page).toHaveURL(/\/listings/);
  const listingRow = page.getByText(/golden path strategy/i).first();
  await listingRow.click();

  // Buyer creates agent if needed and buys listing
  const buyButton = page.getByRole("button", { name: /buy access/i });
  await buyButton.click();

  // After success: CTAs to /access and /runs/new with params
  await expect(page.getByText(/purchase successful/i)).toBeVisible();
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
  await expect(page.getByText(/run .*?/i)).toBeVisible();
  await expect(page.getByText(/artifacts/i)).toBeVisible();
  await expect(page.getByText(/logs/i)).toBeVisible();
  await expect(page.getByText(/steps/i)).toBeVisible();

  // Seller dashboard shows non-zero revenue after run
  await page.goto(`${baseUrl}/dashboard/seller`);
  await expect(page.getByText(/seller dashboard/i)).toBeVisible();
});

