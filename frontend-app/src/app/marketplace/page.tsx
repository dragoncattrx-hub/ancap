"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { listings, orders, subscriptions } from "@/lib/api";

type SubscriptionPeriod = "monthly" | "quarterly" | "annual";
type SortKey = "popular" | "recent" | "price_asc" | "price_desc" | "rating";

type Listing = {
  id: string;
  strategy_id: string;
  strategy_version_id?: string | null;
  strategy_name: string;
  strategy_description?: string | null;
  category?: string | null;
  status: string;
  fee_model?: {
    type?: string;
    one_time_price?: { amount?: string; currency?: string };
    subscription_price?: { amount?: string; currency?: string };
    subscription_price_monthly?: { amount?: string; currency?: string };
    subscription_price_quarterly?: { amount?: string; currency?: string };
    subscription_price_annual?: { amount?: string; currency?: string };
  };
  price?: { amount?: string; currency?: string };
  terms_url?: string | null;
  notes?: string | null;
  listing_views?: number;
  listing_purchases?: number;
  rating?: number;
  rating_count?: number;
  is_featured?: boolean;
  is_trending?: boolean;
  created_at?: string;
};

type MarketplaceResponse = {
  items: Listing[];
  total: number;
  limit: number;
  offset: number;
  available_categories: string[];
};

function normalizeCurrency(currency?: string): string {
  const c = (currency || "ACP").toUpperCase();
  if (c === "VUSD" || c === "USD") return "ACP";
  return c;
}

function formatAmount(amount?: string): string {
  if (!amount) return "0";
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function listingPrice(l: Listing): { amount: string; currency: string; numeric: number } {
  const price =
    l.price ||
    l.fee_model?.one_time_price ||
    l.fee_model?.subscription_price_monthly ||
    l.fee_model?.subscription_price ||
    l.fee_model?.subscription_price_quarterly ||
    l.fee_model?.subscription_price_annual;
  const amount = price?.amount || "0";
  const currency = normalizeCurrency(price?.currency);
  const numeric = Number(amount);
  return { amount, currency, numeric: Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY };
}

function subscriptionPriceForPeriod(l: Listing, period: SubscriptionPeriod) {
  if (period === "quarterly") return l.fee_model?.subscription_price_quarterly;
  if (period === "annual") return l.fee_model?.subscription_price_annual;
  return l.fee_model?.subscription_price_monthly || l.fee_model?.subscription_price;
}

function availableSubscriptionPeriods(l: Listing): SubscriptionPeriod[] {
  const periods: SubscriptionPeriod[] = [];
  if (subscriptionPriceForPeriod(l, "monthly")) periods.push("monthly");
  if (subscriptionPriceForPeriod(l, "quarterly")) periods.push("quarterly");
  if (subscriptionPriceForPeriod(l, "annual")) periods.push("annual");
  return periods;
}

function subscriptionPeriodLabel(period: SubscriptionPeriod): string {
  if (period === "quarterly") return "Quarterly";
  if (period === "annual") return "Annual";
  return "Monthly";
}

export default function MarketplacePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [response, setResponse] = useState<MarketplaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [placingId, setPlacingId] = useState<string | null>(null);
  const [orderListingId, setOrderListingId] = useState<string | null>(null);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<SubscriptionPeriod>("monthly");
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, search, category, sort, priceMin, priceMax]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listings.marketplace({
        search: search || undefined,
        category: category !== "all" ? category : undefined,
        sort,
        price_min: priceMin ? priceMin : undefined,
        price_max: priceMax ? priceMax : undefined,
        limit: 50,
        offset: 0,
      });
      setResponse(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  const marketListings = useMemo(() => response?.items ?? [], [response?.items]);
  const categories = useMemo(() => response?.available_categories ?? [], [response?.available_categories]);

  const featuredListings = useMemo(() => marketListings.filter((item) => item.is_featured), [marketListings]);
  const trendingListings = useMemo(() => marketListings.filter((item) => item.is_trending), [marketListings]);

  const handlePlaceOrder = async () => {
    if (!user?.id || !orderListingId) return;
    setPlacingId(orderListingId);
    setError("");
    try {
      const targetListing = marketListings.find((l) => l.id === orderListingId);
      const isSubscription = (targetListing?.fee_model?.type || "") === "subscription";
      if (isSubscription) {
        await subscriptions.create({
          listing_id: orderListingId,
          billing_period: subscriptionPeriod,
          auto_renew: true,
        });
        setConfirmation(`Subscription started (${subscriptionPeriodLabel(subscriptionPeriod).toLowerCase()}).`);
      } else {
        await orders.place({
          listing_id: orderListingId,
          buyer_type: "user",
          buyer_id: user.id,
          payment_method: "internal",
          note: note.trim() || undefined,
        });
        setConfirmation("Order placed.");
      }
      setOrderListingId(null);
      setSubscriptionPeriod("monthly");
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
  const orderingSubscriptionPeriods = orderingListing ? availableSubscriptionPeriods(orderingListing) : [];
  const orderingPrice = orderingListing
    ? (orderingListing.fee_model?.type || "") === "subscription"
      ? (() => {
          const price = subscriptionPriceForPeriod(orderingListing, subscriptionPeriod) || subscriptionPriceForPeriod(orderingListing, orderingSubscriptionPeriods[0] || "monthly");
          return price
            ? {
                amount: price.amount || "0",
                currency: normalizeCurrency(price.currency),
                numeric: Number(price.amount || "0"),
              }
            : listingPrice(orderingListing);
        })()
      : listingPrice(orderingListing)
    : null;

  return (
    <>
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Strategy Marketplace</h1>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6 }}>
                {response?.total ?? marketListings.length} listings
                {featuredListings.length ? ` · ${featuredListings.length} featured` : ""}
                {trendingListings.length ? ` · ${trendingListings.length} trending` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span className="badge badge-active">ACP-first</span>
              {featuredListings.length > 0 ? <span className="badge">Featured ready</span> : null}
              {trendingListings.length > 0 ? <span className="badge">Trending live</span> : null}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 2fr) repeat(4, minmax(120px, 1fr))", gap: 12, alignItems: "end" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Search</span>
                <input
                  type="search"
                  placeholder="Search strategy, description, category"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search listings"
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.95rem", width: "100%" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }}>
                  <option value="all">All</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Min price</span>
                <input value={priceMin} onChange={(e) => setPriceMin(e.target.value)} inputMode="decimal" placeholder="0" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Max price</span>
                <input value={priceMax} onChange={(e) => setPriceMax(e.target.value)} inputMode="decimal" placeholder="Any" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort listings" style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }}>
                  <option value="popular">Popular</option>
                  <option value="recent">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="rating">Top rated</option>
                </select>
              </label>
            </div>
          </div>

          {featuredListings.length > 0 && !loading ? (
            <div className="card" style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>Featured</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {featuredListings.slice(0, 4).map((listing) => (
                  <button
                    key={listing.id}
                    className="btn btn-ghost"
                    onClick={() => {
                      setOrderListingId(listing.id);
                      setSubscriptionPeriod(availableSubscriptionPeriods(listing)[0] || "monthly");
                      setConfirmation(null);
                    }}
                  >
                    {listing.strategy_name} · {formatAmount(listingPrice(listing).amount)} {listingPrice(listing).currency}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error && (
            <div role="alert" style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.9rem", marginBottom: "24px" }}>
              {error}
            </div>
          )}

          {confirmation && !error && (
            <div role="status" style={{ padding: "12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "0.9rem", marginBottom: "24px" }}>
              {confirmation}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>Loading listings...</div>
          ) : marketListings.length === 0 ? (
            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
                {response?.total === 0 && !search && category === "all" && !priceMin && !priceMax
                  ? "No active listings yet. Once agents publish strategies, they will appear here."
                  : "No listings match the current filters."}
              </p>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {marketListings.map((listing) => {
                const price = listingPrice(listing);
                const isSubscription = (listing.fee_model?.type || "") === "subscription";
                const defaultPeriod = availableSubscriptionPeriods(listing)[0] || "monthly";
                return (
                  <div key={listing.id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }} title={listing.strategy_name}>
                          {listing.strategy_name}
                        </h3>
                        {listing.strategy_description ? (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{listing.strategy_description}</p>
                        ) : null}
                      </div>
                      <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
                        <span className="badge badge-active">{listing.status}</span>
                        {listing.is_featured ? <span className="badge">featured</span> : null}
                        {listing.is_trending ? <span className="badge">trending</span> : null}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                      {listing.category ? <span className="badge">{listing.category}</span> : null}
                      <span className="badge">{listing.listing_purchases || 0} purchases</span>
                      <span className="badge">{listing.listing_views || 0} views</span>
                      <span className="badge">rating {Number(listing.rating || 0).toFixed(2)}</span>
                    </div>

                    <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                      Price: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{formatAmount(price.amount)} {price.currency}</span>
                      {isSubscription ? <span style={{ color: "var(--text-muted)" }}> · {subscriptionPeriodLabel(defaultPeriod)}</span> : null}
                    </div>

                    {listing.terms_url ? (
                      <a href={listing.terms_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none", display: "inline-block", marginBottom: "12px" }}>
                        Terms & Conditions
                      </a>
                    ) : null}

                    <button
                      className="btn btn-primary"
                      disabled={placingId === listing.id}
                      onClick={() => {
                        setOrderListingId(listing.id);
                        setSubscriptionPeriod(defaultPeriod);
                        setConfirmation(null);
                      }}
                      style={{ width: "100%" }}
                    >
                      {placingId === listing.id
                        ? (isSubscription ? "Starting subscription..." : "Placing order...")
                        : (isSubscription ? "Subscribe" : "Place Order")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {orderListingId && orderingListing && orderingPrice ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm order"
          style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !placingId) setOrderListingId(null);
          }}
        >
          <div className="card" style={{ maxWidth: 500, width: "100%" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
              {(orderingListing.fee_model?.type || "") === "subscription" ? "Confirm subscription" : "Confirm order"}
            </h2>
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 16 }}>
              {orderingListing.strategy_name} · <strong style={{ color: "var(--accent)" }}>{formatAmount(orderingPrice.amount)} {orderingPrice.currency}</strong>
              {(orderingListing.fee_model?.type || "") === "subscription" ? ` / ${subscriptionPeriodLabel(subscriptionPeriod).toLowerCase()}` : ""}
            </div>
            {(orderingListing.fee_model?.type || "") === "subscription" && orderingSubscriptionPeriods.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: 6, color: "var(--text)" }}>Billing period</label>
                <select
                  value={subscriptionPeriod}
                  onChange={(e) => setSubscriptionPeriod(e.target.value as SubscriptionPeriod)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem" }}
                >
                  {orderingSubscriptionPeriods.map((period) => {
                    const price = subscriptionPriceForPeriod(orderingListing, period);
                    return (
                      <option key={period} value={period}>
                        {subscriptionPeriodLabel(period)}{price ? ` · ${formatAmount(price.amount || "0")} ${normalizeCurrency(price.currency)}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : null}
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: 6, color: "var(--text)" }}>Note for the seller (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add an optional note for the seller..."
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.9rem", resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={placingId !== null} style={{ flex: 1 }}>
                {placingId
                  ? ((orderingListing.fee_model?.type || "") === "subscription" ? "Starting..." : "Placing...")
                  : ((orderingListing.fee_model?.type || "") === "subscription" ? "Confirm and subscribe" : "Confirm and pay")}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  if (!placingId) {
                    setOrderListingId(null);
                    setSubscriptionPeriod("monthly");
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
      ) : null}
    </>
  );
}
