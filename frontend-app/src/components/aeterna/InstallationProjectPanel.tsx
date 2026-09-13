"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SLUG = "aeterna-installation-project";

type Props = {
  note?: string | null;
};

/** Installation Project — neonatal nutrition + hyperbaric partner literacy. */
export function InstallationProjectPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="installation-project"
      className="scroll-mt-24 rounded-2xl border border-[#7eb6e8]/25 bg-[#7eb6e8]/5 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#a8d4f5]">{t("aeternaPage.ipKicker")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.ipTitle")}</h2>
        <p className="font-mono text-2xl font-semibold text-[#a8d4f5]">{t("aeternaPage.ipPrice")}</p>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.ipLead")}</p>
      {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.ipDisclaimer")}</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="relative aspect-[16/11] w-full bg-[#0a0e18]">
          <Image
            src="/aeterna/installation-project.jpg"
            alt={t("aeternaPage.ipAlt")}
            fill
            unoptimized
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 72rem"
          />
        </div>
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-4">
        {([1, 2, 3, 4] as const).map((n) => (
          <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              {String(n).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-[#a8d4f5]">{t(`aeternaPage.ipStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.ipStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${SLUG}`}
          className="inline-flex rounded-md bg-[#7eb6e8] px-5 py-3 text-sm font-semibold text-[#0a1a28] transition hover:bg-[#a8d4f5]"
        >
          {t("aeternaPage.ipCta")}
        </Link>
        <Link
          href="/legal/installation-project"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.ipLegalCta")}
        </Link>
        <Link
          href="/insurance"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.ipInsuranceCta")}
        </Link>
      </div>
    </section>
  );
}
