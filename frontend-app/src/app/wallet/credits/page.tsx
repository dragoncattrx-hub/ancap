"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { ledger, workflowStore } from "@/lib/api";
import { fallbackWorkflowCreditPackages, type WorkflowCreditPackage } from "@/lib/workflowStore";

type BalanceResponse = {
  account_id: string;
  balances: Array<{ currency: string; amount: string }>;
};

type LedgerEvent = {
  id: string;
  ts: string;
  type: string;
  amount: { amount: string; currency: string };
  metadata?: Record<string, any> | null;
};

type CreditTopUpIntentResponse = {
  item: {
    id: string;
    status: string;
    payment_reference?: string | null;
    amount: { amount: string; currency: string };
  };
  package: WorkflowCreditPackage;
  credited: boolean;
};

export default function WalletCreditsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [creditPackages, setCreditPackages] = useState<WorkflowCreditPackage[]>(fallbackWorkflowCreditPackages);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [topUpIntent, setTopUpIntent] = useState<CreditTopUpIntentResponse | null>(null);
  const [topUpReference, setTopUpReference] = useState("");
  const [topUpLoadingSlug, setTopUpLoadingSlug] = useState("");
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
      const eventsData = await ledger.getEvents(balanceData.account_id, 30);
      setBalance(balanceData);
      setEvents(eventsData.items || []);
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

  const loadPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      const response = (await workflowStore.listCreditPackages()) as { items?: WorkflowCreditPackage[] };
      setCreditPackages(response.items?.length ? response.items : fallbackWorkflowCreditPackages);
    } catch {
      setCreditPackages(fallbackWorkflowCreditPackages);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadPackages();
  }, [isAuthenticated, loadPackages]);

  const totalCurrencies = useMemo(() => (balance?.balances || []).length, [balance]);

  const createTopUpIntent = async (creditPackage: WorkflowCreditPackage) => {
    try {
      setError("");
      setTopUpLoadingSlug(creditPackage.slug);
      const response = (await workflowStore.createCreditTopUpIntent(creditPackage.slug, {
        payment_currency: creditPackage.price.currency,
        payment_method: "manual",
      })) as CreditTopUpIntentResponse;
      setTopUpIntent(response);
      setTopUpReference(response.item.payment_reference || "");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setTopUpLoadingSlug("");
    }
  };

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
                  Wallet credits
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 10px" }}>
                  Credits & spend balance
                </h1>
                <div style={{ color: "var(--text-muted)", maxWidth: 760, lineHeight: 1.5 }}>
                  Simple ledger-backed credits view for the monetization loop: what balance exists, what moved recently, and where to spend next.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/billing" className="btn btn-ghost">Billing overview</Link>
                <Link href="/wallet/acp" className="btn btn-ghost">ACP wallet</Link>
                <Link href="/ai/workflows" className="btn btn-primary">Use on workflows</Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading credits…</div>
          ) : (
            <>
              <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Credit account</div>
                  <div style={{ color: "var(--text)", fontWeight: 800, wordBreak: "break-all" }}>{balance?.account_id || "—"}</div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Currencies</div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)" }}>{totalCurrencies}</div>
                </div>
                <div className="card">
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Next move</div>
                  <div style={{ color: "var(--text)", fontWeight: 700 }}>
                    Fund ACP / ACP path and connect it to paid workflow execution.
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Credit packages</h2>
                    <div style={{ color: "var(--text-muted)", marginTop: 4 }}>
                      Prepaid workflow balance with traceable payment intents and ledger events.
                    </div>
                  </div>
                  {packagesLoading && <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading packages...</div>}
                </div>

                {topUpIntent && (
                  <div className="card" style={{ marginBottom: 12, borderColor: topUpIntent.credited ? "rgba(0, 255, 153, 0.35)" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ color: "var(--text)", fontWeight: 800 }}>{topUpIntent.package.title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
                          Pay {topUpIntent.item.amount.amount} {topUpIntent.item.amount.currency} to credit {topUpIntent.package.credit_amount.amount} {topUpIntent.package.credit_amount.currency}.
                        </div>
                      </div>
                      <strong style={{ color: topUpIntent.credited ? "var(--accent)" : "var(--text)" }}>{topUpIntent.item.status}</strong>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, alignItems: "center" }}>
                      <input
                        value={topUpReference}
                        placeholder="payment reference"
                        style={{ minWidth: 0 }}
                        readOnly
                      />
                      <span style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", color: topUpIntent.credited ? "var(--accent)" : "var(--text-muted)", fontWeight: 800 }}>
                        {topUpIntent.credited ? "Credited" : "Awaiting approval"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="responsive-grid responsive-grid-3">
                  {creditPackages.map((creditPackage) => (
                    <div key={creditPackage.slug} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ color: "var(--text)", fontWeight: 800 }}>{creditPackage.title}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6, lineHeight: 1.45 }}>
                            {creditPackage.description}
                          </div>
                        </div>
                        {creditPackage.bonus_percent > 0 && (
                          <span style={{ color: "var(--accent)", fontWeight: 800, whiteSpace: "nowrap" }}>+{creditPackage.bonus_percent}%</span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Pay</div>
                          <strong style={{ color: "var(--text)" }}>{creditPackage.price.amount} {creditPackage.price.currency}</strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Receive</div>
                          <strong style={{ color: "var(--accent)" }}>{creditPackage.credit_amount.amount} {creditPackage.credit_amount.currency}</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                        {creditPackage.recommended_for.map((item) => (
                          <span key={item} style={{ border: "1px solid var(--border)", borderRadius: 999, padding: "4px 8px", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                            {item}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: "100%" }}
                        onClick={() => createTopUpIntent(creditPackage)}
                        disabled={topUpLoadingSlug === creditPackage.slug}
                      >
                        {topUpLoadingSlug === creditPackage.slug ? "Creating..." : "Create invoice"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="responsive-grid responsive-grid-2">
                <div className="card">
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 0, color: "var(--text)", marginBottom: 12 }}>Available balances</h2>
                  {!balance?.balances?.length ? (
                    <div style={{ color: "var(--text-muted)" }}>No credits available yet.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {balance.balances.map((item) => (
                        <div key={item.currency} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ color: "var(--text)" }}>{item.currency}</span>
                          <strong style={{ color: "var(--accent)" }}>{item.amount}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: 0, color: "var(--text)", marginBottom: 12 }}>Recent credit events</h2>
                  {!events.length ? (
                    <div style={{ color: "var(--text-muted)" }}>No ledger activity yet.</div>
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
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
