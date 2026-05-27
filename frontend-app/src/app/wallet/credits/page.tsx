"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ledger, payments, workflowStore } from "@/lib/api";
import { loadStripeJs, type StripeCardElement } from "@/lib/stripe";
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
    provider_payload?: Record<string, any> | null;
  };
  package: WorkflowCreditPackage;
  credited: boolean;
};

type StripePaymentMethod = {
  id: string;
  type: string;
  customer_id?: string | null;
  reusable: boolean;
  card?: {
    brand?: string | null;
    last4?: string | null;
    exp_month?: number | null;
    exp_year?: number | null;
  } | null;
};

type StripeIntentResponse = {
  item: {
    id: string;
    status: string;
    payment_reference?: string | null;
    amount: { amount: string; currency: string };
    provider_payload?: Record<string, any> | null;
  };
  package: WorkflowCreditPackage;
  stripe: {
    customer_id: string;
    payment_intent_id: string;
    client_secret: string;
    publishable_key: string;
    amount: { amount: string; currency: string };
    currency: string;
    payment_method_types: string[];
    status: string;
  };
};

const STRIPE_CURRENCIES = ["USD", "EUR"] as const;
type StripeCurrency = typeof STRIPE_CURRENCIES[number];

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
  const [stripeMethods, setStripeMethods] = useState<StripePaymentMethod[]>([]);
  const [stripeMethodsLoading, setStripeMethodsLoading] = useState(false);
  const [stripePanelOpen, setStripePanelOpen] = useState(false);
  const [stripePackageSlug, setStripePackageSlug] = useState("");
  const [stripeLoadingSlug, setStripeLoadingSlug] = useState("");
  const [stripeCurrency, setStripeCurrency] = useState<StripeCurrency>("USD");
  const [stripeIntent, setStripeIntent] = useState<StripeIntentResponse | null>(null);
  const [stripePolling, setStripePolling] = useState(false);
  const [stripeSelectedMethodId, setStripeSelectedMethodId] = useState("");
  const [stripeSaveMethod, setStripeSaveMethod] = useState(true);
  const [stripeProcessing, setStripeProcessing] = useState(false);
  const [stripeRemovingMethodId, setStripeRemovingMethodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const stripeCardMountRef = useRef<HTMLDivElement | null>(null);
  const stripeCardElementRef = useRef<StripeCardElement | null>(null);

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

  const loadStripeMethods = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setStripeMethodsLoading(true);
      const response = (await payments.listMethods()) as { items?: StripePaymentMethod[] };
      const items = response.items || [];
      setStripeMethods(items);
      setStripeSelectedMethodId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current;
        }
        return items[0]?.id || "";
      });
    } catch (e: any) {
      const message = e?.message || String(e);
      if (!message.includes("503")) {
        setError(message);
      }
      setStripeMethods([]);
    } finally {
      setStripeMethodsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadStripeMethods();
  }, [isAuthenticated, loadStripeMethods]);

  useEffect(() => {
    if (!stripeIntent || stripeSelectedMethodId || !stripePanelOpen) {
      stripeCardElementRef.current?.destroy();
      stripeCardElementRef.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const stripeFactory = await loadStripeJs();
        if (cancelled || !stripeCardMountRef.current) return;
        const stripe = stripeFactory(stripeIntent.stripe.publishable_key);
        if (!stripe) {
          throw new Error("Stripe.js failed to initialize");
        }
        stripeCardElementRef.current?.destroy();
        const elements = stripe.elements();
        const card = elements.create("card", {
          hidePostalCode: true,
          style: {
            base: {
              color: "#e5eef8",
              fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
              fontSize: "16px",
              "::placeholder": { color: "#94a3b8" },
            },
            invalid: {
              color: "#fca5a5",
            },
          },
        } as Record<string, unknown>);
        card.mount(stripeCardMountRef.current);
        stripeCardElementRef.current = card;
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
      stripeCardElementRef.current?.destroy();
      stripeCardElementRef.current = null;
    };
  }, [stripeIntent, stripeSelectedMethodId, stripePanelOpen]);

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

  const openStripeCheckout = async (creditPackage: WorkflowCreditPackage) => {
    try {
      setError("");
      setStripeLoadingSlug(creditPackage.slug);
      setStripePanelOpen(true);
      setStripePackageSlug(creditPackage.slug);
      const requestIdempotencyKey = `${creditPackage.slug}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const response = (await payments.createStripeIntent({
        package_slug: creditPackage.slug,
        currency: stripeCurrency,
        payment_method_id: stripeSelectedMethodId || undefined,
        save_payment_method: stripeSaveMethod,
        note: `wallet-credit-topup:${creditPackage.slug}`,
        idempotency_key: requestIdempotencyKey,
      })) as StripeIntentResponse;
      setStripeIntent(response);
    } catch (e: any) {
      setStripePanelOpen(false);
      setStripeIntent(null);
      setError(e?.message || String(e));
    } finally {
      setStripeLoadingSlug("");
    }
  };

  const refreshStripeIntent = useCallback(async (intentId?: string) => {
    const targetIntentId = intentId || stripeIntent?.item.id;
    if (!targetIntentId) return null;
    const refreshed = (await payments.getStripeIntent(targetIntentId)) as CreditTopUpIntentResponse;
    setStripeIntent((current) => {
      if (!current) return current;
      const refreshedStripeStatus = typeof refreshed.item.provider_payload?.stripe_status === "string"
        ? refreshed.item.provider_payload.stripe_status
        : current.stripe.status;
      return {
        ...current,
        item: refreshed.item,
        package: refreshed.package,
        stripe: {
          ...current.stripe,
          status: refreshedStripeStatus,
        },
      };
    });
    if (refreshed.credited) {
      await loadData();
    }
    return refreshed;
  }, [loadData, stripeIntent?.item.id]);

  const submitStripePayment = async () => {
    if (!stripeIntent) return;
    try {
      setError("");
      setStripeProcessing(true);
      const stripeFactory = await loadStripeJs();
      const stripe = stripeFactory(stripeIntent.stripe.publishable_key);
      if (!stripe) {
        throw new Error("Stripe.js failed to initialize");
      }
      const paymentMethod = stripeSelectedMethodId
        ? stripeSelectedMethodId
        : stripeCardElementRef.current
          ? { card: stripeCardElementRef.current }
          : undefined;
      if (!paymentMethod) {
        throw new Error("Choose a saved card or enter a new card");
      }
      const result = await stripe.confirmCardPayment(stripeIntent.stripe.client_secret, {
        payment_method: paymentMethod,
      });
      if (result.error?.message) {
        throw new Error(result.error.message);
      }
      const status = result.paymentIntent?.status || "processing";
      const confirmedIntentId = stripeIntent.item.id;
      setStripeIntent((current) => (current ? {
        ...current,
        item: {
          ...current.item,
          status,
          payment_reference: result.paymentIntent?.id ? `stripe:${result.paymentIntent.id}` : current.item.payment_reference,
          provider_payload: {
            ...(current.item.provider_payload || {}),
            stripe_status: status,
          },
        },
        stripe: {
          ...current.stripe,
          status,
          payment_intent_id: result.paymentIntent?.id || current.stripe.payment_intent_id,
        },
      } : current));
      await loadStripeMethods();
      if (status === "succeeded" || status === "processing") {
        setStripePolling(true);
        try {
          const maxAttempts = status === "succeeded" ? 6 : 10;
          for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const refreshed = await refreshStripeIntent(confirmedIntentId);
            if (!refreshed) {
              break;
            }
            if (refreshed.credited || refreshed.item.status === "captured") {
              break;
            }
            if (["failed", "cancelled"].includes(refreshed.item.status)) {
              break;
            }
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }
        } finally {
          setStripePolling(false);
        }
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setStripeProcessing(false);
    }
  };

  const removeStripeMethod = async (paymentMethodId: string) => {
    try {
      setError("");
      setStripeRemovingMethodId(paymentMethodId);
      await payments.removeMethod(paymentMethodId);
      if (stripeSelectedMethodId === paymentMethodId) {
        setStripeSelectedMethodId("");
      }
      await loadStripeMethods();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setStripeRemovingMethodId("");
    }
  };

  const closeStripePanel = () => {
    stripeCardElementRef.current?.destroy();
    stripeCardElementRef.current = null;
    setStripePanelOpen(false);
    setStripeIntent(null);
    setStripePackageSlug("");
    setStripeProcessing(false);
  };

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
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      <span>Stripe currency</span>
                      <select
                        value={stripeCurrency}
                        onChange={(event) => setStripeCurrency(event.target.value as StripeCurrency)}
                        style={{ minWidth: 96 }}
                      >
                        {STRIPE_CURRENCIES.map((currency) => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </label>
                    {stripeMethodsLoading && <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading saved cards...</div>}
                    {packagesLoading && <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading packages...</div>}
                  </div>
                </div>

                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                  Stripe is the fiat adapter layer. Current supported checkout currencies: {STRIPE_CURRENCIES.join(", ")}. ACP/manual invoices stay available separately.
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

                {stripePanelOpen && (
                  <div className="card" style={{ marginBottom: 12, borderColor: "rgba(59,130,246,0.35)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ color: "var(--text)", fontWeight: 800 }}>Stripe checkout</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>
                          {stripeIntent
                            ? `Package ${stripeIntent.package.title}: pay ${stripeIntent.stripe.amount.amount} ${stripeIntent.stripe.amount.currency} for ${stripeIntent.package.credit_amount.amount} ${stripeIntent.package.credit_amount.currency}.`
                            : stripePackageSlug
                              ? `Preparing Stripe intent for ${stripePackageSlug} in ${stripeCurrency}...`
                              : "Preparing Stripe checkout..."}
                        </div>
                      </div>
                      <button type="button" className="btn btn-ghost" onClick={closeStripePanel}>
                        Close
                      </button>
                    </div>

                    <div className="responsive-grid responsive-grid-2" style={{ marginBottom: 12 }}>
                      <div className="card" style={{ marginBottom: 0 }}>
                        <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 10 }}>Saved cards</div>
                        {!stripeMethods.length ? (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No saved cards yet. Enter a new card below.</div>
                        ) : (
                          <div style={{ display: "grid", gap: 10 }}>
                            {stripeMethods.map((method) => {
                              const selected = stripeSelectedMethodId === method.id;
                              return (
                                <label key={method.id} style={{ border: selected ? "1px solid rgba(16,185,129,0.45)" : "1px solid var(--border)", borderRadius: 12, padding: 12, display: "grid", gap: 8, cursor: "pointer" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                      <input
                                        type="radio"
                                        name="stripe-payment-method"
                                        checked={selected}
                                        onChange={() => setStripeSelectedMethodId(method.id)}
                                      />
                                      <div>
                                        <div style={{ color: "var(--text)", fontWeight: 700 }}>
                                          {(method.card?.brand || method.type || "card").toUpperCase()} •••• {method.card?.last4 || "----"}
                                        </div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                                          Expires {method.card?.exp_month || "--"}/{method.card?.exp_year || "----"}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      onClick={() => void removeStripeMethod(method.id)}
                                      disabled={stripeRemovingMethodId === method.id}
                                    >
                                      {stripeRemovingMethodId === method.id ? "Removing..." : "Remove"}
                                    </button>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="card" style={{ marginBottom: 0 }}>
                        <div style={{ color: "var(--text)", fontWeight: 700, marginBottom: 10 }}>New card</div>
                        <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>
                          <input
                            type="radio"
                            name="stripe-payment-method"
                            checked={!stripeSelectedMethodId}
                            onChange={() => setStripeSelectedMethodId("")}
                          />
                          Enter a fresh card in Stripe.js
                        </label>
                        <div
                          ref={stripeCardMountRef}
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: 12,
                            minHeight: 48,
                            background: "rgba(15,23,42,0.45)",
                            opacity: stripeSelectedMethodId ? 0.5 : 1,
                          }}
                        />
                        <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 12 }}>
                          <input
                            type="checkbox"
                            checked={stripeSaveMethod}
                            onChange={(event) => setStripeSaveMethod(event.target.checked)}
                          />
                          Save card for the next top-up
                        </label>
                      </div>
                    </div>

                    {stripeIntent && (
                      <div className="card" style={{ marginBottom: 12, borderColor: "var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ color: "var(--text)", fontWeight: 700 }}>Stripe PaymentIntent</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                              {stripeIntent.stripe.payment_intent_id} • status {stripeIntent.stripe.status}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>
                              Ledger credit status: {stripeIntent.item.status}{stripePolling ? " • waiting for webhook..." : ""}
                            </div>
                          </div>
                          <strong style={{ color: stripeIntent.item.status === "captured" ? "var(--accent)" : stripeIntent.stripe.status === "succeeded" ? "var(--accent)" : "var(--text)" }}>
                            {stripeIntent.item.status === "captured" ? "captured" : stripeIntent.stripe.status}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void submitStripePayment()}
                        disabled={!stripeIntent || stripeProcessing || stripePolling || stripeLoadingSlug === stripePackageSlug}
                      >
                        {stripeProcessing ? "Processing..." : stripePolling ? "Waiting for webhook..." : stripeIntent?.item.status === "captured" ? "Credits added" : stripeIntent?.stripe.status === "succeeded" ? "Payment submitted" : "Pay with Stripe"}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={closeStripePanel}>
                        Cancel
                      </button>
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
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Manual / ACP price</div>
                          <strong style={{ color: "var(--text)" }}>{creditPackage.price.amount} {creditPackage.price.currency}</strong>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Stripe checkout</div>
                          <strong style={{ color: "var(--text)" }}>{creditPackage.price.amount} {stripeCurrency}</strong>
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
                      <div style={{ display: "grid", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: "100%" }}
                          onClick={() => createTopUpIntent(creditPackage)}
                          disabled={topUpLoadingSlug === creditPackage.slug}
                        >
                          {topUpLoadingSlug === creditPackage.slug ? "Creating..." : "Create invoice"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ width: "100%" }}
                          onClick={() => void openStripeCheckout(creditPackage)}
                          disabled={stripeLoadingSlug === creditPackage.slug}
                        >
                          {stripeLoadingSlug === creditPackage.slug ? "Preparing Stripe..." : "Pay with Stripe"}
                        </button>
                      </div>
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
