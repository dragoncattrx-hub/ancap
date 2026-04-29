"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { agents, stakes, system } from "@/lib/api";

type StakeRow = {
  id: string;
  agent_id: string;
  amount_currency: string;
  amount_value: string;
  status: string;
  created_at: string;
  released_at?: string | null;
};

type AgentRow = { id: string; display_name: string };
type StakingEconomics = {
  enabled: boolean;
  currency: string;
  fees_share_percent: string;
  slash_share_percent: string;
  bootstrap_emission_daily: string;
  bootstrap_emission_cap_total: string;
  apy_floor_percent: string;
  apy_ceiling_percent: string;
  min_stake_for_rewards: string;
};

export default function StakingPage() {
  const [ownedAgents, setOwnedAgents] = useState<AgentRow[]>([]);
  const [items, setItems] = useState<StakeRow[]>([]);
  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [economics, setEconomics] = useState<StakingEconomics | null>(null);

  async function load() {
    setBusy(true);
    setError("");
    try {
      const mine = await agents.listMine(100);
      const rows = (mine?.items || []).map((x: any) => ({ id: String(x.id), display_name: String(x.display_name || x.id) }));
      setOwnedAgents(rows);
      const selected = agentId || rows[0]?.id || "";
      const econ = await system.stakingEconomics();
      setEconomics(econ);
      if (selected) {
        setAgentId(selected);
        const st = await stakes.list(selected);
        setItems(Array.isArray(st) ? st : []);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load staking data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createStake(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId) return;
    setBusy(true);
    setError("");
    try {
      await stakes.create({ agent_id: agentId, amount, currency: "ACP" });
      await load();
    } catch (e: any) {
      setError(e?.message || "Stake failed");
    } finally {
      setBusy(false);
    }
  }

  async function releaseStake(id: string) {
    setBusy(true);
    setError("");
    try {
      await stakes.release(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Release failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24, display: "grid", gap: 16 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>ACP Staking</h1>
          <p style={{ color: "var(--text-muted)" }}>Stake ACP from your agent accounts and release when needed.</p>
          <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
            <strong>How staking rewards work</strong>
            <div style={{ color: "var(--text-muted)", marginTop: 6, fontSize: "0.92rem" }}>
              Rewards are funded from real platform cashflows (fees + slashing), with a capped bootstrap emission.
              APY is dynamic and constrained by floor/ceiling to keep tokenomics sustainable.
            </div>
            {economics ? (
              <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Source: {economics.fees_share_percent}% fees + {economics.slash_share_percent}% slashes; bootstrap {economics.bootstrap_emission_daily} {economics.currency}/day
                (cap {economics.bootstrap_emission_cap_total}); APY range {economics.apy_floor_percent}% - {economics.apy_ceiling_percent}%;
                min stake {economics.min_stake_for_rewards} {economics.currency}.
              </div>
            ) : null}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={createStake} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
            <select className="input input-bordered w-full" value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
              <option value="">Select owned agent</option>
              {ownedAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.display_name}
                </option>
              ))}
            </select>
            <input className="input input-bordered w-full" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ACP" />
            <button className="btn btn-primary" type="submit" disabled={busy || !agentId}>
              {busy ? "Processing..." : "Stake ACP"}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Your stakes</h3>
            <button className="btn btn-ghost" onClick={load} disabled={busy}>
              Refresh
            </button>
          </div>
          {!items.length ? (
            <div style={{ color: "var(--text-muted)" }}>No stakes found.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {items.map((s) => (
                <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, background: "var(--bg)" }}>
                  <div><strong>{s.amount_value} {s.amount_currency}</strong></div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Status: {s.status}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{s.created_at}</div>
                  {s.status === "active" && (
                    <button className="btn btn-ghost" onClick={() => releaseStake(s.id)} disabled={busy} style={{ marginTop: 8 }}>
                      Release
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
