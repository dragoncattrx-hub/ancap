"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthDashboard } from "@/lib/api";

export default function GrowthDashboardPage() {
  const [days, setDays] = useState(7);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const r = await growthDashboard.metrics(days);
      setItems(r || []);
    } catch (e: any) {
      setError(e.message || "Failed to load growth metrics");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ marginTop: 0 }}>Growth Dashboard</h1>
            <select className="input" value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} style={{ width: 140 }}>
              <option value={7}>7d</option>
              <option value={14}>14d</option>
              <option value={30}>30d</option>
            </select>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <pre style={{ marginTop: 12, fontSize: 12, overflowX: "auto" }}>
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  );
}

