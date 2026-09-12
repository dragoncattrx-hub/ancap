"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { startupInvestDesk } from "@/lib/api";
import { ServiceReviewsPanel } from "@/components/ServiceReviewsPanel";

type Ref = { id: string; title: string; url: string; note: string };
type Sector = { id: string; label: string; role: string; thesis: string };
type Principle = { id: string; title: string; body: string };
type Brief = {
  id: string;
  review_target_id: string;
  label: string;
  sector: string;
  price_from_acp: string;
  blurb: string;
};

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  as_of: string;
  legal_href: string;
  principles_doc?: string;
  research_ref: Ref;
  research_refs?: Ref[];
  sectors: Sector[];
  principles: Principle[];
  briefs: Brief[];
};

function formatAcp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ACP`;
  return `${n.toLocaleString()} ACP`;
}

export default function StartupsPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Brief | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await startupInvestDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
      setSelected((prev) => prev ?? data.briefs[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("startupsPage.loadError"));
    }
  }, [t]);

  useEffect(() => {
    document.title = `ANCAP — ${t("startupsPage.heroTitle")}`;
    void load();
  }, [load, t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/80">{t("startupsPage.kicker")}</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{catalog?.title || t("startupsPage.heroTitle")}</h1>
        <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{t("startupsPage.heroLead")}</p>
        {catalog?.tagline ? <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">{catalog.tagline}</p> : null}
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{catalog?.compliance_note}</p>
        {catalog?.as_of ? (
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-emerald-300/70">
            {t("startupsPage.asOf")} {catalog.as_of}
          </p>
        ) : null}
        <p className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={catalog?.legal_href || "/legal/research-refs"} className="text-emerald-300 underline">
            {t("startupsPage.legalCta")}
          </Link>
          <Link href="/organizations" className="text-emerald-300 underline">
            {t("startupsPage.securitiesCta")}
          </Link>
          <Link href="/agency" className="text-emerald-300 underline">
            {t("startupsPage.agencyCta")}
          </Link>
        </p>

        {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}

        {(catalog?.sectors || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl">{t("startupsPage.sectorsTitle")}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {catalog!.sectors.map((s) => (
                <article key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/80">{s.role}</p>
                  <h3 className="mt-2 text-lg text-white">{s.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{s.thesis}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {(catalog?.briefs || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl">{t("startupsPage.briefsTitle")}</h2>
            <ul className="mt-4 space-y-3">
              {catalog!.briefs.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-emerald-400/30"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <strong className="text-white">{b.label}</strong>
                      <span className="text-emerald-300">
                        {t("startupsPage.fromAcp")} {formatAcp(b.price_from_acp)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{b.blurb}</p>
                  </button>
                </li>
              ))}
            </ul>
            {selected ? (
              <div className="mt-6">
                <ServiceReviewsPanel
                  targetType="service"
                  targetId={selected.review_target_id}
                  label={selected.label}
                  reviewerUserId={isAuthenticated ? user?.id : undefined}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {(catalog?.principles || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl">{t("startupsPage.principlesTitle")}</h2>
            <ol className="mt-4 space-y-4">
              {catalog!.principles.map((p) => (
                <li key={p.id} className="border-b border-white/5 pb-4">
                  <h3 className="text-white">
                    {p.id}. {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{p.body}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {catalog?.research_ref ? (
          <aside className="mt-10 border-t border-white/10 pt-6">
            <h2 className="text-xl">{t("startupsPage.sourcesTitle")}</h2>
            {(catalog.research_refs && catalog.research_refs.length > 0
              ? catalog.research_refs
              : [catalog.research_ref]
            ).map((ref) => (
              <div key={ref.id} className="mt-4">
                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-emerald-200 underline">
                  {ref.title}
                </a>
                <p className="mt-2 text-sm text-slate-500">{ref.note}</p>
              </div>
            ))}
          </aside>
        ) : null}
      </main>
    </div>
  );
}
