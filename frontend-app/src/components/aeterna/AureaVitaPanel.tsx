"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SLUG = "aeterna-aurea-vita";

type Props = {
  note?: string | null;
};

/** AUREA Vita — rapid quality-of-life, longevity, nutrition & sport literacy. */
export function AureaVitaPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="aurea-vita"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#d4a24a]/30 bg-gradient-to-br from-[#1a1208] via-[#0c1018] to-[#081018] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#e8c078]">{t("aeternaPage.aureaKicker")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[#f6e7c8] sm:text-4xl">
          {t("aeternaPage.aureaTitle")}
        </h2>
        <p className="font-mono text-2xl font-semibold text-[#e8c078]">{t("aeternaPage.aureaPrice")}</p>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.aureaLead")}</p>
      {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.aureaDisclaimer")}</p>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
        <div
          className="absolute inset-0 -z-0 rounded-xl opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(232,192,120,0.25), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(120,180,220,0.18), transparent 50%)",
          }}
          aria-hidden
        />
        {(
          [
            ["aureaPillar1Title", "aureaPillar1Body"],
            ["aureaPillar2Title", "aureaPillar2Body"],
            ["aureaPillar3Title", "aureaPillar3Body"],
          ] as const
        ).map(([titleKey, bodyKey]) => (
          <div
            key={titleKey}
            className="relative rounded-xl border border-[#d4a24a]/20 bg-black/30 px-5 py-4 backdrop-blur-sm"
          >
            <div className="text-sm font-semibold text-[#e8c078]">{t(`aeternaPage.${titleKey}`)}</div>
            <div className="mt-2 text-xs leading-5 text-white/55">{t(`aeternaPage.${bodyKey}`)}</div>
          </div>
        ))}
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              {String(n).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-[#e8c078]">{t(`aeternaPage.aureaStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.aureaStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${SLUG}`}
          className="inline-flex rounded-md bg-[#e8c078] px-5 py-3 text-sm font-semibold text-[#1a1208] transition hover:bg-[#f0d49a]"
        >
          {t("aeternaPage.aureaCta")}
        </Link>
        <Link
          href="/legal/aurea-vita"
          className="rounded-md border border-[#d4a24a]/35 px-5 py-3 text-sm font-medium text-[#f6e7c8] transition hover:border-[#e8c078]/70"
        >
          {t("aeternaPage.aureaLegalCta")}
        </Link>
      </div>
    </section>
  );
}
