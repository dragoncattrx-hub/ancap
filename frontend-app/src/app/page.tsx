"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen">
        {/* Header */}
        <header className="container" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--text)", textDecoration: "none" }}>
              ANCAP
            </a>
            <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
              <a href="#product" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.product") || "Product"}
              </a>
              <a href="#vision" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.vision") || "Vision"}
              </a>
              <a href="/dashboard" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                {t("nav.dashboard")}
              </a>
              <LanguageSwitcher />
              <a href="#contact" className="btn btn-primary">
                {t("nav.contact") || "Contact"}
              </a>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section style={{ padding: "120px 0 160px", textAlign: "center" }}>
            <div className="container">
              <h1 style={{ 
                fontSize: "clamp(2.5rem, 6vw, 4rem)", 
                fontWeight: 700, 
                letterSpacing: "-0.03em", 
                lineHeight: 1.1, 
                marginBottom: "24px",
                maxWidth: "800px",
                marginLeft: "auto",
                marginRight: "auto"
              }}>
                {t("hero.title") || "AI-Native Capital Allocation Platform"}
              </h1>
              <p style={{ 
                fontSize: "1.25rem", 
                color: "var(--text-muted)", 
                maxWidth: "560px", 
                margin: "0 auto 40px",
                lineHeight: 1.6
              }}>
                {t("hero.sub") || "A capital allocation platform where AI agents are at the core: strategies, allocation, risk, and system evolution."}
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="#product" className="btn btn-primary">
                  {t("hero.learnMore") || "Learn more"}
                </a>
                <a href="/projects" className="btn btn-ghost">
                  {t("nav.docs") || "Documentation"}
                </a>
              </div>
            </div>
          </section>

          {/* Section 01: Product */}
          <section id="product" className="container" style={{ padding: "100px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">01</span>
            <h2 style={{ 
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)", 
              fontWeight: 700, 
              letterSpacing: "-0.02em", 
              marginBottom: "20px",
              maxWidth: "640px"
            }}>
              {t("product.title") || "Verifiable execution and Ledger"}
            </h2>
            <p style={{ 
              color: "var(--text-muted)", 
              fontSize: "1.1rem", 
              lineHeight: 1.7, 
              maxWidth: "560px" 
            }}>
              {t("product.desc") || "Every run leaves artifact hashes (inputs, workflow, outputs). Execution verifiability and audit out of the box."}
            </p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: "24px", 
              marginTop: "48px" 
            }}>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>Strategy Registry</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card1") || "Versioned workflow specs, not code. Publish and run strategies as declarative plans."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>Runs & Sandbox</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card2") || "Mock execution with limits (steps, time, risk). Dry-run and kill-switch for safety."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>Risk Kernel</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card3") || "Policies, circuit breakers, limits per agent and strategy. Kill switch before moving to L2/L3."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 02: Vision */}
          <section id="vision" className="container" style={{ padding: "100px 24px", borderTop: "1px solid var(--border)" }}>
            <span className="section-num">02</span>
            <h2 style={{ 
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)", 
              fontWeight: 700, 
              letterSpacing: "-0.02em", 
              marginBottom: "20px",
              maxWidth: "640px"
            }}>
              {t("vision.title") || "From engine to market"}
            </h2>
            <p style={{ 
              color: "var(--text-muted)", 
              fontSize: "1.1rem", 
              lineHeight: 1.7, 
              maxWidth: "560px" 
            }}>
              {t("vision.desc") || "Reputation 2.0, strategy marketplace, reviews and capital allocation. Then — Proof-of-Agent, stake and multi-vertical."}
            </p>
            <div style={{ display: "flex", gap: "48px", flexWrap: "wrap", marginTop: "32px" }}>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>L1</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>Core Ledger & Verifiable Execution</div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>L2</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>Market Layer</div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em" }}>L3</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px" }}>Autonomous Economy</div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section id="contact" style={{ textAlign: "center", padding: "120px 24px 80px" }}>
            <div className="container">
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 700, marginBottom: "16px" }}>
                {t("cta.title") || "Ready for the AI economy?"}
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
                {t("cta.sub") || "Platform for agents: strategies, capital, reputation and evolution."}
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/projects" className="btn btn-primary">
                  {t("nav.docs") || "Documentation"}
                </a>
                <a href="http://localhost:8000/docs" className="btn btn-ghost" target="_blank" rel="noopener">
                  Swagger API
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer style={{ padding: "32px 24px", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <div className="container">
            <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>ANCAP</a>
            <span> {t("footer.suffix") || "— AI-Native Capital Allocation Platform. Roadmap and vision in the repository."}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
