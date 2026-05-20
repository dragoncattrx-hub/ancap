"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { NetworkBackground } from "@/components/NetworkBackground";

export function HomePage() {
  const { t } = useLanguage();
  const acpUrl = process.env.NEXT_PUBLIC_ACP_URL || "/acp";
  const topOffers = [
    {
      title: "Pro Launch Pack",
      price: "349 ACP",
      href: "/ai/bundles/pro-launch-pack",
      result: "audit + exchange listing + KOL/Telegram + bounty + pro risk report",
    },
    {
      title: "Exchange Listing Submission Pack",
      price: "149 ACP",
      href: "/ai/run/exchange-listing-submission-pack",
      result: "exchange answers, reviewer memo, due-diligence packet",
    },
    {
      title: "Token Risk Report Pro",
      price: "59 ACP",
      href: "/ai/run/token-risk-report-pro",
      result: "risk score, evidence gaps, liquidity/holder flags",
    },
  ];

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
                {t("hero.title") || "Платные AI-workflow для криптокоманд и агентов"}
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
                  "Покупай полезное AI-исполнение за crypto: listing packs, campaign builders, bounty flows, token risk reports и receipts с proof."}
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
                <Link href="/ai/workflows" className="btn btn-primary">
                  {t("hero.workflowsCta") || "Купить workflow"}
                </Link>
                <Link href="/token-snapshot" className="btn btn-ghost">
                  Free token snapshot
                </Link>
                <Link href="/developers" className="btn btn-ghost">
                  Paid API for agents
                </Link>
                <a href="#product" className="btn btn-ghost">
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
              <div style={{ marginTop: "22px" }}>
                <a
                  href="https://x.com/mr3n3rgy777"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "12px 22px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
                    color: "var(--text)",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "999px",
                      background: "#111",
                      color: "#fff",
                      fontSize: "1rem",
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    X
                  </span>
                  <span>{t("hero.followOnX")}</span>
                </a>
              </div>
              <div className="responsive-grid responsive-grid-3" style={{ margin: "42px auto 0", maxWidth: 1040, textAlign: "left" }}>
                {topOffers.map((offer) => (
                  <Link key={offer.title} href={offer.href} className="card" style={{ textDecoration: "none" }}>
                    <div style={{ fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Buy AI execution
                    </div>
                    <h3 style={{ color: "var(--text)", fontSize: "1.15rem", fontWeight: 800, margin: "10px 0 8px" }}>
                      {offer.title}
                    </h3>
                    <div style={{ color: "var(--accent)", fontWeight: 900, marginBottom: 10 }}>{offer.price}</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>{offer.result}</p>
                  </Link>
                ))}
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
              {t("product.title") || "Sellable workflows with proof-backed execution"}
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
                "ANCAP should monetize concrete crypto workflows first: buy a run, get a result, inspect cost and receipt, then repeat or scale through subscriptions and APIs."}
            </p>
            <div className="responsive-grid responsive-grid-3">
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.strategyRegistry")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card1") || "Workflow catalog for listing packs, launch kits, token intelligence, and growth operations."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.runsSandbox")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card2") || "Paid runs with previews, pricing, repeat execution, and machine-readable receipts."}
                </p>
              </div>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t("product.riskKernel")}</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("product.card3") || "Proof, audit trails, and spend controls so AI workflows can be sold safely to users and other agents."}
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
                {t("cta.title") || "Start with paid workflows, then expand into agent commerce"}
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}>
                {t("cta.sub") || "The first revenue loop is simple: workflow catalog, priced runs, receipts, repeat usage, then APIs and MCP."}
              </p>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/ai/workflows" className="btn btn-primary">
                  {t("hero.workflowsCta") || "Run AI workflows"}
                </Link>
                <Link href="/projects" className="btn btn-ghost">
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
