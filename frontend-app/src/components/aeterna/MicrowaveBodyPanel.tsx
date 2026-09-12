"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const SLUG = "aeterna-microwave-body-contouring";

type Props = {
  note?: string | null;
};

/** Contact-cooled microwave body contouring — conceptual partner architecture. */
export function MicrowaveBodyPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="microwave-body"
      className="scroll-mt-24 rounded-2xl border border-[#7ad0c8]/25 bg-[#7ad0c8]/5 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#9ae0d9]">{t("aeternaPage.mwKicker")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.mwTitle")}</h2>
        <p className="font-mono text-2xl font-semibold text-[#9ae0d9]">{t("aeternaPage.mwPrice")}</p>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.mwLead")}</p>
      {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.mwDisclaimer")}</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="relative aspect-[16/11] w-full bg-[#f4ead8]">
          <Image
            src="/aeterna/microwave-body-contouring.jpg"
            alt={t("aeternaPage.mwAlt")}
            fill
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
            <div className="mt-2 text-sm font-medium text-[#9ae0d9]">{t(`aeternaPage.mwStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.mwStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${SLUG}`}
          className="inline-flex rounded-md bg-[#7ad0c8] px-5 py-3 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
        >
          {t("aeternaPage.mwCta")}
        </Link>
        <Link
          href="/legal/body-contouring"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.mwLegalCta")}
        </Link>
      </div>
    </section>
  );
}
