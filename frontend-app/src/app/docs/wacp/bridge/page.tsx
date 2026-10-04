import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "wACP Bridge",
  description: "Public bridge flow documentation for ACP <-> wACP.",
};

export default function WacpBridgeDocsPage() {
  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP bridge</h1>
              <span className="badge badge-active">ACP ↔ BSC</span>
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              Wrap ratio (cutover 2026-10-04): <strong style={{ color: "var(--text)" }}>1 ACP ↔ 10 wACP</strong>.
              Forward: lock ACP → mint 10× wACP. Reverse: burn 10 wACP → redeem 1 ACP (floor; dust remainder stays on BSC).
              Pre-cutover mints used 1:1 — redeem after cutover follows the new ratio (see{" "}
              <a href="/legal/risk">/legal/risk</a>).
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              Forward ACP → BSC: create intent, send ACP to reserve, wait for confirmations, BSC mint.
              Reverse BSC → ACP redeem is live (burn detection, payout submission, ACP confirmation, reconciliation).
            </p>
            <ol style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>Create bridge intent</li>
              <li>Send ACP deposit</li>
              <li>Wait for ACP confirmations</li>
              <li>Submit BSC mint</li>
              <li>Confirm BSC mint</li>
              <li>Track the ACP deposit tx and BSC mint tx in public explorers</li>
            </ol>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: "1px solid rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)", color: "var(--text-muted)", lineHeight: 1.75 }}>
              <strong style={{ color: "var(--text)" }}>Reverse rail status:</strong> BSC → ACP redeem is live. The backend detects `ReleaseRequested` burns, submits ACP payouts, and confirms on-chain. Reconciliation tracks outstanding liabilities. Admin endpoints require platform-admin auth + `X-Bridge-Operator-Secret`.
            </div>
            <div style={{ marginTop: 16, color: "var(--text-muted)", lineHeight: 1.75 }}>
              Markets:{" "}
              <a href="https://pancakeswap.finance/liquidity/pool/bsc/0xe626bd3ef516c4f784e5d5fb46e297d9c0d7f5e1" target="_blank" rel="noreferrer">V3 bootstrap (shallow)</a>
              {" · "}
              <a href="https://pancakeswap.finance/liquidity/pool/bsc/0xF391ca2bcBaB93Afa23326ebF1e35DB950841601" target="_blank" rel="noreferrer">V2 reference / oracle</a>
              . Spend path: <a href="/buy-acp">/buy-acp</a>.
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
