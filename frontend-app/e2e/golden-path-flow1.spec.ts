import { test, expect } from "@playwright/test";

function getAmount(bal: any, currency: string): number {
  const item = (bal?.balances || []).find((x: any) => x.currency === currency);
  const n = Number(item?.amount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

test("golden path flow1: idempotent buy → grant → idempotent run → seller balance increases", async ({ request }) => {
  const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:8000/v1";
  const price = 10;
  const currency = "VUSD";

  const flow = await request.post(`${apiBase}/flows/run`, {
    data: { flow_id: "flow1", seed: 4242, params: { one_time_price: String(price), currency } },
  });
  await expect(flow).toBeOK();
  const flowJson: any = await flow.json();

  const artifacts: any[] = flowJson.artifacts || [];
  const listingId = artifacts.find((a) => a.kind === "listing")?.id;
  const poolId = artifacts.find((a) => a.kind === "pool")?.id;
  const versionId = artifacts.find((a) => a.kind === "strategy_version")?.id;
  const buyerId = artifacts.find((a) => a.kind === "agent" && a.meta?.role === "buyer")?.id;
  const sellerId = artifacts.find((a) => a.kind === "agent" && a.meta?.role === "builder")?.id;

  expect(listingId).toBeTruthy();
  expect(poolId).toBeTruthy();
  expect(versionId).toBeTruthy();
  expect(buyerId).toBeTruthy();
  expect(sellerId).toBeTruthy();

  const balBeforeRes = await request.get(`${apiBase}/ledger/balance`, {
    params: { owner_type: "agent", owner_id: sellerId },
  });
  await expect(balBeforeRes).toBeOK();
  const balBefore = await balBeforeRes.json();
  const sellerBefore = getAmount(balBefore, currency);

  // Buy (twice with same idempotency key => same order)
  const idkOrder = `e2e-order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const orderBody = { listing_id: listingId, buyer_type: "agent", buyer_id: buyerId, payment_method: "ledger" };
  const o1 = await request.post(`${apiBase}/orders`, {
    data: orderBody,
    headers: { "Idempotency-Key": idkOrder },
  });
  await expect(o1).toBeOK();
  const o1j: any = await o1.json();

  const o2 = await request.post(`${apiBase}/orders`, {
    data: orderBody,
    headers: { "Idempotency-Key": idkOrder },
  });
  await expect(o2).toBeOK();
  const o2j: any = await o2.json();
  expect(o2j.id).toBe(o1j.id);

  // Grant exists for buyer
  const listingRes = await request.get(`${apiBase}/listings/${encodeURIComponent(listingId)}`);
  await expect(listingRes).toBeOK();
  const listing: any = await listingRes.json();

  const grantsRes = await request.get(`${apiBase}/access/grants`, {
    params: { limit: 50, grantee_type: "agent", grantee_id: buyerId },
  });
  await expect(grantsRes).toBeOK();
  const grants: any = await grantsRes.json();
  const hasGrant = (grants.items || []).some((g: any) => g.strategy_id === listing.strategy_id && g.scope === "execute");
  expect(hasGrant).toBeTruthy();

  // Run (twice with same idempotency key => same run)
  const idkRun = `e2e-run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const runBody = {
    strategy_version_id: versionId,
    pool_id: poolId,
    params: { _start_equity: 1000 },
    limits: {},
    dry_run: true,
    run_mode: "mock",
  };
  const r1 = await request.post(`${apiBase}/runs`, { data: runBody, headers: { "Idempotency-Key": idkRun } });
  await expect(r1).toBeOK();
  const r1j: any = await r1.json();
  const r2 = await request.post(`${apiBase}/runs`, { data: runBody, headers: { "Idempotency-Key": idkRun } });
  await expect(r2).toBeOK();
  const r2j: any = await r2.json();
  expect(r2j.id).toBe(r1j.id);

  const balAfterRes = await request.get(`${apiBase}/ledger/balance`, {
    params: { owner_type: "agent", owner_id: sellerId },
  });
  await expect(balAfterRes).toBeOK();
  const balAfter = await balAfterRes.json();
  const sellerAfter = getAmount(balAfter, currency);

  expect(sellerAfter).toBeGreaterThanOrEqual(sellerBefore + price);
});

