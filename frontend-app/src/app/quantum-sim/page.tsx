"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
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

type Catalog = {
  title: string;
  tagline: string;
  compliance_note: string;
  legal_href: string;
  principles_doc?: string;
  research_ref: { id: string; title: string; url: string; note: string };
  principles?: Principle[];
  services: Service[];
  mesh_layers: MeshLayer[];
};

export default function QuantumSimPage() {
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
      setError(err instanceof Error ? err.message : "Failed to load quantum SIM desk");
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-[#070f18] text-slate-100">
      <Navigation />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/80">Connectivity</p>
        <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">
          {catalog?.title || "Quantum-link digital SIM"}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-300">{catalog?.tagline}</p>
        <p className="mt-4 text-sm leading-6 text-slate-500">{catalog?.compliance_note}</p>
        <p className="mt-3 text-sm">
          <Link href={catalog?.legal_href || "/legal/research-refs"} className="text-emerald-300 underline">
            Research refs / legal
          </Link>
          {" · "}
          <Link href="/galaxy" className="text-emerald-300 underline">
            Galaxy / space desk
          </Link>
        </p>

        {catalog?.research_ref ? (
          <aside className="mt-8 border-t border-white/10 pt-5">
            <h2 className="text-lg text-white">Science cite</h2>
            <a
              href={catalog.research_ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-emerald-200 underline"
            >
              {catalog.research_ref.title}
            </a>
            <p className="mt-2 text-sm text-slate-500">{catalog.research_ref.note}</p>
          </aside>
        ) : null}

        {(catalog?.principles || []).length ? (
          <section className="mt-10">
            <h2 className="text-xl text-white">Principles (P1–P8)</h2>
            <p className="mt-2 text-sm text-slate-500">
              Engineering literacy for multi-path secrecy — not a QKD warranty.
              {catalog?.principles_doc ? ` Repo: ${catalog.principles_doc}` : null}
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

        <h2 className="mt-10 text-xl text-white">Mesh layers</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {(catalog?.mesh_layers || []).map((m) => (
            <li key={m.id} className="border-b border-white/5 py-2">
              <span className="text-emerald-300/90">{m.role}</span> · {m.label}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl text-white">Services</h2>
        <ul className="mt-4 space-y-5">
          {(catalog?.services || []).map((svc) => (
            <li key={svc.id} className="border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg text-white">{svc.label}</h3>
                <span className="text-sm text-emerald-200/80">from {svc.price_from_acp} ACP</span>
              </div>
              <p className="mt-2 text-slate-300">{svc.blurb}</p>
              <button
                type="button"
                className="mt-3 border border-emerald-400/40 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-400/10"
                onClick={() => setSelected(svc)}
              >
                Reviews
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
