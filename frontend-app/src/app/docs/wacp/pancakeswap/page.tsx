import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata = {
  title: "wACP PancakeSwap",
  description: "PancakeSwap launch and listing playbook for wACP.",
};

export default function WacpPancakeDocsPage() {
  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <div className="card">
            <div className="card-header">
              <h1 style={{ margin: 0, fontWeight: 800 }}>wACP → PancakeSwap</h1>
              <span className="badge badge-active">Playbook</span>
            </div>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
              Use PancakeSwap V2 first. Prefer <code>wACP/USDT</code> as the initial pair. Do not optimize for homepage placement first;
              optimize for verified contracts, reserve proof, safe liquidity, and canonical links.
            </p>
            <ol style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
              <li>Finalize and verify the production wACP contract on BSC mainnet</li>
              <li>Publish reserve / bridge / risk / contracts docs</li>
              <li>Expose public reserve proof and status endpoints</li>
              <li>Create the pair on PancakeSwap V2</li>
              <li>Add initial liquidity conservatively</li>
              <li>Test both swap directions</li>
              <li>Submit metadata / logo via PancakeSwap’s current official process</li>
            </ol>
          </div>
        </main>
      </div>
    </>
  );
}
