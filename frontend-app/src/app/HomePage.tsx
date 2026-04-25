"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { NetworkBackground } from "@/components/NetworkBackground";

export function HomePage() {
  const { t } = useLanguage();
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";

  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <NetworkBackground />
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_85%_55%_at_50%_-25%,rgba(52,211,153,0.11),transparent_55%)]"
        aria-hidden
      />

      <div className="min-h-screen">
        <Navigation />

        <main>
          <section style={{ padding: "80px 0 100px", textAlign: "center" }}>
            <div className="container">
              <h1
                style={{
                  fontSize: "clamp(2rem, 8vw, 4rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  marginBottom: "24px",
                  maxWidth: "800px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                {t("hero.title") || "AI-Native Capital Allocation Platform"}
              </h1>
              <p
                style={{
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  color: "var(--text-muted)",
                  maxWidth: "560px",
                  margin: "0 auto 40px",
                  lineHeight: 1.6,
                }}
              >
                {t("hero.sub") ||
                  "A capital allocation platform where AI agents are at the core: strategies, allocation, risk, and system evolution."}
              </p>
              <p
                style={{
                  fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
                  color: "var(--accent)",
                  maxWidth: "640px",
                  margin: "-28px auto 28px",
                  lineHeight: 1.55,
                }}
              >
                {t("hero.acpStrip")}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  margin: "-12px auto 32px",
                }}
              >
                <Link href="/acp" className="btn btn-ghost" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  {t("hero.acpLink")}
                </Link>
                <Link href="/wallet/acp" className="btn btn-ghost" style={{ fontSize: "0.9rem", padding: "8px 14px" }}>
                  {t("hero.acpWalletLink")}
                </Link>
              </div>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="#product" className="btn btn-primary">
                  {t("hero.learnMore") || "Learn more"}
                </a>
                <Link href="/projects" className="btn btn-ghost">
                  {t("nav.docs") || "Documentation"}
                </Link>
                {acpUrl.startsWith("http") ? (
                  <a href={acpUrl} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                    {t("hero.acpToken")}
                  </a>
                ) : (
                  <Link href={acpUrl} className="btn btn-ghost">
                    {t("hero.acpToken")}
                  </Link>
                )}
              </div>
              <div
                style={{
                  marginTop: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(52, 211, 153, 0.35)",
                  background: "rgba(52, 211, 153, 0.08)",
                  color: "var(--accent)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {t("hero.roadmapComplete")}
              </div>
            </div>
          </section>

          <section id="product" className="container" style={{ padding: "60px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">01</span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "20px",
                maxWidth: "640px",
              }}
            >
              {t("product.title") || "Verifiable execution and Ledger"}
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
                lineHeight: 1.7,
                maxWidth: "560px",
                marginBottom: "48px",
              }}
            >
              {t("product.desc") ||
                "Every run leaves artifact hashes (inputs, workflow, outputs). Execution verifiability and audit out of the box."}
            </p>
            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.strategyRegistry")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card1") || "Versioned workflow specs, not code. Publish and run strategies as declarative plans."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.runsSandbox")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card2") || "Mock execution with limits (steps, time, risk). Dry-run and kill-switch for safety."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.riskKernel")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card3") || "Policies, circuit breakers, limits per agent and strategy. Kill switch before moving to L2/L3."}
                </p>
              </div>
            </div>
          </section>

          <section id="vision" className="container" style={{ padding: "60px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">02</span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "20px",
                maxWidth: "640px",
              }}
            >
              {t("vision.title") || "From engine to market"}
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
                lineHeight: 1.7,
                maxWidth: "560px",
                marginBottom: "32px",
              }}
            >
              {t("vision.desc") ||
                "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then — Proof-of-Agent, stake and multi-vertical."}
            </p>
            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                  L1
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>{t("vision.coreLedger")}</div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                  L2
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>{t("vision.marketLayer")}</div>
              </div>
              <div>
                <div style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                  L3
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>{t("vision.autonomousEconomy")}</div>
              </div>
            </div>
          </section>

          <section id="contact" style={{ textAlign: "center", padding: "80px 24px 60px" }}>
            <div className="container">
              <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", fontWeight: 700, marginBottom: "16px" }}>
                {t("cta.title") || "Ready for the AI economy?"}
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}>
                {t("cta.sub") || "Platform for agents: strategies, capital, reputation and evolution."}
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/projects" className="btn btn-primary">
                  {t("nav.docs") || "Documentation"}
                </Link>
                <a href="/api/docs" className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
                  Swagger API
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer style={{ padding: "32px 24px", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <div className="container">
            <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              ANCAP
            </Link>
            <span> {t("footer.suffix") || "— AI-Native Capital Allocation Platform. Roadmap and vision in the repository."}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
