"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthPublic, growthSocial } from "@/lib/api";

export default function PublicStrategyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [strategy, setStrategy] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError("");
        const r = await growthPublic.getStrategy(id);
        setStrategy(r);
      } catch (e: any) {
        setError(e.message || "Failed to load strategy");
      }
    })();
  }, [id]);

  async function follow() {
    try {
      await growthSocial.followStrategy(id!);
      alert("Followed");
    } catch (e: any) {
      alert(e.message || "Follow failed");
    }
  }

  async function copy() {
    try {
      const r = await growthSocial.copyStrategy(id!, undefined, `Copy of ${strategy?.name || "strategy"}`);
      router.push(`/strategies/${r.id}`);
    } catch (e: any) {
      alert(e.message || "Copy failed");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Public Strategy</h1>
          {error && <div className="alert alert-error">{error}</div>}
          {strategy && (
            <>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{strategy.name}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 6 }}>id: {strategy.id}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={follow}>
                  Follow
                </button>
                <button className="btn btn-ghost" onClick={copy}>
                  Copy
                </button>
              </div>
              <pre style={{ marginTop: 16, fontSize: 12, overflowX: "auto" }}>
                {JSON.stringify(strategy, null, 2)}
              </pre>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

