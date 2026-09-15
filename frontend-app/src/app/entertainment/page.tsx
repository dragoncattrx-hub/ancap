"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import { useLanguage } from "@/components/LanguageProvider";

type Region = "all" | "americas" | "emea" | "apac" | "online";

type Venue = {
  id: string;
  region: Exclude<Region, "all">;
  status: "open" | "licensed" | "regulated" | "age-gated";
};

const VENUES: Venue[] = [
  { id: "museums", region: "americas", status: "open" },
  { id: "broadway", region: "americas", status: "open" },
  { id: "eu-festivals", region: "emea", status: "licensed" },
  { id: "eu-parks", region: "emea", status: "open" },
  { id: "eu-lottery", region: "emea", status: "regulated" },
  { id: "apac-heritage", region: "apac", status: "open" },
  { id: "apac-gaming", region: "apac", status: "age-gated" },
  { id: "us-sports", region: "americas", status: "regulated" },
  { id: "online-arena", region: "online", status: "regulated" },
  { id: "online-streams", region: "online", status: "licensed" },
];

const REGIONS: Region[] = ["all", "americas", "emea", "apac", "online"];

const REGION_LABEL_KEY: Record<Region, string> = {
  all: "entertainmentPage.regionAll",
  americas: "entertainmentPage.regionAmericas",
  emea: "entertainmentPage.regionEmea",
  apac: "entertainmentPage.regionApac",
  online: "entertainmentPage.regionOnline",
};

const STATUS_LABEL_KEY: Record<Venue["status"], string> = {
  open: "entertainmentPage.statusOpen",
  licensed: "entertainmentPage.statusLicensed",
  regulated: "entertainmentPage.statusRegulated",
  "age-gated": "entertainmentPage.statusAgeGated",
};

export default function LegalEntertainmentPage() {
  const { t } = useLanguage();
  const [region, setRegion] = useState<Region>("all");

  useEffect(() => {
    document.title = "ANCAP — Legal entertainment worldwide";
  }, []);

  const items = useMemo(
    () => (region === "all" ? VENUES : VENUES.filter((v) => v.region === region)),
    [region],
  );

  return (
    <div className="min-h-screen bg-[#081018] text-[#f3efe6]">
      <Navigation />

      <main>
        <section
          className="relative overflow-hidden"
          style={{
            minHeight: "78vh",
            display: "flex",
            alignItems: "flex-end",
            borderBottom: "1px solid rgba(243,239,230,0.12)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 70% 10%, rgba(212,160,72,0.28), transparent 42%), radial-gradient(ellipse at 8% 80%, rgba(46,140,130,0.22), transparent 45%), linear-gradient(165deg, #050b12 0%, #0c1620 48%, #132018 100%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.4,
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0 1px, transparent 2px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.05) 0 1px, transparent 2px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(180deg, black, transparent 88%)",
            }}
          />
          <div className="container" style={{ position: "relative", zIndex: 1, padding: "104px 24px 56px" }}>
            <p
              style={{
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                color: "rgba(243,239,230,0.65)",
              }}
            >
              {t("entertainmentPage.heroKicker")}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
                fontSize: "clamp(2.6rem, 6vw, 4.4rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                maxWidth: 920,
                margin: "14px 0 18px",
              }}
            >
              {t("entertainmentPage.heroTitle")}
            </h1>
            <p style={{ fontSize: "1.35rem", maxWidth: 640, marginBottom: 14, color: "#f3efe6" }}>
              {t("entertainmentPage.heroLead")}
            </p>
            <p style={{ color: "rgba(243,239,230,0.72)", maxWidth: 700, lineHeight: 1.7, marginBottom: 28 }}>
              {t("entertainmentPage.heroBody")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="#map" className="btn btn-primary">
                {t("entertainmentPage.browseRegions")}
              </a>
              <Link href="/arena" className="btn btn-ghost">
                {t("entertainmentPage.openArena")}
              </Link>
              <Link href="/legal" className="btn btn-ghost">
                {t("entertainmentPage.legalHub")}
              </Link>
              <a href="#tesla-coil-party" className="btn btn-ghost">
                {t("entertainmentPage.tcpCta")}
              </a>
            </div>
          </div>
        </section>

        <section
          id="tesla-coil-party"
          className="container"
          style={{
            padding: "56px 24px 24px",
            scrollMarginTop: 96,
          }}
        >
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.72rem", opacity: 0.65 }}>
            {t("entertainmentPage.tcpKicker")}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 10,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                margin: 0,
                maxWidth: 720,
              }}
            >
              {t("entertainmentPage.tcpTitle")}
            </h2>
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: "1.5rem", fontWeight: 600, color: "#d4a048", margin: 0 }}>
              {t("entertainmentPage.tcpPrice")}
            </p>
          </div>
          <p style={{ maxWidth: 780, lineHeight: 1.7, color: "rgba(243,239,230,0.78)", marginTop: 16 }}>
            {t("entertainmentPage.tcpLead")}
          </p>
          <p style={{ maxWidth: 780, lineHeight: 1.7, color: "rgba(243,239,230,0.55)", marginTop: 12 }}>
            {t("entertainmentPage.tcpDisclaimer")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            <Link href="/ai/run/entertainment-tesla-coil-party" className="btn btn-primary">
              {t("entertainmentPage.tcpCta")}
            </Link>
            <Link href="/legal/tesla-coil-party" className="btn btn-ghost">
              {t("entertainmentPage.tcpLegalCta")}
            </Link>
          </div>
        </section>

        <section id="map" className="container" style={{ padding: "56px 24px 24px" }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.72rem", opacity: 0.65 }}>
            {t("entertainmentPage.mapKicker")}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              margin: "10px 0 22px",
            }}
          >
            {t("entertainmentPage.mapTitle")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {REGIONS.map((r) => {
              const active = region === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  style={{
                    border: active ? "1px solid rgba(212,160,72,0.7)" : "1px solid rgba(243,239,230,0.16)",
                    background: active ? "rgba(212,160,72,0.16)" : "transparent",
                    color: "#f3efe6",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {t(REGION_LABEL_KEY[r])}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((v) => (
              <article
                key={v.id}
                style={{
                  borderTop: "1px solid rgba(212,160,72,0.35)",
                  padding: "18px 4px 8px",
                }}
              >
                <p style={{ fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>
                  {t(`entertainmentPage.venues.${v.id}.category`)} · {t(STATUS_LABEL_KEY[v.status])}
                </p>
                <h3 style={{ fontSize: "1.15rem", margin: "8px 0 6px", fontWeight: 600 }}>
                  {t(`entertainmentPage.venues.${v.id}.name`)}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "rgba(212,160,72,0.9)", marginBottom: 8 }}>
                  {t(`entertainmentPage.venues.${v.id}.places`)}
                </p>
                <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(243,239,230,0.75)" }}>
                  {t(`entertainmentPage.venues.${v.id}.note`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "40px 24px 72px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
              fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
              marginBottom: 12,
            }}
          >
            {t("entertainmentPage.complianceTitle")}
          </h2>
          <p style={{ maxWidth: 720, lineHeight: 1.7, color: "rgba(243,239,230,0.75)", marginBottom: 18 }}>
            {t("entertainmentPage.complianceBody")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/arena" className="btn btn-primary">
              {t("entertainmentPage.arenaGames")}
            </Link>
            <Link href="/compliance" className="btn btn-ghost">
              {t("entertainmentPage.complianceCta")}
            </Link>
            <Link href="/insurance" className="btn btn-ghost">
              {t("entertainmentPage.eventCover")}
            </Link>
          </div>
        </section>
      </main>

      <SiteLegalFooter />
    </div>
  );
}
