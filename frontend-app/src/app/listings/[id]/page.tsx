"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useAuth } from "@/components/AuthProvider";
import { access, agents as agentsApi, listings, orders, strategies, strategyVersions } from "@/lib/api";

export default function ListingDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listingId = params?.id;

  const [listing, setListing] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [buyerAgentId, setBuyerAgentId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [loadingData, setLoadingData] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string>("");
  const normalizeCurrency = (currency?: string) => {
    const c = (currency || "ACP").toUpperCase();
    if (c === "VUSD" || c === "USD") return "ACP";
    return c;
  };

  const formatAmount = (amount?: string) => {
    if (!amount) return "0";
    const n = Number(amount);
    if (Number.isNaN(n)) return amount;
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };

  const [success, setSuccess] = useState<{ orderId: string; grantId?: string } | null>(null);
  const [buyIdk] = useState(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      // @ts-ignore
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !listingId) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const [l, mineAgents] = await Promise.all([
          listings.get(listingId),
          agentsApi.listMine(200),
        ]);
        setListing(l);
        const s = await strategies.get(l.strategy_id);
        setStrategy(s);
        if (l.strategy_version_id) {
          try {
            const v = await strategyVersions.get(l.strategy_version_id);
            setVersion(v);
          } catch {
            setVersion(null);
          }
        } else {
          setVersion(null);
        }
        const agents = mineAgents.items || [];
        setMyAgents(agents);
        setBuyerAgentId(agents[0]?.id || "");
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated, listingId]);

  const price = useMemo(() => {
    const p = listing?.fee_model?.one_time_price || listing?.fee_model?.subscription_price_monthly;
    return {
      amount: formatAmount(p?.amount || "0"),
      currency: normalizeCurrency(p?.currency),
      type: listing?.fee_model?.type || "one_time",
    };
  }, [listing]);

  async function buy() {
    if (!buyerAgentId) {
      setError("Create a buyer agent first (Agents → My).");
      return;
    }
    setPlacing(true);
    setError("");
    setSuccess(null);
    try {
      const order = await orders.place({
        listing_id: String(listingId),
        buyer_type: "agent",
        buyer_id: buyerAgentId,
        payment_method: "ledger",
        note: note || undefined,
        idempotency_key: buyIdk,
      });

      // Best-effort: find the newest grant for this buyer (filtered) and this strategy.
      let grantId: string | undefined;
      try {
        const grants = await access.listGrants(50, undefined, "agent", buyerAgentId);
        const found = (grants.items || []).find((g: any) => g.strategy_id === strategy?.id);
        grantId = found?.id;
      } catch {
        // ignore
      }

      setSuccess({ orderId: order.id, grantId });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setPlacing(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <a className="btn btn-ghost" href="/listings">← Back to listings</a>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
          ) : !listing ? (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)" }}>Listing not found.</div>
            </div>
          ) : success ? (
            <div className="card">
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
                Purchase successful
              </div>
              <div style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                Order created and access grant issued.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  className="btn btn-primary"
                  href={`/access?grantee_type=agent&grantee_id=${encodeURIComponent(buyerAgentId)}`}
                >
                  View access grants
                </a>
                <a
                  className="btn btn-ghost"
                  href={`/runs/new?buyer_agent_id=${encodeURIComponent(
                    buyerAgentId
                  )}&strategy_id=${encodeURIComponent(strategy?.id || "")}&strategy_version_id=${encodeURIComponent(
                    listing?.strategy_version_id || version?.id || ""
                  )}`}
                >
                  Run this strategy
                </a>
                <a className="btn btn-ghost" href="/ledger">
                  View ledger
                </a>
                <a className="btn btn-ghost" href="/orders">
                  View orders
                </a>
              </div>
              <div style={{ marginTop: 16, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Order: {success.orderId}{success.grantId ? ` · Grant: ${success.grantId}` : ""}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  {strategy?.name || `Strategy ${String(listing.strategy_id).slice(0, 8)}`}
                </h1>
                <span className="badge badge-active">{listing.status}</span>
              </div>

              <div style={{ color: "var(--text-muted)", marginBottom: 14 }}>
                Strategy ID: <span style={{ color: "var(--text)" }}>{listing.strategy_id}</span>
              </div>
              {listing?.strategy_version_id && (
                <div style={{ color: "var(--text-muted)", marginBottom: 14 }}>
                  Version:{" "}
                  <span style={{ color: "var(--text)" }}>
                    {version?.semver || String(listing.strategy_version_id).slice(0, 8)}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
                <div className="card" style={{ padding: 12, minWidth: 220 }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Price</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent)" }}>
                    {price.amount} {price.currency}
                  </div>
                </div>
                <div className="card" style={{ padding: 12, minWidth: 220 }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Scope</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>execute</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    Buyer agent
                  </div>
                  <select
                    value={buyerAgentId}
                    onChange={(e) => setBuyerAgentId(e.target.value)}
                    style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  >
                    {myAgents.length === 0 ? (
                      <option value="">No agents yet (create one)</option>
                    ) : (
                      myAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.display_name} ({(a.roles || []).join(", ")})
                        </option>
                      ))
                    )}
                  </select>
                  {myAgents.length === 0 && (
                    <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      Create a buyer agent on <a href="/agents" style={{ color: "var(--accent)", textDecoration: "none" }}>/agents</a>.
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    Note (optional)
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", resize: "vertical" }}
                  />
                </div>
              </div>

              <button className="btn btn-primary" disabled={placing} onClick={buy} style={{ width: "100%" }}>
                {placing ? "Buying…" : "Buy access"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

