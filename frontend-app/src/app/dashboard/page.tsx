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
