"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { decisionLogs, referrals, governance } from "@/lib/api";

export default function AiConsolePage() {
  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [graphPreview, setGraphPreview] = useState<any>(null);
  const [scope, setScope] = useState("");
  const [error, setError] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  async function load() {
    try {
      setError("");
      const [s, l, gp] = await Promise.all([
        referrals.mySummary(),
        decisionLogs.list(100, scope || undefined),
        governance.graphEnforcementPreview(25),
      ]);
      setSummary(s);
      setLogs(l || []);
      setGraphPreview(gp || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load AI console");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function createReferralCode() {
    try {
      setCreatingCode(true);
      const out = await referrals.createCode();
      setCreatedCode(out.code || "");
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to create referral code");
    } finally {
      setCreatingCode(false);
    }
  }

  return (
    <div className="page">
      <NetworkBackground />
      <Navigation />
      <main className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <h1 className="section-title">AI Console</h1>
            <p className="section-subtitle">
              Incentives, dry-run workflow entry point, and explainable decision logs.
            </p>
          </div>
          <div className="action-cluster">
            <a className="btn btn-ghost" href="/runs/new?dry_run=true">Open Dry-run Explorer</a>
            <button className="btn btn-primary" onClick={createReferralCode} disabled={creatingCode}>
              {creatingCode ? "Creating…" : "Create referral code"}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {createdCode && (
          <div className="card" style={{ marginBottom: 14 }}>
            <strong>New referral code:</strong> <code>{createdCode}</code>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Incentives summary</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              <div>Total attributions: {summary?.total_attributions ?? 0}</div>
              <div>Pending: {summary?.pending ?? 0}</div>
              <div>Eligible: {summary?.eligible ?? 0}</div>
              <div>Rewarded: {summary?.rewarded ?? 0}</div>
              <div>Rejected: {summary?.rejected ?? 0}</div>
              <div>
                Total rewards: {summary?.total_reward_amount ?? "0"} {summary?.reward_currency ?? "ACP"}
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Dry-run explorer</h3>
            <p style={{ color: "var(--text-muted)" }}>
              Use run mode + dry-run to inspect execution traces before production execution.
            </p>
            <a className="btn btn-ghost" href="/runs/new?run_mode=backtest&dry_run=true">
              Start dry-run
            </a>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Decision log browser</h3>
            <select
              className="input"
              style={{ width: 220 }}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            >
              <option value="">All scopes</option>
              <option value="runs.create">runs.create</option>
              <option value="orders.place">orders.place</option>
              <option value="listings.create">listings.create</option>
            </select>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Scope</th>
                  <th>Reason</th>
                  <th>Threshold</th>
                  <th>Actual</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((x) => (
                  <tr key={x.id}>
                    <td>{x.created_at ? new Date(x.created_at).toLocaleString() : "-"}</td>
                    <td>{x.scope}</td>
                    <td>{x.reason_code}</td>
                    <td>{x.threshold_value || "-"}</td>
                    <td>{x.actual_value || "-"}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                      No decision logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Graph enforcement preview</h3>
          <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
            Potential auto-quarantine targets under current suspicious density, cluster size, and cycle thresholds.
          </p>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 8 }}>
            Enabled: {String(Boolean(graphPreview?.enabled))} | Thresholds:{" "}
            suspicious_density={graphPreview?.thresholds?.suspicious_density ?? "-"},{" "}
            max_cluster_size={graphPreview?.thresholds?.max_cluster_size ?? "-"},{" "}
            block_if_in_cycle={String(Boolean(graphPreview?.thresholds?.block_if_in_cycle))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Reasons</th>
                  <th>Suspicious density</th>
                  <th>Cluster size</th>
                  <th>In cycle</th>
                </tr>
              </thead>
              <tbody>
                {(graphPreview?.items || []).map((x: any) => (
                  <tr key={x.agent_id}>
                    <td>{x.agent_name || x.agent_id}</td>
                    <td>{(x.reasons || []).join(", ")}</td>
                    <td>{x.metrics?.suspicious_density ?? "-"}</td>
                    <td>{x.metrics?.cluster_size ?? "-"}</td>
                    <td>{String(Boolean(x.metrics?.in_cycle))}</td>
                  </tr>
                ))}
                {!(graphPreview?.items || []).length && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                      No candidates under current thresholds.
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

