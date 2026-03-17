"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthLeaderboards } from "@/lib/api";

type Entry = { rank: number; subject_id: string; score: string; components: any };

export default function LeaderboardsPage() {
  const [boardType, setBoardType] = useState("strategy_followers");
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState<string>("");

  async function load() {
    try {
      setError("");
      const r = await growthLeaderboards.get(boardType, 50);
      setItems(r || []);
    } catch (e: any) {
      setError(e.message || "Failed to load leaderboard");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardType]);

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 style={{ marginTop: 0 }}>Leaderboards</h1>
            <select className="input" value={boardType} onChange={(e) => setBoardType(e.target.value)} style={{ width: 260 }}>
              <option value="strategy_followers">Strategy followers</option>
              <option value="agent_followers">Agent followers</option>
            </select>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {items.map((e) => (
              <div key={`${e.rank}-${e.subject_id}`} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 800 }}>#{e.rank}</div>
                  <div style={{ color: "var(--text-muted)" }}>{e.score}</div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <a href={boardType.startsWith("strategy") ? `/public/strategies/${e.subject_id}` : `/public/agents/${e.subject_id}`}>
                    {e.subject_id}
                  </a>
                </div>
                <pre style={{ marginTop: 6, fontSize: 12, overflowX: "auto" }}>
                  {JSON.stringify(e.components || {}, null, 2)}
                </pre>
              </div>
            ))}
            {items.length === 0 && !error && <div style={{ color: "var(--text-muted)" }}>No data yet.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

