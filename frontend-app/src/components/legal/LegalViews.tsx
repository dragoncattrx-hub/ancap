"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";

const pill =
  "rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white";
const pillAccent =
  "rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100";

function LegalShell({
  kickerClass,
  kicker,
  title,
  intro,
  actions,
  children,
}: {
  kickerClass: string;
  kicker: string;
  title: string;
  intro: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className={`rounded-3xl border p-6 sm:p-8 ${kickerClass}`}>
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">{kicker}</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">{intro}</p>
          <div className="mt-5 flex flex-wrap gap-3">{actions}</div>
        </section>
        {children}
      </main>
    </div>
  );
}

export function TermsView() {
  const { t } = useLanguage();
  const sections = Array.from({ length: 15 }, (_, i) => i + 1);
  return (
    <LegalShell
      kickerClass="border-white/10 bg-white/[0.03]"
      kicker={t("legal.termsKicker")}
      title={t("legal.termsTitle")}
      intro={`${t("legal.lastUpdated")} ${t("legal.termsIntro")}`}
      actions={
        <>
          <Link href="/legal/privacy" className={pill}>{t("legal.privacyLink")}</Link>
          <Link href="/legal/cookies" className={pill}>{t("legal.cookiesLink")}</Link>
          <Link href="/legal/cyber-defense" className={pillAccent}>{t("legal.cyberLink")}</Link>
          <Link href="/whitepaper/acp" className={pillAccent}>{t("legal.acpLink")}</Link>
        </>
      }
    >
      <section className="mt-6 grid gap-4">
        {sections.map((n) => (
          <article key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{t(`legal.t${n}Title`)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t(`legal.t${n}Body`)}</p>
          </article>
        ))}
      </section>
    </LegalShell>
  );
}

export function PrivacyView() {
  const { t } = useLanguage();
  return (
    <LegalShell
      kickerClass="border-sky-300/15 bg-sky-400/[0.055]"
      kicker={t("legal.privacyKicker")}
      title={t("legal.privacyTitle")}
      intro={`${t("legal.lastUpdated")} ${t("legal.privacyIntro")}`}
      actions={
        <>
          <Link href="/legal/terms" className={pill}>{t("legal.termsLink")}</Link>
          <Link href="/legal/cookies" className={pill}>{t("legal.cookiesLink")}</Link>
          <Link href="/legal/cyber-defense" className={pillAccent}>{t("legal.cyberLink")}</Link>
        </>
      }
    >
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <article key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{t(`legal.p${n}Title`)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t(`legal.p${n}Body`)}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.privacySecurityTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">
          {t("legal.privacySecurityBody")}{" "}
          <Link href="/legal/cyber-defense" className="text-sky-200 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-100">
            /legal/cyber-defense
          </Link>
          .
        </p>
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.privacyContactTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">{t("legal.privacyContactBody")}</p>
      </section>
    </LegalShell>
  );
}

export function CookiesLegalView() {
  const { t } = useLanguage();
  const cats = [1, 2, 3] as const;
  return (
    <LegalShell
      kickerClass="border-white/10 bg-white/[0.03]"
      kicker={t("legal.cookiesKicker")}
      title={t("legal.cookiesTitle")}
      intro={`${t("legal.lastUpdated")} ${t("legal.cookiesIntro")}`}
      actions={
        <>
          <Link href="/legal/privacy" className={pill}>{t("legal.privacyLink")}</Link>
          <Link href="/legal/terms" className={pill}>{t("legal.termsLink")}</Link>
          <Link href="/legal/cyber-defense" className={pillAccent}>{t("legal.cyberLink")}</Link>
        </>
      }
    >
      <section className="mt-6 grid gap-4">
        {cats.map((n) => (
          <article key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{t(`legal.c${n}Title`)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              <span className="font-semibold text-white/84">{t("legal.cookiesExamples")} </span>
              {t(`legal.c${n}Examples`)}
            </p>
            <p className="mt-2 text-sm leading-7 text-white/70">
              <span className="font-semibold text-white/84">{t("legal.cookiesConsent")} </span>
              {t(`legal.c${n}Consent`)}
            </p>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] p-5">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.cookiesRegTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">{t("legal.cookiesRegBody")}</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://commission.europa.eu/cookies-policy_en">
            {t("legal.cookiesEc")}
          </a>
          <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en">
            {t("legal.cookiesEdpb")}
          </a>
        </div>
      </section>
    </LegalShell>
  );
}

export function CyberDefenseView() {
  const { t } = useLanguage();
  return (
    <LegalShell
      kickerClass="border-emerald-300/20 bg-emerald-400/[0.06]"
      kicker={t("legal.cyberKicker")}
      title={t("legal.cyberTitle")}
      intro={`${t("legal.lastUpdated")} ${t("legal.cyberIntro")}`}
      actions={
        <>
          <a
            href="https://openai.com/collective-cyberdefense"
            className="rounded-full border border-emerald-400/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("legal.openLetter")}
          </a>
          <Link href="/legal/terms" className={pill}>{t("legal.termsLink")}</Link>
          <Link href="/legal/privacy" className={pill}>{t("legal.privacyLink")}</Link>
        </>
      }
    >
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.cyberStatementTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">{t("legal.cyberStatement1")}</p>
        <p className="mt-3 text-sm leading-7 text-white/70">{t("legal.cyberStatement2")}</p>
      </section>
      <section className="mt-6 grid gap-4">
        {[1, 2, 3].map((n) => (
          <article key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">{t(`legal.cyberP${n}Title`)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t(`legal.cyberP${n}Body`)}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.cyberCommitTitle")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <article key={n} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-base font-semibold">{t(`legal.cyberC${n}Title`)}</h3>
              <p className="mt-2 text-sm leading-7 text-white/70">{t(`legal.cyberC${n}Body`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-2xl border border-sky-300/15 bg-sky-400/[0.055] p-5">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{t("legal.cyberScopeTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">{t("legal.cyberScope1")}</p>
        <p className="mt-3 text-sm leading-7 text-white/70">
          {t("legal.cyberScope2")}{" "}
          <a
            className="text-sky-200 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-100"
            href="https://openai.com/collective-cyberdefense"
            target="_blank"
            rel="noopener noreferrer"
          >
            openai.com/collective-cyberdefense
          </a>
          .
        </p>
      </section>
    </LegalShell>
  );
}
