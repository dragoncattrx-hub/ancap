"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SERVICE_KEYS = [
  ["s1Title", "s1Body", "s1Price", "s1Href"],
  ["s2Title", "s2Body", "s2Price", "s2Href"],
  ["s3Title", "s3Body", "s3Price", "s3Href"],
  ["s4Title", "s4Body", "s4Price", "s4Href"],
] as const;

/** Homepage advertising block — ANCAP AI Agency vertical. */
export function HomeAgencySection() {
  const { t } = useLanguage();

  return (
    <section
      id="agency"
      className="container"
      style={{ padding: "28px 24px 56px" }}
      aria-labelledby="agency-home-title"
    >
      <div
        style={{
          borderRadius: 16,
          border: "1px solid color-mix(in srgb, var(--accent-strong) 35%, var(--border))",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent-strong) 14%, transparent) 0%, transparent 48%), linear-gradient(180deg, color-mix(in srgb, var(--bg-elevated, var(--bg)) 88%, #0a1620) 0%, transparent 100%)",
          padding: "36px 28px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--accent-strong) 28%, transparent), transparent 42%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 28,
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 28,
            }}
          >
            <div style={{ flex: "1 1 320px", maxWidth: 720 }}>
              <span className="section-num">{t("agencyPage.kicker")}</span>
              <h2 id="agency-home-title" className="section-title" style={{ marginBottom: 14 }}>
                {t("agencyPage.homeTitle")}
              </h2>
              <p className="section-subtitle" style={{ maxWidth: 640, marginBottom: 0 }}>
                {t("agencyPage.homeLead")}
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/agency" className="btn btn-primary">
                {t("agencyPage.enter")}
              </Link>
              <Link href="/agency#packs" className="btn btn-ghost">
                {t("agencyPage.packsCta")}
              </Link>
              <Link href="/mail/connect" className="btn btn-ghost">
                {t("agencyPage.briefCta")}
              </Link>
            </div>
          </div>

          <div className="responsive-grid responsive-grid-2" style={{ gap: 14 }}>
            {SERVICE_KEYS.map(([titleKey, bodyKey, priceKey]) => (
              <div
                key={titleKey}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "18px 16px",
                  background: "color-mix(in srgb, var(--bg) 72%, transparent)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 8,
                    alignItems: "baseline",
                  }}
                >
                  <strong style={{ color: "var(--text)", fontSize: "1.05rem" }}>
                    {t(`agencyPage.${titleKey}`)}
                  </strong>
                  <span style={{ color: "var(--accent-strong)", fontSize: "0.92rem", whiteSpace: "nowrap" }}>
                    {t(`agencyPage.${priceKey}`)}
                  </span>
                </div>
                <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                  {t(`agencyPage.${bodyKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
