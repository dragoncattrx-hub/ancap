"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SLUG = "aeterna-dna-pheromone-perfume";

type Props = {
  note?: string | null;
};

/** DNA-matched pheromone perfume — sold per bottle via licensed cosmetic partner. */
export function DnaPheromonePerfumePanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="dna-pheromone-perfume"
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-[#d4a574]/30 bg-gradient-to-br from-[#1a120c] via-[#120e0c] to-[#0a0c10] p-6 sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 85% 20%, rgba(212,165,116,0.22), transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(180,120,70,0.12), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.16em] text-[#e8c9a0]">{t("aeternaPage.ppfKicker")}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#f5ebe0]">{t("aeternaPage.ppfTitle")}</h2>
          <div className="text-right">
            <p className="font-mono text-2xl font-semibold text-[#e8c9a0]">{t("aeternaPage.ppfPrice")}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/45">{t("aeternaPage.ppfUnit")}</p>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.ppfLead")}</p>
        {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.ppfDisclaimer")}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
          <ol className="grid gap-3 sm:grid-cols-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="rounded-xl border border-[#d4a574]/20 bg-black/25 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {String(n).padStart(2, "0")}
                </div>
                <div className="mt-2 text-sm font-medium text-[#e8c9a0]">{t(`aeternaPage.ppfStep${n}Title`)}</div>
                <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.ppfStep${n}Body`)}</div>
              </li>
            ))}
          </ol>
          <div
            className="mx-auto flex h-52 w-28 flex-col items-center justify-end rounded-[2rem] border border-[#d4a574]/35 bg-gradient-to-b from-[#2a1f18] via-[#1a1410] to-[#0c0a08] shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
            aria-hidden
          >
            <div className="mb-3 h-8 w-10 rounded-t-md bg-[#d4a574]/80" />
            <div className="mb-6 flex h-28 w-16 items-center justify-center rounded-b-2xl border border-[#e8c9a0]/25 bg-gradient-to-b from-[#c4a882]/25 to-transparent">
              <span className="rotate-[-90deg] font-mono text-[10px] tracking-[0.2em] text-[#e8c9a0]/80">DNA · 1</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/ai/run/${SLUG}`}
            className="inline-flex rounded-md bg-[#d4a574] px-5 py-3 text-sm font-semibold text-[#1a120c] transition hover:bg-[#e8c9a0]"
          >
            {t("aeternaPage.ppfCta")}
          </Link>
          <Link
            href="/dna-bank"
            className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
          >
            {t("aeternaPage.ppfVaultCta")}
          </Link>
          <Link
            href="/legal/dna-pheromone-perfume"
            className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
          >
            {t("aeternaPage.ppfLegalCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
