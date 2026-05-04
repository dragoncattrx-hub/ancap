import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata = {
  title: "wACP Bridge",
  description: "Public bridge flow documentation for ACP <-> wACP.",
};

export default function WacpBridgeDocsPage() {
  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP bridge</h1>
              <span className="badge badge-active">ACP ↔ BSC</span>
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              The live direction today is ACP → BSC minting: user creates an ACP → wACP bridge intent, sends ACP to the reserve path, the backend waits for
              confirmations, then submits the BSC mint transaction for wACP. The reverse redeem direction BSC → ACP is part of the intended bridge design,
              but should only be called live after burn watcher confirmation, payout idempotency, reserve proof, and pause handling are fully verified.
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
              <strong style={{ color: "var(--text)" }}>Reverse rail status:</strong> BSC → ACP redeem is planned, contract-supported, and wanted by the project,
              but still in pending rollout status. Public docs will switch to live redeem instructions only after the backend can safely detect burn requests,
              deduplicate them, and produce exactly-once ACP payouts.
            </div>
            <div style={{ marginTop: 16, color: "var(--text-muted)", lineHeight: 1.75 }}>
              Current public market bootstrap: <a href="https://pancakeswap.finance/liquidity/pool/bsc/0xF391ca2bcBaB93Afa23326ebF1e35DB950841601" target="_blank" rel="noreferrer">wACP/USDT PancakeSwap V2 pool</a>.
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
