"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { SiteLegalFooter } from "@/components/legal/LegalViews";

const PACKS = [
  { title: "s1Title", body: "s1Body", price: "s1Price", href: "s1Href" },
  { title: "s2Title", body: "s2Body", price: "s2Price", href: "s2Href" },
  { title: "s3Title", body: "s3Body", price: "s3Price", href: "s3Href" },
  { title: "s4Title", body: "s4Body", price: "s4Price", href: "s4Href" },
] as const;

const HOW = ["how1", "how2", "how3", "how4"] as const;
const AUDIENCE = ["a1", "a2", "a3", "a4"] as const;

export default function AgencyPage() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `ANCAP Agency — ${t("agencyPage.heroTitle")}`;
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />

      <main>
        <section
          className="relative overflow-hidden"
          style={{
            minHeight: "72vh",
            display: "flex",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 12% 20%, color-mix(in srgb, var(--accent-strong) 22%, transparent), transparent 50%), linear-gradient(160deg, #071018 0%, var(--bg) 55%, color-mix(in srgb, #123 40%, var(--bg)) 100%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.35,
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0, transparent 48px, color-mix(in srgb, var(--border) 55%, transparent) 49px), repeating-linear-gradient(0deg, transparent 0, transparent 48px, color-mix(in srgb, var(--border) 40%, transparent) 49px)",
              maskImage: "linear-gradient(180deg, black, transparent 85%)",
            }}
          />
          <div className="container" style={{ position: "relative", zIndex: 1, padding: "96px 24px 56px" }}>
            <p className="section-num" style={{ letterSpacing: "0.18em" }}>
              {t("agencyPage.kicker")}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)",
                fontSize: "clamp(2.4rem, 5vw, 4.1rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                maxWidth: 920,
                margin: "12px 0 20px",
              }}
            >
              ANCAP Agency
            </h1>
            <p style={{ fontSize: "1.25rem", maxWidth: 680, marginBottom: 12, color: "var(--text)" }}>
              {t("agencyPage.heroTitle")}
            </p>
            <p style={{ color: "var(--text-muted)", maxWidth: 720, lineHeight: 1.7, marginBottom: 28 }}>
              {t("agencyPage.heroLead")}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="#packs" className="btn btn-primary">
                {t("agencyPage.packsCta")}
              </Link>
              <Link href="/ai/workflows" className="btn btn-ghost">
                {t("agencyPage.workflows")}
              </Link>
              <Link href="/token-snapshot" className="btn btn-ghost">
                {t("agencyPage.snapshot")}
              </Link>
            </div>
          </div>
        </section>

        <section id="packs" className="container" style={{ padding: "64px 24px" }}>
          <span className="section-num">{t("agencyPage.offerKicker")}</span>
          <h2 className="section-title" style={{ marginBottom: 28 }}>
            {t("agencyPage.offerTitle")}
          </h2>
          <div className="responsive-grid responsive-grid-2" style={{ gap: 16 }}>
            {PACKS.map((pack) => (
              <Link
                key={pack.title}
                href={t(`agencyPage.${pack.href}`)}
                className="card"
                style={{ textDecoration: "none", borderRadius: 10, minHeight: 180 }}
              >
                <div className="card-header">
                  <strong style={{ color: "var(--text)", fontSize: "1.15rem" }}>
                    {t(`agencyPage.${pack.title}`)}
                  </strong>
                  <span style={{ color: "var(--accent-strong)" }}>{t(`agencyPage.${pack.price}`)}</span>
                </div>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                  {t(`agencyPage.${pack.body}`)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container" style={{ padding: "24px 24px 64px", borderTop: "1px solid var(--border)" }}>
          <h2 className="section-title" style={{ marginBottom: 20 }}>
            {t("agencyPage.howTitle")}
          </h2>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 12, maxWidth: 720 }}>
            {HOW.map((key, i) => (
              <li key={key} style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                <span style={{ color: "var(--accent-strong)", marginRight: 8 }}>{i + 1}.</span>
                {t(`agencyPage.${key}`)}
              </li>
            ))}
          </ol>
        </section>

        <section className="container" style={{ padding: "24px 24px 64px", borderTop: "1px solid var(--border)" }}>
          <h2 className="section-title" style={{ marginBottom: 20 }}>
            {t("agencyPage.audienceTitle")}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10, maxWidth: 720 }}>
            {AUDIENCE.map((key) => (
              <li key={key} style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                {t(`agencyPage.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        <section
          style={{
            textAlign: "center",
            padding: "72px 24px 80px",
            borderTop: "1px solid var(--border)",
            background:
              "linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent-strong) 8%, transparent))",
          }}
        >
          <h2 className="section-title" style={{ marginBottom: 12 }}>
            {t("agencyPage.ctaTitle")}
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto 24px", maxWidth: 560 }}>
            {t("agencyPage.ctaLead")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/token-snapshot" className="btn btn-primary">
              {t("agencyPage.snapshot")}
            </Link>
            <Link href="/ai/bundles/pro-launch-pack" className="btn btn-ghost">
              {t("agencyPage.packsCta")}
            </Link>
            <a href="mailto:support@ancap.cloud" className="btn btn-ghost">
              {t("agencyPage.contact")}
            </a>
          </div>
        </section>
      </main>

      <SiteLegalFooter />
    </div>
  );
}
