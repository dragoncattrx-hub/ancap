"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, access, ledger, orders, payments, runs as runsApi, system, workflowStore } from "@/lib/api";

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
  const [workflowRevenue, setWorkflowRevenue] = useState<any | null>(null);
  const [pendingTopUps, setPendingTopUps] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [refundActionId, setRefundActionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const loadAdminOverview = async () => {
    try {
      setLoading(true);
      setError("");
      const [healthRes, ledgerStatusRes, ordersRes, grantsRes, runsRes, failedRunsRes, ledgerEventsRes, workflowRevenueRes, topUpsRes, refundRequestsRes] =
        await Promise.all([
          system.health(),
          system.ledgerInvariantStatus(),
          orders.list(20),
          access.listGrants(20),
          runsApi.list(20),
          runsApi.list(20, undefined),
          ledger.getEvents(undefined, 50),
          workflowStore.revenueSummary(30),
          workflowStore.listAdminTopUpIntents("requires_payment", 20),
          payments.listRefundRequests("pending"),
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
      setWorkflowRevenue(workflowRevenueRes);
      setPendingTopUps(topUpsRes.items || []);
      setRefundRequests(refundRequestsRes.items || []);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Admin access required for this page.");
      } else if (e instanceof ApiError && e.status === 503) {
        setError("Admin access is not configured yet.");
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAdminOverview();
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  const capturedTotals = (workflowRevenue?.totals || []).filter((item: any) => item.status === "captured");
  const reservedTotals = (workflowRevenue?.totals || []).filter((item: any) => item.status === "reserved");
  const refundedTotals = (workflowRevenue?.totals || []).filter((item: any) => item.status === "refunded");
  const topWorkflowSkus = (workflowRevenue?.skus || []).slice(0, 5);
  const moneyLine = (items: any[]) =>
    items.length ? items.map((item) => `${item.amount} ${item.currency}`).join(" · ") : "0";

  const approveTopUp = async (topUp: any) => {
    try {
      setError("");
      const reference = topUp?.item?.payment_reference || `admin-${Date.now()}`;
      await workflowStore.approveCreditTopUpIntent(topUp.item.id, {
        payment_reference: reference,
        note: "admin top-up approval",
      });
      const refreshed = await workflowStore.listAdminTopUpIntents("requires_payment", 20);
      setPendingTopUps(refreshed.items || []);
      const revenue = await workflowStore.revenueSummary(30);
      setWorkflowRevenue(revenue);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Admin access required for top-up approval.");
      } else if (e instanceof ApiError && e.status === 503) {
        setError("Admin access is not configured yet.");
      } else {
        setError(e?.message || String(e));
      }
    }
  };

  const approveRefundRequest = async (refundRequest: any) => {
    try {
      setError("");
      setRefundActionId(`${refundRequest.id}:approve`);
      await payments.approveRefundRequest(refundRequest.id, {
        admin_notes: "Approved from admin overview",
      });
      await loadAdminOverview();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Admin access required for refund approval.");
      } else if (e instanceof ApiError && e.status === 503) {
        setError("Admin access is not configured yet.");
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setRefundActionId("");
    }
  };

  const rejectRefundRequest = async (refundRequest: any) => {
    try {
      setError("");
      setRefundActionId(`${refundRequest.id}:reject`);
      await payments.rejectRefundRequest(refundRequest.id, {
        admin_notes: "Rejected from admin overview",
      });
      await loadAdminOverview();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 403) {
        setError("Admin access required for refund rejection.");
      } else if (e instanceof ApiError && e.status === 503) {
        setError("Admin access is not configured yet.");
      } else {
        setError(e?.message || String(e));
      }
    } finally {
      setRefundActionId("");
    }
  };

  return (
    <>
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
              <div className="card" style={{ marginBottom: 18 }}>
                <div className="card-header" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Workflow revenue
                    </div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
                      Paid workflow monetization
                    </h2>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                      Last {workflowRevenue?.window_days || 30} days · quotes, reserved credits, captured revenue, refunds.
                    </div>
                  </div>
                  <a className="btn btn-ghost" href={workflowStore.revenueExportUrl(30)}>Refresh JSON</a>
                </div>

                <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Quotes created</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text)" }}>
                      {workflowRevenue?.quote_count ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Captured revenue</div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--accent)" }}>
                      {moneyLine(capturedTotals)}
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Open reserved / refunded</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text)" }}>
                      Reserved: {moneyLine(reservedTotals)}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: 4 }}>
                      Refunded: {moneyLine(refundedTotals)}
                    </div>
                  </div>
                </div>

                <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Estimated provider cost</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text)" }}>
                      {moneyLine(workflowRevenue?.estimated_cost_totals || [])}
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Estimated margin</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>
                      {moneyLine(workflowRevenue?.estimated_margin_totals || [])}
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 6 }}>Referral commission</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text)" }}>
                      {moneyLine(workflowRevenue?.referral_commission_totals || [])}
                    </div>
                  </div>
                </div>

                {topWorkflowSkus.length === 0 ? (
                  <div style={{ color: "var(--text-muted)" }}>No workflow revenue data yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {topWorkflowSkus.map((sku: any) => (
                      <div key={`${sku.workflow_slug}-${sku.currency}`} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ color: "var(--text)", fontWeight: 800 }}>{sku.title}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                              {sku.workflow_slug} · {sku.category} · {sku.currency}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ color: "var(--accent)", fontWeight: 900 }}>
                              {sku.captured_amount} {sku.currency}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                              quotes {sku.quote_count} · captured {sku.captured_count} · reserved {sku.reserved_count}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 3 }}>
                              est. cost {sku.estimated_cost_amount} {sku.currency} · est. margin {sku.estimated_margin_amount} {sku.currency} · referral {sku.referral_commission_amount} {sku.currency}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="responsive-grid responsive-grid-2" style={{ marginBottom: 18 }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Credit top-ups
                      </div>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
                        Pending approvals
                      </h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        Manual invoices wait here before credits are posted to the user ledger.
                      </div>
                    </div>
                  </div>

                  {pendingTopUps.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No pending credit top-ups.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {pendingTopUps.map((topUp: any) => (
                        <div key={topUp.item.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <div style={{ color: "var(--text)", fontWeight: 800 }}>{topUp.package.title}</div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                                User {String(topUp.item.owner_user_id).slice(0, 8)} · pays {topUp.item.amount.amount} {topUp.item.amount.currency} · receives {topUp.package.credit_amount.amount} {topUp.package.credit_amount.currency}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 3, wordBreak: "break-all" }}>
                                {topUp.item.payment_reference}
                              </div>
                            </div>
                            <button type="button" className="btn btn-primary" onClick={() => approveTopUp(topUp)}>
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Refund requests
                      </div>
                      <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 0" }}>
                        Pending refund review
                      </h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 6 }}>
                        Captured workflow payments can be approved back to the user ledger or rejected with admin review.
                      </div>
                    </div>
                  </div>

                  {refundRequests.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No pending refund requests.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {refundRequests.map((refundRequest: any) => (
                        <div key={refundRequest.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ color: "var(--text)", fontWeight: 800 }}>
                                {refundRequest.amount.amount} {refundRequest.amount.currency} · {refundRequest.status}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 3 }}>
                                User {String(refundRequest.user_id).slice(0, 8)} · payment {String(refundRequest.payment_intent_id).slice(0, 8)}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {refundRequest.reason}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 6 }}>
                                Created {new Date(refundRequest.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => approveRefundRequest(refundRequest)}
                                disabled={refundActionId === `${refundRequest.id}:approve` || refundActionId === `${refundRequest.id}:reject`}
                              >
                                {refundActionId === `${refundRequest.id}:approve` ? "Approving..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => rejectRefundRequest(refundRequest)}
                                disabled={refundActionId === `${refundRequest.id}:approve` || refundActionId === `${refundRequest.id}:reject`}
                              >
                                {refundActionId === `${refundRequest.id}:reject` ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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

