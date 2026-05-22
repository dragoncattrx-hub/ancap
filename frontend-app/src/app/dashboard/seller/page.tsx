"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { agents, ledger, workflowStore } from "@/lib/api";

const fieldStyle = { display: "grid", gap: 6 } as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function SellerDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, any>>({});
  const [eventsByAgent, setEventsByAgent] = useState<Record<string, any[]>>({});
  const [revenueSummary, setRevenueSummary] = useState<any | null>(null);
  const [revenueError, setRevenueError] = useState("");
  const [draft, setDraft] = useState({
    title: "Telegram Launch Campaign Builder",
    category: "growth",
    price: "79",
    targetBuyers: "token launch teams, community leads, AI agents buying campaign execution",
    inputSchema: "project_name\ntoken_symbol\nchain\ntarget_audience\ncampaign_goal\nchannels",
    outputItems: "7-day Telegram campaign calendar\nmessage pack\nbounty task list\nrisk notes\nshareable proof receipt",
    proofPolicy: "Every paid run should include price snapshot, input hash, output item list, status timeline, and ledger event.",
  });
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

        try {
          const summary = await workflowStore.revenueSummary(30);
          setRevenueSummary(summary);
          setRevenueError("");
        } catch {
          setRevenueSummary(null);
          setRevenueError("Owner revenue metrics require admin access.");
        }
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
  }, [myAgents, eventsByAgent]);

  const offerDraft = useMemo(() => {
    const inputFields = toLines(draft.inputSchema).map((name) => ({
      name: slugify(name).replace(/-/g, "_") || "field",
      type: "string",
      required: true,
    }));
    const outputItems = toLines(draft.outputItems);
    return {
      type: "creator_workflow_draft",
      title: draft.title,
      slug: slugify(draft.title) || "creator-workflow",
      category: draft.category,
      target_buyers: draft.targetBuyers,
      pricing: {
        amount: draft.price,
        currency: "ACP",
        note: "1 ACP = 1 platform accounting unit",
      },
      input_schema: inputFields,
      output_items: outputItems,
      proof_policy: draft.proofPolicy,
      publish_next_steps: [
        "Build or attach the execution flow",
        "Publish listing with ACP price",
        "Run sample output for trust",
        "Track paid runs and proof receipts",
      ],
    };
  }, [draft]);

  const revenueMetrics = useMemo(() => {
    if (!revenueSummary) return null;
    const skus = revenueSummary.skus || [];
    const capturedAmount = skus.reduce((sum: number, sku: any) => sum + Number(sku.captured_amount || 0), 0);
    const openReservedAmount = skus.reduce((sum: number, sku: any) => sum + Number(sku.open_reserved_amount || 0), 0);
    const capturedRuns = skus.reduce((sum: number, sku: any) => sum + Number(sku.captured_count || 0), 0);
    const topSkus = [...skus]
      .sort((a: any, b: any) => Number(b.captured_amount || 0) - Number(a.captured_amount || 0) || Number(b.quote_count || 0) - Number(a.quote_count || 0))
      .slice(0, 3);
    const quoteCount = Number(revenueSummary.quote_count || 0);
    const paidConversion = quoteCount > 0 ? (capturedRuns / quoteCount) * 100 : 0;
    return {
      capturedAmount,
      openReservedAmount,
      capturedRuns,
      quoteCount,
      paidConversion,
      topSkus,
    };
  }, [revenueSummary]);

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
            Publish paid AI-workflows, track ACP revenue, and understand which creator offers are ready to sell.
          </div>

          <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 18 }}>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Creator promise</div>
              <div style={{ color: "var(--text)", fontWeight: 800, lineHeight: 1.5 }}>
                Package repeatable execution into paid workflow products and earn ACP from successful runs.
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Publishing checklist</div>
              <div style={{ display: "grid", gap: 6, color: "var(--text-muted)", fontSize: "0.92rem" }}>
                <span>1. Define inputs and expected output</span>
                <span>2. Set ACP price and proof policy</span>
                <span>3. Publish offer and track paid runs</span>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 8 }}>Creator actions</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="/flows">Build workflow</a>
                <a className="btn btn-ghost" href="/listings">Publish listing</a>
                <a className="btn btn-ghost" href="/agent-products.json">Agent JSON</a>
              </div>
            </div>
          </div>

          <div className="responsive-grid responsive-grid-2" style={{ marginBottom: 18 }}>
            <div className="card">
              <div className="card-header" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Creator workflow draft
                  </div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 850, color: "var(--text)", margin: "8px 0 6px" }}>
                    Turn an agent skill into a paid SKU
                  </h2>
                  <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                    This builder creates a clean product brief that a human creator or AI agent can use before publishing a paid workflow.
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <label style={fieldStyle}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Workflow title</span>
                  <input
                    className="input"
                    value={draft.title}
                    onChange={(e) => setDraft((value) => ({ ...value, title: e.target.value }))}
                  />
                </label>
                <div className="responsive-grid responsive-grid-2">
                  <label style={fieldStyle}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Category</span>
                    <input
                      className="input"
                      value={draft.category}
                      onChange={(e) => setDraft((value) => ({ ...value, category: e.target.value }))}
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Price in ACP</span>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => setDraft((value) => ({ ...value, price: e.target.value }))}
                    />
                  </label>
                </div>
                <label style={fieldStyle}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Target buyers</span>
                  <textarea
                    className="input"
                    rows={2}
                    value={draft.targetBuyers}
                    onChange={(e) => setDraft((value) => ({ ...value, targetBuyers: e.target.value }))}
                  />
                </label>
                <div className="responsive-grid responsive-grid-2">
                  <label style={fieldStyle}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Input fields, one per line</span>
                    <textarea
                      className="input"
                      rows={6}
                      value={draft.inputSchema}
                      onChange={(e) => setDraft((value) => ({ ...value, inputSchema: e.target.value }))}
                    />
                  </label>
                  <label style={fieldStyle}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Output items, one per line</span>
                    <textarea
                      className="input"
                      rows={6}
                      value={draft.outputItems}
                      onChange={(e) => setDraft((value) => ({ ...value, outputItems: e.target.value }))}
                    />
                  </label>
                </div>
                <label style={fieldStyle}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Proof policy</span>
                  <textarea
                    className="input"
                    rows={3}
                    value={draft.proofPolicy}
                    onChange={(e) => setDraft((value) => ({ ...value, proofPolicy: e.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Agent-readable preview
                  </div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 850, color: "var(--text)", margin: "8px 0 6px" }}>
                    Publish-ready JSON
                  </h2>
                  <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                    A compact schema for agents to understand what they can sell, what inputs are needed, and which proof fields must exist.
                  </div>
                </div>
              </div>
              <pre style={{ margin: 0, padding: 14, border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 430, overflow: "auto" }}>
                {JSON.stringify(offerDraft, null, 2)}
              </pre>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <a className="btn btn-primary" href="/flows">Build flow</a>
                <a className="btn btn-ghost" href="/listings">Publish listing</a>
                <a className="btn btn-ghost" href="/proof-center">Proof center</a>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header" style={{ alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Revenue signal
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 850, color: "var(--text)", margin: "8px 0 6px" }}>
                  Platform workflow revenue snapshot
                </h2>
                <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Owner metrics show which paid SKU actually converts, where ACP is reserved, and what should be promoted next.
                </div>
              </div>
              <a className="btn btn-ghost" href="/billing">Billing</a>
            </div>

            {revenueMetrics ? (
              <>
                <div className="responsive-grid responsive-grid-4" style={{ marginBottom: 14 }}>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>30d quotes</div>
                    <div style={{ color: "var(--text)", fontSize: "1.7rem", fontWeight: 900 }}>{revenueMetrics.quoteCount}</div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Captured revenue</div>
                    <div style={{ color: "var(--accent)", fontSize: "1.7rem", fontWeight: 900 }}>
                      {revenueMetrics.capturedAmount.toFixed(2)} ACP
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Open reserved</div>
                    <div style={{ color: "var(--text)", fontSize: "1.7rem", fontWeight: 900 }}>
                      {revenueMetrics.openReservedAmount.toFixed(2)} ACP
                    </div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Quote to paid</div>
                    <div style={{ color: "var(--text)", fontSize: "1.7rem", fontWeight: 900 }}>
                      {revenueMetrics.paidConversion.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {revenueMetrics.topSkus.length === 0 ? (
                    <div style={{ color: "var(--text-muted)" }}>No paid workflow SKU data yet.</div>
                  ) : revenueMetrics.topSkus.map((sku: any) => (
                    <div key={sku.workflow_slug} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 10, border: "1px solid var(--border)", borderRadius: 12 }}>
                      <div>
                        <div style={{ color: "var(--text)", fontWeight: 800 }}>{sku.title || sku.workflow_slug}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {sku.quote_count} quotes, {sku.captured_count} captured
                        </div>
                      </div>
                      <strong style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>
                        {Number(sku.captured_amount || 0).toFixed(2)} {sku.currency || "ACP"}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                {revenueError || "Revenue summary will appear after owner metrics are available."}
              </div>
            )}
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
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
                    {Object.keys(totals).length === 0 ? "-" : Object.entries(totals).map(([c, v]) => (
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
                          <div style={{ color: "var(--text-muted)" }}>-</div>
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

