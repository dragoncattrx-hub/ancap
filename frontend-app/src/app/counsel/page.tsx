"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { counselDesk } from "@/lib/api";
import { SiteLegalFooter } from "@/components/legal/LegalViews";

type Service = {
  id: string;
  review_target_id: string;
  label: string;
  price_from_acp: string;
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
  practices_law?: boolean;
  attorney_client?: boolean;
};

export default function CounselPage() {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const data = (await counselDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("counselPage.loadError"));
    }
  }, [t]);

  useEffect(() => {
    void load();
    document.title = `ANCAP — ${t("counselPage.title")}`;
  }, [load, t]);

  const services = (catalog?.services || []).filter((svc) => {
    if (regionFilter === "all") return true;
    return (svc.regions || []).includes(regionFilter);
  });

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e8eef7]">
      <Navigation />
      <main>
        <section
          className="relative overflow-hidden border-b border-white/10"
          style={{
            background:
              "radial-gradient(ellipse at 15% 0%, rgba(96,165,250,0.18), transparent 50%), linear-gradient(165deg, #0a1220 0%, #0a0e14 55%, #101820 100%)",
          }}
        >
          <div className="container" style={{ padding: "64px 24px 40px" }}>
            <p className="section-num" style={{ letterSpacing: "0.18em", color: "#93c5fd" }}>
              {t("counselPage.kicker")}
            </p>
            <h1
              className="section-title"
              style={{
                marginTop: 12,
                marginBottom: 14,
                maxWidth: 900,
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              }}
            >
              {catalog?.title || t("counselPage.title")}
            </h1>
            <p className="section-subtitle" style={{ maxWidth: 720, marginBottom: 16 }}>
              {catalog?.tagline || t("counselPage.lead")}
            </p>
            <p style={{ maxWidth: 760, color: "rgba(226,232,240,0.55)", lineHeight: 1.7, fontSize: "0.95rem" }}>
              {catalog?.compliance_note || t("counselPage.compliance")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
              <Link href="#services" className="btn btn-primary">
                {t("counselPage.servicesCta")}
              </Link>
              <Link href={catalog?.legal_href || "/legal/counsel"} className="btn btn-ghost">
                {t("counselPage.legalCta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="container" style={{ padding: "36px 24px 20px" }}>
          <h2 className="section-title" style={{ fontSize: "1.35rem", marginBottom: 14 }}>
            {t("counselPage.regionsTitle")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            <button
              type="button"
              className={regionFilter === "all" ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setRegionFilter("all")}
            >
              {t("counselPage.allRegions")}
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

        <section id="services" className="container" style={{ padding: "0 24px 72px" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: 8 }}>
            {t("counselPage.servicesTitle")}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 28, maxWidth: 680 }}>
            {t("counselPage.servicesLead")}
          </p>
          <div className="responsive-grid responsive-grid-2">
            {services.map((svc) => (
              <article
                key={svc.id}
                className="card"
                style={{
                  borderRadius: 12,
                  background: "rgba(16, 24, 40, 0.92)",
                  border: "1px solid rgba(147, 197, 253, 0.16)",
                }}
              >
                <div className="card-header">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{svc.label}</h3>
                  <strong style={{ color: "#93c5fd", whiteSpace: "nowrap" }}>
                    {t("counselPage.from")} {Number(svc.price_from_acp).toLocaleString()} ACP
                  </strong>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.65, minHeight: 72 }}>{svc.blurb}</p>
                <div className="action-cluster" style={{ marginTop: 14 }}>
                  {svc.workflow_slug ? (
                    <Link href={`/ai/run/${svc.workflow_slug}`} className="btn btn-primary">
                      {t("counselPage.buyCta")}
                    </Link>
                  ) : (
                    <Link href="/ai/workflows" className="btn btn-primary">
                      {t("counselPage.buyCta")}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!services.length && !error ? (
            <p style={{ color: "var(--text-muted)" }}>{t("counselPage.emptyFilter")}</p>
          ) : null}
          <p style={{ color: "var(--text-muted)", marginTop: 36, maxWidth: 820, lineHeight: 1.7 }}>
            {t("counselPage.footerNote")}
          </p>
        </section>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
