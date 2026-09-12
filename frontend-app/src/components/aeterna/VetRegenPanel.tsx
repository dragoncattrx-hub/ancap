"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const CAT_SLUG = "aeterna-vet-cat-cryo-restore";
const DOG_SLUG = "aeterna-vet-regen-pod";

type Props = {
  note?: string | null;
};

/** Veterinary organ rails — conceptual partner architecture, licensed clinic only. */
export function VetRegenPanel({ note }: Props) {
  const { t } = useLanguage();

  return (
    <section
      id="vet-regen"
      className="scroll-mt-24 rounded-2xl border border-[#7ad0c8]/25 bg-[#7ad0c8]/5 p-6 sm:p-8"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#9ae0d9]">{t("aeternaPage.vetKicker")}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t("aeternaPage.vetTitle")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("aeternaPage.vetLead")}</p>
      {note ? <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{note}</p> : null}
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{t("aeternaPage.vetDisclaimer")}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <article className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <div className="relative aspect-[4/3] w-full bg-[#071016]">
            <Image
              src="/aeterna/vet-cat-cryo.jpg"
              alt={t("aeternaPage.catCryoAlt")}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9ae0d9]">
              {t("aeternaPage.catCryoPrice")}
            </p>
            <h3 className="mt-2 text-lg font-medium tracking-[-0.02em]">{t("aeternaPage.catCryoTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{t("aeternaPage.catCryoLead")}</p>
            <Link
              href={`/ai/run/${CAT_SLUG}`}
              className="mt-5 inline-flex rounded-md bg-[#7ad0c8] px-4 py-2.5 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
            >
              {t("aeternaPage.catCryoCta")}
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <div className="relative aspect-[4/3] w-full bg-[#071016]">
            <Image
              src="/aeterna/vet-regen-pod.jpg"
              alt={t("aeternaPage.dogPodAlt")}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#9ae0d9]">
              {t("aeternaPage.dogPodPrice")}
            </p>
            <h3 className="mt-2 text-lg font-medium tracking-[-0.02em]">{t("aeternaPage.dogPodTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{t("aeternaPage.dogPodLead")}</p>
            <Link
              href={`/ai/run/${DOG_SLUG}`}
              className="mt-5 inline-flex rounded-md bg-[#7ad0c8] px-4 py-2.5 text-sm font-semibold text-[#04201e] transition hover:bg-[#9ae0d9]"
            >
              {t("aeternaPage.dogPodCta")}
            </Link>
          </div>
        </article>
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-5">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <li key={n} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
              {String(n).padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-[#9ae0d9]">{t(`aeternaPage.vetStep${n}Title`)}</div>
            <div className="mt-1 text-xs leading-5 text-white/50">{t(`aeternaPage.vetStep${n}Body`)}</div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/legal/vet-regen"
          className="rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white/85 transition hover:border-white/45"
        >
          {t("aeternaPage.vetLegalCta")}
        </Link>
        <Link
          href="/cryo"
          className="rounded-md border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
        >
          /cryo
        </Link>
      </div>
    </section>
  );
}
