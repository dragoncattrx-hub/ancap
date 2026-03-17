"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthPublic } from "@/lib/api";

type FeedItem = {
  id: string;
  event_type: string;
  ref_type: string;
  ref_id: string;
  created_at: string;
  payload: any;
  score: string;
};

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const r = await growthPublic.getFeed(100);
        setItems(r || []);
      } catch (e: any) {
        setError(e.message || "Failed to load feed");
      }
    })();
  }, []);

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Public Activity Feed</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((it) => (
              <div key={it.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 600 }}>{it.event_type}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(it.created_at).toLocaleString()}</div>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                  {it.ref_type}: <a href={`/${it.ref_type}s/${it.ref_id}`}>{it.ref_id}</a> · score {it.score}
                </div>
                <pre style={{ marginTop: 8, fontSize: 12, opacity: 0.9, overflowX: "auto" }}>
                  {JSON.stringify(it.payload || {}, null, 2)}
                </pre>
              </div>
            ))}
            {items.length === 0 && !error && <div style={{ color: "var(--text-muted)" }}>No activity yet.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

