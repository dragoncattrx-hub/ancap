import { Navigation } from "@/components/Navigation";
import { WacpPublicActions } from "@/components/WacpPublicActions";

export const metadata = {
  title: "wACP Contracts",
  description: "Official contracts, reserve addresses and verification status for wACP.",
};

export default function WacpContractsDocsPage() {
  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP contracts</h1>
              <span className="badge badge-info">Official addresses</span>
            </div>
            <div style={{ display: "grid", gap: 12, color: "var(--text-muted)", lineHeight: 1.75 }}>
              <div><strong style={{ color: "var(--text)" }}>wACP contract:</strong> 0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402</div>
              <div><strong style={{ color: "var(--text)" }}>Bridge / gateway contract:</strong> 0x57c24FF77B23a82328cb88914D4FD4EEBd93321b</div>
              <div><strong style={{ color: "var(--text)" }}>ACP reserve address:</strong> acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz</div>
              <div><strong style={{ color: "var(--text)" }}>Chain IDs:</strong> ACP native chain / BNB Smart Chain (56)</div>
              <div><strong style={{ color: "var(--text)" }}>Verification:</strong> BscScan source match completed for the production wACP contract</div>
              <div><strong style={{ color: "var(--text)" }}>Pool:</strong> 0xF391ca2bcBaB93Afa23326ebF1e35DB950841601</div>
              <div><strong style={{ color: "var(--text)" }}>Warning:</strong> pool is currently a technical liquidity bootstrap, not deep-liquidity market infrastructure.</div>
              <div style={{ marginTop: 8 }}>
                <WacpPublicActions layout="home" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
