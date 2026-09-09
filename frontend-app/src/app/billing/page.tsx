"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
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
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [apiUsage, setApiUsage] = useState<any[]>([]);
  const [apiUsageTotals, setApiUsageTotals] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      setNotice("");

      const balanceData = (await ledger.getBalance("user", user.id)) as BalanceResponse;
      setBalance(balanceData);

      const [eventsResult, runsResult, apiProductsResult, apiUsageResult] = await Promise.allSettled([
        ledger.getEvents(balanceData.account_id, 20),
        workflowStore.listRuns(20),
        paidApi.listProducts(),
        paidApi.listMyUsage(20),
      ]);

      const partialFailures: string[] = [];

      if (eventsResult.status === "fulfilled") {
        setEvents(eventsResult.value.items || []);
      } else {
        setEvents([]);
        partialFailures.push(t("billingPage.partialBillingEvents"));
      }

      if (runsResult.status === "fulfilled") {
        setRuns(runsResult.value.items || []);
      } else {
        setRuns([]);
        partialFailures.push(t("billingPage.partialPaidRuns"));
      }

      if (apiProductsResult.status === "fulfilled") {
        setApiProducts(apiProductsResult.value.items || []);
      } else {
        setApiProducts([]);
        partialFailures.push(t("billingPage.partialApiProducts"));
      }

      if (apiUsageResult.status === "fulfilled") {
        setApiUsage(apiUsageResult.value.items || []);
        setApiUsageTotals(apiUsageResult.value.totals_by_currency || {});
      } else {
        setApiUsage([]);
        setApiUsageTotals({});
        partialFailures.push(t("billingPage.partialApiUsage"));
      }

      if (partialFailures.length > 0) {
        setNotice(t("billingPage.partialNotice").replace("{list}", partialFailures.join(", ")));
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      setBalance(null);
      setEvents([]);
      setRuns([]);
      setApiProducts([]);
      setApiUsage([]);
      setApiUsageTotals({});
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

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
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {t("billingPage.kicker")}
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 10px" }}>
                  {t("billingPage.title")}
                </h1>
                <div style={{ color: "var(--text-muted)", maxWidth: 760, lineHeight: 1.5 }}>
                  {t("billingPage.lead")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => void loadData()} className="btn btn-ghost" disabled={loading}>{t("billingPage.refresh")}</button>
                <Link href="/ai/workflows" className="btn btn-primary">{t("billingPage.buyWorkflow")}</Link>
                <Link href="/wallet/credits" className="btn btn-ghost">{t("billingPage.openCredits")}</Link>
                <Link href="/developers" className="btn btn-ghost">{t("billingPage.paidApi")}</Link>
                <Link href="/proof-center" className="btn btn-ghost">{t("billingPage.proofCenter")}</Link>
                <Link href="/ai/runs" className="btn btn-ghost">{t("billingPage.runHistory")}</Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {notice && !error && (
            <div className="card" style={{ borderColor: "rgba(16,185,129,0.35)", marginBottom: 18 }}>
              <div style={{ color: "var(--text-muted)" }}>{notice}</div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>{t("billingPage.loading")}</div>
          ) : (
            <>
              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>{t("billingPage.creditsBalance")}</div>
                  {!hasCredits ? (
                    <div style={{ color: "var(--text-muted)" }}>{t("billingPage.noCredits")}</div>
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
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>{t("billingPage.workflowRuns")}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>{runStats.total}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-inactive">{t("billingPage.quoted").replace("{n}", String(runStats.quoted))}</span>
                    <span className="badge badge-active">{t("billingPage.paid").replace("{n}", String(runStats.paid))}</span>
                    <span className="badge badge-active">{t("billingPage.completed").replace("{n}", String(runStats.completed))}</span>
                    {runStats.failed > 0 && <span className="badge badge-inactive">{t("billingPage.failed").replace("{n}", String(runStats.failed))}</span>}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>{t("billingPage.nextAction")}</div>
                  <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 10 }}>
                    {hasCredits ? t("billingPage.nextWithCredits") : t("billingPage.nextWithoutCredits")}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/wallet/acp" className="btn btn-ghost">{t("billingPage.acpWallet")}</Link>
                    <Link href="/ai/workflows" className="btn btn-ghost">{t("billingPage.workflowCatalog")}</Link>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 18 }}>
                <div className="card-header">
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>{t("billingPage.meteringTitle")}</h2>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                      {t("billingPage.meteringLead")}
                    </div>
                  </div>
                  <Link href="/projects" className="btn btn-ghost">{t("billingPage.manageAgents")}</Link>
                </div>

                <div className="responsive-grid responsive-grid-2">
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, color: "var(--text)" }}>{t("billingPage.products")}</div>
                      <a href={paidApi.usageExportUrl(500)} className="btn btn-ghost">{t("billingPage.exportCsv")}</a>
                    </div>
                    {apiProducts.length === 0 ? (
                      <div style={{ color: "var(--text-muted)" }}>{t("billingPage.noProducts")}</div>
                    ) : (
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
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>{t("billingPage.recentApiUsage")}</div>
                    {Object.keys(apiUsageTotals).length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {Object.entries(apiUsageTotals).map(([currency, amount]) => (
                          <span key={currency} className="badge badge-active">
                            {t("billingPage.usage30d").replace("{currency}", currency).replace("{amount}", amount)}
                          </span>
                        ))}
                      </div>
                    )}
                    {apiUsage.length === 0 ? (
                      <div style={{ color: "var(--text-muted)" }}>{t("billingPage.noApiUsage")}</div>
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
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>{t("billingPage.recentEvents")}</h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        {t("billingPage.recentEventsLead")}
                      </div>
                    </div>
                  </div>

                  {events.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>{t("billingPage.noEvents")}</div>
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
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>{t("billingPage.recentRuns")}</h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        {t("billingPage.recentRunsLead")}
                      </div>
                    </div>
                  </div>

                  {runs.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>{t("billingPage.noRuns")}</div>
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
                              <span className="badge badge-active">{t("billingPage.paymentConfirmed")}</span>
                            )}
                            {run.receipt?.proof?.settlement_status && (
                              <span className="badge badge-inactive">
                                {t("billingPage.settlement").replace("{status}", run.receipt.proof.settlement_status)}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                              {new Date(run.created_at).toLocaleString()}
                            </div>
                            <Link href={`/ai/runs/${run.id}`} style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
                              {t("billingPage.openRun")}
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
