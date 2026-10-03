import Link from "next/link";
import { Navigation } from "@/components/Navigation";

export const metadata = {
  title: "ACP Explorer API",
  description: "Public Blockchair-style ACP chain explorer on ancap.cloud",
};

const ENDPOINTS = [
  ["GET /api/v1/acp/explorer/status", "Tip height, best hash, lean protocol metadata"],
  ["GET /api/v1/acp/explorer/search?q=", "Universal search: height | block hash | txid | acp1 address"],
  ["GET /api/v1/acp/explorer/blocks", "Paginated recent blocks (?limit=&before_height=)"],
  ["GET /api/v1/acp/explorer/block/{id}", "Block by height or hash + txid list"],
  ["GET /api/v1/acp/explorer/tx/{txid}", "Structured inputs/outputs (?view=full|redacted)"],
  ["GET /api/v1/acp/explorer/address/{addr}", "Balance, UTXOs, indexed history"],
  ["GET /api/v1/acp/explorer/mempool", "Mempool info + txids + fee estimate"],
  ["GET /api/v1/acp/explorer/stats", "UTXO set, tokenomics, free-distribution, index watermark"],
];

export default function AcpExplorerDocsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container" style={{ padding: "48px 24px 72px" }}>
        <div className="card">
          <div className="card-header">
            <h1 style={{ margin: 0, fontWeight: 800 }}>ACP Explorer</h1>
            <span className="badge badge-active">Public</span>
          </div>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.75 }}>
            Blockchair-style read surface for the ACP lean chain. UI at{" "}
            <Link href="/explorer">/explorer</Link>. Canonical transaction links use{" "}
            <code>/explorer/tx/&#123;txid&#125;</code> (<code>/acp/tx/…</code> redirects there).
          </p>
          <h2 style={{ marginTop: 28, fontWeight: 700 }}>UI routes</h2>
          <ul style={{ lineHeight: 1.9, color: "var(--text-muted)" }}>
            <li>
              <Link href="/explorer">/explorer</Link> — search, tip stats, latest blocks
            </li>
            <li>/explorer/block/[height|hash]</li>
            <li>/explorer/tx/[txid]</li>
            <li>/explorer/address/[acp1…]</li>
            <li>
              <Link href="/explorer/mempool">/explorer/mempool</Link>
            </li>
            <li>
              <Link href="/explorer/stats">/explorer/stats</Link>
            </li>
          </ul>
          <h2 style={{ marginTop: 28, fontWeight: 700 }}>JSON API</h2>
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {ENDPOINTS.map(([path, desc]) => (
              <div key={path} style={{ color: "var(--text-muted)" }}>
                <code style={{ color: "var(--text)" }}>{path}</code>
                <div style={{ marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 28, color: "var(--text-muted)", lineHeight: 1.75 }}>
            Address history is filled by <code>acp_explorer_index</code> on{" "}
            <code>POST /v1/system/jobs/tick</code>. Node RPC is not exposed to browsers — only this
            backend proxy.
          </p>
        </div>
      </main>
    </div>
  );
}
