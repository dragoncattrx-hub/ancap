import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";

export const metadata = {
  title: "wACP Docs",
  description: "Wrapped ACP overview, bridge model, reserve model and public risk disclosures.",
};

export default function WacpDocsOverviewPage() {
  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <main className="container" style={{ padding: "48px 24px 72px" }}>
          <section style={{ padding: "24px 0 32px" }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="section-num" style={{ marginBottom: 10 }}>wACP</div>
                  <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, margin: 0 }}>Wrapped ACP docs</h1>
                </div>
                <span className="badge badge-active">Public docs</span>
              </div>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.75, marginTop: 16, maxWidth: 900 }}>
                wACP is the BNB Smart Chain representation of ACP. This documentation set is the public trust layer for bridge users:
                what the asset is, how reserve backing is supposed to work, what contracts are official, and what risks remain.
              </p>
            </div>
          </section>

          <section className="responsive-grid responsive-grid-2" style={{ gap: 16 }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Read next</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                <li><Link href="/docs/wacp/bridge">Bridge flow</Link></li>
                <li><Link href="/docs/wacp/reserve">Reserve proof model</Link></li>
                <li><Link href="/docs/wacp/risks">Risk disclosures</Link></li>
                <li><Link href="/docs/wacp/contracts">Contracts and official addresses</Link></li>
                <li><Link href="/docs/wacp/pancakeswap">PancakeSwap listing playbook</Link></li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Current public state</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, color: "var(--text-muted)" }}>
                <li>wACP bridge UI exists at <code>/bridge/acp-bsc</code></li>
                <li>ACP deposit tx viewer exists at <code>/acp/tx/[txid]</code></li>
                <li>Public API status endpoints are live at <code>/api/v1/wacp/status</code> and <code>/api/v1/wacp/reserve-proof</code></li>
                <li>PancakeSwap V2 technical liquidity bootstrap for <code>wACP/USDT</code> is live; metadata/logo review is still external and pending</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
