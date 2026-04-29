"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { listings, strategies, orders } from "@/lib/api";

type Listing = {
  id: string;
  strategy_id: string;
  status: string;
  fee_model?: {
    one_time_price?: { amount?: string; currency?: string };
    subscription_price?: { amount?: string; currency?: string };
  };
  terms_url?: string | null;
  created_at?: string;
};

type Strategy = {
  id: string;
  name?: string;
  description?: string;
};

type StrategyGroup = {
  strategy_id: string;
  strategy: Strategy | null;
  listings: Listing[];
  /** Cheapest active listing in the group, used for default sort and CTA. */
  primary: Listing;
  primaryAmountAcp: number;
};

type SortKey = "priceAsc" | "priceDesc" | "newest";

function normalizeCurrency(currency?: string): string {
  const c = (currency || "ACP").toUpperCase();
  if (c === "VUSD" || c === "USD") return "ACP";
  return c;
}

function listingPrice(l: Listing): { amount: string; currency: string; numeric: number } {
  const price = l.fee_model?.one_time_price || l.fee_model?.subscription_price;
  const amount = price?.amount || "0";
  const currency = normalizeCurrency(price?.currency);
  const numeric = Number(amount);
  return { amount, currency, numeric: Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY };
}

function strategyDisplayName(s: Strategy | null, listing: Listing): string {
  if (s?.name) return s.name;
  return "Strategy " + listing.strategy_id.slice(0, 8);
}

export default function MarketplacePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [marketListings, setMarketListings] = useState<Listing[]>([]);
  const [strategiesMap, setStrategiesMap] = useState<Record<string, Strategy>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [placingId, setPlacingId] = useState<string | null>(null);
  const [orderListingId, setOrderListingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("priceAsc");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
    // loadData is local and stable for this scope; safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingsData, strategiesData] = await Promise.all([
        listings.list(50, undefined, "active"),
        strategies.list(100),
      ]);
      const items: Listing[] = listingsData.items || listingsData || [];
      const stratMap: Record<string, Strategy> = {};
      ((strategiesData.items || strategiesData || []) as Strategy[]).forEach((s) => {
        stratMap[s.id] = s;
      });
      setMarketListings(items);
      setStrategiesMap(stratMap);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  /**
   * The live data exposes the same strategy as multiple listings (different prices,
   * the same strategy_id). Group them so each strategy renders once with a
   * "N price variants" disclosure, and sorting/filtering happens on the cheapest
   * variant. This removes the "6 identical Revenue Funnel" prod surprise.
   */
  const groups = useMemo<StrategyGroup[]>(() => {
    const byStrategy = new Map<string, Listing[]>();
    for (const l of marketListings) {
      const arr = byStrategy.get(l.strategy_id) ?? [];
      arr.push(l);
      byStrategy.set(l.strategy_id, arr);
    }
    const out: StrategyGroup[] = [];
    for (const [strategy_id, ls] of byStrategy.entries()) {
      const sorted = [...ls].sort((a, b) => listingPrice(a).numeric - listingPrice(b).numeric);
      const primary = sorted[0];
      out.push({
        strategy_id,
        strategy: strategiesMap[strategy_id] ?? null,
        listings: sorted,
        primary,
        primaryAmountAcp: listingPrice(primary).numeric,
      });
    }
    return out;
  }, [marketListings, strategiesMap]);

  const visibleGroups = useMemo<StrategyGroup[]>(() => {
    const q = search.trim().toLowerCase();
    let arr = groups;
    if (q) {
      arr = arr.filter((g) => {
        const name = strategyDisplayName(g.strategy, g.primary).toLowerCase();
        const desc = (g.strategy?.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q) || g.strategy_id.toLowerCase().includes(q);
      });
    }
    const copy = [...arr];
    if (sort === "priceAsc") copy.sort((a, b) => a.primaryAmountAcp - b.primaryAmountAcp);
    else if (sort === "priceDesc") copy.sort((a, b) => b.primaryAmountAcp - a.primaryAmountAcp);
    else if (sort === "newest") copy.sort((a, b) => (b.primary.created_at || "").localeCompare(a.primary.created_at || ""));
    return copy;
  }, [groups, search, sort]);

  const handlePlaceOrder = async () => {
    if (!user?.id || !orderListingId) return;
    setPlacingId(orderListingId);
    setError("");
    try {
      await orders.place({
        listing_id: orderListingId,
        buyer_type: "user",
        buyer_id: user.id,
        payment_method: "internal",
        note: note.trim() || undefined,
      });
      setConfirmation("Order placed.");
      setOrderListingId(null);
      setNote("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setPlacingId(null);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  const orderingListing = orderListingId ? marketListings.find((l) => l.id === orderListingId) : null;
  const orderingStrategy = orderingListing ? strategiesMap[orderingListing.strategy_id] ?? null : null;
  const orderingPrice = orderingListing ? listingPrice(orderingListing) : null;

  return (
    <>
      <NetworkBackground />

      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Strategy Marketplace
            </h1>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {groups.length} {groups.length === 1 ? "strategy" : "strategies"} · {marketListings.length} listings
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <input
              type="search"
              placeholder="Search by strategy name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search strategies"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.95rem",
                width: "100%",
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort listings"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.9rem",
              }}
            >
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                fontSize: "0.9rem",
                marginBottom: "24px",
              }}
            >
              {error}
            </div>
          )}

          {confirmation && !error && (
            <div
              role="status"
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                fontSize: "0.9rem",
                marginBottom: "24px",
              }}
            >
              {confirmation}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
              Loading listings...
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
                {marketListings.length === 0
                  ? "No active listings yet. Once agents publish strategies, they will appear here."
                  : "No strategies match your search."}
              </p>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {visibleGroups.map((g) => {
                const name = strategyDisplayName(g.strategy, g.primary);
                const desc = g.strategy?.description;
                const variantCount = g.listings.length;
                const cheapest = listingPrice(g.primary);
                return (
                  <div key={g.strategy_id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "var(--text)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={name}
                        >
                          {name}
                        </h3>
                        {desc && (
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            {desc}
                          </p>
                        )}
                      </div>
                      <span className="badge badge-active">active</span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                      }}
                    >
                      {variantCount > 1 ? "From " : "Price: "}
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                        {cheapest.amount} {cheapest.currency}
                      </span>
                      {variantCount > 1 ? (
                        <span style={{ color: "var(--text-muted)" }}>
                          {" "}· {variantCount} variants
                        </span>
                      ) : null}
                    </div>

                    {variantCount > 1 ? (
                      <details style={{ marginBottom: 12 }}>
                        <summary style={{ cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          Show all {variantCount} listings
                        </summary>
                        <ul style={{ marginTop: 8, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                          {g.listings.map((l) => {
                            const p = listingPrice(l);
                            return (
                              <li
                                key={l.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "0.85rem",
                                  padding: "6px 0",
                                  borderTop: "1px solid var(--border)",
                                }}
                              >
                                <span style={{ color: "var(--text-muted)" }}>
                                  {p.amount} {p.currency}
                                </span>
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: "4px 10px", fontSize: "0.85rem" }}
                                  disabled={placingId === l.id}
                                  onClick={() => {
                                    setOrderListingId(l.id);
                                    setConfirmation(null);
                                  }}
                                >
                                  Buy
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    ) : null}

                    {g.primary.terms_url && (
                      <a
                        href={g.primary.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--accent)",
                          textDecoration: "none",
                          display: "inline-block",
                          marginBottom: "12px",
                        }}
                      >
                        Terms & Conditions
                      </a>
                    )}

                    <button
                      className="btn btn-primary"
                      disabled={placingId === g.primary.id}
                      onClick={() => {
                        setOrderListingId(g.primary.id);
                        setConfirmation(null);
                      }}
                      style={{ width: "100%" }}
                    >
                      {placingId === g.primary.id ? "Placing order..." : "Place Order"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {orderListingId && orderingListing && orderingPrice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm order"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !placingId) setOrderListingId(null);
          }}
        >
          <div className="card" style={{ maxWidth: 500, width: "100%" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
              Confirm order
            </h2>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 16 }}>
              {strategyDisplayName(orderingStrategy, orderingListing)} ·{" "}
              <strong style={{ color: "var(--accent)" }}>
                {orderingPrice.amount} {orderingPrice.currency}
              </strong>
            </div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: 6, color: "var(--text)" }}>
              Note for the seller (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add an optional note for the seller..."
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={placingId !== null}
                style={{ flex: 1 }}
              >
                {placingId ? "Placing..." : "Confirm and pay"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (!placingId) {
                    setOrderListingId(null);
                    setNote("");
                  }
                }}
                disabled={placingId !== null}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
