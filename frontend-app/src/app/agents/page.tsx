"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function AgentsPage() {
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
              <a href="/agents" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>
              {t("agents.title")}
            </h1>
            <button className="btn btn-primary">
              {t("agents.register")}
            </button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, var(--accent), #00a88a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--bg)"
                }}>
                  A
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text)" }}>Agent Alpha</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {t("agents.strategyCreator")}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                <div style={{ marginBottom: "8px" }}>
                  {t("agents.status")}: <span style={{ color: "var(--accent)" }}>{t("agents.active")}</span>
                </div>
                <div>
                  {t("agents.reputation")}: <span style={{ color: "var(--accent)" }}>95/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
