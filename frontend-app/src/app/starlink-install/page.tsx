"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { starlinkInstallDesk } from "@/lib/api";
import { SiteLegalFooter } from "@/components/legal/LegalViews";

type Service = {
  id: string;
  review_target_id: string;
  label: string;
  price_eur: string;
  blurb: string;
  workflow_slug?: string | null;
  regions?: string[];
};

type Region = {
  id: string;
  label: string;
  blurb: string;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  services: Service[];
  regions: Region[];
  legal_href: string;
  service_fee_eur?: string;
};

type Quote = {
  service_id: string;
  label: string;
  installation_fee_eur: string;
  service_fee_eur: string;
  total_eur: string;
  total_usdt: string;
  amount_acp: string;
  amount_wacp: string;
  payment_currency: string;
  pay_amount: string;
  workflow_slug: string;
  provider_label: string;
  provider_location: string;
  escrow_note: string;
};

type PayChoice = "ACP" | "wACP" | "USDT";

export default function StarlinkInstallPage() {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("de-nrw");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payChoice, setPayChoice] = useState<PayChoice>("ACP");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = (await starlinkInstallDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("starlinkPage.loadError"));
    }
  }, [t]);

  useEffect(() => {
    void load();
    document.title = `ANCAP — ${t("starlinkPage.title")}`;
  }, [load, t]);

  const services = (catalog?.services || []).filter((svc) => {
    if (regionFilter === "all") return true;
    return (svc.regions || []).includes(regionFilter);
  });

  const buildQuote = async (serviceId: string, currency: PayChoice = payChoice) => {
    setSelectedId(serviceId);
    setQuoteBusy(true);
    setQuote(null);
    try {
      const region = regionFilter === "all" ? "de-nrw" : regionFilter;
      const data = (await starlinkInstallDesk.quote({
        service_id: serviceId,
        region,
        payment_currency: currency === "USDT" ? "ACP" : currency,
      })) as Quote;
      setQuote({ ...data, payment_currency: currency === "USDT" ? "USDT" : data.payment_currency });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("starlinkPage.quoteError"));
    } finally {
      setQuoteBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e8eef7]">
      <Navigation />
      <main>
        <section
          className="relative overflow-hidden border-b border-white/10"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, rgba(56,189,248,0.16), transparent 52%), linear-gradient(165deg, #071018 0%, #0a0e14 55%, #0f1a22 100%)",
          }}
        >
          <div className="container" style={{ padding: "64px 24px 40px" }}>
            <p className="section-num" style={{ letterSpacing: "0.18em", color: "#7dd3fc" }}>
              {t("starlinkPage.kicker")}
            </p>
            <h1
              className="section-title"
              style={{
                marginTop: 12,
                marginBottom: 14,
                maxWidth: 920,
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              }}
            >
              {t("starlinkPage.title")}
            </h1>
            <p className="section-subtitle" style={{ maxWidth: 720, marginBottom: 16 }}>
              {catalog?.tagline || t("starlinkPage.lead")}
            </p>
            <p style={{ maxWidth: 760, color: "rgba(226,232,240,0.55)", lineHeight: 1.7, fontSize: "0.95rem" }}>
              {catalog?.compliance_note || t("starlinkPage.compliance")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link href="#services" className="btn btn-primary">
                {t("starlinkPage.servicesCta")}
              </Link>
              <Link href={catalog?.legal_href || "/legal/starlink-install"} className="btn btn-ghost">
                {t("starlinkPage.legalCta")}
              </Link>
              <Link href="/buy-acp" className="btn btn-ghost">
                {t("starlinkPage.buyAcpCta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "36px 24px 20px" }}>
          <h2 className="section-title" style={{ fontSize: "1.35rem", marginBottom: 14 }}>
            {t("starlinkPage.regionsTitle")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            <button
              type="button"
              className={regionFilter === "all" ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setRegionFilter("all")}
            >
              {t("starlinkPage.allRegions")}
            </button>
            {(catalog?.regions || []).map((region) => (
              <button
                key={region.id}
                type="button"
                className={regionFilter === region.id ? "btn btn-primary" : "btn btn-ghost"}
                onClick={() => setRegionFilter(region.id)}
                title={region.blurb}
              >
                {region.label}
              </button>
            ))}
          </div>
          {error ? <p style={{ color: "#fbbf24", marginBottom: 16 }}>{error}</p> : null}
        </section>

        <section id="services" className="container" style={{ padding: "0 24px 40px" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: 8 }}>
            {t("starlinkPage.servicesTitle")}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 28, maxWidth: 720 }}>
            {t("starlinkPage.servicesLead")}
          </p>
          <div className="responsive-grid responsive-grid-2">
            {services.map((svc) => (
              <article
                key={svc.id}
                className="card"
                style={{
                  borderRadius: 12,
                  background: "rgba(16, 24, 40, 0.92)",
                  border:
                    selectedId === svc.id
                      ? "1px solid rgba(125, 211, 252, 0.55)"
                      : "1px solid rgba(125, 211, 252, 0.14)",
                }}
              >
                <div className="card-header">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{svc.label}</h3>
                  <strong style={{ color: "#7dd3fc", whiteSpace: "nowrap" }}>
                    €{Number(svc.price_eur).toLocaleString()}
                  </strong>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.65, minHeight: 72 }}>{svc.blurb}</p>
                <div className="action-cluster" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={quoteBusy}
                    onClick={() => void buildQuote(svc.id)}
                  >
                    {t("starlinkPage.quoteCta")}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!services.length && !error ? (
            <p style={{ color: "var(--text-muted)" }}>{t("starlinkPage.emptyFilter")}</p>
          ) : null}
        </section>

        {quote ? (
          <section className="container" style={{ padding: "0 24px 72px" }} id="order">
            <article
              className="card"
              style={{
                maxWidth: 520,
                borderRadius: 14,
                background: "rgba(12, 20, 32, 0.95)",
                border: "1px solid rgba(125, 211, 252, 0.22)",
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: "1.25rem", marginTop: 0 }}>{t("starlinkPage.orderTitle")}</h2>
              <p style={{ color: "#7dd3fc", fontWeight: 600, marginBottom: 16 }}>{quote.label}</p>
              <div style={{ display: "grid", gap: 8, fontFamily: "ui-monospace, monospace", fontSize: "0.95rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{t("starlinkPage.installFee")}</span>
                  <span>€{quote.installation_fee_eur}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{t("starlinkPage.serviceFee")}</span>
                  <span>€{quote.service_fee_eur}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    paddingTop: 8,
                    fontWeight: 700,
                  }}
                >
                  <span>{t("starlinkPage.total")}</span>
                  <span>€{quote.total_eur}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#bae6fd" }}>
                  <span>ACP</span>
                  <span>{Number(quote.amount_acp).toLocaleString()} ACP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#bae6fd" }}>
                  <span>wACP</span>
                  <span>{Number(quote.amount_wacp).toLocaleString()} wACP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>USDT</span>
                  <span>{quote.total_usdt} USDT</span>
                </div>
              </div>

              <p style={{ marginTop: 18, marginBottom: 8, fontWeight: 600 }}>{t("starlinkPage.payment")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {(["ACP", "wACP", "USDT"] as PayChoice[]).map((choice) => (
                  <label key={choice} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="pay"
                      checked={payChoice === choice}
                      onChange={() => {
                        setPayChoice(choice);
                        if (selectedId) void buildQuote(selectedId, choice);
                      }}
                    />
                    <span>
                      {choice === "ACP"
                        ? t("starlinkPage.payAcp")
                        : choice === "wACP"
                          ? t("starlinkPage.payWacp")
                          : t("starlinkPage.payUsdt")}
                    </span>
                  </label>
                ))}
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {t("starlinkPage.provider")}: {quote.provider_label} · {quote.provider_location}
              </p>
              <p style={{ color: "#86efac", fontWeight: 600 }}>{t("starlinkPage.escrow")}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>{quote.escrow_note}</p>

              <div className="action-cluster" style={{ marginTop: 20 }}>
                {payChoice === "USDT" ? (
                  <>
                    <Link href="/buy-acp" className="btn btn-primary">
                      {t("starlinkPage.buyAcpCta")}
                    </Link>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", width: "100%" }}>
                      {t("starlinkPage.usdtHint")}
                    </p>
                  </>
                ) : (
                  <Link href={`/ai/run/${quote.workflow_slug}`} className="btn btn-primary">
                    {t("starlinkPage.payCreate")}
                  </Link>
                )}
                <Link href={`/ai/run/${quote.workflow_slug}`} className="btn btn-ghost">
                  {t("starlinkPage.openWorkflow")}
                </Link>
              </div>
              <p style={{ marginTop: 14, color: "#86efac", fontSize: "0.9rem" }}>{t("starlinkPage.confirmed")}</p>
            </article>
          </section>
        ) : null}

        <section className="container" style={{ padding: "0 24px 72px" }}>
          <p style={{ color: "var(--text-muted)", maxWidth: 820, lineHeight: 1.7 }}>{t("starlinkPage.footerNote")}</p>
        </section>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
