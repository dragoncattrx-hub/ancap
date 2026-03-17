"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { runs } from "@/lib/api";

export default function RunDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const runId = params?.id;

  const [run, setRun] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !runId) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const [r, l, s, a] = await Promise.all([
          runs.get(runId),
          runs.getLogs(runId),
          runs.getSteps(runId),
          runs.getArtifacts(runId),
        ]);
        setRun(r);
        setLogs(l.items || []);
        setSteps(s.steps || []);
        setArtifacts(a);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated, runId]);

  const header = useMemo(() => {
    if (!run) return null;
    return {
      state: run.state,
      strategy_version_id: run.strategy_version_id,
      pool_id: run.pool_id,
      run_mode: run.run_mode,
      created_at: run.created_at,
      started_at: run.started_at,
      ended_at: run.ended_at,
      failure_reason: run.failure_reason,
    };
  }, [run]);

  const fmt = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn btn-ghost" href="/runs">← Back to runs</a>
            <a className="btn btn-ghost" href="/ledger">View ledger</a>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
          ) : !run ? (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)" }}>Run not found.</div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 18 }}>
                <div className="card-header">
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                    Run {String(run.id).slice(0, 8)}
                  </h1>
                  <span className="badge badge-active">{header?.state}</span>
                </div>
                <div style={{ display: "grid", gap: 8, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  <div>Run ID: <span style={{ color: "var(--text)" }}>{run.id}</span></div>
                  <div>Strategy version: <span style={{ color: "var(--text)" }}>{header?.strategy_version_id}</span></div>
                  <div>Pool: <span style={{ color: "var(--text)" }}>{header?.pool_id}</span></div>
                  <div>Mode: <span style={{ color: "var(--text)" }}>{header?.run_mode || "mock"}</span></div>
                  <div>Created: {header?.created_at ? new Date(header.created_at).toLocaleString() : "—"}</div>
                  {header?.failure_reason && <div style={{ color: "#ef4444" }}>Failure: {header.failure_reason}</div>}
                </div>
              </div>

              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Logs</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{logs.length}</div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Steps</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>{steps.length}</div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Artifacts</div>
                  <div style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
                    inputs/workflow/outputs hashes
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Artifacts</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>
                  {JSON.stringify(artifacts, null, 2)}
                </pre>
              </div>

              <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Logs</div>
                {logs.length === 0 ? (
                  <div style={{ color: "var(--text-muted)" }}>No logs.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {logs.slice(0, 50).map((x, i) => (
                      <div key={i} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {fmt(x.ts)} · {fmt(x.level)}
                        </div>
                        <div style={{ color: "var(--text)" }}>{fmt(x.message)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Steps</div>
                {steps.length === 0 ? (
                  <div style={{ color: "var(--text-muted)" }}>No steps.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {steps.map((s: any) => (
                      <div key={s.step_index} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ color: "var(--text)", fontWeight: 700 }}>
                            {s.step_index}. {s.action}
                          </div>
                          <div style={{ color: "var(--text-muted)" }}>{s.state}</div>
                        </div>
                        {s.result_summary && (
                          <div style={{ marginTop: 6, color: "var(--text-muted)" }}>{fmt(s.result_summary)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

