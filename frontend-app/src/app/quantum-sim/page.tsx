"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { quantumSimDesk } from "@/lib/api";
import { ServiceReviewsPanel } from "@/components/ServiceReviewsPanel";

type Service = {
  id: string;
  review_target_id: string;
  label: string;
  price_from_acp: string;
  blurb: string;
};

type MeshLayer = { id: string; label: string; role: string };
type Principle = { id: string; title: string; body: string };
type ResearchRef = { id: string; title: string; url: string; note: string };
type ComputeLayer = { id: string; label: string; role: string };

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  legal_href: string;
  principles_doc?: string;
  compute_stack_doc?: string;
  research_ref: ResearchRef;
  research_refs?: ResearchRef[];
  principles?: Principle[];
  services: Service[];
  mesh_layers: MeshLayer[];
  compute_stack?: ComputeLayer[];
};

export default function QuantumSimPage() {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);

  const load = useCallback(async () => {
    try {
      const data = (await quantumSimDesk.catalog()) as Catalog;
      setCatalog(data);
      setError("");
      if (!selected && data.services[0]) setSelected(data.services[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("quantumSimPage.loadError"));
    }
  }, [selected, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#070f18] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/80">{t("quantumSimPage.kicker")}</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
          {catalog?.title || t("quantumSimPage.titleFallback")}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">{catalog?.tagline}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm">
          <Link href={catalog?.legal_href || "/legal/research-refs"} className="text-emerald-300 underline">
            {t("quantumSimPage.researchLegal")}
          </Link>
          {" · "}
          <Link href="/galaxy" className="text-emerald-300 underline">
            {t("quantumSimPage.galaxyDesk")}
          </Link>
        </p>

        {catalog?.research_ref ? (
          <aside className="mt-8 border-t border-white/10 pt-5">
            <h2 className="text-lg text-white">{t("quantumSimPage.scienceCites")}</h2>
            {(catalog.research_refs && catalog.research_refs.length > 0
              ? catalog.research_refs
              : [catalog.research_ref]
            ).map((ref) => (
              <div key={ref.id} className="mt-4">
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-emerald-200 underline"
                >
                  {ref.title}
                </a>
                <p className="mt-2 text-sm text-slate-500">{ref.note}</p>
              </div>
            ))}
          </aside>
        ) : null}

        {(catalog?.compute_stack || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl text-white">{t("quantumSimPage.computeStackTitle")}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("quantumSimPage.computeStackLead")}
              {catalog?.compute_stack_doc
                ? ` ${t("quantumSimPage.repoPrefix")} ${catalog.compute_stack_doc}`
                : null}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {catalog!.compute_stack!.map((m) => (
                <li key={m.id} className="border-b border-white/5 py-2">
                  <span className="text-emerald-300/90">{m.role}</span> · {m.label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(catalog?.principles || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl text-white">{t("quantumSimPage.principlesTitle")}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("quantumSimPage.principlesLead")}
              {catalog?.principles_doc ? ` ${t("quantumSimPage.repoPrefix")} ${catalog.principles_doc}` : null}
            </p>
            <ul className="mt-4 space-y-4">
              {catalog!.principles!.map((p) => (
                <li key={p.id} className="border-t border-white/10 pt-3">
                  <h3 className="text-base text-emerald-200/90">
                    {p.id} — {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{p.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <h2 className="mt-10 text-xl text-white">{t("quantumSimPage.meshLayers")}</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {(catalog?.mesh_layers || []).map((m) => (
            <li key={m.id} className="border-b border-white/5 py-2">
              <span className="text-emerald-300/90">{m.role}</span> · {m.label}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl text-white">{t("deskCommon.services")}</h2>
        <ul className="mt-4 space-y-5">
          {(catalog?.services || []).map((svc) => (
            <li key={svc.id} className="border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg text-white">{svc.label}</h3>
                <span className="text-sm text-emerald-200/80">
                  {t("deskCommon.fromAcp").replace("{price}", svc.price_from_acp)}
                </span>
              </div>
              <p className="mt-2 text-slate-300">{svc.blurb}</p>
              <button
                type="button"
                className="mt-3 border border-emerald-400/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-400/10"
                onClick={() => setSelected(svc)}
              >
                {t("deskCommon.reviews")}
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="mt-12">
            <ServiceReviewsPanel
              targetType="service"
              targetId={selected.review_target_id}
              label={selected.label}
              reviewerUserId={isAuthenticated ? user?.id : undefined}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
