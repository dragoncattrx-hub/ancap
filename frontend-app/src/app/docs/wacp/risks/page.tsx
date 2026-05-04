import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata = {
  title: "wACP Risks",
  description: "Public risk disclosures for wACP and bridge usage.",
};

export default function WacpRisksDocsPage() {
  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP risks</h1>
              <span className="badge badge-active">Disclosures</span>
            </div>
            <ul style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>wACP is a wrapped representation of ACP on BNB Smart Chain.</li>
              <li>Redemption depends on bridge availability, operator correctness, and reserve backing.</li>
              <li>Bridge operators may pause minting or redemption during incidents.</li>
              <li>Smart contract, custody, RPC, chain reorg, and liquidity risks exist.</li>
              <li>PancakeSwap market price may diverge from ACP reference value.</li>
              <li>Do not trust unofficial token contracts or unofficial pair links.</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  );
}
