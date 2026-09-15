"use client";

import Image from "next/image";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { SiteLegalFooter } from "@/components/legal/LegalViews";
import { useLanguage } from "@/components/LanguageProvider";

const STAGES = [1, 2, 3, 4, 5, 6] as const;

export default function AntiqueFireRestorePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0c0a08] text-[#f3efe6]">
      <Navigation />
      <main>
        <section
          className="relative overflow-hidden border-b border-amber-500/20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(180,70,30,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(80,40,20,0.4), transparent 50%), #0c0a08",
          }}
        >
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">{t("antiqueFireRestorePage.kicker")}</p>
            <h1
              className="mt-3 font-serif text-5xl text-white sm:text-6xl"
              style={{ fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)" }}
            >
              {t("antiqueFireRestorePage.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-amber-50/90">
              {t("antiqueFireRestorePage.heroLead")}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{t("antiqueFireRestorePage.heroBody")}</p>
            <div className="mt-8 flex flex-wrap items-end gap-6">
              <div>
                <div className="font-serif text-3xl text-amber-200">{t("antiqueFireRestorePage.price")}</div>
                <p className="mt-1 max-w-xs text-xs text-white/50">{t("antiqueFireRestorePage.priceNote")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/ai/run/antique-fire-restore" className="btn btn-primary">
                  {t("antiqueFireRestorePage.cta")}
                </Link>
                <Link href="/legal/antique-fire-restore" className="btn btn-ghost">
                  {t("antiqueFireRestorePage.legalCta")}
                </Link>
                <Link href="/insurance" className="btn btn-ghost">
                  {t("antiqueFireRestorePage.insuranceCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="chemistry" className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-400/70">{t("antiqueFireRestorePage.chemKicker")}</p>
          <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">{t("antiqueFireRestorePage.chemTitle")}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("antiqueFireRestorePage.chemLead")}</p>
          <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden border border-amber-500/25 bg-black/40">
            <Image
              src="/antique-fire-restore/reverse-combustion.jpg"
              alt={t("antiqueFireRestorePage.chemImgAlt")}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 960px"
              priority
            />
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article className="border-t border-emerald-500/40 pt-4">
              <h3 className="text-lg text-emerald-100">{t("antiqueFireRestorePage.chemCarbonTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{t("antiqueFireRestorePage.chemCarbonBody")}</p>
            </article>
            <article className="border-t border-sky-500/40 pt-4">
              <h3 className="text-lg text-sky-100">{t("antiqueFireRestorePage.chemHydrogenTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{t("antiqueFireRestorePage.chemHydrogenBody")}</p>
            </article>
            <article className="border-t border-orange-500/40 pt-4">
              <h3 className="text-lg text-orange-100">{t("antiqueFireRestorePage.chemMetalTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{t("antiqueFireRestorePage.chemMetalBody")}</p>
            </article>
          </div>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-base text-amber-100">{t("antiqueFireRestorePage.chemNeedsTitle")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>• {t("antiqueFireRestorePage.chemNeed1")}</li>
              <li>• {t("antiqueFireRestorePage.chemNeed2")}</li>
              <li>• {t("antiqueFireRestorePage.chemNeed3")}</li>
            </ul>
          </div>
        </section>

        <section id="stages" className="border-t border-white/10 bg-[#100c0a] px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-300/70">{t("antiqueFireRestorePage.stagesKicker")}</p>
            <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">{t("antiqueFireRestorePage.stagesTitle")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">{t("antiqueFireRestorePage.stagesLead")}</p>
            <p className="mt-3 max-w-3xl rounded border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm leading-6 text-rose-100/90">
              {t("antiqueFireRestorePage.medicalDisclaimer")}
            </p>
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden border border-violet-400/25 bg-black/40">
              <Image
                src="/antique-fire-restore/recovery-stages.jpg"
                alt={t("antiqueFireRestorePage.stagesImgAlt")}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 960px"
              />
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {STAGES.map((n) => (
                <article key={n} className="border-t border-white/15 pt-4">
                  <h3 className="text-base font-medium text-white">
                    {t(`antiqueFireRestorePage.stage${n}Title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    {t(`antiqueFireRestorePage.stage${n}Body`)}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-10 rounded-lg border border-amber-500/20 bg-amber-950/20 p-5">
              <h3 className="text-base text-amber-100">{t("antiqueFireRestorePage.formulaTitle")}</h3>
              <p className="mt-2 text-sm leading-7 text-white/70">{t("antiqueFireRestorePage.formulaBody")}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl text-white">{t("antiqueFireRestorePage.nonClaimsTitle")}</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>• {t("antiqueFireRestorePage.nonClaim1")}</li>
            <li>• {t("antiqueFireRestorePage.nonClaim2")}</li>
            <li>• {t("antiqueFireRestorePage.nonClaim3")}</li>
            <li>• {t("antiqueFireRestorePage.nonClaim4")}</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ai/run/antique-fire-restore" className="btn btn-primary">
              {t("antiqueFireRestorePage.cta")}
            </Link>
            <Link href="/legal/antique-fire-restore" className="btn btn-ghost">
              {t("antiqueFireRestorePage.legalCta")}
            </Link>
          </div>
        </section>
      </main>
      <SiteLegalFooter />
    </div>
  );
}
