"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { access, ledger, orders, runs as runsApi } from "@/lib/api";

export default function AdminOverviewPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [health, setHealth] = useState<any | null>(null);
  const [ledgerStatus, setLedgerStatus] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentGrants, setRecentGrants] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [failedRuns, setFailedRuns] = useState<any[]>([]);
  const [settlementEvents, setSettlementEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const [healthRes, ledgerStatusRes, ordersRes, grantsRes, runsRes, failedRunsRes, ledgerEventsRes] =
          await Promise.all([
            fetch("/api/system/health").then((r) => r.json()),
            fetch("/api/system/ledger-invariant-status").then((r) => r.json()),
            orders.list(20),
            access.listGrants(20),
            runsApi.list(20),
            runsApi.list(20, undefined),
            ledger.getEvents(undefined, 50),
          ]);

        setHealth(healthRes);
        setLedgerStatus(ledgerStatusRes);
        setRecentOrders(ordersRes.items || []);
        setRecentGrants(grantsRes.items || []);
        setRecentRuns(runsRes.items || []);
        setFailedRuns(
          (failedRunsRes.items || []).filter((r: any) => r.state === "failed")
        );
        const allEvents = ledgerEventsRes.items || [];
        setSettlementEvents(
          allEvents.filter((e: any) => e.metadata && e.metadata.order_settlement)
        );
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
            Admin overview
          </h1>
          <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            Golden Path observability: orders → grants → runs → ledger.
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
          ) : (
            <>
              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    System health
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>
                    {health?.status || "unknown"}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    Ledger invariant halted
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: ledgerStatus?.halted ? "#ef4444" : "var(--text)" }}>
                    {String(ledgerStatus?.halted ?? false)}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>
                    Failed runs (recent)
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)" }}>
                    {failedRuns.length}
                  </div>
                </div>
              </div>

              <div className="responsive-grid responsive-grid-2" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Recent orders</div>
                  {recentOrders.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No orders.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {recentOrders.map((o: any) => (
                        <div key={o.id} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ color: "var(--text)", fontWeight: 600 }}>
                              {String(o.id).slice(0, 8)}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {new Date(o.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Listing: {o.listing_id} · Buyer: {o.buyer_type} {o.buyer_id}
                          </div>
                          {o.amount && (
                            <div style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                              {o.amount.amount} {o.amount.currency} · {o.status}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Recent access grants</div>
                  {recentGrants.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No grants.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {recentGrants.map((g: any) => (
                        <div key={g.id} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                          <div style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                            Strategy: {g.strategy_id}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Grantee: {g.grantee_type} {g.grantee_id} · Scope: {g.scope}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {new Date(g.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="responsive-grid responsive-grid-2">
                <div className="card">
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Recent runs</div>
                  {recentRuns.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No runs.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {recentRuns.map((r: any) => (
                        <div key={r.id} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ color: "var(--text)", fontWeight: 600 }}>
                              {String(r.id).slice(0, 8)}
                            </div>
                            <span className="badge badge-active">{r.state}</span>
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Version: {r.strategy_version_id} · Pool: {r.pool_id}
                          </div>
                          {r.failure_reason && (
                            <div style={{ fontSize: "0.8rem", color: "#ef4444" }}>
                              {r.failure_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                    Recent order settlement events
                  </div>
                  {settlementEvents.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No settlement events.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {settlementEvents.map((e: any) => (
                        <div key={e.id} style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ color: "var(--text)", fontWeight: 600 }}>{e.type}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {new Date(e.ts).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                            {e.amount?.amount} {e.amount?.currency}
                          </div>
                          {e.metadata && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                              {JSON.stringify(e.metadata)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

