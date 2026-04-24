"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { evolution } from "@/lib/api";

export default function EvolutionPage() {
  const [strategyId, setStrategyId] = useState("");
  const [mutationType, setMutationType] = useState("change_param");
  const [diffSpec, setDiffSpec] = useState("{\"param\":\"value\"}");
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function submitMutation(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      await evolution.createMutation({
        parent_strategy_id: strategyId,
        mutation_type: mutationType,
        diff_spec: JSON.parse(diffSpec || "{}"),
      });
      const rows = await evolution.lineage(strategyId);
      setItems(rows || []);
    } catch (e: any) {
      setError(e?.message || "Failed to create mutation");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Evolution Studio</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Create mutation proposals and inspect strategy lineage.
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submitMutation} style={{ display: "grid", gap: 10 }}>
            <input className="input" placeholder="Parent strategy ID" value={strategyId} onChange={(e) => setStrategyId(e.target.value)} />
            <select className="input" value={mutationType} onChange={(e) => setMutationType(e.target.value)}>
              <option value="change_param">change_param</option>
              <option value="add_step">add_step</option>
              <option value="crossover">crossover</option>
            </select>
            <textarea className="input" rows={5} value={diffSpec} onChange={(e) => setDiffSpec(e.target.value)} />
            <button className="btn btn-primary" type="submit">Propose mutation</button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Lineage</h3>
          <pre style={{ margin: 0, fontSize: 12, overflowX: "auto" }}>{JSON.stringify(items, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

