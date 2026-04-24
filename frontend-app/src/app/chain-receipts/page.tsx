"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { settlements } from "@/lib/api";

export default function ChainReceiptsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const r = await settlements.listReceipts(200);
      setItems(r.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load receipts");
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
          <h1 style={{ marginTop: 0 }}>Chain Receipts Inspector</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Verifiable receipt metadata (tx hash + node signature/public key).
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ overflowX: "auto" }}>
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Tx Hash</th>
                  <th>Node Signature</th>
                  <th>Verifier key</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td>{x.chain_id}</td>
                    <td>{x.status}</td>
                    <td>{x.tx_hash || "-"}</td>
                    <td>{x.node_signature ? "valid metadata" : "missing"}</td>
                    <td>{x.node_public_key || "-"}</td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                      No chain receipts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

