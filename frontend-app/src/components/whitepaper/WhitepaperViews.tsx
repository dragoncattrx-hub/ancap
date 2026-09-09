"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useLanguage } from "@/components/LanguageProvider";

export function ProjectWhitepaperView() {
  const { t } = useLanguage();
  const sections = [1, 2, 3, 4, 5, 6, 7, 8] as const;
  const roadmap = [1, 2, 3, 4, 5, 6, 7] as const;
  const audiences = [
    ["buyersTitle", "buyersBody"],
    ["creatorsTitle", "creatorsBody"],
    ["agentsTitle", "agentsBody"],
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/75">{t("whitepaperPage.kicker")}</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {t("whitepaperPage.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            {t("whitepaperPage.lead")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/ai/workflows" className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              {t("whitepaperPage.openStore")}
            </Link>
            <Link href="/whitepaper/acp" className="rounded-full border border-emerald-400/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/50 hover:text-emerald-100">
              {t("whitepaperPage.readAcp")}
            </Link>
            <Link href="/legal/terms" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              {t("whitepaperPage.userAgreement")}
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {audiences.map(([titleKey, bodyKey]) => (
            <article key={titleKey} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">{t(`whitepaperPage.${titleKey}`)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">{t(`whitepaperPage.${bodyKey}`)}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5">
          {sections.map((n) => (
            <article key={n} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t(`whitepaperPage.s${n}Title`)}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">{t(`whitepaperPage.s${n}Body`)}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-sky-100/75">{t("whitepaperPage.roadmapKicker")}</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t("whitepaperPage.roadmapTitle")}</h2>
          <div className="mt-5 grid gap-3">
            {roadmap.map((n) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/74">
                {t(`whitepaperPage.r${n}`)}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
          <h2 className="text-xl font-semibold text-amber-100">{t("whitepaperPage.noticeTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-white/72">{t("whitepaperPage.noticeBody")}</p>
        </section>
      </main>
    </div>
  );
}

export function AcpWhitepaperView() {
  const { t } = useLanguage();
  const utilities = [1, 2, 3, 4, 5] as const;
  const risks = [1, 2, 3, 4, 5] as const;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-violet-300/20 bg-violet-400/[0.07] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-violet-100/75">{t("acpWhitepaperPage.kicker")}</div>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            {t("acpWhitepaperPage.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            {t("acpWhitepaperPage.lead")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/wallet/acp" className="rounded-full bg-violet-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              {t("acpWhitepaperPage.openWallet")}
            </Link>
            <Link href="/pricing" className="rounded-full border border-violet-300/25 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-200/50 hover:text-white">
              {t("acpWhitepaperPage.viewPricing")}
            </Link>
            <Link href="/whitepaper" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
              {t("acpWhitepaperPage.projectPaper")}
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("acpWhitepaperPage.assetRoleTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t("acpWhitepaperPage.assetRoleBody")}</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("acpWhitepaperPage.supplyTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t("acpWhitepaperPage.supplyBody")}</p>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("acpWhitepaperPage.utilityTitle")}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {utilities.map((n) => (
              <article key={n} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{t(`acpWhitepaperPage.u${n}Title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-white/66">{t(`acpWhitepaperPage.u${n}Body`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.06] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-amber-100">{t("acpWhitepaperPage.risksTitle")}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/72">
              {risks.map((n) => (
                <li key={n} className="rounded-2xl border border-white/10 bg-black/18 p-3">
                  {t(`acpWhitepaperPage.risk${n}`)}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-sky-300/15 bg-sky-400/[0.055] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("acpWhitepaperPage.regulatoryTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t("acpWhitepaperPage.regulatoryBody")}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32023R1114">
                {t("acpWhitepaperPage.eurLex")}
              </a>
              <a className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sky-100 transition hover:border-sky-300/35" href="https://finance.ec.europa.eu/regulation-and-supervision/financial-services-legislation/implementing-and-delegated-acts/markets-crypto-assets-regulation_en">
                {t("acpWhitepaperPage.ecMica")}
              </a>
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("acpWhitepaperPage.noPromiseTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{t("acpWhitepaperPage.noPromiseBody")}</p>
        </section>
      </main>
    </div>
  );
}
