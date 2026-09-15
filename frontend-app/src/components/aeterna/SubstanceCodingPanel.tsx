"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SLUG = "aeterna-substance-coding";

type Props = {
  note?: string | null;
};

/** Substance coding — licensed addiction-medicine / narcology / clinical-hypnosis partner brief. */
export function SubstanceCodingPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="substance-coding"
      className="scroll-mt-24 rounded-2xl border border-[#c4a878]/25 bg-[#c4a878]/5 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#e8d4b0]">{t("aeternaPage.codingKicker")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.codingTitle")}</h2>
        <p className="font-mono text-2xl font-semibold text-[#e8d4b0]">{t("aeternaPage.codingPrice")}</p>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.codingLead")}</p>
      {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.codingDisclaimer")}</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="relative aspect-[16/11] w-full bg-[#f5f0e8]">
          <Image
            src="/aeterna/substance-coding.jpg"
            alt={t("aeternaPage.codingAlt")}
            fill
            unoptimized
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 72rem"
          />
        </div>
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => (
          <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              {String(n).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-[#e8d4b0]">{t(`aeternaPage.codingStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.codingStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${SLUG}`}
          className="inline-flex rounded-md bg-[#c4a878] px-5 py-3 text-sm font-semibold text-[#1a140c] transition hover:bg-[#e8d4b0]"
        >
          {t("aeternaPage.codingCta")}
        </Link>
        <Link
          href="/legal/substance-coding"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.codingLegalCta")}
        </Link>
      </div>
    </section>
  );
}
