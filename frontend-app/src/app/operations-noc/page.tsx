"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { autonomy } from "@/lib/api";

export default function OperationsNocPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const r = await autonomy.anomalies();
      setItems(r.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load anomalies");
    }
  }

  async function apply(action: string) {
    try {
      await autonomy.applyRemediation(action);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to apply remediation");
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
          <h1 style={{ marginTop: 0 }}>Operations NOC</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((x) => (
              <div key={x.id} className="card">
                <strong>{x.id}</strong> — {x.severity}
                <div style={{ color: "var(--text-muted)" }}>{x.suggested_remediation}</div>
                <button className="btn btn-primary" onClick={() => apply(x.suggested_remediation)}>Apply remediation</button>
              </div>
            ))}
            {!items.length && <div style={{ color: "var(--text-muted)" }}>No active anomalies.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

