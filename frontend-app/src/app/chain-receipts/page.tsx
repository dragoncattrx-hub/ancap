"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { settlements } from "@/lib/api";

export default function ChainReceiptsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const r = await settlements.listReceipts(200);
      setItems(r.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ marginTop: 0, marginBottom: 0 }}>Chain Receipts Inspector</h1>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p style={{ color: "var(--text-muted)" }}>
            On-chain settlement receipts with correlation IDs, status, and verifier metadata.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ overflowX: "auto" }}>
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Tx Hash</th>
                  <th>Correlation ID</th>
                  <th>Finalized</th>
                  <th>Verifier</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td>{x.chain_id}</td>
                    <td>{x.status}</td>
                    <td>{x.tx_hash || "-"}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {x.correlation_id || "-"}
                    </td>
                    <td>{x.finalized_at ? new Date(x.finalized_at).toLocaleString() : "-"}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {x.node_public_key || (x.node_signature ? "signature only" : "missing")}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                      {loading ? "Loading receipts..." : "No chain receipts yet. They will appear after settlement actions (orders/runs/stake flows)."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Total receipts: {items.length}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

