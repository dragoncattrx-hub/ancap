"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const WORKFLOW_SLUG = "aeterna-mrna-reprogramming-brief";
const INC_RUSSIA =
  "https://incrussia.ru/news/v-ssha-odobrili-zayavku-na-patent-dlya-omolozheniya-kletok/";
const KOREA_HERALD = "https://www.koreaherald.com/article/10854319";

type Props = {
  note?: string | null;
};

/** Public literacy on partial cellular reprogramming via mRNA in LNPs — consult only. */
export function MrnaReprogrammingPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="mrna-reprogramming"
      className="scroll-mt-24 rounded-2xl border border-[#7ad0c8]/20 bg-[#7ad0c8]/[0.04] p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#9ae0d9]">{t("aeternaPage.mrnaKicker")}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.mrnaTitle")}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">{t("aeternaPage.mrnaLead")}</p>
      {note ? <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{t("aeternaPage.mrnaCite")}</p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {([1, 2, 3] as const).map((n) => (
          <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              {String(n).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-[#9ae0d9]">{t(`aeternaPage.mrnaStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.mrnaStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/ai/run/${WORKFLOW_SLUG}`}
          className="rounded-md bg-[#7ad0c8] px-5 py-3 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
        >
          {t("aeternaPage.mrnaCta")}
        </Link>
        <Link
          href="/legal/research-refs"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.mrnaLegalCta")}
        </Link>
        <a
          href={INC_RUSSIA}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-white/15 px-4 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Inc. Russia
        </a>
        <a
          href={KOREA_HERALD}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-white/15 px-4 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Korea Herald
        </a>
      </div>
    </section>
  );
}
