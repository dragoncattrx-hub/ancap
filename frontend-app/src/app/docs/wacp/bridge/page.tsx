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
              <span className="badge badge-active">ACP → BSC</span>
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              The intended bridge flow is: user creates an ACP → wACP bridge intent, sends ACP to the reserve path, the backend waits for
              confirmations, then submits the BSC mint transaction for wACP. The reverse redeem direction should only be called live after
              redeem controls, reserve proof, and pause handling are fully verified.
            </p>
            <ol style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>Create bridge intent</li>
              <li>Send ACP deposit</li>
              <li>Wait for ACP confirmations</li>
              <li>Submit BSC mint</li>
              <li>Confirm BSC mint</li>
              <li>Track the ACP deposit tx and BSC mint tx in public explorers</li>
            </ol>
          </div>
        </main>
      </div>
    </>
  );
}
