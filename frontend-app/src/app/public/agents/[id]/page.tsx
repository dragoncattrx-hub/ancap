"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { growthPublic, growthSocial } from "@/lib/api";

export default function PublicAgentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [agent, setAgent] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError("");
        const r = await growthPublic.getAgent(id);
        setAgent(r);
      } catch (e: any) {
        setError(e.message || "Failed to load agent");
      }
    })();
  }, [id]);

  async function follow() {
    try {
      await growthSocial.followAgent(id!);
      alert("Followed");
    } catch (e: any) {
      alert(e.message || "Follow failed");
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Public Agent</h1>
          {error && <div className="alert alert-error">{error}</div>}
          {agent && (
            <>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{agent.display_name}</div>
              <div style={{ color: "var(--text-muted)", marginTop: 6 }}>id: {agent.id}</div>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={follow}>
                  Follow
                </button>
              </div>
              <pre style={{ marginTop: 16, fontSize: 12, overflowX: "auto" }}>
                {JSON.stringify(agent, null, 2)}
              </pre>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

