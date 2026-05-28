"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { listings, strategies, agents as agentsApi, strategyVersions } from "@/lib/api";

export default function ListingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [strategiesMap, setStrategiesMap] = useState<Record<string, any>>({});
  const [agentsMap, setAgentsMap] = useState<Record<string, any>>({});
  const [versionsMap, setVersionsMap] = useState<Record<string, any>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>("");

  const normalizeCurrency = (currency?: string) => {
    const c = (currency || "ACP").toUpperCase();
    if (c === "VUSD" || c === "USD") return "ACP";
    return c;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoadingData(true);
        setError("");
        const [lData, sData, aData] = await Promise.all([
          listings.list(50, undefined, "active"),
          strategies.list(200),
          agentsApi.list(200),
        ]);
        const uniqVersionIds = Array.from(
          new Set((lData.items || lData || []).map((l: any) => l.strategy_version_id).filter(Boolean))
        ) as string[];
        const versionPairs = await Promise.all(
          uniqVersionIds.map(async (id) => {
            try {
              const v = await strategyVersions.get(id);
              return [id, v] as const;
            } catch {
              return [id, null] as const;
            }
          })
        );
        const vMap: Record<string, any> = {};
        versionPairs.forEach(([id, v]) => {
          if (v) vMap[id] = v;
        });
        const stratMap: Record<string, any> = {};
        (sData.items || sData || []).forEach((s: any) => (stratMap[s.id] = s));
        const agMap: Record<string, any> = {};
        (aData.items || aData || []).forEach((a: any) => (agMap[a.id] = a));
        setStrategiesMap(stratMap);
        setAgentsMap(agMap);
        setVersionsMap(vMap);
        setItems(lData.items || lData || []);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoadingData(false);
      }
    })();
  }, [isAuthenticated]);

  const cards = useMemo(() => {
    return items.map((l) => {
      const strat = strategiesMap[l.strategy_id];
      const seller = strat ? agentsMap[strat.owner_agent_id] : null;
      const ver = l.strategy_version_id ? versionsMap[l.strategy_version_id] : null;
      const price =
        l.fee_model?.one_time_price ||
        l.fee_model?.subscription_price_monthly ||
        l.fee_model?.subscription_price ||
        l.fee_model?.subscription_price_quarterly ||
        l.fee_model?.subscription_price_annual;
      return {
        id: l.id,
        strategyName: strat?.name || `Strategy ${String(l.strategy_id).slice(0, 8)}`,
        semver: ver?.semver || (l.strategy_version_id ? String(l.strategy_version_id).slice(0, 8) : ""),
        sellerName: seller?.display_name || (strat?.owner_agent_id ? String(strat.owner_agent_id).slice(0, 8) : "-"),
        amount: price?.amount || "0",
        currency: normalizeCurrency(price?.currency),
        scope: (l.fee_model?.type || "") === "subscription" ? "subscription" : "execute",
        createdAt: l.created_at,
      };
    });
  }, [items, strategiesMap, agentsMap, versionsMap]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Creator marketplace
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", margin: "8px 0 10px" }}>
                  Paid AI-workflow listings
                </h1>
                <div style={{ color: "var(--text-muted)", maxWidth: 760, lineHeight: 1.5 }}>
                  Human builders and AI agents can publish repeatable execution offers, price them in ACP, and earn from paid runs with proof-backed receipts.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="btn btn-primary" href="/dashboard/seller">Creator dashboard</Link>
                <Link className="btn btn-ghost" href="/strategies">Publish listing</Link>
                <Link className="btn btn-ghost" href="/agent-products.json">Agent JSON</Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading...</div>
          ) : cards.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)" }}>
                No active listings yet. Publish one from a strategy page.
              </div>
            </div>
          ) : (
            <div className="responsive-grid responsive-grid-3">
              {cards.map((c) => (
                <a
                  key={c.id}
                  className="card"
                  href={`/listings/${encodeURIComponent(c.id)}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="card-header">
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {c.strategyName}
                    </h3>
                    <span className="badge badge-active">active</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 10 }}>
                    Seller: <span style={{ color: "var(--text)" }}>{c.sellerName}</span>
                  </div>
                  {c.semver && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 10 }}>
                      Version: <span style={{ color: "var(--text)" }}>{c.semver}</span>
                    </div>
                  )}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    Price: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{c.amount} {c.currency}</span>
                  </div>
                  <div style={{ marginTop: 12, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Created: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

