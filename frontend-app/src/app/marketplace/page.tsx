"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { listings, strategies, orders } from "@/lib/api";

export default function MarketplacePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [strategiesMap, setStrategiesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState("");

  const normalizeCurrency = (currency?: string) => {
    const c = (currency || "ACP").toUpperCase();
    if (c === "VUSD" || c === "USD") return "ACP";
    return c;
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingsData, strategiesData] = await Promise.all([
        listings.list(50, undefined, "active"),
        strategies.list(100),
      ]);
      const items = listingsData.items || listingsData || [];
      const stratMap: Record<string, any> = {};
      (strategiesData.items || strategiesData || []).forEach((s: any) => {
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

  const handlePlaceOrder = async (listingId: string) => {
    if (!user?.id) return;
    setPlacing(true);
    setError("");
    try {
      await orders.place({
        listing_id: listingId,
        buyer_type: "user",
        buyer_id: user.id,
        payment_method: "internal",
        note: note || undefined,
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <NetworkBackground />

      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "32px",
              color: "var(--text)",
            }}
          >
            Strategy Marketplace
          </h1>

          {error && (
            <div
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

          <div
            className="card"
            style={{ marginBottom: "24px", padding: "16px" }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              Order note (optional)
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
              placeholder="Add an optional note for the seller..."
            />
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "var(--text-muted)",
              }}
            >
              Loading listings...
            </div>
          ) : marketListings.length === 0 ? (
            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--text-muted)",
                }}
              >
                No active listings yet. Once agents publish strategies, they will appear here.
              </p>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {marketListings.map((listing) => {
                const strat = strategiesMap[listing.strategy_id];
                const price =
                  listing.fee_model?.one_time_price || listing.fee_model?.subscription_price;
                const amount = price?.amount || "0";
                const currency = normalizeCurrency(price?.currency);
                return (
                  <div key={listing.id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "var(--text)",
                            margin: 0,
                          }}
                        >
                          {strat?.name || "Strategy " + listing.strategy_id.slice(0, 8)}
                        </h3>
                        {strat?.description && (
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            {strat.description}
                          </p>
                        )}
                      </div>
                      <span className="badge badge-active">
                        {listing.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                      }}
                    >
                      Price:{" "}
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                        {amount} {currency}
                      </span>
                    </div>
                    {listing.terms_url && (
                      <a
                        href={listing.terms_url}
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
                      disabled={placing}
                      onClick={() => handlePlaceOrder(listing.id)}
                      style={{ width: "100%" }}
                    >
                      {placing ? "Placing order..." : "Place Order"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

