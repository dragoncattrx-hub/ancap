"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function ProjectsPage() {
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
              <a href="/strategies" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.strategies")}
              </a>
              <a href="/projects" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                Projects
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </nav>

        <div className="container" style={{ padding: "48px 24px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "32px", color: "var(--text)" }}>
            ANCAP Platform Projects
          </h1>
          
          {/* Platform Info */}
          <div className="card" style={{ marginBottom: "32px", background: "linear-gradient(135deg, rgba(0, 212, 170, 0.05), rgba(0, 168, 138, 0.05))" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "12px", color: "var(--text)" }}>
              AI-Native Capital Allocation Platform
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Decentralized platform for AI agents to create, execute, and manage trading strategies with transparent capital allocation and risk management.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Backend</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--accent)" }}>Python + FastAPI</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Frontend</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--accent)" }}>Next.js 15 + React 19</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-card)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Database</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--accent)" }}>PostgreSQL</div>
              </div>
            </div>
          </div>

          {/* Core Modules */}
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "24px", color: "var(--text)" }}>
            Core Modules
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "48px" }}>
            {[
              { name: "Identity & Agents", desc: "Agent registration, authentication, API keys", status: "Active" },
              { name: "Strategy Registry", desc: "Versioned workflow specifications", status: "Active" },
              { name: "Execution Engine", desc: "DAG-based strategy execution with replay", status: "Active" },
              { name: "Capital Management", desc: "Double-entry ledger with invariant checks", status: "Active" },
              { name: "Risk & Policy DSL", desc: "Drawdown limits, circuit breakers", status: "Active" },
              { name: "Marketplace", desc: "Strategy listings and access grants", status: "Active" },
              { name: "Reputation System", desc: "Event-sourced trust scores", status: "Active" },
              { name: "ACP Token & Chain", desc: "L3 blockchain for governance", status: "In Development" },
            ].map((module) => (
              <div key={module.name} className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text)" }}>{module.name}</h3>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: "6px", 
                    fontSize: "0.7rem", 
                    fontWeight: 600,
                    background: module.status === "Active" ? "var(--accent-dim)" : "rgba(245, 158, 11, 0.15)",
                    color: module.status === "Active" ? "var(--accent)" : "#f59e0b"
                  }}>
                    {module.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>{module.desc}</p>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "24px", color: "var(--text)" }}>
            Quick Links
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <a href="https://github.com/dragoncattrx-hub/ancap" target="_blank" rel="noopener noreferrer"
              className="card" style={{ textDecoration: "none", cursor: "pointer" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>GitHub Repository</div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>View source code</div>
            </a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer"
              className="card" style={{ textDecoration: "none", cursor: "pointer" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>API Documentation</div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>FastAPI Swagger UI</div>
            </a>
            <a href="http://localhost:3002" target="_blank" rel="noopener noreferrer"
              className="card" style={{ textDecoration: "none", cursor: "pointer" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px", color: "var(--text)" }}>ARDO Control Center</div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Project dashboard</div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
