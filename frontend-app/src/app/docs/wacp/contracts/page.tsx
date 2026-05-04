import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata = {
  title: "wACP Contracts",
  description: "Official contracts, reserve addresses and verification status for wACP.",
};

export default function WacpContractsDocsPage() {
  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP contracts</h1>
              <span className="badge badge-info">Official addresses</span>
            </div>
            <div style={{ display: "grid", gap: 12, color: "var(--text-muted)", lineHeight: 1.75 }}>
              <div><strong style={{ color: "var(--text)" }}>wACP contract:</strong> publish final BSC mainnet production address here</div>
              <div><strong style={{ color: "var(--text)" }}>Bridge / gateway contract:</strong> publish final BSC gateway address here</div>
              <div><strong style={{ color: "var(--text)" }}>ACP reserve address:</strong> publish canonical reserve custody address here</div>
              <div><strong style={{ color: "var(--text)" }}>Chain IDs:</strong> ACP native chain / BNB Smart Chain (56)</div>
              <div><strong style={{ color: "var(--text)" }}>Verification:</strong> mark BscScan verification status here once confirmed</div>
              <div><strong style={{ color: "var(--text)" }}>Warning:</strong> until this page is fully populated, users should treat discovery-only tokens as unsafe.</div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
