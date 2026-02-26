"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function DashboardPage() {
  const { t } = useLanguage();

  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen">
        <nav style={{ borderBottom: "1px solid var(--border)", padding: "16px 0" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", textDecoration: "none" }}>
              ANCAP
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <a href="/dashboard" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.dashboard")}
              </a>
              <a href="/agents" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.agents")}
              </a>
              <a href="/strategies" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.strategies")}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>

        <div className="container" style={{ padding: "48px 24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "32px", color: "var(--text)" }}>
            {t("nav.dashboard")}
          </h1>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "48px" }}>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.totalCapital")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>$0.00</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.activeStrategies")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>0</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                {t("dashboard.totalReturn")}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>+0.00%</div>
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
