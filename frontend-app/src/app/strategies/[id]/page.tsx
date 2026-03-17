"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { listings, strategies, verticals, growthSocial } from "@/lib/api";

type StrategyPublic = {
  id: string;
  name: string;
  vertical_id: string;
  owner_agent_id: string;
  status: string;
  created_at: string;
  summary?: string;
};

type StrategyVersionPublic = {
  id: string;
  strategy_id: string;
  semver: string;
  workflow: any;
  changelog?: string;
  created_at: string;
};

export default function StrategyDetailPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const strategyId = params?.id;

  const [strategy, setStrategy] = useState<StrategyPublic | null>(null);
  const [versions, setVersions] = useState<StrategyVersionPublic[]>([]);
  const [verticalName, setVerticalName] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [versionForm, setVersionForm] = useState({
    semver: "1.0.0",
    changelog: "",
    workflowJson: JSON.stringify(
      {
        vertical_id: "",
        version: "base-v1",
        steps: [{ id: "const", action: "const", args: { value: 1 }, save_as: "x" }],
      },
      null,
      2
    ),
  });

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    version_id: "",
    price_amount: "10",
    price_currency: "VUSD",
    notes: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !strategyId) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const s = await strategies.get(strategyId);
        const v = await strategies.getVersions(strategyId, 50);
        setStrategy(s);
        setVersions(v.items || []);
        const verts = await verticals.list();
        const found = (verts.items || []).find((x: any) => x.id === s.vertical_id);
        setVerticalName(found?.name || s.vertical_id);
        setVersionForm((prev) => {
          try {
            const parsed = JSON.parse(prev.workflowJson);
            parsed.vertical_id = s.vertical_id;
            return { ...prev, workflowJson: JSON.stringify(parsed, null, 2) };
          } catch {
            return prev;
          }
        });
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated, strategyId]);

  async function followStrategy() {
    if (!strategyId) return;
    try {
      await growthSocial.followStrategy(strategyId);
      alert("Followed");
    } catch (e: any) {
      alert(e.message || "Follow failed");
    }
  }

  async function copyStrategy() {
    if (!strategyId) return;
    try {
      const r = await growthSocial.copyStrategy(strategyId);
      router.push(`/strategies/${r.id}`);
    } catch (e: any) {
      alert(e.message || "Copy failed");
    }
  }

  const latestVersion = useMemo(() => versions[0] || null, [versions]);

  async function createVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!strategy) return;
    setPublishing(true);
    setError("");
    try {
      const wf = JSON.parse(versionForm.workflowJson);
      const body = {
        semver: versionForm.semver,
        workflow: wf,
        changelog: versionForm.changelog || undefined,
      };
      await strategies.createVersion(strategy.id, body as any);
      setShowVersionModal(false);
      const v = await strategies.getVersions(strategy.id, 50);
      setVersions(v.items || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPublishing(false);
    }
  }

  async function publishListing(e: React.FormEvent) {
    e.preventDefault();
    if (!strategy) return;
    setPublishing(true);
    setError("");
    try {
      await listings.create({
        strategy_id: strategy.id,
        strategy_version_id: publishForm.version_id,
        fee_model: {
          type: "one_time",
          one_time_price: { amount: publishForm.price_amount, currency: publishForm.price_currency },
        },
        status: "active",
        notes: publishForm.notes || undefined,
      });
      setShowPublishModal(false);
      router.push("/listings");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPublishing(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {strategy?.name || t("strategies.title") || "Strategy"}
              </h1>
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Vertical: {verticalName} · Owner agent: {strategy?.owner_agent_id}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={`/public/strategies/${strategyId}`} className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center" }}>
                Public
              </a>
              <button className="btn btn-ghost" onClick={followStrategy} disabled={!strategyId}>
                Follow
              </button>
              <button className="btn btn-ghost" onClick={copyStrategy} disabled={!strategyId}>
                Copy
              </button>
              <button className="btn btn-primary" onClick={() => setShowVersionModal(true)} disabled={!strategy || publishing}>
                Create version
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (latestVersion) setPublishForm((p) => ({ ...p, version_id: latestVersion.id }));
                  setShowPublishModal(true);
                }}
                disabled={!latestVersion || publishing}
              >
                Publish as listing
              </button>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 20 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>Loading…</div>
          ) : (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>Versions</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {versions.length} total
                </div>
              </div>
              {versions.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>
                  No versions yet. Create a version before publishing a listing.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {versions.map((v) => (
                    <div key={v.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text)" }}>{v.semver}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            {new Date(v.created_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost"
                          onClick={() => {
                            setPublishForm((p) => ({ ...p, version_id: v.id }));
                            setShowPublishModal(true);
                          }}
                        >
                          Publish listing
                        </button>
                      </div>
                      {v.changelog && (
                        <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          {v.changelog}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showVersionModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 720, width: "100%" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
              Create version
            </h2>
            <form onSubmit={createVersion}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Semver</div>
                <input
                  value={versionForm.semver}
                  onChange={(e) => setVersionForm((p) => ({ ...p, semver: e.target.value }))}
                  className="input"
                  style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 8 }}>Workflow JSON</div>
                <textarea
                  value={versionForm.workflowJson}
                  onChange={(e) => setVersionForm((p) => ({ ...p, workflowJson: e.target.value }))}
                  rows={10}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 8 }}>Changelog</div>
                <input
                  value={versionForm.changelog}
                  onChange={(e) => setVersionForm((p) => ({ ...p, changelog: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={publishing}>
                  {publishing ? "Creating…" : "Create"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowVersionModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 560, width: "100%" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>
              Publish listing
            </h2>
            <form onSubmit={publishListing}>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Price</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={publishForm.price_amount}
                    onChange={(e) => setPublishForm((p) => ({ ...p, price_amount: e.target.value }))}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  />
                  <input
                    value={publishForm.price_currency}
                    onChange={(e) => setPublishForm((p) => ({ ...p, price_currency: e.target.value }))}
                    style={{ width: 120, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 8 }}>Notes</div>
                <input
                  value={publishForm.notes}
                  onChange={(e) => setPublishForm((p) => ({ ...p, notes: e.target.value }))}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={publishing || !publishForm.version_id}>
                  {publishing ? "Publishing…" : "Publish"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </button>
              </div>
              {!publishForm.version_id && (
                <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Pick a version first.
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

