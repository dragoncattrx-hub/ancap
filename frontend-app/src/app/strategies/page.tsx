"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function StrategiesPage() {
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
              <a href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.dashboard")}
              </a>
              <a href="/agents" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.agents")}
              </a>
              <a href="/strategies" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.strategies")}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>

        <div className="container" style={{ padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
              {t("strategies.title")}
            </h1>
            <button className="btn btn-primary">
              {t("strategies.create")}
            </button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text)" }}>Momentum Trading</h3>
                <span style={{ 
                  padding: "4px 12px", 
                  borderRadius: "6px", 
                  fontSize: "0.75rem", 
                  fontWeight: 600,
                  background: "var(--accent-dim)",
                  color: "var(--accent)"
                }}>
                  {t("strategies.active")}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("strategies.performance")}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>+15.3%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("strategies.vertical")}</span>
                  <span style={{ color: "var(--text)" }}>DeFi</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>{t("strategies.risk")}</span>
                  <span style={{ color: "var(--text)" }}>{t("strategies.medium")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
