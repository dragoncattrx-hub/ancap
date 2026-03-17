"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { pools, runs, strategies } from "@/lib/api";

function RunNewPageInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const safeSp = sp ?? new URLSearchParams();

  const preBuyerAgentId = safeSp.get("buyer_agent_id") || "";
  const preStrategyId = safeSp.get("strategy_id") || "";
  const preStrategyVersionId = safeSp.get("strategy_version_id") || "";
  const preContractId = safeSp.get("contract_id") || "";
  const preContractMilestoneId = safeSp.get("contract_milestone_id") || "";

  const [poolsList, setPoolsList] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [runIdk] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  });

  const [form, setForm] = useState({
    buyer_agent_id: preBuyerAgentId,
    pool_id: "",
    strategy_id: preStrategyId,
    strategy_version_id: preStrategyVersionId,
    contract_id: preContractId,
    contract_milestone_id: preContractMilestoneId,
    run_mode: "mock" as "mock" | "backtest",
    dry_run: true,
    paramsJson: JSON.stringify({ _start_equity: 1000 }, null, 2),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const p = await pools.list(50);
        setPoolsList(p.items || []);
        setForm((prev) => ({ ...prev, pool_id: prev.pool_id || (p.items?.[0]?.id || "") }));
        if (preStrategyId) {
          const v = await strategies.getVersions(preStrategyId, 50);
          setVersions(v.items || []);
          setForm((prev) => {
            const incoming = preStrategyVersionId;
            const candidates = v.items || [];
            const preferred =
              (incoming && candidates.find((it: any) => String(it.id) === String(incoming))?.id) ||
              prev.strategy_version_id ||
              (candidates[0]?.id || "");
            return {
              ...prev,
              strategy_id: prev.strategy_id || preStrategyId,
              strategy_version_id: preferred,
            };
          });
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated, preStrategyId, preStrategyVersionId]);

  const canSubmit = useMemo(() => {
    return !!form.pool_id && !!form.strategy_version_id;
  }, [form.pool_id, form.strategy_version_id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const params = JSON.parse(form.paramsJson || "{}");
      const created = await runs.create({
        strategy_version_id: form.strategy_version_id,
        pool_id: form.pool_id,
        contract_id: form.contract_id || undefined,
        contract_milestone_id: form.contract_milestone_id || undefined,
        params,
        limits: {},
        dry_run: form.dry_run,
        run_mode: form.run_mode,
        idempotency_key: runIdk,
      });
      router.push(`/runs/${encodeURIComponent(created.id)}`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setCreating(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <a className="btn btn-ghost" href="/access">← Back to grants</a>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Run strategy
          </h1>
          <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            Select pool + version, set params, then execute.
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
          ) : (
            <div className="card">
              <form onSubmit={submit}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                      Pool
                    </div>
                    <select
                      value={form.pool_id}
                      onChange={(e) => setForm((p) => ({ ...p, pool_id: e.target.value }))}
                      style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                    >
                      <option value="">Select pool</option>
                      {poolsList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                      Strategy version
                    </div>
                    <select
                      value={form.strategy_version_id}
                      onChange={(e) => setForm((p) => ({ ...p, strategy_version_id: e.target.value }))}
                      style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                    >
                      <option value="">Select version</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.id}>{v.semver} ({String(v.id).slice(0, 8)})</option>
                      ))}
                    </select>
                    {!preStrategyId && (
                      <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Tip: open this page from a listing/grant to prefill strategy + versions.
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 220 }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Run mode</div>
                      <select
                        value={form.run_mode}
                        onChange={(e) => setForm((p) => ({ ...p, run_mode: e.target.value as any }))}
                        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                      >
                        <option value="mock">mock</option>
                        <option value="backtest">backtest</option>
                      </select>
                    </div>
                    <div className="card" style={{ padding: 12, flex: 1, minWidth: 220 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.dry_run}
                          onChange={(e) => setForm((p) => ({ ...p, dry_run: e.target.checked }))}
                        />
                        <span style={{ color: "var(--text)" }}>Dry run</span>
                      </label>
                      <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Recommended for golden path demos.
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                      Params (JSON)
                    </div>
                    <textarea
                      value={form.paramsJson}
                      onChange={(e) => setForm((p) => ({ ...p, paramsJson: e.target.value }))}
                      rows={8}
                      style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                  <button className="btn btn-primary" type="submit" disabled={!canSubmit || creating}>
                    {creating ? "Executing…" : "Execute run"}
                  </button>
                  <a className="btn btn-ghost" href="/runs">View runs</a>
                </div>

                {form.buyer_agent_id && (
                  <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Buyer agent: {form.buyer_agent_id}
                  </div>
                )}
                {form.contract_id && (
                  <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Contract: {form.contract_id}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function RunNewPage() {
  // Next.js requires suspense boundary for useSearchParams in production build.
  return (
    <Suspense fallback={null}>
      <RunNewPageInner />
    </Suspense>
  );
}

