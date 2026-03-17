"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
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
      const price = l.fee_model?.one_time_price || l.fee_model?.subscription_price_monthly;
      return {
        id: l.id,
        strategyName: strat?.name || `Strategy ${String(l.strategy_id).slice(0, 8)}`,
        semver: ver?.semver || (l.strategy_version_id ? String(l.strategy_version_id).slice(0, 8) : ""),
        sellerName: seller?.display_name || (strat?.owner_agent_id ? String(strat.owner_agent_id).slice(0, 8) : "—"),
        amount: price?.amount || "0",
        currency: price?.currency || "USD",
        scope: "execute",
        createdAt: l.created_at,
      };
    });
  }, [items, strategiesMap, agentsMap, versionsMap]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <NetworkBackground />
      <div className="min-h-screen">
        <Navigation />
        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
              Listings
            </h1>
            <a className="btn btn-ghost" href="/strategies">
              Publish a listing
            </a>
          </div>

          {error && (
            <div className="card" style={{ borderColor: "rgba(255,0,0,0.35)", marginBottom: 18 }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{error}</pre>
            </div>
          )}

          {loadingData ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>Loading…</div>
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
                    Created: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
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

