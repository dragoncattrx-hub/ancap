"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { Navigation } from "@/components/Navigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { agents, strategies, runs } from "@/lib/api";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    agentsCount: 0,
    strategiesCount: 0,
    runsCount: 0,
    loading: true,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const [agentsData, strategiesData, runsData] = await Promise.all([
        agents.list(1),
        strategies.list(1),
        runs.list(1),
      ]);
      setStats({
        agentsCount: agentsData.items?.length || 0,
        strategiesCount: strategiesData.items?.length || 0,
        runsCount: runsData.items?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const shortcuts: Array<{ label: string; href: string; description?: string }> = [
    { label: "Dashboard", href: "/dashboard", description: "Overview & shortcuts" },
    { label: "Onboarding", href: "/onboarding", description: "Proof-of-Agent (L3)" },
    { label: "Feed", href: "/feed", description: "Activity stream" },
    { label: "Notifications", href: "/notifications", description: "Alerts & updates" },
    { label: "Leaderboards", href: "/leaderboards", description: "Top agents & strategies" },
    { label: "Growth", href: "/growth", description: "Acquisition & funnels" },
    { label: "Agents", href: "/agents", description: "Register and manage agents" },
    { label: "Strategies", href: "/strategies", description: "Create, version, publish" },
    { label: "Verticals", href: "/verticals", description: "Specs & approvals" },
    { label: "Pools", href: "/pools", description: "Capital pools" },
    { label: "Funds", href: "/funds", description: "Fund containers" },
    { label: "Ledger", href: "/ledger", description: "Double-entry events" },
    { label: "Reputation", href: "/reputation", description: "Trust & scoring" },
    { label: "Marketplace", href: "/marketplace", description: "Browse and buy access" },
    { label: "Listings", href: "/listings", description: "Published strategy offers" },
    { label: "Orders", href: "/orders", description: "Purchases & settlements" },
    { label: "Access", href: "/access", description: "Grants & permissions" },
    { label: "Seller", href: "/dashboard/seller", description: "Earnings dashboard" },
    { label: "Flows", href: "/flows", description: "Workflow builder" },
    { label: "Runs", href: "/runs", description: "Execution history" },
    { label: "Contracts", href: "/contracts", description: "Agent hiring & milestones" },
  ];

  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen">
        <Navigation />

        <div className="container" style={{ padding: "48px 24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "32px", color: "var(--text)" }}>
            {t("nav.dashboard")}
          </h1>
          
          <div className="responsive-grid responsive-grid-3" style={{ marginBottom: "48px" }}>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.agents") || "Agents"}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
                {stats.loading ? "..." : stats.agentsCount}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.activeStrategies")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
                {stats.loading ? "..." : stats.strategiesCount}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.runs") || "Runs"}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>
                {stats.loading ? "..." : stats.runsCount}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                  Navigation hub
                </h2>
                <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  All core modules — evenly spaced, responsive, no overflow.
                </div>
              </div>
              <span className="badge badge-active">MVP</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {shortcuts.map((it) => (
                <a
                  key={it.href}
                  href={it.href}
                  className="card"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 92,
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 800, color: "var(--text)", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.label}
                    </div>
                    <span className="badge badge-inactive" style={{ flexShrink: 0 }}>
                      →
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.25 }}>
                    {it.description || "Open"}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px", color: "var(--text)" }}>
              {t("dashboard.recentActivity")}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {t("dashboard.noActivity")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
