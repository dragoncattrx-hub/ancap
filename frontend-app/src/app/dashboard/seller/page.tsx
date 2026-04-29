"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { agents, ledger } from "@/lib/api";

export default function SellerDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [eventsByAgent, setEventsByAgent] = useState<Record<string, any[]>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const a = await agents.listMine(50);
        const list = a.items || [];
        setMyAgents(list);

        const balMap: Record<string, any> = {};
        const evMap: Record<string, any[]> = {};
        for (const ag of list) {
          const b = await ledger.getBalance("agent", ag.id);
          balMap[ag.id] = b;
          const accountId = b.account_id;
          const ev = await ledger.getEvents(accountId, 20);
          evMap[ag.id] = ev.items || [];
        }
        setBalances(balMap);
        setEventsByAgent(evMap);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated]);

  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const ag of myAgents) {
      const evs = eventsByAgent[ag.id] || [];
      for (const ev of evs) {
        const amount = Number(ev.amount?.amount || "0");
        if (!Number.isFinite(amount)) continue;
        const currency = ev.amount?.currency || "ACP";
        if (ev.metadata && ev.metadata.order_settlement) {
          out[currency] = (out[currency] || 0) + amount;
        }
      }
    }
    return out;
  }, [myAgents, balances]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
            Seller dashboard
          </h1>
          <div style={{ color: "var(--text-muted)", marginBottom: 20 }}>
            Earnings and cashflow for your seller agents (MVP).
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
          ) : myAgents.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                You have no agents yet.
              </div>
              <a className="btn btn-primary" href="/agents">Create agent</a>
            </div>
          ) : (
            <>
              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>My agents</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)" }}>{myAgents.length}</div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Total balances</div>
                  <div style={{ color: "var(--text)" }}>
                    {Object.keys(totals).length === 0 ? "—" : Object.entries(totals).map(([c, v]) => (
                      <div key={c} style={{ fontWeight: 800 }}>{v.toFixed(2)} {c}</div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Quick links</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a className="btn btn-ghost" href="/listings">Listings</a>
                    <a className="btn btn-ghost" href="/orders">Orders</a>
                    <a className="btn btn-ghost" href="/ledger">Ledger</a>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {myAgents.map((ag) => {
                  const b = balances[ag.id];
                  const evs = eventsByAgent[ag.id] || [];
                  return (
                    <div key={ag.id} className="card">
                      <div className="card-header">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: "var(--text)" }}>{ag.display_name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            id: {ag.id}
                          </div>
                        </div>
                        <a className="btn btn-ghost" href={`/ledger`}>Open ledger</a>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Balance</div>
                        {(b?.balances || []).length === 0 ? (
                          <div style={{ color: "var(--text-muted)" }}>—</div>
                        ) : (
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {(b.balances || []).map((it: any) => (
                              <div key={it.currency} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 10 }}>
                                <div style={{ fontWeight: 900, color: "var(--text)" }}>{it.amount}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{it.currency}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Recent ledger events</div>
                        {evs.length === 0 ? (
                          <div style={{ color: "var(--text-muted)" }}>No events.</div>
                        ) : (
                          <div style={{ display: "grid", gap: 8 }}>
                            {evs.map((e: any) => (
                              <div key={e.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                  <div style={{ color: "var(--text)", fontWeight: 800 }}>{e.type}</div>
                                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{new Date(e.ts).toLocaleString()}</div>
                                </div>
                                <div style={{ color: "var(--text-muted)" }}>
                                  {e.amount?.amount} {e.amount?.currency}
                                </div>
                                {e.metadata && (
                                  <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                    {JSON.stringify(e.metadata)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

