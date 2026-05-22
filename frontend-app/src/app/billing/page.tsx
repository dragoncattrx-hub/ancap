"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { ledger, paidApi, workflowStore } from "@/lib/api";

type BalanceResponse = {
  account_id: string;
  balances: Array<{ currency: string; amount: string }>;
};

type LedgerEvent = {
  id: string;
  ts: string;
  type: string;
  amount: { amount: string; currency: string };
  src_account_id?: string | null;
  dst_account_id?: string | null;
  metadata?: Record<string, any> | null;
};

type WorkflowRun = {
  id: string;
  title: string;
  workflow_slug: string;
  status: string;
  price: { amount: string; currency: string };
  payment_currency: string;
  created_at: string;
  receipt?: {
    proof?: {
      settlement_status?: string;
      payment_confirmation?: {
        reference?: string;
      };
    };
  };
};

export default function BillingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [apiUsage, setApiUsage] = useState<any[]>([]);
  const [apiUsageTotals, setApiUsageTotals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError("");
      const balanceData = (await ledger.getBalance("user", user.id)) as BalanceResponse;
      const [eventsData, runsData, apiProductsData, apiUsageData] = await Promise.all([
        ledger.getEvents(balanceData.account_id, 20),
        workflowStore.listRuns(20),
        paidApi.listProducts(),
        paidApi.listMyUsage(20),
      ]);
      setBalance(balanceData);
      setEvents(eventsData.items || []);
      setRuns(runsData.items || []);
      setApiProducts(apiProductsData.items || []);
      setApiUsage(apiUsageData.items || []);
      setApiUsageTotals(apiUsageData.totals_by_currency || {});
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    void loadData();
  }, [isAuthenticated, user?.id, loadData]);

  const runStats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const run of runs) {
      byStatus[run.status] = (byStatus[run.status] || 0) + 1;
    }
    return {
      total: runs.length,
      quoted: byStatus.quoted || 0,
      paid: byStatus.paid || 0,
      completed: byStatus.completed || 0,
      failed: byStatus.failed || 0,
    };
  }, [runs]);

  const hasCredits = (balance?.balances || []).length > 0;

  if (authLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Monetization
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 10px" }}>
                  Billing overview
                </h1>
                <div style={{ color: "var(--text-muted)", maxWidth: 760, lineHeight: 1.5 }}>
                  Credits, workflow spend, payment confirmations, and the current state of your paid execution loop.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/ai/workflows" className="btn btn-primary">Buy workflow</Link>
                <Link href="/wallet/credits" className="btn btn-ghost">Open credits</Link>
                <Link href="/developers" className="btn btn-ghost">Paid API</Link>
                <Link href="/proof-center" className="btn btn-ghost">Proof center</Link>
                <Link href="/ai/runs" className="btn btn-ghost">Run history</Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading billing state...</div>
          ) : (
            <>
              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Credits balance</div>
                  {!hasCredits ? (
                    <div style={{ color: "var(--text-muted)" }}>No ledger credits yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {balance?.balances.map((item) => (
                        <div key={item.currency} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ color: "var(--text)" }}>{item.currency}</span>
                          <strong style={{ color: "var(--accent)" }}>{item.amount}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Workflow runs</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>{runStats.total}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-inactive">quoted {runStats.quoted}</span>
                    <span className="badge badge-active">paid {runStats.paid}</span>
                    <span className="badge badge-active">completed {runStats.completed}</span>
                    {runStats.failed > 0 && <span className="badge badge-inactive">failed {runStats.failed}</span>}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Next billing action</div>
                  <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 10 }}>
                    {hasCredits ? "Use credits on the next workflow run" : "Fund wallet / confirm payment for first paid run"}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/wallet/acp" className="btn btn-ghost">ACP wallet</Link>
                    <Link href="/ai/workflows" className="btn btn-ghost">Workflow catalog</Link>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 18 }}>
                <div className="card-header">
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Paid API metering</h2>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                      API-key usage burns prepaid credits per endpoint call and returns machine-readable receipts with x402-compatible payment terms.
                    </div>
                  </div>
                  <Link href="/projects" className="btn btn-ghost">Manage agents</Link>
                </div>

                <div className="responsive-grid responsive-grid-2">
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>Products</div>
                      <a href={paidApi.usageExportUrl(500)} className="btn btn-ghost">Export CSV</a>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {apiProducts.slice(0, 5).map((product: any) => (
                        <div key={product.slug} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ color: "var(--text)", fontWeight: 700 }}>{product.title}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>{product.endpoint}</div>
                          </div>
                          <strong style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>
                            {product.price.amount} {product.price.currency}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Recent API usage</div>
                    {Object.keys(apiUsageTotals).length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {Object.entries(apiUsageTotals).map(([currency, amount]) => (
                          <span key={currency} className="badge badge-active">30d {currency} {amount}</span>
                        ))}
                      </div>
                    )}
                    {apiUsage.length === 0 ? (
                      <div style={{ color: "var(--text-muted)" }}>No paid API usage yet.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {apiUsage.slice(0, 5).map((usage: any) => (
                          <div key={usage.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ color: "var(--text)", fontWeight: 700 }}>{usage.product_slug}</div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                                {new Date(usage.created_at).toLocaleString()}
                              </div>
                            </div>
                            <strong style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>
                              {usage.amount.amount} {usage.amount.currency}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="responsive-grid responsive-grid-2">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Recent billing events</h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        Latest user-ledger activity tied to credits and spend.
                      </div>
                    </div>
                  </div>

                  {events.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No billing events yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {events.map((event) => (
                        <div key={event.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                            <strong style={{ color: "var(--text)" }}>{event.type}</strong>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                              {new Date(event.ts).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ color: "var(--accent)", fontWeight: 700 }}>
                            {event.amount?.amount} {event.amount?.currency}
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {JSON.stringify(event.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Recent paid runs</h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        Workflow monetization loop from quote to proof bundle.
                      </div>
                    </div>
                  </div>

                  {runs.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No workflow runs yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {runs.slice(0, 8).map((run) => (
                        <div key={run.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ color: "var(--text)", fontWeight: 800 }}>{run.title}</div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                                {run.workflow_slug}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "var(--accent)", fontWeight: 700 }}>
                                {run.price.amount} {run.price.currency}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                                {run.status}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                            {run.receipt?.proof?.payment_confirmation?.reference && (
                              <span className="badge badge-active">payment confirmed</span>
                            )}
                            {run.receipt?.proof?.settlement_status && (
                              <span className="badge badge-inactive">settlement {run.receipt.proof.settlement_status}</span>
                            )}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                              {new Date(run.created_at).toLocaleString()}
                            </div>
                            <Link href={`/ai/runs/${run.id}`} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                              Open run
                            </Link>
                          </div>
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
