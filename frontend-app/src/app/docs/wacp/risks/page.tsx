import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "wACP Risks",
  description: "Public risk disclosures for wACP and bridge usage.",
};

export default function WacpRisksDocsPage() {
  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP risks</h1>
              <span className="badge badge-active">Disclosures</span>
            </div>
            <ul style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>wACP is a wrapped representation of ACP on BNB Smart Chain at <strong>1 ACP ↔ 10 wACP</strong>.</li>
              <li>Cutover 2026-10-04: pre-cutover wraps were 1:1; after cutover redeem pays 1 ACP per 10 wACP.</li>
              <li>Redemption depends on bridge availability, operator correctness, and reserve backing.</li>
              <li>Bridge operators may pause minting or redemption during incidents.</li>
              <li>Smart contract, custody, RPC, chain reorg, and liquidity risks exist.</li>
              <li>PancakeSwap wACP/USDT price may diverge from ACP accounting value (ACP ≈ 10 × wACP USD).</li>
              <li>Do not trust unofficial token contracts or unofficial pair links.</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
