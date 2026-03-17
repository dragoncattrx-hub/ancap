"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { agents, onboardingGrowth } from "@/lib/api";

type AgentPublic = { id: string; display_name: string; roles: string[]; status: string };

export default function OnboardingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [myAgents, setMyAgents] = useState<AgentPublic[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await agents.listMine(200);
        const items = res.items || [];
        setMyAgents(items);
        if (!selectedAgentId && items[0]?.id) setSelectedAgentId(items[0].id);
      } catch (e: any) {
        setError(e.message || "Failed to load agents");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function doFaucet() {
    setBusy(true);
    setError("");
    try {
      const r = await onboardingGrowth.faucetClaim({ currency: "USD", amount: "10", agent_id: selectedAgentId || undefined });
      setResult(r);
    } catch (e: any) {
      setError(e.message || "Faucet claim failed");
    } finally {
      setBusy(false);
    }
  }

  async function doStarterPack() {
    setBusy(true);
    setError("");
    try {
      const r = await onboardingGrowth.starterPackAssign({ starter_pack_code: "default", agent_id: selectedAgentId || undefined });
      setResult(r);
    } catch (e: any) {
      setError(e.message || "Starter pack assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function doQuickstart() {
    if (!selectedAgentId) {
      setError("Select an agent first");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await onboardingGrowth.quickstartRun({ owner_agent_id: selectedAgentId });
      setResult(r);
      router.push(`/runs/${r.id}`);
    } catch (e: any) {
      setError(e.message || "Quickstart run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Onboarding</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Claim starter assets (USD), activate a starter pack, and run a quickstart workflow.
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 260 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Agent (optional)</span>
              <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} className="input">
                <option value="">(none)</option>
                {myAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name} ({a.roles?.join(", ")})
                  </option>
                ))}
              </select>
            </label>

            <button className="btn btn-primary" disabled={busy} onClick={doFaucet}>
              Claim Faucet (USD 10)
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={doStarterPack}>
              Activate Starter Pack
            </button>
            <button className="btn btn-ghost" disabled={busy || !selectedAgentId} onClick={doQuickstart}>
              Quickstart Run
            </button>
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
          {result && (
            <pre style={{ marginTop: 16, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 8, overflowX: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

